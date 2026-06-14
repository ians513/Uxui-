import { Injectable } from '@nestjs/common'
import { Skill } from '../skills/entities/skill.entity'
import { PortfolioEvidence } from '../students/entities/portfolio-evidence.entity'
import { findSkillEntry, canonicalize, SKILLS_CATALOG } from './skills-catalog'

// ─── Result types ─────────────────────────────────────────────────────────────

export interface MatchDetail {
  requirement: string        // Nombre original de la oferta
  canonical: string          // Nombre normalizado
  isMet: boolean
  matchedVia?: 'exact' | 'synonym' | 'evidence'
  category: 'TECNICA' | 'BLANDA' | 'DESCONOCIDA'
}

export interface MatchResult {
  score: number              // 0-100 puntuación final
  technicalScore: number     // 0-100 componente técnico
  softScore: number          // 0-100 componente blando
  evidenceBonus: number      // 0-5 bonus por evidencias
  matchedCount: number       // cuántos requisitos cumple
  totalCount: number         // total de requisitos
  details: MatchDetail[]
  explanation: string        // Mensaje amigable
  tips: string[]             // Sugerencias de mejora
}

// ─── Weights ──────────────────────────────────────────────────────────────────

const WEIGHT_TECHNICAL = 0.70  // 70% peso en habilidades técnicas
const WEIGHT_SOFT      = 0.30  // 30% peso en habilidades blandas
const MAX_EVIDENCE_BONUS = 5   // Máximo 5 puntos por evidencias

@Injectable()
export class MatchService {

  /**
   * Calcula la compatibilidad entre un estudiante y una oferta laboral.
   *
   * Lógica:
   *  1. Normaliza los skills del estudiante y los requisitos de la oferta usando el catálogo
   *  2. Clasifica cada requisito como TECNICA o BLANDA
   *  3. Calcula score técnico (70%) y blando (30%) por separado
   *  4. Agrega un pequeño bonus (máx 5 pts) si el estudiante tiene evidencias relacionadas
   *  5. Devuelve el resultado con explicación legible y sugerencias
   */
  calculate(
    studentSkills: Skill[],
    requiredSkillNames: string[],
    studentEvidences?: PortfolioEvidence[],
  ): MatchResult {

    // Si la oferta no especifica habilidades, asumimos compatibilidad total
    if (!requiredSkillNames || requiredSkillNames.length === 0) {
      return this.buildFullMatchResult()
    }

    // ── Paso 1: Normalizar habilidades del estudiante ───────────────────────
    const studentCanonicals = new Set<string>(
      studentSkills.map(s => canonicalize(s.name))
    )

    // Agrupamos también por alias para matching más amplio
    const studentAliasSet = new Set<string>()
    for (const skill of studentSkills) {
      const lower = skill.name.trim().toLowerCase()
      studentAliasSet.add(lower)
      const entry = findSkillEntry(skill.name)
      if (entry) {
        studentAliasSet.add(entry.canonical.toLowerCase())
        for (const alias of entry.aliases) {
          studentAliasSet.add(alias.toLowerCase())
        }
      }
    }

    // ── Paso 2: Construir detalles por cada requisito ───────────────────────
    const details: MatchDetail[] = requiredSkillNames.map(reqName => {
      const canonical = canonicalize(reqName)
      const entry = findSkillEntry(reqName)
      const category = entry?.category ?? 'DESCONOCIDA'

      // Verificar si el estudiante cumple el requisito
      let isMet = false
      let matchedVia: MatchDetail['matchedVia'] = undefined

      if (studentCanonicals.has(canonical)) {
        isMet = true
        matchedVia = 'exact'
      } else if (studentAliasSet.has(reqName.trim().toLowerCase())) {
        isMet = true
        matchedVia = 'synonym'
      } else if (entry) {
        // Revisar si algún alias del requisito coincide con los del estudiante
        const allReqAliases = [entry.canonical, ...entry.aliases].map(a => a.toLowerCase())
        if (allReqAliases.some(a => studentAliasSet.has(a))) {
          isMet = true
          matchedVia = 'synonym'
        }
      }

      return { requirement: reqName, canonical, isMet, matchedVia, category }
    })

    // ── Paso 3: Calcular score por categoría ────────────────────────────────
    const technical = details.filter(d => d.category === 'TECNICA' || d.category === 'DESCONOCIDA')
    const soft      = details.filter(d => d.category === 'BLANDA')

    const techScore = technical.length > 0
      ? (technical.filter(d => d.isMet).length / technical.length) * 100
      : 100

    const softScore = soft.length > 0
      ? (soft.filter(d => d.isMet).length / soft.length) * 100
      : 100

    // ── Paso 4: Bonus por evidencias ────────────────────────────────────────
    const evidenceBonus = this.calculateEvidenceBonus(
      details,
      studentEvidences ?? [],
    )

    // ── Paso 5: Score final ponderado ───────────────────────────────────────
    const hasTechnical = technical.length > 0
    const hasSoft      = soft.length > 0

    let rawScore: number
    if (hasTechnical && hasSoft) {
      rawScore = techScore * WEIGHT_TECHNICAL + softScore * WEIGHT_SOFT
    } else if (hasTechnical) {
      rawScore = techScore
    } else {
      rawScore = softScore
    }

    const finalScore = Math.min(100, Math.round(rawScore + evidenceBonus))

    // ── Paso 6: Explicación y sugerencias ───────────────────────────────────
    const matchedCount = details.filter(d => d.isMet).length
    const totalCount   = details.length

    const explanation = this.buildExplanation(finalScore, matchedCount, totalCount, technical, soft)
    const tips        = this.buildTips(details)

    return {
      score: finalScore,
      technicalScore: Math.round(techScore),
      softScore: Math.round(softScore),
      evidenceBonus,
      matchedCount,
      totalCount,
      details,
      explanation,
      tips,
    }
  }

