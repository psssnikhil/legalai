import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams

    // Single case lookup by ID
    const id = searchParams.get('id')
    if (id) {
      const caseItem = await prisma.case.findFirst({
        where: { id, userId: session.user.id },
        include: {
          documents: { select: { id: true, filename: true, originalName: true, size: true, createdAt: true, s3Url: true } },
          _count: { select: { documents: true, chatSessions: true, hearings: true } }
        }
      })
      if (!caseItem) {
        return NextResponse.json({ message: 'Case not found' }, { status: 404 })
      }
      return NextResponse.json({ case: caseItem })
    }

    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || 'all'
    const caseType = searchParams.get('type') || 'all'
    const sortBy = searchParams.get('sortBy') || 'recent'
    const quickFilter = searchParams.get('quickFilter') || ''
    const tab = searchParams.get('tab') || 'all'

    // Build the where clause
    let where: any = {
      userId: session.user.id,
      isDraft: false
    }

    // Apply tab filters
    if (tab !== 'all') {
      if (tab === 'active') {
        where.status = 'ACTIVE'
      } else if (tab === 'pending') {
        where.status = 'PENDING'
      } else if (tab === 'review') {
        where.status = 'REVIEW'
      }
    }

    // Apply status filter
    if (status !== 'all') {
      where.status = status.toUpperCase()
    }

    // Apply case type filter
    if (caseType !== 'all') {
      where.caseType = caseType
    }

    // Apply quick filters
    const now = new Date()
    if (quickFilter === 'urgent') {
      where.status = 'URGENT'
    } else if (quickFilter === 'thisWeek') {
      const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
      where.nextHearing = {
        gte: now,
        lte: weekFromNow
      }
    } else if (quickFilter === 'highValue') {
      where.caseValue = {
        gte: 100000 // Cases worth 100k or more
      }
    } else if (quickFilter === 'employment') {
      where.caseType = 'Employment Law'
    }

    // Apply search filter
    if (search) {
      // Regular search
      where.OR = [
        { title: { contains: search, mode: 'insensitive' as const } },
        { description: { contains: search, mode: 'insensitive' as const } },
        { clientName: { contains: search, mode: 'insensitive' as const } },
        { caseType: { contains: search, mode: 'insensitive' as const } }
      ]
    }

    // Build the orderBy clause
    let orderBy: any = { updatedAt: 'desc' }
    if (sortBy === 'priority') {
      orderBy = [
        { priority: 'desc' },
        { updatedAt: 'desc' }
      ]
    } else if (sortBy === 'value') {
      orderBy = [
        { caseValue: 'desc' },
        { updatedAt: 'desc' }
      ]
    } else if (sortBy === 'hearing') {
      orderBy = [
        { nextHearing: 'asc' },
        { updatedAt: 'desc' }
      ]
    }

    // Fetch cases
    const cases = await prisma.case.findMany({
      where,
      orderBy,
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        },
        documents: {
          select: {
            id: true,
            filename: true
          }
        },
        _count: {
          select: {
            documents: true,
            chatSessions: true
          }
        }
      }
    })

    // Get statistics
    const stats = await prisma.case.aggregate({
      where: {
        userId: session.user.id,
        isDraft: false
      },
      _count: { id: true },
      _sum: { caseValue: true }
    })

    const statusCounts = await prisma.case.groupBy({
      where: {
        userId: session.user.id,
        isDraft: false
      },
      by: ['status'],
      _count: { id: true }
    })

    return NextResponse.json({
      cases,
      stats: {
        total: stats._count.id,
        totalValue: stats._sum.caseValue || 0,
        byStatus: statusCounts.reduce((acc, item) => {
          acc[item.status.toLowerCase()] = item._count.id
          return acc
        }, {} as Record<string, number>)
      }
    })

  } catch (error) {
    console.error('Cases fetch error:', error)
    return NextResponse.json(
      { message: 'An error occurred while fetching cases' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { id, ...updateData } = body

    if (!id) {
      return NextResponse.json({ message: 'Case ID is required' }, { status: 400 })
    }

    // Verify ownership
    const existingCase = await prisma.case.findFirst({
      where: {
        id,
        userId: session.user.id
      }
    })

    if (!existingCase) {
      return NextResponse.json({ message: 'Case not found or unauthorized' }, { status: 404 })
    }

    // Update the case
    const updatedCase = await prisma.case.update({
      where: { id },
      data: updateData
    })

    return NextResponse.json({
      message: 'Case updated successfully',
      case: updatedCase
    })

  } catch (error) {
    console.error('Case update error:', error)
    return NextResponse.json(
      { message: 'An error occurred while updating the case' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ message: 'Case ID is required' }, { status: 400 })
    }

    // Verify ownership
    const existingCase = await prisma.case.findFirst({
      where: {
        id,
        userId: session.user.id
      }
    })

    if (!existingCase) {
      return NextResponse.json({ message: 'Case not found or unauthorized' }, { status: 404 })
    }

    // Delete the case
    await prisma.case.delete({
      where: { id }
    })

    return NextResponse.json({
      message: 'Case deleted successfully'
    })

  } catch (error) {
    console.error('Case deletion error:', error)
    return NextResponse.json(
      { message: 'An error occurred while deleting the case' },
      { status: 500 }
    )
  }
}

