// GET, PATCH, DELETE un ticket específico
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { getTenantSlug } from '@/lib/tenant'
import { getCurrentUser, getUserRoleInCommunity } from '@/lib/clerk'
import { z } from 'zod'

type TicketStatus = 'NEW' | 'IN_REVIEW' | 'IN_PROGRESS' | 'WAITING_RESIDENT' | 'RESOLVED' | 'CLOSED'

const UpdateTicketSchema = z.object({
  status: z.enum(['NEW', 'IN_REVIEW', 'IN_PROGRESS', 'WAITING_RESIDENT', 'RESOLVED', 'CLOSED'] as const).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT'] as const).optional(),
  assignedToUserId: z.string().optional(),
  category: z.enum(['MAINTENANCE', 'NOISE', 'WATER_LEAK', 'PARKING', 'PACKAGE', 'COMMON_EXPENSES', 'SECURITY', 'ADMINISTRATIVE', 'OTHER'] as const).optional(),
})

const STATUS_LABELS: Record<TicketStatus, string> = {
  NEW: 'Nuevo',
  IN_REVIEW: 'En Revisión',
  IN_PROGRESS: 'En Progreso',
  WAITING_RESIDENT: 'Esperando tu respuesta',
  RESOLVED: 'Resuelto',
  CLOSED: 'Cerrado',
}

export async function GET(
  request: NextRequest,
  props: any,
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await props.params

    // Obtener ticket con todos los mensajes
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
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
    }

    // Obtener usuario actual
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Si es residente, verificar que es dueño del ticket
    if (ticket.createdByUserId !== user.id) {
      const slug = await getTenantSlug()
      if (slug) {
        const community = await prisma.community.findFirst({ where: { slug }, select: { id: true } })
        if (community) {
          const role = await getUserRoleInCommunity(user.id, community.id)
          // Si no es admin y no es dueño → 403
          if (!role || role === 'RESIDENT') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
          }
        }
      }
    }

    return NextResponse.json({ ticket })
  } catch (error) {
    console.error('Error fetching ticket:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  props: any,
) {
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

    // Verificar que es admin
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const role = await getUserRoleInCommunity(user.id, community.id)
    if (!role || role === 'RESIDENT') {
      return NextResponse.json({ error: 'Forbidden - admin only' }, { status: 403 })
    }

    const { id } = await props.params
    const body = await request.json()
    const parsed = UpdateTicketSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error }, { status: 400 })
    }

    // Obtener ticket actual para comparar status
    const currentTicket = await prisma.ticket.findUnique({
      where: { id },
      select: { status: true, createdByUserId: true },
    })

    if (!currentTicket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
    }

    // Preparar update data
    const updateData: any = { ...parsed.data }

    // Agregar timestamps si cambia el status
    if (parsed.data.status && parsed.data.status !== currentTicket.status) {
      if (parsed.data.status === 'RESOLVED') {
        updateData.resolvedAt = new Date()
      } else if (parsed.data.status === 'CLOSED') {
        updateData.closedAt = new Date()
      }
    }

    // Actualizar en transacción
    const result = await prisma.$transaction(async (tx: any) => {
      const updatedTicket = await tx.ticket.update({
        where: { id },
        data: updateData,
      })

      // Si cambió el status, crear mensaje de sistema
      if (parsed.data.status && parsed.data.status !== currentTicket.status) {
        const statusLabel = STATUS_LABELS[parsed.data.status as TicketStatus]
        await tx.ticketMessage.create({
          data: {
            ticketId: id,
            senderType: 'SYSTEM',
            content: `Estado actualizado a: ${statusLabel}`,
            isInternal: false,
            attachments: [],
          },
        })
      }

      return updatedTicket
    })

    // Notificar residente (placeholder)
    console.log(`[NOTIFY] Residente ${currentTicket.createdByUserId}: ticket #${id} actualizado`)

    return NextResponse.json({ ticket: result })
  } catch (error) {
    console.error('Error updating ticket:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  props: any,
) {
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

    const role = await getUserRoleInCommunity(user.id, community.id)
    if (!role || !['COMMUNITY_ADMIN', 'SUPER_ADMIN'].includes(role)) {
      return NextResponse.json({ error: 'Forbidden - admin only' }, { status: 403 })
    }

    const { id } = await props.params

    // Soft delete: cambiar a CLOSED
    await prisma.ticket.update({
      where: { id },
      data: {
        status: 'CLOSED',
        closedAt: new Date(),
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting ticket:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
