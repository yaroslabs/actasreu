const STYLES = {
  active:      'bg-emerald-50 text-emerald-700 border border-emerald-200',
  paused:      'bg-amber-50 text-amber-700 border border-amber-200',
  finished:    'bg-slate-100 text-slate-500 border border-slate-200',
  pending:     'bg-amber-50 text-amber-700 border border-amber-200',
  in_progress: 'bg-blue-50 text-blue-700 border border-blue-200',
  closed:      'bg-emerald-50 text-emerald-700 border border-emerald-200',
  draft:       'bg-slate-100 text-slate-500 border border-slate-200',
  completed:   'bg-indigo-50 text-indigo-700 border border-indigo-200',
  default:     'bg-indigo-50 text-indigo-700 border border-indigo-200',
}

export default function Badge({ children, variant = 'default', className = '' }) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
        ${STYLES[variant] || STYLES.default} ${className}`}
    >
      {children}
    </span>
  )
}
