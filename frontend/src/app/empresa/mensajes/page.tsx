import { Suspense } from 'react'
import MessagesLayout from '@/components/shared/MessagesLayout'

export default function EmpresaMensajesPage() {
  return (
    <Suspense fallback={<div>Cargando mensajes...</div>}>
      <MessagesLayout />
    </Suspense>
  )
}
