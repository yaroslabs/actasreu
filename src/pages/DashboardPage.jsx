import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  FolderKanban, CalendarDays, CheckCircle2, Clock,
  Plus, ArrowRight, AlertCircle,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { getProjects } from '../services/projectService'
import { getMeetings } from '../services/meetingService'
import { getAgreements } from '../services/agreementService'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import Loading from '../components/ui/Loading'
import { formatDate, getMeetingTypeLabel } from '../utils/formatters'

function StatCard({ icon: Icon, label, value, color, bg }) {
  return (
    <Card>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-slate-500 mb-1">{label}</p>
          <p className="text-3xl font-bold text-slate-900">{value}</p>
        </div>
        <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center flex-shrink-0`}>
          <Icon size={20} className={color} />
        </div>
      </div>
    </Card>
  )
}

export default function DashboardPage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [projects, setProjects] = useState([])
  const [meetings, setMeetings] = useState([])
  const [agreements, setAgreements] = useState([])

  useEffect(() => {
    Promise.all([
      getProjects(user.uid),
      getMeetings(user.uid),
      getAgreements(user.uid),
    ])
      .then(([p, m, a]) => { setProjects(p); setMeetings(m); setAgreements(a) })
      .finally(() => setLoading(false))
  }, [user.uid])

  if (loading) return <Loading />

  const pending = agreements.filter((a) => a.status === 'pending').length
  const inProgress = agreements.filter((a) => a.status === 'in_progress').length
  const closed = agreements.filter((a) => a.status === 'closed').length
  const recent = meetings.slice(0, 6)
  const activeProjects = projects.filter((p) => p.status === 'active')

  return (
    <div className="max-w-6xl space-y-7">
      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={FolderKanban} label="Proyectos Activos" value={activeProjects.length}
          color="text-indigo-600" bg="bg-indigo-50" />
        <StatCard icon={CalendarDays} label="Total Reuniones" value={meetings.length}
          color="text-blue-600" bg="bg-blue-50" />
        <StatCard icon={Clock} label="Acuerdos Pendientes" value={pending + inProgress}
          color="text-amber-600" bg="bg-amber-50" />
        <StatCard icon={CheckCircle2} label="Acuerdos Cerrados" value={closed}
          color="text-emerald-600" bg="bg-emerald-50" />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent meetings */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900">Últimas Reuniones</h2>
            <Link
              to="/history"
              className="text-xs text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
            >
              Ver todas <ArrowRight size={11} />
            </Link>
          </div>

          {recent.length === 0 ? (
            <Card>
              <div className="flex flex-col items-center py-6 text-center">
                <CalendarDays size={28} className="text-slate-300 mb-2" />
                <p className="text-sm text-slate-500 mb-3">Aún no hay reuniones registradas</p>
                <Link to="/meetings/new">
                  <Button size="sm" icon={Plus}>Nueva Reunión</Button>
                </Link>
              </div>
            </Card>
          ) : (
            recent.map((m) => (
              <Link key={m.id} to={`/meetings/${m.id}`}>
                <Card hover padding={false}>
                  <div className="px-5 py-3.5 flex items-center justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-sm font-medium text-slate-800 truncate">{m.projectName}</p>
                        <Badge variant={m.status}>{m.status === 'completed' ? 'Completada' : 'Borrador'}</Badge>
                      </div>
                      <p className="text-xs text-slate-400">
                        {getMeetingTypeLabel(m.type)} · {formatDate(m.date)}
                        {m.participants && ` · ${m.participants.split(',')[0].trim()}`}
                      </p>
                    </div>
                    <ArrowRight size={14} className="text-slate-300 flex-shrink-0" />
                  </div>
                </Card>
              </Link>
            ))
          )}
        </div>

        {/* Right column */}
        <div className="space-y-5">
          {/* Quick actions */}
          <div>
            <h2 className="text-sm font-semibold text-slate-900 mb-3">Acciones Rápidas</h2>
            <div className="space-y-2">
              <Link to="/meetings/new">
                <Card hover padding={false}>
                  <div className="px-4 py-3 flex items-center gap-3">
                    <div className="w-9 h-9 bg-indigo-50 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Plus size={17} className="text-indigo-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-800">Nueva Reunión</p>
                      <p className="text-xs text-slate-400">Registra y genera un acta</p>
                    </div>
                  </div>
                </Card>
              </Link>
              <Link to="/projects">
                <Card hover padding={false}>
                  <div className="px-4 py-3 flex items-center gap-3">
                    <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                      <FolderKanban size={17} className="text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-800">Gestionar Proyectos</p>
                      <p className="text-xs text-slate-400">Ver y administrar proyectos</p>
                    </div>
                  </div>
                </Card>
              </Link>
            </div>
          </div>

          {/* Pending agreements */}
          {(pending + inProgress) > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-1.5">
                <AlertCircle size={13} className="text-amber-500" />
                Acuerdos Pendientes
              </h2>
              <div className="space-y-2">
                {agreements
                  .filter((a) => a.status !== 'closed')
                  .slice(0, 4)
                  .map((ag) => (
                    <div key={ag.id} className="bg-white border border-slate-200 rounded-lg px-3 py-2.5">
                      <p className="text-xs text-slate-700 font-medium truncate">{ag.description}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant={ag.status}>{ag.status === 'in_progress' ? 'En proceso' : 'Pendiente'}</Badge>
                        {ag.responsible && <p className="text-xs text-slate-400 truncate">{ag.responsible}</p>}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Active projects list */}
          {activeProjects.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Proyectos Activos</p>
              <div className="space-y-1">
                {activeProjects.slice(0, 5).map((p) => (
                  <Link key={p.id} to={`/projects/${p.id}`}>
                    <div className="flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-slate-100 transition-colors">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
                      <p className="text-sm text-slate-600 truncate">{p.name}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
