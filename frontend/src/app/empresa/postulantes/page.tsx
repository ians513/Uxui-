'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Avatar } from '@/components/ui/Avatar'
import { SkillList } from '@/components/ui/SkillPill'
import { Button } from '@/components/ui/Button'
import { api } from '@/lib/api-client'
import { useAuthStore } from '@/store/auth.store'
import { cn, scoreBgColor, mediaUrl, timeAgo } from '@/lib/utils'
import type { Application, ApplicationStatus, Opportunity } from '@/types'

const STATUS_FILTERS: { label: string; value: ApplicationStatus | 'all' }[] = [
  { label: 'Todos',       value: 'all' },
  { label: 'Pendientes',  value: 'PENDIENTE' },
  { label: 'En revisión', value: 'EN_REVISION' },
  { label: 'Entrevista',  value: 'ENTREVISTA' },
  { label: 'Aceptados',   value: 'ACEPTADO' },
  { label: 'Rechazados',  value: 'RECHAZADO' },
]

const STATUS_LABEL: Record<ApplicationStatus, { label: string; color: string }> = {
  PENDIENTE:   { label: 'Pendiente',   color: 'bg-surface-container text-on-surface-variant' },
  EN_REVISION: { label: 'En revisión', color: 'bg-blue-50 text-blue-700' },
  ENTREVISTA:  { label: 'Entrevista',  color: 'bg-amber-50 text-amber-700' },
  ACEPTADO:    { label: 'Aceptado',    color: 'bg-green-50 text-green-700' },
  RECHAZADO:   { label: 'Rechazado',   color: 'bg-red-50 text-red-600' },
}

