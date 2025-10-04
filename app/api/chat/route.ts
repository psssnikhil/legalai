import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { generateChatResponse } from '@/lib/aiAnalysis'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { message, sessionId } = await request.json()

    if (!message) {
      return NextResponse.json({ message: 'Message is required' }, { status: 400 })
    }

    // Get or create chat session
    let chatSession
    if (sessionId && sessionId !== 'current-session') {
      chatSession = await prisma.chatSession.findUnique({
        where: { id: sessionId },
        include: {
          messages: {
            orderBy: { createdAt: 'asc' }
          }
        }
      })
    }

    if (!chatSession) {
      chatSession = await prisma.chatSession.create({
        data: {
          userId: session.user.id,
          title: message.substring(0, 50) + (message.length > 50 ? '...' : '')
        },
        include: {
          messages: true
        }
      })
    }

    // Save user message
    const userMessage = await prisma.chatMessage.create({
      data: {
        content: message,
        role: 'user',
        sessionId: chatSession.id
      }
    })

    // Get context for AI
    const recentMessages = await prisma.chatMessage.findMany({
      where: { sessionId: chatSession.id },
      orderBy: { createdAt: 'desc' },
      take: 10
    })

    const chatHistory = recentMessages
      .reverse()
      .map(msg => `${msg.role}: ${msg.content}`)
      .join('\n')

    // Get uploaded documents for context
    const documents = await prisma.document.findMany({
      where: { 
        userId: session.user.id,
        messageId: { not: null }
      },
      select: {
        content: true,
        originalName: true
      }
    })

    // Generate AI response
    const aiResponse = await generateChatResponse(message, {
      chatHistory,
      documents: documents.map(doc => ({
        text: doc.content || '',
        filename: doc.originalName
      }))
    })

    // Save AI response
    const aiMessage = await prisma.chatMessage.create({
      data: {
        content: aiResponse,
        role: 'assistant',
        sessionId: chatSession.id
      }
    })

    return NextResponse.json({
      message: aiResponse,
      sessionId: chatSession.id,
      messageId: aiMessage.id
    })

  } catch (error) {
    console.error('Chat API error:', error)
    return NextResponse.json(
      { message: 'An error occurred while processing your request' },
      { status: 500 }
    )
  }
}
