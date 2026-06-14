'use client'

import { useState } from 'react'
import Image from 'next/image'
import { cn, getInitials } from '@/lib/utils'

type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'

interface AvatarProps {
  src?: string | null
  name: string
  size?: AvatarSize
  className?: string
  hasStory?: boolean
  storySeen?: boolean
  shape?: 'circle' | 'rounded'
}

const sizeMap: Record<AvatarSize, { px: number; text: string; ring: string }> = {
  'xs':  { px: 24,  text: 'text-[9px]',   ring: 'ring-[1.5px]' },
  'sm':  { px: 32,  text: 'text-[11px]',  ring: 'ring-2' },
  'md':  { px: 40,  text: 'text-sm',      ring: 'ring-2' },
  'lg':  { px: 56,  text: 'text-base',    ring: 'ring-2' },
  'xl':  { px: 80,  text: 'text-xl',      ring: 'ring-[3px]' },
  '2xl': { px: 112, text: 'text-2xl',     ring: 'ring-4' },
}

const sizeClass: Record<AvatarSize, string> = {
  'xs':  'w-6 h-6',
  'sm':  'w-8 h-8',
  'md':  'w-10 h-10',
  'lg':  'w-14 h-14',
  'xl':  'w-20 h-20',
  '2xl': 'w-28 h-28',
}

export function Avatar({
  src,
  name,
  size = 'md',
  className,
  hasStory = false,
  storySeen = false,
  shape = 'circle',
}: AvatarProps) {
  const [imageError, setImageError] = useState(false)
  
  const { px, text, ring } = sizeMap[size]
  const shapeClass = shape === 'circle' ? 'rounded-full' : 'rounded-xl'

  const wrapperClass = cn(
    sizeClass[size],
    'relative shrink-0 overflow-hidden',
    shapeClass,
    hasStory && [
      'p-0.5',
      ring,
      storySeen ? 'ring-outline-variant' : 'ring-primary',
    ],
    className,
  )

  if (src && !imageError) {
    return (
      <div className={wrapperClass}>
        <Image
          src={src}
          alt={name}
          width={px}
          height={px}
          className={cn('object-cover bg-surface-container-low w-full h-full', shapeClass)}
          onError={() => setImageError(true)}
        />
      </div>
    )
  }

  return (
    <div
      className={cn(
        wrapperClass,
        'bg-primary-container flex items-center justify-center',
      )}
    >
      <span className={cn('font-bold text-on-primary-container font-headline tracking-tighter select-none', text)}>
        {getInitials(name)}
      </span>
    </div>
  )
}
