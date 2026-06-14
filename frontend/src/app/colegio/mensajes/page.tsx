import { Suspense } from 'react'
import MessagesLayout from '@/components/shared/MessagesLayout'

export default function ColegioMensajesPage() {
  return (
    <Suspense fallback={<div>Cargando mensajes...</div>}>
      <MessagesLayout />
    </Suspense>
  )
}
