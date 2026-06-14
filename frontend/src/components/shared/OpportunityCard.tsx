'use client'

import { useState } from 'react'
import { cn, scoreBgColor, timeAgo } from '@/lib/utils'
import type { Opportunity } from '@/types'
import Image from 'next/image'

const typeLabel: Record<string, string> = {
  PASANTIA: 'Pasantía',
  PRACTICA: 'Práctica',
  TRABAJO:  'Trabajo',
  PROYECTO: 'Proyecto',
}

interface OpportunityCardProps {
  opportunity: Opportunity
  onApply?: (id: string) => void
  onSave?: (id: string) => void
  applied?: boolean
  saved?: boolean
  className?: string
}

export function OpportunityCard({
  opportunity,
  onApply,
  onSave,
  applied = false,
  saved = false,
  className,
}: OpportunityCardProps) {
  const { matchScore = 0, matchBreakdown, matchDetails } = opportunity
  const [imageError, setImageError] = useState(false)
  const [showMatchDetails, setShowMatchDetails] = useState(false)

  const hasMatch = matchScore > 0 && matchBreakdown

  return (
    <article className={cn('card group', className)}>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start gap-4 mb-4">
          {!imageError && opportunity.company.logo ? (
            <div className="w-12 h-12 rounded-xl shrink-0 border border-outline-variant/20 overflow-hidden relative">
              <Image
                src={opportunity.company.logo}
                alt={`${opportunity.company.name} logo`}
                fill
                className="object-cover bg-white"
                onError={() => setImageError(true)}
              />
            </div>
          ) : (
            <div className="w-12 h-12 rounded-xl bg-surface-container-low flex items-center justify-center shrink-0 border border-outline-variant/20">
              <span className="material-symbols-outlined text-primary text-[24px]">business</span>
            </div>
          )}

          <div className="flex-1 min-w-0">
            <h3 className="font-headline font-bold text-on-surface text-base leading-tight truncate">
              {opportunity.title}
            </h3>
            <p className="text-sm text-on-surface-variant mt-0.5 truncate">
              {opportunity.company.name}
            </p>
          </div>

          {/* Match badge — clickable para expandir desglose */}
          {matchScore > 0 && (
            <button
              onClick={() => hasMatch && setShowMatchDetails(v => !v)}
              className={cn(
                'shrink-0 text-xs font-bold px-2.5 py-1 rounded-full transition-all',
                scoreBgColor(matchScore),
                hasMatch && 'hover:opacity-80 cursor-pointer',
              )}
              title={hasMatch ? 'Ver desglose del match' : undefined}
            >
              {matchScore}% match
              {hasMatch && (
                <span className="ml-1 material-symbols-outlined text-[12px] align-middle">
                  {showMatchDetails ? 'expand_less' : 'expand_more'}
                </span>
              )}
            </button>
          )}
        </div>

        {/* ── Match breakdown panel ─────────────────────────────────────── */}
        {showMatchDetails && matchBreakdown && (
          <div className="mb-4 p-4 rounded-xl bg-surface-container-low border border-outline-variant/20 space-y-4 animate-fade-in">

            {/* Explicación amigable */}
            <p className="text-sm text-on-surface leading-relaxed">
              {matchBreakdown.explanation}
            </p>

            {/* Barra de progreso general */}
            <div>
              <div className="flex justify-between text-[11px] font-semibold text-outline mb-1">
                <span>Compatibilidad general</span>
                <span>{matchScore}%</span>
              </div>
              <div className="h-2 rounded-full bg-surface-container-high overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded-full transition-all',
                    matchScore >= 80 ? 'bg-green-500' :
                    matchScore >= 60 ? 'bg-primary' :
                    matchScore >= 40 ? 'bg-amber-500' : 'bg-outline'
                  )}
                  style={{ width: `${matchScore}%` }}
                />
              </div>
            </div>

            {/* Scores por categoría */}
            {(matchBreakdown.totalCount > 0) && (
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-surface-container rounded-lg p-3">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-outline mb-1">Técnicas</p>
                  <div className="flex items-end gap-1">
                    <span className="text-xl font-black text-on-surface">{matchBreakdown.technicalScore}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-surface-container-high mt-1.5 overflow-hidden">
                    <div className="h-full bg-primary rounded-full" style={{ width: `${matchBreakdown.technicalScore}%` }} />
                  </div>
                </div>
                <div className="bg-surface-container rounded-lg p-3">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-outline mb-1">Blandas</p>
                  <div className="flex items-end gap-1">
                    <span className="text-xl font-black text-on-surface">{matchBreakdown.softScore}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-surface-container-high mt-1.5 overflow-hidden">
                    <div className="h-full bg-amber-500 rounded-full" style={{ width: `${matchBreakdown.softScore}%` }} />
                  </div>
                </div>
              </div>
            )}

            {/* Detalle por habilidad */}
            {matchDetails && matchDetails.length > 0 && (
              <div>
                <p className="text-[11px] font-bold uppercase tracking-widest text-outline mb-2">
                  Requisitos ({matchBreakdown.matchedCount}/{matchBreakdown.totalCount})
                </p>
                <div className="space-y-1.5">
                  {matchDetails.map((detail) => (
                    <div
                      key={detail.requirement}
                      className={cn(
                        'flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold',
                        detail.isMet
                          ? 'bg-green-50 text-green-800'
                          : 'bg-surface-container text-on-surface-variant',
                      )}
                    >
                      <span className={cn(
                        'material-symbols-outlined text-[14px]',
                        detail.isMet ? 'text-green-600' : 'text-outline',
                      )}>
                        {detail.isMet ? 'check_circle' : 'radio_button_unchecked'}
                      </span>
                      <span className="flex-1">{detail.requirement}</span>
                      {detail.isMet && detail.matchedVia === 'synonym' && (
                        <span className="text-[9px] font-bold text-green-600 opacity-70">similar</span>
                      )}
                      {detail.isMet && detail.matchedVia === 'evidence' && (
                        <span className="text-[9px] font-bold text-green-600 opacity-70">evidencia</span>
                      )}
                      <span className={cn(
                        'text-[9px] font-bold uppercase tracking-wide',
                        detail.category === 'TECNICA' ? 'text-primary opacity-60' :
                        detail.category === 'BLANDA'  ? 'text-amber-600 opacity-70' : 'opacity-40',
                      )}>
                        {detail.category === 'TECNICA' ? 'tec' : detail.category === 'BLANDA' ? 'blanda' : ''}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Bonus evidencias */}
            {matchBreakdown.evidenceBonus > 0 && (
              <div className="flex items-center gap-2 text-xs text-green-700 bg-green-50 px-3 py-2 rounded-lg">
                <span className="material-symbols-outlined text-[14px] text-green-600">workspace_premium</span>
                +{matchBreakdown.evidenceBonus} pts por evidencias relacionadas en tu portafolio
              </div>
            )}

            {/* Tips */}
            {matchBreakdown.tips && matchBreakdown.tips.length > 0 && (
              <div className="border-t border-outline-variant/15 pt-3">
                <p className="text-[11px] font-bold uppercase tracking-widest text-outline mb-2">
                  Cómo mejorar tu match
                </p>
                <ul className="space-y-1">
                  {matchBreakdown.tips.map((tip, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-on-surface-variant">
                      <span className="material-symbols-outlined text-[13px] text-amber-500 mt-0.5 shrink-0">lightbulb</span>
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Meta */}
        <div className="flex flex-wrap gap-2 mb-4">
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-on-surface-variant bg-surface-container px-2.5 py-1 rounded-full">
            <span className="material-symbols-outlined text-[13px]">work</span>
            {typeLabel[opportunity.type]}
          </span>
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-on-surface-variant bg-surface-container px-2.5 py-1 rounded-full">
            <span className="material-symbols-outlined text-[13px]">location_on</span>
            {opportunity.location}
          </span>
          {opportunity.isRemote && (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary bg-primary-fixed/60 px-2.5 py-1 rounded-full">
              <span className="material-symbols-outlined text-[13px]">wifi</span>
              Remoto
            </span>
          )}
        </div>

        {/* Description */}
        <p className="text-sm text-on-surface-variant leading-relaxed line-clamp-2 mb-4">
          {opportunity.description}
        </p>

        {/* Skills */}
        {opportunity.skills.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {opportunity.skills.slice(0, 4).map((skill) => {
              const met = matchDetails?.find(d => d.requirement === skill)?.isMet
              return (
                <span
                  key={skill}
                  className={cn(
                    'text-[11px] font-semibold px-2.5 py-0.5 rounded-full border',
                    met === true  ? 'bg-green-50 text-green-700 border-green-200' :
                    met === false ? 'bg-surface-container-low text-outline border-outline-variant/20' :
                    'bg-surface-container-low text-on-surface-variant border-outline-variant/20',
                  )}
                >
                  {met === true && <span className="mr-0.5">✓</span>}
                  {skill}
                </span>
              )
            })}
            {opportunity.skills.length > 4 && (
              <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-surface-container text-outline">
                +{opportunity.skills.length - 4}
              </span>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-outline-variant/15">
          <div className="flex items-center gap-3 text-xs text-outline">
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">group</span>
              {opportunity.applicantsCount} postulantes
            </span>
            {opportunity.deadline && (
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">schedule</span>
                Hasta {new Date(opportunity.deadline).toLocaleDateString('es-CL', { day: 'numeric', month: 'short' })}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onSave?.(opportunity.id)}
              className={cn(
                'p-1.5 rounded-md transition-colors',
                saved
                  ? 'text-primary bg-primary-fixed/60'
                  : 'text-outline hover:text-on-surface hover:bg-surface-container',
              )}
              title={saved ? 'Guardado' : 'Guardar'}
            >
              <span className={cn('material-symbols-outlined text-[18px]', saved && 'icon-filled')}>
                bookmark
              </span>
            </button>
            <button
              onClick={() => onApply?.(opportunity.id)}
              disabled={applied}
              className={cn(
                'px-4 py-1.5 rounded-md text-xs font-bold transition-all',
                applied
                  ? 'bg-surface-container text-outline cursor-not-allowed'
                  : 'bg-primary-container text-on-primary hover:opacity-90',
              )}
            >
              {applied ? 'Postulado' : 'Postular'}
            </button>
          </div>
        </div>
      </div>
    </article>
  )
}