  // ─── Evidence bonus ──────────────────────────────────────────────────────

  private calculateEvidenceBonus(
    details: MatchDetail[],
    evidences: PortfolioEvidence[],
  ): number {
    if (evidences.length === 0) return 0

    const missingRequirements = details
      .filter(d => !d.isMet)
      .map(d => d.canonical.toLowerCase())

    let bonusPoints = 0

    for (const evidence of evidences) {
      const evidenceText = [
        evidence.title,
        evidence.description ?? '',
        ...(evidence.tags ?? []),
      ].join(' ').toLowerCase()

      // Si la evidencia menciona un requisito faltante, suma 1 punto
      const mentionsMissing = missingRequirements.some(req =>
        evidenceText.includes(req) ||
        req.split(/\s+/).some(word => word.length > 3 && evidenceText.includes(word))
      )

      if (mentionsMissing) {
        bonusPoints += 1
      }
    }

    return Math.min(bonusPoints, MAX_EVIDENCE_BONUS)
  }

  // ─── Explanation builder ─────────────────────────────────────────────────

  private buildExplanation(
    score: number,
    matched: number,
    total: number,
    technical: MatchDetail[],
    soft: MatchDetail[],
  ): string {
    const matchedTech = technical.filter(d => d.isMet).length
    const matchedSoft = soft.filter(d => d.isMet).length

    const partes: string[] = []

    if (technical.length > 0) {
      partes.push(`${matchedTech} de ${technical.length} habilidad${technical.length !== 1 ? 'es' : ''} técnica${technical.length !== 1 ? 's' : ''}`)
    }
    if (soft.length > 0) {
      partes.push(`${matchedSoft} de ${soft.length} habilidad${soft.length !== 1 ? 'es' : ''} blanda${soft.length !== 1 ? 's' : ''}`)
    }

    const resumen = partes.length > 0
      ? `Coincide con ${partes.join(' y ')}.`
      : `Coincide con ${matched} de ${total} requisitos.`

    let mensaje: string
    if (score >= 85) {
      mensaje = 'Excelente compatibilidad — tu perfil encaja muy bien con esta oferta.'
    } else if (score >= 70) {
      mensaje = 'Buena compatibilidad — cumples la mayoría de los requisitos para postular.'
    } else if (score >= 50) {
      mensaje = 'Compatibilidad media — tienes una base sólida, considera postular igual.'
    } else if (score >= 30) {
      mensaje = 'Compatibilidad parcial — te faltan algunas habilidades clave, pero puedes seguir creciendo.'
    } else {
      mensaje = 'Aún falta camino por recorrer — esta oferta requiere habilidades que todavía estás desarrollando.'
    }

    return `${resumen} ${mensaje}`
  }

  // ─── Tips builder ────────────────────────────────────────────────────────

  private buildTips(details: MatchDetail[]): string[] {
    const missing = details.filter(d => !d.isMet)
    if (missing.length === 0) {
      return ['Tu perfil cumple todos los requisitos de esta oferta. ¡Anímate a postular!']
    }

    const tips: string[] = []

    const missingTech = missing.filter(d => d.category === 'TECNICA' || d.category === 'DESCONOCIDA')
    const missingSoft  = missing.filter(d => d.category === 'BLANDA')

    if (missingTech.length > 0) {
      const names = missingTech.slice(0, 3).map(d => d.requirement).join(', ')
      tips.push(`Agregar habilidades técnicas como: ${names}.`)
    }

    if (missingSoft.length > 0) {
      const names = missingSoft.slice(0, 2).map(d => d.requirement).join(', ')
      tips.push(`Declarar habilidades blandas como: ${names}.`)
    }

    if (missing.length > 0) {
      tips.push('Sube evidencias o proyectos relacionados para compensar las habilidades faltantes.')
    }

    return tips
  }

  // ─── Full match fallback ─────────────────────────────────────────────────

  private buildFullMatchResult(): MatchResult {
    return {
      score: 100,
      technicalScore: 100,
      softScore: 100,
      evidenceBonus: 0,
      matchedCount: 0,
      totalCount: 0,
      details: [],
      explanation: 'Esta oferta no especifica habilidades requeridas. ¡Todos los perfiles son bienvenidos!',
      tips: [],
    }
  }
}
