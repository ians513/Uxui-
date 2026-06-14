'use client'

import { useState, useRef, useEffect } from 'react'
import { Avatar } from '@/components/ui/Avatar'
import { cn, timeAgo, mediaUrl } from '@/lib/utils'
import { api } from '@/lib/api-client'
import { useAuthStore } from '@/store/auth.store'
import type { Publication, Comment } from '@/types'

interface PublicationCardProps {
  publication: Publication
  onLike?: (id: string, likes: number, isLiked: boolean) => void
  onDelete?: (id: string) => void
  onPin?: (id: string, newState: boolean) => void
}

export function PublicationCard({ publication, onLike, onDelete, onPin }: PublicationCardProps) {
  const { user, isAuthenticated } = useAuthStore()
  const [liked,     setLiked]     = useState(publication.isLiked ?? false)
  const [likeCount, setLikeCount] = useState(publication.likes)
  const [liking,    setLiking]    = useState(false)
  const [pinned,    setPinned]    = useState(publication.isPinned ?? false)
  const [menuOpen,  setMenuOpen]  = useState(false)
  const [deleting,  setDeleting]  = useState(false)

  // Comments
  const [showComments,   setShowComments]   = useState(false)
  const [comments,       setComments]       = useState<Comment[]>([])
  const [commentsLoaded, setCommentsLoaded] = useState(false)
  const [commentCount,   setCommentCount]   = useState(publication.comments)
  const [newComment,     setNewComment]     = useState('')
  const [submitting,     setSubmitting]     = useState(false)
  const commentInputRef = useRef<HTMLInputElement>(null)

  const menuRef = useRef<HTMLDivElement>(null)
  const isOwner = user?.id === publication.authorId

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleLike = async () => {
    if (!isAuthenticated || liking) return
    setLiking(true)
    try {
      const res = await api.post<{ isLiked: boolean; likes: number }>(`/publications/${publication.id}/like`, {})
      setLiked(res.isLiked)
      setLikeCount(res.likes)
      onLike?.(publication.id, res.likes, res.isLiked)
    } catch { /* silencioso */ }
    finally { setLiking(false) }
  }

  const handleDelete = async () => {
    if (!confirm('¿Eliminar esta publicación?')) return
    setDeleting(true)
    try {
      await api.delete(`/publications/${publication.id}`)
      onDelete?.(publication.id)
    } catch {
      setDeleting(false)
    }
    setMenuOpen(false)
  }

  const handlePin = async () => {
    try {
      const updated = await api.patch<Publication>(`/publications/${publication.id}/pin`, {})
      setPinned(updated.isPinned ?? false)
      onPin?.(publication.id, updated.isPinned ?? false)
    } catch { /* silencioso */ }
    setMenuOpen(false)
  }

  const toggleComments = async () => {
    const next = !showComments
    setShowComments(next)
    if (next && !commentsLoaded) {
      try {
        const data = await api.get<Comment[]>(`/publications/${publication.id}/comments`)
        setComments(data)
        setCommentsLoaded(true)
      } catch { /* silencioso */ }
    }
    if (next) setTimeout(() => commentInputRef.current?.focus(), 100)
  }

  const submitComment = async () => {
    if (!newComment.trim() || !isAuthenticated) return
    setSubmitting(true)
    try {
      const comment = await api.post<Comment>(`/publications/${publication.id}/comments`, {
        content: newComment.trim(),
      })
      setComments(prev => [...prev, comment])
      setCommentCount(prev => prev + 1)
      setNewComment('')
    } catch { /* silencioso */ }
    finally { setSubmitting(false) }
  }

  const tags = publication.tags ?? []

  return (
    <article className={cn('card group animate-fade-in', deleting && 'opacity-50 pointer-events-none')}>
      {/* Author header */}
      <div className="p-5 pb-0">
        <div className="flex items-start gap-3">
          <Avatar
            src={publication.authorAvatar ? mediaUrl(publication.authorAvatar) : undefined}
            name={publication.authorName ?? '?'}
            size="md"
            shape={publication.authorType === 'COLEGIO' ? 'rounded' : 'circle'}
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-on-surface text-sm font-headline">
                {publication.authorName ?? 'Usuario'}
              </span>
              {publication.authorType === 'COLEGIO' && (
                <span className="inline-flex items-center gap-0.5 text-[10px] font-bold uppercase tracking-wide text-primary bg-primary-fixed/60 px-2 py-0.5 rounded-full">
                  <span className="material-symbols-outlined text-[11px] icon-filled">verified</span>
                  Institución
                </span>
              )}
              {pinned && (
                <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                  <span className="material-symbols-outlined text-[11px]">push_pin</span>
                  Destacado
                </span>
              )}
            </div>
            {publication.authorSchool && publication.authorType === 'STUDENT' && (
              <p className="text-xs text-on-surface-variant truncate">{publication.authorSchool}</p>
            )}
            <p className="text-[11px] text-outline mt-0.5">{timeAgo(publication.createdAt)}</p>
          </div>

          {/* Options menu — only stories can be pinned */}
          <div className="relative ml-auto" ref={menuRef}>
            <button
              onClick={() => setMenuOpen(v => !v)}
              className="p-1.5 text-outline hover:text-on-surface hover:bg-surface-container rounded-md transition-all"
            >
              <span className="material-symbols-outlined text-[20px]">more_horiz</span>
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-8 z-20 bg-surface border border-outline-variant/20 rounded-xl shadow-elevated min-w-[160px] py-1 animate-fade-in">
                {isOwner && (
                  <>
                    {/* Pin only available for stories */}
                    {publication.isStory && (
                      <button
                        onClick={handlePin}
                        className="w-full text-left px-4 py-2 text-sm hover:bg-surface-container flex items-center gap-2"
                      >
                        <span className="material-symbols-outlined text-[16px]">push_pin</span>
                        {pinned ? 'Quitar destaque' : 'Destacar en perfil'}
                      </button>
                    )}
                    <button
                      onClick={handleDelete}
                      className="w-full text-left px-4 py-2 text-sm text-error hover:bg-error/5 flex items-center gap-2"
                    >
                      <span className="material-symbols-outlined text-[16px]">delete</span>
                      Eliminar
                    </button>
                  </>
                )}
                {!isOwner && (
                  <button className="w-full text-left px-4 py-2 text-sm hover:bg-surface-container flex items-center gap-2">
                    <span className="material-symbols-outlined text-[16px]">flag</span>
                    Reportar
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-5 py-4">
        {(publication as any).title && (
          <h3 className="font-bold text-on-surface text-base mb-1">{(publication as any).title}</h3>
        )}
        {publication.content && (
          <p className="text-sm text-on-surface leading-relaxed">{publication.content}</p>
        )}

        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {tags.map(tag => (
              <span key={tag} className="text-[11px] text-primary font-semibold hover:underline cursor-pointer">
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Image */}
      {publication.imageUrl && (
        <div className="mx-5 mb-4 rounded-xl overflow-hidden bg-surface-container-low">
          <img
            src={mediaUrl(publication.imageUrl)}
            alt="Imagen de publicación"
            className="w-full max-h-96 object-cover"
            loading="lazy"
            onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
          />
        </div>
      )}

      {/* Stats bar */}
      <div className="px-5 py-2 flex items-center gap-4 text-xs text-outline">
        <span>{likeCount} me gusta</span>
        <span>·</span>
        <button onClick={toggleComments} className="hover:text-on-surface transition-colors">
          {commentCount} comentarios
        </button>
        <span>·</span>
        <span>{publication.views} vistas</span>
      </div>

      {/* Action bar */}
      <div className="px-3 py-2 border-t border-outline-variant/10 flex items-center">
        {/* Like */}
        <button
          onClick={handleLike}
          disabled={!isAuthenticated || liking}
          className={cn(
            'flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-xs font-semibold transition-all disabled:opacity-60',
            liked
              ? 'text-error'
              : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface',
          )}
        >
          <span className={cn('material-symbols-outlined text-[18px]', liked && 'icon-filled')}>
            {liked ? 'favorite' : 'favorite_border'}
          </span>
          Me gusta
        </button>

        {/* Comment */}
        <button
          onClick={toggleComments}
          className={cn(
            'flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-xs font-semibold transition-all',
            showComments
              ? 'text-primary bg-primary-fixed/20'
              : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface',
          )}
        >
          <span className="material-symbols-outlined text-[18px]">mode_comment</span>
          Comentar
        </button>
      </div>

      {/* Comments section */}
      {showComments && (
        <div className="border-t border-outline-variant/10">
          {/* Comment list */}
          <div className="px-5 pt-3 space-y-3 max-h-60 overflow-y-auto">
            {!commentsLoaded ? (
              <p className="text-xs text-outline py-2">Cargando...</p>
            ) : comments.length === 0 ? (
              <p className="text-xs text-outline py-2">Sin comentarios aún. ¡Sé el primero!</p>
            ) : (
              comments.map(c => (
                <div key={c.id} className="flex gap-2.5">
                  <Avatar name={c.authorName ?? '?'} size="sm" />
                  <div className="flex-1 bg-surface-container-low rounded-xl px-3 py-2">
                    <p className="text-xs font-semibold text-on-surface">{c.authorName ?? 'Usuario'}</p>
                    <p className="text-xs text-on-surface leading-relaxed mt-0.5">{c.content}</p>
                    <p className="text-[10px] text-outline mt-1">{timeAgo(c.createdAt)}</p>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Comment input */}
          {isAuthenticated && (
            <div className="flex gap-2 px-5 py-3">
              <input
                ref={commentInputRef}
                type="text"
                value={newComment}
                onChange={e => setNewComment(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submitComment() } }}
                placeholder="Escribe un comentario..."
                className="flex-1 bg-surface-container-low border border-outline-variant/20 focus:border-primary rounded-full px-4 py-2 text-xs outline-none transition-colors"
                maxLength={500}
              />
              <button
                onClick={submitComment}
                disabled={!newComment.trim() || submitting}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-primary text-on-primary disabled:opacity-40 transition-all hover:shadow-md shrink-0"
              >
                <span className="material-symbols-outlined text-[16px]">send</span>
              </button>
            </div>
          )}
        </div>
      )}
    </article>
  )
}
