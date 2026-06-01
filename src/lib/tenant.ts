// Servicio de tenant: lee el header x-community-slug y busca la comunidad en BD
// Usa React cache() para deduplicar queries dentro del mismo request
import { cache } from 'react'
import { headers } from 'next/headers'
import { prisma } from '@/lib/prisma'
import type { TenantInfo } from '@/types'

/**
 * getTenantSlug — Lee el slug desde el header inyectado por proxy.ts
 * Debe llamarse en Server Components (accede a headers())
 */
export const getTenantSlug = cache(async (): Promise<string | null> => {
  const headersList = await headers()
  return headersList.get('x-community-slug')
})

/**
 * getTenant — Obtiene los datos del tenant actual desde la BD
 * Usa React cache() para ejecutar la query SOLO UNA VEZ por request,
 * aunque sea llamada desde múltiples Server Components en el árbol.
 */
export const getTenant = cache(async (): Promise<TenantInfo | null> => {
  const slug = await getTenantSlug()
  if (!slug) return null

  try {
    const community = await prisma.community.findUnique({
      where: { slug, isActive: true },
      select: {
        id: true,
        name: true,
        slug: true,
        logoUrl: true,
        primaryColor: true,
        plan: true,
        isActive: true,
      },
    })

    return community
  } catch (error) {
    console.error('Error fetching tenant:', error)
    return null
  }
})

/**
 * requireTenant — Igual que getTenant pero lanza error si no encuentra el tenant.
 * Usar en layouts de (resident) y (admin) donde el tenant es obligatorio.
 */
export const requireTenant = cache(async (): Promise<TenantInfo> => {
  const tenant = await getTenant()
  if (!tenant) {
    // notFound() del App Router mostrará la página 404 del proyecto
    const { notFound } = await import('next/navigation')
    notFound()
  }
  return tenant as TenantInfo
})
