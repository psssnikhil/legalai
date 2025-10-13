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
      description, 
      clientName, 
      clientEmail, 
      clientPhone, 
      priority = 'MEDIUM',
      status = 'ACTIVE',
      caseType,
      caseValue,
      assignedTo,
      nextHearing,
      isDraft = false,
      tags,
      analysisId 
    } = await request.json()

    if (!title && !isDraft) {
      return NextResponse.json({ message: 'Title is required' }, { status: 400 })
    }

    // Create the case
    const newCase = await prisma.case.create({
      data: {
        title: title || 'Draft Case',
        description,
        clientName,
        clientEmail,
        clientPhone,
        priority,
        status,
        caseType,
        caseValue: caseValue ? parseFloat(caseValue) : null,
        assignedTo,
        nextHearing: nextHearing ? new Date(nextHearing) : null,
        isDraft,
        tags,
        userId: session.user.id
      }
    })

    // If analysis ID is provided, link it to the case
    if (analysisId) {
      await prisma.caseAnalysis.update({
        where: { id: analysisId },
        data: { caseId: newCase.id }
      })
    }

    return NextResponse.json({
      message: 'Case created successfully',
      case: newCase
    })

  } catch (error) {
    console.error('Case creation error:', error)
    return NextResponse.json(
      { message: 'An error occurred while creating the case' },
      { status: 500 }
    )
  }
}
