'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { api } from '@/lib/api-client'
import { useAuthStore } from '@/store/auth.store'
import type { CompanyProfile, Opportunity } from '@/types'

export default function EmpresaPerfilPage() {
  const { isAuthenticated } = useAuthStore()
  const [company, setCompany]           = useState<CompanyProfile | null>(null)
  const [opportunities, setOpportunities] = useState<Opportunity[]>([])
  const [loading, setLoading]           = useState(true)

  useEffect(() => {
    if (!isAuthenticated) { setLoading(false); return }
    Promise.all([
      api.get<CompanyProfile>('/companies/me').catch(() => null),
      api.get<Opportunity[]>('/opportunities/my-offers').catch(() => []),
    ]).then(([c, opps]) => {
      setCompany(c)
      setOpportunities(opps.filter(o => o.isActive))
    }).finally(() => setLoading(false))
  }, [isAuthenticated])

  if (loading) {
    return (
      <main className="max-w-5xl mx-auto px-6 py-10">
        <div className="card h-48 animate-pulse mb-6" />
        <div className="card h-32 animate-pulse" />
      </main>
    )
  }

  if (!company) {
    return (
      <main className="max-w-5xl mx-auto px-6 py-10">
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <span className="material-symbols-outlined text-[64px] text-outline">business_off</span>
          <h2 className="font-headline text-xl font-bold text-on-surface mt-4">Perfil no encontrado</h2>
          <p className="text-on-surface-variant text-sm mt-2">Inicia sesión como empresa para ver tu perfil.</p>
        </div>
      </main>
    )
  }

  return (
    <main className="max-w-5xl mx-auto px-6 py-10">
      {/* Cover + Header */}
      <div className="card mb-6">
        <div className="h-40 editorial-gradient relative overflow-hidden">
          {company.coverImage && (
            <img src={company.coverImage} className="w-full h-full object-cover" alt="" />
          )}
        </div>

        <div className="px-8 pb-8">
          <div className="flex items-end justify-between -mt-10 mb-6 flex-wrap gap-4">
            <div className="w-20 h-20 rounded-2xl bg-surface-container-lowest border-4 border-surface-container-lowest shadow-editorial flex items-center justify-center editorial-gradient overflow-hidden">
              {company.logo
                ? <img src={company.logo} className="w-full h-full object-cover" alt={company.name} />
                : <span className="material-symbols-outlined text-on-primary text-[36px] icon-filled">business</span>
              }
            </div>
            <div className="flex gap-3">
              <Link href="/empresa/perfil/editar">
                <Button icon="edit" size="sm">Editar perfil</Button>
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2">
              <h1 className="font-headline text-3xl font-bold text-on-surface mb-1">{company.name}</h1>
              <div className="flex items-center gap-3 flex-wrap text-sm text-on-surface-variant mb-4">
                {company.industry && (
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[15px]">work</span>
                    {company.industry}
                  </span>
                )}
                {company.size && (
                  <>
                    <span>·</span>
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[15px]">group</span>
                      {company.size}
                    </span>
                  </>
                )}
                {company.location && (
                  <>
                    <span>·</span>
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[15px]">location_on</span>
                      {company.location}
                    </span>
                  </>
                )}
              </div>
              <p className="text-sm text-on-surface leading-relaxed max-w-2xl">{company.description}</p>

              {company.website && (
                <a href={company.website}
                  className="inline-flex items-center gap-1.5 mt-4 text-sm font-semibold text-primary hover:underline">
                  <span className="material-symbols-outlined text-[16px]">link</span>
                  {company.website}
                </a>
              )}
            </div>

            <div className="bg-surface-container-low rounded-xl p-6 space-y-4">
              {[
                { icon: 'work',  label: 'Ofertas activas',      value: opportunities.length },
                { icon: 'group', label: 'Postulantes totales',  value: opportunities.reduce((a, o) => a + (o.applicantsCount ?? 0), 0) },
              ].map(({ icon, label, value }) => (
                <div key={label} className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-sm text-on-surface-variant">
                    <span className="material-symbols-outlined text-[16px]">{icon}</span>
                    {label}
                  </span>
                  <span className="font-bold text-on-surface">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Active opportunities */}
      <div className="card p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-headline text-xl font-bold text-on-surface">Ofertas activas</h2>
          <Link href="/empresa/ofertas">
            <Button variant="ghost" icon="add" size="sm">Gestionar ofertas</Button>
          </Link>
        </div>

        <div className="space-y-4">
          {opportunities.map(opp => (
            <div key={opp.id} className="flex items-center justify-between p-4 rounded-xl bg-surface-container-low hover:bg-surface-container transition-colors">
              <div>
                <h3 className="font-semibold text-on-surface text-sm">{opp.title}</h3>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  {opp.type} · {opp.location} · {opp.applicantsCount ?? 0} postulantes
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-primary-fixed text-primary">
                  Activa
                </span>
                <Link href="/empresa/postulantes">
                  <Button variant="secondary" size="sm">Ver postulantes</Button>
                </Link>
              </div>
            </div>
          ))}

          {opportunities.length === 0 && (
            <div className="flex flex-col items-center py-12 text-center">
              <span className="material-symbols-outlined text-[48px] text-outline">work_off</span>
              <p className="mt-3 text-sm font-semibold text-outline">No tienes ofertas activas</p>
              <Link href="/empresa/ofertas" className="mt-3">
                <Button size="sm">Crear oferta</Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
