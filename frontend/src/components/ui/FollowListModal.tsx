'use client'

import { useState, useEffect } from 'react'
import { Avatar } from '@/components/ui/Avatar'
import { api } from '@/lib/api-client'
import { mediaUrl } from '@/lib/utils'
import Link from 'next/link'

interface FollowUser {
  id: string
  email: string
  role: string
  avatar?: string
  // profile fields resolved by the follows service
  name?: string
  headline?: string
  specialty?: string
}

interface FollowListModalProps {
  userId: string
  mode: 'followers' | 'following'
  onClose: () => void
}

const roleLabel: Record<string, string> = {
  STUDENT: 'Estudiante',
  EMPRESA: 'Empresa',
  COLEGIO: 'Institución',
}

const roleIcon: Record<string, string> = {
  STUDENT: 'school',
  EMPRESA: 'business',
  COLEGIO: 'account_balance',
}

export function FollowListModal({ userId, mode, onClose }: FollowListModalProps) {
  const [users, setUsers]   = useState<FollowUser[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const endpoint = mode === 'followers'
      ? `/follows/followers/${userId}`
      : `/follows/following/${userId}`

    api.get<FollowUser[]>(endpoint)
      .then(data => setUsers(Array.isArray(data) ? data : []))
      .catch(() => setUsers([]))
      .finally(() => setLoading(false))
  }, [userId, mode])

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-md max-h-[80vh] flex flex-col rounded-2xl bg-surface shadow-2xl animate-slide-up overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant/15">
          <h2 className="font-headline font-bold text-on-surface text-lg">
            {mode === 'followers' ? 'Seguidores' : 'Siguiendo'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-on-surface-variant hover:bg-surface-container-high transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1">
          {loading ? (
            <div className="flex flex-col gap-3 p-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl animate-pulse">
                  <div className="w-10 h-10 rounded-full bg-surface-container-high shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-surface-container-high rounded w-2/3" />
                    <div className="h-2.5 bg-surface-container-high rounded w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : users.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
              <span className="material-symbols-outlined text-[48px] text-outline mb-3">
                {mode === 'followers' ? 'group_off' : 'person_search'}
              </span>
              <p className="font-semibold text-on-surface text-sm">
                {mode === 'followers' ? 'Sin seguidores aún' : 'No sigue a nadie aún'}
              </p>
              <p className="text-xs text-outline mt-1">
                {mode === 'followers'
                  ? 'Cuando alguien te siga, aparecerá aquí.'
                  : 'Cuando siga a alguien, aparecerá aquí.'}
              </p>
            </div>
          ) : (
            <ul className="p-2">
              {users.map(u => (
                <li key={u.id}>
                  <Link
                    href={`/student/ver/${u.id}`}
                    onClick={onClose}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-surface-container transition-colors group"
                  >
                    <Avatar
                      src={u.avatar ? mediaUrl(u.avatar) : undefined}
                      name={u.name ?? u.email}
                      size="md"
                      shape={u.role === 'COLEGIO' ? 'rounded' : 'circle'}
                      className="shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-on-surface truncate group-hover:text-primary transition-colors">
                        {u.name ?? u.email.split('@')[0]}
                      </p>
                      {u.headline && (
                        <p className="text-xs text-on-surface-variant truncate mt-0.5">{u.headline}</p>
                      )}
                      {u.specialty && (
                        <p className="text-xs text-outline truncate">{u.specialty}</p>
                      )}
                    </div>
                    <span className="shrink-0 material-symbols-outlined text-[14px] text-primary icon-filled">
                      {roleIcon[u.role] ?? 'person'}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
