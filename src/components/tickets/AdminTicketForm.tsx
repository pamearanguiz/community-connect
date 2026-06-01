'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, Upload } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CreateAdminTicketSchema, type CreateAdminTicketInput, type AdminTicketDetail } from '@/types/adminTickets'
import {
  ADMIN_TASK_TYPE_OPTIONS,
  ADMIN_STATUS_OPTIONS,
  ADMIN_PRIORITY_OPTIONS,
  parseAdminMeta,
} from '@/lib/adminTaskMappings'

interface AdminMember {
  id: string
  name: string
  email: string
  avatarUrl?: string
}

interface AdminTicketFormProps {
  ticket?: AdminTicketDetail
  adminMembers: AdminMember[]
}

export function AdminTicketForm({ ticket, adminMembers }: AdminTicketFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const adminMeta = ticket ? parseAdminMeta(ticket.aiSummary) : null

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateAdminTicketInput>({
    resolver: zodResolver(CreateAdminTicketSchema),
    defaultValues: ticket
      ? {
          title: ticket.title,
          description: ticket.description,
          category: ticket.category as any,
          priority: ticket.priority as any,
          status: ticket.status as any,
          assignedToUserId: ticket.assignedToUserId || undefined,
          assignedExternal: adminMeta?.assignedExternal,
          followerUserId: adminMeta?.followerUserId,
          followerExternal: adminMeta?.followerExternal,
          externalCompany: adminMeta?.externalCompany,
          startDate: adminMeta?.startDate,
        }
      : {
          priority: 'MEDIUM' as const,
          status: 'NEW' as const,
          category: 'OTHER' as const,
          title: '',
          description: '',
        },
  })

  const onSubmit = async (data: CreateAdminTicketInput) => {
    try {
      setIsSubmitting(true)

      const endpoint = ticket ? `/api/admin/tickets/${ticket.id}` : '/api/admin/tickets'
      const method = ticket ? 'PATCH' : 'POST'

      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Error al guardar la tarea')
      }

      const result = await response.json()
      const { ticket: createdTicket } = result

      toast.success(ticket ? 'Tarea actualizada exitosamente' : 'Tarea creada exitosamente')

      // Redirigir al detalle de la tarea creada
      setTimeout(() => {
        router.push(`/admin/tickets/${createdTicket.id}`)
      }, 500)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al guardar la tarea')
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Sección 1: Información básica */}
      <div className="bg-white rounded-lg border border-slate-200 p-6 space-y-4">
        <h2 className="font-semibold text-slate-900">Información de la tarea</h2>

        <div>
          <label className="text-sm font-medium block mb-2">Título *</label>
          <Input
            placeholder="Ej: Reparar termofusión en pasillo norte"
            {...register('title')}
            disabled={isSubmitting}
          />
          {errors.title && <p className="text-xs text-destructive mt-1">{errors.title.message}</p>}
        </div>

        <div>
          <label className="text-sm font-medium block mb-2">Descripción *</label>
          <Textarea
            placeholder="Describa con detalle qué necesita hacerse..."
            {...register('description')}
            disabled={isSubmitting}
            className="min-h-[120px]"
          />
          {errors.description && <p className="text-xs text-destructive mt-1">{errors.description.message}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium block mb-2">Tipo de tarea *</label>
            <Select {...register('category')} disabled={isSubmitting}>
              {ADMIN_TASK_TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </Select>
            {errors.category && <p className="text-xs text-destructive mt-1">{errors.category.message}</p>}
          </div>

          <div>
            <label className="text-sm font-medium block mb-2">Prioridad *</label>
            <Select {...register('priority')} disabled={isSubmitting}>
              {ADMIN_PRIORITY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </Select>
            {errors.priority && <p className="text-xs text-destructive mt-1">{errors.priority.message}</p>}
          </div>
        </div>

        <div>
          <label className="text-sm font-medium block mb-2">Estado inicial</label>
          <Select {...register('status')} disabled={isSubmitting}>
            {ADMIN_STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>
          {errors.status && <p className="text-xs text-destructive mt-1">{errors.status.message}</p>}
        </div>
      </div>

      {/* Sección 2: Asignación y seguimiento */}
      <div className="bg-white rounded-lg border border-slate-200 p-6 space-y-4">
        <h2 className="font-semibold text-slate-900">Asignación y seguimiento</h2>

        <div>
          <label className="text-sm font-medium block mb-2">Encargado (sistema)</label>
          <Select {...register('assignedToUserId')} disabled={isSubmitting}>
            <option value="">-- Sin asignar --</option>
            {adminMembers.map((member) => (
              <option key={member.id} value={member.id}>
                {member.name}
              </option>
            ))}
          </Select>
          <p className="text-xs text-muted-foreground mt-1">Usuario del sistema responsable de ejecutar la tarea</p>
        </div>

        <div>
          <label className="text-sm font-medium block mb-2">Encargado externo</label>
          <Input
            placeholder="Ej: Pedro Constructores S.A."
            {...register('assignedExternal')}
            disabled={isSubmitting}
          />
          <p className="text-xs text-muted-foreground mt-1">Persona o empresa externa si no es responsabilidad interna</p>
        </div>

        <div>
          <label className="text-sm font-medium block mb-2">Persona de seguimiento (sistema)</label>
          <Select {...register('followerUserId')} disabled={isSubmitting}>
            <option value="">-- Sin seguimiento --</option>
            {adminMembers.map((member) => (
              <option key={member.id} value={member.id}>
                {member.name}
              </option>
            ))}
          </Select>
          <p className="text-xs text-muted-foreground mt-1">Usuario que monitorea el progreso</p>
        </div>

        <div>
          <label className="text-sm font-medium block mb-2">Seguidor externo</label>
          <Input
            placeholder="Ej: Inspector municipal"
            {...register('followerExternal')}
            disabled={isSubmitting}
          />
          <p className="text-xs text-muted-foreground mt-1">Entidad externa que supervisa</p>
        </div>

        <div>
          <label className="text-sm font-medium block mb-2">Empresa externa (contratista)</label>
          <Input
            placeholder="Ej: Empresa Constructora XYZ"
            {...register('externalCompany')}
            disabled={isSubmitting}
          />
          <p className="text-xs text-muted-foreground mt-1">Empresa contratada para ejecutar la tarea</p>
        </div>
      </div>

      {/* Sección 3: Fechas y adjuntos */}
      <div className="bg-white rounded-lg border border-slate-200 p-6 space-y-4">
        <h2 className="font-semibold text-slate-900">Fechas y adjuntos</h2>

        <div>
          <label className="text-sm font-medium block mb-2">Fecha de inicio</label>
          <Input type="date" {...register('startDate')} disabled={isSubmitting} />
          <p className="text-xs text-muted-foreground mt-1">Fecha programada para comenzar la tarea</p>
        </div>

        <div>
          <label className="text-sm font-medium block mb-2">Fotos/Documentos</label>
          <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
            <Upload className="h-6 w-6 mx-auto text-muted-foreground mb-2" />
            <p className="text-xs text-muted-foreground">Máximo 5 archivos (imágenes o PDF, 10MB c/u)</p>
            <p className="text-xs text-muted-foreground mt-1">[Próximamente: arrastra archivos aquí]</p>
          </div>
        </div>
      </div>

      {/* Botón submit */}
      <div className="flex gap-2">
        <Button type="submit" disabled={isSubmitting} className="flex-1">
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isSubmitting ? 'Guardando...' : ticket ? 'Actualizar tarea' : 'Crear tarea'}
        </Button>
        {ticket && (
          <Button
            type="button"
            variant="outline"
            disabled={isSubmitting}
            onClick={() => router.back()}
          >
            Cancelar
          </Button>
        )}
      </div>
    </form>
  )
}
