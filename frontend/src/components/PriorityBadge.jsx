export default function PriorityBadge({ priority }) {
  const config = {
    low: { label: 'Faible', className: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' },
    medium: { label: 'Moyen', className: 'bg-blue-500/15 text-blue-400 border border-blue-500/30' },
    high: { label: 'Élevé', className: 'bg-amber-500/15 text-amber-400 border border-amber-500/30' },
    urgent: { label: 'Urgent', className: 'bg-red-500/15 text-red-400 border border-red-500/30' },
  }

  const { label, className } = config[priority] || config['medium']

  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${className}`}>
      {label}
    </span>
  )
}
