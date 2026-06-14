'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState, useRef } from 'react'
import { cn, mediaUrl } from '@/lib/utils'
import { Avatar } from '@/components/ui/Avatar'
import { api } from '@/lib/api-client'
import { useAuthStore } from '@/store/auth.store'

interface UserSuggestion {
  userId: string
  role: string
  name: string
  avatar?: string
  extra?: string
}

const roleIcon: Record<string, string> = {
  STUDENT: 'school',
  EMPRESA: 'business',
  COLEGIO: 'account_balance',
}

function GlobalSearchBar({ onSelectUser }: { onSelectUser: (userId: string) => void }) {
  const { user } = useAuthStore()
  const wrapperRef = useRef<HTMLDivElement>(null)
  const [searchValue,  setSearchValue]  = useState('')
  const [suggestions,  setSuggestions]  = useState<UserSuggestion[]>([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [loadingSugg,  setLoadingSugg]  = useState(false)
  const debounceRef   = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleSearch = (value: string) => {
    setSearchValue(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!value.trim()) { setSuggestions([]); setShowDropdown(false); return }
    debounceRef.current = setTimeout(async () => {
      setLoadingSugg(true)
      try {
        const data = await api.get<UserSuggestion[]>(`/users/search?q=${encodeURIComponent(value.trim())}&limit=6`)
        setSuggestions(data.filter(r => r.userId !== user?.id))
        setShowDropdown(true)
      } catch { /* silencioso */ }
      finally { setLoadingSugg(false) }
    }, 300)
  }

  const handleSelect = (userId: string) => {
    setShowDropdown(false)
    setSearchValue('')
    setSuggestions([])
    onSelectUser(userId)
  }

  return (
    <div ref={wrapperRef} className="hidden lg:block relative w-72">
      <div className="flex items-center bg-surface-container-low border border-outline-variant/30 hover:border-primary/40 focus-within:border-primary/60 px-4 py-2 rounded-xl gap-3">
        <span className="material-symbols-outlined text-outline text-[20px]">search</span>
        <input
          type="text"
          value={searchValue}
          onChange={e => handleSearch(e.target.value)}
          onFocus={() => suggestions.length > 0 && setShowDropdown(true)}
          placeholder="Buscar talento, empresas..."
          className="bg-transparent border-none outline-none text-sm w-full placeholder:text-outline font-body text-on-surface"
        />
        {loadingSugg && (
          <div className="w-3.5 h-3.5 border-2 border-primary border-t-transparent rounded-full animate-spin shrink-0" />
        )}
        {searchValue && !loadingSugg && (
          <button
            onClick={() => { handleSearch(''); setSuggestions([]); setShowDropdown(false) }}
            className="text-outline hover:text-on-surface shrink-0"
          >
            <span className="material-symbols-outlined text-[16px]">close</span>
          </button>
        )}
      </div>

      {showDropdown && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-surface border border-outline-variant/20 rounded-xl shadow-elevated z-50 py-1 animate-fade-in">
          {suggestions.map(s => (
            <button
              key={s.userId}
              onClick={() => handleSelect(s.userId)}
              className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-surface-container transition-colors text-left"
            >
              <Avatar
                src={s.avatar ? mediaUrl(s.avatar) : undefined}
                name={s.name}
                size="sm"
                shape={s.role === 'COLEGIO' ? 'rounded' : 'circle'}
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-on-surface truncate">{s.name}</p>
                {s.extra && <p className="text-[11px] text-outline truncate">{s.extra}</p>}
              </div>
              <span className="shrink-0 material-symbols-outlined text-[14px] text-primary icon-filled">
                {roleIcon[s.role] ?? 'person'}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function NavBell({ href }: { href: string }) {
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    const load = () =>
      api.get<{ count: number }>('/notifications/unread-count')
        .then(r => setUnreadCount(r.count ?? 0))
        .catch(() => {})
    load()
    const interval = setInterval(load, 30_000)
    return () => clearInterval(interval)
  }, [])

  return (
    <Link
      href={href}
      className="relative p-2.5 rounded-full text-on-surface-variant hover:text-primary hover:bg-primary-fixed/30 transition-colors"
    >
      <span className="material-symbols-outlined text-[22px]">notifications</span>
      {unreadCount > 0 && (
        <span className="absolute top-1.5 right-1.5 min-w-[18px] h-[18px] bg-error text-on-error text-[10px] font-black rounded-full flex items-center justify-center border-2 border-surface px-0.5">
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </Link>
  )
}

const navItems = [
  { href: '/empresa/inicio',             icon: 'home',                 label: 'Inicio' },
  { href: '/empresa/buscar-estudiantes', icon: 'group',                label: 'Talento' },
  { href: '/empresa/ofertas',            icon: 'work',                 label: 'Mis Ofertas' },
  { href: '/empresa/postulantes',        icon: 'assignment_turned_in', label: 'Postulantes' },
  { href: '/empresa/mensajes',           icon: 'mail',                 label: 'Mensajes' },
]

export function EmpresaNav() {
  const pathname = usePathname()
  const router = useRouter()
  const { isAuthenticated } = useAuthStore()
  const [companyName, setCompanyName] = useState('Mi Empresa')
  const [companyLogo, setCompanyLogo] = useState<string | undefined>(undefined)

  useEffect(() => {
    if (!isAuthenticated) return
    api.get<{ name: string; logo?: string }>('/companies/me')
      .then(c => {
        if (c?.name) setCompanyName(c.name)
        if (c?.logo) setCompanyLogo(c.logo)
      })
      .catch(() => {})
  }, [isAuthenticated])

  return (
    <>
    <header className="fixed top-0 left-0 right-0 z-50 h-20 glass-nav border-b border-outline-variant/20 shadow-subtle">
      <div className="max-w-[1440px] mx-auto px-6 lg:px-8 h-full flex items-center justify-between gap-4">

        {/* Left: Logo + Search */}
        <div className="flex items-center gap-4 shrink-0">
          <Link href="/empresa/inicio" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl editorial-gradient flex items-center justify-center text-white shadow-editorial">
              <span className="font-headline font-bold text-lg leading-none">RT</span>
            </div>
            <span className="text-xl font-black bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary-fixed tracking-tight font-headline hidden sm:block">
              Red Talento
            </span>
          </Link>
          <GlobalSearchBar onSelectUser={(uid) => router.push('/student/ver/' + uid)} />
        </div>

        {/* Center: Nav links */}
        <nav className="hidden xl:flex items-center gap-1">
          {navItems.map(({ href, icon, label }) => {
            const active = pathname === href || pathname.startsWith(href + '/')
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-full text-[13px] font-bold tracking-wide transition-colors duration-150 whitespace-nowrap',
                  active
                    ? 'bg-primary text-on-primary'
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high',
                )}
              >
                <span className={cn('material-symbols-outlined text-[20px] shrink-0', active && 'icon-filled')}>
                  {icon}
                </span>
                {label}
              </Link>
            )
          })}
        </nav>

        {/* Right: Notifications + Profile */}
        <div className="flex items-center gap-3 shrink-0">
          <NavBell href="/empresa/notificaciones" />

          <div className="h-8 w-px bg-outline-variant/30 hidden sm:block" />

          <Link
            href="/empresa/perfil"
            className="flex items-center gap-2.5 p-1 pr-3 rounded-full border border-outline-variant/20 hover:border-primary/30 hover:bg-surface-container-low group"
          >
            <Avatar
              src={companyLogo ? mediaUrl(companyLogo) : undefined}
              name={companyName}
              size="sm"
              shape="circle"
              className="ring-2 ring-transparent group-hover:ring-primary/40 shrink-0"
            />
            <div className="hidden md:flex flex-col min-w-0">
              <span className="text-xs font-bold text-on-surface leading-tight truncate max-w-[120px]">
                {companyName}
              </span>
              <span className="text-[10px] text-on-surface-variant font-medium">Empresa</span>
            </div>
          </Link>
        </div>
      </div>
    </header>
    </>
  )
}
