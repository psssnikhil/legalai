import { NextRequest, NextResponse } from 'next/server'
import { getIndianKanoonCaseDetails, formatForAI } from '@/lib/legalResearch'

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams
        const docId = searchParams.get('docId')
        const format = searchParams.get('format') // 'ai' for AI-formatted response

        if (!docId) {
            return NextResponse.json(
                { error: 'Document ID is required' },
                { status: 400 }
            )
        }

        const caseDetails = await getIndianKanoonCaseDetails(docId)

        if (format === 'ai') {
            const aiFormatted = formatForAI([caseDetails])
            return NextResponse.json({
                success: true,
                source: 'indian-kanoon',
                case: aiFormatted[0]
            })
        }

        return NextResponse.json({
            success: true,
            source: 'indian-kanoon',
            case: caseDetails
        })
    } catch (error) {
        console.error('Case details error:', error)
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to fetch case details'
            },
            { status: 500 }
        )
    }
}

