// Webhook de Clerk para sincronizar usuarios
// Se ejecuta cuando un usuario se crea o actualiza en Clerk
import { Webhook } from 'svix'
import { headers } from 'next/headers'
import { syncClerkUserToPrisma } from '@/lib/clerk'

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET
  if (!WEBHOOK_SECRET) {
    return new Response('Webhook secret not configured', { status: 500 })
  }

  const headerPayload = await headers()
  const svix_id = headerPayload.get('svix-id')
  const svix_timestamp = headerPayload.get('svix-timestamp')
  const svix_signature = headerPayload.get('svix-signature')

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Missing svix headers', { status: 400 })
  }

  const body = await req.text()
  const wh = new Webhook(WEBHOOK_SECRET)

  let evt: any
  try {
    evt = wh.verify(body, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    })
  } catch (err) {
    console.error('Error verifying webhook:', err)
    return new Response('Error verifying webhook', { status: 400 })
  }

  const eventType = evt.type
  if (eventType === 'user.created' || eventType === 'user.updated') {
    try {
      await syncClerkUserToPrisma(evt.data)
    } catch (error) {
      console.error('Error syncing user:', error)
      return new Response('Error syncing user', { status: 500 })
    }
  }

  return new Response('Webhook processed', { status: 200 })
}
