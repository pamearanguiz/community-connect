// Mapeo de campos UI admin ↔ enum Prisma para tickets

import { TicketCategory, TicketPriority, TicketStatus } from '@prisma/client'

// Opciones de tipo de tarea para el formulario admin
export const ADMIN_TASK_TYPE_OPTIONS = [
  { value: 'MAINTENANCE' as const, label: 'Reparación' },
  { value: 'ADMINISTRATIVE' as const, label: 'Mejora / Trámite' },
  { value: 'SECURITY' as const, label: 'Seguridad' },
  { value: 'COMMON_EXPENSES' as const, label: 'Gastos Comunes' },
  { value: 'OTHER' as const, label: 'Otro' },
] as const

// Opciones de estado para el formulario admin
export const ADMIN_STATUS_OPTIONS = [
  { value: 'NEW' as const, label: 'Aún no inicia' },
  { value: 'IN_PROGRESS' as const, label: 'En curso' },
  { value: 'IN_REVIEW' as const, label: 'En revisión' },
  { value: 'RESOLVED' as const, label: 'Finalizado' },
  { value: 'CLOSED' as const, label: 'Cerrado' },
] as const

// Opciones de prioridad (igual para admin y residentes)
export const ADMIN_PRIORITY_OPTIONS = [
  { value: 'LOW' as const, label: 'Baja' },
  { value: 'MEDIUM' as const, label: 'Media' },
  { value: 'HIGH' as const, label: 'Alta' },
  { value: 'URGENT' as const, label: 'Urgente' },
] as const

// Metadatos JSON serializados en aiSummary para tareas admin
export interface AdminTicketMeta {
  isAdminTask: true
  startDate?: string // ISO 8601: "2024-06-15"
  externalCompany?: string // "Empresa Constructora X"
  followerUserId?: string // userId del sistema (persona que hace seguimiento)
  followerExternal?: string // nombre texto libre (seguimiento externo)
  assignedExternal?: string // nombre texto libre (encargado externo adicional)
  photoPlaceholders?: number // cuántas fotos "indicadas" (0-5)
}

// Parser: deserializar aiSummary JSON → AdminTicketMeta
export function parseAdminMeta(aiSummary: string | null): AdminTicketMeta | null {
  if (!aiSummary) return null
  try {
    const parsed = JSON.parse(aiSummary)
    if (parsed && parsed.isAdminTask === true) {
      return parsed as AdminTicketMeta
    }
  } catch {
    // Si no es JSON válido, ignorar
  }
  return null
}

// Serializer: AdminTicketMeta → JSON string para aiSummary
export function serializeAdminMeta(meta: AdminTicketMeta): string {
  return JSON.stringify(meta)
}

// Helper para obtener la etiqueta de tipo de tarea en UI
export function getTaskTypeLabel(category: TicketCategory): string {
  const option = ADMIN_TASK_TYPE_OPTIONS.find((opt) => opt.value === category)
  return option?.label ?? category
}

// Helper para obtener la etiqueta de estado en UI
export function getStatusLabel(status: TicketStatus): string {
  const option = ADMIN_STATUS_OPTIONS.find((opt) => opt.value === status)
  return option?.label ?? status
}

// Helper para obtener la etiqueta de prioridad en UI
export function getPriorityLabel(priority: TicketPriority): string {
  const option = ADMIN_PRIORITY_OPTIONS.find((opt) => opt.value === priority)
  return option?.label ?? priority
}

// Emojis por categoría (para cards)
export const CATEGORY_EMOJIS: Record<TicketCategory, string> = {
  MAINTENANCE: '🔧',
  NOISE: '🔊',
  WATER_LEAK: '💧',
  PARKING: '🅿️',
  PACKAGE: '📦',
  COMMON_EXPENSES: '💰',
  SECURITY: '🔒',
  ADMINISTRATIVE: '📋',
  OTHER: '📝',
}
