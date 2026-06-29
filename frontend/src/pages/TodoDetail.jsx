import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'
import PriorityBadge from '../components/PriorityBadge'

const inputClass = 'w-full px-3 py-2.5 bg-white/5 border border-white/10 text-white placeholder-slate-500 rounded-xl focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 text-sm transition-all'
const labelClass = 'block text-slate-400 text-sm font-medium mb-1'

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
        <div className="text-slate-500 text-sm">Chargement…</div>
      </div>
    )
  }

  if (!todo && !loading) {
    return (
      <div className="p-4 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl text-sm">
        Tâche introuvable.{' '}
        <button onClick={() => navigate('/todos')} className="underline hover:text-red-300 transition-colors">Retour aux tâches</button>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/todos')}
          className="text-slate-400 hover:text-white text-sm transition-colors"
        >
          ← Retour
        </button>
        <h1 className="text-xl font-bold text-white flex-1 truncate">{todo?.title}</h1>
        <PriorityBadge priority={todo?.priority} />
      </div>

      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl text-sm">{error}</div>
      )}
      {saveSuccess && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-xl text-sm">
          Tâche sauvegardée avec succès.
        </div>
      )}

      <div className="glass rounded-2xl p-6">
        <h2 className="text-base font-semibold text-white mb-5">Modifier la tâche</h2>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className={labelClass}>Titre *</label>
            <input
              type="text"
              name="title"
              value={form.title}
              onChange={handleChange}
              required
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>Description</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={4}
              className={`${inputClass} resize-none`}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Priorité</label>
              <select
                name="priority"
                value={form.priority}
                onChange={handleChange}
                className={`${inputClass} cursor-pointer`}
              >
                <option value="low" className="bg-[#1a1a2e]">Faible</option>
                <option value="medium" className="bg-[#1a1a2e]">Moyen</option>
                <option value="high" className="bg-[#1a1a2e]">Élevé</option>
                <option value="urgent" className="bg-[#1a1a2e]">Urgent</option>
              </select>
            </div>

            <div>
              <label className={labelClass}>Statut</label>
              <select
                name="status"
                value={form.status}
                onChange={handleChange}
                className={`${inputClass} cursor-pointer`}
              >
                <option value="pending" className="bg-[#1a1a2e]">À faire</option>
                <option value="in_progress" className="bg-[#1a1a2e]">En cours</option>
                <option value="completed" className="bg-[#1a1a2e]">Terminé</option>
                <option value="cancelled" className="bg-[#1a1a2e]">Annulé</option>
              </select>
            </div>

            <div>
              <label className={labelClass}>Date d'échéance</label>
              <input
                type="date"
                name="dueDate"
                value={form.dueDate}
                onChange={handleChange}
                className={`${inputClass} [color-scheme:dark]`}
              />
            </div>

            <div>
              <label className={labelClass}>Catégorie</label>
              <select
                name="categoryId"
                value={form.categoryId}
                onChange={handleChange}
                className={`${inputClass} cursor-pointer`}
              >
                <option value="" className="bg-[#1a1a2e]">Sans catégorie</option>
                {categories.map(c => (
                  <option key={c._id} value={c._id} className="bg-[#1a1a2e]">{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2.5 bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-all duration-200"
            >
              {saving ? 'Sauvegarde…' : 'Sauvegarder'}
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="px-4 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-sm font-semibold rounded-xl transition-all border border-red-500/30 disabled:opacity-50"
            >
              {deleting ? 'Suppression…' : 'Supprimer'}
            </button>
          </div>
        </form>
      </div>

      <div className="glass rounded-2xl p-6">
        <h2 className="text-base font-semibold text-white mb-5">
          Commentaires ({comments.length})
        </h2>

        {comments.length === 0 ? (
          <p className="text-sm text-slate-500 mb-4">Aucun commentaire pour l'instant.</p>
        ) : (
          <div className="space-y-3 mb-4">
            {comments.map(comment => (
              <div key={comment._id} className="flex gap-3">
                <div className="w-7 h-7 shrink-0 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-xs font-semibold text-white">
                  {comment.author?.name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <div className="flex-1 bg-white/5 rounded-xl px-4 py-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold text-slate-300">
                      {comment.author?.name || 'Utilisateur'}
                    </span>
                    <span className="text-xs text-slate-500">
                      {comment.createdAt
                        ? new Date(comment.createdAt).toLocaleDateString('fr-FR', {
                            day: '2-digit', month: 'short', year: 'numeric',
                            hour: '2-digit', minute: '2-digit'
                          })
                        : ''}
                    </span>
                  </div>
                  <p className="text-sm text-slate-300">{comment.content}</p>
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
            className={`flex-1 ${inputClass} resize-none`}
          />
          <button
            type="submit"
            disabled={postingComment || !newComment.trim()}
            className="px-4 py-2.5 bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-all duration-200 self-end"
          >
            {postingComment ? '…' : 'Commenter'}
          </button>
        </form>
      </div>
    </div>
  )
}
