import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { analyzeCaseWithAI } from '@/lib/aiAnalysis'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { sessionId, caseId } = await request.json()

    if (!sessionId) {
      return NextResponse.json({ message: 'Session ID is required' }, { status: 400 })
    }

    // Get chat session and messages
    const chatSession = await prisma.chatSession.findUnique({
      where: { id: sessionId },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' }
        }
      }
    })

    if (!chatSession) {
      return NextResponse.json({ message: 'Session not found' }, { status: 404 })
    }

    // Get chat history
    const chatHistory = chatSession.messages
      .map(msg => `${msg.role}: ${msg.content}`)
      .join('\n')

    // Get uploaded documents
    const documents = await prisma.document.findMany({
      where: { 
        userId: session.user.id,
        OR: [
          { messageId: { not: null } },
          { caseId: caseId || null }
        ]
      },
      select: {
        content: true,
        originalName: true
      }
    })

    // Get voice notes
    const voiceNotes = await prisma.voiceNote.findMany({
      where: { 
        userId: session.user.id,
        sessionId: sessionId
      },
      select: {
        transcription: true
      }
    })

    // Perform AI analysis
    const analysis = await analyzeCaseWithAI(
      chatHistory,
      documents.map(doc => ({
        text: doc.content || '',
        filename: doc.originalName
      })),
      voiceNotes.map(note => note.transcription).filter(Boolean) as string[]
    )

    // Save analysis to database
    const savedAnalysis = await prisma.caseAnalysis.create({
      data: {
        parties: JSON.stringify(analysis.parties),
        caseType: analysis.caseType,
        jurisdiction: analysis.jurisdiction,
        winningProbability: analysis.winningProbability,
        keyFacts: JSON.stringify(analysis.keyFacts),
        evidence: JSON.stringify(analysis.evidence),
        actionItems: JSON.stringify(analysis.actionItems),
        confidence: analysis.confidence,
        caseId: caseId || null
      }
    })

    return NextResponse.json({
      analysis: {
        ...analysis,
        id: savedAnalysis.id,
        createdAt: savedAnalysis.createdAt
      }
    })

  } catch (error) {
    console.error('Analysis API error:', error)
    return NextResponse.json(
      { message: 'An error occurred during analysis' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('sessionId')
    const caseId = searchParams.get('caseId')

    if (!sessionId && !caseId) {
      return NextResponse.json({ message: 'Session ID or Case ID is required' }, { status: 400 })
    }

    // Get existing analysis
    const analysis = await prisma.caseAnalysis.findFirst({
      where: {
        OR: [
          { caseId: caseId || undefined },
          { case: { chatSessions: { some: { id: sessionId || undefined } } } }
        ]
      },
      orderBy: { createdAt: 'desc' }
    })

    if (!analysis) {
      return NextResponse.json({ message: 'No analysis found' }, { status: 404 })
    }

    return NextResponse.json({
      analysis: {
        id: analysis.id,
        parties: JSON.parse(analysis.parties || '{}'),
        caseType: analysis.caseType,
        jurisdiction: analysis.jurisdiction,
        winningProbability: analysis.winningProbability,
        keyFacts: JSON.parse(analysis.keyFacts || '[]'),
        evidence: JSON.parse(analysis.evidence || '[]'),
        actionItems: JSON.parse(analysis.actionItems || '[]'),
        confidence: analysis.confidence,
        createdAt: analysis.createdAt
      }
    })

  } catch (error) {
    console.error('Get analysis error:', error)
    return NextResponse.json(
      { message: 'An error occurred while fetching analysis' },
      { status: 500 }
    )
  }
}
