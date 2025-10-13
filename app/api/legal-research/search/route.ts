import { NextRequest, NextResponse } from 'next/server'
import { searchIndianKanoon, integratedCaseSearch } from '@/lib/legalResearch'

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams
        const query = searchParams.get('query')
        const limit = parseInt(searchParams.get('limit') || '10')
        const detailed = searchParams.get('detailed') === 'true'

        if (!query) {
            return NextResponse.json(
                { error: 'Query parameter is required' },
                { status: 400 }
            )
        }

        let results

        if (detailed) {
            // Integrated search with full case details
            results = await integratedCaseSearch(query, limit)
        } else {
            // Quick search
            results = await searchIndianKanoon(query, limit)
        }

        return NextResponse.json({
            success: true,
            query,
            totalResults: results.length,
            source: 'indian-kanoon',
            cases: results
        })
    } catch (error) {
        console.error('Legal research search error:', error)
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to search legal cases'
            },
            { status: 500 }
        )
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { query, limit = 10, detailed = false } = body

        if (!query) {
            return NextResponse.json(
                { error: 'Query is required' },
                { status: 400 }
            )
        }

        let results

        if (detailed) {
            results = await integratedCaseSearch(query, limit)
        } else {
            results = await searchIndianKanoon(query, limit)
        }

        return NextResponse.json({
            success: true,
            query,
            totalResults: results.length,
            source: 'indian-kanoon',
            cases: results
        })
    } catch (error) {
        console.error('Legal research search error:', error)
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to search legal cases'
            },
            { status: 500 }
        )
    }
}

