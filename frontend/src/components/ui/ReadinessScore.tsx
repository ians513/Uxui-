'use client'

import { cn, scoreColor } from '@/lib/utils'
import type { ReadinessScoreBreakdown } from '@/types'

interface ReadinessScoreProps {
  score: number
  breakdown?: ReadinessScoreBreakdown
  size?: 'sm' | 'md' | 'lg'
  showBreakdown?: boolean
  showTips?: boolean
  className?: string
}

// Bloques con sus pesos máximos y colores
const segments = [
  { key: 'personalInfo'        as const, label: 'Información personal', icon: 'person',             max: 30, color: '#0056d2' },
  { key: 'visualPresentation'  as const, label: 'Presentación visual',  icon: 'add_a_photo',         max: 15, color: '#7c5cfc' },
  { key: 'skills'              as const, label: 'Habilidades',          icon: 'psychology',          max: 20, color: '#0056d2' },
  { key: 'validations'         as const, label: 'Validadas por colegio',icon: 'verified',            max: 20, color: '#2d9c56' },
  { key: 'evidences'           as const, label: 'Evidencias',           icon: 'folder_open',         max: 15, color: '#e07b00' },
]

export function ReadinessScore({
  score,
  breakdown,
  size = 'md',
  showBreakdown = false,
  showTips = false,
  className,
}: ReadinessScoreProps) {
  const ringSize    = size === 'lg' ? 96 : size === 'md' ? 72 : 52
  const strokeWidth = size === 'lg' ? 6  : size === 'md' ? 5  : 4
  const radius      = (ringSize - strokeWidth * 2) / 2
  const circumference = 2 * Math.PI * radius
  const dashOffset    = circumference - (score / 100) * circumference

  return (
    <div className={cn('flex flex-col gap-4', className)}>

      {/* ── Ring ──────────────────────────────────────────────────── */}
      <div className="flex items-center gap-4">
        <div className="relative shrink-0" style={{ width: ringSize, height: ringSize }}>
          <svg width={ringSize} height={ringSize} className="-rotate-90">
            <circle
              cx={ringSize / 2} cy={ringSize / 2} r={radius}
              fill="none" stroke="currentColor" strokeWidth={strokeWidth}
              className="text-surface-container"
            />
            <circle
              cx={ringSize / 2} cy={ringSize / 2} r={radius}
              fill="none" stroke="url(#scoreGradient)" strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              style={{ transition: 'stroke-dashoffset 0.8s cubic-bezier(0.16, 1, 0.3, 1)' }}
            />
            <defs>
              <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#0040a1" />
                <stop offset="100%" stopColor="#0056d2" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={cn(
              'font-black font-headline leading-none',
              size === 'lg' ? 'text-2xl' : size === 'md' ? 'text-lg' : 'text-sm',
              scoreColor(score),
            )}>
              {score}
            </span>
            {size !== 'sm' && (
              <span className="text-[9px] font-semibold uppercase tracking-wider text-outline">pts</span>
            )}
          </div>
        </div>

        {size !== 'sm' && (
          <div>
            <p className="font-semibold text-on-surface text-sm leading-tight">{scoreLabel(score)}</p>
            <p className="text-xs text-on-surface-variant mt-0.5">Índice de empleabilidad</p>
            {breakdown?.explanation && (
              <p className="text-xs text-on-surface-variant mt-2 leading-relaxed max-w-[180px]">
                {breakdown.explanation}
              </p>
            )}
          </div>
        )}
      </div>

      {/* ── Breakdown bars ────────────────────────────────────────── */}
      {showBreakdown && breakdown && (
        <div className="space-y-2.5">
          {segments.map(({ key, label, icon, max }) => {
            const value = breakdown[key] as number
            const pct   = Math.round((value / max) * 100)

            return (
              <div key={key} className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[16px] text-on-surface-variant w-5 shrink-0">
                  {icon}
                </span>
                <div className="flex-1">
                  <div className="flex justify-between mb-1">
                    <span className="text-[11px] font-semibold text-on-surface-variant">{label}</span>
                    <span className="text-[11px] font-bold text-on-surface">{value}/{max}</span>
                  </div>
                  <div className="score-bar">
                    <div className="score-bar-fill" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── Tips de mejora ───────────────────────────────────────── */}
      {showTips && breakdown?.tips && breakdown.tips.length > 0 && (
        <div className="space-y-2 pt-1">
          <p className="text-[10px] font-bold uppercase tracking-widest text-outline">
            Cómo mejorar
          </p>
          {breakdown.tips.map((tip, i) => (
            <div key={i} className="flex items-start gap-2 text-xs text-on-surface-variant">
              <span className="material-symbols-outlined text-[13px] text-amber-500 mt-0.5 shrink-0">lightbulb</span>
              {tip}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function scoreLabel(score: number): string {
  if (score >= 85) return 'Perfil Destacado'
  if (score >= 70) return 'Bien Preparado'
  if (score >= 55) return 'En Desarrollo'
  if (score >= 40) return 'Perfil Inicial'
  return 'Recién Iniciado'
}
