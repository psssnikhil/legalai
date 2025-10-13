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
    const caseId = formData.get('caseId') as string | null
    const clientId = formData.get('clientId') as string | null

    console.log('[upload] FormData parsed, files:', files?.length, 'sessionId:', sessionId, 'caseId:', caseId, 'clientId:', clientId)

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

        // Try to upload to S3 first, fallback to database storage
        const fileKey = generateFileKey(session.user.id, file.name, 'document')
        console.log(`[upload] Generated file key: ${fileKey}`)

        let s3Key: string | null = null
        let s3Url: string | null = null
        let binaryData: Buffer | null = null

        // Attempt S3 upload
        const s3Result = await uploadToS3(buffer, fileKey, file.type)

        if (s3Result.success) {
          console.log(`[upload] File uploaded to S3: ${s3Result.key}`)
          s3Key = s3Result.key
          s3Url = s3Result.location
        } else {
          console.log(`[upload] S3 upload failed (${s3Result.error}), storing in database`)
          // Store binary in database as fallback
          binaryData = buffer
        }

        // Handle session-based document linking
        let messageIdForDocument: string | null = null

        if (sessionId && sessionId !== 'current-session') {
          // Link document to an existing chat session
          console.log(`[upload] Linking document to session: ${sessionId}`)

          // Find or create a "document upload" message in this session
          const uploadMessage = await prisma.chatMessage.create({
            data: {
              content: `📎 Uploaded document: ${file.name}`,
              role: 'system',
              sessionId: sessionId,
            }
          })

          messageIdForDocument = uploadMessage.id
          console.log(`[upload] Created upload message with ID: ${uploadMessage.id}`)
        }

        // Save to database
        const document = await prisma.document.create({
          data: {
            filename: fileKey,
            originalName: file.name,
            mimeType: file.type,
            size: file.size,
            content: processed.text,
            binaryData: binaryData,
            s3Key: s3Key,
            s3Url: s3Url,
            analysis: JSON.stringify({
              keyInfo,
              metadata: processed.metadata
            }),
            userId: session.user.id,
            messageId: messageIdForDocument,
            caseId: caseId || null,
          }
        })

        console.log(`[upload] Document saved to database with ID: ${document.id}${messageIdForDocument ? ` linked to message: ${messageIdForDocument}` : ''} (storage: ${s3Key ? 'S3' : 'Database'})`)

        results.push({
          success: true,
          filename: file.name,
          documentId: document.id,
          keyInfo,
          metadata: processed.metadata,
          storage: s3Key ? 's3' : 'database'
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
      success: true,
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
      success: false,
      message,
      error: error instanceof Error ? error.stack : String(error)
    }, { status: 500 })
  }
}
