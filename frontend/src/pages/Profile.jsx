import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'

const inputClass = 'w-full px-3 py-2.5 bg-white/5 border border-white/10 text-white placeholder-slate-500 rounded-xl focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 text-sm transition-all'
const labelClass = 'block text-slate-400 text-sm font-medium mb-1'

export default function Profile() {
  const { user, login, token } = useAuth()
  const [form, setForm] = useState({ name: '', avatar_url: '', bio: '' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get(`/users/${user.id}`)
        const u = res.data.data
        setForm({
          name: u.name || '',
          avatar_url: u.avatar_url || '',
          bio: u.bio || '',
        })
      } catch (err) {
        setError('Impossible de charger le profil.')
      } finally {
        setLoading(false)
      }
    }
    fetchProfile()
  }, [user.id])

  const handleChange = e => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async e => {
    e.preventDefault()
    setError('')
    setSuccess(false)
    setSaving(true)
    try {
      const res = await api.put(`/users/${user.id}`, form)
      const updatedUser = res.data.data
      const refreshToken = localStorage.getItem('refreshToken')
      login(updatedUser, token, refreshToken)
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors de la sauvegarde.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-500 text-sm">Chargement…</div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-white">Mon Profil</h1>

      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl text-sm">{error}</div>
      )}
      {success && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-xl text-sm">
          Profil mis à jour avec succès.
        </div>
      )}

      <div className="glass rounded-2xl p-6">
        <div className="flex items-center gap-4 mb-6 pb-6 border-b border-white/10">
          {form.avatar_url ? (
            <img
              src={form.avatar_url}
              alt="Avatar"
              className="w-16 h-16 rounded-full object-cover border border-white/10"
              onError={e => { e.target.style.display = 'none' }}
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-2xl font-bold text-white">
              {form.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
          )}
          <div>
            <p className="font-semibold text-white">{form.name || 'Sans nom'}</p>
            <p className="text-sm text-slate-400">{user?.email}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={labelClass}>Email</label>
            <input
              type="email"
              value={user?.email || ''}
              disabled
              className="w-full px-3 py-2.5 bg-white/3 border border-white/5 text-slate-500 rounded-xl text-sm cursor-not-allowed"
            />
            <p className="text-xs text-slate-600 mt-1">L'email ne peut pas être modifié.</p>
          </div>

          <div>
            <label className={labelClass}>Nom complet *</label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              required
              placeholder="Votre nom"
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>URL de l'avatar</label>
            <input
              type="url"
              name="avatar_url"
              value={form.avatar_url}
              onChange={handleChange}
              placeholder="https://exemple.com/avatar.jpg"
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>Biographie</label>
            <textarea
              name="bio"
              value={form.bio}
              onChange={handleChange}
              rows={3}
              placeholder="Quelques mots sur vous…"
              className={`${inputClass} resize-none`}
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full py-2.5 bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 disabled:opacity-50 text-white font-semibold rounded-xl transition-all duration-200 text-sm"
          >
            {saving ? 'Sauvegarde…' : 'Sauvegarder le profil'}
          </button>
        </form>
      </div>
    </div>
  )
}
