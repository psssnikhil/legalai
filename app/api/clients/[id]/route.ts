import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

// GET - Fetch a single client
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const client = await prisma.client.findFirst({
      where: {
        id: params.id,
        userId: user.id
      },
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
            title: true,
            status: true,
            createdAt: true
          },
          orderBy: {
            createdAt: 'desc'
          }
        },
        documents: {
          select: {
            id: true,
            originalName: true,
            createdAt: true
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: 10
        },
        hearings: {
          select: {
            id: true,
            title: true,
            hearingDate: true,
            status: true
          },
          orderBy: {
            hearingDate: 'desc'
          },
          take: 10
        }
      }
    })

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    return NextResponse.json({
      client: {
        ...client,
        customFields: client.customFields ? JSON.parse(client.customFields) : {},
        activeCases: client.cases.filter(c => c.status === 'ACTIVE').length,
        totalCases: client._count.cases,
        totalDocuments: client._count.documents,
        totalHearings: client._count.hearings
      }
    })
  } catch (error) {
    console.error('Error fetching client:', error)
    return NextResponse.json(
      { error: 'Failed to fetch client' },
      { status: 500 }
    )
  }
}

// PUT - Update a client
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Check if client exists and belongs to user
    const existingClient = await prisma.client.findFirst({
      where: {
        id: params.id,
        userId: user.id
      }
    })

    if (!existingClient) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    const body = await request.json()
    const { name, email, phone, company, address, clientType, status, customFields } = body

    // Update the client
    const client = await prisma.client.update({
      where: { id: params.id },
      data: {
        ...(name && { name }),
        ...(email && { email }),
        ...(phone && { phone }),
        ...(company !== undefined && { company }),
        ...(address !== undefined && { address }),
        ...(clientType && { clientType }),
        ...(status && { status }),
        ...(customFields !== undefined && { 
          customFields: customFields ? JSON.stringify(customFields) : null 
        })
      },
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
      }
    })

    return NextResponse.json({
      client: {
        ...client,
        customFields: client.customFields ? JSON.parse(client.customFields) : {},
        activeCases: client.cases.filter(c => c.status === 'ACTIVE').length,
        totalCases: client._count.cases,
        totalDocuments: client._count.documents,
        totalHearings: client._count.hearings
      }
    })
  } catch (error) {
    console.error('Error updating client:', error)
    return NextResponse.json(
      { error: 'Failed to update client' },
      { status: 500 }
    )
  }
}

// DELETE - Delete a client
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Check if client exists and belongs to user
    const existingClient = await prisma.client.findFirst({
      where: {
        id: params.id,
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

    if (!existingClient) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    // Check if client has associated data
    const hasAssociatedData = 
      existingClient._count.cases > 0 || 
      existingClient._count.documents > 0 || 
      existingClient._count.hearings > 0

    if (hasAssociatedData) {
      // Archive instead of delete if there's associated data
      await prisma.client.update({
        where: { id: params.id },
        data: { status: 'ARCHIVED' }
      })

      return NextResponse.json({ 
        message: 'Client archived successfully (has associated data)',
        archived: true
      })
    } else {
      // Delete if no associated data
      await prisma.client.delete({
        where: { id: params.id }
      })

      return NextResponse.json({ 
        message: 'Client deleted successfully',
        deleted: true
      })
    }
  } catch (error) {
    console.error('Error deleting client:', error)
    return NextResponse.json(
      { error: 'Failed to delete client' },
      { status: 500 }
    )
  }
}

