'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api-client'
import { useAuthStore } from '@/store/auth.store'
import { timeAgo } from '@/lib/utils'

interface Notification {
  id: string
  type: string
  title: string
  body: string
  isRead: boolean
  link?: string
  createdAt: string
}

const typeIcon: Record<string, { icon: string; color: string }> = {
  SKILL_VALIDATED:    { icon: 'verified',      color: 'text-green-500' },
  SKILL_REJECTED:     { icon: 'cancel',        color: 'text-red-500' },
  APPLICATION_STATUS: { icon: 'work',          color: 'text-blue-500' },
  NEW_MESSAGE:        { icon: 'mail',          color: 'text-violet-500' },
  LIKE:               { icon: 'favorite',      color: 'text-red-500' },
  COMMENT:            { icon: 'mode_comment',  color: 'text-primary' },
  FOLLOW:             { icon: 'person_add',    color: 'text-primary' },
  GENERAL:            { icon: 'notifications', color: 'text-outline' },
}

export default function ColegioNotificacionesPage() {
  const { isAuthenticated } = useAuthStore()
  const router = useRouter()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(() => {
    if (!isAuthenticated) { setLoading(false); return }
    api.get<Notification[]>('/notifications')
      .then(data => setNotifications(data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [isAuthenticated])

  useEffect(() => { load() }, [load])

  const markRead = async (id: string) => {
    await api.patch(`/notifications/${id}/read`, {}).catch(() => {})
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n))
  }

  const markAllRead = async () => {
    await api.patch('/notifications/read-all', {}).catch(() => {})
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
  }

  const remove = async (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
    api.delete(`/notifications/${id}`).catch(() => { load() })
  }

  const unreadCount = notifications.filter(n => !n.isRead).length

  if (loading) {
    return (
      <main className="max-w-2xl mx-auto px-6 py-10">
        <div className="h-9 w-56 bg-surface-container rounded-lg animate-pulse mb-8" />
        {[1, 2, 3].map(i => (
          <div key={i} className="card p-5 mb-3 animate-pulse flex gap-4">
            <div className="w-10 h-10 rounded-full bg-surface-container-low shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-48 bg-surface-container rounded" />
              <div className="h-3 w-full bg-surface-container-low rounded" />
            </div>
          </div>
        ))}
      </main>
    )
  }

  return (
    <main className="max-w-2xl mx-auto px-6 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-headline text-3xl font-bold text-on-surface">Notificaciones</h1>
          {unreadCount > 0 && (
            <p className="text-sm text-on-surface-variant mt-1">{unreadCount} sin leer</p>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className="text-xs font-semibold text-primary hover:underline"
          >
            Marcar todas como leídas
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <span className="material-symbols-outlined text-[64px] text-outline">notifications_off</span>
          <h2 className="font-headline text-xl font-bold text-on-surface mt-4">Sin notificaciones</h2>
          <p className="text-on-surface-variant text-sm mt-2">
            Aquí verás actualizaciones sobre validaciones y mensajes.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map(notif => {
            const { icon, color } = typeIcon[notif.type] ?? typeIcon.GENERAL
            return (
              <article
                key={notif.id}
                onClick={() => {
                  if (!notif.isRead) markRead(notif.id)
                  if (notif.link) router.push(notif.link)
                }}
                className={`card p-4 flex items-start gap-4 cursor-pointer transition-all hover:shadow-md ${
                  notif.isRead ? 'opacity-70' : 'border-l-4 border-primary'
                }`}
              >
                <div className={`w-10 h-10 rounded-full bg-surface-container flex items-center justify-center shrink-0 ${color}`}>
                  <span className="material-symbols-outlined text-[20px] icon-filled">{icon}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold text-on-surface leading-snug">{notif.title}</p>
                    <div className="flex items-center gap-1 shrink-0">
                      {!notif.isRead && (
                        <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
                      )}
                      <button
                        onClick={e => { e.stopPropagation(); remove(notif.id) }}
                        className="p-0.5 text-outline hover:text-error rounded transition-colors"
                        title="Eliminar"
                      >
                        <span className="material-symbols-outlined text-[16px]">close</span>
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-on-surface-variant mt-0.5 leading-relaxed">{notif.body}</p>
                  <p className="text-[11px] text-outline mt-1.5">{timeAgo(notif.createdAt)}</p>
                </div>
              </article>
            )
          })}
        </div>
      )}
    </main>
  )
}
