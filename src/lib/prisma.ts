// Singleton de Prisma para evitar múltiples conexiones en desarrollo (hot reload)
// Import será dinámico cuando Prisma esté correctamente generado
type PrismaClient = any

// Declarar variable global para el singleton en desarrollo
declare global {
  // eslint-disable-next-line no-var
  var __prisma: any | undefined
}

function createPrismaClient() {
  // Este import será dinámico cuando Prisma esté configurado
  const { PrismaClient: PC } = require('@prisma/client')
  return new PC({
    log:
      process.env.NODE_ENV === 'development'
        ? ['query', 'error', 'warn']
        : ['error'],
  })
}

// En producción: crear nueva instancia
// En desarrollo: reutilizar la instancia global para evitar agotamiento de conexiones
export const prisma: any = globalThis.__prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalThis.__prisma = prisma
}
