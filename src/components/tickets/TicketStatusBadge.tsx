'use client'

import {
  Clock,
  Eye,
  Wrench,
  MessageSquare,
  CheckCircle,
  XCircle,
  type LucideIcon,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'

type TicketStatus = 'NEW' | 'IN_REVIEW' | 'IN_PROGRESS' | 'WAITING_RESIDENT' | 'RESOLVED' | 'CLOSED'

interface StatusConfig {
  label: string
  variant: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning'
  icon: LucideIcon
}

const STATUS_CONFIG: Record<TicketStatus, StatusConfig> = {
  NEW: {
    label: 'Nuevo',
    variant: 'outline',
    icon: Clock,
  },
  IN_REVIEW: {
    label: 'En Revisión',
    variant: 'default',
    icon: Eye,
  },
  IN_PROGRESS: {
    label: 'En Progreso',
    variant: 'warning',
    icon: Wrench,
  },
  WAITING_RESIDENT: {
    label: 'Esperando respuesta',
    variant: 'default',
    icon: MessageSquare,
  },
  RESOLVED: {
    label: 'Resuelto',
    variant: 'success',
    icon: CheckCircle,
  },
  CLOSED: {
    label: 'Cerrado',
    variant: 'outline',
    icon: XCircle,
  },
}

export function TicketStatusBadge({ status }: { status: TicketStatus }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.NEW
  const Icon = config.icon

  return (
    <Badge variant={config.variant} className="gap-1">
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  )
}
