import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getTenantSlug } from '@/lib/tenant'
import { prisma } from '@/lib/prisma'

// GET: List all concierges for the current community
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const communitySlug = await getTenantSlug()
    if (!communitySlug) {
      return NextResponse.json({ error: 'No community selected' }, { status: 400 })
    }

    // Get the community
    const community = await prisma.community.findUnique({
      where: { slug: communitySlug },
    })

    if (!community) {
      return NextResponse.json({ error: 'Community not found' }, { status: 404 })
    }

    // Get concierges (users with CONCIERGE role in this community)
    const concierges = await prisma.communityMember.findMany({
      where: {
        communityId: community.id,
        role: 'CONCIERGE',
        isActive: true,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            phone: true,
            avatarUrl: true,
          },
        },
      },
    })

    // Get schedules for each concierge
    const conciergesWithSchedules = await Promise.all(
      concierges.map(async (member: any) => {
        const schedules = await prisma.conciergeSchedule.findMany({
          where: {
            userId: member.userId,
            communityId: community.id,
            isActive: true,
          },
          select: {
            id: true,
            dayOfWeek: true,
            startTime: true,
            endTime: true,
            endsNextDay: true,
          },
        })

        return {
          id: member.userId,
          name: member.user.name,
          phone: member.user.phone,
          avatarUrl: member.user.avatarUrl,
          schedules,
        }
      })
    )

    return NextResponse.json({ concierges: conciergesWithSchedules })
  } catch (error) {
    console.error('GET /api/concierge error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST: Create a new concierge
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const communitySlug = await getTenantSlug()
    if (!communitySlug) {
      return NextResponse.json({ error: 'No community selected' }, { status: 400 })
    }

    // Get the community
    const community = await prisma.community.findUnique({
      where: { slug: communitySlug },
    })

    if (!community) {
      return NextResponse.json({ error: 'Community not found' }, { status: 404 })
    }

    // Verify user is admin in this community
    const userRole = await prisma.communityMember.findFirst({
      where: {
        communityId: community.id,
        user: { clerkId: userId },
        isActive: true,
        role: { in: ['COMMUNITY_ADMIN', 'SUPER_ADMIN'] },
      },
    })

    if (!userRole) {
      return NextResponse.json({ error: 'Not authorized to create concierges' }, { status: 403 })
    }

    const body = await request.json()
    const { name, phone, avatarUrl, schedules } = body

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    if (!schedules || !Array.isArray(schedules) || schedules.length === 0) {
      return NextResponse.json({ error: 'At least one schedule is required' }, { status: 400 })
    }

    // Create user for concierge (with special clerkId prefix)
    const randomId = Math.random().toString(36).substring(2, 12)
    const conciergeClerkId = `concierge_${randomId}`

    const result = await prisma.$transaction(async (tx: any) => {
      // Create user
      const conciergeUser = await tx.user.create({
        data: {
          clerkId: conciergeClerkId,
          name,
          phone: phone || null,
          avatarUrl: avatarUrl || null,
          email: `${conciergeClerkId}@concierge.local`,
        },
      })

      // Add as community member with CONCIERGE role
      await tx.communityMember.create({
        data: {
          userId: conciergeUser.id,
          communityId: community.id,
          role: 'CONCIERGE',
          isActive: true,
        },
      })

      // Create schedules
      for (const schedule of schedules) {
        await tx.conciergeSchedule.create({
          data: {
            userId: conciergeUser.id,
            communityId: community.id,
            dayOfWeek: schedule.dayOfWeek,
            startTime: schedule.startTime,
            endTime: schedule.endTime,
            endsNextDay: schedule.endsNextDay || false,
            isActive: true,
          },
        })
      }

      return conciergeUser
    })

    return NextResponse.json({
      concierge: {
        id: result.id,
        name: result.name,
        phone: result.phone,
        avatarUrl: result.avatarUrl,
      },
    })
  } catch (error) {
    console.error('POST /api/concierge error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
