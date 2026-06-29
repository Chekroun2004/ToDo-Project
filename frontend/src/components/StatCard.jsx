import { useState, useEffect } from 'react'

function useCountUp(target, duration = 1100) {
  const [display, setDisplay] = useState(() => {
    const isPercent = typeof target === 'string' && target.endsWith('%')
    return isPercent ? '0%' : (typeof target === 'number' ? 0 : target)
  })

  useEffect(() => {
    const isPercent = typeof target === 'string' && target.endsWith('%')
    const num = isPercent ? parseInt(target) : (typeof target === 'number' ? target : null)

    if (num === null || isNaN(num)) { setDisplay(target); return }

    const start = performance.now()
    const tick = (now) => {
      const p = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - p, 3)
      const val = Math.round(num * eased)
      setDisplay(isPercent ? `${val}%` : val)
      if (p < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }, [target, duration])

  return display
}

export default function StatCard({ title, value, subtitle, color = 'blue', icon }) {
  const displayValue = useCountUp(value)

  const cfg = {
    blue:   { gradient: 'from-indigo-500/25 to-transparent',  border: 'border-indigo-500',  text: 'text-indigo-300',  glow: 'hover:shadow-indigo-500/20' },
    green:  { gradient: 'from-emerald-500/25 to-transparent', border: 'border-emerald-500', text: 'text-emerald-300', glow: 'hover:shadow-emerald-500/20' },
    red:    { gradient: 'from-red-500/25 to-transparent',     border: 'border-red-500',     text: 'text-red-300',    glow: 'hover:shadow-red-500/20' },
    orange: { gradient: 'from-amber-500/25 to-transparent',   border: 'border-amber-500',   text: 'text-amber-300',  glow: 'hover:shadow-amber-500/20' },
    purple: { gradient: 'from-violet-500/25 to-transparent',  border: 'border-violet-500',  text: 'text-violet-300', glow: 'hover:shadow-violet-500/20' },
  }

  const { gradient, border, text, glow } = cfg[color] || cfg.blue

  return (
    <div className={`glass rounded-2xl p-6 bg-gradient-to-br ${gradient} border-t-2 ${border} card-glow hover:shadow-xl ${glow} animate-in`}>
      <div className="flex items-start justify-between mb-3">
        <p className="text-slate-400 text-sm font-medium leading-snug">{title}</p>
        {icon && <span className="text-2xl leading-none">{icon}</span>}
      </div>
      <p className={`text-4xl font-black tabular-nums ${text}`}>{displayValue}</p>
      {subtitle && <p className="mt-2 text-slate-500 text-xs">{subtitle}</p>}
    </div>
  )
}
