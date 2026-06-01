// AdminSidebar — Sidebar para el panel de administración
'use client'

import Link from 'next/link'
import { LogOut } from 'lucide-react'
import { useClerk } from '@clerk/nextjs'
import { NavLink } from './NavLink'
import type { TenantInfo } from '@/types'

type Role = 'COMMUNITY_ADMIN' | 'COMMITTEE_MEMBER' | 'CONCIERGE' | 'SUPER_ADMIN' | 'RESIDENT'

interface AdminSidebarProps {
  tenant: TenantInfo
  userRole: Role
}

export function AdminSidebar({ tenant, userRole }: AdminSidebarProps) {
  const { signOut } = useClerk()

  const adminNavItems = [
    {
      section: 'GESTIÓN',
      items: [
        { href: '/admin/dashboard', icon: '📊', label: 'Dashboard' },
        { href: '/admin/tickets', icon: '📋', label: 'Tickets', badge: '3' },
        { href: '/admin/residents', icon: '👥', label: 'Residentes' },
        { href: '/admin/units', icon: '🏢', label: 'Unidades' },
        { href: '/admin/concierge', icon: '🔑', label: 'Conserjes' },
      ],
    },
    {
      section: 'CONTENIDO',
      items: [
        { href: '/admin/announcements', icon: '📢', label: 'Comunicados' },
        { href: '/admin/documents', icon: '📄', label: 'Documentos' },
        { href: '/admin/improvements', icon: '🔧', label: 'Mejoras' },
      ],
    },
    {
      section: 'CONFIGURACIÓN',
      items: [
        { href: '/admin/settings', icon: '⚙️', label: 'Configuración' },
      ],
    },
  ]

  return (
    <div className="w-72 h-full bg-slate-800 text-white flex flex-col">
      {/* Encabezado con info de comunidad */}
      <div className="p-4 border-b border-slate-700">
        <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          {tenant.logoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={tenant.logoUrl}
              alt={tenant.name}
              className="h-8 w-auto object-contain invert"
            />
          )}
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm truncate">{tenant.name}</p>
            <p className="text-xs text-slate-400 capitalize">{userRole.toLowerCase()}</p>
          </div>
        </Link>
      </div>

      {/* Navegación por secciones */}
      <nav className="flex-1 p-4 space-y-6 overflow-y-auto">
        {adminNavItems.map((section) => (
          <div key={section.section}>
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2 px-4">
              {section.section}
            </h3>
            <div className="space-y-1">
              {section.items.map((item) => (
                <div key={item.href} className="relative">
                  <NavLink
                    href={item.href}
                    icon={item.icon}
                    label={item.label}
                    variant="admin"
                  />
                  {item.badge && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                      {item.badge}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer con logout */}
      <div className="p-4 border-t border-slate-700">
        <button
          onClick={() => signOut()}
          className="w-full flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium text-slate-300 hover:bg-slate-700 transition-colors"
        >
          <LogOut className="h-4 w-4" />
          <span>Cerrar sesión</span>
        </button>
      </div>
    </div>
  )
}
