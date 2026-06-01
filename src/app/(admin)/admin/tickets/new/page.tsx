import { notFound, redirect } from 'next/navigation'
import { auth } from '@clerk/nextjs/server'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { prisma } from '@/lib/prisma'
import { getTenantSlug } from '@/lib/tenant'
import { getCurrentUser, getUserRoleInCommunity } from '@/lib/clerk'
import { AdminTicketForm } from '@/components/tickets/AdminTicketForm'

export default async function CreateAdminTicketPage() {
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

  // Obtener miembros admin para dropdowns
  const adminMembers = await prisma.communityMember.findMany({
    where: {
      communityId: community.id,
      isActive: true,
      role: {
        in: ['COMMUNITY_ADMIN', 'COMMITTEE_MEMBER', 'CONCIERGE', 'SUPER_ADMIN'],
      },
    },
    select: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          avatarUrl: true,
        },
      },
    },
    orderBy: {
      user: {
        name: 'asc',
      },
    },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/tickets">
          <Button variant="outline"  className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Volver
          </Button>
        </Link>
        <h1 className="text-3xl font-bold text-slate-900">Nueva Tarea</h1>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <AdminTicketForm
          adminMembers={adminMembers.map((m: any) => ({
            id: m.user.id,
            name: m.user.name || m.user.email,
            email: m.user.email,
            avatarUrl: m.user.avatarUrl,
          }))}
        />
      </div>
    </div>
  )
}
