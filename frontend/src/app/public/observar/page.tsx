'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { Avatar } from '@/components/ui/Avatar'
import { api } from '@/lib/api-client'
import { scoreBgColor, mediaUrl } from '@/lib/utils'
import type { StudentProfile } from '@/types'

// ── Count-up animation hook ────────────────────────────────────────────────────
function useCountUp(target: number, duration = 1000, active = false): number {
  const [count, setCount] = useState(0)
  useEffect(() => {
    if (!active || target === 0) { setCount(target); return }
    let startTime: number | null = null
    let raf: number
    const step = (ts: number) => {
      if (!startTime) startTime = ts
      const progress = Math.min((ts - startTime) / duration, 1)
      setCount(Math.floor(progress * target))
      if (progress < 1) raf = requestAnimationFrame(step)
      else setCount(target)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [target, duration, active])
  return count
}

export default function ObservarPage() {
  const [students, setStudents]           = useState<StudentProfile[]>([])
  const [loading, setLoading]             = useState(true)
  const [filtroActivo, setFiltroActivo]   = useState('Todos')
  const [search, setSearch]               = useState('')
  const [podiumVisible, setPodiumVisible] = useState(false)
  const cardsContainerRef = useRef<HTMLDivElement>(null)

  // Count-up targets (hooks must be at top level)
  const countActive      = useCountUp(students.length, 1000, !loading)
  const countDisponibles = useCountUp(
    students.filter(s => (s.readinessScore ?? 0) >= 60).length, 1000, !loading
  )
  const countEspec = useCountUp(
    new Set(students.map(s => s.specialty).filter(Boolean)).size, 800, !loading
  )

  useEffect(() => {
    api.get<{ data: StudentProfile[]; total: number }>('/students/public-list?limit=50')
      .then(r => setStudents(Array.isArray(r) ? r : (r as any).data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  // Trigger podium animation after data loads
  useEffect(() => {
    if (!loading && students.length > 0) {
      const t = setTimeout(() => setPodiumVisible(true), 200)
      return () => clearTimeout(t)
    }
  }, [loading, students.length])

  // Scroll-reveal for cards
  useEffect(() => {
    const container = cardsContainerRef.current
    if (!container) return
    const t = setTimeout(() => {
      const cards = container.querySelectorAll<HTMLElement>('.student-card')
      if (!cards.length) return
      const observer = new IntersectionObserver(
        (entries) => entries.forEach(e => {
          if (e.isIntersecting) {
            e.target.classList.add('card-visible')
            observer.unobserve(e.target)
          }
        }),
        { threshold: 0.08 }
      )
      cards.forEach(c => observer.observe(c))
      return () => observer.disconnect()
    }, 60)
    return () => clearTimeout(t)
  }, [students, filtroActivo, search])

  const especialidades = ['Todos', ...Array.from(new Set(students.map(s => s.specialty).filter(Boolean)))]

  const filtered = students
    .filter(s => filtroActivo === 'Todos' || s.specialty === filtroActivo)
    .filter(s => {
      if (!search.trim()) return true
      const q = search.toLowerCase()
      return `${s.firstName} ${s.lastName}`.toLowerCase().includes(q) ||
             s.specialty?.toLowerCase().includes(q) ||
             s.skills?.some(sk => sk.name.toLowerCase().includes(q))
    })

  const topThree = [...students]
    .sort((a, b) => (b.readinessScore ?? 0) - (a.readinessScore ?? 0))
    .slice(0, 3)

  const podium: { student: StudentProfile; pos: 1 | 2 | 3 }[] = []
  if (topThree.length >= 2) podium.push({ student: topThree[1], pos: 2 })
  if (topThree.length >= 1) podium.push({ student: topThree[0], pos: 1 })
  if (topThree.length >= 3) podium.push({ student: topThree[2], pos: 3 })

  const podiumConfig: Record<1|2|3, {
    bar: string; badge: string; ring: string; label: string
    h: number; delay: string; size: 'sm' | 'md' | 'xl'
  }> = {
    1: { bar: 'bg-gradient-to-t from-amber-600 to-amber-400',   badge: 'bg-amber-400 text-amber-900',  ring: 'ring-amber-400',  label: 'text-amber-300',  h: 140, delay: '100ms', size: 'xl' },
    2: { bar: 'bg-gradient-to-t from-slate-500 to-slate-300',   badge: 'bg-slate-300 text-slate-800',  ring: 'ring-slate-300',  label: 'text-slate-400',  h: 108, delay: '0ms',   size: 'md' },
    3: { bar: 'bg-gradient-to-t from-orange-700 to-orange-500', badge: 'bg-orange-500 text-white',     ring: 'ring-orange-500', label: 'text-orange-300', h: 76,  delay: '200ms', size: 'sm' },
  }

  return (
    <div className="min-h-screen bg-surface pb-12 font-body text-on-surface">

      {/* ── Animation styles ─────────────────────────────────────────────────── */}
      <style>{`
        .student-card {
          opacity: 0;
          transform: translateY(20px);
          transition: opacity 0.5s ease-out, transform 0.5s ease-out,
                      box-shadow 0.2s ease, border-color 0.2s ease;
        }
        .student-card.card-visible {
          opacity: 1;
          transform: translateY(0);
        }
        @keyframes crown-bounce {
          0%   { transform: translateY(0) rotate(0deg); }
          25%  { transform: translateY(-10px) rotate(-5deg); }
          50%  { transform: translateY(-5px) rotate(3deg); }
          75%  { transform: translateY(-8px) rotate(-2deg); }
          100% { transform: translateY(0) rotate(0deg); }
        }
        .crown-anim { animation: crown-bounce 0.9s ease-out 0.3s 1 both; }
      `}</style>

      {/* ── Topbar ───────────────────────────────────────────────────────────── */}
      <div className="bg-surface border-b border-outline-variant/30 px-5 h-20 md:px-8 flex items-center justify-between flex-wrap gap-2 sticky top-0 z-10 glass-nav">
        <Link href="/public/landing" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl editorial-gradient flex items-center justify-center text-white shadow-sm">
            <span className="font-headline font-bold text-base leading-none">RT</span>
          </div>
          <span className="text-xl font-bold text-primary tracking-tight font-headline">Red Talento</span>
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/auth/login" className="text-sm font-medium text-on-surface-variant hover:text-primary transition-colors">
            Iniciar sesión
          </Link>
          <Link href="/auth/register?role=EMPRESA" className="bg-primary text-on-primary text-sm font-semibold px-5 py-2.5 rounded-full hover:bg-primary/90 transition-colors shadow-sm">
            Registrar mi empresa
          </Link>
        </div>
      </div>

      {/* ── Hero ─────────────────────────────────────────────────────────────── */}
      <div className="bg-surface-container-lowest px-6 py-16 text-center border-b border-outline-variant/20 shadow-subtle relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-primary/5 rounded-full blur-[100px] -z-10 pointer-events-none" />

        <h1 className="text-4xl md:text-5xl font-bold font-headline mb-4 tracking-tight max-w-4xl mx-auto text-on-surface">
          Directorio de <span className="text-primary">Talento Técnico</span>
        </h1>
        <p className="text-sm md:text-base text-on-surface-variant max-w-2xl mx-auto mb-10 leading-relaxed">
          Explora los perfiles destacados. Registra tu empresa para contactar a los estudiantes e invitarlos a procesos de práctica o contratación.
        </p>

        {loading ? (
          <div className="flex justify-center gap-8 md:gap-14 flex-wrap max-w-3xl mx-auto bg-surface py-6 px-8 rounded-3xl border border-outline-variant/30 shadow-sm">
            {[1,2,3].map(i => <div key={i} className="h-10 w-20 bg-surface-container rounded animate-pulse" />)}
          </div>
        ) : (
          <div className="flex justify-center gap-8 md:gap-14 flex-wrap max-w-3xl mx-auto bg-surface py-6 px-8 rounded-3xl border border-outline-variant/30 shadow-sm">
            {[
              { value: countActive,      label: 'Activos' },
              { value: countDisponibles, label: 'Disponibles' },
              { value: countEspec,       label: 'Especialidades' },
            ].map(({ value, label }) => (
              <div key={label} className="text-center">
                <div className="text-3xl font-bold text-primary font-headline tabular-nums">{value}</div>
                <div className="text-xs text-on-surface-variant mt-1 font-medium uppercase tracking-wider">{label}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-12">

        {/* ── Hall of Fame ─────────────────────────────────────────────────── */}
        {!loading && topThree.length > 0 && (
          <div className="mb-14">
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 bg-amber-50 border border-amber-200 px-5 py-2 rounded-full mb-4">
                <span className="text-xl">🏆</span>
                <span className="text-amber-800 font-bold text-sm uppercase tracking-widest">Salón de la Fama</span>
              </div>
              <h2 className="font-headline text-3xl font-bold text-on-surface mb-2">Los más destacados</h2>
              <p className="text-sm text-on-surface-variant max-w-md mx-auto">
                Estudiantes con mayor índice de empleabilidad en toda la plataforma.
              </p>
            </div>

            {/* Podium */}
            <div className="relative rounded-3xl overflow-hidden"
              style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)' }}>

              {/* Stars */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {[...Array(12)].map((_, i) => (
                  <div key={i} className="absolute w-1 h-1 bg-white rounded-full opacity-30"
                    style={{ left: `${(i * 37 + 10) % 95}%`, top: `${(i * 23 + 5) % 70}%` }}
                  />
                ))}
              </div>

              <div className="flex items-end justify-center gap-4 sm:gap-8 pt-12 px-6 relative z-10">
                {podium.map(({ student, pos }) => {
                  const cfg = podiumConfig[pos]
                  const isFirst = pos === 1
                  const fullName = `${student.firstName} ${student.lastName}`

                  return (
                    <div key={student.id} className="flex flex-col items-center gap-3">

                      {/* Crown */}
                      {isFirst && (
                        <div className={`text-2xl -mb-1 ${podiumVisible ? 'crown-anim' : 'opacity-0'}`}>
                          👑
                        </div>
                      )}

                      {/* Avatar */}
                      <div
                        className={`relative rounded-full ring-4 ${cfg.ring} shadow-lg`}
                        style={{
                          opacity: podiumVisible ? 1 : 0,
                          transform: podiumVisible ? 'translateY(0)' : 'translateY(12px)',
                          transition: `opacity 0.5s ease-out ${cfg.delay}, transform 0.5s ease-out ${cfg.delay}`,
                        }}
                      >
                        <Avatar
                          name={fullName}
                          src={mediaUrl(student.avatar)}
                          size={cfg.size}
                          shape="circle"
                          className="border-2 border-white/20"
                        />
                      </div>

                      {/* Name */}
                      <div
                        className="text-center"
                        style={{
                          opacity: podiumVisible ? 1 : 0,
                          transition: `opacity 0.5s ease-out ${cfg.delay}`,
                        }}
                      >
                        <p className={`font-bold text-white ${isFirst ? 'text-sm' : 'text-xs'} leading-tight`}>
                          {isFirst ? fullName : `${student.firstName} ${student.lastName.charAt(0)}.`}
                        </p>
                        <p className={`text-[10px] mt-0.5 ${cfg.label}`}>{student.specialty}</p>
                      </div>

                      {/* Score badge */}
                      <div
                        className={`px-3 py-1 rounded-full text-xs font-black ${cfg.badge}`}
                        style={{
                          opacity: podiumVisible ? 1 : 0,
                          transform: podiumVisible ? 'scale(1)' : 'scale(0.7)',
                          transition: `opacity 0.4s ease-out ${cfg.delay}, transform 0.4s ease-out ${cfg.delay}`,
                        }}
                      >
                        {student.readinessScore ?? 0}%
                      </div>

                      {/* Bar — grows from bottom */}
                      <div
                        className={`w-24 sm:w-32 ${cfg.bar} rounded-t-2xl flex items-center justify-center shadow-inner`}
                        style={{
                          height: podiumVisible ? cfg.h : 0,
                          overflow: 'hidden',
                          transition: `height 750ms cubic-bezier(0.34, 1.4, 0.64, 1) ${cfg.delay}`,
                        }}
                      >
                        <span className="text-white/80 font-black text-2xl">{pos}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* ── Divider + search ─────────────────────────────────────────────── */}
        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1 h-px bg-outline-variant/30" />
          <div className="text-xs font-bold text-on-surface-variant uppercase tracking-widest whitespace-nowrap">Todos los perfiles</div>
          <div className="flex-1 h-px bg-outline-variant/30" />
        </div>

        {/* Search */}
        <div className="flex items-center bg-surface border border-outline-variant/30 rounded-xl px-4 py-2.5 gap-2 mb-6 max-w-sm mx-auto">
          <span className="material-symbols-outlined text-outline text-[18px]">search</span>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nombre, habilidad..."
            className="bg-transparent outline-none text-sm w-full placeholder:text-outline"
          />
        </div>

        {/* Filtros */}
        <div className="flex gap-2 flex-wrap mb-8 justify-center">
          {especialidades.map(esp => (
            <button
              key={esp}
              onClick={() => setFiltroActivo(esp)}
              className={`text-sm font-medium px-5 py-2 rounded-full transition-all ${
                filtroActivo === esp
                  ? 'bg-primary text-on-primary shadow-sm'
                  : 'bg-surface border border-outline-variant/30 text-on-surface-variant hover:border-primary/40 hover:bg-surface-container-low'
              }`}
            >
              {esp}
            </button>
          ))}
        </div>

        {/* ── Cards ────────────────────────────────────────────────────────── */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-14">
            {[1,2,3,4,5,6].map(i => (
              <div key={i} className="bg-surface border border-outline-variant/30 rounded-2xl p-6 animate-pulse h-56" />
            ))}
          </div>
        ) : (
          <div ref={cardsContainerRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-14">
            {filtered.map((s, index) => {
              const fullName = `${s.firstName} ${s.lastName}`
              const validatedSkills = s.skills?.filter(sk => sk.isValidated) ?? []
              return (
                <div
                  key={s.id}
                  className="student-card group bg-surface border border-outline-variant/30 rounded-2xl p-6 hover:shadow-lg hover:border-primary/30 flex flex-col h-full"
                  style={{ transitionDelay: `${(index % 3) * 70}ms` }}
                >
                  <div className="flex items-start gap-4 mb-4">
                    <Avatar name={fullName} src={mediaUrl(s.avatar)} size="md" shape="circle" />
                    <div className="flex-1 min-w-0">
                      <div className="text-base font-bold text-on-surface truncate">{fullName}</div>
                      <div className="text-sm text-primary font-medium mt-0.5">{s.specialty}</div>
                      <div className="text-xs text-on-surface-variant mt-0.5">{s.year}° año</div>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${scoreBgColor(s.readinessScore ?? 0)}`}>
                      {s.readinessScore ?? 0}%
                    </span>
                  </div>

                  {s.headline && (
                    <p className="text-sm text-on-surface-variant leading-relaxed mb-4 flex-1 line-clamp-2">{s.headline}</p>
                  )}

                  <div className="flex flex-wrap gap-1.5 mb-5">
                    {(s.skills ?? []).slice(0, 4).map(sk => (
                      <span
                        key={sk.id}
                        className={`text-xs font-medium px-2 py-0.5 rounded-md border ${
                          sk.isValidated
                            ? 'bg-green-50 border-green-200 text-green-700'
                            : 'bg-surface-container-lowest border-outline-variant/20 text-on-surface-variant'
                        }`}
                      >
                        {sk.isValidated && <span className="mr-1">✓</span>}{sk.name}
                      </span>
                    ))}
                  </div>

                  <div className="text-xs text-outline mb-4">
                    {validatedSkills.length} habilidades validadas · {s.evidences?.length ?? 0} evidencias
                  </div>

                  <Link
                    href="/auth/register?role=EMPRESA"
                    className="bg-surface-container-low text-on-surface font-medium border border-outline-variant/20 w-full py-3 rounded-xl text-sm transition-all text-center group-hover:bg-primary group-hover:text-on-primary group-hover:border-primary group-hover:shadow-md"
                  >
                    Regístrate para contactar
                  </Link>
                </div>
              )
            })}

            {filtered.length === 0 && (
              <div className="col-span-3 text-center py-16 text-on-surface-variant">
                <span className="material-symbols-outlined text-[48px] text-outline">person_search</span>
                <p className="mt-3 font-semibold">No hay perfiles que coincidan</p>
              </div>
            )}
          </div>
        )}

        {/* ── CTA ──────────────────────────────────────────────────────────── */}
        <div className="bg-primary-container border border-primary/20 rounded-3xl p-8 text-center max-w-4xl mx-auto shadow-sm">
          <div className="bg-surface w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-sm text-primary">
            <span className="material-symbols-outlined text-[24px]">business</span>
          </div>
          <h3 className="text-xl font-bold font-headline text-on-primary-container mb-3">¿Sos una empresa buscando talento?</h3>
          <p className="text-sm md:text-base text-on-primary-container/80 mb-8 leading-relaxed max-w-2xl mx-auto">
            Únete a nuestra red para recibir postulaciones y contactar directamente a los alumnos destacados.
          </p>
          <Link href="/auth/register?role=EMPRESA" className="inline-flex items-center gap-2 bg-primary text-on-primary font-bold px-8 py-3.5 rounded-full hover:bg-primary/90 transition-all shadow-md">
            Crear cuenta gratuita
            <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
