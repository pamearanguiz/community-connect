import { notFound, redirect } from 'next/navigation'
import { auth } from '@clerk/nextjs/server'
import { requireTenant } from '@/lib/tenant'
import { getCurrentUser, getUserRoleInCommunity } from '@/lib/clerk'
import { prisma } from '@/lib/prisma'
import { TicketMessageThread } from '@/components/tickets/TicketMessageThread'
import { TicketStatusBadge } from '@/components/tickets/TicketStatusBadge'
import { TicketPriorityBadge } from '@/components/tickets/TicketPriorityBadge'
import { formatDistance } from 'date-fns'
import { es } from 'date-fns/locale'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

type Props = {
  params: Promise<{ id: string }>
}

export default async function TicketDetailPage({ params }: Props) {
  const { id } = await params
  const tenant = await requireTenant()
  const { userId } = await auth()

  if (!userId) {
    redirect('/sign-in')
  }

  const user = await getCurrentUser()
  if (!user) {
    redirect('/sign-in')
  }

  // Get community ID
  const community = await prisma.community.findFirst({
    where: { slug: tenant.slug },
    select: { id: true },
  })

  if (!community) {
    return notFound()
  }

  // Get user role
  const userRole = await getUserRoleInCommunity(user.id, community.id)

  // Fetch ticket with messages
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
    return notFound()
  }

  // Permission check: residents can only see their own tickets, admins can see all
  if (userRole === 'RESIDENT' && ticket.createdByUserId !== user.id) {
    return notFound()
  }

  const isClosed = ticket.status === 'CLOSED'

  return (
    <div className="space-y-6">
      {/* Header con botón atrás */}
      <div className="flex items-center gap-3">
        <Link
          href="/tickets"
          className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-slate-900">{ticket.title}</h1>
          <p className="text-sm text-slate-500 mt-1">#{ticket.ticketNumber}</p>
        </div>
      </div>

      {/* Grid: Detalles + Thread */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Detalles (columna lateral) */}
        <div className="lg:col-span-1 space-y-4">
          {/* Estado y Prioridad */}
          <div className="bg-white rounded-lg border border-slate-200 p-4 space-y-3">
            <div>
              <p className="text-xs font-semibold text-slate-600 uppercase">Estado</p>
              <div className="mt-2">
                <TicketStatusBadge status={ticket.status} />
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-600 uppercase">Prioridad</p>
              <div className="mt-2">
                <TicketPriorityBadge priority={ticket.priority} />
              </div>
            </div>
          </div>

          {/* Información */}
          <div className="bg-white rounded-lg border border-slate-200 p-4 space-y-4">
            <div>
              <p className="text-xs font-semibold text-slate-600 uppercase mb-1">Categoría</p>
              <p className="text-sm font-medium text-slate-900">{ticket.category}</p>
            </div>
            {ticket.unit && (
              <div>
                <p className="text-xs font-semibold text-slate-600 uppercase mb-1">Unidad</p>
                <p className="text-sm font-medium text-slate-900">
                  {ticket.unit.number} {ticket.unit.tower && `Torre ${ticket.unit.tower}`}
                </p>
              </div>
            )}
            <div>
              <p className="text-xs font-semibold text-slate-600 uppercase mb-1">Reportado por</p>
              <p className="text-sm font-medium text-slate-900">{ticket.createdBy?.name}</p>
            </div>
            {ticket.assignedTo && (
              <div>
                <p className="text-xs font-semibold text-slate-600 uppercase mb-1">Asignado a</p>
                <p className="text-sm font-medium text-slate-900">{ticket.assignedTo.name}</p>
              </div>
            )}
            <div>
              <p className="text-xs font-semibold text-slate-600 uppercase mb-1">Creado hace</p>
              <p className="text-sm font-medium text-slate-900">
                {formatDistance(new Date(ticket.createdAt), new Date(), {
                  locale: es,
                  addSuffix: true,
                })}
              </p>
            </div>
            {ticket.resolvedAt && (
              <div>
                <p className="text-xs font-semibold text-slate-600 uppercase mb-1">Resuelto hace</p>
                <p className="text-sm font-medium text-slate-900">
                  {formatDistance(new Date(ticket.resolvedAt), new Date(), {
                    locale: es,
                    addSuffix: true,
                  })}
                </p>
              </div>
            )}
          </div>

          {/* Descripción */}
          {ticket.description && (
            <div className="bg-white rounded-lg border border-slate-200 p-4">
              <p className="text-xs font-semibold text-slate-600 uppercase mb-2">Descripción</p>
              <p className="text-sm text-slate-700 whitespace-pre-wrap">{ticket.description}</p>
            </div>
          )}

          {ticket.aiSummary && (
            <div className="bg-blue-50 rounded-lg border border-blue-200 p-4">
              <p className="text-xs font-semibold text-blue-900 uppercase mb-2 flex items-center gap-1">
                ✨ Análisis IA
              </p>
              <p className="text-sm text-blue-900">{ticket.aiSummary}</p>
            </div>
          )}
        </div>

        {/* Thread (columna principal) */}
        <div className="lg:col-span-2 bg-white rounded-lg border border-slate-200 overflow-hidden">
          <TicketMessageThread
            ticketId={ticket.id}
            initialMessages={ticket.messages}
            isClosed={isClosed}
            currentUserId={user.id}
            userRole={userRole}
          />
        </div>
      </div>
    </div>
  )
}
