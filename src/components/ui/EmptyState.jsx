export default function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-14 px-4 text-center">
      {Icon && (
        <div className="mb-4 w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
          <Icon size={26} />
        </div>
      )}
      <h3 className="text-sm font-semibold text-slate-700 mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-slate-500 mb-5 max-w-xs leading-relaxed">{description}</p>
      )}
      {action}
    </div>
  )
}
