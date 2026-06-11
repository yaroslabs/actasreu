import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
  Plus, CalendarDays, ArrowRight, CheckCircle2,
  Clock, Pencil, Trash2, FolderKanban,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { getProject, updateProject } from '../services/projectService'
import { getMeetingsByProject } from '../services/meetingService'
import { getAgreementsByProject, updateAgreement } from '../services/agreementService'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import Modal from '../components/ui/Modal'
import Input from '../components/ui/Input'
import Textarea from '../components/ui/Textarea'
import Select from '../components/ui/Select'
import Loading from '../components/ui/Loading'
import EmptyState from '../components/ui/EmptyState'
import {
  formatDate, getMeetingTypeLabel, getProjectStatusLabel, getAgreementStatusLabel,
} from '../utils/formatters'
import { PROJECT_STATUSES, AGREEMENT_STATUSES } from '../utils/constants'

export default function ProjectDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [project, setProject] = useState(null)
  const [meetings, setMeetings] = useState([])
  const [agreements, setAgreements] = useState([])
  const [editModal, setEditModal] = useState(false)
  const [editForm, setEditForm] = useState({})
  const [saving, setSaving] = useState(false)
  const [agTab, setAgTab] = useState('pending')

  const load = async () => {
    try {
      const [p, m, a] = await Promise.all([
        getProject(id),
        getMeetingsByProject(id),
        getAgreementsByProject(id),
      ])
      if (!p) { navigate('/projects'); return }
      setProject(p)
      setMeetings(m)
      setAgreements(a)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [id])

  const openEdit = () => {
    setEditForm({
      name: project.name,
      client: project.client || '',
      description: project.description || '',
      status: project.status,
    })
    setEditModal(true)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await updateProject(id, editForm)
      setProject((p) => ({ ...p, ...editForm }))
      setEditModal(false)
      toast.success('Proyecto actualizado')
    } catch {
      toast.error('Error al guardar')
    } finally {
      setSaving(false)
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

  const set = (f) => (e) => setEditForm((p) => ({ ...p, [f]: e.target.value }))

  if (loading) return <Loading />
  if (!project) return null

  const pendingAg = agreements.filter((a) => a.status !== 'closed')
  const closedAg = agreements.filter((a) => a.status === 'closed')
  const displayAg = agTab === 'pending' ? pendingAg : closedAg

  return (
    <div className="max-w-5xl space-y-6">
      {/* Project header */}
      <Card padding={false}>
        <div className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center flex-shrink-0">
                <FolderKanban size={22} className="text-indigo-600" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-lg font-bold text-slate-900">{project.name}</h1>
                  <Badge variant={project.status}>{getProjectStatusLabel(project.status)}</Badge>
                </div>
                {project.client && <p className="text-sm text-slate-500 mb-1">{project.client}</p>}
                {project.description && <p className="text-sm text-slate-400 max-w-2xl">{project.description}</p>}
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Button variant="secondary" size="sm" icon={Pencil} onClick={openEdit}>Editar</Button>
              <Link to={`/meetings/new?projectId=${id}`}>
                <Button size="sm" icon={Plus}>Nueva Reunión</Button>
              </Link>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mt-5 pt-5 border-t border-slate-100">
            <div className="text-center">
              <p className="text-2xl font-bold text-slate-900">{meetings.length}</p>
              <p className="text-xs text-slate-500">Reuniones</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-amber-600">{pendingAg.length}</p>
              <p className="text-xs text-slate-500">Acuerdos Pendientes</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-emerald-600">{closedAg.length}</p>
              <p className="text-xs text-slate-500">Acuerdos Cerrados</p>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* Meetings */}
        <div className="lg:col-span-3 space-y-3">
          <h2 className="text-sm font-semibold text-slate-900">Historial de Reuniones</h2>
          {meetings.length === 0 ? (
            <EmptyState
              icon={CalendarDays}
              title="Sin reuniones aún"
              description="Crea la primera reunión de este proyecto."
              action={
                <Link to={`/meetings/new?projectId=${id}`}>
                  <Button size="sm" icon={Plus}>Nueva Reunión</Button>
                </Link>
              }
            />
          ) : (
            meetings.map((m) => (
              <Link key={m.id} to={`/meetings/${m.id}`}>
                <Card hover padding={false}>
                  <div className="px-4 py-3 flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-sm font-medium text-slate-800">{getMeetingTypeLabel(m.type)}</p>
                        <Badge variant={m.status}>{m.status === 'completed' ? 'Completada' : 'Borrador'}</Badge>
                      </div>
                      <p className="text-xs text-slate-400">
                        {formatDate(m.date)}
                        {m.participants && ` · ${m.participants}`}
                      </p>
                    </div>
                    <ArrowRight size={13} className="text-slate-300 flex-shrink-0" />
                  </div>
                </Card>
              </Link>
            ))
          )}
        </div>

        {/* Agreements */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setAgTab('pending')}
              className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                agTab === 'pending' ? 'bg-indigo-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              Pendientes ({pendingAg.length})
            </button>
            <button
              onClick={() => setAgTab('closed')}
              className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                agTab === 'closed' ? 'bg-indigo-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              Cerrados ({closedAg.length})
            </button>
          </div>

          {displayAg.length === 0 ? (
            <Card>
              <p className="text-center text-xs text-slate-400 py-4">
                {agTab === 'pending' ? 'No hay acuerdos pendientes' : 'No hay acuerdos cerrados'}
              </p>
            </Card>
          ) : (
            displayAg.map((ag) => (
              <Card key={ag.id} padding={false}>
                <div className="px-4 py-3">
                  <p className="text-sm text-slate-700 mb-2">{ag.description}</p>
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <Badge variant={ag.status}>{getAgreementStatusLabel(ag.status)}</Badge>
                    {ag.responsible && <p className="text-xs text-slate-400">{ag.responsible}</p>}
                    {ag.dueDate && <p className="text-xs text-slate-400">· {formatDate(ag.dueDate)}</p>}
                  </div>
                  {ag.status !== 'closed' && (
                    <div className="flex gap-1.5 flex-wrap">
                      {ag.status === 'pending' && (
                        <button
                          onClick={() => updateAgStatus(ag.id, 'in_progress')}
                          className="text-xs px-2 py-1 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition-colors"
                        >
                          → En proceso
                        </button>
                      )}
                      <button
                        onClick={() => updateAgStatus(ag.id, 'closed')}
                        className="text-xs px-2 py-1 bg-emerald-50 text-emerald-600 rounded hover:bg-emerald-100 transition-colors"
                      >
                        ✓ Cerrar
                      </button>
                    </div>
                  )}
                  {ag.status === 'closed' && (
                    <button
                      onClick={() => updateAgStatus(ag.id, 'pending')}
                      className="text-xs px-2 py-1 bg-slate-50 text-slate-500 rounded hover:bg-slate-100 transition-colors"
                    >
                      ↩ Reabrir
                    </button>
                  )}
                  {ag.meetingDate && (
                    <p className="text-xs text-slate-300 mt-1">Reunión: {formatDate(ag.meetingDate)}</p>
                  )}
                </div>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Edit modal */}
      <Modal
        isOpen={editModal}
        onClose={() => setEditModal(false)}
        title="Editar Proyecto"
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditModal(false)}>Cancelar</Button>
            <Button onClick={handleSave} loading={saving}>Guardar cambios</Button>
          </>
        }
      >
        <form onSubmit={handleSave} className="space-y-4">
          <Input label="Nombre" value={editForm.name || ''} onChange={set('name')} required />
          <Input label="Cliente" value={editForm.client || ''} onChange={set('client')} />
          <Textarea label="Descripción" value={editForm.description || ''} onChange={set('description')} rows={3} />
          <Select label="Estado" value={editForm.status || 'active'} onChange={set('status')} options={PROJECT_STATUSES} />
        </form>
      </Modal>
    </div>
  )
}
