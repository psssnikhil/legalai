import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET single hearing by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const hearing = await prisma.hearing.findFirst({
      where: {
        id: params.id,
        userId: session.user.id
      },
      include: {
        case: {
          select: {
            id: true,
            title: true,
            clientName: true,
            caseType: true,
            status: true
          }
        }
      }
    })

    if (!hearing) {
      return NextResponse.json({ message: 'Hearing not found' }, { status: 404 })
    }

    return NextResponse.json({ hearing })

  } catch (error) {
    console.error('Fetch hearing error:', error)
    return NextResponse.json(
      { message: 'An error occurred while fetching the hearing' },
      { status: 500 }
    )
  }
}

// PUT update hearing
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    // Check if hearing exists and belongs to user
    const existingHearing = await prisma.hearing.findFirst({
      where: {
        id: params.id,
        userId: session.user.id
      }
    })

    if (!existingHearing) {
      return NextResponse.json({ message: 'Hearing not found' }, { status: 404 })
    }

    const { 
      title,
      hearingDate,
      startTime,
      endTime,
      duration,
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
      reminders
    } = await request.json()

    // Update the hearing
    const updatedHearing = await prisma.hearing.update({
      where: { id: params.id },
      data: {
        ...(title && { title }),
        ...(hearingDate && { hearingDate: new Date(hearingDate) }),
        ...(startTime && { startTime }),
        ...(endTime !== undefined && { endTime }),
        ...(duration && { duration: parseInt(duration) }),
        ...(caseId !== undefined && { caseId }),
        ...(clientName !== undefined && { clientName }),
        ...(state !== undefined && { state }),
        ...(district !== undefined && { district }),
        ...(court !== undefined && { court }),
        ...(courtType !== undefined && { courtType }),
        ...(courtRoom !== undefined && { courtRoom }),
        ...(judgeName !== undefined && { judgeName }),
        ...(priority && { priority }),
        ...(status && { status }),
        ...(hearingType !== undefined && { hearingType }),
        ...(notes !== undefined && { notes }),
        ...(reminders && { reminders: JSON.stringify(reminders) })
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
      message: 'Hearing updated successfully',
      hearing: updatedHearing
    })

  } catch (error) {
    console.error('Update hearing error:', error)
    return NextResponse.json(
      { message: 'An error occurred while updating the hearing' },
      { status: 500 }
    )
  }
}

// DELETE hearing
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    // Check if hearing exists and belongs to user
    const existingHearing = await prisma.hearing.findFirst({
      where: {
        id: params.id,
        userId: session.user.id
      }
    })

    if (!existingHearing) {
      return NextResponse.json({ message: 'Hearing not found' }, { status: 404 })
    }

    // Delete the hearing
    await prisma.hearing.delete({
      where: { id: params.id }
    })

    return NextResponse.json({
      message: 'Hearing deleted successfully'
    })

  } catch (error) {
    console.error('Delete hearing error:', error)
    return NextResponse.json(
      { message: 'An error occurred while deleting the hearing' },
      { status: 500 }
    )
  }
}

