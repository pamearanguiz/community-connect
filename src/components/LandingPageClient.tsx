'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { CheckCircle2 } from 'lucide-react'

export function LandingPageClient() {
  const features = [
    'Gestión de requerimientos y tickets',
    'Comunicados y avisos a residentes',
    'Control de documentos y archivos',
    'Seguimiento de mejoras y proyectos',
    'Integración con WhatsApp',
    'Clasificación automática de tickets con IA',
  ]

  return (
    <div className="space-y-20">
      {/* Hero */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center space-y-6">
          <h1 className="text-5xl sm:text-6xl font-bold text-slate-900">
            Administración <span className="text-blue-600">moderna</span> para tu comunidad
          </h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            Community Connect es la plataforma todo-en-uno para gestionar comunidades residenciales
            en Chile. Comunica, administra y resuelve problemas de forma eficiente.
          </p>
          <div className="flex gap-4 justify-center pt-4">
            <Button asChild size="lg">
              <Link href="/sign-up">Comenzar Gratis</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/sign-in">Iniciar Sesión</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-slate-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-slate-900 mb-12">Características</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {features.map((feature) => (
              <div key={feature} className="flex items-start gap-3">
                <CheckCircle2 className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5" />
                <span className="text-slate-700">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <h2 className="text-3xl font-bold text-slate-900 mb-6">¿Listo para transformar tu comunidad?</h2>
        <Button asChild size="lg">
          <Link href="/sign-up">Regístrate Ahora</Link>
        </Button>
      </section>
    </div>
  )
}
