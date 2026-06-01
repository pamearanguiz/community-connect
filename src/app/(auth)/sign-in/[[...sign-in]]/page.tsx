import { Suspense } from 'react'
import { SignIn } from '@clerk/nextjs'

export default function SignInPage() {
  return (
    <div className="flex flex-col gap-4">
      <div className="text-center mb-4">
        <h1 className="text-2xl font-bold text-slate-900">Iniciar Sesión</h1>
        <p className="text-slate-600 mt-2">Community Connect</p>
      </div>
      <Suspense fallback={<div className="h-96 bg-slate-300 rounded animate-pulse" />}>
        <SignIn />
      </Suspense>
    </div>
  )
}
