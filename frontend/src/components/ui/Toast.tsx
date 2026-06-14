'use client'

import { useEffect, useState } from 'react'

interface ToastProps {
  message: string
  type?: 'success' | 'error' | 'info'
  onDismiss: () => void
  duration?: number
}

export function Toast({ message, type = 'success', onDismiss, duration = 3000 }: ToastProps) {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const t = setTimeout(() => { setVisible(false); onDismiss() }, duration)
    return () => clearTimeout(t)
  }, [duration, onDismiss])

  if (!visible) return null

  const styles = {
    success: 'bg-[#1a4731] text-white',
    error:   'bg-[#4a1a1a] text-white',
    info:    'bg-[#1a2f4a] text-white',
  }

  const icons = {
    success: 'check_circle',
    error:   'error',
    info:    'info',
  }

  return (
    <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[300] flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl ${styles[type]} animate-fade-in`}>
      <span className="material-symbols-outlined text-[20px] icon-filled">{icons[type]}</span>
      <span className="text-sm font-semibold">{message}</span>
    </div>
  )
}
