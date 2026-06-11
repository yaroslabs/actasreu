const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY

const GEMINI_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent'

export const hasApiKey = () => !!GEMINI_API_KEY

export async function generateMinutes(meetingData, quickNotes) {
  if (!GEMINI_API_KEY) throw new Error('No hay API Key de Gemini configurada.')

  const prompt = `Eres un experto en redacción de actas de reuniones de supervisión semanal en español.
Tu tarea es transformar notas desordenadas tomadas durante una reunión de supervisión en un acta estructurada y profesional.

Estas reuniones de supervisión tienen como objetivo:
- Revisar el avance de las actividades, metas y compromisos previos.
- Detectar necesidades de apoyo, recursos o capacitación del equipo.
- Reforzar lineamientos, políticas y estándares de trabajo.

Información de la reunión:
- Proyecto: ${meetingData.projectName || 'No especificado'}
- Tipo de reunión: ${meetingData.typeLabel || meetingData.type || 'No especificado'}
- Fecha: ${meetingData.date || 'No especificada'}
- Hora: ${meetingData.startTime || ''} - ${meetingData.endTime || ''}
- Participantes: ${meetingData.participants || 'No especificados'}
- Responsable del acta: ${meetingData.minutesResponsible || 'No especificado'}

Notas tomadas durante la reunión:
---
${quickNotes}
---

Genera el acta completa en formato JSON con exactamente esta estructura:
{
  "executiveSummary": "Resumen ejecutivo en 2-3 párrafos sobre el estado general del avance y la supervisión realizada.",
  "topicsDiscussed": "Lista numerada (1. 2. 3.) de los temas conversados: avances revisados, dificultades encontradas y necesidades de apoyo detectadas.",
  "agreements": "Lista numerada de los acuerdos tomados, incluyendo lineamientos o estándares reforzados durante la reunión.",
  "commitments": "Lista de compromisos específicos con responsable y fecha si se mencionaron. Formato: '- [Responsable]: [Compromiso] (Fecha: [fecha si aplica])'",
  "nextSteps": "Lista numerada de los próximos pasos a seguir antes de la siguiente reunión de supervisión.",
  "observations": "Necesidades de apoyo, recursos o capacitación detectadas, y observaciones adicionales relevantes."
}

Usa lenguaje formal, claro y profesional. Responde únicamente con el JSON, sin texto adicional ni bloques de código.
Si las notas no mencionan algo para una sección, escribe 'Sin información para esta sección.'`

  let response
  try {
    response = await fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.3,
        },
      }),
    })
  } catch {
    throw new Error('No se pudo conectar con la API de Gemini.')
  }

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(err.error?.message || `Error Gemini: ${response.status}`)
  }

  const data = await response.json()
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text

  if (!text) {
    throw new Error('Gemini no devolvió contenido válido.')
  }

  try {
    return JSON.parse(text)
  } catch {
    throw new Error('La respuesta de Gemini no tiene un formato JSON válido.')
  }
}
