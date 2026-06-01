// GET: Listar tickets con filtros y paginación
// POST: Crear nuevo ticket con clasificación IA automática
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { headers } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { getTenantSlug } from '@/lib/tenant'
import { getCurrentUser, getUserRoleInCommunity } from '@/lib/clerk'
import { clasificarTicket } from '@/lib/claude'
import { CreateTicketSchema } from '@/types/tickets'

type TicketStatus = 'NEW' | 'IN_REVIEW' | 'IN_PROGRESS' | 'WAITING_RESIDENT' | 'RESOLVED' | 'CLOSED'

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

    // Obtener comunidad
    const community = await prisma.community.findFirst({
      where: { slug },
      select: { id: true },
    })

    if (!community) {
      return NextResponse.json({ error: 'Community not found' }, { status: 404 })
    }

    const communityId = community.id

    // Obtener usuario actual
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Obtener rol del usuario en la comunidad
    const userRole = await getUserRoleInCommunity(user.id, communityId)

    // Query parameters
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') as TicketStatus | null
    const category = searchParams.get('category')
    const priority = searchParams.get('priority')
    const search = searchParams.get('search')
    const source = searchParams.get('source')
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    const limit = Math.min(50, parseInt(searchParams.get('limit') || '10', 10))

    // Construir where clause
    const where: any = {
      communityId,
    }

    // Si es residente, solo ver sus propios tickets
    if (userRole === 'RESIDENT') {
      where.createdByUserId = user.id
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
    if (source) {
      where.source = source
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
    console.error('Error fetching tickets:', error)
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

    // Obtener comunidad
    const community = await prisma.community.findFirst({
      where: { slug },
      select: { id: true },
    })

    if (!community) {
      return NextResponse.json({ error: 'Community not found' }, { status: 404 })
    }

    const communityId = community.id

    // Obtener usuario actual
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Validar body con zod
    const body = await request.json()
    const parsed = CreateTicketSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error }, { status: 400 })
    }

    const { title, description, category, unitId } = parsed.data

    // Ejecutar en transacción
    const result = await prisma.$transaction(async (tx: any) => {
      // Generar ticketNumber atómico
      const year = new Date().getFullYear()
      const count = await tx.ticket.count({ where: { communityId } })
      const ticketNumber = `TK-${year}-${String(count + 1).padStart(4, '0')}`

      // Clasificar con IA si no viene categoría
      let classification = null
      let aiClassified = false

      if (!category) {
        classification = await clasificarTicket(title, description)
        aiClassified = true
      }

      // Crear ticket
      const ticket = await tx.ticket.create({
        data: {
          ticketNumber,
          title,
          description,
          status: 'NEW',
          category: category || classification?.category || 'OTHER',
          priority: classification?.priority || 'MEDIUM',
          aiClassified,
          aiSummary: classification?.aiSummary || null,
          source: 'WEB',
          communityId,
          unitId: unitId || null,
          createdByUserId: user.id,
        },
      })

      // Crear mensaje de sistema
      await tx.ticketMessage.create({
        data: {
          ticketId: ticket.id,
          senderType: 'SYSTEM',
          content: `Ticket #${ticketNumber} creado. Te notificaremos cuando la administración lo revise.`,
          isInternal: false,
          attachments: [],
        },
      })

      // Si fue clasificado por IA, crear mensaje con respuesta sugerida
      if (classification) {
        await tx.ticketMessage.create({
          data: {
            ticketId: ticket.id,
            senderType: 'AI',
            content: classification.suggestedResponse,
            isInternal: false,
            attachments: [],
          },
        })
      }

      return ticket
    })

    // Notificar a admins (placeholder)
    console.log(`[NOTIFY] Admin: nuevo ticket #${result.ticketNumber} - ${result.title}`)

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
      },
    })

    return NextResponse.json({ ticket: ticketWithMessages }, { status: 201 })
  } catch (error) {
    console.error('Error creating ticket:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
