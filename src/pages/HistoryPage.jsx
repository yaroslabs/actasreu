import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { ClipboardList, Search, ArrowRight, Plus } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { getMeetings } from '../services/meetingService'
import { getProjects } from '../services/projectService'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import Loading from '../components/ui/Loading'
import EmptyState from '../components/ui/EmptyState'
import { formatDate, getMeetingTypeLabel } from '../utils/formatters'
import { MEETING_TYPES } from '../utils/constants'

export default function HistoryPage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [meetings, setMeetings] = useState([])
  const [projects, setProjects] = useState([])
  const [search, setSearch] = useState('')
  const [filterProject, setFilterProject] = useState('')
  const [filterType, setFilterType] = useState('')
  const [filterStatus, setFilterStatus] = useState('')

  useEffect(() => {
    Promise.all([getMeetings(user.uid), getProjects(user.uid)])
      .then(([m, p]) => { setMeetings(m); setProjects(p) })
      .finally(() => setLoading(false))
  }, [user.uid])

  const filtered = useMemo(() => {
    let result = meetings
    if (filterProject) result = result.filter((m) => m.projectId === filterProject)
    if (filterType) result = result.filter((m) => m.type === filterType)
    if (filterStatus) result = result.filter((m) => m.status === filterStatus)
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(
        (m) =>
          m.projectName?.toLowerCase().includes(q) ||
          m.participants?.toLowerCase().includes(q) ||
          m.minutesResponsible?.toLowerCase().includes(q) ||
          m.quickNotes?.toLowerCase().includes(q) ||
          getMeetingTypeLabel(m.type).toLowerCase().includes(q)
      )
    }
    return result
  }, [meetings, filterProject, filterType, filterStatus, search])

  if (loading) return <Loading />

  return (
    <div className="max-w-4xl">
      {/* Filters */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 mb-5 space-y-3">
        {/* Search */}
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg bg-white
              focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            placeholder="Buscar por proyecto, participante, tipo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Filter chips */}
        <div className="flex flex-wrap gap-2">
          <select
            className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={filterProject}
            onChange={(e) => setFilterProject(e.target.value)}
          >
            <option value="">Todos los proyectos</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>

          <select
            className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="">Todos los tipos</option>
            {MEETING_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>

          <select
            className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="">Todos los estados</option>
            <option value="draft">Borrador</option>
            <option value="completed">Completada</option>
          </select>

          {(filterProject || filterType || filterStatus || search) && (
            <button
              onClick={() => { setFilterProject(''); setFilterType(''); setFilterStatus(''); setSearch('') }}
              className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Limpiar filtros
            </button>
          )}
        </div>
      </div>

      {/* Results count */}
      {filtered.length !== meetings.length && (
        <p className="text-xs text-slate-500 mb-3">
          Mostrando {filtered.length} de {meetings.length} reuniones
        </p>
      )}

      {/* List */}
      {meetings.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="Sin reuniones registradas"
          description="Crea tu primera reunión para comenzar a gestionar actas y acuerdos."
          action={
            <Link to="/meetings/new">
              <Button icon={Plus}>Nueva Reunión</Button>
            </Link>
          }
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Search}
          title="Sin resultados"
          description="No hay reuniones que coincidan con los filtros aplicados."
        />
      ) : (
        <div className="space-y-2">
          {filtered.map((m) => (
            <Link key={m.id} to={`/meetings/${m.id}`}>
              <Card hover padding={false}>
                <div className="px-5 py-4 flex items-center gap-4">
                  {/* Date column */}
                  <div className="w-16 text-center flex-shrink-0">
                    <p className="text-xs font-bold text-indigo-600 uppercase">
                      {m.date ? new Date(m.date + 'T12:00:00').toLocaleString('es', { month: 'short' }) : '-'}
                    </p>
                    <p className="text-xl font-bold text-slate-900 leading-none">
                      {m.date ? new Date(m.date + 'T12:00:00').getDate() : '-'}
                    </p>
                    <p className="text-xs text-slate-400">
                      {m.date ? new Date(m.date + 'T12:00:00').getFullYear() : ''}
                    </p>
                  </div>

                  <div className="w-px h-10 bg-slate-100 flex-shrink-0" />

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <p className="text-sm font-semibold text-slate-800 truncate">{m.projectName}</p>
                      <Badge variant={m.status}>{m.status === 'completed' ? 'Completada' : 'Borrador'}</Badge>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-400 flex-wrap">
                      <span>{getMeetingTypeLabel(m.type)}</span>
                      {m.startTime && <><span>·</span><span>{m.startTime}{m.endTime && ` - ${m.endTime}`}</span></>}
                      {m.participants && <><span>·</span><span className="truncate">{m.participants}</span></>}
                    </div>
                  </div>

                  <ArrowRight size={14} className="text-slate-300 flex-shrink-0" />
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
