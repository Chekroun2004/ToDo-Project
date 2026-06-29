import PriorityBadge from './PriorityBadge'
import CategoryBadge from './CategoryBadge'

const borderColors = {
  low: 'border-green-400',
  medium: 'border-blue-400',
  high: 'border-orange-400',
  urgent: 'border-red-400',
}

const statusConfig = {
  pending: { label: 'À faire', className: 'bg-gray-100 text-gray-700' },
  in_progress: { label: 'En cours', className: 'bg-blue-100 text-blue-700' },
  completed: { label: 'Terminé', className: 'bg-green-100 text-green-700' },
  cancelled: { label: 'Annulé', className: 'bg-red-100 text-red-700' },
}

function formatDate(dateStr) {
  if (!dateStr) return null
  const d = new Date(dateStr)
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function TaskCard({ todo, onClick, categories = [] }) {
  const borderColor = borderColors[todo.priority] || 'border-gray-300'
  const status = statusConfig[todo.status] || { label: todo.status, className: 'bg-gray-100 text-gray-700' }
  const description = todo.description
    ? todo.description.length > 80
      ? todo.description.slice(0, 80) + '…'
      : todo.description
    : null

  const isOverdue =
    todo.dueDate &&
    todo.status !== 'completed' &&
    todo.status !== 'cancelled' &&
    new Date(todo.dueDate) < new Date()

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-lg shadow p-4 cursor-pointer hover:shadow-md transition-shadow border-l-4 ${borderColor}`}
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-sm font-semibold text-gray-800 leading-snug flex-1">{todo.title}</h3>
        <span className={`shrink-0 px-2 py-0.5 rounded-full text-xs font-medium ${status.className}`}>
          {status.label}
        </span>
      </div>

      {description && (
        <p className="mt-1 text-xs text-gray-500 leading-relaxed">{description}</p>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <PriorityBadge priority={todo.priority} />
        {todo.categoryId && (
          <CategoryBadge categoryId={todo.categoryId} categories={categories} />
        )}
        {todo.dueDate && (
          <span className={`text-xs ${isOverdue ? 'text-red-600 font-semibold' : 'text-gray-400'}`}>
            {isOverdue ? '⚠ ' : '📅 '}{formatDate(todo.dueDate)}
          </span>
        )}
      </div>
    </div>
  )
}
