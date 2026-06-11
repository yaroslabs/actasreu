export default function Card({ children, className = '', hover = false, onClick, padding = true }) {
  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-xl border border-slate-200 shadow-sm
        ${hover ? 'hover:shadow-md hover:border-indigo-200 transition-all duration-150 cursor-pointer' : ''}
        ${padding ? 'p-5' : ''}
        ${className}`}
    >
      {children}
    </div>
  )
}
