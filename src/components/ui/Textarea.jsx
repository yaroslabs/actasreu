export default function Textarea({ label, error, hint, rows = 4, className = '', required, ...props }) {
  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-sm font-medium text-slate-700">
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      <textarea
        rows={rows}
        className={`block w-full px-3 py-2 text-sm border rounded-lg bg-white text-slate-900
          placeholder-slate-400 transition-colors resize-none
          focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
          disabled:bg-slate-50 disabled:cursor-not-allowed
          ${error ? 'border-red-300 focus:ring-red-400' : 'border-slate-200'}
          ${className}`}
        {...props}
      />
      {hint && !error && <p className="text-xs text-slate-400">{hint}</p>}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
}
