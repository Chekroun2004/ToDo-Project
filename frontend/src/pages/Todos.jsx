import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'
import TaskCard from '../components/TaskCard'

const PRIORITIES = ['', 'low', 'medium', 'high', 'urgent']
const STATUSES = ['', 'pending', 'in_progress', 'completed', 'cancelled']

const priorityLabels = { low: 'Faible', medium: 'Moyen', high: 'Élevé', urgent: 'Urgent' }
const statusLabels = { pending: 'À faire', in_progress: 'En cours', completed: 'Terminé', cancelled: 'Annulé' }

export default function Todos() {
  const navigate = useNavigate()
  const [todos, setTodos] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Filters
  const [filterStatus, setFilterStatus] = useState('')
  const [filterPriority, setFilterPriority] = useState('')
  const [filterCategory, setFilterCategory] = useState('')

  // Modal
  const [showModal, setShowModal] = useState(false)
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState('')
  const [newTodo, setNewTodo] = useState({
    title: '',
    description: '',
    priority: 'medium',
    dueDate: '',
    categoryId: '',
  })

  const fetchTodos = async () => {
    try {
      const res = await api.get('/todos')
      setTodos(res.data.data || [])
    } catch (err) {
      setError('Impossible de charger les tâches.')
    }
  }

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [todosRes, catsRes] = await Promise.all([
          api.get('/todos'),
          api.get('/categories'),
        ])
        setTodos(todosRes.data.data || [])
        setCategories(catsRes.data.data || [])
      } catch (err) {
        setError('Impossible de charger les données.')
      } finally {
        setLoading(false)
      }
    }
    fetchAll()
  }, [])

  const handleCreateChange = e => {
    setNewTodo(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleCreateSubmit = async e => {
    e.preventDefault()
    setCreateError('')
    setCreating(true)
    try {
      const payload = { ...newTodo }
      if (!payload.dueDate) delete payload.dueDate
      if (!payload.categoryId) delete payload.categoryId
      await api.post('/todos', payload)
      setShowModal(false)
      setNewTodo({ title: '', description: '', priority: 'medium', dueDate: '', categoryId: '' })
      await fetchTodos()
    } catch (err) {
      setCreateError(err.response?.data?.error || 'Erreur lors de la création.')
    } finally {
      setCreating(false)
    }
  }

  const filteredTodos = todos.filter(t => {
    if (filterStatus && t.status !== filterStatus) return false
    if (filterPriority && t.priority !== filterPriority) return false
    if (filterCategory && t.categoryId !== filterCategory) return false
    return true
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400 text-sm">Chargement…</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Mes Tâches</h1>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors"
        >
          + Nouvelle tâche
        </button>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 bg-white p-4 rounded-lg shadow">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Statut</label>
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Tous</option>
            {STATUSES.filter(Boolean).map(s => (
              <option key={s} value={s}>{statusLabels[s]}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Priorité</label>
          <select
            value={filterPriority}
            onChange={e => setFilterPriority(e.target.value)}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Toutes</option>
            {PRIORITIES.filter(Boolean).map(p => (
              <option key={p} value={p}>{priorityLabels[p]}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Catégorie</label>
          <select
            value={filterCategory}
            onChange={e => setFilterCategory(e.target.value)}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Toutes</option>
            {categories.map(c => (
              <option key={c._id} value={c._id}>{c.name}</option>
            ))}
          </select>
        </div>
        {(filterStatus || filterPriority || filterCategory) && (
          <div className="flex items-end">
            <button
              onClick={() => { setFilterStatus(''); setFilterPriority(''); setFilterCategory('') }}
              className="px-3 py-1.5 text-xs text-gray-500 hover:text-gray-700 underline"
            >
              Réinitialiser
            </button>
          </div>
        )}
      </div>

      {/* Todos grid */}
      {filteredTodos.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-lg shadow text-gray-400">
          <p className="text-base">Aucune tâche trouvée</p>
          {todos.length > 0 && (
            <p className="text-sm mt-1">Essayez de modifier vos filtres</p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTodos.map(todo => (
            <TaskCard
              key={todo._id}
              todo={todo}
              categories={categories}
              onClick={() => navigate(`/todos/${todo._id}`)}
            />
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-800">Nouvelle tâche</h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600 text-xl leading-none"
                >
                  ×
                </button>
              </div>

              {createError && (
                <div className="mb-3 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                  {createError}
                </div>
              )}

              <form onSubmit={handleCreateSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Titre *</label>
                  <input
                    type="text"
                    name="title"
                    value={newTodo.title}
                    onChange={handleCreateChange}
                    required
                    placeholder="Nom de la tâche"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    name="description"
                    value={newTodo.description}
                    onChange={handleCreateChange}
                    rows={3}
                    placeholder="Description optionnelle…"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Priorité</label>
                    <select
                      name="priority"
                      value={newTodo.priority}
                      onChange={handleCreateChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="low">Faible</option>
                      <option value="medium">Moyen</option>
                      <option value="high">Élevé</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date d'échéance</label>
                    <input
                      type="date"
                      name="dueDate"
                      value={newTodo.dueDate}
                      onChange={handleCreateChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Catégorie</label>
                  <select
                    name="categoryId"
                    value={newTodo.categoryId}
                    onChange={handleCreateChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Sans catégorie</option>
                    {categories.map(c => (
                      <option key={c._id} value={c._id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={creating}
                    className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-semibold rounded-lg transition-colors"
                  >
                    {creating ? 'Création…' : 'Créer'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
