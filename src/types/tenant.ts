// type TenantInfo from Prisma Community model
export type TenantInfo = {
  id: string
  name: string
  slug: string
  logoUrl: string | null
  primaryColor: string
  plan: string
  isActive: boolean
}

// Contexto completo del tenant con info del usuario
export interface TenantContext {
  community: TenantInfo
  userRole: string
}

// Para pasar al cliente (sin datos sensibles)
export interface PublicTenantInfo {
  name: string
  slug: string
  logoUrl: string | null
  primaryColor: string
}
