import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'
import StatCard from '../components/StatCard'
import TaskCard from '../components/TaskCard'

export default function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)
  const [todos, setTodos] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, todosRes, catsRes] = await Promise.all([
          api.get(`/stats/user/${user.id}`),
          api.get('/todos'),
          api.get('/categories'),
        ])
        setStats(statsRes.data.data)
        setTodos(todosRes.data.data || [])
        setCategories(catsRes.data.data || [])
      } catch (err) {
        setError('Impossible de charger les données.')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [user.id])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-500 text-sm">Chargement…</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl text-sm">
        {error}
      </div>
    )
  }

  const totalTasks = stats?.totalTasks ?? todos.length
  const completedCount = stats?.byStatus?.completed ?? 0
  const completionRate = stats?.completionRate ?? (totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0)
  const overdueCount = stats?.overdueTasks ?? 0
  const inProgressCount = stats?.byStatus?.in_progress ?? 0

  const recentTodos = [...todos]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5)

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">
          Bonjour, {user?.name?.split(' ')[0] || 'vous'} 👋
        </h1>
        <p className="text-slate-400 text-sm mt-1">Voici un aperçu de vos tâches</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total des tâches"
          value={totalTasks}
          subtitle="toutes les tâches"
          color="blue"
          icon="📋"
        />
        <StatCard
          title="Taux de complétion"
          value={`${completionRate}%`}
          subtitle={`${completedCount} tâche(s) terminée(s)`}
          color="green"
          icon="✅"
        />
        <StatCard
          title="En retard"
          value={overdueCount}
          subtitle="tâche(s) échue(s)"
          color="red"
          icon="⚠️"
        />
        <StatCard
          title="En cours"
          value={inProgressCount}
          subtitle="tâche(s) active(s)"
          color="orange"
          icon="⚡"
        />
      </div>

      {totalTasks > 0 && (
        <div className="glass rounded-2xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-400 text-sm">Progression globale</span>
            <span className="text-white text-sm font-semibold">{completionRate}%</span>
          </div>
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-violet-600 rounded-full transition-all duration-500"
              style={{ width: `${completionRate}%` }}
            />
          </div>
        </div>
      )}

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Tâches récentes</h2>
          <button
            onClick={() => navigate('/todos')}
            className="text-indigo-400 hover:text-indigo-300 text-sm font-medium transition-colors"
          >
            Voir toutes les tâches →
          </button>
        </div>

        {recentTodos.length === 0 ? (
          <div className="glass rounded-2xl py-16 text-center">
            <p className="text-slate-500 text-base mb-4">Aucune tâche pour l'instant</p>
            <button
              onClick={() => navigate('/todos')}
              className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white text-sm font-semibold rounded-xl transition-all duration-200"
            >
              Créer une tâche
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentTodos.map(todo => (
              <TaskCard
                key={todo._id}
                todo={todo}
                categories={categories}
                onClick={() => navigate(`/todos/${todo._id}`)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
