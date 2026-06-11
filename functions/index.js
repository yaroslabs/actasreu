/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

const {setGlobalOptions} = require("firebase-functions");
const {onRequest} = require("firebase-functions/https");
const logger = require("firebase-functions/logger");
const cors = require("cors")({origin: true});

// For cost control, you can set the maximum number of containers that can be
// running at the same time. This helps mitigate the impact of unexpected
// traffic spikes by instead downgrading performance. This limit is a
// per-function limit. You can override the limit for each function using the
// `maxInstances` option in the function's options, e.g.
// `onRequest({ maxInstances: 5 }, (req, res) => { ... })`.
// NOTE: setGlobalOptions does not apply to functions using the v1 API. V1
// functions should each use functions.runWith({ maxInstances: 10 }) instead.
// In the v1 API, each function can only serve one request per container, so
// this will be the maximum concurrent request count.
setGlobalOptions({maxInstances: 10});

const GEMINI_MODEL = "gemini-2.0-flash";
const GEMINI_URL =
  `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

const MEETING_TYPE_LABELS = {
  followup: "Seguimiento",
  kickoff: "Kickoff",
  advisory: "Asesoría",
  committee: "Comité",
  internal: "Reunión interna",
  other: "Otro",
};

/**
 * Builds the prompt sent to Gemini to generate professional meeting minutes
 * from raw quick notes.
 * @param {object} meeting Meeting metadata and quick notes.
 * @return {string} The prompt text to send to Gemini.
 */
function buildPrompt(meeting) {
  const typeLabel = MEETING_TYPE_LABELS[meeting.meetingType] ||
    meeting.meetingType || "No especificado";

  return [
    "Eres un experto en redacción de actas de reunión profesionales en " +
      "español.",
    "Tu tarea es transformar notas desordenadas de una reunión en un acta " +
      "estructurada y profesional.",
    "",
    "Información de la reunión:",
    `- Proyecto: ${meeting.projectName || "No especificado"}`,
    `- Tipo de reunión: ${typeLabel}`,
    `- Fecha: ${meeting.date || "No especificada"}`,
    `- Hora: ${meeting.startTime || ""} - ${meeting.endTime || ""}`,
    `- Participantes: ${meeting.participants || "No especificados"}`,
    `- Responsable del acta: ` +
      `${meeting.minutesResponsible || "No especificado"}`,
    "",
    "Notas tomadas durante la reunión:",
    "---",
    meeting.quickNotes,
    "---",
    "",
    "Genera el acta completa en formato JSON con exactamente esta " +
      "estructura:",
    "{",
    "  \"executiveSummary\": \"Resumen ejecutivo claro y conciso en 2-3 " +
      "párrafos que sintetice los puntos clave de la reunión.\",",
    "  \"topicsDiscussed\": \"Lista detallada de todos los temas " +
      "conversados. Usa numeración (1. 2. 3.) para cada tema.\",",
    "  \"agreements\": \"Lista numerada de todos los acuerdos tomados en " +
      "la reunión.\",",
    "  \"commitments\": \"Lista de compromisos específicos con el " +
      "responsable y fecha si se mencionaron.\",",
    "  \"nextSteps\": \"Lista numerada de los próximos pasos a seguir " +
      "después de esta reunión.\",",
    "  \"observations\": \"Observaciones adicionales, puntos pendientes o " +
      "notas importantes que no encajen en las secciones anteriores.\"",
    "}",
    "",
    "Usa lenguaje formal, claro y profesional. Responde únicamente con el " +
      "JSON, sin texto adicional ni bloques de código.",
    "Si las notas no mencionan algo para una sección, escribe " +
      "\"Sin información para esta sección.\"",
  ].join("\n");
}

/**
 * Extracts the generated text from a Gemini generateContent response.
 * @param {object} data Parsed JSON response from the Gemini API.
 * @return {string|null} The generated text, or null if not present.
 */
function extractGeminiText(data) {
  const candidates = data && data.candidates;
  const firstCandidate = candidates && candidates[0];
  const content = firstCandidate && firstCandidate.content;
  const parts = content && content.parts;
  const firstPart = parts && parts[0];
  return (firstPart && firstPart.text) || null;
}

exports.generateMeeting = onRequest(async (req, res) => {
  cors(req, res, async () => {
    if (req.method !== "POST") {
      res.status(405).json({error: "Método no permitido. Usa POST."});
      return;
    }

    const body = req.body || {};
    const {
      projectName,
      meetingType,
      date,
      startTime,
      endTime,
      participants,
      minutesResponsible,
      quickNotes,
    } = body;

    if (!quickNotes || !String(quickNotes).trim()) {
      res.status(400).json({
        error: "El campo 'quickNotes' es obligatorio.",
      });
      return;
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      logger.error("GEMINI_API_KEY no está configurada en el entorno.");
      res.status(500).json({
        error: "La API Key de Gemini no está configurada en el servidor.",
      });
      return;
    }

    const prompt = buildPrompt({
      projectName,
      meetingType,
      date,
      startTime,
      endTime,
      participants,
      minutesResponsible,
      quickNotes,
    });

    try {
      const geminiResponse = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({
          contents: [{parts: [{text: prompt}]}],
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.3,
          },
        }),
      });

      if (!geminiResponse.ok) {
        const errorBody = await geminiResponse.text();
        logger.error("Error de la API de Gemini", {
          status: geminiResponse.status,
          body: errorBody,
        });
        res.status(502).json({
          error: "Error al generar el acta con Gemini.",
          details: errorBody,
        });
        return;
      }

      const data = await geminiResponse.json();
      const text = extractGeminiText(data);

      if (!text) {
        logger.error("Respuesta de Gemini sin contenido", {data});
        res.status(502).json({
          error: "Gemini no devolvió contenido válido.",
        });
        return;
      }

      let minutes;
      try {
        minutes = JSON.parse(text);
      } catch (parseError) {
        logger.error("No se pudo parsear la respuesta de Gemini", {
          text,
          message: parseError.message,
        });
        res.status(502).json({
          error: "La respuesta de Gemini no tiene un formato JSON válido.",
        });
        return;
      }

      res.status(200).json(minutes);
    } catch (error) {
      logger.error("Error inesperado al generar el acta", error);
      res.status(500).json({error: "Error interno del servidor."});
    }
  });
});
