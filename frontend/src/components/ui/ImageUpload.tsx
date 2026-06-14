'use client'

import { useRef, useState } from 'react'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import apiClient from '@/lib/api-client'

type UploadType = 'avatar' | 'cover' | 'evidence' | 'publication' | 'logo'

interface ImageUploadProps {
  /** URL actual de la imagen (puede ser relativa o absoluta) */
  currentUrl?: string
  /** Tipo de upload — determina la carpeta en el servidor */
  uploadType: UploadType
  /** Forma del contenedor */
  shape?: 'circle' | 'rounded' | 'square'
  /** Callback con la URL pública devuelta por el servidor */
  onSuccess: (url: string) => void
  /** Clases adicionales para el contenedor */
  className?: string
  /** Placeholder si no hay imagen */
  placeholder?: React.ReactNode
  /** Texto del botón de acción */
  label?: string
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api'

export function ImageUpload({
  currentUrl,
  uploadType,
  shape = 'square',
  onSuccess,
  className,
  placeholder,
  label = 'Subir imagen',
}: ImageUploadProps) {
  const inputRef        = useRef<HTMLInputElement>(null)
  const [preview, setPreview]   = useState<string | undefined>(currentUrl)
  const [uploading, setUploading] = useState(false)
  const [error, setError]       = useState<string | null>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validación en cliente
    const MAX_MB = 5
    if (file.size > MAX_MB * 1024 * 1024) {
      setError(`El archivo supera los ${MAX_MB} MB.`)
      return
    }
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
    if (!allowed.includes(file.type)) {
      setError('Solo se aceptan imágenes (JPEG, PNG, WEBP, GIF).')
      return
    }

    setError(null)

    // Preview local inmediato
    const objectUrl = URL.createObjectURL(file)
    setPreview(objectUrl)

    // Subida al servidor
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await apiClient.post<{ url: string }>(
        `/media/upload?type=${uploadType}`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } },
      )

      const serverUrl = response.data.url
      // Construir URL absoluta para mostrar la imagen real del servidor
      const absoluteUrl = serverUrl.startsWith('http')
        ? serverUrl
        : `${API_BASE.replace('/api', '')}${serverUrl}`

      setPreview(absoluteUrl)
      onSuccess(serverUrl)  // Guardamos la URL relativa en la DB
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? 'Error al subir la imagen.'
      setError(Array.isArray(msg) ? msg[0] : msg)
      setPreview(currentUrl)  // Revertir al preview original
    } finally {
      setUploading(false)
      // Reset input para permitir subir el mismo archivo de nuevo
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  const shapeClass = shape === 'circle'  ? 'rounded-full' :
                     shape === 'rounded' ? 'rounded-xl'   : 'rounded-lg'

  return (
    <div className={cn('relative group', className)}>
      {/* Input oculto */}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={handleFileChange}
        disabled={uploading}
      />

      {/* Contenedor de imagen */}
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className={cn(
          'relative w-full h-full overflow-hidden block',
          shapeClass,
          'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
          uploading && 'cursor-wait opacity-75',
        )}
        aria-label={label}
      >
        {preview ? (
          <Image
            src={preview}
            alt="Imagen de perfil"
            fill
            className="object-cover"
            unoptimized  // Necesario para URLs de blob y servidor local
          />
        ) : (
          placeholder ?? (
            <div className="w-full h-full flex items-center justify-center bg-surface-container text-outline">
              <span className="material-symbols-outlined text-[32px]">add_a_photo</span>
            </div>
          )
        )}

        {/* Overlay al hacer hover */}
        <div className={cn(
          'absolute inset-0 flex flex-col items-center justify-center gap-1',
          'bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity',
          shapeClass,
        )}>
          {uploading ? (
            <span className="material-symbols-outlined text-white text-[24px] animate-spin">
              progress_activity
            </span>
          ) : (
            <>
              <span className="material-symbols-outlined text-white text-[22px]">photo_camera</span>
              <span className="text-white text-[11px] font-bold">{label}</span>
            </>
          )}
        </div>
      </button>

      {/* Error */}
      {error && (
        <p className="mt-1.5 text-[11px] text-error font-semibold">{error}</p>
      )}
    </div>
  )
}
