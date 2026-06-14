'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { api } from '@/lib/api-client'
import { useAuthStore } from '@/store/auth.store'
import type { StudentProfile } from '@/types'

// ── Score badge ────────────────────────────────────────────────────────────────
function ScoreBadge({ score }: { score: number }) {
  const color = score >= 80 ? '#16a34a' : score >= 40 ? '#d97706' : '#dc2626'
  const bg    = score >= 80 ? '#f0fdf4' : score >= 40 ? '#fffbeb' : '#fef2f2'
  return (
    <span style={{ background: bg, color, border: `1px solid ${color}30` }}
      className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full">
      <span style={{ color }}>●</span> {score}% empleabilidad
    </span>
  )
}

// ── Section heading ────────────────────────────────────────────────────────────
function SectionHeading({ icon, label }: { icon: string; label: string }) {
  return (
    <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-200">
      <span className="material-symbols-outlined text-[16px] text-[#2563eb]">{icon}</span>
      <h2 className="text-[11px] font-black uppercase tracking-[0.12em] text-gray-500">{label}</h2>
    </div>
  )
}

// ── Skill chip ─────────────────────────────────────────────────────────────────
function SkillChip({ name, validated }: { name: string; validated?: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border ${
      validated
        ? 'bg-green-50 border-green-300 text-green-800'
        : 'bg-gray-50 border-gray-200 text-gray-700'
    }`}>
      {name}
      {validated && <span className="text-green-600 font-black">✓</span>}
    </span>
  )
}

// ── Evidence item types ────────────────────────────────────────────────────────
const typeLabel: Record<string, string> = {
  PROYECTO: 'Proyecto', CERTIFICADO: 'Certificado',
  FOTO: 'Evidencia', DESCRIPCION: 'Descripción', VIDEO: 'Video',
}
const typeColor: Record<string, string> = {
  PROYECTO:    '#2563eb', CERTIFICADO: '#7c3aed',
  FOTO:        '#0891b2', DESCRIPCION: '#6b7280', VIDEO: '#dc2626',
}

// ── Main page ──────────────────────────────────────────────────────────────────
export default function CVPage() {
  const { isAuthenticated } = useAuthStore()
  const [student, setStudent] = useState<StudentProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isAuthenticated) { setLoading(false); return }
    api.get<StudentProfile>('/students/me')
      .then(s => setStudent(s))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [isAuthenticated])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-[3px] border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-500 font-medium">Cargando CV...</p>
        </div>
      </div>
    )
  }

  if (!student) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center">
          <p className="text-sm text-gray-500">No se encontró el perfil.</p>
          <Link href="/student/perfil" className="mt-4 inline-block text-sm font-semibold text-blue-600 hover:underline">
            ← Volver al perfil
          </Link>
        </div>
      </div>
    )
  }

  const fullName        = `${student.firstName} ${student.lastName}`
  const technicalSkills = student.skills?.filter(s => s.category === 'TECNICA') ?? []
  const softSkills      = student.skills?.filter(s => s.category === 'BLANDA') ?? []
  const certSkills      = student.skills?.filter(s => s.category === 'CERTIFICACION') ?? []
  const validatedCount  = student.skills?.filter(s => s.isValidated).length ?? 0
  const schoolName      = (student as any).schoolName as string | undefined

  return (
    <div className="min-h-screen bg-gray-100 print:bg-white">
      {/* ── Toolbar (hidden on print) ─────────────────────────────────────── */}
      <div className="no-print bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-3">
          <Link
            href="/student/perfil"
            className="flex items-center gap-1.5 text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            Volver al perfil
          </Link>
          <span className="text-gray-300">|</span>
          <span className="text-sm text-gray-500">Vista previa del CV</span>
        </div>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 bg-blue-600 text-white font-bold px-5 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm shadow-sm"
        >
          <span className="material-symbols-outlined text-[16px]">download</span>
          Exportar PDF
        </button>
      </div>

      {/* ── CV Document ───────────────────────────────────────────────────── */}
      <div className="py-8 px-4 print:p-0 print:py-0">
        <div className="cv-document max-w-[794px] mx-auto bg-white shadow-lg print:shadow-none">

          {/* Header stripe */}
          <div className="bg-[#1e3a5f] px-10 py-8 print:px-8 print:py-6">
            <div className="flex items-start justify-between gap-6">
              <div className="flex-1 min-w-0">
                <h1 className="text-3xl font-black text-white tracking-tight leading-tight">{fullName}</h1>
                {student.headline && (
                  <p className="text-blue-200 text-base font-medium mt-1 leading-snug">{student.headline}</p>
                )}
                {schoolName && (
                  <div className="inline-flex items-center gap-1.5 mt-3 px-3 py-1.5 rounded-full bg-white/15 border border-white/30">
                    <span className="material-symbols-outlined text-[13px] text-white icon-filled">school</span>
                    <span className="text-white text-sm font-bold">Avalado por {schoolName}</span>
                  </div>
                )}
              </div>
              <ScoreBadge score={student.readinessScore} />
            </div>

            {/* Meta row */}
            <div className="flex flex-wrap gap-x-5 gap-y-1.5 mt-4">
              <span className="flex items-center gap-1.5 text-blue-100 text-sm">
                <span className="material-symbols-outlined text-[14px] text-blue-300">psychology</span>
                {student.specialty} · {student.year}° año
              </span>
              {student.location && (
                <span className="flex items-center gap-1.5 text-blue-100 text-sm">
                  <span className="material-symbols-outlined text-[14px] text-blue-300">location_on</span>
                  {student.location}
                </span>
              )}
              {validatedCount > 0 && (
                <span className="flex items-center gap-1.5 text-green-300 text-sm font-semibold">
                  <span className="material-symbols-outlined text-[14px]">verified</span>
                  {validatedCount} habilidades validadas
                </span>
              )}
            </div>

            {/* Links */}
            {(student.githubUrl || student.linkedinUrl) && (
              <div className="flex flex-wrap gap-4 mt-3">
                {student.githubUrl && (
                  <span className="flex items-center gap-1.5 text-blue-200 text-xs">
                    <span className="material-symbols-outlined text-[13px]">code</span>
                    {student.githubUrl}
                  </span>
                )}
                {student.linkedinUrl && (
                  <span className="flex items-center gap-1.5 text-blue-200 text-xs">
                    <span className="material-symbols-outlined text-[13px]">link</span>
                    {student.linkedinUrl}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Body */}
          <div className="grid grid-cols-[1fr_260px] print:grid-cols-[1fr_240px]">

            {/* ── Left column ─────────────────────────────────────────────── */}
            <div className="px-10 py-8 print:px-8 print:py-6 space-y-7 border-r border-gray-100">

              {/* Bio */}
              {student.bio && (
                <section>
                  <SectionHeading icon="person" label="Perfil profesional" />
                  <p className="text-sm text-gray-700 leading-relaxed">{student.bio}</p>
                </section>
              )}

              {/* Portfolio evidences */}
              {student.evidences?.length > 0 && (
                <section>
                  <SectionHeading icon="folder_open" label="Portafolio y experiencia" />
                  <div className="space-y-4">
                    {student.evidences.map(ev => (
                      <div key={ev.id} className="flex gap-3">
                        <div
                          className="w-1 rounded-full shrink-0 mt-1"
                          style={{ backgroundColor: typeColor[ev.type] ?? '#6b7280', minHeight: '100%' }}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className="text-[10px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded"
                              style={{
                                color: typeColor[ev.type] ?? '#6b7280',
                                background: `${typeColor[ev.type] ?? '#6b7280'}18`,
                              }}
                            >
                              {typeLabel[ev.type] ?? ev.type}
                            </span>
                            {ev.url && (
                              <span className="text-[10px] text-blue-500 truncate max-w-[180px]">{ev.url}</span>
                            )}
                          </div>
                          <h3 className="text-sm font-bold text-gray-900 mt-0.5 leading-snug">{ev.title}</h3>
                          {ev.description && (
                            <p className="text-xs text-gray-600 mt-0.5 leading-relaxed line-clamp-3">{ev.description}</p>
                          )}
                          {ev.tags?.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1.5">
                              {ev.tags.map(tag => (
                                <span key={tag} className="text-[9px] font-semibold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Soft skills */}
              {softSkills.length > 0 && (
                <section>
                  <SectionHeading icon="psychology_alt" label="Habilidades blandas" />
                  <div className="flex flex-wrap gap-1.5">
                    {softSkills.map(s => (
                      <SkillChip key={s.id} name={s.name} validated={s.isValidated} />
                    ))}
                  </div>
                </section>
              )}
            </div>

            {/* ── Right column ────────────────────────────────────────────── */}
            <div className="px-6 py-8 print:px-5 print:py-6 bg-gray-50 space-y-6">

              {/* Technical skills */}
              {technicalSkills.length > 0 && (
                <section>
                  <SectionHeading icon="code" label="Habilidades técnicas" />
                  <div className="flex flex-col gap-2">
                    {technicalSkills.map(s => (
                      <div key={s.id} className="flex items-center justify-between">
                        <span className={`text-xs font-semibold ${s.isValidated ? 'text-green-800' : 'text-gray-700'}`}>
                          {s.name}
                          {s.isValidated && <span className="text-green-600 font-black ml-1">✓</span>}
                        </span>
                        {s.level && (
                          <div className="flex gap-0.5">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <div
                                key={i}
                                className={`w-2.5 h-2.5 rounded-sm ${i < s.level! ? 'bg-blue-600' : 'bg-gray-200'}`}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Certifications */}
              {certSkills.length > 0 && (
                <section>
                  <SectionHeading icon="workspace_premium" label="Certificaciones" />
                  <div className="space-y-1.5">
                    {certSkills.map(s => (
                      <div key={s.id} className="flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[13px] text-purple-500 shrink-0 icon-filled">
                          workspace_premium
                        </span>
                        <span className="text-xs font-semibold text-gray-700">{s.name}</span>
                        {s.isValidated && <span className="text-green-600 font-black text-[10px]">✓</span>}
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Stats */}
              <section>
                <SectionHeading icon="bar_chart" label="Estadísticas" />
                <div className="space-y-2">
                  {[
                    { label: 'Habilidades', value: student.skills?.length ?? 0, icon: 'psychology' },
                    { label: 'Validadas', value: validatedCount, icon: 'verified' },
                    { label: 'Evidencias', value: student.evidences?.length ?? 0, icon: 'folder_open' },
                    { label: 'Vistas del perfil', value: student.profileViews ?? 0, icon: 'visibility' },
                  ].map(({ label, value, icon }) => (
                    <div key={label} className="flex items-center justify-between py-1.5 border-b border-gray-100 last:border-0">
                      <div className="flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[13px] text-blue-500">{icon}</span>
                        <span className="text-xs text-gray-600">{label}</span>
                      </div>
                      <span className="text-xs font-black text-gray-900">{value}</span>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-gray-100 px-10 py-3 print:px-8 flex items-center justify-between">
            <span className="text-[10px] text-gray-400">Generado desde Red Talento</span>
            <span className="text-[10px] text-gray-400">
              {new Date().toLocaleDateString('es-CL', { year: 'numeric', month: 'long', day: 'numeric' })}
            </span>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .cv-document { box-shadow: none !important; max-width: 100% !important; }
          .min-h-screen { min-height: unset !important; }
          @page { margin: 0; size: A4; }
        }
      `}</style>
    </div>
  )
}
