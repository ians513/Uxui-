'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { Avatar } from '@/components/ui/Avatar'
import { FeedSection } from '@/components/shared/FeedSection'
import { api } from '@/lib/api-client'
import { useAuthStore } from '@/store/auth.store'
import type { SchoolProfile } from '@/types'

export default function ColegioInicioPage() {
  const { isAuthenticated } = useAuthStore()
  const [school, setSchool]         = useState<SchoolProfile | null>(null)
  const [pendingCount, setPendingCount] = useState(0)
  const [loading, setLoading]       = useState(true)

  useEffect(() => {
    if (isAuthenticated) {
      Promise.all([
        api.get<SchoolProfile>('/schools/me').catch(() => null),
        api.get<{ totalStudents: number; pendingValidations: number }>('/schools/me/stats').catch(() => null),
      ]).then(([s, stats]) => {
        setSchool(s)
        if (stats) setPendingCount(stats.pendingValidations)
      }).finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [isAuthenticated])

  if (loading) {
    return (
      <main className="max-w-[1440px] mx-auto px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          <aside className="md:col-span-3"><div className="card h-64 animate-pulse" /></aside>
          <section className="md:col-span-6"><div className="card h-48 animate-pulse" /></section>
          <aside className="md:col-span-3"><div className="card h-48 animate-pulse" /></aside>
        </div>
      </main>
    )
  }

  const schoolName = school?.name ?? 'Mi Institución'
  const logo       = school?.logo

  return (
    <main className="max-w-[1440px] mx-auto px-8 py-10">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">

        {/* ── Left Sidebar ────────────────────────────────────────────── */}
        <aside className="md:col-span-3 space-y-6 sticky top-28">

          <div className="card">
            <div className="h-20 editorial-gradient rounded-t-2xl" />
            <div className="px-6 pb-6 -mt-10">
              <Avatar src={logo} name={schoolName} size="xl" shape="rounded"
                className="border-4 border-surface-container-lowest mb-4 bg-white" />
              <h2 className="text-xl font-bold font-headline text-on-surface leading-tight">{schoolName}</h2>
              <p className="text-on-surface-variant text-sm mt-0.5 mb-4">
                {school?.description ?? 'Institución Educativa Técnico Profesional'}
              </p>
              <p className="text-xs font-semibold text-outline uppercase tracking-widest">RED TALENTO</p>

              <div className="space-y-3 pt-5 mt-5 border-t border-outline-variant/15">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-on-surface-variant">Validaciones pendientes</span>
                  <span className={`font-bold ${pendingCount > 0 ? 'text-amber-600' : 'text-primary'}`}>{pendingCount}</span>
                </div>
              </div>

              <Link href="/colegio/perfil"
                className="mt-5 flex items-center gap-2 text-sm font-semibold text-primary hover:underline">
                <span className="material-symbols-outlined text-[16px]">edit</span>
                Editar información institucional
              </Link>
            </div>
          </div>

          <div className="card p-6">
            <h3 className="font-headline font-bold text-[11px] uppercase tracking-widest text-outline mb-5">
              Accesos rápidos
            </h3>
            <div className="space-y-3">
              <Link href="/colegio/dashboard"
                className="flex items-center gap-3 p-3 rounded-xl bg-surface-container-low hover:bg-surface-container transition-colors group">
                <div className="w-8 h-8 rounded-lg bg-primary-fixed/30 flex items-center justify-center group-hover:bg-primary text-primary group-hover:text-white transition-all">
                  <span className="material-symbols-outlined text-[18px]">dashboard</span>
                </div>
                <span className="text-sm font-semibold">Ir al Dashboard</span>
              </Link>
              <Link href="/colegio/validaciones"
                className="flex items-center gap-3 p-3 rounded-xl bg-surface-container-low hover:bg-surface-container transition-colors group">
                <div className="w-8 h-8 rounded-lg bg-surface-container-high flex items-center justify-center group-hover:bg-primary-fixed/80 transition-all">
                  <span className="material-symbols-outlined text-[18px] text-on-surface-variant">verified</span>
                </div>
                <span className="text-sm font-semibold">Validar estudiantes</span>
              </Link>
            </div>
          </div>
        </aside>

        {/* ── Center Feed ─────────────────────────────────────────────── */}
        <section className="md:col-span-6">
          <FeedSection
            selfAvatar={logo}
            selfName={schoolName}
            selfLabel="Colegio"
            postPlaceholder="¿Qué noticia del colegio quieres compartir?"
            postActions={[
              { icon: 'image',    label: 'Foto' },
              { icon: 'event',    label: 'Evento' },
              { icon: 'campaign', label: 'Anuncio' },
            ]}
          />
        </section>

        {/* ── Right Sidebar ────────────────────────────────────────────── */}
        <aside className="md:col-span-3 space-y-6 sticky top-28">

          <div className="card p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-headline font-bold text-[11px] uppercase tracking-widest text-outline">
                Validaciones pendientes
              </h3>
            </div>
            {pendingCount === 0 ? (
              <div className="text-center py-4">
                <span className="material-symbols-outlined text-green-400 text-[32px]">task_alt</span>
                <p className="text-xs text-outline mt-2">Todo al día</p>
              </div>
            ) : (
              <div className="text-center py-4 bg-amber-50 rounded-xl border border-amber-100">
                <span className="material-symbols-outlined text-amber-500 mb-2">notification_important</span>
                <p className="text-2xl font-black text-amber-700 leading-none">{pendingCount}</p>
                <p className="text-xs text-amber-600 font-medium mt-1">habilidades por revisar</p>
              </div>
            )}
            <Link href="/colegio/validaciones"
              className="mt-4 flex items-center justify-center gap-1.5 w-full py-2.5 rounded-md text-xs font-bold bg-surface-container text-on-surface-variant hover:bg-primary-fixed/50 hover:text-primary transition-colors">
              Ir a validar ahora
            </Link>
          </div>

          <div className="card p-6 text-center border-dashed border-2 border-outline-variant/30 shadow-none bg-surface-container-lowest">
            <span className="material-symbols-outlined text-[32px] text-outline mb-2">group_add</span>
            <h4 className="text-sm font-bold text-on-surface mb-1">Añadir más estudiantes</h4>
            <p className="text-xs text-on-surface-variant mb-4">Subí la nómina de los nuevos cuartos medios.</p>
            <Link href="/colegio/carga-masiva"
              className="inline-block px-4 py-2 bg-surface-container text-sm font-semibold rounded-lg hover:bg-surface-container-high transition-colors">
              Carga Masiva
            </Link>
          </div>
        </aside>
      </div>
    </main>
  )
}
