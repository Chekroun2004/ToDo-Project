import PriorityBadge from './PriorityBadge'
import CategoryBadge from './CategoryBadge'

const borderColors = {
  low:    'border-indigo-500',
  medium: 'border-blue-500',
  high:   'border-amber-500',
  urgent: 'border-red-500',
}

const statusConfig = {
  pending:     { label: 'À faire',  className: 'bg-slate-500/20 text-slate-300 border border-slate-500/30' },
  in_progress: { label: 'En cours', className: 'bg-blue-500/20 text-blue-300 border border-blue-500/30' },
  completed:   { label: 'Terminé',  className: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' },
  cancelled:   { label: 'Annulé',   className: 'bg-red-500/20 text-red-300 border border-red-500/30' },
}

function formatDate(dateStr) {
  if (!dateStr) return null
  return new Date(dateStr).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function TaskCard({ todo, onClick, categories = [], className = '' }) {
  const borderColor = borderColors[todo.priority] || 'border-slate-500'
  const status = statusConfig[todo.status] || { label: todo.status, className: 'bg-slate-500/20 text-slate-300 border border-slate-500/30' }
  const description = todo.description
    ? todo.description.length > 80 ? todo.description.slice(0, 80) + '…' : todo.description
    : null

  const isOverdue =
    todo.dueDate &&
    todo.status !== 'completed' &&
    todo.status !== 'cancelled' &&
    new Date(todo.dueDate) < new Date()

  return (
    <div
      onClick={onClick}
      className={`glass rounded-2xl p-4 cursor-pointer border-l-4 ${borderColor} card-glow hover:shadow-xl hover:shadow-indigo-500/10 animate-in ${className}`}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className="text-sm font-semibold text-white leading-snug flex-1">{todo.title}</h3>
        <span className={`shrink-0 px-2.5 py-0.5 rounded-full text-xs font-semibold ${status.className}`}>
          {status.label}
        </span>
      </div>

      {description && (
        <p className="text-xs text-slate-400 leading-relaxed mb-3">{description}</p>
      )}

      <div className="flex flex-wrap items-center gap-2 mt-auto">
        <PriorityBadge priority={todo.priority} />
        {todo.categoryId && (
          <CategoryBadge categoryId={todo.categoryId} categories={categories} />
        )}
        {todo.dueDate && (
          <span className={`text-xs font-medium ${isOverdue ? 'text-red-400' : 'text-slate-500'}`}>
            {isOverdue ? '⚠ ' : '📅 '}{formatDate(todo.dueDate)}
          </span>
        )}
      </div>
    </div>
  )
}
