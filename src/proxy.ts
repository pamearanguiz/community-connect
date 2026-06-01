// Middleware de Next.js 16 para detección de multi-tenant y protección de rutas
// Detecta el subdominio de la request y lo pasa como header x-community-slug
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

// Rutas que requieren autenticación
const isResidentRoute = createRouteMatcher([
  '/tickets(.*)',
  '/announcements(.*)',
  '/documents(.*)',
  '/improvements(.*)',
  '/my-unit(.*)',
])

const isAdminRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/admin(.*)',
  '/(admin)(.*)',
])

// Rutas públicas (NO proteger con Clerk)
// - / (marketing)
// - /sign-in, /sign-up
// - /api/webhooks/*

export const proxy = clerkMiddleware(async (auth, request: NextRequest) => {
  // Detectar tenant desde el subdominio o cookie
  const hostname = request.headers.get('host') ?? ''
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const baseDomain = new URL(appUrl).hostname // ej: communityconnect.cl

  let slug: string | null = null

  if (hostname !== baseDomain && baseDomain && hostname.endsWith(`.${baseDomain}`)) {
    // Subdominio real: condominio-demo.communityconnect.cl
    slug = hostname.replace(`.${baseDomain}`, '')
  } else if (process.env.NODE_ENV === 'development') {
    // En desarrollo, leer desde query param o cookie para simular multitenant
    slug = request.nextUrl.searchParams.get('slug') ?? request.cookies.get('x-community-slug')?.value ?? 'default'
  }

  // Proteger rutas de residente y admin con Clerk
  if (isResidentRoute(request) || isAdminRoute(request)) {
    await auth.protect()
  }

  // Pasar el slug como header para que los Server Components lo lean via headers()
  const requestHeaders = new Headers(request.headers)

  if (slug) {
    requestHeaders.set('x-community-slug', slug)
  }

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  })

  if (slug) {
    // Guardar slug en cookie para que persista después de redirecciones
    response.cookies.set('x-community-slug', slug, {
      path: '/',
      maxAge: 60 * 60 * 24 // 24 horas
    })
  }

  return response
})

export const config = {
  matcher: [
    // Excluir archivos estáticos y rutas internas de Next.js
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
