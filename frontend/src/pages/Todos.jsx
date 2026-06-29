import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'
import TaskCard from '../components/TaskCard'

const PRIORITIES = ['', 'low', 'medium', 'high', 'urgent']
const STATUSES = ['', 'pending', 'in_progress', 'completed', 'cancelled']

const priorityLabels = { low: 'Faible', medium: 'Moyen', high: 'Élevé', urgent: 'Urgent' }
const statusLabels = { pending: 'À faire', in_progress: 'En cours', completed: 'Terminé', cancelled: 'Annulé' }

const selectClass = 'bg-white/5 border border-white/10 text-white rounded-xl px-3 py-1.5 text-sm focus:outline-none focus:border-violet-500 transition-all'
const inputClass = 'w-full px-3 py-2.5 bg-white/5 border border-white/10 text-white placeholder-slate-500 rounded-xl focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 text-sm transition-all'
const labelClass = 'block text-slate-400 text-sm font-medium mb-1'

export default function Todos() {
  const navigate = useNavigate()
  const [todos, setTodos] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [filterStatus, setFilterStatus] = useState('')
  const [filterPriority, setFilterPriority] = useState('')
  const [filterCategory, setFilterCategory] = useState('')

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
        <div className="text-slate-500 text-sm">Chargement…</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Mes Tâches</h1>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white text-sm font-semibold rounded-xl transition-all duration-200"
        >
          + Nouvelle tâche
        </button>
      </div>

      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl text-sm">{error}</div>
      )}

      <div className="glass rounded-2xl p-4 flex flex-wrap gap-4">
        <div>
          <label className={labelClass}>Statut</label>
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className={selectClass}
          >
            <option value="" className="bg-[#1a1a2e]">Tous</option>
            {STATUSES.filter(Boolean).map(s => (
              <option key={s} value={s} className="bg-[#1a1a2e]">{statusLabels[s]}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>Priorité</label>
          <select
            value={filterPriority}
            onChange={e => setFilterPriority(e.target.value)}
            className={selectClass}
          >
            <option value="" className="bg-[#1a1a2e]">Toutes</option>
            {PRIORITIES.filter(Boolean).map(p => (
              <option key={p} value={p} className="bg-[#1a1a2e]">{priorityLabels[p]}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>Catégorie</label>
          <select
            value={filterCategory}
            onChange={e => setFilterCategory(e.target.value)}
            className={selectClass}
          >
            <option value="" className="bg-[#1a1a2e]">Toutes</option>
            {categories.map(c => (
              <option key={c._id} value={c._id} className="bg-[#1a1a2e]">{c.name}</option>
            ))}
          </select>
        </div>
        {(filterStatus || filterPriority || filterCategory) && (
          <div className="flex items-end">
            <button
              onClick={() => { setFilterStatus(''); setFilterPriority(''); setFilterCategory('') }}
              className="px-3 py-1.5 text-xs text-slate-400 hover:text-white transition-colors underline"
            >
              Réinitialiser
            </button>
          </div>
        )}
      </div>

      {filteredTodos.length === 0 ? (
        <div className="glass rounded-2xl py-16 text-center">
          <p className="text-slate-500 text-base">Aucune tâche trouvée</p>
          {todos.length > 0 && (
            <p className="text-slate-600 text-sm mt-1">Essayez de modifier vos filtres</p>
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

      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass rounded-3xl p-6 w-full max-w-lg">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-white">Nouvelle tâche</h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-white text-xl leading-none transition-colors"
              >
                ×
              </button>
            </div>

            {createError && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl text-sm">
                {createError}
              </div>
            )}

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className={labelClass}>Titre *</label>
                <input
                  type="text"
                  name="title"
                  value={newTodo.title}
                  onChange={handleCreateChange}
                  required
                  placeholder="Nom de la tâche"
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>Description</label>
                <textarea
                  name="description"
                  value={newTodo.description}
                  onChange={handleCreateChange}
                  rows={3}
                  placeholder="Description optionnelle…"
                  className={`${inputClass} resize-none`}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Priorité</label>
                  <select
                    name="priority"
                    value={newTodo.priority}
                    onChange={handleCreateChange}
                    className={`${inputClass} cursor-pointer`}
                  >
                    <option value="low" className="bg-[#1a1a2e]">Faible</option>
                    <option value="medium" className="bg-[#1a1a2e]">Moyen</option>
                    <option value="high" className="bg-[#1a1a2e]">Élevé</option>
                    <option value="urgent" className="bg-[#1a1a2e]">Urgent</option>
                  </select>
                </div>

                <div>
                  <label className={labelClass}>Date d'échéance</label>
                  <input
                    type="date"
                    name="dueDate"
                    value={newTodo.dueDate}
                    onChange={handleCreateChange}
                    className={`${inputClass} [color-scheme:dark]`}
                  />
                </div>
              </div>

              <div>
                <label className={labelClass}>Catégorie</label>
                <select
                  name="categoryId"
                  value={newTodo.categoryId}
                  onChange={handleCreateChange}
                  className={`${inputClass} cursor-pointer`}
                >
                  <option value="" className="bg-[#1a1a2e]">Sans catégorie</option>
                  {categories.map(c => (
                    <option key={c._id} value={c._id} className="bg-[#1a1a2e]">{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 border border-white/10 text-slate-300 hover:text-white text-sm font-medium rounded-xl hover:bg-white/5 transition-all"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 py-2.5 bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-all duration-200"
                >
                  {creating ? 'Création…' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
