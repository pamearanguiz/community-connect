// GET: Listar comunicados
// POST: Crear nuevo comunicado
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'

export async function GET(request: NextRequest) {
  // Los comunicados son públicos para los residentes
  return NextResponse.json({ announcements: [] })
}

export async function POST(request: NextRequest) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  // TODO: Crear comunicado (requiere rol admin)
  return NextResponse.json({ announcement: {} }, { status: 201 })
}
