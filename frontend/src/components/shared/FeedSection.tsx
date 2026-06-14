'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Avatar } from '@/components/ui/Avatar'
import { PublicationCard } from '@/components/shared/PublicationCard'
import { api } from '@/lib/api-client'
import { cn, mediaUrl, timeAgo } from '@/lib/utils'
import { useAuthStore } from '@/store/auth.store'
import type { Publication } from '@/types'

interface Story {
  id: string
  authorId: string
  authorName: string
  authorAvatar?: string
  imageUrl?: string
  content?: string
  createdAt: string
  isPinned?: boolean    // whether this story is highlighted/pinned
}

interface UserStoryGroup {
  authorId: string
  authorName: string
  authorAvatar?: string
  stories: Story[]
  seen: boolean       // true if user has seen up to the newest story
  newestAt: number    // timestamp of newest story (ms)
}

interface UploadResult { url: string }

interface FeedSectionProps {
  selfAvatar?: string
  selfName: string
  selfLabel?: string
  postPlaceholder?: string
  postActions?: { icon: string; label: string; action?: string }[]
  skillTags?: string[]  // student's skill names — used to boost relevant posts
}

const SEEN_KEY = 'story-seen-v1'

function getSeenMap(): Record<string, number> {
  if (typeof window === 'undefined') return {}
  try { return JSON.parse(localStorage.getItem(SEEN_KEY) ?? '{}') } catch { return {} }
}

function markSeen(authorId: string) {
  const map = getSeenMap()
  map[authorId] = Date.now()
  localStorage.setItem(SEEN_KEY, JSON.stringify(map))
}

