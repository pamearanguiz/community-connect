'use client'

import { useEffect, useState } from 'react'
import { Phone } from 'lucide-react'

interface Concierge {
  name: string
  avatarUrl: string | null
  phone: string | null
}

export function ConciergeOnDutyWidget() {
  const [concierge, setConcierge] = useState<Concierge | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchConcierge = async () => {
      try {
        setLoading(true)
        setError(null)
        const response = await fetch('/api/concierge/current')

        if (!response.ok) {
          throw new Error('Error al obtener conserje')
        }

        const data = await response.json()
        setConcierge(data.concierge || null)
      } catch (err) {
        console.error('Error fetching concierge:', err)
        setError(err instanceof Error ? err.message : 'Error desconocido')
        setConcierge(null)
      } finally {
        setLoading(false)
      }
    }

    fetchConcierge()

    // Revalidar cada 30 minutos
    const interval = setInterval(fetchConcierge, 30 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <section className="bg-gradient-to-br from-blue-50 to-slate-50 rounded-xl border border-slate-200 p-6">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-full bg-slate-200 animate-pulse" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-slate-200 rounded w-32 animate-pulse" />
            <div className="h-3 bg-slate-100 rounded w-24 animate-pulse" />
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="bg-gradient-to-br from-blue-50 to-slate-50 rounded-xl border border-slate-200 p-6">
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-4">
        Conserje de turno
      </p>

      {concierge ? (
        <div className="flex items-start gap-4">
          {concierge.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={concierge.avatarUrl}
              alt={concierge.name}
              className="h-16 w-16 rounded-full object-cover flex-shrink-0"
            />
          ) : (
            <div className="h-16 w-16 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xl flex-shrink-0">
              {concierge.name[0]}
            </div>
          )}

          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-slate-900 text-lg">{concierge.name}</h3>
            {concierge.phone && (
              <a
                href={`tel:${concierge.phone}`}
                className="inline-flex items-center gap-2 mt-2 px-3 py-2 bg-white rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors text-sm font-medium text-slate-700"
              >
                <Phone className="h-4 w-4" />
                {concierge.phone}
              </a>
            )}
          </div>
        </div>
      ) : (
        <div className="text-center py-4">
          <p className="text-slate-600">Sin conserje en este momento</p>
          <p className="text-xs text-slate-400 mt-1">
            Contacta con administración para emergencias
          </p>
        </div>
      )}

      {error && (
        <p className="text-xs text-red-600 mt-3">
          {error}
        </p>
      )}
    </section>
  )
}
