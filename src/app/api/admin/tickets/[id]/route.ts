// PATCH: Actualizar ticket admin (merge JSON metadata en aiSummary)
// DELETE: Soft-delete (cambiar a CLOSED)
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { getTenantSlug } from '@/lib/tenant'
import { getCurrentUser, getUserRoleInCommunity } from '@/lib/clerk'
import { UpdateAdminTicketSchema } from '@/types/adminTickets'
import { serializeAdminMeta, parseAdminMeta, getStatusLabel } from '@/lib/adminTaskMappings'
import { AdminTicketMeta } from '@/lib/adminTaskMappings'

type TicketStatus = 'NEW' | 'IN_PROGRESS' | 'IN_REVIEW' | 'RESOLVED' | 'CLOSED'

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

    const { id } = await props.params
    const body = await request.json()
    const parsed = UpdateAdminTicketSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error }, { status: 400 })
    }

    // Obtener ticket actual
    const currentTicket = await prisma.ticket.findUnique({
      where: { id },
      select: {
        status: true,
        source: true,
        aiSummary: true,
      },
    })

    if (!currentTicket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
    }

    // Verificar que es un ticket MANUAL (admin)
    if (currentTicket.source !== 'MANUAL') {
      return NextResponse.json({ error: 'Forbidden - not an admin ticket' }, { status: 403 })
    }

    // Preparar update data
    const updateData: any = {}

    // Copiar campos simples
    if (parsed.data.title !== undefined) updateData.title = parsed.data.title
    if (parsed.data.description !== undefined) updateData.description = parsed.data.description
    if (parsed.data.category !== undefined) updateData.category = parsed.data.category
    if (parsed.data.priority !== undefined) updateData.priority = parsed.data.priority
    if (parsed.data.status !== undefined) updateData.status = parsed.data.status
    if (parsed.data.assignedToUserId !== undefined) updateData.assignedToUserId = parsed.data.assignedToUserId

    // Merge metadata JSON en aiSummary
    const currentMeta = parseAdminMeta(currentTicket.aiSummary) || { isAdminTask: true }
    const newMeta: AdminTicketMeta = {
      isAdminTask: true,
      startDate: parsed.data.startDate !== undefined ? parsed.data.startDate : currentMeta.startDate,
      externalCompany: parsed.data.externalCompany !== undefined ? parsed.data.externalCompany : currentMeta.externalCompany,
      followerUserId: parsed.data.followerUserId !== undefined ? parsed.data.followerUserId : currentMeta.followerUserId,
      followerExternal: parsed.data.followerExternal !== undefined ? parsed.data.followerExternal : currentMeta.followerExternal,
      assignedExternal: parsed.data.assignedExternal !== undefined ? parsed.data.assignedExternal : currentMeta.assignedExternal,
    }

    updateData.aiSummary = serializeAdminMeta(newMeta)

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
        const statusLabel = getStatusLabel(parsed.data.status as TicketStatus)
        await tx.ticketMessage.create({
          data: {
            ticketId: id,
            senderType: 'SYSTEM',
            content: `Estado actualizado a: ${statusLabel}`,
            isInternal: true,
            attachments: [],
          },
        })
      }

      return updatedTicket
    })

    console.log(`[TICKET] Admin ${user.id} updated task #${id}`)

    return NextResponse.json({ ticket: result })
  } catch (error) {
    console.error('Error updating admin ticket:', error)
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

    const userRole = await getUserRoleInCommunity(user.id, community.id)
    if (!userRole || !['COMMUNITY_ADMIN', 'SUPER_ADMIN'].includes(userRole)) {
      return NextResponse.json({ error: 'Forbidden - requires COMMUNITY_ADMIN or SUPER_ADMIN' }, { status: 403 })
    }

    const { id } = await props.params

    // Verificar que es un ticket MANUAL
    const ticket = await prisma.ticket.findUnique({
      where: { id },
      select: { source: true },
    })

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
    }

    if (ticket.source !== 'MANUAL') {
      return NextResponse.json({ error: 'Forbidden - not an admin ticket' }, { status: 403 })
    }

    // Soft delete: cambiar a CLOSED
    await prisma.ticket.update({
      where: { id },
      data: {
        status: 'CLOSED',
        closedAt: new Date(),
      },
    })

    console.log(`[TICKET] Admin ${user.id} deleted task #${id}`)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting admin ticket:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
