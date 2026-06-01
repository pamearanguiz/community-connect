// Clasificación automática de tickets usando Anthropic Claude
// Requiere ANTHROPIC_API_KEY en variables de entorno
import Anthropic from '@anthropic-ai/sdk'

type TicketCategory = 'MAINTENANCE' | 'NOISE' | 'WATER_LEAK' | 'PARKING' | 'PACKAGE' | 'COMMON_EXPENSES' | 'SECURITY' | 'ADMINISTRATIVE' | 'OTHER'
type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

// Resultado de la clasificación IA
export interface TicketClassification {
  category: TicketCategory
  priority: TicketPriority
  aiSummary: string // Máximo 100 caracteres, tercera persona
  suggestedResponse: string // Respuesta empática de 2-3 oraciones para el residente
}

// Categorías disponibles para guiar al modelo
const CATEGORIAS_DISPONIBLES: TicketCategory[] = [
  'MAINTENANCE',
  'NOISE',
  'WATER_LEAK',
  'PARKING',
  'PACKAGE',
  'COMMON_EXPENSES',
  'SECURITY',
  'ADMINISTRATIVE',
  'OTHER',
]

const PRIORIDADES_DISPONIBLES: TicketPriority[] = ['LOW', 'MEDIUM', 'HIGH', 'URGENT']

/**
 * clasificarTicket — Usa Claude para categorizar, priorizar y responder a un ticket
 * @param titulo - Título del ticket
 * @param descripcion - Descripción detallada
 * @returns Clasificación con categoría, prioridad, resumen IA y respuesta sugerida
 */
export async function clasificarTicket(
  titulo: string,
  descripcion: string,
): Promise<TicketClassification> {
  const systemPrompt = `Eres el asistente de gestión de Community Connect, una plataforma de administración de comunidades residenciales en Chile.
Tu tarea es clasificar requerimientos de residentes y proporcionar respuestas empáticas y útiles.

CATEGORÍAS DISPONIBLES:
${CATEGORIAS_DISPONIBLES.join(', ')}

CRITERIOS DE PRIORIDAD:
- URGENT: Filtraciones activas, ascensor caído, seguridad comprometida, peligro inmediato
- HIGH: Problemas que afectan habitabilidad o múltiples unidades
- MEDIUM: Problemas de convivencia, mantención no urgente
- LOW: Consultas, solicitudes administrativas, problemas menores

INSTRUCCIONES:
1. Analiza el título y descripción cuidadosamente
2. Asigna la categoría más apropiada
3. Calcula la prioridad según los criterios
4. Genera un resumen muy breve (máximo 100 caracteres) en tercera persona
5. Redacta una respuesta empática (2-3 oraciones) confirmando recepción y próximos pasos

FORMATO DE RESPUESTA - JSON VÁLIDO, SIN TEXTO ADICIONAL:
{
  "category": "CATEGORIA",
  "priority": "PRIORIDAD",
  "aiSummary": "Resumen breve en tercera persona (máx 100 chars)",
  "suggestedResponse": "Respuesta empática confirmando recepción y explicando próximos pasos según la categoría"
}`

  const userPrompt = `Título: ${titulo}
Descripción: ${descripcion}`

  try {
    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 512,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    })

    // Extraer texto de la respuesta
    const contenido = message.content[0]
    if (contenido.type !== 'text') {
      throw new Error('Respuesta inesperada de Claude')
    }

    // Parsear JSON de la respuesta
    const resultado = JSON.parse(contenido.text) as TicketClassification

    // Validar que los valores estén en los enums permitidos
    if (!CATEGORIAS_DISPONIBLES.includes(resultado.category)) {
      resultado.category = 'OTHER'
    }
    if (!PRIORIDADES_DISPONIBLES.includes(resultado.priority)) {
      resultado.priority = 'MEDIUM'
    }

    // Validar longitudes
    if (resultado.aiSummary.length > 100) {
      resultado.aiSummary = resultado.aiSummary.slice(0, 100).trim()
    }

    return resultado
  } catch (error) {
    // Si falla el parseo, devolver clasificación por defecto
    console.error('Error clasificando ticket:', error)
    return {
      category: 'OTHER',
      priority: 'MEDIUM',
      aiSummary: titulo.slice(0, 100),
      suggestedResponse: `Hemos recibido tu requerimiento: "${titulo}". Nuestro equipo lo revisará pronto y te notificaremos del progreso.`,
    }
  }
}
