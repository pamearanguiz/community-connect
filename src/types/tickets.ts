import { z } from 'zod'

// Enums (inline — sin importar de @prisma/client aún)
export type TicketStatus = 'NEW' | 'IN_REVIEW' | 'IN_PROGRESS' | 'WAITING_RESIDENT' | 'RESOLVED' | 'CLOSED'
export type TicketCategory = 'MAINTENANCE' | 'NOISE' | 'WATER_LEAK' | 'PARKING' | 'PACKAGE' | 'COMMON_EXPENSES' | 'SECURITY' | 'ADMINISTRATIVE' | 'OTHER'
export type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
export type TicketSource = 'WEB' | 'WHATSAPP' | 'APP' | 'MANUAL'
export type SenderType = 'RESIDENT' | 'ADMIN' | 'AI' | 'SYSTEM'

// Ticket base
export type Ticket = {
  id: string
  ticketNumber: string
  title: string
  description: string
  status: TicketStatus
  priority: TicketPriority
  category: TicketCategory
  source: TicketSource
  aiClassified: boolean
  aiSummary: string | null
  resolvedAt: Date | null
  closedAt: Date | null
  createdAt: Date
  updatedAt: Date
  communityId: string
  unitId: string | null
  createdByUserId: string
  assignedToUserId: string | null
}

// Ticket con relaciones (para listas)
export type TicketWithRelations = {
  id: string
  ticketNumber: string
  title: string
  description: string
  status: TicketStatus
  priority: TicketPriority
  category: TicketCategory
  aiClassified: boolean
  aiSummary: string | null
  createdAt: Date
  updatedAt: Date
  createdBy: { id: string; name: string; avatarUrl?: string | null }
  assignedTo: { id: string; name: string } | null
  unit: { id: string; number: string; tower?: string | null } | null
  _count: { messages: number }
}

// Mensaje de ticket
export type TicketMessage = {
  id: string
  ticketId: string
  senderId: string | null
  content: string
  isInternal: boolean
  senderType: SenderType
  attachments: string[]
  createdAt: Date
  sender?: { id: string; name: string; avatarUrl?: string | null } | null
}

// Ticket con todos los mensajes
export type TicketWithMessages = Ticket & {
  messages: TicketMessage[]
  createdBy: { id: string; name: string; avatarUrl?: string | null }
  assignedTo: { id: string; name: string } | null
}

// Zod schema para crear ticket
export const CreateTicketSchema = z.object({
  title: z.string().min(5, 'El título debe tener al menos 5 caracteres').max(100, 'El título no puede exceder 100 caracteres'),
  description: z.string().min(20, 'La descripción debe tener al menos 20 caracteres').max(1000, 'La descripción no puede exceder 1000 caracteres'),
  category: z.enum(['MAINTENANCE', 'NOISE', 'WATER_LEAK', 'PARKING', 'PACKAGE', 'COMMON_EXPENSES', 'SECURITY', 'ADMINISTRATIVE', 'OTHER'] as const).optional(),
  unitId: z.string().optional(),
})

export type CreateTicketInput = z.infer<typeof CreateTicketSchema>

// Respuesta de la clasificación IA
export interface TicketClassificationResult {
  category: TicketCategory
  priority: TicketPriority
  aiSummary: string        // Máx 100 chars, tercera persona
  suggestedResponse: string // 2-3 oraciones, empático
}
