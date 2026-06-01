// Layout del portal de residentes
// - Lee el tenant desde proxy header (via lib/tenant.ts con React cache)
// - Aplica primaryColor del tenant como CSS custom property
// - Sidebar en desktop, bottom nav en mobile
import { Suspense } from 'react'
import { requireTenant } from '@/lib/tenant'
import { ResidentSidebar } from '@/components/layout/ResidentSidebar'
import { MobileBottomNav } from '@/components/layout/MobileBottomNav'

async function ResidentLayoutContent({
  children,
}: {
  children: React.ReactNode
}) {
  // requireTenant usa React cache(), por lo que no genera una query extra
  // si getTenant() ya fue llamado más arriba en el árbol
  const tenant = await requireTenant()

  // Color primario del tenant — fallback al azul por defecto del schema
  const primaryColor = tenant.primaryColor ?? '#2563EB'

  return (
    <>
      {/* Inyectar primaryColor como CSS variable a nivel de este layout */}
      <style>{`:root { --community-primary: ${primaryColor}; }`}</style>

      <div className="flex min-h-screen bg-slate-50">
        {/* Sidebar — solo visible en desktop (md+) */}
        <aside className="hidden md:flex md:flex-col md:w-64 md:fixed md:inset-y-0">
          <Suspense fallback={<div className="w-64 h-full bg-white animate-pulse" />}>
            <ResidentSidebar tenant={tenant} />
          </Suspense>
        </aside>

        {/* Contenido principal — margen izquierdo en desktop para el sidebar */}
        <main className="flex-1 md:ml-64 pb-16 md:pb-0">
          {/* Header con nombre de comunidad — mobile */}
          <header className="md:hidden sticky top-0 z-10 bg-white border-b border-slate-200 px-4 py-3">
            <div className="flex items-center gap-2">
              {tenant.logoUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={tenant.logoUrl}
                  alt={tenant.name}
                  className="h-7 w-auto object-contain"
                />
              )}
              <span className="font-semibold text-slate-800 truncate">{tenant.name}</span>
            </div>
          </header>

          {/* Contenido de la página */}
          <div className="p-4 md:p-6 lg:p-8">
            {children}
          </div>
        </main>

        {/* Bottom navigation — solo mobile */}
        <div className="md:hidden fixed bottom-0 inset-x-0 z-20">
          <MobileBottomNav />
        </div>
      </div>
    </>
  )
}

export default function ResidentLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen bg-slate-50">
          <div className="w-64 hidden md:block bg-white animate-pulse" />
          <main className="flex-1 p-8">
            <div className="h-8 bg-slate-300 rounded animate-pulse mb-4" />
            <div className="h-64 bg-slate-300 rounded animate-pulse" />
          </main>
        </div>
      }
    >
      <ResidentLayoutContent>{children}</ResidentLayoutContent>
    </Suspense>
  )
}
