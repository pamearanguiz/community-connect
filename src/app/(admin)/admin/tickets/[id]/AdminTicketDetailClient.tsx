'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Edit2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { TicketStatusBadge } from '@/components/tickets/TicketStatusBadge'
import { TicketPriorityBadge } from '@/components/tickets/TicketPriorityBadge'
import { TicketMessageThread } from '@/components/tickets/TicketMessageThread'
import { TicketPhotoUpload } from '@/components/tickets/TicketPhotoUpload'
import {
  getTaskTypeLabel,
  ADMIN_STATUS_OPTIONS,
  ADMIN_PRIORITY_OPTIONS,
  CATEGORY_EMOJIS,
  AdminTicketMeta,
  parseAdminMeta,
  serializeAdminMeta,
} from '@/lib/adminTaskMappings'
import type { AdminMember } from '@/types/adminTickets'
import { Ticket, TicketMessage, User } from '@prisma/client'
import { toast } from 'sonner'

interface AdminTicketDetailClientProps {
  ticket: Ticket & {
    messages: (TicketMessage & { sender?: User | null })[]
    createdBy: User | null
    assignedTo: User | null
    unit?: { number: string; tower: string | null } | null
    adminMeta: AdminTicketMeta | null
  }
  adminMembers: AdminMember[]
  userRole: string
  currentUserId: string
}

