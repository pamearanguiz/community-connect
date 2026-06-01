'use client'

import { AlertCircle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'

const PRIORITY_CONFIG: Record<TicketPriority, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' }> = {
  LOW: {
    label: 'Baja',
    variant: 'outline',
  },
  MEDIUM: {
    label: 'Media',
    variant: 'default',
  },
  HIGH: {
    label: 'Alta',
    variant: 'warning',
  },
  URGENT: {
    label: 'Urgente',
    variant: 'destructive',
  },
}

export function TicketPriorityBadge({ priority }: { priority: TicketPriority }) {
  const config = PRIORITY_CONFIG[priority] || PRIORITY_CONFIG.MEDIUM

  return (
    <Badge variant={config.variant} className={priority === 'URGENT' ? 'animate-pulse' : ''}>
      {priority === 'URGENT' && <AlertCircle className="h-3 w-3 mr-1" />}
      {config.label}
    </Badge>
  )
}
