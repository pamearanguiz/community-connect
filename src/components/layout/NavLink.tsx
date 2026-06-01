'use client'

// NavLink — componente cliente para mostrar estado activo en navegación
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface NavLinkProps {
  href: string
  icon?: ReactNode
  label: string
  isActive?: boolean
  variant?: 'resident' | 'admin'
  onClick?: () => void
}

export function NavLink({
  href,
  icon,
  label,
  variant = 'resident',
  onClick,
}: NavLinkProps) {
  const pathname = usePathname()
  const isActive = pathname.startsWith(href) && href !== '/'

  const baseStyles =
    'flex items-center gap-3 px-4 py-2 rounded-lg transition-colors text-sm font-medium'

  const variantStyles =
    variant === 'admin'
      ? cn(
          'text-slate-300 hover:bg-slate-700',
          isActive && 'bg-slate-700 text-white font-semibold',
        )
      : cn(
          'text-slate-600 hover:bg-slate-100',
          isActive && 'bg-blue-50 text-blue-600 font-semibold',
        )

  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(baseStyles, variantStyles)}
    >
      {icon && <span className="text-lg">{icon}</span>}
      <span className="flex-1">{label}</span>
      {isActive && <span className="text-xs">•</span>}
    </Link>
  )
}
