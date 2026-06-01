'use client'

import { useState, useCallback, useEffect } from 'react'
import { toast } from 'sonner'

interface UseTicketsOptions {
  status?: string
  category?: string
  priority?: string
  search?: string
  page?: number
  limit?: number
}

interface TicketsPaginationInfo {
  page: number
  limit: number
  total: number
  totalPages: number
}

export function useTickets(options: UseTicketsOptions = {}) {
  const [tickets, setTickets] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [pagination, setPagination] = useState<TicketsPaginationInfo>({
    page: options.page || 1,
    limit: options.limit || 10,
    total: 0,
    totalPages: 0,
  })

  const fetchTickets = useCallback(async (opts = options) => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams()
      if (opts.status) params.append('status', opts.status)
      if (opts.category) params.append('category', opts.category)
      if (opts.priority) params.append('priority', opts.priority)
      if (opts.search) params.append('search', opts.search)
      if (opts.page) params.append('page', String(opts.page))
      if (opts.limit) params.append('limit', String(opts.limit))

      const response = await fetch(`/api/tickets?${params.toString()}`)
      if (!response.ok) throw new Error('Failed to fetch tickets')

      const data = await response.json()
      setTickets(data.tickets || [])
      setPagination(data.pagination)
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error')
      setError(error)
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }, [options])

  useEffect(() => {
    fetchTickets()
  }, [])

  const createTicket = useCallback(async (data: any) => {
    try {
      const response = await fetch('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Error al crear el requerimiento')
      }

      const result = await response.json()
      toast.success('Requerimiento creado exitosamente')
      await fetchTickets()
      return result.ticket
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error')
      toast.error(error.message)
      throw error
    }
  }, [fetchTickets])

  const updateTicketStatus = useCallback(async (ticketId: string, status: string) => {
    try {
      const response = await fetch(`/api/tickets/${ticketId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Error al actualizar el requerimiento')
      }

      const result = await response.json()
      toast.success('Requerimiento actualizado')
      await fetchTickets()
      return result.ticket
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error')
      toast.error(error.message)
      throw error
    }
  }, [fetchTickets])

  const refetch = useCallback(() => {
    fetchTickets(options)
  }, [fetchTickets, options])

  return {
    tickets,
    loading,
    error,
    pagination,
    createTicket,
    updateTicketStatus,
    refetch,
  }
}
