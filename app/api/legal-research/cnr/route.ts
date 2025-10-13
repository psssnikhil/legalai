import { NextRequest, NextResponse } from 'next/server'
import { searchECourtsByCNR } from '@/lib/legalResearch'

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams
        const cnr = searchParams.get('cnr')

        if (!cnr) {
            return NextResponse.json(
                { error: 'CNR number is required' },
                { status: 400 }
            )
        }

        const caseDetails = await searchECourtsByCNR(cnr)

        if (!caseDetails) {
            return NextResponse.json(
                { error: 'Case not found' },
                { status: 404 }
            )
        }

        return NextResponse.json({
            success: true,
            source: 'e-courts',
            case: caseDetails
        })
    } catch (error) {
        console.error('CNR search error:', error)
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to fetch case by CNR'
            },
            { status: 500 }
        )
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { cnr } = body

        if (!cnr) {
            return NextResponse.json(
                { error: 'CNR number is required' },
                { status: 400 }
            )
        }

        const caseDetails = await searchECourtsByCNR(cnr)

        if (!caseDetails) {
            return NextResponse.json(
                { error: 'Case not found' },
                { status: 404 }
            )
        }

        return NextResponse.json({
            success: true,
            source: 'e-courts',
            case: caseDetails
        })
    } catch (error) {
        console.error('CNR search error:', error)
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to fetch case by CNR'
            },
            { status: 500 }
        )
    }
}