export function AdminTicketDetailClient({
  ticket,
  adminMembers,
  userRole,
  currentUserId,
}: AdminTicketDetailClientProps) {
  const router = useRouter()
  const [isEditingStatus, setIsEditingStatus] = useState(false)
  const [isEditingPriority, setIsEditingPriority] = useState(false)
  const [isEditingAssignee, setIsEditingAssignee] = useState(false)
  const [isEditingPersonas, setIsEditingPersonas] = useState(false)
  const [selectedStatus, setSelectedStatus] = useState<string>(ticket.status)
  const [selectedPriority, setSelectedPriority] = useState<string>(ticket.priority)
  const [selectedAssignee, setSelectedAssignee] = useState(ticket.assignedToUserId || '')
  const [isSaving, setIsSaving] = useState(false)

  // Estados para edición de tarea
  const adminMeta = parseAdminMeta(ticket.aiSummary)
  const [formData, setFormData] = useState({
    status: ticket.status as string,
    priority: ticket.priority as string,
    assignedToUserId: ticket.assignedToUserId || '',
    assignedExternal: adminMeta?.assignedExternal || '',
    followerUserId: adminMeta?.followerUserId || '',
    followerExternal: adminMeta?.followerExternal || '',
    externalCompany: adminMeta?.externalCompany || '',
  })

  const handleSaveStatus = async () => {
    if (selectedStatus === ticket.status) {
      setIsEditingStatus(false)
      return
    }

    try {
      setIsSaving(true)
      const response = await fetch(`/api/admin/tickets/${ticket.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: selectedStatus }),
      })

      if (!response.ok) {
        throw new Error('Error al actualizar estado')
      }

      toast.success('Estado actualizado')
      setIsEditingStatus(false)
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al actualizar')
      setSelectedStatus(ticket.status)
    } finally {
      setIsSaving(false)
    }
  }

  const handleSavePriority = async () => {
    if (selectedPriority === ticket.priority) {
      setIsEditingPriority(false)
      return
    }

    try {
      setIsSaving(true)
      const response = await fetch(`/api/admin/tickets/${ticket.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priority: selectedPriority }),
      })

      if (!response.ok) {
        throw new Error('Error al actualizar prioridad')
      }

      toast.success('Prioridad actualizada')
      setIsEditingPriority(false)
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al actualizar')
      setSelectedPriority(ticket.priority)
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveAssignee = async () => {
    if (selectedAssignee === (ticket.assignedToUserId || '')) {
      setIsEditingAssignee(false)
      return
    }

    try {
      setIsSaving(true)
      const response = await fetch(`/api/admin/tickets/${ticket.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assignedToUserId: selectedAssignee || null,
        }),
      })

      if (!response.ok) {
        throw new Error('Error al asignar')
      }

      toast.success('Asignación actualizada')
      setIsEditingAssignee(false)
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al actualizar')
      setSelectedAssignee(ticket.assignedToUserId || '')
    } finally {
      setIsSaving(false)
    }
  }

  const handleSavePersonas = async () => {
    try {
      setIsSaving(true)
      const response = await fetch(`/api/admin/tickets/${ticket.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: formData.status as string,
          priority: formData.priority as string,
          assignedToUserId: formData.assignedToUserId || null,
          assignedExternal: formData.assignedExternal,
          followerUserId: formData.followerUserId || null,
          followerExternal: formData.followerExternal,
          externalCompany: formData.externalCompany,
        }),
      })

      if (!response.ok) {
        throw new Error('Error al actualizar')
      }

      toast.success('Cambios guardados')
      setIsEditingPersonas(false)
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al actualizar')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin/tickets">
          <Button variant="outline" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Volver
          </Button>
        </Link>
        <div>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{ticket.ticketNumber}</p>
          <h1 className="text-3xl font-bold text-slate-900">{ticket.title}</h1>
        </div>
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Panel lateral izquierdo — detalles */}
        <div className="lg:col-span-1 space-y-4">
          {/* Estado y Prioridad */}
          <div className="bg-white rounded-lg border border-slate-200 p-4 space-y-3">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Estado</p>
                <Edit2 className="h-3 w-3 text-slate-400" />
              </div>
              {isEditingStatus ? (
                <div className="space-y-2">
                  <Select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    disabled={isSaving}
                  >
                    {ADMIN_STATUS_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </Select>
                  <div className="flex gap-2">
                    <Button
                                            onClick={handleSaveStatus}
                      disabled={isSaving}
                      className="flex-1"
                    >
                      Guardar
                    </Button>
                    <Button
                                            variant="outline"
                      onClick={() => {
                        setIsEditingStatus(false)
                        setSelectedStatus(ticket.status)
                      }}
                      disabled={isSaving}
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => setIsEditingStatus(true)}
                  className="cursor-pointer hover:opacity-70"
                >
                  <TicketStatusBadge status={ticket.status as any} />
                </div>
              )}
            </div>

            <div>
              <div className="flex items-center gap-2 mb-2">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Prioridad</p>
                <Edit2 className="h-3 w-3 text-slate-400" />
              </div>
              {isEditingPriority ? (
                <div className="space-y-2">
                  <Select
                    value={selectedPriority}
                    onChange={(e) => setSelectedPriority(e.target.value)}
                    disabled={isSaving}
                  >
                    {ADMIN_PRIORITY_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </Select>
                  <div className="flex gap-2">
                    <Button
                                            onClick={handleSavePriority}
                      disabled={isSaving}
                      className="flex-1"
                    >
                      Guardar
                    </Button>
                    <Button
                                            variant="outline"
                      onClick={() => {
                        setIsEditingPriority(false)
                        setSelectedPriority(ticket.priority)
                      }}
                      disabled={isSaving}
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => setIsEditingPriority(true)}
                  className="cursor-pointer hover:opacity-70"
                >
                  <TicketPriorityBadge priority={ticket.priority as any} />
                </div>
              )}
            </div>
          </div>

          {/* Personas y Seguimiento - Editable */}
          <div className="bg-white rounded-lg border border-slate-200 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-slate-900">Personas & Seguimiento</h3>
              {!isEditingPersonas && (
                <Button
                  variant="outline"
                  onClick={() => setIsEditingPersonas(true)}
                  className="h-7 px-2 text-xs py-0"
                >
                  Editar
                </Button>
              )}
            </div>

            {isEditingPersonas ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-medium text-slate-500 block mb-1">Estado</label>
                    <Select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      disabled={isSaving}
                    >
                      {ADMIN_STATUS_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </Select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-500 block mb-1">Prioridad</label>
                    <Select
                      value={formData.priority}
                      onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                      disabled={isSaving}
                    >
                      {ADMIN_PRIORITY_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </Select>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-500 block mb-1">Encargado (sistema)</label>
                  <Select
                    value={formData.assignedToUserId}
                    onChange={(e) => setFormData({ ...formData, assignedToUserId: e.target.value })}
                    disabled={isSaving}
                  >
                    <option value="">Sin asignar</option>
                    {adminMembers.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </Select>
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-500 block mb-1">Encargado externo</label>
                  <Input
                    type="text"
                    placeholder="Ej: Pedro Constructores"
                    value={formData.assignedExternal}
                    onChange={(e) => setFormData({ ...formData, assignedExternal: e.target.value })}
                    disabled={isSaving}
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-500 block mb-1">Seguidor (sistema)</label>
                  <Select
                    value={formData.followerUserId}
                    onChange={(e) => setFormData({ ...formData, followerUserId: e.target.value })}
                    disabled={isSaving}
                  >
                    <option value="">Sin seguidor</option>
                    {adminMembers.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </Select>
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-500 block mb-1">Seguidor externo</label>
                  <Input
                    type="text"
                    placeholder="Ej: Inspector municipal"
                    value={formData.followerExternal}
                    onChange={(e) => setFormData({ ...formData, followerExternal: e.target.value })}
                    disabled={isSaving}
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-500 block mb-1">Empresa externa</label>
                  <Input
                    type="text"
                    placeholder="Ej: Empresa Constructora XYZ"
                    value={formData.externalCompany}
                    onChange={(e) => setFormData({ ...formData, externalCompany: e.target.value })}
                    disabled={isSaving}
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <Button onClick={handleSavePersonas} disabled={isSaving} className="flex-1">
                    Guardar
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setIsEditingPersonas(false)}
                    disabled={isSaving}
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-2 text-sm">
                <div>
                  <p className="text-xs text-slate-500">Encargado (sistema)</p>
                  <p className="font-medium">{ticket.assignedTo?.name || 'Sin asignar'}</p>
                </div>
                {formData.assignedExternal && (
                  <div>
                    <p className="text-xs text-slate-500">Encargado externo</p>
                    <p className="font-medium">{formData.assignedExternal}</p>
                  </div>
                )}
                {formData.followerUserId && (
                  <div>
                    <p className="text-xs text-slate-500">Seguidor (sistema)</p>
                    <p className="font-medium">{adminMembers.find((m) => m.id === formData.followerUserId)?.name}</p>
                  </div>
                )}
                {formData.followerExternal && (
                  <div>
                    <p className="text-xs text-slate-500">Seguidor externo</p>
                    <p className="font-medium">{formData.followerExternal}</p>
                  </div>
                )}
                {formData.externalCompany && (
                  <div>
                    <p className="text-xs text-slate-500">Empresa externa</p>
                    <p className="font-medium">{formData.externalCompany}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Información general */}
          <div className="bg-white rounded-lg border border-slate-200 p-4 space-y-3">
            <h3 className="font-semibold text-slate-900">Información</h3>

            <div>
              <p className="text-xs text-slate-500">Tipo</p>
              <p className="text-sm font-medium">{getTaskTypeLabel(ticket.category)}</p>
            </div>

            <div>
              <p className="text-xs text-slate-500">Creada por</p>
              <p className="text-sm font-medium">{ticket.createdBy?.name || 'Sistema'}</p>
            </div>

            <div>
              <p className="text-xs text-slate-500">Fecha de creación</p>
              <p className="text-sm font-medium">{new Date(ticket.createdAt).toLocaleDateString('es-CL')}</p>
            </div>
          </div>
        </div>

        {/* Panel derecho — descripción y mensajes */}
        <div className="lg:col-span-2 space-y-6">
          {/* Descripción */}
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <h2 className="font-semibold text-slate-900 mb-3">Descripción</h2>
            <p className="text-slate-700 whitespace-pre-wrap">{ticket.description}</p>
          </div>

          {/* Carga de fotos */}
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <h2 className="font-semibold text-slate-900 mb-3">Agregar Fotos/Documentos</h2>
            <TicketPhotoUpload ticketId={ticket.id} onSuccess={() => router.refresh()} />
          </div>

          {/* Thread de notas/mensajes */}
          <TicketMessageThread
            ticketId={ticket.id}
            initialMessages={ticket.messages}
            isClosed={ticket.status === 'CLOSED'}
            currentUserId={currentUserId}
            userRole={userRole}
          />
        </div>
      </div>
    </div>
  )
}
