// GET: Listar tickets creados por admin (source: MANUAL)
// POST: Crear nuevo ticket admin (sin clasificación IA, con metadatos JSON en aiSummary)
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { getTenantSlug } from '@/lib/tenant'
import { getCurrentUser, getUserRoleInCommunity } from '@/lib/clerk'
import { CreateAdminTicketSchema } from '@/types/adminTickets'
import { serializeAdminMeta } from '@/lib/adminTaskMappings'
import { AdminTicketMeta } from '@/lib/adminTaskMappings'

type TicketStatus = 'NEW' | 'IN_REVIEW' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED'

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

    // Query parameters
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') as TicketStatus | null
    const category = searchParams.get('category')
    const priority = searchParams.get('priority')
    const search = searchParams.get('search')
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    const limit = Math.min(50, parseInt(searchParams.get('limit') || '10', 10))

    // Construir where clause — solo tickets MANUAL (creados por admin)
    const where: any = {
      communityId: community.id,
      source: 'MANUAL',
    }

    if (status) {
      where.status = status
    }
    if (category) {
      where.category = category
    }
    if (priority) {
      where.priority = priority
    }
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { ticketNumber: { contains: search, mode: 'insensitive' } },
      ]
    }

    // Contar total
    const total = await prisma.ticket.count({ where })

    // Fetch tickets con relaciones
    const tickets = await prisma.ticket.findMany({
      where,
      select: {
        id: true,
        ticketNumber: true,
        title: true,
        description: true,
        status: true,
        priority: true,
        category: true,
        aiSummary: true,
        aiClassified: true,
        createdAt: true,
        updatedAt: true,
        createdBy: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
        assignedTo: {
          select: {
            id: true,
            name: true,
          },
        },
        unit: {
          select: {
            id: true,
            number: true,
            tower: true,
          },
        },
        _count: {
          select: { messages: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    })

    const totalPages = Math.ceil(total / limit)

    return NextResponse.json({
      tickets,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    })
  } catch (error) {
    console.error('Error fetching admin tickets:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
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

    // Validar body con zod
    const body = await request.json()
    const parsed = CreateAdminTicketSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error }, { status: 400 })
    }

    const {
      title,
      description,
      category,
      priority = 'MEDIUM',
      status = 'NEW',
      assignedToUserId,
      assignedExternal,
      followerUserId,
      followerExternal,
      externalCompany,
      startDate,
    } = parsed.data

    // Crear metadata JSON para aiSummary
    const adminMeta: AdminTicketMeta = {
      isAdminTask: true,
      startDate,
      externalCompany,
      followerUserId,
      followerExternal,
      assignedExternal,
    }

    // Ejecutar en transacción
    const result = await prisma.$transaction(async (tx: any) => {
      // Generar ticketNumber atómico
      const year = new Date().getFullYear()
      const count = await tx.ticket.count({ where: { communityId: community.id } })
      const ticketNumber = `TK-${year}-${String(count + 1).padStart(4, '0')}`

      // Crear ticket
      const ticket = await tx.ticket.create({
        data: {
          ticketNumber,
          title,
          description,
          status,
          category,
          priority,
          aiClassified: false,
          aiSummary: serializeAdminMeta(adminMeta),
          source: 'MANUAL',
          communityId: community.id,
          createdByUserId: user.id,
          assignedToUserId: assignedToUserId || null,
        },
      })

      // Crear mensaje de sistema
      const statusLabel = status === 'NEW' ? 'Aún no inicia' : status === 'IN_PROGRESS' ? 'En curso' : status
      await tx.ticketMessage.create({
        data: {
          ticketId: ticket.id,
          senderType: 'SYSTEM',
          content: `Tarea #${ticketNumber} creada. Estado inicial: ${statusLabel}`,
          isInternal: true,
          attachments: [],
        },
      })

      return ticket
    })

    console.log(`[TICKET] Admin ${user.id} created task #${result.ticketNumber} - ${result.title}`)

    // Fetch ticket con mensajes
    const ticketWithMessages = await prisma.ticket.findUnique({
      where: { id: result.id },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
          select: {
            id: true,
            content: true,
            senderType: true,
            isInternal: true,
            createdAt: true,
          },
        },
        assignedTo: {
          select: { id: true, name: true },
        },
      },
    })

    return NextResponse.json({ ticket: ticketWithMessages }, { status: 201 })
  } catch (error) {
    console.error('Error creating admin ticket:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
