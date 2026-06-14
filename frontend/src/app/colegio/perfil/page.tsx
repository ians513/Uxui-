'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { api } from '@/lib/api-client'
import { useAuthStore } from '@/store/auth.store'
import type { SchoolProfile, StudentProfile } from '@/types'

export default function ColegioPerfilPage() {
  const { isAuthenticated } = useAuthStore()
  const [school, setSchool]         = useState<SchoolProfile | null>(null)
  const [students, setStudents]     = useState<StudentProfile[]>([])
  const [totalStudents, setTotal]   = useState(0)
  const [loading, setLoading]       = useState(true)

  useEffect(() => {
    if (!isAuthenticated) { setLoading(false); return }
    Promise.all([
      api.get<SchoolProfile>('/schools/me').catch(() => null),
      api.get<{ data: StudentProfile[]; total: number }>('/students/search?limit=6').catch(() => ({ data: [], total: 0 })),
    ]).then(([s, studentsRes]) => {
      setSchool(s)
      setStudents(studentsRes.data)
      setTotal(studentsRes.total)
    }).finally(() => setLoading(false))
  }, [isAuthenticated])

  if (loading) {
    return (
      <main className="max-w-5xl mx-auto px-6 py-10">
        <div className="card h-64 animate-pulse mb-6" />
        <div className="card h-48 animate-pulse" />
      </main>
    )
  }

  if (!school) {
    return (
      <main className="max-w-5xl mx-auto px-6 py-10">
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <span className="material-symbols-outlined text-[64px] text-outline">school</span>
          <h2 className="font-headline text-xl font-bold text-on-surface mt-4">Perfil no encontrado</h2>
          <p className="text-on-surface-variant text-sm mt-2">Inicia sesión como colegio para ver el perfil.</p>
        </div>
      </main>
    )
  }

  return (
    <main className="max-w-5xl mx-auto px-6 py-10">
      {/* Cover + Header */}
      <div className="card mb-6">
        <div className="h-48 editorial-gradient relative overflow-hidden">
          {school.coverImage && (
            <img src={school.coverImage} className="w-full h-full object-cover" alt="" />
          )}
          {!school.coverImage && (
            <div className="absolute inset-0 flex items-center justify-center opacity-10">
              <span className="material-symbols-outlined text-on-primary icon-filled" style={{ fontSize: '200px' }}>school</span>
            </div>
          )}
        </div>
        <div className="px-8 pb-8">
          <div className="flex items-end justify-between -mt-12 mb-6 flex-wrap gap-4">
            <div className="w-24 h-24 rounded-2xl editorial-gradient border-4 border-surface-container-lowest shadow-editorial flex items-center justify-center overflow-hidden">
              {school.logo
                ? <img src={school.logo} className="w-full h-full object-cover" alt={school.name} />
                : <span className="material-symbols-outlined text-on-primary text-[44px] icon-filled">school</span>
              }
            </div>
            <div className="flex gap-3">
              <Link href="/colegio/perfil/editar">
                <Button icon="edit" size="sm">Editar perfil</Button>
              </Link>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap mb-2">
            <h1 className="font-headline text-3xl font-bold text-on-surface">{school.name}</h1>
            <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-primary bg-primary-fixed px-2.5 py-1 rounded-full">
              <span className="material-symbols-outlined text-[11px] icon-filled">verified</span>
              Institución verificada
            </span>
          </div>

          <div className="flex items-center gap-4 text-sm text-on-surface-variant mb-4 flex-wrap">
            {school.location && (
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-[15px]">location_on</span>
                {school.location}
              </span>
            )}
            {school.website && (
              <>
                <span>·</span>
                <a href={school.website} className="flex items-center gap-1 hover:text-primary transition-colors">
                  <span className="material-symbols-outlined text-[15px]">link</span>
                  {school.website}
                </a>
              </>
            )}
          </div>

          {school.description && (
            <p className="text-sm text-on-surface leading-relaxed max-w-3xl">{school.description}</p>
          )}

          {school.specialties?.length > 0 && (
            <div className="mt-6">
              <p className="text-[11px] font-black uppercase tracking-widest text-outline mb-3">Especialidades</p>
              <div className="flex flex-wrap gap-2">
                {school.specialties.map(spec => (
                  <span key={spec} className="px-3 py-1.5 rounded-full text-xs font-semibold bg-primary-fixed text-primary border border-primary/15">
                    {spec}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { value: totalStudents + '+', label: 'Estudiantes',   icon: 'group' },
          { value: school.specialties?.length ?? 0, label: 'Especialidades', icon: 'book' },
        ].map(({ value, label, icon }) => (
          <div key={label} className="card p-5 text-center">
            <span className="material-symbols-outlined text-primary text-[24px] icon-filled">{icon}</span>
            <p className="text-2xl font-extrabold text-on-surface font-headline mt-2">{value}</p>
            <p className="text-xs font-semibold text-on-surface-variant">{label}</p>
          </div>
        ))}
      </div>

      {/* Students list preview */}
      <div className="card p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-headline text-xl font-bold text-on-surface">Estudiantes destacados</h2>
          <a href="/colegio/estudiantes" className="text-sm font-semibold text-primary hover:underline">Ver todos</a>
        </div>

        {students.length === 0 ? (
          <div className="flex flex-col items-center py-12 text-center">
            <span className="material-symbols-outlined text-[48px] text-outline">person_add</span>
            <p className="mt-3 text-sm font-semibold text-outline">Todavía no hay estudiantes registrados.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {students.map(s => (
              <div key={s.id} className="flex items-center gap-4 p-4 rounded-xl bg-surface-container-low hover:bg-surface-container transition-colors">
                <div className="w-12 h-12 rounded-xl bg-primary-fixed flex items-center justify-center shrink-0">
                  <span className="font-bold text-primary">{s.firstName?.[0]}{s.lastName?.[0]}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-on-surface text-sm">{s.firstName} {s.lastName}</p>
                  <p className="text-xs text-on-surface-variant truncate">{s.specialty} · {s.year}° año</p>
                </div>
                <div className="text-right">
                  <p className="font-black text-primary text-lg font-headline">{s.readinessScore ?? 0}</p>
                  <p className="text-[10px] text-outline">Score</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
