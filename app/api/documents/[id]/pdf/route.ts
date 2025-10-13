import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getSignedDownloadUrl } from '@/lib/s3'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('[pdf] Fetching document:', params.id)
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      console.log('[pdf] Unauthorized - no session')
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    // Get document from database
    const document = await prisma.document.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        userId: true,
        originalName: true,
        mimeType: true,
        binaryData: true,
        s3Key: true,
        s3Url: true,
      }
    })

    if (!document) {
      console.log('[pdf] Document not found:', params.id)
      return NextResponse.json({ message: 'Document not found' }, { status: 404 })
    }

    // Verify user owns the document
    if (document.userId !== session.user.id) {
      console.log('[pdf] Forbidden - user does not own document')
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 })
    }

    console.log('[pdf] Document found, storage:', document.s3Key ? 'S3' : 'Database')

    // If stored in S3, redirect to signed URL
    if (document.s3Key) {
      console.log('[pdf] Fetching S3 signed URL for:', document.s3Key)
      const signedUrlResult = await getSignedDownloadUrl(document.s3Key, 3600)
      
      if (signedUrlResult.success) {
        console.log('[pdf] Redirecting to S3 signed URL')
        return NextResponse.redirect(signedUrlResult.url)
      } else {
        console.error('[pdf] Failed to get S3 signed URL:', signedUrlResult.error)
        // Fall through to try database storage
      }
    }

    // Serve from database binary data
    if (document.binaryData) {
      console.log('[pdf] Serving from database, size:', document.binaryData.length)
      // Convert Buffer to Uint8Array for NextResponse compatibility
      const uint8Array = new Uint8Array(document.binaryData)
      return new NextResponse(uint8Array, {
        status: 200,
        headers: {
          'Content-Type': document.mimeType || 'application/pdf',
          'Content-Disposition': `inline; filename="${document.originalName}"`,
          'Cache-Control': 'private, max-age=3600',
        },
      })
    }

    // No binary data available
    console.log('[pdf] No binary data available for document')
    return NextResponse.json(
      { 
        error: 'Document content not available',
        message: 'The document file could not be found in storage'
      },
      { status: 404 }
    )

  } catch (error) {
    console.error('[pdf] Error fetching PDF:', error)
    return NextResponse.json(
      { message: 'Error fetching PDF', error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}

