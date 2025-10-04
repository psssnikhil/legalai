import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { processDocument, extractKeyInformation } from '@/lib/documentProcessor'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  return NextResponse.json({ ok: true })
}

export async function POST(request: NextRequest) {
  try {
    console.log('[upload] start')
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      console.error('[upload] No session or user ID')
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    console.log('[upload] User authenticated:', session.user.id)

    const formData = await request.formData()
    const files = formData.getAll('files') as File[]
    const sessionId = formData.get('sessionId') as string

    console.log('[upload] FormData parsed, files:', files?.length, 'sessionId:', sessionId)

    if (!files || files.length === 0) {
      console.error('[upload] No files provided')
      return NextResponse.json({ message: 'No files provided' }, { status: 400 })
    }

    console.log(`[upload] Processing ${files.length} file(s)`)
    const results: any[] = []

    // Dynamic import S3 utils to avoid bundling/import-time issues
    const { uploadToS3, generateFileKey } = await import('@/lib/s3')
    console.log('[upload] S3 utils loaded')

    for (const file of files) {
      try {
        console.log(`[upload] Processing file: ${file.name}, type: ${file.type}, size: ${file.size}`)

        // Validate file
        const maxSize = 10 * 1024 * 1024 // 10MB
        if (file.size > maxSize) {
          console.log(`[upload] File too large: ${file.name}`)
          results.push({
            success: false,
            filename: file.name,
            error: 'File too large (max 10MB)'
          })
          continue
        }

        // Process file
        console.log(`[upload] Converting file to buffer: ${file.name}`)
        const arrBuf = await file.arrayBuffer()
        const buffer = Buffer.from(arrBuf)
        console.log(`[upload] Buffer created, size: ${buffer.length}`)

        console.log(`[upload] Processing document: ${file.name}`)
        const processed = await processDocument(buffer, file.type, file.name)
        console.log(`[upload] Document processed, text length: ${processed.text?.length || 0}`)

        // Extract key information
        console.log(`[upload] Extracting key information: ${file.name}`)
        const keyInfo = extractKeyInformation(processed.text)
        console.log(`[upload] Key info extracted`)

        // Upload to S3 (skip for now to isolate the error)
        const fileKey = generateFileKey(session.user.id, file.name, 'document')
        console.log(`[upload] Generated file key: ${fileKey}`)

        // Temporarily bypass S3 upload to test if that's causing the issue
        console.log(`[upload] Skipping S3 upload for testing, saving to database directly`)

        // Save to database
        const document = await prisma.document.create({
          data: {
            filename: fileKey,
            originalName: file.name,
            mimeType: file.type,
            size: file.size,
            content: processed.text,
            analysis: JSON.stringify({
              keyInfo,
              metadata: processed.metadata
            }),
            userId: session.user.id,
            messageId: sessionId ? undefined : null,
          }
        })

        console.log(`[upload] Document saved to database with ID: ${document.id}`)

        results.push({
          success: true,
          filename: file.name,
          documentId: document.id,
          keyInfo,
          metadata: processed.metadata
        })

      } catch (error) {
        console.error(`[upload] Error processing file ${file.name}:`, error)
        console.error('[upload] Error stack:', error instanceof Error ? error.stack : 'No stack')
        results.push({
          success: false,
          filename: file.name,
          error: error instanceof Error ? error.message : 'Processing failed'
        })
      }
    }

    const successCount = results.filter(r => r.success).length
    const failureCount = results.filter(r => !r.success).length

    console.log(`[upload] Complete - Success: ${successCount}, Failed: ${failureCount}`)

    return NextResponse.json({
      message: `Processed ${successCount} files successfully${failureCount > 0 ? `, ${failureCount} failed` : ''}`,
      results,
      summary: {
        total: files.length,
        successful: successCount,
        failed: failureCount
      }
    })

  } catch (error) {
    console.error('[upload] Top-level error:', error)
    console.error('[upload] Error stack:', error instanceof Error ? error.stack : 'No stack')
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({
      message,
      error: error instanceof Error ? error.stack : String(error)
    }, { status: 500 })
  }
}
