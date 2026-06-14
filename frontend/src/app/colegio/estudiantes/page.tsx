'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { Avatar } from '@/components/ui/Avatar'
import { api } from '@/lib/api-client'
import { useAuthStore } from '@/store/auth.store'
import { scoreBgColor } from '@/lib/utils'
import type { StudentProfile } from '@/types'

const QUICK_FILTERS = [
  { label: 'Todos',                    value: 'all' },
  { label: 'Validaciones pendientes',  value: 'pending' },
  { label: 'Sin evidencias',           value: 'noEvidence' },
  { label: 'Con evidencias',           value: 'withEvidence' },
  { label: 'Alto score',               value: 'highScore' },
  { label: 'Score bajo',               value: 'lowScore' },
]

function EstudiantesContent() {
  const { isAuthenticated } = useAuthStore()
  const searchParams = useSearchParams()
  const [students, setStudents]   = useState<StudentProfile[]>([])
  const [total, setTotal]         = useState(0)
  const [loading, setLoading]     = useState(true)
  const [query, setQuery]         = useState(searchParams.get('q') ?? '')
  const [quickFilter, setQuickFilter] = useState('all')

  useEffect(() => {
    setQuery(searchParams.get('q') ?? '')
  }, [searchParams])

  const fetchStudents = useCallback(async () => {
    setLoading(true)
    try {
      if (isAuthenticated) {
        const res = await api.get<StudentProfile[]>('/schools/me/students')
        setStudents(res)
        setTotal(res.length)
      } else {
        setStudents([])
        setTotal(0)
      }
    } catch {
      setStudents([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }, [isAuthenticated])

  useEffect(() => { fetchStudents() }, [fetchStudents])

  // Client-side filtering
  const filtered = students.filter(s => {
    if (query) {
      const q = query.toLowerCase()
      const match = `${s.firstName} ${s.lastName}`.toLowerCase().includes(q) ||
        s.specialty?.toLowerCase().includes(q)
      if (!match) return false
    }
    if (quickFilter === 'pending') {
      return s.skills.some(sk => sk.validationStatus === 'PENDIENTE')
    }
    if (quickFilter === 'noEvidence') {
      return (s.evidences?.length ?? 0) === 0
    }
    if (quickFilter === 'withEvidence') {
      return (s.evidences?.length ?? 0) > 0
    }
    if (quickFilter === 'highScore') {
      return (s.readinessScore ?? 0) >= 70
    }
    if (quickFilter === 'lowScore') {
      return (s.readinessScore ?? 0) < 40
    }
    return true
  })

  const avgScore = filtered.length
    ? Math.round(filtered.reduce((a, s) => a + (s.readinessScore ?? 0), 0) / filtered.length)
    : 0

  return (
    <main className="max-w-[1440px] mx-auto px-8 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-headline text-3xl font-bold text-on-surface">Gestión de Estudiantes</h1>
          <p className="text-on-surface-variant mt-1">
            {loading ? 'Cargando...' : `${total} estudiantes activos`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/colegio/carga-masiva"
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-surface-container-high text-on-surface text-sm font-bold hover:bg-surface-container-highest transition-colors">
            <span className="material-symbols-outlined text-[18px]">upload</span>
            Carga masiva
          </Link>
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { icon: 'group',               label: 'Total estudiantes',    value: total,                                                                         color: 'text-primary' },
          { icon: 'trending_up',         label: 'Score promedio',       value: `${avgScore}%`,                                                                color: 'text-amber-600' },
          { icon: 'verified',            label: 'Con validaciones',     value: students.filter(s => s.skills.some(sk => sk.isValidated)).length,              color: 'text-green-600' },
          { icon: 'pending_actions',     label: 'Pendientes de validar', value: students.flatMap(s => s.skills.filter(sk => sk.validationStatus === 'PENDIENTE')).length, color: 'text-amber-600' },
        ].map(({ icon, label, value, color }) => (
          <div key={label} className="card p-5">
            <span className={`material-symbols-outlined text-[28px] icon-filled ${color} mb-2`}>{icon}</span>
            <div className="text-2xl font-extrabold font-headline text-on-surface">{value}</div>
            <div className="text-xs text-outline mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <div className="flex items-center bg-surface-container-low rounded-lg px-3 py-2 gap-2 flex-1 max-w-sm">
          <span className="material-symbols-outlined text-outline text-[18px]">search</span>
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Buscar estudiante..."
            className="bg-transparent outline-none text-sm w-full placeholder:text-outline"
          />
        </div>
        {QUICK_FILTERS.map(f => (
          <button
            key={f.value}
            onClick={() => setQuickFilter(f.value)}
            className={`px-3 py-2 rounded-lg text-xs font-bold transition-all ${
              quickFilter === f.value
                ? 'bg-primary-container text-on-primary'
                : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-8 space-y-4">
            {[1,2,3].map(i => (
              <div key={i} className="flex gap-4 animate-pulse">
                <div className="w-10 h-10 rounded-full bg-surface-container-low" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-40 bg-surface-container rounded" />
                  <div className="h-2.5 w-24 bg-surface-container-low rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-center">
            <span className="material-symbols-outlined text-[48px] text-outline">school</span>
            <p className="mt-3 text-sm font-semibold text-outline">
              {isAuthenticated ? 'No hay estudiantes con esos criterios.' : 'Inicia sesión para ver los estudiantes.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-surface-container-low">
                <tr>
                  {['Estudiante', 'Especialidad', 'Año', 'Score', 'Habilidades', 'Validadas', 'Acciones'].map(h => (
                    <th key={h} className="px-5 py-3.5 text-left text-[11px] font-black uppercase tracking-widest text-outline">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/10">
                {filtered.map((student) => {
                  const fullName = `${student.firstName} ${student.lastName}`
                  const validatedCount = student.skills.filter(s => s.isValidated).length
                  return (
                    <tr key={student.id} className="group hover:bg-surface-container-low transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <Avatar src={student.avatar} name={fullName} size="sm" />
                          <div>
                            <p className="font-semibold text-sm text-on-surface group-hover:text-primary transition-colors">
                              {fullName}
                            </p>
                            <p className="text-xs text-outline">{student.user?.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-sm text-on-surface-variant">{student.specialty}</td>
                      <td className="px-5 py-4 text-sm text-on-surface-variant">{student.year}°</td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-surface-container-high rounded-full overflow-hidden">
                            <div className="h-full editorial-gradient rounded-full"
                              style={{ width: `${student.readinessScore ?? 0}%` }} />
                          </div>
                          <span className={`text-xs font-bold ${scoreBgColor(student.readinessScore ?? 0)} px-2 py-0.5 rounded-full`}>
                            {student.readinessScore ?? 0}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-sm text-on-surface-variant text-center">{student.skills.length}</td>
                      <td className="px-5 py-4">
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                          validatedCount > 0 ? 'bg-green-50 text-green-700' : 'bg-surface-container text-outline'
                        }`}>
                          {validatedCount} / {student.skills.length}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5">
                          <Link href={`/colegio/validaciones?student=${student.id}`}
                            className="px-3 py-1 rounded-md bg-primary-fixed text-primary text-xs font-bold hover:bg-primary-container hover:text-on-primary transition-all">
                            Validar
                          </Link>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  )
}

export default function EstudiantesPage() {
  return (
    <Suspense fallback={
      <main className="max-w-[1440px] mx-auto px-8 py-10">
        <div className="card h-96 animate-pulse" />
      </main>
    }>
      <EstudiantesContent />
    </Suspense>
  )
}
