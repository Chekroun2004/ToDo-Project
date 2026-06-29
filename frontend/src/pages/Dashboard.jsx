import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'
import StatCard from '../components/StatCard'
import TaskCard from '../components/TaskCard'

function Greeting({ name }) {
  const hour = new Date().getHours()
  const label = hour < 12 ? 'Bonjour' : hour < 18 ? 'Bon après-midi' : 'Bonsoir'
  return `${label}, ${name?.split(' ')[0] || 'vous'} 👋`
}

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
        <div className="flex gap-1.5">
          <div className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-2 h-2 rounded-full bg-violet-500 animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-2 h-2 rounded-full bg-cyan-500 animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    )
  }

  if (error) {
    return <div className="p-4 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl text-sm">{error}</div>
  }

  const totalTasks = stats?.totalTasks ?? todos.length
  const completedCount = stats?.byStatus?.completed ?? 0
  const completionRate = stats?.completionRate ?? (totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0)
  const overdueCount = stats?.overdueTasks ?? 0
  const inProgressCount = stats?.byStatus?.in_progress ?? 0

  const recentTodos = [...todos]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 6)

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="animate-in">
        <h1 className="text-3xl font-black text-white">
          <Greeting name={user?.name} />
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          {totalTasks === 0
            ? 'Aucune tâche pour l\'instant — commencez !'
            : `${completedCount} tâche${completedCount > 1 ? 's' : ''} terminée${completedCount > 1 ? 's' : ''} sur ${totalTasks}`}
        </p>
      </div>

      {/* Stat cards with stagger */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="stagger-1"><StatCard title="Total des tâches" value={totalTasks} subtitle="toutes les tâches" color="blue" icon="📋" /></div>
        <div className="stagger-2"><StatCard title="Taux de complétion" value={`${completionRate}%`} subtitle={`${completedCount} terminée(s)`} color="green" icon="✅" /></div>
        <div className="stagger-3"><StatCard title="En retard" value={overdueCount} subtitle="tâche(s) échue(s)" color="red" icon="⚠️" /></div>
        <div className="stagger-4"><StatCard title="En cours" value={inProgressCount} subtitle="tâche(s) active(s)" color="orange" icon="⚡" /></div>
      </div>

      {/* Progress bar */}
      {totalTasks > 0 && (
        <div className="glass rounded-2xl p-5 animate-in stagger-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-slate-300 text-sm font-medium">Progression globale</span>
            <span className="text-white text-sm font-bold">{completionRate}%</span>
          </div>
          <div className="h-2.5 bg-white/8 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 via-violet-500 to-cyan-500 rounded-full progress-grow"
              style={{ width: `${completionRate}%` }}
            />
          </div>
          <div className="flex justify-between mt-2 text-xs text-slate-600">
            <span>0%</span>
            <span>100%</span>
          </div>
        </div>
      )}

      {/* Recent todos */}
      <div className="animate-in stagger-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white">Tâches récentes</h2>
          <button
            onClick={() => navigate('/todos')}
            className="text-indigo-400 hover:text-indigo-300 text-sm font-semibold transition-colors flex items-center gap-1"
          >
            Voir tout <span>→</span>
          </button>
        </div>

        {recentTodos.length === 0 ? (
          <div className="glass rounded-2xl py-16 text-center">
            <p className="text-4xl mb-4">✨</p>
            <p className="text-slate-400 text-base mb-5">Aucune tâche pour l'instant</p>
            <button
              onClick={() => navigate('/todos')}
              className="px-6 py-2.5 bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-400 hover:to-violet-500 text-white text-sm font-semibold rounded-xl transition-all shadow-lg shadow-indigo-500/25 hover:-translate-y-0.5"
            >
              Créer ma première tâche →
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentTodos.map((todo, i) => (
              <TaskCard
                key={todo._id}
                todo={todo}
                categories={categories}
                onClick={() => navigate(`/todos/${todo._id}`)}
                className={`stagger-${Math.min(i + 1, 6)}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
