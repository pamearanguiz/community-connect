import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/clerk'

// GET: List all communities the user is a member of
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const communities = await prisma.communityMember.findMany({
      where: {
        userId: user.id,
        isActive: true,
      },
      include: {
        community: {
          select: {
            id: true,
            slug: true,
            name: true,
            logoUrl: true,
            plan: true,
            _count: {
              select: {
                members: true,
                units: true,
              },
            },
          },
        },
      },
    })

    return NextResponse.json({
      communities: communities.map((cm: any) => ({
        ...cm.community,
        role: cm.role,
      })),
    })
  } catch (error) {
    console.error('GET /api/communities error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST: Create a new community
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, slug, address, city, region, adminEmail, primaryColor } = body

    // Validate required fields
    if (!name || !slug || !address || !city || !region || !adminEmail) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check if slug is unique
    const existingCommunity = await prisma.community.findUnique({
      where: { slug },
    })
    if (existingCommunity) {
      return NextResponse.json(
        { error: 'Community slug already exists' },
        { status: 409 }
      )
    }

    // Create community and add user as admin in a transaction
    const result = await prisma.$transaction(async (tx: any) => {
      // Create community
      const community = await tx.community.create({
        data: {
          slug,
          name,
          address,
          city,
          region,
          adminEmail,
          primaryColor: primaryColor || '#2563EB',
          isActive: true,
        },
      })

      // Add user as COMMUNITY_ADMIN
      await tx.communityMember.create({
        data: {
          userId: user.id,
          communityId: community.id,
          role: 'COMMUNITY_ADMIN',
          isActive: true,
        },
      })

      return community
    })

    return NextResponse.json({
      community: {
        id: result.id,
        slug: result.slug,
        name: result.name,
      },
    })
  } catch (error) {
    console.error('POST /api/communities error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
