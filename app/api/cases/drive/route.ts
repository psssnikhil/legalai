import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { caseId } = await request.json()
  // TODO: Implement Google Drive folder creation
  return NextResponse.json({
    message: 'Google Drive integration coming soon',
    caseId
  })
}
