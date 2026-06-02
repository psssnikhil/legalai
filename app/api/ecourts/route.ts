import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const cnr = searchParams.get('cnr')?.trim().toUpperCase()

    if (!cnr) {
      return NextResponse.json({ error: 'CNR number is required' }, { status: 400 })
    }

    // Basic CNR format check — 16 alphanumeric characters
    if (!/^[A-Z0-9]{16}$/.test(cnr)) {
      return NextResponse.json({ error: 'Invalid CNR format. CNR should be 16 characters (e.g. DLND010012342015)' }, { status: 400 })
    }

    const apiKey = process.env.ECOURTS_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'eCourts API key not configured. Please add ECOURTS_API_KEY to your environment variables.' }, { status: 503 })
    }

    const response = await fetch(`https://webapi.ecourtsindia.com/api/partner/case/${cnr}`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json({ error: 'Case not found. Please check the CNR number.' }, { status: 404 })
      }
      if (response.status === 401) {
        return NextResponse.json({ error: 'Invalid API key. Please check your ECOURTS_API_KEY.' }, { status: 401 })
      }
      const text = await response.text()
      return NextResponse.json({ error: `eCourts API error: ${response.status}`, detail: text }, { status: response.status })
    }

    const data = await response.json()
    return NextResponse.json(data)

  } catch (error) {
    console.error('[ecourts] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch case details. Please try again.' },
      { status: 500 }
    )
  }
}
