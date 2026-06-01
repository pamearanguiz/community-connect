// Root page — Landing para usuarios no autenticados, dashboard para autenticados
import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { auth } from '@clerk/nextjs/server'
import { LandingPageClient } from '@/components/LandingPageClient'

async function RootPageContent() {
  const { userId } = await auth()

  if (userId) {
    // Usuario autenticado → ir al dashboard del residente
    redirect('/dashboard')
  }

  // Usuario no autenticado → mostrar landing page
  return <LandingPageClient />
}

export default function RootPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
          <div className="animate-pulse space-y-4">
            <div className="h-12 bg-slate-300 rounded w-96" />
            <div className="h-6 bg-slate-300 rounded w-96" />
            <div className="h-32 bg-slate-300 rounded w-96" />
          </div>
        </div>
      }
    >
      <RootPageContent />
    </Suspense>
  )
}
