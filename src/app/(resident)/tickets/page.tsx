'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { TicketCard } from '@/components/tickets/TicketCard'
import { Loader2, Plus } from 'lucide-react'
import { toast } from 'sonner'

type Ticket = {
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

export default function TicketsPage() {
  const router = useRouter()
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        const response = await fetch('/api/tickets')
        if (!response.ok) {
          throw new Error('Error al cargar los tickets')
        }
        const data = await response.json()
        setTickets(data.tickets || [])
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Error al cargar los tickets')
      } finally {
        setLoading(false)
      }
    }

    fetchTickets()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Mis Requerimientos</h1>
          <p className="text-slate-600 mt-1">Gestiona tus tickets y requerimientos aquí.</p>
        </div>
        <Button onClick={() => router.push('/tickets/new')} size="lg">
          <Plus className="w-4 h-4 mr-2" />
          Nuevo
        </Button>
      </div>

      {/* Lista de tickets */}
      {tickets.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-slate-600 mb-4">No tienes requerimientos aún</p>
          <Button onClick={() => router.push('/tickets/new')}>Crear uno</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tickets.map((ticket) => (
            <TicketCard key={ticket.id} ticket={ticket} />
          ))}
        </div>
      )}
    </div>
  )
}
