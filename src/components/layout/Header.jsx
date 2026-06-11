import { useLocation, useNavigate } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'

const TITLES = {
  '/dashboard':   { title: 'Dashboard', sub: 'Resumen general de actividades' },
  '/projects':    { title: 'Proyectos', sub: 'Gestiona y organiza tus proyectos' },
  '/meetings/new': { title: 'Nueva Reunión', sub: 'Registra y genera un acta profesional' },
  '/history':     { title: 'Historial de Reuniones', sub: 'Todas las reuniones registradas' },
}

export default function Header() {
  const location = useLocation()
  const navigate = useNavigate()

  const getInfo = () => {
    const exact = TITLES[location.pathname]
    if (exact) return { ...exact, back: false }
    if (location.pathname.startsWith('/projects/'))
      return { title: 'Detalle del Proyecto', sub: 'Información, reuniones y acuerdos', back: '/projects' }
    if (location.pathname.startsWith('/meetings/'))
      return { title: 'Detalle de Reunión', sub: 'Acta, acuerdos y exportación', back: '/history' }
    return { title: '', sub: '', back: false }
  }

  const { title, sub, back } = getInfo()

  return (
    <header className="bg-white border-b border-slate-200 px-8 py-4 flex-shrink-0">
      <div className="flex items-center gap-3">
        {back && (
          <button
            onClick={() => navigate(back)}
            className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          >
            <ChevronLeft size={18} />
          </button>
        )}
        <div>
          <h1 className="text-base font-semibold text-slate-900 leading-tight">{title}</h1>
          <p className="text-xs text-slate-400 mt-0.5">{sub}</p>
        </div>
      </div>
    </header>
  )
}
