'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { Avatar } from '@/components/ui/Avatar'
import { FeedSection } from '@/components/shared/FeedSection'
import { api } from '@/lib/api-client'
import { useAuthStore } from '@/store/auth.store'
import type { CompanyProfile, Opportunity } from '@/types'

export default function EmpresaInicioPage() {
  const { isAuthenticated } = useAuthStore()
  const [company,       setCompany]       = useState<CompanyProfile | null>(null)
  const [opportunities, setOpportunities] = useState<Opportunity[]>([])
  const [pendingCount,  setPendingCount]  = useState(0)
  const [loading,       setLoading]       = useState(true)

  useEffect(() => {
    if (isAuthenticated) {
      Promise.all([
        api.get<CompanyProfile>('/companies/me').catch(() => null),
        api.get<Opportunity[]>('/opportunities/my-offers').catch(() => []),
        api.get<{ status: string }[]>('/applications/applicants').catch(() => []),
      ]).then(([c, opps, apps]) => {
        setCompany(c)
        setOpportunities(opps.slice(0, 3))
        setPendingCount(apps.filter((a: any) => a.status === 'PENDIENTE').length)
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

  const companyName = company?.name ?? 'Mi Empresa'
  const logo        = company?.logo

  return (
    <main className="max-w-[1440px] mx-auto px-8 py-10">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">

        {/* ── Left Sidebar ────────────────────────────────────────────── */}
        <aside className="md:col-span-3 space-y-6 sticky top-28">

          <div className="card">
            <div className="h-20 editorial-gradient rounded-t-2xl relative">
              {company?.coverImage && (
                <img src={company.coverImage} className="w-full h-full object-cover rounded-t-2xl" alt="" />
              )}
            </div>
            <div className="px-6 pb-6 -mt-10 relative z-10">
              <Avatar src={logo} name={companyName} size="xl" shape="rounded"
                className="border-4 border-surface-container-lowest mb-4 bg-white" />
              <h2 className="text-xl font-bold font-headline text-on-surface leading-tight">{companyName}</h2>
              <p className="text-on-surface-variant text-sm mt-0.5 mb-4">{company?.industry}</p>
              <p className="text-xs font-semibold text-outline uppercase tracking-widest">{company?.location}</p>

              <div className="space-y-3 pt-5 mt-5 border-t border-outline-variant/15">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-on-surface-variant">Ofertas activas</span>
                  <span className="font-bold text-primary">{opportunities.filter(o => o.isActive).length}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-on-surface-variant">Pendientes</span>
                  <span className={`font-bold ${pendingCount > 0 ? 'text-amber-600' : 'text-outline'}`}>{pendingCount}</span>
                </div>
              </div>

              <Link href="/empresa/perfil"
                className="mt-5 flex items-center gap-2 text-sm font-semibold text-primary hover:underline">
                <span className="material-symbols-outlined text-[16px]">edit</span>
                Editar perfil de empresa
              </Link>
            </div>
          </div>

          <div className="card p-6">
            <h3 className="font-headline font-bold text-[11px] uppercase tracking-widest text-outline mb-5">
              Acciones Rápidas
            </h3>
            <div className="space-y-3">
              <Link href="/empresa/ofertas"
                className="flex items-center gap-3 p-3 rounded-xl bg-primary-fixed hover:bg-primary transition-colors text-on-primary-fixed group border border-transparent hover:border-primary">
                <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[18px]">add_box</span>
                </div>
                <span className="text-sm font-semibold">Publicar oferta</span>
              </Link>
              <Link href="/empresa/buscar-estudiantes"
                className="flex items-center gap-3 p-3 rounded-xl bg-surface-container-low hover:bg-surface-container transition-colors group">
                <div className="w-8 h-8 rounded-lg bg-surface-container-high flex items-center justify-center group-hover:bg-primary-fixed/80 transition-all">
                  <span className="material-symbols-outlined text-[18px] text-on-surface-variant group-hover:text-primary">person_search</span>
                </div>
                <span className="text-sm font-semibold">Buscar talentos</span>
              </Link>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-headline font-bold text-[11px] uppercase tracking-widest text-outline">
                Tus ofertas activas
              </h3>
              <Link href="/empresa/ofertas" className="text-[11px] font-bold text-primary hover:underline">
                Gestionar
              </Link>
            </div>
            {opportunities.length === 0 ? (
              <p className="text-xs text-outline">No tienes ofertas publicadas aún.</p>
            ) : (
              <div className="space-y-4">
                {opportunities.map((opp) => (
                  <div key={opp.id} className="group flex flex-col gap-1 cursor-pointer">
                    <h4 className="text-sm font-bold text-on-surface group-hover:text-primary transition-colors line-clamp-1">{opp.title}</h4>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-on-surface-variant">{opp.applicantsCount} postulantes</span>
                      <span className="w-1 h-1 rounded-full bg-outline-variant" />
                      <span className="text-green-700 font-medium">{opp.type}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </aside>

        {/* ── Center Feed ─────────────────────────────────────────────── */}
        <section className="md:col-span-6">
          <FeedSection
            selfAvatar={logo}
            selfName={companyName}
            selfLabel="Empresa"
            postPlaceholder="Comparte una actualización o proyecto..."
            postActions={[
              { icon: 'image',    label: 'Foto' },
              { icon: 'videocam', label: 'Video' },
              { icon: 'work',     label: 'Contratación' },
            ]}
          />
        </section>

        {/* ── Right Sidebar ────────────────────────────────────────────── */}
        <aside className="md:col-span-3 space-y-6 sticky top-28">
          <div className="card p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-headline font-bold text-[11px] uppercase tracking-widest text-outline">
                Postulaciones
              </h3>
              <Link href="/empresa/postulantes" className="text-[11px] font-bold text-primary hover:underline">
                Ver todas
              </Link>
            </div>
            {pendingCount > 0 ? (
              <div className="flex items-center gap-3 p-3 rounded-xl bg-amber-50 border border-amber-200">
                <span className="material-symbols-outlined text-amber-600 text-[20px] icon-filled">notifications_active</span>
                <div>
                  <p className="text-sm font-bold text-amber-800">
                    {pendingCount} pendiente{pendingCount !== 1 ? 's' : ''}
                  </p>
                  <p className="text-xs text-amber-600">Sin revisar</p>
                </div>
              </div>
            ) : (
              <p className="text-xs text-outline">Sin postulaciones pendientes.</p>
            )}
          </div>

          <div className="card p-6 text-center border-dashed border-2 border-outline-variant/30 shadow-none bg-surface-container-lowest">
            <span className="material-symbols-outlined text-[32px] text-outline mb-2">person_search</span>
            <h4 className="text-sm font-bold text-on-surface mb-1">Encontrá talento ideal</h4>
            <p className="text-xs text-on-surface-variant mb-4 leading-relaxed">Filtrá estudiantes por especialidad, validaciones y readiness score.</p>
            <Link href="/empresa/buscar-estudiantes"
              className="inline-block px-4 py-2 bg-surface-container text-sm font-semibold text-on-surface rounded-lg hover:bg-surface-container-high transition-colors border border-outline-variant/20">
              Ir al Directorio
            </Link>
          </div>
        </aside>
      </div>
    </main>
  )
}
