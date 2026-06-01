// ResidentSidebar — Sidebar para el portal del residente
'use client'

import Link from 'next/link'
import {
  Home,
  Ticket,
  Bell,
  FileText,
  Wrench,
  User,
  LogOut,
} from 'lucide-react'
import { useClerk } from '@clerk/nextjs'
import { NavLink } from './NavLink'
import type { TenantInfo } from '@/types'

interface ResidentSidebarProps {
  tenant: TenantInfo
}

export function ResidentSidebar({ tenant }: ResidentSidebarProps) {
  const { signOut } = useClerk()

  const navItems = [
    { href: '/', icon: '🏠', label: 'Inicio' },
    { href: '/tickets', icon: '📋', label: 'Mis Requerimientos' },
    { href: '/announcements', icon: '📢', label: 'Comunicados' },
    { href: '/documents', icon: '📁', label: 'Documentos' },
    { href: '/improvements', icon: '🔧', label: 'Mejoras' },
    { href: '/my-unit', icon: '👤', label: 'Mi Unidad' },
  ]

  return (
    <div className="w-64 h-full bg-white border-r border-slate-200 flex flex-col">
      {/* Logo y nombre de comunidad */}
      <div className="p-4 border-b border-slate-200">
        <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          {tenant.logoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={tenant.logoUrl}
              alt={tenant.name}
              className="h-8 w-auto object-contain"
            />
          )}
          <span className="font-semibold text-sm text-slate-800 truncate">
            {tenant.name}
          </span>
        </Link>
      </div>

      {/* Navegación principal */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.href}
            href={item.href}
            icon={item.icon}
            label={item.label}
            variant="resident"
          />
        ))}
      </nav>

      {/* Footer con logout */}
      <div className="p-4 border-t border-slate-200">
        <button
          onClick={() => signOut()}
          className="w-full flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-red-50 hover:text-red-600 transition-colors"
        >
          <LogOut className="h-4 w-4" />
          <span>Cerrar sesión</span>
        </button>
      </div>
    </div>
  )
}
