import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser, getUserRoleInCommunity } from '@/lib/clerk'

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth()

  if (!userId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const slug = req.headers.get('x-community-slug')

  if (!slug) {
    return Response.json({ error: 'Community slug required' }, { status: 400 })
  }

  const community = await prisma.community.findFirst({
    where: { slug },
    select: { id: true },
  })

  if (!community) {
    return Response.json({ error: 'Community not found' }, { status: 404 })
  }

  const currentUser = await getCurrentUser()
  if (!currentUser) {
    return Response.json({ error: 'User not found' }, { status: 404 })
  }

  const currentUserRole = await getUserRoleInCommunity(currentUser.id, community.id)
  if (!currentUserRole || !['COMMUNITY_ADMIN', 'COMMITTEE_MEMBER', 'CONCIERGE', 'SUPER_ADMIN'].includes(currentUserRole)) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  const { role, isActive, name, phone } = body

  if (role) {
    if (currentUserRole !== 'COMMUNITY_ADMIN' && currentUserRole !== 'SUPER_ADMIN') {
      return Response.json({ error: 'Only admins can change user roles' }, { status: 403 })
    }

    const targetMember = await prisma.communityMember.findUnique({
      where: {
        userId_communityId: {
          userId: id,
          communityId: community.id,
        },
      },
    })

    if (!targetMember) {
      return Response.json({ error: 'User not found in community' }, { status: 404 })
    }

    await prisma.communityMember.update({
      where: {
        userId_communityId: {
          userId: id,
          communityId: community.id,
        },
      },
      data: {
        role,
        ...(isActive !== undefined && { isActive }),
      },
    })
  } else {
    if (id !== currentUser.id && currentUserRole !== 'COMMUNITY_ADMIN' && currentUserRole !== 'SUPER_ADMIN') {
      return Response.json({ error: 'You can only edit your own profile' }, { status: 403 })
    }

    await prisma.user.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(phone && { phone }),
      },
    })

    if (isActive !== undefined) {
      await prisma.communityMember.updateMany({
        where: {
          userId: id,
          communityId: community.id,
        },
        data: {
          isActive,
        },
      })
    }
  }

  const updatedMember = await prisma.communityMember.findUnique({
    where: {
      userId_communityId: {
        userId: id,
        communityId: community.id,
      },
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          avatarUrl: true,
          createdAt: true,
        },
      },
    },
  })

  return Response.json(updatedMember)
}
