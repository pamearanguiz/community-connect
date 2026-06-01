import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { auth } from '@clerk/nextjs/server'
import { CommunitySelectorScreen } from '@/components/admin/CommunitySelectorScreen'

async function CommunitySelectorContent() {
  const { userId } = await auth()

  if (!userId) {
    redirect('/sign-in')
  }

  // Obtener comunidades del usuario
  const response = await fetch('http://localhost:3000/api/communities', {
    headers: {
      Cookie: `__Secure-authjs.session-token=${(await auth())}`,
    },
    cache: 'no-store',
  }).catch(() => null)

  if (!response || !response.ok) {
    // Si falla la API, redirigir al dashboard default
    redirect('/admin/dashboard?slug=default')
  }

  const data = (await response.json()) as any
  const communities = data.communities || []

  // Si no tiene comunidades, redirigir a crear
  if (communities.length === 0) {
    redirect('/admin/communities')
  }

  // Si tiene una sola comunidad, entrar directo
  if (communities.length === 1) {
    redirect(`/admin/dashboard?slug=${communities[0].slug}`)
  }

  // Si tiene varias, mostrar selector
  return <CommunitySelectorScreen communities={communities} />
}

export default function AdminPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
          <div className="animate-pulse space-y-8 max-w-4xl w-full px-4">
            <div className="h-12 bg-slate-700 rounded w-96 mx-auto" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-64 bg-slate-700 rounded-2xl" />
              ))}
            </div>
          </div>
        </div>
      }
    >
      <CommunitySelectorContent />
    </Suspense>
  )
}
