'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

interface Schedule {
  dayOfWeek: string
  startTime: string
  endTime: string
  endsNextDay: boolean
}

interface Concierge {
  id: string
  name: string
  avatarUrl: string | null
  phone: string | null
  schedules: Array<Schedule & { id: string }>
}

const DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']
const DAY_LABELS = {
  MON: 'Lunes',
  TUE: 'Martes',
  WED: 'Miércoles',
  THU: 'Jueves',
  FRI: 'Viernes',
  SAT: 'Sábado',
  SUN: 'Domingo',
}

export function ConciergeManager() {
  const [concierges, setConcierges] = useState<Concierge[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    avatarUrl: '',
    schedules: [{ dayOfWeek: 'MON', startTime: '08:00', endTime: '20:00', endsNextDay: false }],
  })

  // Cargar conserjes
  useEffect(() => {
    loadConcierges()
  }, [])

  const loadConcierges = async () => {
    try {
      const response = await fetch('/api/concierge')
      if (response.ok) {
        const data = await response.json()
        setConcierges(data.concierges || [])
      }
    } catch (err) {
      console.error('Error loading concierges:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleScheduleChange = (index: number, field: string, value: any) => {
    const newSchedules = [...formData.schedules]
    newSchedules[index] = { ...newSchedules[index], [field]: value }
    setFormData((prev) => ({ ...prev, schedules: newSchedules }))
  }

  const addSchedule = () => {
    setFormData((prev) => ({
      ...prev,
      schedules: [
        ...prev.schedules,
        { dayOfWeek: 'MON', startTime: '08:00', endTime: '20:00', endsNextDay: false },
      ],
    }))
  }

  const removeSchedule = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      schedules: prev.schedules.filter((_, i) => i !== index),
    }))
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validar que sea una imagen
    if (!file.type.startsWith('image/')) {
      toast.error('Por favor selecciona un archivo de imagen')
      return
    }

    // Validar tamaño máximo (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('La foto no debe superar 5MB')
      return
    }

    setUploading(true)
    try {
      const reader = new FileReader()
      reader.onload = (event) => {
        const base64String = event.target?.result as string
        setFormData((prev) => ({ ...prev, avatarUrl: base64String }))
        setUploading(false)
        toast.success('Foto cargada correctamente')
      }
      reader.onerror = () => {
        setUploading(false)
        toast.error('Error al leer la foto')
      }
      reader.readAsDataURL(file)
    } catch (err) {
      setUploading(false)
      toast.error('Error al procesar la foto')
      console.error(err)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const response = await fetch('/api/concierge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const error = await response.json()
        toast.error(error.error || 'Error al crear conserje')
        return
      }

      toast.success(`Conserje "${formData.name}" creado exitosamente`)
      setFormData({
        name: '',
        phone: '',
        avatarUrl: '',
        schedules: [{ dayOfWeek: 'MON', startTime: '08:00', endTime: '20:00', endsNextDay: false }],
      })
      setShowForm(false)
      loadConcierges()
    } catch (err) {
      toast.error('Error al crear conserje')
      console.error(err)
    }
  }

  if (loading) {
    return <div className="h-96 bg-slate-200 rounded animate-pulse" />
  }

  return (
    <div className="space-y-6">
      {/* Lista de conserjes */}
      {concierges.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-slate-900">Conserjes actuales</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {concierges.map((concierge) => (
              <div key={concierge.id} className="bg-white rounded-lg border border-slate-200 p-4">
                {/* Header */}
                <div className="flex items-center gap-3 mb-4">
                  {concierge.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={concierge.avatarUrl}
                      alt={concierge.name}
                      className="h-12 w-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="h-12 w-12 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
                      {concierge.name[0]}
                    </div>
                  )}
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-900">{concierge.name}</h3>
                    {concierge.phone && <p className="text-sm text-slate-500">{concierge.phone}</p>}
                  </div>
                </div>

                {/* Horarios */}
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-slate-600 uppercase">Turnos</p>
                  {concierge.schedules.length > 0 ? (
                    <div className="space-y-1">
                      {concierge.schedules.map((schedule) => (
                        <div key={schedule.id} className="text-xs text-slate-600">
                          <span className="font-medium">{DAY_LABELS[schedule.dayOfWeek as keyof typeof DAY_LABELS]}</span>
                          {' '}
                          {schedule.startTime} - {schedule.endTime}
                          {schedule.endsNextDay && ' (cruza medianoche)'}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 italic">Sin turnos asignados</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Botón crear */}
      {!showForm && (
        <Button onClick={() => setShowForm(true)} size="lg">
          + Agregar conserje
        </Button>
      )}

      {/* Formulario */}
      {showForm && (
        <div className="bg-white rounded-lg border border-slate-200 p-6 space-y-4">
          <h2 className="text-xl font-semibold text-slate-900">Crear nuevo conserje</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Nombre */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nombre *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Ej: Juan García"
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Teléfono */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Teléfono</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
                placeholder="+56 9 1234 5678"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Foto */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Foto</label>
              {formData.avatarUrl ? (
                <div className="space-y-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={formData.avatarUrl}
                    alt="Preview"
                    className="h-24 w-24 rounded-lg object-cover border border-slate-300"
                  />
                  <div className="flex gap-2">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      disabled={uploading}
                      className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100"
                    />
                    <button
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, avatarUrl: '' }))}
                      className="px-3 py-2 border border-red-300 text-red-600 rounded-lg text-sm hover:bg-red-50"
                    >
                      Eliminar
                    </button>
                  </div>
                  {uploading && <p className="text-xs text-slate-500">Subiendo foto...</p>}
                </div>
              ) : (
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  disabled={uploading}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100"
                />
              )}
              {uploading && <p className="text-xs text-slate-500 mt-1">Subiendo foto...</p>}
            </div>

            {/* Horarios */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-slate-700">Turnos *</label>
              {formData.schedules.map((schedule, idx) => (
                <div key={idx} className="flex gap-2 items-end">
                  <div className="flex-1">
                    <label className="text-xs text-slate-600">Día</label>
                    <select
                      value={schedule.dayOfWeek}
                      onChange={(e) => handleScheduleChange(idx, 'dayOfWeek', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                    >
                      {DAYS.map((day) => (
                        <option key={day} value={day}>
                          {DAY_LABELS[day as keyof typeof DAY_LABELS]}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex-1">
                    <label className="text-xs text-slate-600">Inicio</label>
                    <input
                      type="time"
                      value={schedule.startTime}
                      onChange={(e) => handleScheduleChange(idx, 'startTime', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="flex-1">
                    <label className="text-xs text-slate-600">Fin</label>
                    <input
                      type="time"
                      value={schedule.endTime}
                      onChange={(e) => handleScheduleChange(idx, 'endTime', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <label className="flex items-center gap-2 whitespace-nowrap pb-2">
                    <input
                      type="checkbox"
                      checked={schedule.endsNextDay}
                      onChange={(e) => handleScheduleChange(idx, 'endsNextDay', e.target.checked)}
                      className="rounded"
                    />
                    <span className="text-xs text-slate-600">Cruza medianoche</span>
                  </label>

                  {formData.schedules.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeSchedule(idx)}
                      className="px-2 py-2 text-red-600 hover:bg-red-50 rounded"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={addSchedule}
              className="w-full"
            >
              + Agregar turno
            </Button>

            {/* Submit */}
            <div className="flex gap-3 pt-4">
              <Button type="submit">Crear conserje</Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowForm(false)}
              >
                Cancelar
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