function groupStories(stories: Story[]): UserStoryGroup[] {
  const seenMap = getSeenMap()
  const byAuthor: Record<string, Story[]> = {}
  for (const s of stories) {
    if (!byAuthor[s.authorId]) byAuthor[s.authorId] = []
    byAuthor[s.authorId].push(s)
  }
  const groups: UserStoryGroup[] = Object.entries(byAuthor).map(([authorId, list]) => {
    list.sort((a: Story, b: Story) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    const newestAt = new Date(list[0].createdAt).getTime()
    const lastSeen = seenMap[authorId] ?? 0
    return {
      authorId,
      authorName: list[0].authorName,
      authorAvatar: list[0].authorAvatar,
      stories: list,
      seen: lastSeen >= newestAt,
      newestAt,
    }
  })
  // Unseen first, then newest
  groups.sort((a: UserStoryGroup, b: UserStoryGroup) => {
    if (!a.seen && b.seen) return -1
    if (a.seen && !b.seen) return 1
    return b.newestAt - a.newestAt
  })
  return groups
}

// ─── Story Viewer Modal — Instagram-style fixed 9:16 card ────────────────────
function StoryViewer({
  group,
  onClose,
  onDelete,
  onHighlight,
}: {
  group: UserStoryGroup
  onClose: () => void
  onDelete?: (storyId: string) => void
  onHighlight?: (storyId: string, pinned: boolean) => void
}) {
  const { user } = useAuthStore()
  const [idx,       setIdx]       = useState(0)
  const [pinning,   setPinning]   = useState(false)
  const [pinnedIds, setPinnedIds] = useState<Record<string, boolean>>({})

  const story   = group.stories[idx]
  const isOwner = user?.id === group.authorId

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape')      onClose()
      if (e.key === 'ArrowRight')  setIdx(i => Math.min(i + 1, group.stories.length - 1))
      if (e.key === 'ArrowLeft')   setIdx(i => Math.max(i - 1, 0))
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose, group.stories.length])

  // Reset to first story when group changes
  useEffect(() => { setIdx(0) }, [group.authorId])

  const goNext = () => {
    if (idx < group.stories.length - 1) setIdx(i => i + 1)
    else onClose()
  }
  const goPrev = () => setIdx(i => Math.max(i - 1, 0))

  const handleDelete = async () => {
    if (!confirm('¿Eliminar esta historia?')) return
    try {
      await api.delete(`/publications/${story.id}`)
      onDelete?.(story.id)
      if (group.stories.length <= 1) onClose()
      else setIdx(i => Math.min(i, group.stories.length - 2))
    } catch { /* silencioso */ }
  }

  const handleHighlight = async () => {
    if (pinning) return
    setPinning(true)
    try {
      const updated = await api.patch<{ isPinned: boolean }>(`/publications/${story.id}/pin`, {})
      const next = updated.isPinned ?? !pinnedIds[story.id]
      setPinnedIds(p => ({ ...p, [story.id]: next }))
      onHighlight?.(story.id, next)
    } catch { /* silencioso */ }
    finally { setPinning(false) }
  }

  if (!story) return null

  const isPinned = pinnedIds[story.id] ?? story.isPinned ?? false

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
      onClick={onClose}
    >
      {/* 9:16 card — fixed proportions, no deformation */}
      <div
        className="relative rounded-2xl overflow-hidden bg-black shadow-2xl select-none"
        style={{ width: 'min(360px, 100vw - 32px)', aspectRatio: '9/16', maxHeight: 'calc(100vh - 32px)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* ── Segmented progress bars ── */}
        <div className="absolute top-0 left-0 right-0 flex gap-1 px-3 pt-3 z-20">
          {group.stories.map((_, i) => (
            <div key={i} className="flex-1 h-0.5 bg-white/30 rounded-full overflow-hidden">
              <div
                className="h-full bg-white"
                style={{ width: i < idx ? '100%' : i === idx ? '100%' : '0%' }}
              />
            </div>
          ))}
        </div>

        {/* ── Header: avatar + name + time + actions ── */}
        <div className="absolute top-6 left-0 right-0 flex items-center gap-3 px-3 z-20">
          <Avatar
            src={group.authorAvatar ? mediaUrl(group.authorAvatar) : undefined}
            name={group.authorName}
            size="sm"
            shape="circle"
            className="border-2 border-white shrink-0"
          />
          <div className="flex-1 min-w-0">
            <p className="text-white font-bold text-sm leading-none truncate">{group.authorName}</p>
            <p className="text-white/60 text-[11px] mt-0.5">{timeAgo(story.createdAt)}</p>
          </div>

          {/* Owner actions */}
          {isOwner && (
            <>
              <button
                onClick={handleHighlight}
                disabled={pinning}
                title={isPinned ? 'Quitar de destacadas' : 'Destacar historia'}
                className={cn(
                  'p-1.5 rounded-full transition-colors',
                  isPinned
                    ? 'text-amber-400 hover:text-amber-300'
                    : 'text-white/70 hover:text-amber-400',
                )}
              >
                <span className={cn('material-symbols-outlined text-[20px]', isPinned && 'icon-filled')}>
                  push_pin
                </span>
              </button>
              <button
                onClick={handleDelete}
                className="p-1.5 rounded-full text-white/70 hover:text-red-400"
                title="Eliminar historia"
              >
                <span className="material-symbols-outlined text-[20px]">delete</span>
              </button>
            </>
          )}

          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-white/80 hover:text-white"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* ── Story media — always fills the 9:16 container ── */}
        {story.imageUrl ? (
          <img
            src={mediaUrl(story.imageUrl)}
            alt="Historia"
            className="absolute inset-0 w-full h-full object-cover object-center"
            draggable={false}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary/80 to-primary-fixed p-8">
            <p className="text-white text-2xl font-bold text-center leading-relaxed">
              {story.content}
            </p>
          </div>
        )}

        {/* ── Bottom gradient + text overlay ── */}
        {story.imageUrl && story.content && (
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent pt-16 pb-6 px-5 z-10">
            <p className="text-white font-semibold text-sm text-center drop-shadow">
              {story.content}
            </p>
          </div>
        )}

        {/* ── Tap zones for navigation ── */}
        <div className="absolute inset-0 flex z-10" style={{ top: '80px' }}>
          <button className="w-1/3 h-full opacity-0" onClick={goPrev} aria-label="Historia anterior" />
          <button className="w-2/3 h-full opacity-0" onClick={goNext} aria-label="Historia siguiente" />
        </div>

        {/* ── Arrow buttons (visible) ── */}
        {idx > 0 && (
          <button
            onClick={goPrev}
            className="absolute left-2 top-1/2 -translate-y-1/2 z-20 bg-black/40 hover:bg-black/60 text-white rounded-full p-1"
          >
            <span className="material-symbols-outlined">chevron_left</span>
          </button>
        )}
        {idx < group.stories.length - 1 && (
          <button
            onClick={goNext}
            className="absolute right-2 top-1/2 -translate-y-1/2 z-20 bg-black/40 hover:bg-black/60 text-white rounded-full p-1"
          >
            <span className="material-symbols-outlined">chevron_right</span>
          </button>
        )}

        {/* ── Counter ── */}
        <div className="absolute bottom-3 left-0 right-0 text-center z-20">
          <span className="text-white/50 text-[11px]">{idx + 1} / {group.stories.length}</span>
        </div>

        {/* ── Pinned badge ── */}
        {isPinned && (
          <div className="absolute top-16 right-3 z-20 flex items-center gap-1 bg-amber-500/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
            <span className="material-symbols-outlined text-[12px] icon-filled">push_pin</span>
            Destacada
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Create Post Modal ────────────────────────────────────────────────────────
function CreatePostModal({
  selfAvatar,
  selfName,
  onClose,
  onCreated,
}: {
  selfAvatar?: string
  selfName: string
  onClose: () => void
  onCreated: (pub: Publication) => void
}) {
  const { isAuthenticated } = useAuthStore()
  const [title,         setTitle]         = useState('')
  const [content,       setContent]       = useState('')
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview,  setImagePreview]  = useState<string | null>(null)
  const [posting,       setPosting]       = useState(false)
  const [error,         setError]         = useState('')
  const photoInputRef = useRef<HTMLInputElement>(null)

  const handlePhotoSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { setError('La imagen no debe superar 5 MB'); return }
    setSelectedImage(file)
    const reader = new FileReader()
    reader.onload = () => setImagePreview(reader.result as string)
    reader.readAsDataURL(file)
    setError('')
  }

  const clearImage = () => {
    setSelectedImage(null)
    setImagePreview(null)
    if (photoInputRef.current) photoInputRef.current.value = ''
  }

  const submit = async () => {
    if (!content.trim() && !selectedImage) { setError('Escribe algo o agrega una imagen'); return }
    if (!isAuthenticated) { setError('Debes iniciar sesión'); return }
    setPosting(true)
    setError('')
    try {
      let imageUrl: string | undefined
      if (selectedImage) {
        const result = await api.upload<UploadResult>('/media/upload', selectedImage, { type: 'publication' })
        imageUrl = result.url
      }
      const created = await api.post<Publication>('/publications', {
        title: title.trim() || undefined,
        content,
        imageUrl,
      })
      onCreated(created)
      onClose()
    } catch {
      setError('No se pudo publicar. Intenta de nuevo.')
    } finally {
      setPosting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="w-full max-w-lg bg-surface rounded-2xl shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
        {/* Modal header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant/15">
          <h2 className="font-headline font-bold text-lg text-on-surface">Nueva publicación</h2>
          <button onClick={onClose} className="p-1.5 text-outline hover:text-on-surface rounded-md transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Author */}
        <div className="flex items-center gap-3 px-6 pt-5">
          <Avatar src={selfAvatar ? mediaUrl(selfAvatar) : undefined} name={selfName} size="md" />
          <div>
            <p className="font-semibold text-on-surface text-sm">{selfName}</p>
            <p className="text-xs text-on-surface-variant">Publicación para todos</p>
          </div>
        </div>

        {/* Form */}
        <div className="px-6 pt-4 pb-2 space-y-3">
          <div>
            <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1.5 block">
              Título <span className="text-outline font-normal normal-case">(opcional)</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Ej: Mi proyecto de fin de año"
              maxLength={120}
              className="w-full bg-surface-container-low border border-outline-variant/30 focus:border-primary rounded-xl px-4 py-2.5 text-sm outline-none transition-colors"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1.5 block">
              Descripción <span className="text-error">*</span>
            </label>
            <textarea
              value={content}
              onChange={e => { setContent(e.target.value); setError('') }}
              placeholder="¿Qué quieres compartir con tu red?"
              rows={4}
              className="w-full bg-surface-container-low border border-outline-variant/30 focus:border-primary rounded-xl px-4 py-3 text-sm outline-none transition-colors resize-none"
              autoFocus
            />
          </div>

          {imagePreview && (
            <div className="relative rounded-xl overflow-hidden">
              <img src={imagePreview} alt="Preview" className="w-full max-h-56 object-cover rounded-xl" />
              <button
                onClick={clearImage}
                className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1 hover:bg-black/80 transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>
          )}

          {error && (
            <p className="text-xs text-error flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">error</span>
              {error}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-outline-variant/10">
          <div className="flex items-center gap-2">
            <input
              ref={photoInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={handlePhotoSelected}
            />
            <button
              onClick={() => photoInputRef.current?.click()}
              title="Agregar imagen"
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-on-surface-variant hover:bg-surface-container hover:text-primary transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">image</span>
              {selectedImage ? 'Cambiar foto' : 'Foto'}
            </button>
          </div>
          <button
            onClick={submit}
            disabled={(!content.trim() && !selectedImage) || posting}
            className="px-6 py-2.5 rounded-xl editorial-gradient text-on-primary text-sm font-bold disabled:opacity-50 transition-all hover:shadow-md"
          >
            {posting ? 'Publicando...' : 'Publicar'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── FeedSection ──────────────────────────────────────────────────────────────
export function FeedSection({
  selfAvatar,
  selfName,
  selfLabel = 'Tú',
  postPlaceholder = '¿Qué quieres compartir hoy?',
  postActions = [
    { icon: 'image',              label: 'Foto',      action: 'photo' },
    { icon: 'folder_open',        label: 'Evidencia' },
    { icon: 'workspace_premium',  label: 'Logro' },
  ],
  skillTags = [],
}: FeedSectionProps) {
  const { isAuthenticated } = useAuthStore()
  const [publications,   setPublications]   = useState<Publication[]>([])
  const [storyGroups,    setStoryGroups]    = useState<UserStoryGroup[]>([])
  const [loading,        setLoading]        = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [activeGroup,    setActiveGroup]    = useState<UserStoryGroup | null>(null)
  const [uploadingStory, setUploadingStory] = useState(false)
  const [storyPending, setStoryPending] = useState<{ file: File; preview: string } | null>(null)

  const storyInputRef = useRef<HTMLInputElement>(null)

  const loadFeed = useCallback(async () => {
    const tagsParam = skillTags.length > 0 ? `&tags=${encodeURIComponent(skillTags.join(','))}` : ''
    const [pubs, strs] = await Promise.all([
      api.get<{ data: Publication[] }>(`/publications/feed?page=1&limit=20${tagsParam}`)
        .then(r => Array.isArray(r) ? r : (r as any).data ?? [])
        .catch(() => [] as Publication[]),
      api.get<Story[]>('/publications/stories').catch(() => [] as Story[]),
    ])
    setPublications(pubs)
    setStoryGroups(groupStories(strs))
    setLoading(false)
  }, [skillTags.join(',')])

  useEffect(() => { loadFeed() }, [loadFeed])

  const handleOpenStoryGroup = (group: UserStoryGroup) => {
    markSeen(group.authorId)
    setStoryGroups(prev => prev.map(g =>
      g.authorId === group.authorId ? { ...g, seen: true } : g,
    ))
    setActiveGroup(group)
  }

  const handleStoryDeleted = (storyId: string) => {
    setStoryGroups(prev => {
      return prev
        .map(g => ({ ...g, stories: g.stories.filter(s => s.id !== storyId) }))
        .filter(g => g.stories.length > 0)
    })
    if (activeGroup) {
      const updated = { ...activeGroup, stories: activeGroup.stories.filter(s => s.id !== storyId) }
      if (updated.stories.length === 0) setActiveGroup(null)
      else setActiveGroup(updated)
    }
  }

  const handleStorySelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !isAuthenticated) return
    if (file.size > 5 * 1024 * 1024) return
    const reader = new FileReader()
    reader.onload = () => setStoryPending({ file, preview: reader.result as string })
    reader.readAsDataURL(file)
    if (storyInputRef.current) storyInputRef.current.value = ''
  }

  const handleStoryConfirm = async () => {
    if (!storyPending) return
    setUploadingStory(true)
    setStoryPending(null)
    try {
      const { url } = await api.upload<UploadResult>('/media/upload', storyPending.file, { type: 'publication' })
      await api.post<Publication>('/publications', {
        content: '',
        imageUrl: url,
        isStory: true,
        storyDuration: 24,
      })
      const fresh = await api.get<Story[]>('/publications/stories').catch(() => [] as Story[])
      setStoryGroups(groupStories(fresh))
    } catch { /* silencioso */ }
    finally { setUploadingStory(false) }
  }

  const likePublication = (id: string, likes: number, isLiked: boolean) => {
    setPublications(prev => prev.map(p =>
      p.id === id ? { ...p, likes, isLiked } : p,
    ))
  }

  const deletePublication = (id: string) => {
    setPublications(prev => prev.filter(p => p.id !== id))
  }

  return (
    <>
      {/* Hidden story file input */}
      <input
        ref={storyInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={handleStorySelected}
      />

      {/* Story preview confirmation modal */}
      {storyPending && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-surface rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-outline-variant/15">
              <h2 className="font-headline font-bold text-base text-on-surface">Vista previa de historia</h2>
              <button
                onClick={() => setStoryPending(null)}
                className="p-1.5 text-outline hover:text-on-surface rounded-md transition-colors"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            <div className="p-4">
              <div className="rounded-xl overflow-hidden mb-4" style={{ aspectRatio: '9/16', maxHeight: '320px' }}>
                <img
                  src={storyPending.preview}
                  alt="Vista previa"
                  className="w-full h-full object-cover"
                />
              </div>
              <p className="text-xs text-on-surface-variant text-center mb-4">
                Esta imagen se publicará como tu historia por 24 horas.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setStoryPending(null)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-outline-variant/30 text-sm font-semibold text-on-surface-variant hover:bg-surface-container transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleStoryConfirm}
                  className="flex-1 px-4 py-2.5 rounded-xl editorial-gradient text-on-primary text-sm font-bold hover:shadow-md transition-all"
                >
                  Publicar historia
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Story viewer */}
      {activeGroup && (
        <StoryViewer
          group={activeGroup}
          onClose={() => setActiveGroup(null)}
          onDelete={handleStoryDeleted}
          onHighlight={(storyId, pinned) => {
            // Update the story in our local group to reflect pinned state
            setStoryGroups(prev => prev.map(g => ({
              ...g,
              stories: g.stories.map(s => s.id === storyId ? { ...s, isPinned: pinned } : s),
            })))
            setActiveGroup(prev => prev ? {
              ...prev,
              stories: prev.stories.map(s => s.id === storyId ? { ...s, isPinned: pinned } : s),
            } : null)
          }}
        />
      )}

      {/* Create post modal */}
      {showCreateModal && (
        <CreatePostModal
          selfAvatar={selfAvatar}
          selfName={selfName}
          onClose={() => setShowCreateModal(false)}
          onCreated={pub => setPublications(prev => [pub, ...prev])}
        />
      )}

      <div className="space-y-6">
        {/* Stories row */}
        <div className="card p-5">
          <div className="flex gap-4 overflow-x-auto pb-1 no-scrollbar">
            {/* Create story */}
            <button
              onClick={() => storyInputRef.current?.click()}
              disabled={uploadingStory || !isAuthenticated}
              className="flex flex-col items-center gap-2 flex-none cursor-pointer group disabled:opacity-60"
            >
              <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-outline-variant group-hover:border-primary transition-colors relative bg-surface-container flex items-center justify-center">
                <Avatar src={selfAvatar ? mediaUrl(selfAvatar) : undefined} name={selfName} size="lg" />
                <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="material-symbols-outlined text-white text-xl">
                    {uploadingStory ? 'hourglass_empty' : 'add'}
                  </span>
                </div>
              </div>
              <span className="text-[11px] font-bold text-on-surface-variant truncate w-16 text-center">
                {uploadingStory ? 'Subiendo...' : selfLabel}
              </span>
            </button>

            {/* Story groups — one bubble per user */}
            {storyGroups.map(group => (
              <button
                key={group.authorId}
                onClick={() => handleOpenStoryGroup(group)}
                className="flex flex-col items-center gap-2 flex-none group"
              >
                <div className="relative">
                  <div
                    className={`w-16 h-16 rounded-full overflow-hidden transition-all flex items-center justify-center ${
                      group.seen
                        ? 'border-2 border-outline-variant/40'
                        : 'border-2 border-primary'
                    }`}
                  >
                    {group.stories[0]?.imageUrl ? (
                      <img
                        src={mediaUrl(group.stories[0].imageUrl)}
                        alt={group.authorName}
                        className="w-full h-full object-cover object-center"
                      />
                    ) : (
                      <Avatar
                        src={group.authorAvatar ? mediaUrl(group.authorAvatar) : undefined}
                        name={group.authorName}
                        size="lg"
                      />
                    )}
                  </div>
                  {/* Multiple stories indicator */}
                  {group.stories.length > 1 && (
                    <span className="absolute bottom-0 right-0 bg-primary text-on-primary text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center border border-surface">
                      {group.stories.length}
                    </span>
                  )}
                </div>
                <span className="text-[11px] font-bold text-on-surface truncate w-16 text-center">
                  {group.authorName?.split(' ')[0] ?? '?'}
                </span>
              </button>
            ))}

            {!loading && storyGroups.length === 0 && (
              <div className="flex items-center text-xs text-outline ml-2 self-center">
                No hay historias aún
              </div>
            )}
          </div>
        </div>

        {/* Create post CTA */}
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <Avatar src={selfAvatar ? mediaUrl(selfAvatar) : undefined} name={selfName} size="md" />
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex-1 text-left px-4 py-3 rounded-full bg-surface-container-low text-on-surface-variant text-sm hover:bg-surface-container transition-colors"
            >
              {postPlaceholder}
            </button>
          </div>

          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-outline-variant/10">
            {postActions.map(({ icon, label, action }) => (
              <button
                key={label}
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-md text-xs font-semibold text-on-surface-variant hover:bg-surface-container transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">{icon}</span>
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Feed */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2].map(i => (
              <div key={i} className="card p-6 animate-pulse">
                <div className="flex gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-surface-container-low" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3 w-32 bg-surface-container rounded" />
                    <div className="h-2.5 w-24 bg-surface-container-low rounded" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="h-3 bg-surface-container-low rounded" />
                  <div className="h-3 w-4/5 bg-surface-container-low rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : publications.length === 0 ? (
          <div className="card p-10 text-center">
            <span className="material-symbols-outlined text-[48px] text-outline">feed</span>
            <p className="text-on-surface-variant text-sm mt-3">No hay publicaciones aún. ¡Sé el primero!</p>
          </div>
        ) : (
          publications.map(pub => (
            <PublicationCard
              key={pub.id}
              publication={pub}
              onLike={(_id, likes, isLiked) => likePublication(pub.id, likes, isLiked)}
              onDelete={deletePublication}
            />
          ))
        )}
      </div>
    </>
  )
}
