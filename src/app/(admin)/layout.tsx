// Layout del panel de administración
// - Protección adicional: solo COMMUNITY_ADMIN, COMMITTEE_MEMBER, CONCIERGE
// - Sidebar más completo con secciones y estadísticas resumidas
// - Mismo patrón responsive: sidebar desktop, bottom nav mobile
import { Suspense } from 'react'
import { headers } from 'next/headers'
import { auth } from '@clerk/nextjs/server'
import { requireTenant } from '@/lib/tenant'
import { prisma } from '@/lib/prisma'
import { AdminSidebar } from '@/components/layout/AdminSidebar'
import { MobileBottomNav } from '@/components/layout/MobileBottomNav'
// Roles con acceso al panel admin
const ADMIN_ROLES = [
  'COMMUNITY_ADMIN',
  'COMMITTEE_MEMBER',
  'CONCIERGE',
  'SUPER_ADMIN',
]

async function AdminLayoutContent({
  children,
  isSelector = false,
}: {
  children: React.ReactNode
  isSelector?: boolean
}) {
  // Para la página de selector (/admin), no requerimos tenant
  if (isSelector) {
    const { userId } = await auth()
    if (!userId) {
      const { redirect } = await import('next/navigation')
      redirect('/sign-in')
    }
    // Renderizar selector sin sidebar ni layout admin
    return <>{children}</>
  }

  const tenant = await requireTenant()

  // Verificar rol del usuario dentro de esta comunidad
  const { userId } = await auth()
  if (!userId) {
    const { redirect } = await import('next/navigation')
    redirect('/sign-in')
  }

  // Buscar usuario en BD y verificar que tenga rol admin en esta comunidad
  const member = await prisma.communityMember.findFirst({
    where: {
      community: { slug: tenant.slug },
      user: { clerkId: userId },
      isActive: true,
      role: { in: ADMIN_ROLES },
    },
    select: { role: true },
  })

  if (!member) {
    // Redirigir al portal de residente si no tiene rol admin
    const { redirect } = await import('next/navigation')
    redirect('/')
  }

  const primaryColor = tenant.primaryColor ?? '#2563EB'

  return (
    <>
      <style>{`:root { --community-primary: ${primaryColor}; }`}</style>

      <div className="flex min-h-screen bg-slate-100">
        {/* Sidebar admin — más ancho que el de residente (80) */}
        <aside className="hidden md:flex md:flex-col md:w-72 md:fixed md:inset-y-0">
          <Suspense
            fallback={<div className="w-72 h-full bg-slate-800 animate-pulse" />}
          >
            <AdminSidebar tenant={tenant} userRole={member.role} />
          </Suspense>
        </aside>

        {/* Contenido principal */}
        <main className="flex-1 md:ml-72 pb-16 md:pb-0">
          {/* Header admin — mobile */}
          <header className="md:hidden sticky top-0 z-10 bg-slate-800 text-white px-4 py-3">
            <div className="flex items-center justify-between">
              <span className="font-semibold truncate">{tenant.name} — Admin</span>
            </div>
          </header>

          <div className="p-4 md:p-6 lg:p-8">
            {children}
          </div>
        </main>

        {/* Bottom nav admin — mobile */}
        <div className="md:hidden fixed bottom-0 inset-x-0 z-20">
          <MobileBottomNav variant="admin" />
        </div>
      </div>
    </>
  )
}

async function AdminLayoutWrapper({
  children,
}: {
  children: React.ReactNode
}) {
  // Detectar si estamos en la página selector (/admin) o en subrutas
  // Si no hay x-community-slug header, estamos en el selector
  const headerList = await headers()
  const communitySlug = headerList.get('x-community-slug')
  const isSelector = !communitySlug

  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen bg-slate-100">
          <div className="w-72 hidden md:block bg-slate-800 animate-pulse" />
          <main className="flex-1 p-8">
            <div className="h-8 bg-slate-300 rounded animate-pulse mb-4" />
            <div className="h-64 bg-slate-300 rounded animate-pulse" />
          </main>
        </div>
      }
    >
      <AdminLayoutContent isSelector={isSelector}>{children}</AdminLayoutContent>
    </Suspense>
  )
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen bg-slate-100">
          <div className="w-72 hidden md:block bg-slate-800 animate-pulse" />
          <main className="flex-1 p-8">
            <div className="h-8 bg-slate-300 rounded animate-pulse mb-4" />
            <div className="h-64 bg-slate-300 rounded animate-pulse" />
          </main>
        </div>
      }
    >
      <AdminLayoutWrapper>{children}</AdminLayoutWrapper>
    </Suspense>
  )
}
