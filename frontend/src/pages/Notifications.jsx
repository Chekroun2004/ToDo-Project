import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'

const typeConfig = {
  overdue: { label: 'En retard', className: 'bg-red-500/15 text-red-400 border border-red-500/30', icon: '⚠️' },
  due_soon: { label: 'Échéance proche', className: 'bg-amber-500/15 text-amber-400 border border-amber-500/30', icon: '🔔' },
  default: { label: 'Notification', className: 'bg-blue-500/15 text-blue-400 border border-blue-500/30', icon: '📋' },
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: '2-digit', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })
}

export default function Notifications() {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [markingAll, setMarkingAll] = useState(false)
  const [clearing, setClearing] = useState(false)

  const fetchNotifications = async () => {
    try {
      const res = await api.get(`/notifications/${user.id}`)
      setNotifications(res.data.data || [])
    } catch (err) {
      setError('Impossible de charger les notifications.')
    }
  }

  useEffect(() => {
    const init = async () => {
      await fetchNotifications()
      setLoading(false)
    }
    init()
  }, [user.id])

  const handleMarkAllRead = async () => {
    setMarkingAll(true)
    try {
      const unread = notifications.filter(n => !n.isRead && !n.read)
      await Promise.all(
        unread.map(n => api.put(`/notifications/${n._id}/read`))
      )
      setNotifications(prev =>
        prev.map(n => ({ ...n, isRead: true, read: true }))
      )
    } catch (err) {
      setError('Erreur lors du marquage des notifications.')
    } finally {
      setMarkingAll(false)
    }
  }

  const handleClearRead = async () => {
    if (!window.confirm('Supprimer toutes les notifications lues ?')) return
    setClearing(true)
    try {
      await api.delete(`/notifications/clear/${user.id}`)
      setNotifications(prev => prev.filter(n => !n.isRead && !n.read))
    } catch (err) {
      setError('Erreur lors de la suppression des notifications.')
    } finally {
      setClearing(false)
    }
  }

  const unreadCount = notifications.filter(n => !n.isRead && !n.read).length

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-500 text-sm">Chargement…</div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Notifications</h1>
          {unreadCount > 0 && (
            <p className="text-sm text-slate-400 mt-1">{unreadCount} non lue(s)</p>
          )}
        </div>
        <div className="flex gap-2">
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              disabled={markingAll}
              className="px-3 py-1.5 text-sm bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 rounded-xl transition-all disabled:opacity-50"
            >
              {markingAll ? '…' : 'Tout marquer comme lu'}
            </button>
          )}
          {notifications.some(n => n.isRead || n.read) && (
            <button
              onClick={handleClearRead}
              disabled={clearing}
              className="px-3 py-1.5 text-sm bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 rounded-xl transition-all disabled:opacity-50"
            >
              {clearing ? '…' : 'Supprimer les lues'}
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl text-sm">{error}</div>
      )}

      {notifications.length === 0 ? (
        <div className="glass rounded-2xl py-16 text-center text-slate-500">
          <p className="text-4xl mb-3">🔕</p>
          <p className="text-base font-medium">Aucune notification</p>
          <p className="text-sm mt-1">Vous êtes à jour !</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map(notification => {
            const isRead = notification.isRead || notification.read
            const type = typeConfig[notification.type] || typeConfig['default']
            return (
              <div
                key={notification._id}
                className={`glass rounded-2xl p-4 border-l-4 transition-all ${
                  isRead ? 'border-white/10 opacity-50' : 'border-indigo-500'
                }`}
              >
                <div className="flex items-start gap-3">
                  <span className="text-xl">{type.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${type.className}`}>
                        {type.label}
                      </span>
                      {isRead && (
                        <span className="text-xs text-slate-500">Lu</span>
                      )}
                    </div>
                    <p className="mt-1 text-sm font-medium text-white truncate">
                      {notification.title || notification.todoTitle || notification.message || 'Notification'}
                    </p>
                    {notification.body && (
                      <p className="text-xs text-slate-400 mt-0.5">{notification.body}</p>
                    )}
                    <p className="text-xs text-slate-500 mt-1.5">
                      {formatDate(notification.createdAt || notification.sentAt)}
                    </p>
                  </div>
                  {!isRead && (
                    <div className="w-2 h-2 rounded-full bg-indigo-500 shrink-0 mt-1.5" />
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
