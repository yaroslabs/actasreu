import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  Download, Sparkles, Plus, Trash2,
  Pencil, CheckCircle2, AlertCircle, Save, FileText,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { getMeeting, updateMeeting, deleteMeeting } from '../services/meetingService'
import { getAgreementsByMeeting, getAgreementsByProject, createAgreement, updateAgreement, deleteAgreement } from '../services/agreementService'
import { generateMinutes, hasApiKey } from '../services/geminiService'
import { exportMeetingPDF } from '../services/pdfService'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import Modal from '../components/ui/Modal'
import Input from '../components/ui/Input'
import Textarea from '../components/ui/Textarea'
import Loading from '../components/ui/Loading'
import { MINUTES_SECTIONS } from '../utils/constants'
import { formatDate, getMeetingTypeLabel, getAgreementStatusLabel } from '../utils/formatters'
import { useAuth } from '../context/AuthContext'

const BLANK_AG = { description: '', responsible: '', dueDate: '' }

export default function MeetingDetailPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [meeting, setMeeting] = useState(null)
  const [agreements, setAgreements] = useState([])
  const [prevAgs, setPrevAgs] = useState([])
  const [editMode, setEditMode] = useState(false)
  const [minutes, setMinutes] = useState(null)
  const [generating, setGenerating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [exportLoading, setExportLoading] = useState(false)
  const [agModal, setAgModal] = useState(false)
  const [agForm, setAgForm] = useState({ ...BLANK_AG })
  const [agSaving, setAgSaving] = useState(false)

  const loadAll = async () => {
    try {
      const m = await getMeeting(id)
      if (!m) { navigate('/history'); return }
      setMeeting(m)
      setMinutes(m.minutes || null)
      const [ags, allProjAgs] = await Promise.all([
        getAgreementsByMeeting(id),
        m.projectId ? getAgreementsByProject(m.projectId) : Promise.resolve([]),
      ])
      setAgreements(ags)
      setPrevAgs(allProjAgs.filter((a) => a.meetingId !== id && a.status !== 'closed'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadAll() }, [id])

  const setM = (key) => (e) => setMinutes((p) => ({ ...(p || {}), [key]: e.target.value }))
  const setAg = (f) => (e) => setAgForm((p) => ({ ...p, [f]: e.target.value }))

  const handleSaveMinutes = async () => {
    setSaving(true)
    try {
      await updateMeeting(id, { minutes, status: 'completed' })
      setMeeting((m) => ({ ...m, minutes, status: 'completed' }))
      setEditMode(false)
      toast.success('Acta guardada')
    } catch {
      toast.error('Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  const handleRegenerate = async () => {
    if (generating) return
    if (!meeting.quickNotes?.trim()) return toast.error('No hay notas rápidas para generar el acta')
    setGenerating(true)
    try {
      const result = await generateMinutes(
        {
          projectName: meeting.projectName,
          typeLabel: getMeetingTypeLabel(meeting.type),
          type: meeting.type,
          date: meeting.date,
          startTime: meeting.startTime,
          endTime: meeting.endTime,
          participants: meeting.participants,
          minutesResponsible: meeting.minutesResponsible,
        },
        meeting.quickNotes
      )
      setMinutes(result)
      setEditMode(true)
      toast.success('Acta regenerada')
    } catch (err) {
      toast.error(err.message || 'Error al generar')
    } finally {
      setGenerating(false)
    }
  }

  const handleExport = async () => {
    setExportLoading(true)
    try {
      exportMeetingPDF(meeting, agreements)
    } catch {
      toast.error('Error al exportar PDF')
    } finally {
      setExportLoading(false)
    }
  }

  const handleAddAgreement = async (e) => {
    e.preventDefault()
    if (!agForm.description.trim()) return toast.error('La descripción es obligatoria')
    setAgSaving(true)
    try {
      const docRef = await createAgreement(user.uid, {
        description: agForm.description,
        responsible: agForm.responsible,
        dueDate: agForm.dueDate,
        status: 'pending',
        projectId: meeting.projectId || '',
        projectName: meeting.projectName || '',
        meetingId: id,
        meetingDate: meeting.date || '',
      })
      setAgreements((prev) => [...prev, { id: docRef.id, ...agForm, status: 'pending' }])
      setAgForm({ ...BLANK_AG })
      setAgModal(false)
      toast.success('Acuerdo agregado')
    } catch {
      toast.error('Error al guardar acuerdo')
    } finally {
      setAgSaving(false)
    }
  }

  const updateAgStatus = async (agId, status) => {
    try {
      await updateAgreement(agId, { status })
      setAgreements((prev) => prev.map((a) => a.id === agId ? { ...a, status } : a))
      toast.success('Estado actualizado')
    } catch {
      toast.error('Error al actualizar')
    }
  }

  const handleDeleteAg = async (agId) => {
    if (!window.confirm('¿Eliminar este acuerdo?')) return
    try {
      await deleteAgreement(agId)
      setAgreements((prev) => prev.filter((a) => a.id !== agId))
      toast.success('Acuerdo eliminado')
    } catch {
      toast.error('Error al eliminar')
    }
  }

  const updatePrevAg = async (agId, status) => {
    try {
      await updateAgreement(agId, { status })
      setPrevAgs((prev) => prev.map((a) => a.id === agId ? { ...a, status } : a).filter((a) => a.status !== 'closed'))
      toast.success('Acuerdo actualizado')
    } catch {
      toast.error('Error al actualizar')
    }
  }

  const handleDelete = async () => {
    if (!window.confirm('¿Eliminar esta reunión? Esta acción no se puede deshacer.')) return
    try {
      await deleteMeeting(id)
      toast.success('Reunión eliminada')
      navigate('/history')
    } catch {
      toast.error('Error al eliminar')
    }
  }

  if (loading) return <Loading />
  if (!meeting) return null

  return (
    <div className="max-w-4xl space-y-6">
      {/* Header card */}
      <Card padding={false}>
        <div className="p-5">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <Link to={`/projects/${meeting.projectId}`} className="text-indigo-600 font-medium text-sm hover:underline">
                  {meeting.projectName}
                </Link>
                <span className="text-slate-300">·</span>
                <Badge variant={meeting.status}>{meeting.status === 'completed' ? 'Completada' : 'Borrador'}</Badge>
              </div>
              <h1 className="text-lg font-bold text-slate-900 mb-1">
                {getMeetingTypeLabel(meeting.type)}
              </h1>
              <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
                <span>{formatDate(meeting.date)}</span>
                {meeting.startTime && <span>· {meeting.startTime}{meeting.endTime && ` - ${meeting.endTime}`}</span>}
                {meeting.participants && <span>· {meeting.participants}</span>}
              </div>
              {meeting.minutesResponsible && (
                <p className="text-xs text-slate-400 mt-1">Responsable del acta: {meeting.minutesResponsible}</p>
              )}
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {hasApiKey() && (
                <Button
                  variant="secondary"
                  size="sm"
                  icon={Sparkles}
                  onClick={handleRegenerate}
                  loading={generating}
                >
                  Regenerar con IA
                </Button>
              )}
              <Button
                variant="secondary"
                size="sm"
                icon={Download}
                onClick={handleExport}
                loading={exportLoading}
              >
                Exportar PDF
              </Button>
              <button
                onClick={handleDelete}
                className="p-2 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        </div>
      </Card>

      {/* Quick notes (collapsed) */}
      {meeting.quickNotes && (
        <details className="group">
          <summary className="cursor-pointer select-none flex items-center gap-2 text-xs font-medium text-slate-500 hover:text-slate-700 transition-colors">
            <span className="w-4 h-4 rounded border border-slate-300 flex items-center justify-center text-slate-400 group-open:rotate-90 transition-transform">▶</span>
            Ver notas rápidas originales
          </summary>
          <Card className="mt-2">
            <p className="text-sm text-slate-600 whitespace-pre-line">{meeting.quickNotes}</p>
          </Card>
        </details>
      )}

      {/* Minutes */}
      <Card>
        <div className="flex items-center justify-between mb-5 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <FileText size={15} className="text-indigo-600" />
            <h2 className="text-sm font-semibold text-slate-900">Acta de Reunión</h2>
          </div>
          <div className="flex items-center gap-2">
            {editMode ? (
              <>
                <Button size="sm" variant="ghost" onClick={() => setEditMode(false)}>Cancelar</Button>
                <Button size="sm" icon={Save} onClick={handleSaveMinutes} loading={saving}>Guardar</Button>
              </>
            ) : (
              <Button size="sm" variant="secondary" icon={Pencil} onClick={() => setEditMode(true)}>
                Editar
              </Button>
            )}
          </div>
        </div>

        {!minutes ? (
          <div className="text-center py-8">
            <FileText size={32} className="text-slate-300 mx-auto mb-3" />
            <p className="text-sm text-slate-500 mb-4">Esta reunión no tiene acta generada aún.</p>
            <div className="flex items-center justify-center gap-3">
              {hasApiKey() && (
                <Button icon={Sparkles} onClick={handleRegenerate} loading={generating}>
                  Generar con IA
                </Button>
              )}
              <Button
                variant="secondary"
                icon={FileText}
                onClick={() => { setMinutes({ executiveSummary: '', topicsDiscussed: '', agreements: '', commitments: '', nextSteps: '', observations: '' }); setEditMode(true) }}
              >
                Crear manual
              </Button>
            </div>
          </div>
        ) : editMode ? (
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
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-6">
            {MINUTES_SECTIONS.map(({ key, label }) =>
              minutes[key] && minutes[key] !== 'Sin información para esta sección.' ? (
                <div key={key}>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-1 h-5 bg-indigo-600 rounded-full flex-shrink-0" />
                    <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wide">{label}</h3>
                  </div>
                  <p className="text-sm text-slate-700 whitespace-pre-line leading-relaxed pl-3">
                    {minutes[key]}
                  </p>
                </div>
              ) : null
            )}
          </div>
        )}
      </Card>

      {/* Previous pending agreements */}
      {prevAgs.length > 0 && (
        <Card>
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
            <AlertCircle size={14} className="text-amber-500" />
            <h2 className="text-sm font-semibold text-slate-900">
              Acuerdos Pendientes de Reuniones Anteriores
            </h2>
          </div>
          <div className="space-y-2">
            {prevAgs.map((ag) => (
              <div key={ag.id} className="flex items-start justify-between gap-3 p-3 bg-amber-50 rounded-lg">
                <div className="flex-1">
                  <p className="text-sm text-slate-700">{ag.description}</p>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <Badge variant={ag.status}>{getAgreementStatusLabel(ag.status)}</Badge>
                    {ag.responsible && <p className="text-xs text-slate-500">{ag.responsible}</p>}
                    {ag.meetingDate && <p className="text-xs text-slate-400">Reunión: {formatDate(ag.meetingDate)}</p>}
                  </div>
                </div>
                <div className="flex gap-1.5 flex-shrink-0">
                  {ag.status === 'pending' && (
                    <button onClick={() => updatePrevAg(ag.id, 'in_progress')}
                      className="text-xs px-2 py-1 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition-colors">
                      En proceso
                    </button>
                  )}
                  <button onClick={() => updatePrevAg(ag.id, 'closed')}
                    className="text-xs px-2 py-1 bg-emerald-50 text-emerald-600 rounded hover:bg-emerald-100 transition-colors">
                    ✓ Cerrar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* This meeting's agreements */}
      <Card>
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
          <h2 className="text-sm font-semibold text-slate-900">
            Acuerdos de esta Reunión
            {agreements.length > 0 && (
              <span className="ml-2 text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                {agreements.length}
              </span>
            )}
          </h2>
          <Button size="sm" variant="secondary" icon={Plus} onClick={() => setAgModal(true)}>
            Agregar acuerdo
          </Button>
        </div>

        {agreements.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-5">No hay acuerdos registrados para esta reunión.</p>
        ) : (
          <div className="space-y-2">
            {agreements.map((ag) => (
              <div key={ag.id} className="flex items-start justify-between gap-3 p-3 bg-slate-50 rounded-lg">
                <div className="flex-1">
                  <p className="text-sm text-slate-700 mb-1.5">{ag.description}</p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant={ag.status}>{getAgreementStatusLabel(ag.status)}</Badge>
                    {ag.responsible && <p className="text-xs text-slate-400">{ag.responsible}</p>}
                    {ag.dueDate && <p className="text-xs text-slate-400">· {formatDate(ag.dueDate)}</p>}
                  </div>
                  {ag.status !== 'closed' && (
                    <div className="flex gap-1.5 mt-2 flex-wrap">
                      {ag.status === 'pending' && (
                        <button onClick={() => updateAgStatus(ag.id, 'in_progress')}
                          className="text-xs px-2 py-1 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition-colors">
                          → En proceso
                        </button>
                      )}
                      <button onClick={() => updateAgStatus(ag.id, 'closed')}
                        className="text-xs px-2 py-1 bg-emerald-50 text-emerald-600 rounded hover:bg-emerald-100 transition-colors">
                        ✓ Cerrar
                      </button>
                    </div>
                  )}
                  {ag.status === 'closed' && (
                    <button onClick={() => updateAgStatus(ag.id, 'pending')}
                      className="text-xs px-2 py-1 mt-2 bg-slate-100 text-slate-500 rounded hover:bg-slate-200 transition-colors">
                      ↩ Reabrir
                    </button>
                  )}
                </div>
                <button onClick={() => handleDeleteAg(ag.id)}
                  className="p-1 text-slate-300 hover:text-red-400 transition-colors flex-shrink-0">
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Add agreement modal */}
      <Modal
        isOpen={agModal}
        onClose={() => setAgModal(false)}
        title="Agregar Acuerdo"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setAgModal(false)}>Cancelar</Button>
            <Button onClick={handleAddAgreement} loading={agSaving}>Guardar acuerdo</Button>
          </>
        }
      >
        <form onSubmit={handleAddAgreement} className="space-y-4">
          <Textarea
            label="Descripción"
            value={agForm.description}
            onChange={setAg('description')}
            rows={3}
            placeholder="Describe el acuerdo o compromiso..."
            required
          />
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
        </form>
      </Modal>
    </div>
  )
}
