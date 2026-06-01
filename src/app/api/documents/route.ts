// GET: Listar documentos
// POST: Subir nuevo documento
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'

export async function GET(request: NextRequest) {
  return NextResponse.json({ documents: [] })
}

export async function POST(request: NextRequest) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // TODO: Procesar archivo y guardarlo en R2
  return NextResponse.json({ document: {} }, { status: 201 })
}
