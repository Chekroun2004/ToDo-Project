export default function CategoryBadge({ categoryId, categories = [] }) {
  const category = categories.find(c => c._id === categoryId || c.id === categoryId)

  if (!category) return null

  const bgColor = (category.color || '#6B7280') + '20'
  const textColor = category.color || '#6B7280'

  return (
    <span
      className="px-2 py-1 rounded-full text-xs font-medium"
      style={{ backgroundColor: bgColor, color: textColor }}
    >
      {category.icon ? `${category.icon} ` : ''}{category.name}
    </span>
  )
}
