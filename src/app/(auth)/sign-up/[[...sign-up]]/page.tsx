import { Suspense } from 'react'
import { SignUp } from '@clerk/nextjs'

export default function SignUpPage() {
  return (
    <div className="flex flex-col gap-4">
      <div className="text-center mb-4">
        <h1 className="text-2xl font-bold text-slate-900">Registrarse</h1>
        <p className="text-slate-600 mt-2">Community Connect</p>
      </div>
      <Suspense fallback={<div className="h-96 bg-slate-300 rounded animate-pulse" />}>
        <SignUp />
      </Suspense>
    </div>
  )
}
