'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { Avatar } from '@/components/ui/Avatar'
import { api } from '@/lib/api-client'
import { useAuthStore } from '@/store/auth.store'
import { timeAgo, cn } from '@/lib/utils'
import { useSocket } from '@/lib/socket'

interface Conversation {
  id: string
  participantId: string
  participantName: string
  participantAvatar?: string
  participantRole: string
  lastMessage: string
  lastMessageAt: string
  unreadCount: number
}

interface Message {
  id: string
  senderId: string
  receiverId: string
  content: string
  isRead: boolean
  createdAt: string
}

export default function MessagesLayout() {
  const { user, isAuthenticated } = useAuthStore()
  const { isConnected, messages: socketMessages, sendMessage: socketSendMessage, clearMessages } = useSocket()

  const searchParams = useSearchParams()
  const withUserId = searchParams.get('with')

  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selected, setSelected]           = useState<Conversation | null>(null)
  const [messages, setMessages]           = useState<Message[]>([])
  const [message, setMessage]             = useState('')
  const [sending, setSending]             = useState(false)
  const [loadingConvs, setLoadingConvs]   = useState(true)
  const [loadingThread, setLoadingThread] = useState(false)
  const [search, setSearch]               = useState('')
  const [newConvUserId, setNewConvUserId] = useState<string | null>(null)
  const [newConvMessage, setNewConvMessage] = useState('')
  const [sendingNew, setSendingNew]       = useState(false)

  const bottomRef = useRef<HTMLDivElement>(null)

  // Load thread when conversation selected
  const loadThread = useCallback(async (conv: Conversation) => {
    setSelected(conv)
    setLoadingThread(true)
    try {
      const data = await api.get<Message[]>(`/messages/thread/${conv.participantId}`)
      setMessages(Array.isArray(data) ? data : [])
      // Mark as read in UI
      setConversations(prev =>
        prev.map(c => c.id === conv.id ? { ...c, unreadCount: 0 } : c)
      )
    } catch {
      setMessages([])
    } finally {
      setLoadingThread(false)
    }
  }, [])

  // Load conversations
  useEffect(() => {
    if (!isAuthenticated) { setLoadingConvs(false); return }
    api.get<Conversation[]>('/messages/conversations')
      .then(data => {
        const convs = Array.isArray(data) ? data : []
        setConversations(convs)
        if (withUserId) {
          const existing = convs.find(c => c.participantId === withUserId)
          if (existing) {
            loadThread(existing)
          } else {
            setNewConvUserId(withUserId)
          }
        }
      })
      .catch(() => {})
      .finally(() => setLoadingConvs(false))
  }, [isAuthenticated, loadThread, withUserId])

  // Handle incoming WebSocket messages
  useEffect(() => {
    if (socketMessages.length > 0) {
      socketMessages.forEach((socketMsg) => {
        // If this message is for the currently selected conversation, add it to messages
        if (selected && (socketMsg.senderId === selected.participantId || socketMsg.receiverId === selected.participantId)) {
          setMessages(prev => {
            // Check if message already exists to avoid duplicates
            const exists = prev.some(m => m.id === socketMsg.id)
            if (!exists) {
              return [...prev, socketMsg]
            }
            return prev
          })
        }

        // Update conversations list
        setConversations(prev =>
          prev.map(c => {
            if (c.participantId === socketMsg.senderId || c.participantId === socketMsg.receiverId) {
              return {
                ...c,
                lastMessage: socketMsg.content,
                lastMessageAt: socketMsg.createdAt,
                unreadCount: c.participantId === socketMsg.senderId ? c.unreadCount + 1 : c.unreadCount,
              }
            }
            return c
          })
        )
      })
      clearMessages()
    }
  }, [socketMessages, selected, clearMessages])

  const send = async () => {
    if (!message.trim() || !selected || sending) return
    const content = message.trim()
    setMessage('')
    setSending(true)
    try {
      // Send via WebSocket for real-time delivery
      socketSendMessage(selected.participantId, content)

      // Also send via HTTP for persistence (in case WebSocket fails)
      const sent = await api.post<Message>('/messages', {
        receiverId: selected.participantId,
        content,
      })

      // Add to local messages immediately for better UX
      const senderName = user?.role === 'STUDENT'
        ? `${(user?.profile as any)?.firstName || ''} ${(user?.profile as any)?.lastName || ''}`.trim() || 'Yo'
        : (user?.profile as any)?.name || 'Yo'
      
      const optimisticMessage = {
        ...sent,
        sender: { name: senderName, role: user?.role },
      }
      setMessages(prev => [...prev, optimisticMessage])

      setConversations(prev =>
        prev.map(c =>
          c.id === selected.id
            ? { ...c, lastMessage: content, lastMessageAt: new Date().toISOString() }
            : c
        )
      )
    } catch {
      // If WebSocket fails, the message will be sent via HTTP only
      // The UI will update when the WebSocket message arrives
    } finally {
      setSending(false)
    }
  }

  const sendNewConversation = async () => {
    if (!newConvMessage.trim() || !newConvUserId || sendingNew) return
    const content = newConvMessage.trim()
    setNewConvMessage('')
    setSendingNew(true)
    try {
      // Send via WebSocket
      socketSendMessage(newConvUserId, content)

      // Send via HTTP for persistence
      await api.post<Message>('/messages', { receiverId: newConvUserId, content })

      // Refresh conversations and then select the new one
      const data = await api.get<Conversation[]>('/messages/conversations')
      const convs = Array.isArray(data) ? data : []
      setConversations(convs)
      const newConv = convs.find(c => c.participantId === newConvUserId)
      setNewConvUserId(null)
      if (newConv) {
        loadThread(newConv)
      }
    } catch {
      setNewConvMessage(content)   // restore on error so user can retry
    } finally {
      setSendingNew(false)
    }
  }

  const filteredConvs = conversations.filter(c =>
    c.participantName.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <main className="max-w-[1440px] mx-auto px-8 py-10">
      <div className="card overflow-hidden" style={{ height: 'calc(100vh - 8rem)' }}>
        <div className="flex h-full">

          {/* ── Conversation list ──────────────────────────────────── */}
          <div className="w-80 border-r border-outline-variant/10 flex flex-col shrink-0">
            <div className="p-5 border-b border-outline-variant/10">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-headline font-bold text-lg text-on-surface">Mensajes</h2>
                <div className="flex items-center gap-2">
                  <div className={cn(
                    'w-2 h-2 rounded-full',
                    isConnected ? 'bg-green-500' : 'bg-red-500'
                  )} />
                  <span className="text-xs text-outline">
                    {isConnected ? 'Conectado' : 'Desconectado'}
                  </span>
                </div>
              </div>
              <div className="flex items-center bg-surface-container-low rounded-lg px-3 py-2 gap-2">
                <span className="material-symbols-outlined text-outline text-[18px]">search</span>
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Buscar conversación..."
                  className="bg-transparent outline-none text-sm w-full placeholder:text-outline"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {loadingConvs ? (
                <div className="space-y-0">
                  {[1,2,3].map(i => (
                    <div key={i} className="flex items-start gap-3 px-5 py-4 border-b border-outline-variant/5 animate-pulse">
                      <div className="w-10 h-10 rounded-full bg-surface-container-low shrink-0" />
                      <div className="flex-1 space-y-2">
                        <div className="h-3 w-28 bg-surface-container rounded" />
                        <div className="h-2.5 w-40 bg-surface-container-low rounded" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredConvs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                  <span className="material-symbols-outlined text-[48px] text-outline">forum</span>
                  <p className="mt-3 text-sm font-semibold text-on-surface-variant">Sin conversaciones</p>
                  <p className="text-xs text-outline mt-1">Cuando alguien te escriba, aparecerá aquí.</p>
                </div>
              ) : (
                filteredConvs.map(conv => (
                  <button
                    key={conv.id}
                    onClick={() => { setNewConvUserId(null); loadThread(conv) }}
                    className={cn(
                      'w-full flex items-start gap-3 px-5 py-4 text-left transition-colors border-b border-outline-variant/5',
                      selected?.id === conv.id
                        ? 'bg-primary-fixed/40'
                        : 'hover:bg-surface-container-low',
                    )}
                  >
                    <div className="relative shrink-0">
                      <Avatar
                        src={conv.participantAvatar}
                        name={conv.participantName}
                        size="md"
                        shape={conv.participantRole !== 'STUDENT' ? 'rounded' : 'circle'}
                      />
                      {conv.unreadCount > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-primary text-on-primary text-[9px] font-bold rounded-full flex items-center justify-center">
                          {conv.unreadCount}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className={cn(
                          'text-sm font-bold truncate',
                          selected?.id === conv.id ? 'text-primary' : 'text-on-surface',
                        )}>
                          {conv.participantName}
                        </span>
                        <span className="text-[10px] text-outline shrink-0">{timeAgo(conv.lastMessageAt)}</span>
                      </div>
                      <p className={cn(
                        'text-xs truncate mt-0.5',
                        conv.unreadCount > 0 ? 'text-on-surface font-medium' : 'text-on-surface-variant',
                      )}>
                        {conv.lastMessage}
                      </p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* ── Chat area ─────────────────────────────────────────── */}
          {selected ? (
            <div className="flex-1 flex flex-col">
              {/* Header */}
              <div className="px-6 py-4 border-b border-outline-variant/10 flex items-center gap-4">
                <Avatar
                  src={selected.participantAvatar}
                  name={selected.participantName}
                  size="md"
                  shape={selected.participantRole !== 'STUDENT' ? 'rounded' : 'circle'}
                />
                <div>
                  <h3 className="font-headline font-bold text-on-surface">{selected.participantName}</h3>
                  <p className="text-xs text-outline capitalize">
                    {selected.participantRole === 'EMPRESA' ? 'Empresa' :
                     selected.participantRole === 'COLEGIO' ? 'Colegio' : 'Estudiante'}
                  </p>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {loadingThread ? (
                  <div className="space-y-4">
                    {[1,2,3].map(i => (
                      <div key={i} className={cn('flex gap-3', i % 2 === 0 && 'flex-row-reverse')}>
                        <div className="w-8 h-8 rounded-full bg-surface-container-low shrink-0 animate-pulse" />
                        <div className={cn(
                          'h-10 rounded-2xl animate-pulse bg-surface-container-low',
                          i % 2 === 0 ? 'w-48' : 'w-64',
                        )} />
                      </div>
                    ))}
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full py-20 text-center">
                    <span className="material-symbols-outlined text-[64px] text-outline">mail</span>
                    <p className="mt-4 font-semibold text-on-surface-variant">Inicia la conversación</p>
                    <p className="text-sm text-outline mt-1">Envía el primer mensaje a {selected.participantName}</p>
                  </div>
                ) : (
                  messages.map(msg => {
                    const isMe = selected
                      ? msg.senderId !== selected.participantId
                      : msg.senderId === user?.id

                    return (
                      <div
                        key={msg.id}
                        className={cn(
                          'flex gap-3 items-end max-w-full',
                          isMe ? 'justify-end' : 'justify-start',
                        )}
                      >
                        {!isMe && (
                          <Avatar
                            src={selected.participantAvatar}
                            name={selected.participantName}
                            size="sm"
                            shape={selected.participantRole !== 'STUDENT' ? 'rounded' : 'circle'}
                          />
                        )}
                        <div className={cn(
                          'px-4 py-3 rounded-3xl text-sm leading-relaxed max-w-[75%] break-words',
                          isMe
                            ? 'self-end bg-primary-container text-on-primary rounded-br-none'
                            : 'self-start bg-slate-100 text-slate-900 rounded-bl-none border border-slate-200 shadow-sm',
                        )}>
                          {msg.content}
                          <div className={cn(
                            'text-[10px] mt-1',
                            isMe ? 'text-on-primary/70 text-right' : 'text-slate-500 text-left',
                          )}>
                            {timeAgo(msg.createdAt)}
                          </div>
                        </div>
                        {isMe && (
                          <Avatar
                            src={user?.avatar ?? undefined}
                            name={
                              user?.role === 'STUDENT'
                                ? `${(user?.profile as any)?.firstName || ''} ${(user?.profile as any)?.lastName || ''}`.trim() || 'Yo'
                                : (user?.profile as any)?.name ?? 'Yo'
                            }
                            size="sm"
                            shape={user?.role !== 'STUDENT' ? 'rounded' : 'circle'}
                          />
                        )}
                      </div>
                    )
                  })
                )}
                <div ref={bottomRef} />
              </div>

              {/* Input */}
              <div className="px-6 py-4 border-t border-outline-variant/10">
                <div className="flex items-center gap-3 bg-surface-container-low rounded-xl px-4 py-3">
                  <input
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    placeholder="Escribe un mensaje..."
                    className="flex-1 bg-transparent outline-none text-sm placeholder:text-outline"
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
                  />
                  <button
                    onClick={send}
                    disabled={!message.trim() || sending}
                    className="w-8 h-8 rounded-lg editorial-gradient flex items-center justify-center disabled:opacity-40 transition-opacity"
                  >
                    <span className="material-symbols-outlined text-on-primary text-[18px]">send</span>
                  </button>
                </div>
              </div>
            </div>
          ) : newConvUserId ? (
            <div className="flex-1 flex flex-col">
              {/* Header */}
              <div className="px-6 py-4 border-b border-outline-variant/10 flex items-center gap-4">
                <div>
                  <h3 className="font-headline font-bold text-on-surface">Nueva conversación</h3>
                  <p className="text-xs text-outline">Envía el primer mensaje para iniciar el chat</p>
                </div>
              </div>

              {/* Empty messages area */}
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <span className="material-symbols-outlined text-[64px] text-outline">mail</span>
                  <p className="mt-4 font-semibold text-on-surface-variant">Escribe tu primer mensaje</p>
                </div>
              </div>

              {/* Input */}
              <div className="px-6 py-4 border-t border-outline-variant/10">
                <div className="flex items-center gap-3 bg-surface-container-low rounded-xl px-4 py-3">
                  <input
                    value={newConvMessage}
                    onChange={e => setNewConvMessage(e.target.value)}
                    placeholder="Escribe un mensaje..."
                    className="flex-1 bg-transparent outline-none text-sm placeholder:text-outline"
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendNewConversation() } }}
                  />
                  <button
                    onClick={sendNewConversation}
                    disabled={!newConvMessage.trim() || sendingNew}
                    className="w-8 h-8 rounded-lg editorial-gradient flex items-center justify-center disabled:opacity-40 transition-opacity"
                  >
                    <span className="material-symbols-outlined text-on-primary text-[18px]">send</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <span className="material-symbols-outlined text-[64px] text-outline">forum</span>
                <p className="font-headline font-bold text-on-surface mt-4">Selecciona una conversación</p>
                <p className="text-sm text-on-surface-variant mt-1">Elige un chat de la lista para empezar</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
