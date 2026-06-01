// Cliente WhatsApp Business API (360dialog)
// Para enviar y recibir mensajes de WhatsApp

const WHATSAPP_API_URL = 'https://waba.360dialog.io/v1'
const WHATSAPP_API_KEY = process.env.WHATSAPP_API_KEY || ''

/**
 * sendWhatsAppMessage — Envía un mensaje a través de WhatsApp Business API
 * @param to - Número de teléfono destino (con código de país, ej: +56912345678)
 * @param message - Contenido del mensaje
 * @returns ID del mensaje enviado
 */
export async function sendWhatsAppMessage(
  to: string,
  message: string,
): Promise<string | null> {
  if (!WHATSAPP_API_KEY) {
    console.warn('WHATSAPP_API_KEY no configurado')
    return null
  }

  try {
    const response = await fetch(`${WHATSAPP_API_URL}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'D360-API-KEY': WHATSAPP_API_KEY,
      },
      body: JSON.stringify({
        to: to.replace(/\D/g, ''), // Solo dígitos
        type: 'text',
        text: { body: message },
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      console.error('Error enviando WhatsApp:', error)
      return null
    }

    const data = (await response.json()) as any
    return data.messages?.[0]?.id ?? null
  } catch (error) {
    console.error('Error en sendWhatsAppMessage:', error)
    return null
  }
}

/**
 * parseIncomingWhatsAppMessage — Parsea un mensaje entrante del webhook de WhatsApp
 * @param body - Body del webhook
 * @returns Datos del mensaje o null si es inválido
 */
export interface IncomingWhatsAppMessage {
  from: string
  content: string
  messageId: string
  timestamp: Date
  type: string // 'text', 'image', 'document', etc.
}

export function parseIncomingWhatsAppMessage(body: any): IncomingWhatsAppMessage | null {
  try {
    // 360dialog envía los mensajes en estructura estándar de WebhookEntry
    const messages = body.entry?.[0]?.changes?.[0]?.value?.messages
    if (!messages || messages.length === 0) return null

    const msg = messages[0]
    if (!msg.text?.body) return null // Solo procesar mensajes de texto

    return {
      from: msg.from,
      content: msg.text.body,
      messageId: msg.id,
      timestamp: new Date(parseInt(msg.timestamp) * 1000),
      type: msg.type || 'text',
    }
  } catch {
    return null
  }
}

/**
 * Validar el token del webhook (para verificación inicial de 360dialog)
 */
export function validateWhatsAppWebhookToken(
  token: string,
  verifyToken: string,
): boolean {
  return token === verifyToken
}