function PostulantesContent() {
  const { isAuthenticated } = useAuthStore()
  const searchParams = useSearchParams()
  const ofertaParam  = searchParams.get('oferta')

  const [opportunities, setOpportunities] = useState<Opportunity[]>([])
  const [selectedOppId, setSelectedOppId] = useState<string>('')
  const [applications,  setApplications]  = useState<Application[]>([])
  const [statusFilter,  setStatusFilter]  = useState<ApplicationStatus | 'all'>('all')
  const [loadingOpps,   setLoadingOpps]   = useState(true)
  const [loadingApps,   setLoadingApps]   = useState(false)
  const [updatingId,    setUpdatingId]    = useState<string | null>(null)

  // Load company's offers
  useEffect(() => {
    if (!isAuthenticated) { setLoadingOpps(false); return }
    api.get<Opportunity[]>('/opportunities/my-offers')
      .then(data => {
        setOpportunities(data)
        // Pre-select from URL param if present, else first offer
        const initial = (ofertaParam && data.find(o => o.id === ofertaParam))
          ? ofertaParam
          : data[0]?.id ?? ''
        setSelectedOppId(initial)
      })
      .catch(() => {})
      .finally(() => setLoadingOpps(false))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated])

  // Load applicants when selected offer changes
  useEffect(() => {
    if (!selectedOppId || !isAuthenticated) return
    setLoadingApps(true)
    setApplications([])
    api.get<Application[]>(`/applications/applicants?opportunityId=${selectedOppId}`)
      .then(data => {
        setApplications(data)
        // Sync applicantsCount for the selected offer
        setOpportunities(prev => prev.map(o =>
          o.id === selectedOppId ? { ...o, applicantsCount: data.length } : o,
        ))
      })
      .catch(() => setApplications([]))
      .finally(() => setLoadingApps(false))
  }, [selectedOppId, isAuthenticated])

  const updateStatus = async (appId: string, status: ApplicationStatus) => {
    setUpdatingId(appId)
    try {
      await api.patch(`/applications/${appId}/status`, { status })
      setApplications(prev => prev.map(a => a.id === appId ? { ...a, status } : a))
    } catch { /* silencioso */ }
    finally { setUpdatingId(null) }
  }

  const filtered = statusFilter === 'all'
    ? applications
    : applications.filter(a => a.status === statusFilter)

  const statusCounts = STATUS_FILTERS.reduce((acc, f) => {
    acc[f.value] = f.value === 'all'
      ? applications.length
      : applications.filter(a => a.status === f.value).length
    return acc
  }, {} as Record<string, number>)

  if (!isAuthenticated) {
    return (
      <main className="max-w-[1440px] mx-auto px-8 py-10">
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <span className="material-symbols-outlined text-[64px] text-outline">lock</span>
          <h2 className="font-headline text-xl font-bold text-on-surface mt-4">Acceso restringido</h2>
          <p className="text-on-surface-variant text-sm mt-2">Inicia sesión como empresa para ver los postulantes.</p>
        </div>
      </main>
    )
  }

  if (loadingOpps) {
    return (
      <main className="max-w-[1440px] mx-auto px-8 py-10">
        <div className="h-9 w-64 bg-surface-container rounded-lg animate-pulse mb-8" />
        <div className="card h-64 animate-pulse" />
      </main>
    )
  }

  const selectedOpp = opportunities.find(o => o.id === selectedOppId)

  return (
    <main className="max-w-[1440px] mx-auto px-8 py-10">
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div>
          <h1 className="font-headline text-3xl font-bold text-on-surface">Postulantes</h1>
          <p className="text-on-surface-variant text-sm mt-1">
            Revisando: <span className="font-semibold text-on-surface">{selectedOpp?.title ?? '—'}</span>
            {selectedOpp && (
              <span className="ml-2 text-outline">
                · {selectedOpp.applicantsCount} postulante{selectedOpp.applicantsCount !== 1 ? 's' : ''}
              </span>
            )}
          </p>
        </div>
        {opportunities.length > 0 && (
          <select
            value={selectedOppId}
            onChange={e => setSelectedOppId(e.target.value)}
            className="bg-surface-container-low text-sm rounded-xl px-4 py-2.5 border border-outline-variant/15 outline-none focus:border-primary"
          >
            {opportunities.map(o => (
              <option key={o.id} value={o.id}>
                {o.title} ({o.applicantsCount})
              </option>
            ))}
          </select>
        )}
      </div>

      {opportunities.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center card">
          <span className="material-symbols-outlined text-[64px] text-outline">business_center</span>
          <h2 className="font-headline text-xl font-bold text-on-surface mt-4">Sin ofertas publicadas</h2>
          <p className="text-on-surface-variant text-sm mt-2">Publicá una oferta para empezar a recibir postulantes.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Sidebar filtros */}
          <aside className="md:col-span-3 space-y-4">
            <div className="card p-5">
              <h3 className="text-[11px] font-black uppercase tracking-widest text-outline mb-4">Filtrar por estado</h3>
              <div className="space-y-1">
                {STATUS_FILTERS.map(f => (
                  <button
                    key={f.value}
                    onClick={() => setStatusFilter(f.value)}
                    className={cn(
                      'w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors',
                      statusFilter === f.value
                        ? 'bg-primary-fixed/60 text-primary font-semibold'
                        : 'text-on-surface-variant hover:bg-surface-container',
                    )}
                  >
                    <span>{f.label}</span>
                    <span className={cn(
                      'text-[11px] font-bold px-2 py-0.5 rounded-full',
                      statusFilter === f.value
                        ? 'bg-primary text-on-primary'
                        : 'bg-surface-container text-outline',
                    )}>
                      {statusCounts[f.value] ?? 0}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Resumen rápido */}
            <div className="card p-5 space-y-3">
              <h3 className="text-[11px] font-black uppercase tracking-widest text-outline">Resumen</h3>
              <div className="flex justify-between text-sm">
                <span className="text-on-surface-variant">Total</span>
                <span className="font-bold text-on-surface">{applications.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-on-surface-variant">Pendientes</span>
                <span className="font-bold text-amber-600">{statusCounts['PENDIENTE'] ?? 0}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-on-surface-variant">Aceptados</span>
                <span className="font-bold text-green-600">{statusCounts['ACEPTADO'] ?? 0}</span>
              </div>
            </div>
          </aside>

          {/* Lista de postulantes */}
          <div className="md:col-span-9 space-y-4">
            <p className="text-sm text-on-surface-variant">
              <strong className="text-on-surface">{filtered.length}</strong> postulante{filtered.length !== 1 ? 's' : ''}
              {statusFilter !== 'all' && ` · ${STATUS_LABEL[statusFilter as ApplicationStatus]?.label ?? statusFilter}`}
            </p>

            {loadingApps ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="card p-6 animate-pulse">
                    <div className="flex gap-5">
                      <div className="w-14 h-14 rounded-xl bg-surface-container-low" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 w-40 bg-surface-container rounded" />
                        <div className="h-3 w-28 bg-surface-container-low rounded" />
                        <div className="h-3 w-48 bg-surface-container-low rounded" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="card p-12 text-center">
                <span className="material-symbols-outlined text-[48px] text-outline">person_search</span>
                <p className="mt-3 text-sm font-semibold text-outline">
                  {applications.length === 0
                    ? 'Aún no hay postulantes para esta oferta.'
                    : 'Sin postulantes con ese filtro.'}
                </p>
              </div>
            ) : (
              filtered.map(app => {
                const student    = app.student
                if (!student) return null
                const fullName   = `${student.firstName} ${student.lastName}`
                const isUpdating = updatingId === app.id
                const statusInfo = STATUS_LABEL[app.status]

                return (
                  <div key={app.id} className="card p-6">
                    <div className="flex items-start gap-5">
                      <Avatar
                        src={student.avatar ? mediaUrl(student.avatar) : undefined}
                        name={fullName}
                        size="lg"
                        shape="rounded"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4 flex-wrap">
                          <div>
                            <h3 className="font-headline font-bold text-on-surface text-lg">{fullName}</h3>
                            <p className="text-sm text-on-surface-variant">{student.headline}</p>
                            <p className="text-xs text-outline mt-0.5">
                              {student.specialty} · {student.year}° año
                            </p>
                            <p className="text-xs text-outline mt-0.5">
                              Postulado {timeAgo(app.createdAt)}
                            </p>
                          </div>
                          <div className="flex items-center gap-3 shrink-0">
                            <span className={cn('text-xs font-bold px-3 py-1.5 rounded-full', scoreBgColor(student.readinessScore ?? 0))}>
                              {student.readinessScore ?? 0}% score
                            </span>
                            <span className={cn('text-xs font-bold px-3 py-1.5 rounded-full', statusInfo.color)}>
                              {statusInfo.label}
                            </span>
                          </div>
                        </div>

                        {student.skills && <SkillList skills={student.skills} maxVisible={5} className="mt-3" />}

                        {app.coverLetter && (
                          <p className="mt-3 text-xs text-on-surface-variant italic line-clamp-2 bg-surface-container-low rounded-lg px-3 py-2">
                            "{app.coverLetter}"
                          </p>
                        )}

                        {/* Status action buttons */}
                        <div className="flex items-center gap-2 mt-4 pt-4 border-t border-outline-variant/10 flex-wrap">
                          {/* Message button — always available */}
                          <Link href={`/empresa/mensajes?with=${student.userId}`}>
                            <Button
                              variant="outline"
                              size="sm"
                              icon="chat"
                            >
                              Enviar mensaje
                            </Button>
                          </Link>

                          {app.status === 'PENDIENTE' && (
                            <>
                              <Button
                                size="sm"
                                icon="visibility"
                                onClick={() => updateStatus(app.id, 'EN_REVISION')}
                                disabled={isUpdating}
                              >
                                Revisar
                              </Button>
                              <Button
                                variant="secondary"
                                size="sm"
                                icon="calendar_today"
                                onClick={() => updateStatus(app.id, 'ENTREVISTA')}
                                disabled={isUpdating}
                              >
                                Agendar entrevista
                              </Button>
                            </>
                          )}

                          {app.status === 'EN_REVISION' && (
                            <>
                              <Button
                                size="sm"
                                icon="calendar_today"
                                onClick={() => updateStatus(app.id, 'ENTREVISTA')}
                                disabled={isUpdating}
                              >
                                Agendar entrevista
                              </Button>
                              <Button
                                variant="secondary"
                                size="sm"
                                icon="check_circle"
                                onClick={() => updateStatus(app.id, 'ACEPTADO')}
                                disabled={isUpdating}
                              >
                                Aceptar
                              </Button>
                            </>
                          )}

                          {app.status === 'ENTREVISTA' && (
                            <Button
                              size="sm"
                              icon="check_circle"
                              onClick={() => updateStatus(app.id, 'ACEPTADO')}
                              disabled={isUpdating}
                            >
                              Aceptar candidato
                            </Button>
                          )}

                          {app.status === 'ACEPTADO' && (
                            <span className="flex items-center gap-1.5 text-xs font-semibold text-green-700">
                              <span className="material-symbols-outlined text-[16px] icon-filled">check_circle</span>
                              Candidato aceptado
                            </span>
                          )}

                          {/* Reject button — always available except when already rejected */}
                          {app.status !== 'RECHAZADO' ? (
                            <button
                              onClick={() => updateStatus(app.id, 'RECHAZADO')}
                              disabled={isUpdating}
                              className="ml-auto p-2 text-outline hover:text-error transition-colors rounded-md hover:bg-surface-container disabled:opacity-40"
                              title="Rechazar candidato"
                            >
                              <span className="material-symbols-outlined text-[18px]">person_remove</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => updateStatus(app.id, 'PENDIENTE')}
                              disabled={isUpdating}
                              className="ml-auto text-xs text-outline hover:text-primary transition-colors disabled:opacity-40 px-2 py-1 rounded hover:bg-surface-container"
                            >
                              Reabrir
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}
    </main>
  )
}

export default function PostulantesPage() {
  return (
    <Suspense fallback={
      <main className="max-w-[1440px] mx-auto px-8 py-10">
        <div className="card h-64 animate-pulse" />
      </main>
    }>
      <PostulantesContent />
    </Suspense>
  )
}
