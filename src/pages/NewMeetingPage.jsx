import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  Sparkles, Plus, Trash2, AlertCircle,
  CheckCircle2, FileText, Wand2,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import { getProjects } from '../services/projectService'
import { createMeeting } from '../services/meetingService'
import { getAgreementsByProject, updateAgreement, createAgreement } from '../services/agreementService'
import { generateMinutes, hasApiKey } from '../services/geminiService'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import Input from '../components/ui/Input'
import Textarea from '../components/ui/Textarea'
import Select from '../components/ui/Select'
import Loading from '../components/ui/Loading'
import { MEETING_TYPES, MINUTES_SECTIONS } from '../utils/constants'
import { formatDate, getMeetingTypeLabel, getAgreementStatusLabel, todayISO } from '../utils/formatters'

const BLANK_MINUTES = {
  executiveSummary: '', topicsDiscussed: '', agreements: '',
  commitments: '', nextSteps: '', observations: '',
}

const BLANK_AG = { description: '', responsible: '', dueDate: '' }

export default function NewMeetingPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const preselectedProject = searchParams.get('projectId') || ''

  const [projects, setProjects] = useState([])
  const [prevAgreements, setPrevAgreements] = useState([])
  const [loadingProjects, setLoadingProjects] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [showMinutes, setShowMinutes] = useState(false)

  const [form, setForm] = useState({
    projectId: preselectedProject,
    type: 'Asesoría',
    date: todayISO(),
    startTime: '',
    endTime: '',
    participants: '',
    minutesResponsible: '',
  })
  const [quickNotes, setQuickNotes] = useState('')
  const [minutes, setMinutes] = useState({ ...BLANK_MINUTES })
  const [newAgreements, setNewAgreements] = useState([])
  const [agForm, setAgForm] = useState({ ...BLANK_AG })
  const [showAgForm, setShowAgForm] = useState(false)

  useEffect(() => {
    getProjects(user.uid)
      .then(setProjects)
      .finally(() => setLoadingProjects(false))
  }, [user.uid])

  useEffect(() => {
    if (form.projectId) {
      getAgreementsByProject(form.projectId).then((ags) => {
        setPrevAgreements(ags.filter((a) => a.status !== 'closed'))
      })
    } else {
      setPrevAgreements([])
    }
  }, [form.projectId])

  const setF = (field) => (e) => setForm((p) => ({ ...p, [field]: e.target.value }))
  const setM = (key) => (e) => setMinutes((p) => ({ ...p, [key]: e.target.value }))
  const setAg = (f) => (e) => setAgForm((p) => ({ ...p, [f]: e.target.value }))

  const selectedProject = projects.find((p) => p.id === form.projectId)

  const handleGenerate = async () => {
    if (generating) return
    if (!quickNotes.trim()) return toast.error('Escribe algunas notas primero')
    if (!form.projectId) return toast.error('Selecciona un proyecto')
    setGenerating(true)
    try {
      const result = await generateMinutes(
        {
          projectName: selectedProject?.name || '',
          typeLabel: getMeetingTypeLabel(form.type),
          type: form.type,
          date: form.date,
          startTime: form.startTime,
          endTime: form.endTime,
          participants: form.participants,
          minutesResponsible: form.minutesResponsible,
        },
        quickNotes
      )
      setMinutes(result)
      setShowMinutes(true)
      toast.success('¡Acta generada correctamente!')
    } catch (err) {
      toast.error(err.message || 'Error al generar el acta')
    } finally {
      setGenerating(false)
    }
  }

  const handleManualMinutes = () => {
    setMinutes({ ...BLANK_MINUTES })
    setShowMinutes(true)
  }

  const addAgreement = () => {
    if (!agForm.description.trim()) return toast.error('La descripción es obligatoria')
    setNewAgreements((p) => [...p, { ...agForm, id: Date.now().toString() }])
    setAgForm({ ...BLANK_AG })
    setShowAgForm(false)
  }

  const removeAgreement = (id) =>
    setNewAgreements((p) => p.filter((a) => a.id !== id))

  const updatePrevAg = async (agId, status) => {
    try {
      await updateAgreement(agId, { status })
      setPrevAgreements((prev) => prev.map((a) => a.id === agId ? { ...a, status } : a))
      toast.success('Acuerdo actualizado')
    } catch {
      toast.error('Error al actualizar')
    }
  }

  const handleSave = async () => {
    if (!form.projectId) return toast.error('Selecciona un proyecto')
    if (!form.date) return toast.error('Ingresa la fecha')
    setSaving(true)
    try {
      const meetingPayload = {
        ...form,
        projectName: selectedProject?.name || '',
        quickNotes,
        minutes: showMinutes ? minutes : null,
        status: showMinutes ? 'completed' : 'draft',
      }
      const docRef = await createMeeting(user.uid, meetingPayload)

      await Promise.all(
        newAgreements.map((ag) =>
          createAgreement(user.uid, {
            description: ag.description,
            responsible: ag.responsible,
            dueDate: ag.dueDate,
            status: 'pending',
            projectId: form.projectId,
            projectName: selectedProject?.name || '',
            meetingId: docRef.id,
            meetingDate: form.date,
          })
        )
      )

      toast.success('Reunión guardada correctamente')
      navigate(`/meetings/${docRef.id}`)
    } catch (err) {
      toast.error('Error al guardar: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loadingProjects) return <Loading />

  return (
    <div className="max-w-4xl space-y-6">
      {/* Meeting info */}
      <Card>
        <h2 className="text-sm font-semibold text-slate-900 mb-4 pb-3 border-b border-slate-100">
          Datos de la Reunión
        </h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            {projects.length === 0 ? (
              <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700">
                <AlertCircle size={15} />
                No tienes proyectos creados.{' '}
                <a href="/projects" className="underline font-medium">Crear un proyecto primero.</a>
              </div>
            ) : (
              <Select
                label="Proyecto"
                value={form.projectId}
                onChange={setF('projectId')}
                required
                placeholder="— Selecciona un proyecto —"
                options={projects.map((p) => ({ value: p.id, label: p.name + (p.client ? ` · ${p.client}` : '') }))}
              />
            )}
          </div>

          <Select
            label="Tipo de reunión"
            value={form.type}
            onChange={setF('type')}
            options={MEETING_TYPES}
          />

          <Input
            label="Fecha"
            type="date"
            value={form.date}
            onChange={setF('date')}
            required
          />

          <Input label="Hora inicio" type="time" value={form.startTime} onChange={setF('startTime')} />
          <Input label="Hora término" type="time" value={form.endTime} onChange={setF('endTime')} />

          <div className="sm:col-span-2">
            <Input
              label="Participantes"
              value={form.participants}
              onChange={setF('participants')}
              placeholder="Ej: Juan Pérez, María García, Carlos López"
              hint="Separa los nombres con comas"
            />
          </div>

          <div className="sm:col-span-2">
            <Input
              label="Responsable del acta"
              value={form.minutesResponsible}
              onChange={setF('minutesResponsible')}
              placeholder="Nombre del redactor del acta"
            />
          </div>
        </div>
      </Card>

      {/* Previous pending agreements */}
      {prevAgreements.length > 0 && (
        <Card>
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
            <AlertCircle size={15} className="text-amber-500" />
            <h2 className="text-sm font-semibold text-slate-900">
              Acuerdos Pendientes de Reuniones Anteriores
            </h2>
            <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
              {prevAgreements.length}
            </span>
          </div>
          <div className="space-y-2">
            {prevAgreements.map((ag) => (
              <div key={ag.id} className="flex items-start justify-between gap-3 p-3 bg-slate-50 rounded-lg">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-700 mb-1">{ag.description}</p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant={ag.status}>{getAgreementStatusLabel(ag.status)}</Badge>
                    {ag.responsible && <p className="text-xs text-slate-400">{ag.responsible}</p>}
                    {ag.dueDate && <p className="text-xs text-slate-400">· {formatDate(ag.dueDate)}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {ag.status === 'pending' && (
                    <button
                      onClick={() => updatePrevAg(ag.id, 'in_progress')}
                      className="text-xs px-2 py-1 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition-colors"
                    >
                      En proceso
                    </button>
                  )}
                  <button
                    onClick={() => updatePrevAg(ag.id, 'closed')}
                    className="text-xs px-2 py-1 bg-emerald-50 text-emerald-600 rounded hover:bg-emerald-100 transition-colors flex items-center gap-1"
                  >
                    <CheckCircle2 size={10} /> Cerrar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Quick Notes */}
      <Card>
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Notas tomadas durante la reunión</h2>
            <p className="text-xs text-slate-400 mt-0.5">Escribe libremente — la IA convertirá estas notas en un acta profesional</p>
          </div>
        </div>

        <Textarea
          value={quickNotes}
          onChange={(e) => setQuickNotes(e.target.value)}
          rows={8}
          placeholder={`Escribe tus apuntes de la reunión aquí...

Ejemplos:
- Cliente solicita revisar los indicadores de desempeño
- Se acuerda enviar el informe antes del viernes
- Juan revisará la base de datos y reportará resultados
- Próxima reunión en dos semanas`}
        />

        <div className="flex items-center gap-3 mt-4 pt-4 border-t border-slate-100">
          {hasApiKey() ? (
            <Button
              icon={Sparkles}
              onClick={handleGenerate}
              loading={generating}
              className="shadow-sm"
            >
              {generating ? 'Generando acta con IA...' : 'Generar Acta con IA'}
            </Button>
          ) : (
            <div className="flex items-center gap-3">
              <Button variant="secondary" icon={FileText} onClick={handleManualMinutes}>
                Crear Acta Manual
              </Button>
              <p className="text-xs text-slate-400">
                Generación automática con IA no disponible
              </p>
            </div>
          )}
          {hasApiKey() && !showMinutes && (
            <Button variant="ghost" size="sm" icon={Wand2} onClick={handleManualMinutes}>
              Acta manual
            </Button>
          )}
        </div>
      </Card>

      {/* Minutes editor */}
      {showMinutes && (
        <Card>
          <div className="flex items-center gap-2 mb-5 pb-3 border-b border-slate-100">
            <FileText size={15} className="text-indigo-600" />
            <h2 className="text-sm font-semibold text-slate-900">Acta de Reunión</h2>
            <span className="text-xs text-slate-400">(puedes editar cada sección)</span>
          </div>

          <div className="space-y-5">
            {MINUTES_SECTIONS.map(({ key, label }) => (
              <div key={key}>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                  {label}
                </label>
                <Textarea
                  value={minutes[key] || ''}
                  onChange={setM(key)}
                  rows={key === 'executiveSummary' ? 4 : 3}
                  placeholder={`Ingresa el contenido de ${label.toLowerCase()}...`}
                />
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* New agreements */}
      <Card>
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
          <h2 className="text-sm font-semibold text-slate-900">Acuerdos y Compromisos</h2>
          <Button
            size="sm"
            variant="secondary"
            icon={Plus}
            onClick={() => setShowAgForm(true)}
          >
            Agregar acuerdo
          </Button>
        </div>

        {showAgForm && (
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mb-4 space-y-3">
            <Textarea
              label="Descripción del acuerdo"
              value={agForm.description}
              onChange={setAg('description')}
              rows={2}
              placeholder="Describe el acuerdo o compromiso..."
              required
            />
            <div className="grid sm:grid-cols-2 gap-3">
              <Input
                label="Responsable"
                value={agForm.responsible}
                onChange={setAg('responsible')}
                placeholder="Nombre del responsable"
              />
              <Input
                label="Fecha límite"
                type="date"
                value={agForm.dueDate}
                onChange={setAg('dueDate')}
              />
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={addAgreement}>Agregar</Button>
              <Button size="sm" variant="ghost" onClick={() => setShowAgForm(false)}>Cancelar</Button>
            </div>
          </div>
        )}

        {newAgreements.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-4">
            No hay acuerdos agregados. Los acuerdos registrados aquí se guardarán y podrán darse seguimiento desde el proyecto.
          </p>
        ) : (
          <div className="space-y-2">
            {newAgreements.map((ag) => (
              <div key={ag.id} className="flex items-start justify-between gap-3 p-3 bg-slate-50 rounded-lg">
                <div className="flex-1">
                  <p className="text-sm text-slate-700">{ag.description}</p>
                  {(ag.responsible || ag.dueDate) && (
                    <p className="text-xs text-slate-400 mt-0.5">
                      {ag.responsible}
                      {ag.responsible && ag.dueDate && ' · '}
                      {ag.dueDate && formatDate(ag.dueDate)}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => removeAgreement(ag.id)}
                  className="text-slate-400 hover:text-red-500 transition-colors p-1"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Save button */}
      <div className="flex items-center justify-between pt-2">
        <Button variant="ghost" onClick={() => navigate(-1)}>Cancelar</Button>
        <Button size="lg" onClick={handleSave} loading={saving} icon={CheckCircle2}>
          Guardar Reunión
        </Button>
      </div>
    </div>
  )
}
