import { Suspense } from 'react'
import { ConciergeManager } from '@/components/admin/ConciergeManager'

export default function ConciergePage() {
  return (
    <Suspense fallback={<div className="h-96 bg-slate-200 rounded animate-pulse" />}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Gestión de conserjes</h1>
          <p className="text-slate-600 mt-2">Administra los conserjes y sus turnos</p>
        </div>

        <ConciergeManager />
      </div>
    </Suspense>
  )
}
