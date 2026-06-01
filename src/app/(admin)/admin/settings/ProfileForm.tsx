'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'

interface User {
  id: string
  name: string
  email: string
  phone?: string | null
}

interface ProfileFormProps {
  user: User
}

export function ProfileForm({ user }: ProfileFormProps) {
  const [isSaving, setIsSaving] = useState(false)
  const [formData, setFormData] = useState({
    name: user.name || '',
    email: user.email || '',
    phone: user.phone || '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name.trim()) {
      toast.error('El nombre es requerido')
      return
    }

    try {
      setIsSaving(true)

      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-community-slug': 'communityconnect',
        },
        body: JSON.stringify({
          name: formData.name,
          phone: formData.phone,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to update profile')
      }

      toast.success('Perfil actualizado correctamente')
    } catch (error) {
      toast.error('Error al actualizar el perfil')
      console.error(error)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Nombre *
        </label>
        <Input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="Tu nombre completo"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Correo electrónico
        </label>
        <Input
          type="email"
          value={formData.email}
          disabled
          className="bg-slate-50 cursor-not-allowed"
        />
        <p className="text-xs text-slate-500 mt-1">El correo no puede cambiar aquí. Está vinculado a tu cuenta Clerk.</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Teléfono
        </label>
        <Input
          type="tel"
          name="phone"
          value={formData.phone}
          onChange={handleChange}
          placeholder="+56 9 XXXX XXXX"
        />
      </div>

      <Button
        type="submit"
        disabled={isSaving}
        className="w-full"
      >
        {isSaving ? 'Guardando...' : 'Guardar cambios'}
      </Button>
    </form>
  )
}
