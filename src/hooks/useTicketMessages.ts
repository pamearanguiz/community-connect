'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { toast } from 'sonner'

type SenderType = 'RESIDENT' | 'ADMIN' | 'AI' | 'SYSTEM'

interface TicketMessage {
  id: string
  content: string
  senderType: SenderType
  isInternal: boolean
  attachments: string[]
  createdAt: Date | string
}

interface UseTicketMessagesOptions {
  ticketId: string
  isClosed: boolean
  pollInterval?: number // milliseconds
}

export function useTicketMessages({
  ticketId,
  isClosed,
  pollInterval = 15000,
}: UseTicketMessagesOptions) {
  const [messages, setMessages] = useState<TicketMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null)

  const fetchMessages = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/tickets/${ticketId}/messages`)
      if (!response.ok) throw new Error('Failed to fetch messages')

      const data = await response.json()
      setMessages(data.messages || [])
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error')
      setError(error)
    } finally {
      setLoading(false)
    }
  }, [ticketId])

  const sendMessage = useCallback(
    async (content: string, isInternal: boolean = false) => {
      try {
        setSending(true)
        setError(null)

        const response = await fetch(`/api/tickets/${ticketId}/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content, isInternal }),
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || 'Error al enviar el mensaje')
        }

        const result = await response.json()
        toast.success('Mensaje enviado')

        // Fetch updated messages
        await fetchMessages()

        return result.message
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Unknown error')
        setError(error)
        toast.error(error.message)
        throw error
      } finally {
        setSending(false)
      }
    },
    [ticketId, fetchMessages]
  )

  // Initial fetch and polling setup
  useEffect(() => {
    // Initial fetch
    fetchMessages()

    // Set up polling if ticket is not closed
    if (!isClosed) {
      pollingIntervalRef.current = setInterval(() => {
        fetchMessages()
      }, pollInterval)
    }

    // Cleanup
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current)
      }
    }
  }, [ticketId, isClosed, pollInterval, fetchMessages])

  return {
    messages,
    loading,
    error,
    sending,
    sendMessage,
    refetch: fetchMessages,
  }
}
