import { Injectable } from '@nestjs/common'
import { StudentProfile } from '../students/entities/student-profile.entity'

// ─── Result types ─────────────────────────────────────────────────────────────

export interface ScoreBreakdown {
  personalInfo: number        // 0-30 pts
  visualPresentation: number  // 0-15 pts
  skills: number              // 0-20 pts
  validations: number         // 0-20 pts
  evidences: number           // 0-15 pts
  total: number               // 0-100 pts
}

export interface ScoreResult {
  score: number
  breakdown: ScoreBreakdown
  explanation: string
  tips: string[]
}

// ─── Pesos por bloque ─────────────────────────────────────────────────────────
//
//  Bloque 1 — Información personal     30 pts  (perfil legible y completo)
//  Bloque 2 — Presentación visual      15 pts  (foto, imagen de portada)
//  Bloque 3 — Habilidades declaradas   20 pts  (cantidad de skills)
//  Bloque 4 — Validaciones del colegio 20 pts  (skills validadas)
//  Bloque 5 — Evidencias y portafolio  15 pts  (proyectos, certificados)
//
//  Total posible: 100 pts
//
//  Criterio empático: un estudiante ordenado y bien presentado
//  puede alcanzar ~55-65 pts sin experiencia formal.
//  Con 1-2 proyectos y validaciones básicas llega a 75-80+.

const MAX_PERSONAL_INFO     = 30
const MAX_VISUAL            = 15
const MAX_SKILLS            = 20
const MAX_VALIDATIONS       = 20
const MAX_EVIDENCES         = 15

@Injectable()
export class ScoreService {

  /**
   * Calcula el score de empleabilidad del estudiante con desglose y recomendaciones.
   * También retorna el número total para guardarlo en la base de datos.
   */
  calculate(profile: StudentProfile): ScoreResult {
    const personalInfo       = this.scorePersonalInfo(profile)
    const visualPresentation = this.scoreVisualPresentation(profile)
    const skills             = this.scoreSkills(profile)
    const validations        = this.scoreValidations(profile)
    const evidences          = this.scoreEvidences(profile)

    const total = personalInfo + visualPresentation + skills + validations + evidences

    const breakdown: ScoreBreakdown = {
      personalInfo,
      visualPresentation,
      skills,
      validations,
      evidences,
      total,
    }

    const explanation = this.buildExplanation(total)
    const tips        = this.buildTips(profile, breakdown)

    return { score: total, breakdown, explanation, tips }
  }

  // ─── Bloque 1: Información personal (30 pts) ─────────────────────────────

  private scorePersonalInfo(profile: StudentProfile): number {
    let pts = 0

    if (profile.firstName?.trim()) pts += 4
    if (profile.lastName?.trim())  pts += 4
    if (profile.headline?.trim())  pts += 6
    if (profile.bio?.trim() && profile.bio.trim().length >= 30) pts += 8  // Bio de al menos 30 chars
    if (profile.specialty?.trim()) pts += 4
    if (profile.location?.trim())  pts += 4

    return Math.min(pts, MAX_PERSONAL_INFO)
  }

  // ─── Bloque 2: Presentación visual (15 pts) ──────────────────────────────

  private scoreVisualPresentation(profile: StudentProfile): number {
    let pts = 0

    if (profile.avatar?.trim())     pts += 10
    if (profile.coverImage?.trim()) pts += 5

    return Math.min(pts, MAX_VISUAL)
  }

  // ─── Bloque 3: Habilidades declaradas (20 pts) ───────────────────────────

  private scoreSkills(profile: StudentProfile): number {
    const count = profile.skills?.length ?? 0
    // 4 pts por habilidad, máximo con 5 habilidades
    return Math.min(count * 4, MAX_SKILLS)
  }

  // ─── Bloque 4: Validaciones del colegio (20 pts) ─────────────────────────

  private scoreValidations(profile: StudentProfile): number {
    const validated = profile.skills?.filter(s => s.isValidated).length ?? 0
    // 5 pts por habilidad validada, máximo con 4 validadas
    return Math.min(validated * 5, MAX_VALIDATIONS)
  }

  // ─── Bloque 5: Evidencias y portafolio (15 pts) ──────────────────────────

  private scoreEvidences(profile: StudentProfile): number {
    let pts = 0
    const evidences = profile.evidences ?? []

    for (const ev of evidences) {
      switch (ev.type) {
        case 'PROYECTO':    pts += 4; break
        case 'CERTIFICADO': pts += 3; break
        case 'FOTO':
        case 'VIDEO':       pts += 2; break
        case 'DESCRIPCION': pts += 1; break
      }
    }

    return Math.min(pts, MAX_EVIDENCES)
  }

  // ─── Explicación amigable ────────────────────────────────────────────────

  private buildExplanation(score: number): string {
    if (score >= 85) return 'Tu perfil está muy completo. Estás listo para postular con confianza.'
    if (score >= 70) return 'Tu perfil está bien encaminado. Agregar evidencias te ayudará a destacar más.'
    if (score >= 55) return 'Buen comienzo. Completa tu foto de perfil y suma habilidades para mejorar tu visibilidad.'
    if (score >= 40) return 'Vas por buen camino. Te falta completar algunas secciones para que las empresas te encuentren.'
    return 'Comienza completando tu información básica y foto de perfil. Cada paso cuenta.'
  }

  // ─── Recomendaciones específicas ─────────────────────────────────────────

  private buildTips(profile: StudentProfile, breakdown: ScoreBreakdown): string[] {
    const tips: string[] = []

    // Foto de perfil — alta prioridad si no tiene
    if (!profile.avatar) {
      tips.push('Sube una foto de perfil para generar más confianza en las empresas.')
    }

    // Bio incompleta
    if (!profile.bio || profile.bio.trim().length < 30) {
      tips.push('Escribe una descripción personal de al menos 2 oraciones sobre ti y tus intereses.')
    }

    // Headline vacío
    if (!profile.headline) {
      tips.push('Agrega un titular profesional (ej: "Técnico en Informática · 4° Año").')
    }

    // Pocas habilidades
    if ((profile.skills?.length ?? 0) < 3) {
      tips.push('Agrega al menos 3 habilidades técnicas o blandas a tu perfil.')
    }

    // Sin validaciones
    if (breakdown.validations === 0 && (profile.skills?.length ?? 0) > 0) {
      tips.push('Pide a tu colegio que valide tus habilidades para aumentar tu credibilidad.')
    }

    // Sin evidencias
    if (breakdown.evidences === 0) {
      tips.push('Sube tu primer proyecto o certificado al portafolio para mostrarte a las empresas.')
    }

    // Sin foto de portada
    if (!profile.coverImage && breakdown.evidences > 0) {
      tips.push('Agrega una imagen de portada para personalizar tu perfil.')
    }

    // Retornar máximo 4 tips ordenados por impacto
    return tips.slice(0, 4)
  }
}
