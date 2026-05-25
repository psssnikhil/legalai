import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { caseId } = await request.json()
    if (!caseId) return NextResponse.json({ error: 'caseId is required' }, { status: 400 })

    const caseRecord = await prisma.case.findFirst({ where: { id: caseId, userId: session.user.id } })
    if (!caseRecord) return NextResponse.json({ error: 'Case not found' }, { status: 404 })

    // Return existing folder if already created
    if (caseRecord.googleDriveFolderUrl) {
      return NextResponse.json({
        folderId: caseRecord.googleDriveFolderId,
        folderUrl: caseRecord.googleDriveFolderUrl,
      })
    }

    if (!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY) {
      return NextResponse.json(
        {
          error: 'Google Drive not configured. Add GOOGLE_SERVICE_ACCOUNT_EMAIL and GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY to environment.',
          needsConfig: true,
        },
        { status: 400 }
      )
    }

    const { createCaseFolder } = await import('@/lib/google-drive-service')
    const folderId = await createCaseFolder(caseRecord.title)

    if (!folderId) {
      return NextResponse.json({ error: 'Failed to create Drive folder' }, { status: 500 })
    }

    const folderUrl = `https://drive.google.com/drive/folders/${folderId}`
    await prisma.case.update({
      where: { id: caseId },
      data: { googleDriveFolderId: folderId, googleDriveFolderUrl: folderUrl },
    })

    return NextResponse.json({ folderId, folderUrl, message: 'Drive folder created' })
  } catch (error) {
    console.error('Drive error:', error)
    return NextResponse.json({ error: 'An error occurred' }, { status: 500 })
  }
}
