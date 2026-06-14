import type { Metadata } from 'next'
import '@/styles/globals.css'
import { RootNavWrapper } from '@/components/layout/RootNavWrapper'

export const metadata: Metadata = {
  title: {
    default: 'Red Talento TP',
    template: '%s | Red Talento TP',
  },
  description: 'La red profesional para talento técnico. Conecta estudiantes, colegios y empresas.',
  keywords: ['talento técnico', 'pasantías', 'prácticas', 'colegio técnico profesional', 'empleabilidad'],
  icons: {
    icon: '/favicon.ico',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className="scroll-smooth">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,400;0,500;0,600;0,700;0,800;1,700&family=Inter:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200"
          rel="stylesheet"
        />
      </head>
      <body className="bg-surface text-on-surface font-body antialiased">
        <RootNavWrapper />
        {children}
      </body>
    </html>
  )
}
