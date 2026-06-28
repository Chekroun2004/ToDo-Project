import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'

const typeConfig = {
  overdue: { label: 'En retard', className: 'bg-red-100 text-red-700', icon: '⚠️' },
  due_soon: { label: 'Échéance proche', className: 'bg-orange-100 text-orange-700', icon: '🔔' },
  default: { label: 'Notification', className: 'bg-blue-100 text-blue-700', icon: '📋' },
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
        <div className="text-gray-400 text-sm">Chargement…</div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Notifications</h1>
          {unreadCount > 0 && (
            <p className="text-sm text-gray-500 mt-1">{unreadCount} non lue(s)</p>
          )}
        </div>
        <div className="flex gap-2">
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              disabled={markingAll}
              className="px-3 py-1.5 text-sm bg-blue-50 text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors disabled:opacity-50"
            >
              {markingAll ? '…' : 'Tout marquer comme lu'}
            </button>
          )}
          {notifications.some(n => n.isRead || n.read) && (
            <button
              onClick={handleClearRead}
              disabled={clearing}
              className="px-3 py-1.5 text-sm bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50"
            >
              {clearing ? '…' : 'Supprimer les lues'}
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>
      )}

      {notifications.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl shadow text-gray-400">
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
                className={`bg-white rounded-xl shadow p-4 border-l-4 transition-opacity ${
                  isRead ? 'border-gray-200 opacity-60' : 'border-blue-500'
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
                        <span className="text-xs text-gray-400">Lu</span>
                      )}
                    </div>
                    <p className="mt-1 text-sm font-medium text-gray-800 truncate">
                      {notification.title || notification.todoTitle || notification.message || 'Notification'}
                    </p>
                    {notification.body && (
                      <p className="text-xs text-gray-500 mt-0.5">{notification.body}</p>
                    )}
                    <p className="text-xs text-gray-400 mt-1.5">
                      {formatDate(notification.createdAt || notification.sentAt)}
                    </p>
                  </div>
                  {!isRead && (
                    <div className="w-2 h-2 rounded-full bg-blue-500 shrink-0 mt-1.5" />
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
