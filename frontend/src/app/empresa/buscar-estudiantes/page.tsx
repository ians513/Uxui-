'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Avatar } from '@/components/ui/Avatar'
import { SkillList } from '@/components/ui/SkillPill'
import { api } from '@/lib/api-client'
import { useAuthStore } from '@/store/auth.store'
import { scoreBgColor } from '@/lib/utils'
import type { StudentProfile } from '@/types'

const SPECIALTIES = ['Informática', 'Redes', 'Electrónica', 'Mecánica', 'Administración', 'Gastronomía', 'Logística']
const YEARS = [1, 2, 3, 4, 5, 6, 7]

export default function BuscarEstudiantesPage() {
  const { isAuthenticated } = useAuthStore()
  const router = useRouter()

  const [students, setStudents]       = useState<StudentProfile[]>([])
  const [total, setTotal]             = useState(0)
  const [loading, setLoading]         = useState(true)
  // Filters
  const [query, setQuery]             = useState('')
  const [specialties, setSpecialties] = useState<string[]>([])
  const [years, setYears]             = useState<number[]>([])
  const [minScore, setMinScore]       = useState(0)
  const [skillInput, setSkillInput]   = useState('')
  const [skillFilters, setSkillFilters] = useState<string[]>([])

  const fetchStudents = useCallback(async () => {
    setLoading(true)
    try {
      if (isAuthenticated) {
        const params = new URLSearchParams()
        if (specialties.length === 1) params.set('specialty', specialties[0])
        if (years.length === 1) params.set('year', String(years[0]))
        if (minScore > 0) params.set('minScore', String(minScore))
        skillFilters.forEach(s => params.append('skills', s))
        params.set('limit', '50')

        const res = await api.get<{ data: StudentProfile[]; total: number }>(
          `/students/search?${params.toString()}`
        )

        // Apply text query client-side
        let data = res.data
        if (query.trim()) {
          const q = query.toLowerCase()
          data = data.filter(s =>
            `${s.firstName} ${s.lastName}`.toLowerCase().includes(q) ||
            s.specialty?.toLowerCase().includes(q) ||
            s.skills.some(sk => sk.name.toLowerCase().includes(q))
          )
        }
        // Multi-specialty filter
        if (specialties.length > 1) {
          data = data.filter(s => specialties.some(sp => s.specialty?.toLowerCase().includes(sp.toLowerCase())))
        }
        // Multi-year filter
        if (years.length > 1) {
          data = data.filter(s => years.includes(s.year))
        }

        setStudents(data)
        setTotal(data.length)
      }
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [isAuthenticated, query, specialties, years, minScore, skillFilters])

  // Initial load + re-fetch on filter change (debounced for text)
  useEffect(() => {
    const timer = setTimeout(fetchStudents, query ? 400 : 0)
    return () => clearTimeout(timer)
  }, [fetchStudents, query])

  const toggleSpecialty = (s: string) =>
    setSpecialties(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s])

  const toggleYear = (y: number) =>
    setYears(prev => prev.includes(y) ? prev.filter(x => x !== y) : [...prev, y])

  const addSkillFilter = () => {
    const s = skillInput.trim()
    if (!s || skillFilters.includes(s)) return
    setSkillFilters(prev => [...prev, s])
    setSkillInput('')
  }

  const removeSkillFilter = (s: string) =>
    setSkillFilters(prev => prev.filter(x => x !== s))

  const clearAllFilters = () => {
    setQuery('')
    setSpecialties([])
    setYears([])
    setMinScore(0)
    setSkillFilters([])
  }

  const activeFilterCount = specialties.length + years.length + skillFilters.length + (minScore > 0 ? 1 : 0)

  return (
    <>
    <main className="max-w-[1440px] mx-auto px-8 py-10">
      <div className="mb-8">
        <h1 className="font-headline text-3xl font-bold text-on-surface">Buscar Talento</h1>
        <p className="text-on-surface-variant mt-1">
          Encuentra estudiantes técnicos por especialidad, habilidades o nivel de preparación.
        </p>
      </div>

      {/* Search bar */}
      <div className="card p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 flex items-center bg-surface-container-low rounded-lg px-4 py-2.5 gap-2">
            <span className="material-symbols-outlined text-outline text-[20px]">search</span>
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Buscar por nombre, habilidad o especialidad..."
              className="bg-transparent outline-none text-sm w-full placeholder:text-outline"
            />
            {query && (
              <button onClick={() => setQuery('')} className="text-outline hover:text-error">
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="flex items-center gap-2 bg-surface-container-low rounded-lg px-3 py-2.5">
              <input
                value={skillInput}
                onChange={e => setSkillInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addSkillFilter()}
                placeholder="Agregar habilidad..."
                className="bg-transparent outline-none text-sm w-32 placeholder:text-outline"
              />
              <button onClick={addSkillFilter} className="text-primary hover:opacity-70">
                <span className="material-symbols-outlined text-[18px]">add</span>
              </button>
            </div>
            {activeFilterCount > 0 && (
              <button
                onClick={clearAllFilters}
                className="text-xs text-outline hover:text-error transition-colors font-semibold"
              >
                Limpiar filtros ({activeFilterCount})
              </button>
            )}
          </div>
        </div>

        {/* Active skill filters */}
        {skillFilters.length > 0 && (
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            <span className="text-[11px] font-bold text-outline uppercase tracking-wider">Habilidades:</span>
            {skillFilters.map(tag => (
              <span key={tag} className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full bg-primary-fixed text-primary">
                {tag}
                <button onClick={() => removeSkillFilter(tag)}>
                  <span className="material-symbols-outlined text-[13px] hover:text-error">close</span>
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        {/* Sidebar */}
        <aside className="md:col-span-3 space-y-5">
          <div className="card p-5">
            <h3 className="font-headline font-bold text-[11px] uppercase tracking-widest text-outline mb-4">Score mínimo</h3>
            <input
              type="range" min="0" max="100" step="5"
              value={minScore}
              onChange={e => setMinScore(Number(e.target.value))}
              className="w-full accent-primary"
            />
            <div className="flex justify-between text-xs text-outline mt-1">
              <span>0</span>
              <span className="font-bold text-primary">{minScore}%</span>
              <span>100</span>
            </div>
          </div>

          <div className="card p-5">
            <h3 className="font-headline font-bold text-[11px] uppercase tracking-widest text-outline mb-4">Especialidad</h3>
            <div className="space-y-2.5">
              {SPECIALTIES.map(s => (
                <label key={s} className="flex items-center gap-2.5 cursor-pointer" onClick={() => toggleSpecialty(s)}>
                  <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all ${
                    specialties.includes(s)
                      ? 'bg-primary-container border-primary-container'
                      : 'border-outline-variant'
                  }`}>
                    {specialties.includes(s) && (
                      <span className="material-symbols-outlined text-on-primary text-[11px]">check</span>
                    )}
                  </div>
                  <span className="text-sm text-on-surface-variant">{s}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="card p-5">
            <h3 className="font-headline font-bold text-[11px] uppercase tracking-widest text-outline mb-4">Año cursado</h3>
            <div className="grid grid-cols-4 gap-1.5">
              {YEARS.map(y => (
                <button
                  key={y}
                  onClick={() => toggleYear(y)}
                  className={`py-2 rounded-lg text-sm font-bold transition-all ${
                    years.includes(y)
                      ? 'bg-primary-container text-on-primary'
                      : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
                  }`}
                >
                  {y}°
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Results */}
        <section className="md:col-span-9">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-on-surface-variant font-semibold">
              {loading ? 'Buscando...' : `${total} estudiantes encontrados`}
            </p>
          </div>

          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="card p-6 animate-pulse">
                  <div className="flex gap-5">
                    <div className="w-16 h-16 rounded-xl bg-surface-container-low shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-5 w-48 bg-surface-container rounded" />
                      <div className="h-3 w-36 bg-surface-container-low rounded" />
                      <div className="h-3 w-24 bg-surface-container-low rounded" />
                      <div className="flex gap-2 mt-3">
                        {[1,2,3,4].map(j => <div key={j} className="h-6 w-16 bg-surface-container rounded-full" />)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : students.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center card">
              <span className="material-symbols-outlined text-[64px] text-outline">person_search</span>
              <h2 className="font-headline text-xl font-bold text-on-surface mt-4">Sin resultados</h2>
              <p className="text-on-surface-variant text-sm mt-2">
                Probá ajustando los filtros de búsqueda.
              </p>
              <button onClick={clearAllFilters} className="mt-4 text-primary text-sm font-semibold hover:underline">
                Limpiar todos los filtros
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {students.map((student) => {
                const fullName = `${student.firstName} ${student.lastName}`
                return (
                  <article key={student.id} className="card p-6 group">
                    <div className="flex items-start gap-5">
                      <Avatar src={student.avatar} name={fullName} size="xl" shape="rounded" className="shrink-0" />

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3 flex-wrap">
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-headline font-bold text-lg text-on-surface group-hover:text-primary transition-colors">
                                {fullName}
                              </h3>
                              <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${scoreBgColor(student.readinessScore ?? 0)}`}>
                                {student.readinessScore ?? 0}% listo
                              </span>
                            </div>
                            <p className="text-sm text-on-surface-variant">{student.headline}</p>
                            <p className="text-xs text-outline mt-0.5 flex items-center gap-1">
                              <span className="material-symbols-outlined text-[13px]">school</span>
                              {student.schoolName ? `${student.schoolName} · ` : ''}{student.specialty} · {student.year}° año
                              {student.location && (
                                <>
                                  <span className="mx-1">·</span>
                                  <span className="material-symbols-outlined text-[13px]">location_on</span>
                                  {student.location}
                                </>
                              )}
                            </p>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              onClick={() => router.push(`/empresa/mensajes?with=${student.userId}`)}
                              className="flex items-center gap-1.5 px-4 py-2 rounded-lg editorial-gradient text-on-primary text-sm font-bold hover:opacity-90 transition-opacity"
                            >
                              <span className="material-symbols-outlined text-[16px]">mail</span>
                              Contactar
                            </button>
                          </div>
                        </div>

                        <div className="mt-4">
                          <SkillList skills={student.skills} maxVisible={5} />
                        </div>

                        <div className="flex items-center gap-5 mt-4 pt-4 border-t border-outline-variant/10 text-xs text-outline">
                          <span className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-[14px]">psychology</span>
                            {student.skills.length} habilidades
                          </span>
                          <span className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-[14px]">verified</span>
                            {student.skills.filter(s => s.isValidated).length} validadas
                          </span>
                          <span className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-[14px]">folder_open</span>
                            {student.evidences?.length ?? 0} evidencias
                          </span>
                          <button
                            onClick={() => router.push(`/student/ver/${student.userId}`)}
                            className="ml-auto text-primary font-semibold hover:underline"
                          >
                            Ver perfil completo →
                          </button>
                        </div>
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </section>
      </div>
    </main>
    </>
  )
}
