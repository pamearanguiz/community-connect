import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import { MessageCircle } from 'lucide-react'
import { TicketStatusBadge } from './TicketStatusBadge'
import { TicketPriorityBadge } from './TicketPriorityBadge'
import { getTaskTypeLabel, CATEGORY_EMOJIS, parseAdminMeta } from '@/lib/adminTaskMappings'
import { Ticket } from '@prisma/client'

interface AdminTaskCardProps {
  ticket: Ticket & {
    assignedTo?: { name: string } | null
    _count?: { messages: number }
    aiSummary?: string | null
  }
}

export function AdminTaskCard({ ticket }: AdminTaskCardProps) {
  const adminMeta = parseAdminMeta(ticket.aiSummary)

  return (
    <Link href={`/admin/tickets/${ticket.id}`}>
      <div className="block bg-white rounded-lg border border-slate-200 p-4 hover:shadow-md hover:border-slate-300 transition-all">
        <div className="flex items-start gap-4">
          {/* Icono de categoría */}
          <div className="text-2xl flex-shrink-0">
            {CATEGORY_EMOJIS[ticket.category] || '📋'}
          </div>

          {/* Contenido principal */}
          <div className="flex-1 min-w-0">
            {/* Número y título */}
            <div className="mb-2">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                {ticket.ticketNumber}
              </p>
              <h3 className="font-semibold text-slate-900 truncate">{ticket.title}</h3>
            </div>

            {/* Meta información */}
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 mb-3">
              {/* Tipo de tarea */}
              <span className="px-2 py-1 bg-slate-100 rounded-full">
                {getTaskTypeLabel(ticket.category)}
              </span>

              {/* Encargado si existe */}
              {ticket.assignedTo && (
                <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded-full">
                  {ticket.assignedTo.name}
                </span>
              )}

              {/* Empresa externa si existe */}
              {adminMeta?.externalCompany && (
                <span className="px-2 py-1 bg-amber-50 text-amber-700 rounded-full">
                  {adminMeta.externalCompany}
                </span>
              )}

              {/* Fecha de inicio si existe */}
              {adminMeta?.startDate && (
                <span className="text-slate-500">
                  Inicio: {new Date(adminMeta.startDate).toLocaleDateString('es-CL')}
                </span>
              )}
            </div>

            {/* Badges de estado y prioridad */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TicketStatusBadge status={ticket.status as any} />
                <TicketPriorityBadge priority={ticket.priority as any} />
              </div>

              {/* Contador de mensajes y tiempo actualizado */}
              <div className="flex items-center gap-4 text-xs text-slate-400">
                {ticket._count?.messages ? (
                  <div className="flex items-center gap-1">
                    <MessageCircle className="h-4 w-4" />
                    <span>{ticket._count.messages}</span>
                  </div>
                ) : null}
                <span>{formatDistanceToNow(new Date(ticket.updatedAt), { locale: es, addSuffix: true })}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}
