import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
    return NextResponse.json({ ok: true, message: 'Test endpoint working' })
}

export async function POST(request: NextRequest) {
    try {
        console.log('[upload-test] Starting document upload with extraction')

        const formData = await request.formData()
        const files = formData.getAll('files') as File[]
        const sessionId = formData.get('sessionId') as string

        console.log('[upload-test] Files received:', files.length, 'SessionId:', sessionId)

        if (!files || files.length === 0) {
            return NextResponse.json({
                success: false,
                message: 'No files provided'
            }, { status: 400 })
        }

        // Import document processor
        const { processDocument, extractKeyInformation } = await import('@/lib/documentProcessor')

        const results = []

        for (const file of files) {
            try {
                console.log('[upload-test] Processing:', file.name, file.type, file.size)

                const buffer = await file.arrayBuffer()
                const fileBuffer = Buffer.from(buffer)

                // Process the document to extract text
                const processed = await processDocument(fileBuffer, file.type, file.name)
                console.log('[upload-test] Text extracted, length:', processed.text.length)

                // Extract key legal information
                const keyInfo = extractKeyInformation(processed.text)
                console.log('[upload-test] Key info extracted:', Object.keys(keyInfo))

                // Store in memory (in production, save to database)
                // For now, we'll return it to the client
                results.push({
                    filename: file.name,
                    size: file.size,
                    type: file.type,
                    textLength: processed.text.length,
                    wordCount: processed.metadata.wordCount,
                    extractedText: processed.text.substring(0, 5000), // First 5000 chars for context
                    keyInfo: {
                        parties: keyInfo.potentialParties,
                        caseTypes: keyInfo.potentialCaseTypes,
                        jurisdictions: keyInfo.potentialJurisdictions,
                        dates: keyInfo.dates,
                        amounts: keyInfo.amounts
                    }
                })

            } catch (fileError) {
                console.error('[upload-test] Error processing file:', fileError)
                results.push({
                    filename: file.name,
                    error: fileError instanceof Error ? fileError.message : 'Processing failed'
                })
            }
        }

        console.log('[upload-test] Upload complete!')

        return NextResponse.json({
            success: true,
            message: 'Documents processed successfully',
            results,
            summary: {
                total: files.length,
                successful: results.filter(r => !r.error).length,
                failed: results.filter(r => r.error).length
            }
        })

    } catch (error) {
        console.error('[upload-test] Error:', error)
        return NextResponse.json({
            success: false,
            message: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined
        }, { status: 500 })
    }
}

