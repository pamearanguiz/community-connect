// MobileBottomNav — Navegación inferior para dispositivos móviles
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

interface MobileBottomNavProps {
  variant?: 'resident' | 'admin'
}

export function MobileBottomNav({ variant = 'resident' }: MobileBottomNavProps) {
  const pathname = usePathname()

  const residentItems = [
    { href: '/', icon: '🏠', label: 'Inicio' },
    { href: '/tickets', icon: '📋', label: 'Tickets' },
    { href: '/announcements', icon: '📢', label: 'Avisos' },
    { href: '/my-unit', icon: '👤', label: 'Unidad' },
  ]

  const adminItems = [
    { href: '/dashboard', icon: '📊', label: 'Dashboard' },
    { href: '/tickets', icon: '📋', label: 'Tickets' },
    { href: '/residents', icon: '👥', label: 'Residentes' },
    { href: '/settings', icon: '⚙️', label: 'Ajustes' },
  ]

  const items = variant === 'admin' ? adminItems : residentItems

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

  return (
    <div className="bg-white border-t border-slate-200 flex items-center justify-around">
      {items.map((item) => {
        const active = isActive(item.href)
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex flex-col items-center gap-1 py-2 px-3 text-xs font-medium transition-colors',
              active
                ? variant === 'admin'
                  ? 'text-slate-800'
                  : 'text-blue-600'
                : 'text-slate-500',
            )}
          >
            <span className="text-xl">{item.icon}</span>
            <span className="hidden xs:inline">{item.label}</span>
          </Link>
        )
      })}
    </div>
  )
}
