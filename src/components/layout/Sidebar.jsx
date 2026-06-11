import { Link, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  FolderKanban,
  Plus,
  ClipboardList,
  LogOut,
  FileText,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'

const NAV = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/projects', icon: FolderKanban, label: 'Proyectos' },
  { to: '/meetings/new', icon: Plus, label: 'Nueva Reunión', highlight: true },
  { to: '/history', icon: ClipboardList, label: 'Historial' },
]

function isActive(navPath, currentPath) {
  if (navPath === '/dashboard') return currentPath === '/dashboard'
  if (navPath === '/meetings/new') return currentPath === '/meetings/new'
  return currentPath.startsWith(navPath)
}

export default function Sidebar() {
  const location = useLocation()
  const { user, logout } = useAuth()

  const handleLogout = async () => {
    try {
      await logout()
    } catch {
      toast.error('Error al cerrar sesión')
    }
  }

  const initial = user?.displayName?.[0] || user?.email?.[0]?.toUpperCase() || 'U'

  return (
    <aside className="w-60 min-h-screen bg-slate-900 flex flex-col flex-shrink-0">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <FileText size={15} className="text-white" />
          </div>
          <div className="min-w-0">
            <p className="text-white font-semibold text-sm leading-tight">Mis Actas</p>
            <p className="text-slate-500 text-xs">de Reunión</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {NAV.map(({ to, icon: Icon, label, highlight }) => {
          const active = isActive(to, location.pathname)
          return (
            <Link
              key={to}
              to={to}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                ${active
                  ? 'bg-indigo-600 text-white'
                  : highlight
                  ? 'text-slate-300 hover:bg-slate-800 hover:text-white border border-dashed border-slate-700 mt-2'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
                }`}
            >
              <Icon size={15} className="flex-shrink-0" />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* User */}
      <div className="px-3 py-3 border-t border-slate-800">
        <div className="flex items-center gap-2.5 px-3 py-2 mb-0.5 rounded-lg">
          <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {initial}
          </div>
          <p className="text-slate-400 text-xs truncate flex-1">{user?.email}</p>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-slate-500 hover:bg-slate-800 hover:text-slate-300 transition-colors"
        >
          <LogOut size={14} />
          Cerrar sesión
        </button>
      </div>
    </aside>
  )
}
