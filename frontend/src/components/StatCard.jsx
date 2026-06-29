export default function StatCard({ title, value, subtitle, color = 'blue', icon }) {
  const gradientMap = {
    blue: 'from-indigo-500/20 to-indigo-600/5',
    green: 'from-emerald-500/20 to-emerald-600/5',
    red: 'from-red-500/20 to-red-600/5',
    orange: 'from-amber-500/20 to-amber-600/5',
    purple: 'from-violet-500/20 to-violet-600/5',
  }

  const borderMap = {
    blue: 'border-indigo-500',
    green: 'border-emerald-500',
    red: 'border-red-500',
    orange: 'border-amber-500',
    purple: 'border-violet-500',
  }

  const valueColorMap = {
    blue: 'text-indigo-400',
    green: 'text-emerald-400',
    red: 'text-red-400',
    orange: 'text-amber-400',
    purple: 'text-violet-400',
  }

  const gradient = gradientMap[color] || gradientMap['blue']
  const border = borderMap[color] || borderMap['blue']
  const valueColor = valueColorMap[color] || valueColorMap['blue']

  return (
    <div className={`glass rounded-2xl p-6 bg-gradient-to-br ${gradient} border-t-2 ${border}`}>
      <div className="flex items-start justify-between">
        <p className="text-slate-400 text-sm font-medium">{title}</p>
        {icon && <span className="text-xl">{icon}</span>}
      </div>
      <p className={`mt-3 text-3xl font-bold text-white`}>{value}</p>
      {subtitle && (
        <p className="mt-1 text-slate-500 text-xs">{subtitle}</p>
      )}
    </div>
  )
}
