// Tipos y schemas para el feature de tickets admin

import { z } from 'zod'
import { Ticket, User, TicketMessage } from '@prisma/client'
import { AdminTicketMeta } from '@/lib/adminTaskMappings'

// Schema para crear un nuevo ticket admin
export const CreateAdminTicketSchema = z.object({
  title: z.string().min(5, 'El título debe tener al menos 5 caracteres').max(100),
  description: z.string().min(10, 'La descripción debe tener al menos 10 caracteres').max(1000),
  category: z.enum(['MAINTENANCE', 'ADMINISTRATIVE', 'SECURITY', 'COMMON_EXPENSES', 'OTHER']),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
  status: z.enum(['NEW', 'IN_PROGRESS', 'IN_REVIEW', 'RESOLVED', 'CLOSED']),
  assignedToUserId: z.string().optional(),
  assignedExternal: z.string().optional(),
  followerUserId: z.string().optional(),
  followerExternal: z.string().optional(),
  externalCompany: z.string().optional(),
  startDate: z.string().optional(), // ISO 8601
}).strict()

export type CreateAdminTicketInput = z.infer<typeof CreateAdminTicketSchema>

// Schema para actualizar un ticket admin
export const UpdateAdminTicketSchema = CreateAdminTicketSchema.partial()

export type UpdateAdminTicketInput = z.infer<typeof UpdateAdminTicketSchema>

// Tipo de ticket admin con metadatos parseados
export interface AdminTicketWithRelations extends Ticket {
  createdBy: User | null
  assignedTo: User | null
  messages: TicketMessage[]
  adminMeta: AdminTicketMeta | null // metadatos parseados desde aiSummary
}

// Tipo para el detalle del ticket con metadata parseada (para la UI)
export interface AdminTicketDetail extends AdminTicketWithRelations {
  unit?: { number: string; tower: string | null } | null
}

// Request body para PATCH
export interface UpdateAdminTicketRequest {
  title?: string
  description?: string
  category?: string
  priority?: string
  status?: string
  assignedToUserId?: string | null
  assignedExternal?: string
  followerUserId?: string | null
  followerExternal?: string
  externalCompany?: string
  startDate?: string
}

// Tipo para miembro admin en dropdowns
export interface AdminMember {
  id: string
  name: string
  email: string
  avatarUrl?: string
  role?: string
}
