'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Plus, Search } from 'lucide-react'
import { Ticket, TicketCategory, TicketPriority, TicketStatus } from '@prisma/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { AdminTaskCard } from '@/components/tickets/AdminTaskCard'
import { ADMIN_STATUS_OPTIONS, ADMIN_TASK_TYPE_OPTIONS, ADMIN_PRIORITY_OPTIONS } from '@/lib/adminTaskMappings'

type TicketResponse = Ticket & {
  assignedTo?: { name: string } | null
  _count?: { messages: number }
}

interface AdminMember {
  id: string
  name: string
  email: string
  avatarUrl?: string
}

interface KPICard {
  label: string
  value: number
}

export default function AdminTicketsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [tickets, setTickets] = useState<TicketResponse[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const status = searchParams.get('status') || ''
  const category = searchParams.get('category') || ''
  const priority = searchParams.get('priority') || ''
  const search = searchParams.get('search') || ''

  // Cargar tickets
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        const params = new URLSearchParams()
        params.append('source', 'MANUAL')
        if (status) params.append('status', status)
        if (category) params.append('category', category)
        if (priority) params.append('priority', priority)
        if (search) params.append('search', search)

        const ticketsRes = await fetch(`/api/admin/tickets?${params}`)
        if (ticketsRes.ok) {
          const data = await ticketsRes.json()
          setTickets(data.tickets || [])
        }
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [status, category, priority, search])

  // Calcular KPIs
  const kpis: KPICard[] = [
    {
      label: 'Aún no inicia',
      value: tickets.filter((t) => t.status === 'NEW').length,
    },
    {
      label: 'En curso',
      value: tickets.filter((t) => t.status === 'IN_PROGRESS').length,
    },
    {
      label: 'En revisión',
      value: tickets.filter((t) => t.status === 'IN_REVIEW').length,
    },
    {
      label: 'Finalizadas',
      value: tickets.filter((t) => t.status === 'RESOLVED').length,
    },
  ]

  // Actualizar query params
  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    router.push(`?${params.toString()}`)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Gestión de Tareas</h1>
          <p className="text-slate-600 mt-1">Crea y administra las tareas de tu comunidad.</p>
        </div>
        <Button onClick={() => router.push('/admin/tickets/new')} className="gap-2">
          <Plus className="h-4 w-4" />
          Nueva Tarea
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="bg-white rounded-lg border border-slate-200 p-4">
            <p className="text-sm text-slate-600 font-medium">{kpi.label}</p>
            <p className="text-3xl font-bold text-slate-900 mt-1">{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg border border-slate-200 p-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
          {/* Búsqueda */}
          <div className="flex-1 min-w-0">
            <label className="text-sm font-medium block mb-2">Buscar</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Buscar por título o número..."
                value={search}
                onChange={(e) => updateFilter('search', e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Filtro estado */}
          <div className="w-full sm:w-48">
            <label className="text-sm font-medium block mb-2">Estado</label>
            <Select value={status} onChange={(e) => updateFilter('status', e.target.value)}>
              <option value="">Todos</option>
              {ADMIN_STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </Select>
          </div>

          {/* Filtro tipo */}
          <div className="w-full sm:w-48">
            <label className="text-sm font-medium block mb-2">Tipo</label>
            <Select value={category} onChange={(e) => updateFilter('category', e.target.value)}>
              <option value="">Todos</option>
              {ADMIN_TASK_TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </Select>
          </div>

          {/* Filtro prioridad */}
          <div className="w-full sm:w-48">
            <label className="text-sm font-medium block mb-2">Prioridad</label>
            <Select value={priority} onChange={(e) => updateFilter('priority', e.target.value)}>
              <option value="">Todas</option>
              {ADMIN_PRIORITY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </Select>
          </div>
        </div>
      </div>

      {/* Lista de tareas */}
      {isLoading ? (
        <div className="bg-white rounded-lg border border-slate-200 p-12 text-center">
          <p className="text-slate-600">Cargando tareas...</p>
        </div>
      ) : tickets.length === 0 ? (
        <div className="bg-white rounded-lg border border-slate-200 p-12 text-center">
          <p className="text-slate-600">No hay tareas que coincidan con los filtros.</p>
          <Button onClick={() => router.push('/admin/tickets/new')} variant="outline" className="mt-4 gap-2">
            <Plus className="h-4 w-4" />
            Crear primera tarea
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {tickets.map((ticket) => (
            <AdminTaskCard key={ticket.id} ticket={ticket} />
          ))}
        </div>
      )}
    </div>
  )
}
