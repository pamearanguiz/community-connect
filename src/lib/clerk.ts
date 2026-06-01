// Helpers para integración con Clerk y búsqueda de usuarios
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

/**
 * getCurrentUser — Obtiene el usuario actual desde Clerk y lo busca en Prisma
 * Retorna null si no está autenticado o no existe en la BD
 */
export async function getCurrentUser() {
  const { userId } = await auth()
  if (!userId) return null

  try {
    let user = await prisma.user.findUnique({
      where: { clerkId: userId },
    })

    // Si el usuario no existe, crear uno nuevo
    if (!user) {
      user = await prisma.user.create({
        data: {
          clerkId: userId,
          email: `user-${userId}@local.test`,
          name: `Usuario ${userId.slice(0, 8)}`,
          isActive: true,
        },
      })
    }

    return user
  } catch (error) {
    console.error('Error getting user:', error)
    return null
  }
}

/**
 * syncClerkUserToPrisma — Sincroniza un usuario de Clerk a Prisma
 * Se llama desde el webhook de Clerk cuando se crea o actualiza un usuario
 */
export async function syncClerkUserToPrisma(clerkUser: any) {
  try {
    return await prisma.user.upsert({
      where: { clerkId: clerkUser.id },
      create: {
        clerkId: clerkUser.id,
        email: clerkUser.email_addresses?.[0]?.email_address || '',
        name: clerkUser.first_name
          ? `${clerkUser.first_name} ${clerkUser.last_name || ''}`.trim()
          : clerkUser.username || 'Usuario',
        phone: clerkUser.phone_numbers?.[0]?.phone_number,
        avatarUrl: clerkUser.profile_image_url,
        isActive: true,
      },
      update: {
        email: clerkUser.email_addresses?.[0]?.email_address || undefined,
        name: clerkUser.first_name
          ? `${clerkUser.first_name} ${clerkUser.last_name || ''}`.trim()
          : undefined,
        phone: clerkUser.phone_numbers?.[0]?.phone_number || undefined,
        avatarUrl: clerkUser.profile_image_url || undefined,
      },
    })
  } catch (error) {
    console.error('Error syncing user to Prisma:', error)
    return null
  }
}

/**
 * getUserRoleInCommunity — Obtiene el rol del usuario en una comunidad específica
 */
export async function getUserRoleInCommunity(
  userId: string,
  communityId: string,
) {
  try {
    const member = await prisma.communityMember.findFirst({
      where: { userId, communityId, isActive: true },
      select: { role: true },
    })
    return member?.role ?? null
  } catch {
    return null
  }
}
