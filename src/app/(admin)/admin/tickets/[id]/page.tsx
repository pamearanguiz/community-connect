import { notFound, redirect } from 'next/navigation'
import { auth } from '@clerk/nextjs/server'
import { headers } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { getTenantSlug } from '@/lib/tenant'
import { getCurrentUser, getUserRoleInCommunity } from '@/lib/clerk'
import { parseAdminMeta } from '@/lib/adminTaskMappings'
import { AdminTicketDetailClient } from './AdminTicketDetailClient'

export default async function AdminTicketDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
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

  // Obtener ticket
  const ticket = await prisma.ticket.findUnique({
    where: { id },
    include: {
      messages: {
        orderBy: { createdAt: 'asc' },
        select: {
          id: true,
          content: true,
          senderType: true,
          isInternal: true,
          attachments: true,
          createdAt: true,
          sender: {
            select: {
              id: true,
              name: true,
              avatarUrl: true,
            },
          },
        },
      },
      createdBy: {
        select: { id: true, name: true, avatarUrl: true },
      },
      assignedTo: {
        select: { id: true, name: true },
      },
      unit: {
        select: { id: true, number: true, tower: true },
      },
    },
  })

  if (!ticket) {
    notFound()
  }

  // Verificar que es un ticket MANUAL
  if (ticket.source !== 'MANUAL') {
    notFound()
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

  const adminMeta = parseAdminMeta(ticket.aiSummary)

  return (
    <AdminTicketDetailClient
      ticket={{
        ...ticket,
        adminMeta,
      }}
      adminMembers={adminMembers.map((m: any) => ({
        id: m.user.id,
        name: m.user.name || m.user.email,
        email: m.user.email,
        avatarUrl: m.user.avatarUrl,
      }))}
      userRole={userRole}
      currentUserId={user.id}
    />
  )
}
