'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Avatar } from '@/components/ui/Avatar'
import { ReadinessScore } from '@/components/ui/ReadinessScore'
import { Button } from '@/components/ui/Button'
import { api } from '@/lib/api-client'
import { useAuthStore } from '@/store/auth.store'
import { cn, scoreBgColor } from '@/lib/utils'
import type { StudentProfile } from '@/types'

interface DashboardStats {
  totalStudents: number
  pendingValidations: number
  totalOpportunities: number
  totalApplications: number
  avgScore: number
  studentsWithValidations: number
  studentsWithApplications: number
}

interface PendingSkillEntry {
  id: string
  name: string
  student: StudentProfile
}

export default function ColegioDashboardPage() {
  const { isAuthenticated } = useAuthStore()
  const [activeTab, setActiveTab] = useState<'estudiantes' | 'empresas'>('estudiantes')
  const [stats, setStats]           = useState<DashboardStats | null>(null)
  const [recentStudents, setRecentStudents] = useState<StudentProfile[]>([])
  const [pendingSkills, setPendingSkills]   = useState<PendingSkillEntry[]>([])
  const [loading, setLoading]       = useState(true)

  useEffect(() => {
    if (!isAuthenticated) { setLoading(false); return }
    Promise.all([
      api.get<DashboardStats>('/schools/me/stats').catch(() => null),
      api.get<StudentProfile[]>('/schools/me/students').catch(() => []),
      api.get<PendingSkillEntry[]>('/skills/pending-validations').catch(() => []),
    ]).then(([s, students, pending]) => {
      setStats(s)
      setRecentStudents(students.slice(0, 5))
      setPendingSkills(pending.slice(0, 3))
    }).finally(() => setLoading(false))
  }, [isAuthenticated])

  if (loading) {
    return (
      <main className="max-w-[1440px] mx-auto px-8 py-10">
        <div className="h-9 w-72 bg-surface-container rounded-lg animate-pulse mb-8" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[1,2,3,4].map(i => <div key={i} className="card h-28 animate-pulse" />)}
        </div>
      </main>
    )
  }

  const studentStats = [
    { icon: 'group',        label: 'Estudiantes activos',     value: stats?.totalStudents ?? 0,         change: 'Total en plataforma', positive: true },
    { icon: 'verified',     label: 'Validaciones pendientes', value: stats?.pendingValidations ?? 0,    change: 'Requieren acción',     positive: (stats?.pendingValidations ?? 0) === 0 },
    { icon: 'work',         label: 'Ofertas laborales',       value: stats?.totalOpportunities ?? 0,    change: 'Oportunidades activas', positive: true },
    { icon: 'trending_up',  label: 'Score promedio',          value: `${stats?.avgScore ?? 0}%`,        change: 'Índice de empleabilidad', positive: true },
  ]

  const empresasStats = [
    { icon: 'business',     label: 'Postulaciones totales',   value: stats?.totalApplications ?? 0,    change: 'Todos los estados',    positive: true },
    { icon: 'campaign',     label: 'Ofertas publicadas',      value: stats?.totalOpportunities ?? 0,   change: 'Activas en plataforma', positive: true },
    { icon: 'handshake',    label: 'Con postulaciones',       value: stats?.studentsWithApplications ?? 0, change: 'Estudiantes activos', positive: true },
    { icon: 'visibility',   label: 'Con validaciones',        value: stats?.studentsWithValidations ?? 0,  change: 'Habilidades validadas', positive: true },
  ]

  const activeStats = activeTab === 'estudiantes' ? studentStats : empresasStats

  return (
    <main className="max-w-[1440px] mx-auto px-8 py-10">
      <div className="mb-8 flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-headline text-3xl font-bold text-on-surface mb-1">Dashboard Institucional</h1>
          <p className="text-on-surface-variant">Resumen de actividad de la plataforma</p>
        </div>
        <div className="flex gap-3">
          <Link href="/colegio/carga-masiva">
            <Button variant="secondary" icon="upload">Importar datos</Button>
          </Link>
        </div>
      </div>

      {/* View Switcher */}
      <div className="flex gap-2 mb-8 bg-surface-container-low p-1.5 rounded-xl w-fit border border-outline-variant/20">
        {(['estudiantes', 'empresas'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              'px-6 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2',
              activeTab === tab
                ? 'bg-surface shadow-sm text-primary'
                : 'text-on-surface-variant hover:text-on-surface hover:bg-surface/50'
            )}
          >
            <span className="material-symbols-outlined text-[18px]">
              {tab === 'estudiantes' ? 'school' : 'business_center'}
            </span>
            {tab === 'estudiantes' ? 'Resumen Estudiantes' : 'Resumen Empresas'}
          </button>
        ))}
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {activeStats.map(({ icon, label, value, change, positive }) => (
          <div key={label} className="card p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="w-10 h-10 rounded-xl editorial-gradient flex items-center justify-center">
                <span className="material-symbols-outlined text-on-primary text-[18px] icon-filled">{icon}</span>
              </div>
              <span className={cn(
                'text-[11px] font-bold px-2 py-0.5 rounded-full',
                positive ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700',
              )}>
                {change}
              </span>
            </div>
            <p className="text-3xl font-extrabold text-on-surface font-headline">{value}</p>
            <p className="text-xs font-semibold text-on-surface-variant mt-1">{label}</p>
          </div>
        ))}
      </div>

      {activeTab === 'estudiantes' ? (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          <div className="md:col-span-7 space-y-6">
            <div className="card p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-headline font-bold text-lg text-on-surface">Validaciones pendientes</h2>
                <Link href="/colegio/validaciones">
                  <Button variant="ghost" size="sm">Ver todas</Button>
                </Link>
              </div>

              {pendingSkills.length === 0 ? (
                <div className="flex flex-col items-center py-10">
                  <span className="material-symbols-outlined text-[48px] text-outline">verified</span>
                  <p className="mt-3 text-sm font-semibold text-outline">No hay validaciones pendientes</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingSkills.map(skill => {
                    const student = skill.student
                    if (!student) return null
                    return (
                      <div key={skill.id} className="flex items-center gap-4 p-4 rounded-xl bg-surface-container-low hover:bg-surface-container transition-colors">
                        <Avatar
                          src={student.avatar}
                          name={`${student.firstName} ${student.lastName}`}
                          size="md"
                          shape="rounded"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-on-surface text-sm">
                            {student.firstName} {student.lastName}
                          </p>
                          <p className="text-xs text-on-surface-variant">{student.specialty}</p>
                          <span className="inline-block mt-1.5 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                            {skill.name}
                          </span>
                        </div>
                        <Link
                          href="/colegio/validaciones"
                          className="p-2 rounded-lg bg-primary-fixed text-primary hover:bg-primary hover:text-on-primary transition-colors border border-primary/20"
                        >
                          <span className="material-symbols-outlined text-[18px]">check</span>
                        </Link>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="md:col-span-5 space-y-6">
            <div className="card p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-headline font-bold text-lg text-on-surface">Estudiantes recientes</h2>
                <Link href="/colegio/estudiantes">
                  <Button variant="ghost" size="sm">Ver todos</Button>
                </Link>
              </div>
              {recentStudents.length === 0 ? (
                <p className="text-xs text-outline text-center py-8">No hay estudiantes registrados aún.</p>
              ) : (
                <div className="space-y-3">
                  {recentStudents.map(s => (
                    <div key={s.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-surface-container-low transition-colors cursor-pointer border border-transparent hover:border-outline-variant/20">
                      <Avatar src={s.avatar} name={`${s.firstName} ${s.lastName}`} size="sm" shape="rounded" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-on-surface truncate">{s.firstName} {s.lastName}</p>
                        <p className="text-xs text-on-surface-variant truncate">{s.specialty}</p>
                      </div>
                      <ReadinessScore score={s.readinessScore ?? 0} size="sm" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="card p-8 text-center">
          <span className="material-symbols-outlined text-[48px] text-outline">business_center</span>
          <p className="mt-4 text-on-surface-variant">
            Hay <strong className="text-on-surface">{stats?.totalOpportunities ?? 0}</strong> ofertas activas y{' '}
            <strong className="text-on-surface">{stats?.totalApplications ?? 0}</strong> postulaciones en total.
          </p>
          <div className="flex items-center justify-center gap-3 mt-6">
            <Link href="/colegio/estudiantes">
              <Button variant="secondary" icon="school">Ver estudiantes</Button>
            </Link>
            <Link href="/colegio/validaciones">
              <Button icon="verified">Revisar validaciones</Button>
            </Link>
          </div>
        </div>
      )}
    </main>
  )
}
