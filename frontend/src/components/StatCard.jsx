export default function StatCard({ title, value, subtitle, color = 'blue' }) {
  const colorMap = {
    blue: 'text-blue-600',
    green: 'text-green-600',
    orange: 'text-orange-600',
    red: 'text-red-600',
    purple: 'text-purple-600',
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <p className="text-sm font-medium text-gray-500 truncate">{title}</p>
      <p className={`mt-2 text-3xl font-bold ${colorMap[color] || colorMap['blue']}`}>
        {value}
      </p>
      {subtitle && (
        <p className="mt-1 text-xs text-gray-400">{subtitle}</p>
      )}
    </div>
  )
}
