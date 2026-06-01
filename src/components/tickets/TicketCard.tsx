'use client'

import { useRouter } from 'next/navigation'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import { MessageCircle } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { TicketStatusBadge } from './TicketStatusBadge'
import { TicketPriorityBadge } from './TicketPriorityBadge'

type TicketWithRelations = {
  id: string
  ticketNumber: string
  title: string
  description: string
  status: string
  priority: string
  category: string
  aiClassified: boolean
  createdAt: Date
  updatedAt: Date
  createdBy: { id: string; name: string; avatarUrl?: string | null }
  assignedTo: { id: string; name: string } | null
  unit: { id: string; number: string; tower?: string | null } | null
  _count: { messages: number }
}

const CATEGORY_EMOJIS: Record<string, string> = {
  MAINTENANCE: '🔧',
  NOISE: '🔊',
  WATER_LEAK: '💧',
  PARKING: '🚗',
  PACKAGE: '📦',
  COMMON_EXPENSES: '💰',
  SECURITY: '🔒',
  ADMINISTRATIVE: '📋',
  OTHER: '📌',
}

export function TicketCard({ ticket }: { ticket: TicketWithRelations }) {
  const router = useRouter()

  const handleClick = () => {
    router.push(`/tickets/${ticket.id}`)
  }

  const timeAgo = formatDistanceToNow(new Date(ticket.updatedAt), {
    addSuffix: true,
    locale: es,
  })

  return (
    <Card
      onClick={handleClick}
      className="cursor-pointer hover:shadow-md transition-shadow"
    >
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Encabezado con número y badges */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <p className="text-xs text-muted-foreground font-mono font-medium">
                {ticket.ticketNumber}
              </p>
              <h3 className="text-sm font-semibold line-clamp-1 text-foreground">
                {ticket.title}
              </h3>
            </div>
            <div className="flex gap-1 flex-shrink-0">
              <TicketStatusBadge status={ticket.status as any} />
              <TicketPriorityBadge priority={ticket.priority as any} />
            </div>
          </div>

          {/* Descripción truncada */}
          <p className="text-xs text-muted-foreground line-clamp-2">
            {ticket.description}
          </p>

          {/* Categoría */}
          <div className="flex items-center gap-1">
            <span className="text-sm">
              {CATEGORY_EMOJIS[ticket.category] || '📌'} {ticket.category}
            </span>
          </div>

          {/* Footer: tiempo, unidad, mensajes */}
          <div className="flex items-center justify-between pt-2 border-t border-border">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>{timeAgo}</span>
              {ticket.unit && (
                <>
                  <span>•</span>
                  <span>
                    Depto {ticket.unit.number}
                    {ticket.unit.tower && ` (${ticket.unit.tower})`}
                  </span>
                </>
              )}
            </div>

            {/* Indicador de mensajes */}
            {ticket._count.messages > 0 && (
              <div className="flex items-center gap-1 text-xs text-primary">
                <MessageCircle className="h-3 w-3" />
                <span>{ticket._count.messages}</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
