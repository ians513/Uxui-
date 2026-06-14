'use client'

import { usePathname } from 'next/navigation'
import { useAuthStore } from '@/store/auth.store'
import { StudentNav } from './StudentNav'
import { EmpresaNav } from './EmpresaNav'
import { ColegioNav } from './ColegioNav'

// Rutas donde no se muestra ningún nav
const NO_NAV_PREFIXES = ['/auth', '/public', '/cv']

export function RootNavWrapper() {
  const pathname = usePathname()
  const { user } = useAuthStore()

  if (NO_NAV_PREFIXES.some(prefix => pathname.startsWith(prefix))) return null
  if (!user) return null

  if (user.role === 'EMPRESA') return <EmpresaNav />
  if (user.role === 'COLEGIO') return <ColegioNav />
  return <StudentNav />
}
