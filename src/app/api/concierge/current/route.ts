import { NextResponse } from 'next/server'
import { getTenantSlug } from '@/lib/tenant'
import { prisma } from '@/lib/prisma'

const DAY_NAMES = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']

function getCurrentDayOfWeek(): string {
  const day = new Date().getDay()
  return DAY_NAMES[day]
}

function getCurrentTime(): string {
  const now = new Date()
  const hours = String(now.getHours()).padStart(2, '0')
  const minutes = String(now.getMinutes()).padStart(2, '0')
  return `${hours}:${minutes}`
}

function isTimeInRange(currentTime: string, startTime: string, endTime: string, endsNextDay: boolean): boolean {
  if (endsNextDay) {
    // Shift crosses midnight: active if currentTime >= startTime OR currentTime <= endTime
    return currentTime >= startTime || currentTime <= endTime
  } else {
    // Normal shift: active if startTime <= currentTime <= endTime
    return currentTime >= startTime && currentTime <= endTime
  }
}

// GET: Get the concierge currently on duty
export async function GET() {
  try {
    const communitySlug = await getTenantSlug()
    if (!communitySlug) {
      return NextResponse.json({ concierge: null })
    }

    const community = await prisma.community.findUnique({
      where: { slug: communitySlug },
    })

    if (!community) {
      return NextResponse.json({ concierge: null })
    }

    const currentDay = getCurrentDayOfWeek()
    const currentTime = getCurrentTime()

    // Find schedules for today
    const schedules = await prisma.conciergeSchedule.findMany({
      where: {
        communityId: community.id,
        dayOfWeek: currentDay,
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

    // Find which concierge is on duty now
    for (const schedule of schedules) {
      if (isTimeInRange(currentTime, schedule.startTime, schedule.endTime, schedule.endsNextDay)) {
        return NextResponse.json({
          concierge: {
            name: schedule.user.name,
            phone: schedule.user.phone,
            avatarUrl: schedule.user.avatarUrl,
          },
        })
      }
    }

    // No concierge on duty
    return NextResponse.json({ concierge: null })
  } catch (error) {
    console.error('GET /api/concierge/current error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
