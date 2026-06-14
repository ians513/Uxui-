'use client'

/**
 * ProfileImageEditor — componente cliente que maneja la subida
 * de foto de perfil y portada del estudiante.
 *
 * Se usa dentro del Server Component de perfil para aislar
 * la interactividad sin convertir toda la página a cliente.
 */

import { useState } from 'react'
import { ImageUpload } from '@/components/ui/ImageUpload'
import { Avatar } from '@/components/ui/Avatar'
import { api } from '@/lib/api-client'

interface ProfileImageEditorProps {
  currentAvatar?: string
  currentCover?: string
  fullName: string
  isAuthenticated?: boolean
}

const API_BASE = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api').replace('/api', '')

function toAbsolute(url?: string) {
  if (!url) return undefined
  return url.startsWith('http') ? url : `${API_BASE}${url}`
}

export function ProfileImageEditor({
  currentAvatar,
  currentCover,
  fullName,
  isAuthenticated = false,
}: ProfileImageEditorProps) {
  const [avatar, setAvatar] = useState(currentAvatar)
  const [cover,  setCover]  = useState(currentCover)

  const saveAvatar = async (url: string) => {
    setAvatar(url)
    if (isAuthenticated) {
      await api.patch('/students/me', { avatar: url }).catch(() => {})
    }
  }

  const saveCover = async (url: string) => {
    setCover(url)
    if (isAuthenticated) {
      await api.patch('/students/me', { coverImage: url }).catch(() => {})
    }
  }

  return (
    <div className="relative">
      {/* Portada */}
      <div className="h-40 relative overflow-hidden editorial-gradient group">
        {cover && (
          <img src={toAbsolute(cover)} alt="Portada" className="w-full h-full object-cover absolute inset-0" />
        )}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-4 left-8 w-32 h-32 rounded-full bg-on-primary/10" />
          <div className="absolute bottom-0 right-16 w-48 h-24 rounded-full bg-on-primary/10" />
        </div>

        {/* Botón editar portada */}
        <div className="absolute top-3 right-3">
          <ImageUpload
            currentUrl={toAbsolute(cover)}
            uploadType="cover"
            shape="rounded"
            className="w-9 h-9 bg-black/40 rounded-lg backdrop-blur-sm"
            onSuccess={saveCover}
            label="Cambiar portada"
            placeholder={
              <span className="material-symbols-outlined text-white text-[18px]">wallpaper</span>
            }
          />
        </div>
      </div>

      {/* Avatar con upload */}
      <div className="px-8 -mt-10 relative z-10">
        <div className="relative w-[88px] h-[88px] group">
          {/* Avatar actual */}
          <div className="w-full h-full rounded-xl border-4 border-surface-container-lowest overflow-hidden bg-surface-container">
            <Avatar
              src={toAbsolute(avatar)}
              name={fullName}
              size="2xl"
              shape="rounded"
              className="w-full h-full"
            />
          </div>

          {/* Upload overlay */}
          <ImageUpload
            currentUrl={toAbsolute(avatar)}
            uploadType="avatar"
            shape="rounded"
            className="absolute inset-0 w-full h-full opacity-0 group-hover:opacity-100 transition-opacity border-4 border-surface-container-lowest"
            onSuccess={saveAvatar}
            label="Cambiar foto"
            placeholder={
              <div className="w-full h-full flex items-center justify-center bg-black/40 rounded-xl">
                <span className="material-symbols-outlined text-white text-[24px]">photo_camera</span>
              </div>
            }
          />
        </div>
      </div>
    </div>
  )
}
