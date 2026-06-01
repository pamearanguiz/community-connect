// GET: Retorna miembros de la comunidad con roles admin/comité para dropdowns
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { getTenantSlug } from '@/lib/tenant'
import { getCurrentUser, getUserRoleInCommunity } from '@/lib/clerk'

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const slug = await getTenantSlug()
    if (!slug) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
    }

    const community = await prisma.community.findFirst({
      where: { slug },
      select: { id: true },
    })

    if (!community) {
      return NextResponse.json({ error: 'Community not found' }, { status: 404 })
    }

    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const userRole = await getUserRoleInCommunity(user.id, community.id)
    if (!userRole || !['COMMUNITY_ADMIN', 'COMMITTEE_MEMBER', 'CONCIERGE', 'SUPER_ADMIN'].includes(userRole)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Obtener miembros de la comunidad con roles admin/comité
    const members = await prisma.communityMember.findMany({
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
        role: true,
      },
      orderBy: {
        user: {
          name: 'asc',
        },
      },
    })

    // Mapear a estructura simple para el dropdown
    const adminMembers = members.map((m: any) => ({
      id: m.user.id,
      name: m.user.name || m.user.email,
      email: m.user.email,
      avatarUrl: m.user.avatarUrl,
      role: m.role,
    }))

    return NextResponse.json({ members: adminMembers })
  } catch (error) {
    console.error('Error fetching admin members:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
