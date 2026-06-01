'use client'

import { useEffect, useState } from 'react'
import { Users, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'

interface CommunityMember {
  id: string
  userId: string
  communityId: string
  role: 'RESIDENT' | 'COMMUNITY_ADMIN' | 'COMMITTEE_MEMBER' | 'CONCIERGE' | 'SUPER_ADMIN'
  isActive: boolean
  joinedAt: string
  user: {
    id: string
    name: string
    email: string
    avatarUrl: string | null
    createdAt: string
  }
}

const ROLE_OPTIONS = [
  { value: 'RESIDENT', label: 'Residente' },
  { value: 'CONCIERGE', label: 'Conserje' },
  { value: 'COMMITTEE_MEMBER', label: 'Comité' },
  { value: 'COMMUNITY_ADMIN', label: 'Administrador' },
]

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export default function ResidentsPage() {
  const [members, setMembers] = useState<CommunityMember[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const filteredMembers = members.filter((m) =>
    m.user.name.toLowerCase().includes(search.toLowerCase()) ||
    m.user.email.toLowerCase().includes(search.toLowerCase())
  )

  const totalUsers = members.length
  const adminCount = members.filter((m) => ['COMMUNITY_ADMIN', 'SUPER_ADMIN'].includes(m.role)).length
  const residentCount = members.filter((m) => m.role === 'RESIDENT').length

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const response = await fetch('/api/admin/users', {
          method: 'GET',
          headers: {
            'x-community-slug': 'communityconnect',
          },
        })

        if (!response.ok) {
          throw new Error('Failed to fetch members')
        }

        const data = await response.json()
        setMembers(data)
      } catch (error) {
        toast.error('Error al cargar usuarios')
        console.error(error)
      } finally {
        setLoading(false)
      }
    }

    fetchMembers()
  }, [])

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-community-slug': 'communityconnect',
        },
        body: JSON.stringify({ role: newRole }),
      })

      if (!response.ok) {
        throw new Error('Failed to update role')
      }

      const updated = await response.json()

      setMembers((prev) =>
        prev.map((m) =>
          m.userId === userId
            ? {
                ...m,
                role: updated.role,
              }
            : m
        )
      )

      toast.success('Rol actualizado')
    } catch (error) {
      toast.error('Error al actualizar rol')
      console.error(error)
    }
  }

  const handleToggleActive = async (userId: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-community-slug': 'communityconnect',
        },
        body: JSON.stringify({ isActive: !isActive }),
      })

      if (!response.ok) {
        throw new Error('Failed to update status')
      }

      const updated = await response.json()

      setMembers((prev) =>
        prev.map((m) =>
          m.userId === userId
            ? {
                ...m,
                isActive: updated.isActive,
              }
            : m
        )
      )

      toast.success(isActive ? 'Usuario desactivado' : 'Usuario activado')
    } catch (error) {
      toast.error('Error al cambiar estado')
      console.error(error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-slate-500">Cargando usuarios...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Users className="h-8 w-8 text-slate-600" />
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Usuarios de la Comunidad</h1>
          <p className="text-sm text-slate-500 mt-1">Gestiona los roles y acceso de cada usuario</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="text-2xl font-bold text-slate-900">{totalUsers}</div>
          <div className="text-sm text-slate-600">Total de usuarios</div>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="text-2xl font-bold text-slate-900">{adminCount}</div>
          <div className="text-sm text-slate-600">Administradores</div>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="text-2xl font-bold text-slate-900">{residentCount}</div>
          <div className="text-sm text-slate-600">Residentes</div>
        </div>
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Buscar por nombre o correo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {filteredMembers.length === 0 ? (
        <div className="bg-white rounded-lg border border-slate-200 p-8 text-center">
          <p className="text-slate-500">No se encontraron usuarios</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
          <table className="w-full">
            <thead className="border-b border-slate-200 bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Usuario</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Correo</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Rol</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Estado</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredMembers.map((member) => (
                <tr key={member.userId} className="hover:bg-slate-50 transition">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {member.user.avatarUrl ? (
                        <img
                          src={member.user.avatarUrl}
                          alt={member.user.name}
                          className="h-8 w-8 rounded-full"
                        />
                      ) : (
                        <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-semibold text-slate-700">
                          {getInitials(member.user.name)}
                        </div>
                      )}
                      <div className="text-sm font-medium text-slate-900">{member.user.name}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-slate-600">{member.user.email}</div>
                  </td>
                  <td className="px-6 py-4">
                    <Select
                      value={member.role}
                      onChange={(e) => handleRoleChange(member.userId, e.target.value)}
                    >
                      {ROLE_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </Select>
                  </td>
                  <td className="px-6 py-4">
                    <Badge
                      variant={member.isActive ? 'success' : 'outline'}
                      className="text-xs"
                    >
                      {member.isActive ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </td>
                  <td className="px-6 py-4">
                    <Button
                      variant="outline"
                      size="default"
                      onClick={() => handleToggleActive(member.userId, member.isActive)}
                      className="text-xs h-7 px-2 py-0"
                    >
                      {member.isActive ? 'Desactivar' : 'Activar'}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
