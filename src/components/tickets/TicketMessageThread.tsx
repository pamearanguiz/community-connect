'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { formatDistance } from 'date-fns'
import { es } from 'date-fns/locale'
import { Send, Loader2, Sparkles, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

type SenderType = 'RESIDENT' | 'ADMIN' | 'AI' | 'SYSTEM'

type TicketMessage = {
  id: string
  content: string
  senderType: SenderType
  isInternal: boolean
  attachments: string[]
  createdAt: Date | string
}

interface TicketMessageThreadProps {
  ticketId: string
  initialMessages: TicketMessage[]
  isClosed: boolean
  currentUserId: string
  userRole?: string
}

export function TicketMessageThread({
  ticketId,
  initialMessages,
  isClosed,
  currentUserId,
  userRole,
}: TicketMessageThreadProps) {
  const router = useRouter()
  const [messages, setMessages] = useState<TicketMessage[]>(initialMessages)
  const [newMessage, setNewMessage] = useState('')
  const [isInternal, setIsInternal] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const pollingRef = useRef<NodeJS.Timeout | null>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Polling para nuevos mensajes
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        setIsLoading(true)
        const response = await fetch(`/api/tickets/${ticketId}/messages`)
        if (response.ok) {
          const data = await response.json()
          setMessages(data.messages || [])
        }
      } catch (error) {
        console.error('Error fetching messages:', error)
      } finally {
        setIsLoading(false)
      }
    }

    // Fetch inicial
    fetchMessages()

    // Polling cada 15 segundos si el ticket no está cerrado
    if (!isClosed) {
      pollingRef.current = setInterval(fetchMessages, 15000)
    }

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current)
      }
    }
  }, [ticketId, isClosed])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!newMessage.trim()) {
      toast.error('El mensaje no puede estar vacío')
      return
    }

    // Si es mensaje interno y usuario es residente → mostrar error
    if (isInternal && userRole === 'RESIDENT') {
      toast.error('Solo los administradores pueden escribir notas internas')
      return
    }

    try {
      setIsSending(true)

      // Optimistic update
      const optimisticMessage: TicketMessage = {
        id: `temp-${Date.now()}`,
        content: newMessage,
        senderType: userRole && userRole !== 'RESIDENT' ? 'ADMIN' : 'RESIDENT',
        isInternal,
        attachments: [],
        createdAt: new Date(),
      }
      setMessages((prev) => [...prev, optimisticMessage])
      setNewMessage('')

      const response = await fetch(`/api/tickets/${ticketId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: newMessage,
          isInternal,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Error al enviar el mensaje')
      }

      // Fetch mensajes actualizados
      const messagesResponse = await fetch(`/api/tickets/${ticketId}/messages`)
      if (messagesResponse.ok) {
        const data = await messagesResponse.json()
        setMessages(data.messages || [])
      }

      toast.success('Mensaje enviado')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al enviar el mensaje')
      // Remover el mensaje optimista si falló
      setMessages((prev) => prev.filter((m) => !m.id.startsWith('temp-')))
    } finally {
      setIsSending(false)
    }
  }

  const isAdmin = userRole && userRole !== 'RESIDENT'

  return (
    <div className="flex flex-col h-full max-h-[600px]">
      {/* Messages container */}
      <div className="flex-1 overflow-y-auto space-y-4 p-4 bg-background rounded-lg border border-border">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-center text-muted-foreground">
            <p>No hay mensajes aún. ¡Sé el primero en responder!</p>
          </div>
        ) : (
          messages.map((message) => {
            const isOwnMessage = message.senderType === 'RESIDENT' && userRole === 'RESIDENT'
            const isAdminMessage = message.senderType === 'ADMIN' && isAdmin
            const isSenderMessage = isOwnMessage || isAdminMessage

            // SYSTEM messages
            if (message.senderType === 'SYSTEM') {
              return (
                <div key={message.id} className="flex justify-center py-2">
                  <p className="text-xs text-slate-400">
                    ── {message.content} ──
                  </p>
                </div>
              )
            }

            // AI messages
            if (message.senderType === 'AI') {
              return (
                <div key={message.id} className="flex gap-2 mb-3">
                  <div className="flex-1">
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 max-w-md">
                      <div className="flex items-center gap-1 mb-1">
                        <Sparkles className="h-3 w-3 text-purple-600" />
                        <span className="text-xs font-semibold text-purple-900">Asistente IA</span>
                      </div>
                      <p className="text-sm text-purple-900">{message.content}</p>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDistance(new Date(message.createdAt), new Date(), { addSuffix: true, locale: es })}
                    </p>
                  </div>
                </div>
              )
            }

            // RESIDENT/ADMIN messages
            const isResidentMessage = message.senderType === 'RESIDENT'

            return (
              <div
                key={message.id}
                className={`flex gap-2 mb-3 ${isSenderMessage ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex-1 ${isSenderMessage ? 'text-right' : ''}`}>
                  <div
                    className={`inline-block rounded-lg p-3 max-w-xs ${
                      isSenderMessage
                        ? 'bg-[var(--community-primary)] text-white'
                        : 'bg-slate-100 text-foreground'
                    } ${message.isInternal ? 'border-2 border-yellow-400' : ''}`}
                  >
                    {message.isInternal && (
                      <div className="flex items-center gap-1 text-xs font-semibold mb-1 opacity-75">
                        <AlertCircle className="h-3 w-3" />
                        Nota interna
                      </div>
                    )}
                    <p className="text-sm break-words whitespace-pre-wrap">
                      {message.content}
                    </p>
                  </div>
                  <p className={`text-xs text-muted-foreground mt-1 ${isSenderMessage ? 'text-right' : ''}`}>
                    {formatDistance(new Date(message.createdAt), new Date(), { addSuffix: true, locale: es })}
                  </p>
                </div>
              </div>
            )
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      {isClosed ? (
        <div className="mt-4 p-4 bg-slate-100 rounded-lg border border-border text-center text-sm text-muted-foreground">
          Este requerimiento ha sido cerrado. No se pueden agregar más mensajes.
        </div>
      ) : (
        <form onSubmit={handleSendMessage} className="mt-4 space-y-3 p-4 border-t border-border">
          <Textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Escribe tu respuesta aquí..."
            disabled={isSending}
            className="min-h-[80px]"
          />

          {isAdmin && (
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={isInternal}
                onChange={(e) => setIsInternal(e.target.checked)}
                disabled={isSending}
                className="rounded"
              />
              <span>Nota interna (solo para administradores)</span>
            </label>
          )}

          <Button
            type="submit"
            disabled={isSending || !newMessage.trim()}
            className="w-full"
          >
            {isSending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSending ? 'Enviando...' : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Enviar
              </>
            )}
          </Button>
        </form>
      )}
    </div>
  )
}
