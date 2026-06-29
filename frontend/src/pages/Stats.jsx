import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'
import {
  PieChart, Pie, Cell,
  BarChart, Bar,
  LineChart, Line,
  XAxis, YAxis, Tooltip, Legend, ResponsiveContainer
} from 'recharts'

const STATUS_COLORS = {
  pending: '#6B7280',
  in_progress: '#6366f1',
  completed: '#10B981',
  cancelled: '#EF4444',
}

const STATUS_LABELS = {
  pending: 'À faire',
  in_progress: 'En cours',
  completed: 'Terminé',
  cancelled: 'Annulé',
}

const PRIORITY_COLORS = {
  low: '#10B981',
  medium: '#6366f1',
  high: '#F97316',
  urgent: '#EF4444',
}

const PRIORITY_LABELS = {
  low: 'Faible',
  medium: 'Moyen',
  high: 'Élevé',
  urgent: 'Urgent',
}

const CHART_COLORS = ['#6366f1', '#10B981', '#F97316', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6']

const tooltipStyle = {
  contentStyle: {
    background: '#1e1e2e',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '12px',
    color: '#f8fafc',
  },
  labelStyle: { color: '#94a3b8' },
}

const axisProps = { tick: { fill: '#64748b', fontSize: 12 } }

function SectionTitle({ children }) {
  return <h2 className="text-base font-semibold text-white mb-4">{children}</h2>
}

export default function Stats() {
  const { user } = useAuth()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get(`/stats/user/${user.id}`)
        setStats(res.data.data)
      } catch (err) {
        setError('Impossible de charger les statistiques.')
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [user.id])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-500 text-sm">Chargement des statistiques…</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl text-sm">{error}</div>
    )
  }

  const statusData = Object.entries(stats?.byStatus || {}).map(([key, value]) => ({
    name: STATUS_LABELS[key] || key,
    value,
    color: STATUS_COLORS[key] || '#6B7280',
  })).filter(d => d.value > 0)

  const priorityData = Object.entries(stats?.byPriority || {}).map(([key, value]) => ({
    name: PRIORITY_LABELS[key] || key,
    value,
    fill: PRIORITY_COLORS[key] || '#6B7280',
  }))

  const weeklyData = (stats?.weeklyEvolution || []).map(item => ({
    date: item.date || item.day || item._id || '',
    créées: item.created || item.count || 0,
    terminées: item.completed || item.done || 0,
  }))

  const categoryData = Object.entries(stats?.byCategory || {}).map(([key, value]) => ({
    name: key,
    value,
  })).filter(d => d.value > 0)

  const noData = <p className="text-sm text-slate-500 text-center py-8">Aucune donnée</p>

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Statistiques</h1>
        <p className="text-slate-400 text-sm mt-1">Analyse de vos tâches</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass rounded-2xl p-6">
          <SectionTitle>Répartition par statut</SectionTitle>
          {statusData.length === 0 ? noData : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={statusData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {statusData.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip {...tooltipStyle} formatter={(value) => [value, 'Tâches']} />
                <Legend wrapperStyle={{ color: '#94a3b8' }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="glass rounded-2xl p-6">
          <SectionTitle>Répartition par priorité</SectionTitle>
          {priorityData.every(d => d.value === 0) ? noData : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={priorityData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <XAxis dataKey="name" {...axisProps} />
                <YAxis {...axisProps} allowDecimals={false} />
                <Tooltip {...tooltipStyle} formatter={(value) => [value, 'Tâches']} />
                <Bar dataKey="value" name="Tâches" radius={[4, 4, 0, 0]}>
                  {priorityData.map((entry, index) => (
                    <Cell key={index} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="glass rounded-2xl p-6">
          <SectionTitle>Évolution hebdomadaire (7 derniers jours)</SectionTitle>
          {weeklyData.length === 0 ? noData : (
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={weeklyData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <XAxis dataKey="date" {...axisProps} />
                <YAxis {...axisProps} allowDecimals={false} />
                <Tooltip {...tooltipStyle} />
                <Legend wrapperStyle={{ color: '#94a3b8' }} />
                <Line
                  type="monotone"
                  dataKey="créées"
                  stroke="#6366f1"
                  strokeWidth={2}
                  dot={{ r: 4, fill: '#6366f1' }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  type="monotone"
                  dataKey="terminées"
                  stroke="#10B981"
                  strokeWidth={2}
                  dot={{ r: 4, fill: '#10B981' }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="glass rounded-2xl p-6">
          <SectionTitle>Répartition par catégorie</SectionTitle>
          {categoryData.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-8">Aucune donnée ou aucune catégorie attribuée</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={categoryData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip {...tooltipStyle} formatter={(value) => [value, 'Tâches']} />
                <Legend wrapperStyle={{ color: '#94a3b8' }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="glass rounded-2xl p-4 text-center">
          <p className="text-2xl font-bold text-indigo-400">{stats?.totalTasks || 0}</p>
          <p className="text-xs text-slate-500 mt-1">Total</p>
        </div>
        <div className="glass rounded-2xl p-4 text-center">
          <p className="text-2xl font-bold text-emerald-400">{stats?.byStatus?.completed || 0}</p>
          <p className="text-xs text-slate-500 mt-1">Terminées</p>
        </div>
        <div className="glass rounded-2xl p-4 text-center">
          <p className="text-2xl font-bold text-red-400">{stats?.overdueTasks || 0}</p>
          <p className="text-xs text-slate-500 mt-1">En retard</p>
        </div>
        <div className="glass rounded-2xl p-4 text-center">
          <p className="text-2xl font-bold text-violet-400">
            {stats?.completionRate != null
              ? `${Math.round(stats.completionRate)}%`
              : stats?.totalTasks > 0
                ? `${Math.round(((stats?.byStatus?.completed || 0) / stats.totalTasks) * 100)}%`
                : '0%'}
          </p>
          <p className="text-xs text-slate-500 mt-1">Complétion</p>
        </div>
      </div>
    </div>
  )
}
