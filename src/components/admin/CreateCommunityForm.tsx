'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

export function CreateCommunityForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    address: '',
    city: '',
    region: '',
    adminEmail: '',
    primaryColor: '#2563EB',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))

    // Auto-generar slug desde name
    if (name === 'name') {
      setFormData((prev) => ({
        ...prev,
        slug: value
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, ''),
      }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/communities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const error = await response.json()
        toast.error(error.error || 'Error al crear comunidad')
        return
      }

      const { community } = await response.json()
      toast.success(`Comunidad "${community.name}" creada exitosamente`)
      router.push(`/admin/dashboard?slug=${community.slug}`)
    } catch (err) {
      toast.error('Error al crear comunidad')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Nombre */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Nombre de la comunidad *
        </label>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="Ej: Condominio Verde"
          required
          disabled={loading}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100"
        />
      </div>

      {/* Slug */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Slug (URL) *
        </label>
        <input
          type="text"
          name="slug"
          value={formData.slug}
          onChange={handleChange}
          placeholder="condominio-verde"
          required
          disabled={loading}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100"
        />
        <p className="text-xs text-slate-500 mt-1">Se genera automáticamente desde el nombre</p>
      </div>

      {/* Dirección */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Dirección *
        </label>
        <input
          type="text"
          name="address"
          value={formData.address}
          onChange={handleChange}
          placeholder="Ej: Avenida Principal 123"
          required
          disabled={loading}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100"
        />
      </div>

      {/* Ciudad y Región */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Ciudad *
          </label>
          <input
            type="text"
            name="city"
            value={formData.city}
            onChange={handleChange}
            placeholder="Santiago"
            required
            disabled={loading}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Región *
          </label>
          <input
            type="text"
            name="region"
            value={formData.region}
            onChange={handleChange}
            placeholder="Metropolitana"
            required
            disabled={loading}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100"
          />
        </div>
      </div>

      {/* Email Admin */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Email de administrador *
        </label>
        <input
          type="email"
          name="adminEmail"
          value={formData.adminEmail}
          onChange={handleChange}
          placeholder="admin@comunidad.com"
          required
          disabled={loading}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100"
        />
      </div>

      {/* Color primario */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Color primario
        </label>
        <div className="flex items-center gap-3">
          <input
            type="color"
            name="primaryColor"
            value={formData.primaryColor}
            onChange={handleChange}
            className="h-10 w-20 rounded cursor-pointer border border-slate-300"
            disabled={loading}
          />
          <span className="text-sm text-slate-500">{formData.primaryColor}</span>
        </div>
      </div>

      {/* Botón submit */}
      <div className="flex gap-3 pt-4">
        <Button type="submit" disabled={loading} size="lg">
          {loading ? 'Creando...' : 'Crear comunidad'}
        </Button>
      </div>
    </form>
  )
}
