'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, Upload } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { TicketStatusBadge } from './TicketStatusBadge'
import { TicketPriorityBadge } from './TicketPriorityBadge'
import { CreateTicketSchema, type CreateTicketInput, type TicketClassificationResult } from '@/types/tickets'

type FormStep = 'form' | 'analyzing' | 'result'

const CATEGORIES = [
  { value: '', label: 'Clasificar automáticamente con IA' },
  { value: 'MAINTENANCE', label: '🔧 Mantención' },
  { value: 'NOISE', label: '🔊 Ruido' },
  { value: 'WATER_LEAK', label: '💧 Filtración de agua' },
  { value: 'PARKING', label: '🚗 Estacionamiento' },
  { value: 'PACKAGE', label: '📦 Encomienda' },
  { value: 'COMMON_EXPENSES', label: '💰 Gastos comunes' },
  { value: 'SECURITY', label: '🔒 Seguridad' },
  { value: 'ADMINISTRATIVE', label: '📋 Administrativo' },
  { value: 'OTHER', label: '📌 Otro' },
]

export function TicketForm() {
  const router = useRouter()
  const [step, setStep] = useState<FormStep>('form')
  const [classification, setClassification] = useState<TicketClassificationResult | null>(null)
  const [createdTicketId, setCreatedTicketId] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
  } = useForm<CreateTicketInput>({
    resolver: zodResolver(CreateTicketSchema),
  })

  const title = watch('title')
  const description = watch('description')
  const category = watch('category')

  const onSubmit = async (data: CreateTicketInput) => {
    try {
      setStep('analyzing')

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
      const { ticket } = result

      setCreatedTicketId(ticket.id)

      // Si fue clasificado por IA, extraer la clasificación del primer mensaje
      if (ticket.messages && ticket.messages.length > 0) {
        const aiMessage = ticket.messages.find((m: any) => m.senderType === 'AI')
        if (aiMessage) {
          setClassification({
            category: ticket.category,
            priority: ticket.priority,
            aiSummary: ticket.aiSummary,
            suggestedResponse: aiMessage.content,
          })
        }
      }

      setStep('result')
      toast.success('¡Requerimiento creado exitosamente!')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al crear el requerimiento')
      setStep('form')
    }
  }

  // Paso 1: Formulario
  if (step === 'form') {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Reportar un Requerimiento</CardTitle>
          <CardDescription>
            Describe el problema que necesita atención. Nuestra IA lo clasificará automáticamente.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Título */}
            <div>
              <label className="text-sm font-medium block mb-2">
                Título *
              </label>
              <Input
                placeholder="Ej: Filtración en cocina"
                {...register('title')}
                disabled={isSubmitting}
              />
              {errors.title && (
                <p className="text-xs text-destructive mt-1">{errors.title.message}</p>
              )}
            </div>

            {/* Descripción */}
            <div>
              <label className="text-sm font-medium block mb-2">
                Descripción *
              </label>
              <Textarea
                placeholder="Cuéntanos con detalle qué está pasando..."
                {...register('description')}
                disabled={isSubmitting}
                className="min-h-[120px]"
              />
              {errors.description && (
                <p className="text-xs text-destructive mt-1">{errors.description.message}</p>
              )}
            </div>

            {/* Categoría */}
            <div>
              <label className="text-sm font-medium block mb-2">
                Categoría (opcional)
              </label>
              <Select {...register('category')} disabled={isSubmitting}>
                {CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                Si no sabes cuál es, déjalo vacío y nuestra IA lo clasificará.
              </p>
            </div>

            {/* Adjuntos (placeholder) */}
            <div>
              <label className="text-sm font-medium block mb-2">
                Adjuntos (opcional)
              </label>
              <div className="border-2 border-dashed border-border rounded-lg p-4 text-center hover:border-primary/50 transition-colors">
                <Upload className="h-6 w-6 mx-auto text-muted-foreground mb-2" />
                <p className="text-xs text-muted-foreground">
                  Máximo 5 archivos (imágenes o PDF, 10MB c/u)
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  [Próximamente: arrastra archivos aquí]
                </p>
              </div>
            </div>

            {/* Botón submit */}
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full"
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSubmitting ? 'Enviando...' : 'Enviar Requerimiento'}
            </Button>
          </form>
        </CardContent>
      </Card>
    )
  }

  // Paso 2: Analizando
  if (step === 'analyzing') {
    return (
      <Card>
        <CardContent className="p-12 text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
          <div>
            <h3 className="font-semibold text-lg mb-1">Analizando tu requerimiento...</h3>
            <p className="text-sm text-muted-foreground">
              Nuestra IA está clasificando y generando una respuesta personalizada.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Paso 3: Resultado
  if (step === 'result' && classification && createdTicketId) {
    return (
      <div className="space-y-4">
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="text-green-900">¡Requerimiento creado exitosamente!</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Información del ticket */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Categoría:</span>
                <span className="text-sm">{classification.category}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Prioridad:</span>
                <TicketPriorityBadge priority={classification.priority as any} />
              </div>
              {classification.aiSummary && (
                <div className="mt-3 p-2 bg-white rounded border border-green-200">
                  <p className="text-xs font-medium text-muted-foreground mb-1">
                    Resumen de la IA:
                  </p>
                  <p className="text-sm">{classification.aiSummary}</p>
                </div>
              )}
            </div>

            {/* Respuesta sugerida */}
            <div className="mt-4 p-3 bg-purple-50 border border-purple-200 rounded">
              <p className="text-xs font-medium text-purple-900 mb-1">
                ✨ Respuesta del Asistente IA:
              </p>
              <p className="text-sm text-purple-900">{classification.suggestedResponse}</p>
            </div>

            {/* Botones */}
            <div className="flex gap-2 pt-4">
              <Button
                onClick={() => router.push(`/tickets/${createdTicketId}`)}
                className="flex-1"
              >
                Ver mi Requerimiento
              </Button>
              <Button
                onClick={() => {
                  setStep('form')
                  setClassification(null)
                  setCreatedTicketId(null)
                }}
                variant="outline"
                className="flex-1"
              >
                Crear Otro
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Información útil */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">¿Qué sigue?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>• El equipo administrativo revisará tu requerimiento pronto</p>
            <p>• Recibirás notificaciones cuando haya cambios de estado</p>
            <p>• Podrás responder mensajes directamente en el requerimiento</p>
            <p>• Si tienes urgencia, puedes contactar al conserje</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return null
}
