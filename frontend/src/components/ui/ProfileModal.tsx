'use client'

import { useState, useEffect } from 'react'
import { Avatar } from '@/components/ui/Avatar'
import { api } from '@/lib/api-client'
import { useAuthStore } from '@/store/auth.store'
import { mediaUrl, timeAgo } from '@/lib/utils'
import type { StudentProfile, Publication, Skill, PortfolioEvidence } from '@/types'

interface PublicProfile {
  userId: string
  role: string
  name: string
  avatar?: string
  coverImage?: string
  bio?: string
  headline?: string
  specialty?: string
  schoolName?: string
  location?: string
  website?: string
  followerCount: number
  followingCount: number
  isFollowing: boolean
}

const roleLabel: Record<string, string> = {
  STUDENT: 'Estudiante',
  EMPRESA: 'Empresa',
  COLEGIO: 'Institución',
}

const roleIcon: Record<string, string> = {
  STUDENT: 'school',
  EMPRESA: 'business',
  COLEGIO: 'account_balance',
}

interface Props {
  userId: string | null
  onClose: () => void
}

export function ProfileModal({ userId, onClose }: Props) {
  const { isAuthenticated, user } = useAuthStore()

  const [profile,   setProfile]   = useState<PublicProfile | null>(null)
  const [student,   setStudent]   = useState<StudentProfile | null>(null)
  const [pubs,      setPubs]      = useState<Publication[]>([])
  const [loading,   setLoading]   = useState(false)
  const [following, setFollowing] = useState(false)
  const [toggling,  setToggling]  = useState(false)

  const isSelf = user?.id === userId

  useEffect(() => {
    if (!userId) {
      setProfile(null); setStudent(null); setPubs([])
      return
    }
    setLoading(true)
    setProfile(null); setStudent(null); setPubs([])

    api.get<PublicProfile>(`/users/${userId}/profile`)
      .then(p => {
        setProfile(p)
        setFollowing(p.isFollowing)
        // Fetch extra data in parallel
        const extras: Promise<unknown>[] = [
          api.get<Publication[]>(`/publications/by-user/${userId}`).catch(() => []),
        ]
        if (p.role === 'STUDENT') {
          extras.push(
            api.get<StudentProfile>(`/students/user/${userId}`).catch(() => null)
          )
        }
        Promise.all(extras).then(([pubs, stud]) => {
          setPubs((pubs as Publication[]) ?? [])
          if (stud) setStudent(stud as StudentProfile)
        })
      })
      .catch(() => setProfile(null))
      .finally(() => setLoading(false))
  }, [userId])

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  const handleFollow = async () => {
    if (!isAuthenticated || toggling) return
    setToggling(true)
    try {
      if (following) {
        await api.delete(`/follows/${userId}`)
        setFollowing(false)
        setProfile(prev => prev ? { ...prev, followerCount: prev.followerCount - 1 } : prev)
      } else {
        await api.post(`/follows/${userId}`, {})
        setFollowing(true)
        setProfile(prev => prev ? { ...prev, followerCount: prev.followerCount + 1 } : prev)
      }
    } catch { /* silencioso */ }
    finally { setToggling(false) }
  }

  if (!userId) return null

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-3xl max-h-[92vh] overflow-y-auto rounded-2xl bg-surface shadow-2xl animate-slide-up flex flex-col">
        {/* Close */}
        <button
          onClick={onClose}
          className="sticky top-3 left-full z-20 -mr-1 p-2 rounded-full bg-surface/90 hover:bg-surface-container text-on-surface-variant hover:text-on-surface transition-colors shadow-md"
          style={{ float: 'right', marginRight: '12px', marginTop: '12px' }}
          aria-label="Cerrar"
        >
          <span className="material-symbols-outlined text-[20px]">close</span>
        </button>

        {loading ? (
          <div className="p-8 space-y-4 clear-both">
            <div className="h-40 animate-pulse bg-surface-container rounded-xl" />
            <div className="h-12 animate-pulse bg-surface-container-low rounded-lg w-2/3" />
            <div className="h-4 animate-pulse bg-surface-container-low rounded w-full" />
            <div className="h-4 animate-pulse bg-surface-container-low rounded w-3/4" />
          </div>
        ) : !profile ? (
          <div className="flex flex-col items-center justify-center py-24 text-center px-6 clear-both">
            <span className="material-symbols-outlined text-[64px] text-outline">person_off</span>
            <h2 className="font-headline text-xl font-bold text-on-surface mt-4">Perfil no encontrado</h2>
            <p className="text-on-surface-variant text-sm mt-2">Este usuario no existe o fue eliminado.</p>
          </div>
        ) : (
          <div className="clear-both">
            {/* Cover */}
            <div className="h-44 editorial-gradient relative shrink-0">
              {profile.coverImage && (
                <img src={mediaUrl(profile.coverImage)} className="w-full h-full object-cover" alt="" />
              )}
            </div>

            <div className="px-6 pb-8">
              {/* Avatar + follow */}
              <div className="flex items-end justify-between -mt-12 mb-4">
                <Avatar
                  src={profile.avatar ? mediaUrl(profile.avatar) : undefined}
                  name={profile.name}
                  size="xl"
                  shape={profile.role === 'COLEGIO' ? 'rounded' : 'circle'}
                  className="border-4 border-surface shadow-md"
                />
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

              {/* Name + role */}
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <h2 className="font-headline text-2xl font-bold text-on-surface">{profile.name}</h2>
                <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-primary bg-primary-fixed px-2.5 py-1 rounded-full">
                  <span className="material-symbols-outlined text-[11px] icon-filled">
                    {roleIcon[profile.role] ?? 'person'}
                  </span>
                  {roleLabel[profile.role] ?? profile.role}
                </span>
              </div>

              {profile.headline && (
                <p className="text-sm font-semibold text-on-surface-variant mb-2">{profile.headline}</p>
              )}

              <div className="flex items-center gap-3 text-xs text-outline flex-wrap mb-4">
                {profile.schoolName && (
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">school</span>
                    {profile.schoolName}
                  </span>
                )}
                {profile.specialty && (
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">psychology</span>
                    {profile.specialty}
                  </span>
                )}
                {profile.location && (
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">location_on</span>
                    {profile.location}
                  </span>
                )}
                {profile.website && (
                  <a href={profile.website} target="_blank" rel="noreferrer"
                    className="flex items-center gap-1 hover:text-primary transition-colors">
                    <span className="material-symbols-outlined text-[14px]">link</span>
                    {profile.website}
                  </a>
                )}
              </div>

              {profile.bio && (
                <p className="text-sm text-on-surface leading-relaxed mb-5 max-w-2xl">{profile.bio}</p>
              )}

              {/* ── Followers / Following ── */}
              <div className="flex items-center gap-3 mb-6">
                <div className="flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-xl border border-primary/20">
                  <span className="material-symbols-outlined text-[18px] icon-filled">group</span>
                  <div>
                    <p className="font-black text-lg leading-none font-headline">{profile.followerCount}</p>
                    <p className="text-[10px] font-semibold uppercase tracking-wider opacity-80">Seguidores</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 bg-surface-container px-4 py-2 rounded-xl border border-outline-variant/20">
                  <span className="material-symbols-outlined text-[18px] text-on-surface-variant">person_add</span>
                  <div>
                    <p className="font-black text-lg leading-none font-headline text-on-surface">{profile.followingCount}</p>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-outline">Siguiendo</p>
                  </div>
                </div>
              </div>

              {/* ── Divider ── */}
              <div className="border-t border-outline-variant/10 mb-6" />

              {/* ── Skills (students only) ── */}
              {profile.role === 'STUDENT' && student && student.skills && student.skills.length > 0 && (
                <section className="mb-6">
                  <h3 className="font-headline text-base font-bold text-on-surface mb-3 flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px] text-primary">psychology</span>
                    Habilidades
                    <span className="text-xs font-normal text-outline ml-1">
                      ({student.skills.filter((s: Skill) => s.isValidated).length} validadas)
                    </span>
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {student.skills.map((skill: Skill) => (
                      <span
                        key={skill.id}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${
                          skill.isValidated
                            ? 'bg-green-50 border-green-200 text-green-800'
                            : 'bg-surface-container border-outline-variant/30 text-on-surface-variant'
                        }`}
                      >
                        {skill.isValidated && (
                          <span className="material-symbols-outlined text-[12px] text-green-600 icon-filled">verified</span>
                        )}
                        {skill.name}
                      </span>
                    ))}
                  </div>
                </section>
              )}

              {/* ── Evidences (students only) ── */}
              {profile.role === 'STUDENT' && student && student.evidences && student.evidences.filter((e: PortfolioEvidence) => e.isPublic).length > 0 && (
                <section className="mb-6">
                  <h3 className="font-headline text-base font-bold text-on-surface mb-3 flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px] text-primary">folder_open</span>
                    Portafolio
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {student.evidences.filter((e: PortfolioEvidence) => e.isPublic).map((ev: PortfolioEvidence) => (
                      <div key={ev.id} className="p-3 bg-surface-container-low rounded-xl border border-outline-variant/20">
                        {ev.imageUrl && (
                          <img
                            src={mediaUrl(ev.imageUrl)}
                            alt={ev.title}
                            className="w-full h-28 object-cover rounded-lg mb-2"
                          />
                        )}
                        <p className="text-sm font-semibold text-on-surface truncate">{ev.title}</p>
                        {ev.description && (
                          <p className="text-xs text-outline mt-0.5 line-clamp-2">{ev.description}</p>
                        )}
                        {ev.url && (
                          <a
                            href={ev.url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-1.5"
                          >
                            <span className="material-symbols-outlined text-[12px]">link</span>
                            Ver proyecto
                          </a>
                        )}
                        {ev.tags && ev.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {ev.tags.slice(0, 3).map(t => (
                              <span key={t} className="text-[10px] bg-surface-container px-1.5 py-0.5 rounded text-outline">
                                {t}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* ── Publications ── */}
              {pubs.length > 0 && (
                <section>
                  <h3 className="font-headline text-base font-bold text-on-surface mb-3 flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px] text-primary">article</span>
                    Publicaciones
                  </h3>
                  <div className="space-y-3">
                    {pubs.slice(0, 5).map(pub => (
                      <div key={pub.id} className="p-4 bg-surface-container-low rounded-xl border border-outline-variant/20">
                        {pub.imageUrl && (
                          <img
                            src={mediaUrl(pub.imageUrl)}
                            alt=""
                            className="w-full h-40 object-cover rounded-lg mb-3"
                          />
                        )}
                        {pub.title && (
                          <p className="text-sm font-bold text-on-surface mb-1">{pub.title}</p>
                        )}
                        <p className="text-sm text-on-surface-variant leading-relaxed line-clamp-3">{pub.content}</p>
                        <div className="flex items-center gap-4 mt-3 text-xs text-outline">
                          <span className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-[13px]">favorite</span>
                            {pub.likes}
                          </span>
                          <span className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-[13px]">mode_comment</span>
                            {pub.comments}
                          </span>
                          <span className="ml-auto">{timeAgo(pub.createdAt)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Empty state for students with no content yet */}
              {profile.role === 'STUDENT' && student && !student.skills?.length && !pubs.length && (
                <div className="text-center py-8 text-on-surface-variant text-sm">
                  <span className="material-symbols-outlined text-[40px] block mb-2 text-outline">person</span>
                  Perfil en construcción
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
