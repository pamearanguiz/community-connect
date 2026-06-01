// Webhook de WhatsApp para recibir mensajes entrantes
import { NextRequest, NextResponse } from 'next/server'
import { parseIncomingWhatsAppMessage, validateWhatsAppWebhookToken } from '@/lib/whatsapp'

export async function GET(request: NextRequest) {
  // Verificación inicial de WhatsApp
  const token = request.nextUrl.searchParams.get('hub.verify_token')
  const challenge = request.nextUrl.searchParams.get('hub.challenge')

  if (!token) {
    return NextResponse.json({ error: 'No token' }, { status: 400 })
  }

  if (validateWhatsAppWebhookToken(token, process.env.WHATSAPP_WEBHOOK_SECRET || '')) {
    return NextResponse.json(challenge)
  }

  return NextResponse.json({ error: 'Invalid token' }, { status: 403 })
}

export async function POST(request: NextRequest) {
  const body = await request.json()

  const message = parseIncomingWhatsAppMessage(body)
  if (!message) {
    return NextResponse.json({ ok: true })
  }

  console.log('WhatsApp message received:', message)

  // TODO: Crear ticket o responder al mensaje
  // Por ahora solo loguear

  return NextResponse.json({ ok: true })
}
