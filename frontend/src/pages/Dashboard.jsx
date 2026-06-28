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
        <div className="text-gray-400 text-sm">Chargement…</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
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
        <h1 className="text-2xl font-bold text-gray-800">
          Bonjour, {user?.name?.split(' ')[0] || 'vous'} 👋
        </h1>
        <p className="text-gray-500 text-sm mt-1">Voici un aperçu de vos tâches</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total des tâches"
          value={totalTasks}
          subtitle="toutes les tâches"
          color="blue"
        />
        <StatCard
          title="Taux de complétion"
          value={`${completionRate}%`}
          subtitle={`${completedCount} tâche(s) terminée(s)`}
          color="green"
        />
        <StatCard
          title="En retard"
          value={overdueCount}
          subtitle="tâche(s) échue(s)"
          color="red"
        />
        <StatCard
          title="En cours"
          value={inProgressCount}
          subtitle="tâche(s) active(s)"
          color="orange"
        />
      </div>

      {/* Recent todos */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-700">Tâches récentes</h2>
          <button
            onClick={() => navigate('/todos')}
            className="text-sm text-blue-600 hover:underline font-medium"
          >
            Voir toutes les tâches →
          </button>
        </div>

        {recentTodos.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow text-gray-400">
            <p className="text-lg mb-2">Aucune tâche pour l'instant</p>
            <button
              onClick={() => navigate('/todos')}
              className="mt-2 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
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
