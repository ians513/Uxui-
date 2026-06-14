'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Avatar } from '@/components/ui/Avatar'
import { SkillPill } from '@/components/ui/SkillPill'
import { Toast } from '@/components/ui/Toast'
import { ReadinessScore } from '@/components/ui/ReadinessScore'
import { api } from '@/lib/api-client'
import { useAuthStore } from '@/store/auth.store'
import { mediaUrl, calculateReadinessScore } from '@/lib/utils'
import type { StudentProfile, Skill } from '@/types'

interface PublicProfile {
  userId: string
  role: string
  name: string
  avatar?: string
  coverImage?: string
  bio?: string
  headline?: string
  specialty?: string
  location?: string
  website?: string
  followerCount: number
  followingCount: number
  isFollowing: boolean
}

export default function VerPerfilPage() {
  const { userId } = useParams<{ userId: string }>()
  const { isAuthenticated, user } = useAuthStore()
  const router = useRouter()

  const [profile,          setProfile]          = useState<PublicProfile | null>(null)
  const [student,          setStudent]          = useState<StudentProfile | null>(null)
  const [loading,          setLoading]          = useState(true)
  const [following,        setFollowing]        = useState(false)
  const [toggling,         setToggling]         = useState(false)
  const [endorsedIds,      setEndorsedIds]      = useState<Set<string>>(new Set())
  const [toast,            setToast]            = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null)
  const [burstSkillId,     setBurstSkillId]     = useState<string | null>(null)
  const [animatingSkillId, setAnimatingSkillId] = useState<string | null>(null)

  const isSelf = user?.id === userId

  useEffect(() => {
    if (!userId) return

    Promise.all([
      api.get<PublicProfile>(`/users/${userId}/profile`),
      api.get<StudentProfile>(`/students/user/${userId}`).catch(() => null),
    ])
      .then(([p, s]) => {
        setProfile(p)
        setFollowing(p.isFollowing)
        setStudent(s)

        if (s && isAuthenticated && user?.id !== userId && s.skills?.length > 0) {
          const ids = s.skills.map((sk: Skill) => sk.id).join(',')
          api.get<string[]>(`/skills/endorsed-by-me?skillIds=${ids}`)
            .then(endorsed => setEndorsedIds(new Set(endorsed)))
            .catch(() => {})
        }
      })
      .catch(() => setProfile(null))
      .finally(() => setLoading(false))
  }, [userId])

  const handleEndorse = async (skillId: string) => {
    try {
      const result = await api.post<{ endorsements: number; alreadyEndorsed: boolean }>(`/skills/${skillId}/endorse`, {})
      if (!result.alreadyEndorsed) {
        setEndorsedIds(prev => new Set(Array.from(prev).concat(skillId)))
        setBurstSkillId(skillId)
        setAnimatingSkillId(skillId)
        setTimeout(() => setBurstSkillId(null), 600)
        setTimeout(() => setAnimatingSkillId(null), 400)
        setToast({ message: '¡Habilidad respaldada!', type: 'success' })
      } else {
        setToast({ message: 'Ya respaldaste esta habilidad', type: 'info' })
      }
      setStudent(prev => prev
        ? { ...prev, skills: prev.skills.map(s => s.id === skillId ? { ...s, endorsements: result.endorsements } : s) }
        : prev
      )
    } catch {
      setToast({ message: 'No se pudo respaldar', type: 'error' })
    }
  }

  // Burst particle angles
  const BURST_ANGLES = [0, 60, 120, 180, 240, 300]
  const BURST_R = 26

  const handleFollow = async () => {
    if (!isAuthenticated || toggling) return
    setToggling(true)
    try {
      if (following) {
        await api.delete(`/follows/${userId}`)
        setFollowing(false)
        setProfile(prev => prev ? { ...prev, followerCount: prev.followerCount - 1, isFollowing: false } : prev)
      } else {
        await api.post(`/follows/${userId}`, {})
        setFollowing(true)
        setProfile(prev => prev ? { ...prev, followerCount: prev.followerCount + 1, isFollowing: true } : prev)
      }
    } catch { /* silencioso */ }
    finally { setToggling(false) }
  }

  if (loading) {
    return (
      <main className="max-w-5xl mx-auto px-6 py-10">
        <div className="card h-64 animate-pulse mb-6" />
        <div className="card h-48 animate-pulse mb-6" />
        <div className="card h-32 animate-pulse" />
      </main>
    )
  }

  if (!profile) {
    return (
      <main className="max-w-5xl mx-auto px-6 py-10">
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <span className="material-symbols-outlined text-[64px] text-outline">person_off</span>
          <h2 className="font-headline text-xl font-bold text-on-surface mt-4">Perfil no encontrado</h2>
          <p className="text-on-surface-variant text-sm mt-2">Este usuario no existe o fue eliminado.</p>
          <button onClick={() => router.back()} className="mt-6 text-sm font-semibold text-primary hover:underline">
            Volver
          </button>
        </div>
      </main>
    )
  }

  const isStudent = profile.role === 'STUDENT'
  const fullName  = student ? `${student.firstName} ${student.lastName}` : profile.name
  const breakdown = student ? calculateReadinessScore(student) : null
  const technicalSkills = student?.skills.filter(s => s.category === 'TECNICA') ?? []
  const softSkills      = student?.skills.filter(s => s.category === 'BLANDA') ?? []
  const acceptedApps    = student?.applications?.filter(a => a.status === 'ACEPTADO') ?? []

  return (
    <main className="max-w-5xl mx-auto px-6 py-10">

      {/* ── Burst & endorse animation styles ─────────────────────────────── */}
      <style>{`
        @keyframes burst-particle {
          0%   { transform: translate(-50%, -50%) scale(1.2); opacity: 1; }
          100% { transform: translate(calc(-50% + var(--bx)), calc(-50% + var(--by))) scale(0); opacity: 0; }
        }
        .burst-particle { animation: burst-particle 0.55s ease-out forwards; }

        @keyframes endorse-pop {
          0%   { transform: scale(1); }
          35%  { transform: scale(1.18); }
          65%  { transform: scale(0.94); }
          100% { transform: scale(1); }
        }
        .endorse-pop { animation: endorse-pop 0.35s ease-out forwards; }
      `}</style>

      {/* Back */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1.5 text-sm font-semibold text-on-surface-variant hover:text-on-surface mb-6 transition-colors"
      >
        <span className="material-symbols-outlined text-[18px]">arrow_back</span>
        Volver
      </button>

      {/* Profile Header */}
      <div className="card mb-6 overflow-hidden animate-slide-up">
        {/* Cover */}
        <div className="h-48 editorial-gradient relative">
          {(student?.coverImage || profile.coverImage) && (
            <img
              src={mediaUrl(student?.coverImage ?? profile.coverImage!)}
              className="w-full h-full object-cover"
              alt=""
            />
          )}
        </div>

        <div className="px-8 pb-8">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 -mt-10 mb-6">
            <Avatar
              src={(student?.avatar || profile.avatar) ? mediaUrl(student?.avatar ?? profile.avatar!) : undefined}
              name={fullName}
              size="xl"
              className="border-4 border-surface-container-lowest shadow-md"
            />
            <div className="flex items-center gap-3 sm:mb-1">
              {!isSelf && isAuthenticated && (
                <button
                  onClick={handleFollow}
                  disabled={toggling}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-60 ${
                    following
                      ? 'bg-surface-container text-on-surface-variant border border-outline-variant/30 hover:bg-error-container hover:text-error hover:border-error/30'
                      : 'bg-primary text-on-primary shadow-md hover:shadow-lg hover:opacity-90'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {following ? 'person_remove' : 'person_add'}
                  </span>
                  {following ? 'Siguiendo' : 'Seguir'}
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 flex-wrap mb-1">
                <h1 className="text-3xl font-bold font-headline text-on-surface">{fullName}</h1>
                {isStudent && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-primary bg-primary-fixed px-2.5 py-1 rounded-full">
                    <span className="material-symbols-outlined text-[11px] icon-filled">school</span>
                    Estudiante
                  </span>
                )}
              </div>

              {(student?.headline || profile.headline) && (
                <p className="text-on-surface-variant font-semibold mb-1">
                  {student?.headline ?? profile.headline}
                </p>
              )}

              {student?.schoolName && (
                <div className="inline-flex items-center gap-2 mt-3 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-200">
                  <span className="material-symbols-outlined text-[14px] text-blue-600 icon-filled">verified</span>
                  <span className="text-xs font-bold text-blue-700">Avalado por {student.schoolName}</span>
                </div>
              )}

              <p className="text-sm text-outline flex items-center gap-1.5 flex-wrap mt-2">
                {(student?.location || profile.location) && (
                  <>
                    <span className="material-symbols-outlined text-[14px]">location_on</span>
                    {student?.location ?? profile.location}
                    <span className="mx-1">·</span>
                  </>
                )}
                {isStudent && student && (
                  <>
                    <span className="material-symbols-outlined text-[14px]">school</span>
                    {[student.specialty || null, `${student.year}° año`].filter(Boolean).join(' · ')}
                  </>
                )}
                {(student?.specialty || profile.specialty) && !isStudent && (
                  <>
                    <span className="material-symbols-outlined text-[14px]">psychology</span>
                    {student?.specialty ?? profile.specialty}
                  </>
                )}
              </p>

              {(student?.bio || profile.bio) && (
                <p className="mt-5 text-sm text-on-surface leading-relaxed max-w-2xl">
                  {student?.bio ?? profile.bio}
                </p>
              )}

              <div className="flex items-center gap-4 mt-4">
                {student?.githubUrl && (
                  <a href={student.githubUrl} target="_blank" rel="noreferrer"
                    className="flex items-center gap-1.5 text-xs font-semibold text-on-surface-variant hover:text-primary transition-colors">
                    <span className="material-symbols-outlined text-[16px]">code</span>
                    GitHub
                  </a>
                )}
                {student?.linkedinUrl && (
                  <a href={student.linkedinUrl} target="_blank" rel="noreferrer"
                    className="flex items-center gap-1.5 text-xs font-semibold text-on-surface-variant hover:text-primary transition-colors">
                    <span className="material-symbols-outlined text-[16px]">link</span>
                    LinkedIn
                  </a>
                )}
                {profile.website && (
                  <a href={profile.website} target="_blank" rel="noreferrer"
                    className="flex items-center gap-1.5 text-xs font-semibold text-on-surface-variant hover:text-primary transition-colors">
                    <span className="material-symbols-outlined text-[16px]">language</span>
                    Sitio web
                  </a>
                )}
              </div>

              <div className="flex items-center gap-6 mt-6 pt-6 border-t border-outline-variant/15 flex-wrap">
                {isStudent && student && (
                  <>
                    {[
                      { icon: 'visibility',  value: student.profileViews ?? 0,      label: 'Vistas del perfil' },
                      { icon: 'psychology',  value: student.skills.length,           label: 'Habilidades' },
                      { icon: 'folder_open', value: student.evidences?.length ?? 0,  label: 'Evidencias' },
                    ].map(({ icon, value, label }) => (
                      <div key={label} className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-[18px] text-primary">{icon}</span>
                        <div>
                          <span className="font-black text-on-surface text-lg leading-none block">{value}</span>
                          <span className="text-[10px] text-outline">{label}</span>
                        </div>
                      </div>
                    ))}
                  </>
                )}
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px] text-primary">group</span>
                  <div>
                    <span className="font-black text-on-surface text-lg leading-none block">{profile.followerCount}</span>
                    <span className="text-[10px] text-outline">Seguidores</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px] text-primary">person_check</span>
                  <div>
                    <span className="font-black text-on-surface text-lg leading-none block">{profile.followingCount}</span>
                    <span className="text-[10px] text-outline">Siguiendo</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Readiness score */}
            {isStudent && breakdown && (
              <div className="bg-surface-container-low rounded-xl p-5">
                <h3 className="text-[11px] font-black uppercase tracking-widest text-outline mb-4">
                  Índice de empleabilidad
                </h3>
                <ReadinessScore
                  score={student!.readinessScore}
                  breakdown={breakdown}
                  size="lg"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Skills */}
      {isStudent && (technicalSkills.length > 0 || softSkills.length > 0) && (
        <div className="card p-8 mb-6 animate-slide-up">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-headline text-xl font-bold text-on-surface">Habilidades técnicas</h2>
            {!isSelf && isAuthenticated && (
              <span className="text-[11px] text-outline font-medium flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">thumb_up</span>
                Puedes respaldar las habilidades de {student?.firstName}
              </span>
            )}
          </div>

          <div className="flex flex-wrap gap-3 mb-8">
            {technicalSkills.length > 0
              ? technicalSkills.map(skill => {
                  const isEndorsed = endorsedIds.has(skill.id)
                  const isBursting = burstSkillId === skill.id
                  const isAnimating = animatingSkillId === skill.id
                  return (
                    <div key={skill.id} className="flex items-center gap-2">
                      <SkillPill skill={skill} showLevel />

                      {!isSelf && isAuthenticated && (
                        <div className={`relative inline-flex ${isAnimating ? 'endorse-pop' : ''}`}>

                          {/* Burst particles */}
                          {isBursting && BURST_ANGLES.map((angle, i) => {
                            const rad = (angle * Math.PI) / 180
                            const dx = Math.round(Math.cos(rad) * BURST_R)
                            const dy = Math.round(Math.sin(rad) * BURST_R)
                            return (
                              <span
                                key={angle}
                                className="burst-particle absolute w-2 h-2 rounded-full pointer-events-none z-50"
                                style={{
                                  top: '50%',
                                  left: '50%',
                                  ['--bx' as string]: `${dx}px`,
                                  ['--by' as string]: `${dy}px`,
                                  backgroundColor: i % 2 === 0 ? '#6366f1' : '#f59e0b',
                                } as React.CSSProperties}
                              />
                            )
                          })}

                          {isEndorsed ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-green-50 border border-green-300 text-green-700 select-none">
                              <span className="material-symbols-outlined text-[12px] icon-filled">check_circle</span>
                              Respaldado
                            </span>
                          ) : (
                            <button
                              onClick={() => handleEndorse(skill.id)}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border border-primary/40 text-primary hover:bg-primary-fixed/50 hover:border-primary transition-all active:scale-95"
                            >
                              <span className="text-sm leading-none">👍</span>
                              Respaldar
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })
              : <p className="text-sm text-outline">Sin habilidades técnicas registradas.</p>
            }
          </div>

          {softSkills.length > 0 && (
            <>
              <h3 className="font-semibold text-sm text-on-surface-variant uppercase tracking-wider mb-4">
                Habilidades blandas
              </h3>
              <div className="flex flex-wrap gap-2">
                {softSkills.map(skill => <SkillPill key={skill.id} skill={skill} />)}
              </div>
            </>
          )}
        </div>
      )}

      {/* Experiencia en empresas */}
      {isStudent && acceptedApps.length > 0 && (
        <section className="card p-6 mb-6 animate-slide-up">
          <div className="flex items-center gap-2 mb-6">
            <span className="material-symbols-outlined text-primary text-[20px] icon-filled">work</span>
            <h2 className="font-headline text-xl font-bold text-on-surface">Experiencia en empresas</h2>
          </div>
          <div className="space-y-4">
            {acceptedApps.map(app => (
              <div key={app.id} className="flex items-start gap-4 p-5 rounded-2xl border border-outline-variant/25 bg-surface-container-low/40">
                <div className="w-11 h-11 rounded-xl bg-primary-container flex items-center justify-center shrink-0 mt-0.5">
                  <span className="material-symbols-outlined text-primary text-[20px]">business</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-headline font-bold text-on-surface text-base leading-snug">
                    {app.opportunity?.title ?? 'Oportunidad'}
                  </h3>
                  <p className="text-sm text-on-surface-variant font-medium mt-0.5">
                    {app.opportunity?.company?.name ?? ''}
                  </p>
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    {app.opportunity?.type && (
                      <span className="text-[11px] font-medium text-outline capitalize">
                        {app.opportunity.type.charAt(0) + app.opportunity.type.slice(1).toLowerCase()}
                      </span>
                    )}
                    {app.opportunity?.type && <span className="text-[11px] text-outline-variant">·</span>}
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/70 px-2 py-0.5 rounded-full">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                      Aceptado
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Portfolio */}
      {isStudent && (student?.evidences?.length ?? 0) > 0 && (
        <div className="card p-8 mb-6 animate-slide-up">
          <h2 className="font-headline text-xl font-bold text-on-surface mb-6">Portafolio</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {student!.evidences.map(ev => (
              <div key={ev.id} className="group rounded-xl bg-surface-container-low hover:bg-surface-container transition-colors overflow-hidden cursor-pointer">
                <div className="aspect-video bg-gradient-to-br from-surface-container to-surface-container-high flex items-center justify-center overflow-hidden">
                  {ev.imageUrl
                    ? <img src={mediaUrl(ev.imageUrl)} className="w-full h-full object-cover" alt={ev.title} />
                    : <span className="material-symbols-outlined text-[40px] text-outline icon-filled">
                        {ev.type === 'PROYECTO' ? 'code' : ev.type === 'CERTIFICADO' ? 'workspace_premium' : 'image'}
                      </span>
                  }
                </div>
                <div className="p-4">
                  <span className="text-[10px] font-black uppercase tracking-widest text-outline mb-1 block">
                    {ev.type.charAt(0) + ev.type.slice(1).toLowerCase()}
                  </span>
                  <h4 className="text-sm font-bold text-on-surface group-hover:text-primary transition-colors leading-tight">
                    {ev.title}
                  </h4>
                  <p className="text-xs text-on-surface-variant mt-1 line-clamp-2">{ev.description}</p>
                  <div className="flex flex-wrap gap-1 mt-3">
                    {ev.tags?.slice(0, 3).map(tag => (
                      <span key={tag} className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-surface-container text-on-surface-variant">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {toast && (
        <Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />
      )}
    </main>
  )
}
