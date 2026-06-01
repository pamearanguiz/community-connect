// GET: Listar mensajes de un ticket
// POST: Crear nuevo mensaje en un ticket
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { getTenantSlug } from '@/lib/tenant'
import { getCurrentUser, getUserRoleInCommunity } from '@/lib/clerk'
import { z } from 'zod'

const CreateMessageSchema = z.object({
  content: z.string().min(1).max(5000),
  isInternal: z.boolean().optional().default(false),
})

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

    // Obtener ticket
    const ticket = await prisma.ticket.findUnique({
      where: { id },
      select: { createdByUserId: true, communityId: true },
    })

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
    }

    // Obtener usuario actual
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Verificar permisos: dueño o admin
    if (ticket.createdByUserId !== user.id) {
      const role = await getUserRoleInCommunity(user.id, ticket.communityId)
      if (!role || role === 'RESIDENT') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    // Obtener mensajes
    const messages = await prisma.ticketMessage.findMany({
      where: { ticketId: id },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        content: true,
        senderType: true,
        isInternal: true,
        attachments: true,
        createdAt: true,
      },
    })

    return NextResponse.json({ messages })
  } catch (error) {
    console.error('Error fetching messages:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  props: any,
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await props.params
    const body = await request.json()

    const parsed = CreateMessageSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error }, { status: 400 })
    }

    // Obtener ticket
    const ticket = await prisma.ticket.findUnique({
      where: { id },
      select: { createdByUserId: true, status: true, communityId: true },
    })

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
    }

    // Obtener usuario actual
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Determinar tipo de remitente (RESIDENT o ADMIN)
    let senderType: 'RESIDENT' | 'ADMIN' = 'RESIDENT'
    const role = await getUserRoleInCommunity(user.id, ticket.communityId)

    if (role && role !== 'RESIDENT') {
      senderType = 'ADMIN'
    }

    // Si es mensaje interno y el usuario es residente → 403
    if (parsed.data.isInternal && senderType === 'RESIDENT') {
      return NextResponse.json({ error: 'Forbidden - internal messages only for admins' }, { status: 403 })
    }

    // Crear mensaje en transacción
    const result = await prisma.$transaction(async (tx: any) => {
      // Crear mensaje
      const message = await tx.ticketMessage.create({
        data: {
          ticketId: id,
          senderId: user.id,
          content: parsed.data.content,
          isInternal: parsed.data.isInternal,
          senderType,
          attachments: [],
        },
      })

      // Si es residente respondiendo y ticket en WAITING_RESIDENT → cambiar a IN_REVIEW
      if (senderType === 'RESIDENT' && ticket.status === 'WAITING_RESIDENT') {
        await tx.ticket.update({
          where: { id },
          data: { status: 'IN_REVIEW' },
        })
      }

      // Actualizar updatedAt del ticket
      await tx.ticket.update({
        where: { id },
        data: { updatedAt: new Date() },
      })

      return message
    })

    return NextResponse.json({ message: result }, { status: 201 })
  } catch (error) {
    console.error('Error creating message:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
