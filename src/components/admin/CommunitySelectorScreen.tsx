'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

interface Community {
  id: string
  slug: string
  name: string
  logoUrl: string | null
  primaryColor: string | null
  plan?: string
  _count?: {
    members: number
    units: number
  }
}

interface CommunitySelectorScreenProps {
  communities: Community[]
}

export function CommunitySelectorScreen({ communities }: CommunitySelectorScreenProps) {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl space-y-8">
        {/* Encabezado */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-white">Selecciona tu comunidad</h1>
          <p className="text-slate-300 text-lg">Elige la comunidad que deseas administrar</p>
        </div>

        {/* Grid de comunidades */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {communities.map((community) => (
            <button
              key={community.id}
              onClick={() => router.push(`/admin/dashboard?slug=${community.slug}`)}
              className="group relative bg-white rounded-2xl border border-slate-200 p-6 shadow-lg hover:shadow-2xl transition-all hover:border-blue-400"
            >
              <div className="space-y-4">
                {/* Logo o inicial */}
                <div className="h-12 w-12 rounded-lg flex items-center justify-center text-white font-bold text-xl bg-blue-600">
                  {community.logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={community.logoUrl}
                      alt={community.name}
                      className="h-full w-full object-contain rounded"
                    />
                  ) : (
                    community.name[0]
                  )}
                </div>

                {/* Nombre */}
                <div>
                  <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                    {community.name}
                  </h3>
                  <p className="text-sm text-slate-500 mt-1">{community.slug}</p>
                </div>

                {/* Estadísticas */}
                {community._count && (
                  <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-100">
                    <div>
                      <p className="text-2xl font-bold text-slate-900">{community._count.members}</p>
                      <p className="text-xs text-slate-500">Residentes</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-slate-900">{community._count.units}</p>
                      <p className="text-xs text-slate-500">Unidades</p>
                    </div>
                  </div>
                )}

                {/* Plan badge */}
                {community.plan && (
                  <div className="pt-2">
                    <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                      {community.plan}
                    </span>
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>

        {/* Botón crear nueva comunidad */}
        <div className="flex justify-center pt-8">
          <Button
            onClick={() => router.push('/admin/communities')}
            size="lg"
            className="bg-green-600 hover:bg-green-700"
          >
            + Crear nueva comunidad
          </Button>
        </div>
      </div>
    </div>
  )
}
