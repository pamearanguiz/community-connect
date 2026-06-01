'use client'

// Hook para acceder al tenant actual desde Client Components
// El tenant se inyecta en el layout y está disponible vía un meta tag
export function useTenant() {
  // En development, el tenant viene como query param
  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search)
    const slug = params.get('slug') || 'condominio-demo'
    return { slug }
  }
  return { slug: null }
}
