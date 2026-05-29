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

    const { searchParams } = new URL(request.url)
    
    // Get filter parameters
    const clientName = searchParams.get('clientName')
    const caseId = searchParams.get('caseId')
    const state = searchParams.get('state')
    const district = searchParams.get('district')
    const court = searchParams.get('court')
    const courtType = searchParams.get('courtType')
    const status = searchParams.get('status')
    const priority = searchParams.get('priority')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const date = searchParams.get('date') // Specific date filter

    // Build the where clause dynamically
    const where: any = {
      userId: session.user.id
    }

    if (clientName && clientName !== 'All Clients') {
      where.clientName = { contains: clientName }
    }
    if (caseId && caseId !== 'All Cases') {
      where.caseId = caseId
    }
    if (state && state !== 'All States') {
      where.state = state
    }
    if (district && district !== 'All Districts') {
      where.district = district
    }
    if (court && court !== 'All Courts') {
      where.court = { contains: court, mode: 'insensitive' as const }
    }
    if (courtType && courtType !== 'All Court Types') {
      where.courtType = courtType
    }
    if (status && status !== 'ALL') {
      where.status = status
    }
    if (priority && priority !== 'ALL') {
      where.priority = priority
    }

    // Date filtering
    if (date) {
      // Filter for a specific date
      const targetDate = new Date(date)
      const nextDay = new Date(targetDate)
      nextDay.setDate(nextDay.getDate() + 1)
      
      where.hearingDate = {
        gte: targetDate,
        lt: nextDay
      }
    } else if (startDate || endDate) {
      // Filter for a date range
      where.hearingDate = {}
      if (startDate) {
        where.hearingDate.gte = new Date(startDate)
      }
      if (endDate) {
        where.hearingDate.lte = new Date(endDate)
      }
    }

    // Fetch hearings with related data
    const hearings = await prisma.hearing.findMany({
      where,
      include: {
        case: {
          select: {
            id: true,
            title: true,
            caseType: true,
            status: true
          }
        }
      },
      orderBy: [
        { hearingDate: 'asc' },
        { startTime: 'asc' }
      ]
    })

    return NextResponse.json({
      hearings,
      count: hearings.length
    })

  } catch (error) {
    console.error('Fetch hearings error:', error)
    return NextResponse.json(
      { message: 'An error occurred while fetching hearings' },
      { status: 500 }
    )
  }
}

