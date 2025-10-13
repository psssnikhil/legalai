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

        // Check if using demo data (mock cases have specific tids)
        const isDemoData = results.length > 0 && 
            ['1849308', '1712542', '1934103', '1953529', '1199182'].includes(results[0].tid)

        return NextResponse.json({
            success: true,
            query,
            totalResults: results.length,
            source: 'indian-kanoon',
            isDemoData,
            note: isDemoData ? 'Using demo data. Configure INDIAN_KANOON_API_TOKEN for live data.' : undefined,
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

        // Check if using demo data
        const isDemoData = results.length > 0 && 
            ['1849308', '1712542', '1934103', '1953529', '1199182'].includes(results[0].tid)

        return NextResponse.json({
            success: true,
            query,
            totalResults: results.length,
            source: 'indian-kanoon',
            isDemoData,
            note: isDemoData ? 'Using demo data. Configure INDIAN_KANOON_API_TOKEN for live data.' : undefined,
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

