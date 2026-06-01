import { notFound, redirect } from 'next/navigation'
import { auth } from '@clerk/nextjs/server'
import { Settings } from 'lucide-react'
import { prisma } from '@/lib/prisma'
import { getTenantSlug } from '@/lib/tenant'
import { getCurrentUser, getUserRoleInCommunity } from '@/lib/clerk'
import { ProfileForm } from './ProfileForm'

export default async function SettingsPage() {
  const { userId } = await auth()

  if (!userId) {
    redirect('/sign-in')
  }

  const slug = await getTenantSlug()
  if (!slug) {
    notFound()
  }

  const community = await prisma.community.findFirst({
    where: { slug },
    select: { id: true },
  })

  if (!community) {
    notFound()
  }

  const user = await getCurrentUser()
  if (!user) {
    notFound()
  }

  const userRole = await getUserRoleInCommunity(user.id, community.id)
  if (!userRole || !['COMMUNITY_ADMIN', 'COMMITTEE_MEMBER', 'CONCIERGE', 'SUPER_ADMIN'].includes(userRole)) {
    redirect('/')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Settings className="h-8 w-8 text-slate-600" />
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Configuración</h1>
          <p className="text-sm text-slate-500 mt-1">Gestiona tu perfil y preferencias</p>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-slate-900">Mi Perfil</h2>
          <p className="text-sm text-slate-500 mt-1">Actualiza tu información personal</p>
        </div>
        <ProfileForm user={user} />
      </div>
    </div>
  )
}
