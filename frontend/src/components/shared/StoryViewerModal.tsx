'use client'

import { useState, useEffect } from 'react'
import { Avatar } from '@/components/ui/Avatar'
import { api } from '@/lib/api-client'
import { cn, mediaUrl, timeAgo } from '@/lib/utils'
import { useAuthStore } from '@/store/auth.store'

export interface StoryItem {
  id: string
  authorId: string
  authorName: string
  authorAvatar?: string
  imageUrl?: string
  content?: string
  createdAt: string
  isPinned?: boolean
}

interface StoryViewerModalProps {
  stories: StoryItem[]
  initialIndex?: number
  onClose: () => void
  onDelete?: (storyId: string) => void
  onHighlight?: (storyId: string, pinned: boolean) => void
}

export function StoryViewerModal({
  stories,
  initialIndex = 0,
  onClose,
  onDelete,
  onHighlight,
}: StoryViewerModalProps) {
  const { user } = useAuthStore()
  const [idx,       setIdx]       = useState(initialIndex)
  const [pinning,   setPinning]   = useState(false)
  const [pinnedIds, setPinnedIds] = useState<Record<string, boolean>>({})

  const story   = stories[idx]
  const isOwner = user?.id === story?.authorId

  useEffect(() => {
    setIdx(initialIndex)
  }, [initialIndex])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape')     onClose()
      if (e.key === 'ArrowRight') setIdx(i => Math.min(i + 1, stories.length - 1))
      if (e.key === 'ArrowLeft')  setIdx(i => Math.max(i - 1, 0))
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose, stories.length])

  const goNext = () => {
    if (idx < stories.length - 1) setIdx(i => i + 1)
    else onClose()
  }
  const goPrev = () => setIdx(i => Math.max(i - 1, 0))

  const handleDelete = async () => {
    if (!confirm('¿Eliminar esta historia?')) return
    try {
      await api.delete(`/publications/${story.id}`)
      onDelete?.(story.id)
      if (stories.length <= 1) onClose()
      else setIdx(i => Math.min(i, stories.length - 2))
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative rounded-2xl overflow-hidden bg-black shadow-2xl select-none"
        style={{ width: 'min(360px, 100vw - 32px)', aspectRatio: '9/16', maxHeight: 'calc(100vh - 32px)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Progress bars */}
        <div className="absolute top-0 left-0 right-0 flex gap-1 px-3 pt-3 z-20">
          {stories.map((_, i) => (
            <div key={i} className="flex-1 h-0.5 bg-white/30 rounded-full overflow-hidden">
              <div
                className="h-full bg-white"
                style={{ width: i <= idx ? '100%' : '0%' }}
              />
            </div>
          ))}
        </div>

        {/* Header */}
        <div className="absolute top-6 left-0 right-0 flex items-center gap-3 px-3 z-20">
          <Avatar
            src={story.authorAvatar ? mediaUrl(story.authorAvatar) : undefined}
            name={story.authorName}
            size="sm"
            shape="circle"
            className="border-2 border-white shrink-0"
          />
          <div className="flex-1 min-w-0">
            <p className="text-white font-bold text-sm leading-none truncate">{story.authorName}</p>
            <p className="text-white/60 text-[11px] mt-0.5">{timeAgo(story.createdAt)}</p>
          </div>

          {isOwner && (
            <>
              <button
                onClick={handleHighlight}
                disabled={pinning}
                title={isPinned ? 'Quitar de destacadas' : 'Destacar historia'}
                className={cn(
                  'p-1.5 rounded-full transition-colors',
                  isPinned ? 'text-amber-400 hover:text-amber-300' : 'text-white/70 hover:text-amber-400',
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

          <button onClick={onClose} className="p-1.5 rounded-full text-white/80 hover:text-white">
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Media */}
        {story.imageUrl ? (
          <img
            src={mediaUrl(story.imageUrl)}
            alt="Historia"
            className="absolute inset-0 w-full h-full object-cover object-center"
            draggable={false}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary/80 to-primary-fixed p-8">
            <p className="text-white text-2xl font-bold text-center leading-relaxed">{story.content}</p>
          </div>
        )}

        {/* Text overlay */}
        {story.imageUrl && story.content && (
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent pt-16 pb-6 px-5 z-10">
            <p className="text-white font-semibold text-sm text-center drop-shadow">{story.content}</p>
          </div>
        )}

        {/* Tap zones */}
        <div className="absolute inset-0 flex z-10" style={{ top: '80px' }}>
          <button className="w-1/3 h-full opacity-0" onClick={goPrev} aria-label="Historia anterior" />
          <button className="w-2/3 h-full opacity-0" onClick={goNext} aria-label="Historia siguiente" />
        </div>

        {/* Arrow buttons */}
        {idx > 0 && (
          <button
            onClick={goPrev}
            className="absolute left-2 top-1/2 -translate-y-1/2 z-20 bg-black/40 hover:bg-black/60 text-white rounded-full p-1"
          >
            <span className="material-symbols-outlined">chevron_left</span>
          </button>
        )}
        {idx < stories.length - 1 && (
          <button
            onClick={goNext}
            className="absolute right-2 top-1/2 -translate-y-1/2 z-20 bg-black/40 hover:bg-black/60 text-white rounded-full p-1"
          >
            <span className="material-symbols-outlined">chevron_right</span>
          </button>
        )}

        {/* Counter */}
        {stories.length > 1 && (
          <div className="absolute bottom-3 left-0 right-0 text-center z-20">
            <span className="text-white/50 text-[11px]">{idx + 1} / {stories.length}</span>
          </div>
        )}

        {/* Pinned badge */}
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
