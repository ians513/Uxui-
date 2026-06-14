'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { cn } from '@/lib/utils'

interface BackButtonProps {
  href?: string          // if provided, Link to that path instead of router.back()
  label?: string
  className?: string
}

/**
 * Consistent back-navigation button.
 * Matches the visual style used in /student/ver/[userId]/page.tsx.
 */
export function BackButton({ href, label = 'Volver', className }: BackButtonProps) {
  const router = useRouter()

  const inner = (
    <span className={cn(
      'inline-flex items-center gap-1.5 text-sm font-semibold text-on-surface-variant',
      'hover:text-on-surface transition-colors',
      className,
    )}>
      <span className="material-symbols-outlined text-[18px]">arrow_back</span>
      {label}
    </span>
  )

  if (href) return <Link href={href}>{inner}</Link>

  return (
    <button type="button" onClick={() => router.back()}>
      {inner}
    </button>
  )
}
