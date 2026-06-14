'use client'

import { useState, useEffect, useRef } from 'react'
import { Avatar } from '@/components/ui/Avatar'
import { api } from '@/lib/api-client'
import { useAuthStore } from '@/store/auth.store'
import { mediaUrl } from '@/lib/utils'
import Link from 'next/link'

interface SearchResult {
  userId: string
  role: string
  name: string
  avatar?: string
  extra?: string
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

export default function BuscarPage() {
  const { isAuthenticated, user } = useAuthStore()
  const [query,   setQuery]   = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [following, setFollowing] = useState<Set<string>>(new Set())
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Pre-load who the current user already follows
  useEffect(() => {
    if (!isAuthenticated) return
    api.get<string[]>('/follows/following-ids')
      .then(ids => setFollowing(new Set(ids)))
      .catch(() => {})
  }, [isAuthenticated])

  const doSearch = async (q: string) => {
    if (!q.trim()) { setResults([]); return }
    setLoading(true)
    try {
      const data = await api.get<SearchResult[]>(`/users/search?q=${encodeURIComponent(q)}`)
      // Filter out self
      setResults(data.filter(r => r.userId !== user?.id))
    } catch { /* silencioso */ }
    finally { setLoading(false) }
  }

  const handleSearch = (value: string) => {
    setQuery(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => doSearch(value), 300)
  }

  const handleFollow = async (userId: string) => {
    try {
      await api.post(`/follows/${userId}`, {})
      setFollowing(prev => new Set(Array.from(prev).concat(userId)))
    } catch { /* silencioso */ }
  }

  const handleUnfollow = async (userId: string) => {
    try {
      await api.delete(`/follows/${userId}`)
      setFollowing(prev => { const s = new Set(prev); s.delete(userId); return s })
    } catch { /* silencioso */ }
  }

  return (
    <main className="max-w-2xl mx-auto px-6 py-10">
      <div className="mb-8">
        <h1 className="font-headline text-3xl font-bold text-on-surface mb-2">Buscar usuarios</h1>
        <p className="text-on-surface-variant text-sm">Encuentra estudiantes, empresas e instituciones</p>
      </div>

      {/* Search input */}
      <div className="flex items-center bg-surface-container-low border border-outline-variant/30 hover:border-primary/40 focus-within:border-primary/60 px-4 py-3 rounded-xl gap-3 mb-8">
        <span className="material-symbols-outlined text-outline text-[22px]">search</span>
        <input
          type="text"
          value={query}
          onChange={e => handleSearch(e.target.value)}
          placeholder="Buscar por nombre, especialidad..."
          autoFocus
          className="bg-transparent border-none outline-none text-sm w-full placeholder:text-outline font-body text-on-surface text-base"
        />
        {loading && (
          <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        )}
        {query && !loading && (
          <button onClick={() => handleSearch('')} className="text-outline hover:text-on-surface">
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        )}
      </div>

      {/* Results */}
      {results.length === 0 && query && !loading ? (
        <div className="flex flex-col items-center py-16 text-center">
          <span className="material-symbols-outlined text-[48px] text-outline mb-3">search_off</span>
          <p className="text-on-surface-variant">Sin resultados para &ldquo;{query}&rdquo;</p>
        </div>
      ) : (
        <div className="space-y-3">
          {results.map(result => {
            const isFollowed = following.has(result.userId)
            return (
              <div key={result.userId} className="card p-4 flex items-center gap-4">
                <Link href={`/student/ver/${result.userId}`} className="shrink-0">
                  <Avatar
                    src={result.avatar ? mediaUrl(result.avatar) : undefined}
                    name={result.name}
                    size="md"
                    shape={result.role === 'COLEGIO' ? 'rounded' : 'circle'}
                  />
                </Link>
                <Link href={`/student/ver/${result.userId}`} className="flex-1 min-w-0 hover:opacity-80 transition-opacity">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-on-surface text-sm">{result.name}</span>
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-primary bg-primary-fixed/40 px-2 py-0.5 rounded-full">
                      <span className="material-symbols-outlined text-[11px] icon-filled">{roleIcon[result.role]}</span>
                      {roleLabel[result.role] ?? result.role}
                    </span>
                  </div>
                  {result.extra && (
                    <p className="text-xs text-on-surface-variant mt-0.5">{result.extra}</p>
                  )}
                </Link>
                <div className="flex items-center gap-2 shrink-0">
                  {isAuthenticated && (
                    <button
                      onClick={() => isFollowed ? handleUnfollow(result.userId) : handleFollow(result.userId)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                        isFollowed
                          ? 'bg-surface-container text-on-surface-variant hover:bg-error-container hover:text-error'
                          : 'bg-primary text-on-primary hover:opacity-90'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[14px]">
                        {isFollowed ? 'person_remove' : 'person_add'}
                      </span>
                      {isFollowed ? 'Siguiendo' : 'Seguir'}
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {!query && (
        <div className="flex flex-col items-center py-16 text-center">
          <span className="material-symbols-outlined text-[48px] text-outline mb-3">people_search</span>
          <p className="text-on-surface-variant">Escribe para buscar usuarios</p>
        </div>
      )}
    </main>
  )
}
