import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: Request) {
  const { userId } = await auth()

  if (!userId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

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

  const members = await prisma.communityMember.findMany({
    where: {
      communityId: community.id,
      isActive: true,
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
    orderBy: {
      user: {
        name: 'asc',
      },
    },
  })

  return Response.json(members)
}
