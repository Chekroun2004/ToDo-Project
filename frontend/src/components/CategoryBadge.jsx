export default function CategoryBadge({ categoryId, categories = [] }) {
  const category = categories.find(c => c._id === categoryId || c.id === categoryId)

  if (!category) return null

  const color = category.color || '#6366f1'

  return (
    <span
      className="px-2.5 py-0.5 rounded-full text-xs font-medium border"
      style={{
        backgroundColor: color + '20',
        color: color,
        borderColor: color + '4d',
      }}
    >
      {category.icon ? `${category.icon} ` : ''}{category.name}
    </span>
  )
}
