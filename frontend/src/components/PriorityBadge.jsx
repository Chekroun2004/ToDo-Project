export default function PriorityBadge({ priority }) {
  const config = {
    low: { label: 'Faible', className: 'bg-green-100 text-green-800' },
    medium: { label: 'Moyen', className: 'bg-blue-100 text-blue-800' },
    high: { label: 'Élevé', className: 'bg-orange-100 text-orange-800' },
    urgent: { label: 'Urgent', className: 'bg-red-100 text-red-800' },
  }

  const { label, className } = config[priority] || config['medium']

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${className}`}>
      {label}
    </span>
  )
}
