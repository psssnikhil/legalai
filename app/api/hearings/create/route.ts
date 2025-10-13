import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { 
      title,
      hearingDate,
      startTime,
      endTime,
      duration = 60,
      caseId,
      clientName,
      state,
      district,
      court,
      courtType,
      courtRoom,
      judgeName,
      priority = 'MEDIUM',
      status = 'SCHEDULED',
      hearingType,
      notes,
      reminders
    } = await request.json()

    // Validation
    if (!title) {
      return NextResponse.json({ message: 'Title is required' }, { status: 400 })
    }
    if (!hearingDate) {
      return NextResponse.json({ message: 'Hearing date is required' }, { status: 400 })
    }
    if (!startTime) {
      return NextResponse.json({ message: 'Start time is required' }, { status: 400 })
    }

    // Create the hearing
    const newHearing = await prisma.hearing.create({
      data: {
        title,
        hearingDate: new Date(hearingDate),
        startTime,
        endTime,
        duration: parseInt(duration),
        caseId,
        clientName,
        state,
        district,
        court,
        courtType,
        courtRoom,
        judgeName,
        priority,
        status,
        hearingType,
        notes,
        reminders: reminders ? JSON.stringify(reminders) : null,
        userId: session.user.id
      },
      include: {
        case: {
          select: {
            id: true,
            title: true,
            clientName: true
          }
        }
      }
    })

    return NextResponse.json({
      message: 'Hearing created successfully',
      hearing: newHearing
    })

  } catch (error) {
    console.error('Hearing creation error:', error)
    return NextResponse.json(
      { message: 'An error occurred while creating the hearing' },
      { status: 500 }
    )
  }
}

