import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Plus, FolderKanban, Pencil, Trash2, ArrowRight } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import { getProjects, createProject, updateProject, deleteProject } from '../services/projectService'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import Modal from '../components/ui/Modal'
import Input from '../components/ui/Input'
import Textarea from '../components/ui/Textarea'
import Select from '../components/ui/Select'
import Loading from '../components/ui/Loading'
import EmptyState from '../components/ui/EmptyState'
import { PROJECT_STATUSES } from '../utils/constants'
import { getProjectStatusLabel } from '../utils/formatters'

const EMPTY_FORM = { name: '', client: '', description: '', status: 'active' }

export default function ProjectsPage() {
  const { user } = useAuth()
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [filter, setFilter] = useState('all')

  const load = () =>
    getProjects(user.uid)
      .then(setProjects)
      .finally(() => setLoading(false))

  useEffect(() => { load() }, [user.uid])

  const set = (f) => (e) => setForm((p) => ({ ...p, [f]: e.target.value }))

  const openCreate = () => {
    setEditing(null)
    setForm(EMPTY_FORM)
    setModal(true)
  }

  const openEdit = (p, e) => {
    e.preventDefault()
    e.stopPropagation()
    setEditing(p)
    setForm({ name: p.name, client: p.client || '', description: p.description || '', status: p.status })
    setModal(true)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) return toast.error('El nombre es obligatorio')
    setSaving(true)
    try {
      if (editing) {
        await updateProject(editing.id, form)
        toast.success('Proyecto actualizado')
      } else {
        await createProject(user.uid, form)
        toast.success('Proyecto creado')
      }
      setModal(false)
      load()
    } catch {
      toast.error('Error al guardar el proyecto')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (p, e) => {
    e.preventDefault()
    e.stopPropagation()
    if (!window.confirm(`¿Eliminar el proyecto "${p.name}"? Esta acción no se puede deshacer.`)) return
    try {
      await deleteProject(p.id)
      setProjects((prev) => prev.filter((x) => x.id !== p.id))
      toast.success('Proyecto eliminado')
    } catch {
      toast.error('Error al eliminar')
    }
  }

  const filtered = filter === 'all' ? projects : projects.filter((p) => p.status === filter)

  if (loading) return <Loading />

  return (
    <div className="max-w-5xl">
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-6 gap-4">
        <div className="flex gap-1.5">
          {[
            { value: 'all', label: 'Todos' },
            ...PROJECT_STATUSES,
          ].map((s) => (
            <button
              key={s.value}
              onClick={() => setFilter(s.value)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                filter === s.value
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
        <Button icon={Plus} onClick={openCreate}>Nuevo Proyecto</Button>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={FolderKanban}
          title={filter === 'all' ? 'No hay proyectos aún' : 'Sin proyectos con este estado'}
          description="Los proyectos te permiten organizar tus reuniones y dar seguimiento a acuerdos."
          action={
            filter === 'all' && (
              <Button icon={Plus} onClick={openCreate}>Crear primer proyecto</Button>
            )
          }
        />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((p) => (
            <Link key={p.id} to={`/projects/${p.id}`}>
              <Card hover padding={false} className="h-full">
                <div className="p-5 flex flex-col h-full">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center flex-shrink-0">
                      <FolderKanban size={18} className="text-indigo-600" />
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => openEdit(p, e)}
                        className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        onClick={(e) => handleDelete(p, e)}
                        className="p-1.5 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  <h3 className="font-semibold text-slate-900 text-sm mb-1">{p.name}</h3>
                  {p.client && <p className="text-xs text-slate-500 mb-2">{p.client}</p>}
                  {p.description && (
                    <p className="text-xs text-slate-400 line-clamp-2 mb-3 flex-1">{p.description}</p>
                  )}

                  <div className="flex items-center justify-between mt-auto pt-3 border-t border-slate-100">
                    <Badge variant={p.status}>{getProjectStatusLabel(p.status)}</Badge>
                    <ArrowRight size={13} className="text-slate-300" />
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {/* Modal */}
      <Modal
        isOpen={modal}
        onClose={() => setModal(false)}
        title={editing ? 'Editar Proyecto' : 'Nuevo Proyecto'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setModal(false)}>Cancelar</Button>
            <Button onClick={handleSave} loading={saving}>
              {editing ? 'Guardar cambios' : 'Crear proyecto'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSave} className="space-y-4">
          <Input label="Nombre del proyecto" value={form.name} onChange={set('name')} required placeholder="Ej: Sistema de gestión corporativa" />
          <Input label="Cliente" value={form.client} onChange={set('client')} placeholder="Nombre del cliente o empresa" />
          <Textarea label="Descripción" value={form.description} onChange={set('description')} rows={3} placeholder="Describe brevemente el proyecto..." />
          <Select label="Estado" value={form.status} onChange={set('status')} options={PROJECT_STATUSES} />
        </form>
      </Modal>
    </div>
  )
}
