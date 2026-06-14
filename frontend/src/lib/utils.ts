import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { formatDistanceToNow, format } from 'date-fns'
import { es } from 'date-fns/locale'
import type { ReadinessScoreBreakdown, StudentProfile } from '@/types'

// ─── Tailwind class merger ────────────────────────────────────────────────────
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ─── Media URL resolver ───────────────────────────────────────────────────────
// Backend stores relative paths like /uploads/publications/uuid.jpg
// but serves them from port 3001. This helper makes them absolute.
const MEDIA_BASE =
  (typeof process !== 'undefined'
    ? process.env.NEXT_PUBLIC_API_URL?.replace('/api', '')
    : undefined) ?? 'http://localhost:3001'

export function mediaUrl(path?: string | null): string {
  if (!path) return ''
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('blob:')) return path
  return `${MEDIA_BASE}${path}`
}

// ─── Date formatting ──────────────────────────────────────────────────────────
export function timeAgo(date: string | Date): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true, locale: es })
}

export function formatDate(date: string | Date, pattern = 'dd MMM yyyy'): string {
  return format(new Date(date), pattern, { locale: es })
}

// ─── Readiness Score Calculator (mirrors backend ScoreService) ────────────────
//
//  Pesos:
//    Bloque 1 — Información personal    30 pts
//    Bloque 2 — Presentación visual     15 pts
//    Bloque 3 — Habilidades declaradas  20 pts
//    Bloque 4 — Validaciones del colegio 20 pts
//    Bloque 5 — Evidencias / portafolio  15 pts
//
export function calculateReadinessScore(profile: Partial<StudentProfile>): ReadinessScoreBreakdown {

  // Bloque 1: Información personal (30 pts)
  let personalPts = 0
  if (profile.firstName?.trim())                              personalPts += 4
  if (profile.lastName?.trim())                               personalPts += 4
  if (profile.headline?.trim())                               personalPts += 6
  if (profile.bio?.trim() && profile.bio.trim().length >= 30) personalPts += 8
  if (profile.specialty?.trim())                              personalPts += 4
  if (profile.location?.trim())                               personalPts += 4
  const personalInfo = Math.min(personalPts, 30)

  // Bloque 2: Presentación visual (15 pts)
  let visualPts = 0
  if (profile.avatar?.trim())     visualPts += 10
  if (profile.coverImage?.trim()) visualPts += 5
  const visualPresentation = Math.min(visualPts, 15)

  // Bloque 3: Habilidades declaradas (20 pts — 4 pts c/u, máx 5)
  const skills = Math.min((profile.skills?.length ?? 0) * 4, 20)

  // Bloque 4: Validaciones (20 pts — 5 pts c/u, máx 4)
  const validatedCount = profile.skills?.filter(s => s.isValidated).length ?? 0
  const validations = Math.min(validatedCount * 5, 20)

  // Bloque 5: Evidencias (15 pts por tipo)
  let evidencePts = 0
  for (const ev of profile.evidences ?? []) {
    if (ev.type === 'PROYECTO')    evidencePts += 4
    else if (ev.type === 'CERTIFICADO') evidencePts += 3
    else if (ev.type === 'FOTO' || ev.type === 'VIDEO') evidencePts += 2
    else evidencePts += 1
  }
  const evidences = Math.min(evidencePts, 15)

  const total = personalInfo + visualPresentation + skills + validations + evidences

  // Explicación amigable
  let explanation = ''
  if (total >= 85)      explanation = 'Tu perfil está muy completo. ¡Estás listo para postular!'
  else if (total >= 70) explanation = 'Tu perfil está bien encaminado. Agregar evidencias te ayudará a destacar.'
  else if (total >= 55) explanation = 'Buen comienzo. Completa tu foto y habilidades para mejorar tu visibilidad.'
  else if (total >= 40) explanation = 'Vas por buen camino. Completa las secciones que te faltan.'
  else                  explanation = 'Comienza completando tu información básica y foto de perfil.'

  // Tips rápidos (máx 3)
  const tips: string[] = []
  if (!profile.avatar)                        tips.push('Sube una foto de perfil.')
  if (!profile.headline)                       tips.push('Agrega un titular profesional.')
  if ((profile.skills?.length ?? 0) < 3)      tips.push('Declara al menos 3 habilidades.')
  if (validatedCount === 0 && (profile.skills?.length ?? 0) > 0) tips.push('Pide al colegio que valide tus habilidades.')
  if ((profile.evidences?.length ?? 0) === 0) tips.push('Sube tu primer proyecto o certificado.')

  return { personalInfo, visualPresentation, skills, validations, evidences, total, explanation, tips: tips.slice(0, 3) }
}

// ─── Match score calculator ───────────────────────────────────────────────────
export function calculateMatchScore(
  studentSkills: string[],
  requiredSkills: string[],
): number {
  if (requiredSkills.length === 0) return 100
  const matched = requiredSkills.filter(req =>
    studentSkills.some(s => s.toLowerCase() === req.toLowerCase())
  ).length
  return Math.round((matched / requiredSkills.length) * 100)
}

// ─── Score color ──────────────────────────────────────────────────────────────
export function scoreColor(score: number): string {
  if (score >= 80) return 'text-green-600'
  if (score >= 60) return 'text-primary'
  if (score >= 40) return 'text-amber-500'
  return 'text-on-surface-variant'
}

export function scoreBgColor(score: number): string {
  if (score >= 80) return 'bg-green-50 text-green-700'
  if (score >= 60) return 'bg-primary-fixed text-primary'
  if (score >= 40) return 'bg-amber-50 text-amber-700'
  return 'bg-surface-container text-on-surface-variant'
}

// ─── Application status ───────────────────────────────────────────────────────
export function applicationStatusLabel(status: string): { label: string; color: string } {
  const map: Record<string, { label: string; color: string }> = {
    PENDIENTE:    { label: 'Pendiente',     color: 'bg-surface-container text-on-surface-variant' },
    EN_REVISION:  { label: 'En revisión',   color: 'bg-primary-fixed text-primary' },
    ENTREVISTA:   { label: 'Entrevista',    color: 'bg-amber-50 text-amber-700' },
    ACEPTADO:     { label: 'Aceptado',      color: 'bg-green-50 text-green-700' },
    RECHAZADO:    { label: 'No avanzó',     color: 'bg-surface-container-high text-on-surface-variant' },
  }
  return map[status] ?? { label: status, color: 'bg-surface-container text-on-surface-variant' }
}

// ─── Truncate ─────────────────────────────────────────────────────────────────
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength).trim() + '…'
}

// ─── Initials ─────────────────────────────────────────────────────────────────
export function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map(n => n[0])
    .join('')
    .toUpperCase()
}
