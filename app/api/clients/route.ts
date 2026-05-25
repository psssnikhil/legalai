import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Fetch all clients for the logged-in user
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get query parameters for filtering
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const search = searchParams.get('search')

    // Build where clause
    const where: any = {
      userId: user.id
    }

    if (status && status !== 'ALL') {
      where.status = status
    }

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
        { company: { contains: search } }
      ]
    }

    // Fetch clients with related data counts
    const clients = await prisma.client.findMany({
      where,
      include: {
        _count: {
          select: {
            cases: true,
            documents: true,
            hearings: true
          }
        },
        cases: {
          select: {
            id: true,
            status: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Transform the data to include computed fields
    const transformedClients = clients.map(client => ({
      ...client,
      activeCases: client.cases.filter(c => c.status === 'ACTIVE').length,
      totalCases: client._count.cases,
      totalDocuments: client._count.documents,
      totalHearings: client._count.hearings,
      customFields: client.customFields ? JSON.parse(client.customFields) : {}
    }))

    return NextResponse.json({ clients: transformedClients })
  } catch (error) {
    console.error('Error fetching clients:', error)
    return NextResponse.json(
      { error: 'Failed to fetch clients' },
      { status: 500 }
    )
  }
}

// POST - Create a new client
export async function POST(request: NextRequest) {
  try {
    console.log('POST /api/clients - Starting client creation')

    const session = await getServerSession(authOptions)
    console.log('Session:', { hasSession: !!session, email: session?.user?.email })

    if (!session?.user?.email) {
      console.log('Unauthorized: No session or email')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })
    console.log('User found:', { id: user?.id, email: user?.email })

    if (!user) {
      console.log('User not found in database')
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const body = await request.json()
    console.log('Request body:', body)

    const { name, email, phone, company, address, clientType, customFields } = body

    // Validate required fields
    if (!name || !email || !phone) {
      console.log('Validation failed: Missing required fields')
      return NextResponse.json(
        { error: 'Name, email, and phone are required' },
        { status: 400 }
      )
    }

    // Create the client
    console.log('Creating client in database...')
    const client = await prisma.client.create({
      data: {
        name,
        email,
        phone,
        company,
        address,
        clientType: clientType || 'INDIVIDUAL',
        status: 'ACTIVE',
        customFields: customFields ? JSON.stringify(customFields) : null,
        userId: user.id
      },
      include: {
        _count: {
          select: {
            cases: true,
            documents: true,
            hearings: true
          }
        }
      }
    })
    console.log('Client created successfully:', { id: client.id, name: client.name })

    const responseData = {
      client: {
        ...client,
        customFields: client.customFields ? JSON.parse(client.customFields) : {},
        activeCases: 0,
        totalCases: 0,
        totalDocuments: 0,
        totalHearings: 0
      }
    }

    console.log('Sending response:', responseData)
    return NextResponse.json(responseData, { status: 201 })
  } catch (error) {
    console.error('Error creating client:', error)
    return NextResponse.json(
      { error: 'Failed to create client', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

