import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'
import PriorityBadge from '../components/PriorityBadge'

function formatDateInput(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr).toISOString().split('T')[0]
}

function formatDateDisplay(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: '2-digit', month: 'long', year: 'numeric'
  })
}

export default function TodoDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [todo, setTodo] = useState(null)
  const [categories, setCategories] = useState([])
  const [comments, setComments] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')
  const [saveSuccess, setSaveSuccess] = useState(false)

  const [form, setForm] = useState({
    title: '',
    description: '',
    priority: 'medium',
    status: 'pending',
    dueDate: '',
    categoryId: '',
  })

  const [newComment, setNewComment] = useState('')
  const [postingComment, setPostingComment] = useState(false)

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [todoRes, commentsRes, catsRes] = await Promise.all([
          api.get(`/todos/${id}`),
          api.get(`/comments/todo/${id}`),
          api.get('/categories'),
        ])
        const t = todoRes.data.data
        setTodo(t)
        setForm({
          title: t.title || '',
          description: t.description || '',
          priority: t.priority || 'medium',
          status: t.status || 'pending',
          dueDate: formatDateInput(t.dueDate),
          categoryId: t.categoryId || '',
        })
        setComments(commentsRes.data.data || [])
        setCategories(catsRes.data.data || [])
      } catch (err) {
        setError('Impossible de charger la tâche.')
      } finally {
        setLoading(false)
      }
    }
    fetchAll()
  }, [id])

  const handleChange = e => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSave = async e => {
    e.preventDefault()
    setError('')
    setSaving(true)
    setSaveSuccess(false)
    try {
      const payload = { ...form }
      if (!payload.dueDate) delete payload.dueDate
      if (!payload.categoryId) delete payload.categoryId
      const res = await api.put(`/todos/${id}`, payload)
      setTodo(res.data.data)
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors de la sauvegarde.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!window.confirm('Supprimer cette tâche ? Cette action est irréversible.')) return
    setDeleting(true)
    try {
      await api.delete(`/todos/${id}`)
      navigate('/todos')
    } catch (err) {
      setError('Impossible de supprimer la tâche.')
      setDeleting(false)
    }
  }

  const handleCommentSubmit = async e => {
    e.preventDefault()
    if (!newComment.trim()) return
    setPostingComment(true)
    try {
      const res = await api.post('/comments', {
        todoId: id,
        content: newComment.trim(),
      })
      setComments(prev => [...prev, res.data.data])
      setNewComment('')
    } catch (err) {
      console.error('Erreur commentaire', err)
    } finally {
      setPostingComment(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400 text-sm">Chargement…</div>
      </div>
    )
  }

  if (!todo && !loading) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
        Tâche introuvable.{' '}
        <button onClick={() => navigate('/todos')} className="underline">Retour aux tâches</button>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/todos')}
          className="text-gray-400 hover:text-gray-600 text-sm"
        >
          ← Retour
        </button>
        <h1 className="text-xl font-bold text-gray-800 flex-1 truncate">{todo?.title}</h1>
        <PriorityBadge priority={todo?.priority} />
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>
      )}
      {saveSuccess && (
        <div className="p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">
          Tâche sauvegardée avec succès.
        </div>
      )}

      {/* Edit form */}
      <div className="bg-white rounded-xl shadow p-6">
        <h2 className="text-base font-semibold text-gray-700 mb-4">Modifier la tâche</h2>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Titre *</label>
            <input
              type="text"
              name="title"
              value={form.title}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Priorité</label>
              <select
                name="priority"
                value={form.priority}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="low">Faible</option>
                <option value="medium">Moyen</option>
                <option value="high">Élevé</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
              <select
                name="status"
                value={form.status}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="pending">À faire</option>
                <option value="in_progress">En cours</option>
                <option value="completed">Terminé</option>
                <option value="cancelled">Annulé</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date d'échéance</label>
              <input
                type="date"
                name="dueDate"
                value={form.dueDate}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Catégorie</label>
              <select
                name="categoryId"
                value={form.categoryId}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Sans catégorie</option>
                {categories.map(c => (
                  <option key={c._id} value={c._id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-semibold rounded-lg transition-colors"
            >
              {saving ? 'Sauvegarde…' : 'Sauvegarder'}
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 text-sm font-semibold rounded-lg transition-colors border border-red-200"
            >
              {deleting ? 'Suppression…' : 'Supprimer'}
            </button>
          </div>
        </form>
      </div>

      {/* Comments */}
      <div className="bg-white rounded-xl shadow p-6">
        <h2 className="text-base font-semibold text-gray-700 mb-4">
          Commentaires ({comments.length})
        </h2>

        {comments.length === 0 ? (
          <p className="text-sm text-gray-400 mb-4">Aucun commentaire pour l'instant.</p>
        ) : (
          <div className="space-y-3 mb-4">
            {comments.map(comment => (
              <div key={comment._id} className="flex gap-3">
                <div className="w-7 h-7 shrink-0 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-semibold">
                  {comment.author?.name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <div className="flex-1 bg-gray-50 rounded-lg px-4 py-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold text-gray-700">
                      {comment.author?.name || 'Utilisateur'}
                    </span>
                    <span className="text-xs text-gray-400">
                      {comment.createdAt
                        ? new Date(comment.createdAt).toLocaleDateString('fr-FR', {
                            day: '2-digit', month: 'short', year: 'numeric',
                            hour: '2-digit', minute: '2-digit'
                          })
                        : ''}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{comment.content}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        <form onSubmit={handleCommentSubmit} className="flex gap-3">
          <textarea
            value={newComment}
            onChange={e => setNewComment(e.target.value)}
            placeholder="Écrire un commentaire…"
            rows={2}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
          <button
            type="submit"
            disabled={postingComment || !newComment.trim()}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-semibold rounded-lg transition-colors self-end"
          >
            {postingComment ? '…' : 'Commenter'}
          </button>
        </form>
      </div>
    </div>
  )
}
