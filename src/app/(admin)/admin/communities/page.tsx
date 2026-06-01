import { Suspense } from 'react'
import { CreateCommunityForm } from '@/components/admin/CreateCommunityForm'

export default function CommunitiesPage() {
  return (
    <Suspense fallback={<div className="h-96 bg-slate-200 rounded animate-pulse" />}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Crear comunidad</h1>
          <p className="text-slate-600 mt-2">Agrega una nueva comunidad al sistema</p>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <CreateCommunityForm />
        </div>
      </div>
    </Suspense>
  )
}
