import { io, Socket } from 'socket.io-client'
import { useEffect, useRef, useState } from 'react'

class SocketManager {
  private socket: Socket | null = null
  private token: string | null = null

  connect(token: string) {
    if (this.socket?.connected && this.token === token) {
      return this.socket
    }

    // If token changed, reconnect with the new credentials.
    if (this.socket?.connected && this.token !== token) {
      this.disconnect()
    }

    this.token = token
    this.socket = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001', {
      auth: {
        token,
      },
      query: {
        token,
      },
    })

    this.socket.on('connect', () => {
      console.log('Connected to WebSocket')
      const payload = JSON.parse(atob(token.split('.')[1]))
      this.socket?.emit('joinRoom', { userId: payload.sub })
    })

    this.socket.on('disconnect', () => {
      console.log('Disconnected from WebSocket')
    })

    return this.socket
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
    }
  }

  getSocket() {
    return this.socket
  }

  sendMessage(receiverId: string, content: string) {
    if (this.socket) {
      this.socket.emit('sendMessage', { receiverId, content })
    }
  }

  onMessage(callback: (message: any) => void) {
    if (this.socket) {
      this.socket.on('newMessage', callback)
    }
  }

  offMessage(callback?: (message: any) => void) {
    if (this.socket) {
      this.socket.off('newMessage', callback)
    }
  }
}

export const socketManager = new SocketManager()

export function useSocket() {
  const [isConnected, setIsConnected] = useState(false)
  const [messages, setMessages] = useState<any[]>([])
  const socketRef = useRef<Socket | null>(null)

  useEffect(() => {
    const token = localStorage.getItem('access_token')
    if (token) {
      socketRef.current = socketManager.connect(token)
      setIsConnected(socketRef.current?.connected || false)

      const handleConnect = () => setIsConnected(true)
      const handleDisconnect = () => setIsConnected(false)
      const handleNewMessage = (message: any) => {
        setMessages(prev => [...prev, message])
      }

      socketRef.current?.on('connect', handleConnect)
      socketRef.current?.on('disconnect', handleDisconnect)
      socketManager.onMessage(handleNewMessage)

      return () => {
        socketRef.current?.off('connect', handleConnect)
        socketRef.current?.off('disconnect', handleDisconnect)
        socketManager.offMessage(handleNewMessage)
      }
    }
  }, [])

  const sendMessage = (receiverId: string, content: string) => {
    socketManager.sendMessage(receiverId, content)
  }

  return {
    isConnected,
    messages,
    sendMessage,
    clearMessages: () => setMessages([]),
  }
}