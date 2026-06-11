function Spinner({ size = 'md' }) {
  const sizes = { sm: 'h-4 w-4', md: 'h-7 w-7', lg: 'h-10 w-10' }
  return (
    <svg className={`animate-spin text-indigo-600 ${sizes[size]}`} fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  )
}

export default function Loading({ fullScreen = false, size = 'md', label }) {
  if (fullScreen) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-slate-50">
        <Spinner size="lg" />
        {label && <p className="text-sm text-slate-500">{label}</p>}
      </div>
    )
  }
  return (
    <div className="flex flex-col items-center justify-center py-12 gap-3">
      <Spinner size={size} />
      {label && <p className="text-sm text-slate-500">{label}</p>}
    </div>
  )
}
