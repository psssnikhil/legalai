import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { message, caseId, sessionId } = await request.json()
    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    // Get case context
    let caseContext = ''
    if (caseId) {
      const caseRecord = await prisma.case.findFirst({
        where: { id: caseId, userId: session.user.id },
        include: {
          documents: { select: { originalName: true, content: true }, take: 5 },
          hearings: { 
            select: { title: true, hearingDate: true, court: true, status: true },
            orderBy: { hearingDate: 'asc' },
            take: 5
          }
        }
      })

      if (caseRecord) {
        caseContext = `
Case Context:
- Title: ${caseRecord.title}
- Type: ${caseRecord.caseType || 'Not specified'}
- Status: ${caseRecord.status}
- Client: ${caseRecord.clientName || 'Not specified'}
- Description: ${caseRecord.description || 'None'}
${caseRecord.hearings.length > 0 ? `- Upcoming Hearings: ${caseRecord.hearings.map(h => `${h.title} on ${new Date(h.hearingDate).toLocaleDateString()} at ${h.court || 'TBD'}`).join('; ')}` : ''}
${caseRecord.documents.length > 0 ? `- Documents: ${caseRecord.documents.map(d => d.originalName).join(', ')}` : ''}
`
      }
    }

    // Get or create chat session
    let chatSession
    if (sessionId) {
      chatSession = await prisma.chatSession.findUnique({
        where: { id: sessionId },
        include: { messages: { orderBy: { createdAt: 'asc' }, take: 20 } }
      })
    }
    if (!chatSession) {
      chatSession = await prisma.chatSession.create({
        data: {
          userId: session.user.id,
          caseId: caseId || null,
          title: message.substring(0, 50) + (message.length > 50 ? '...' : '')
        },
        include: { messages: true }
      })
    }

    // Save user message
    await prisma.chatMessage.create({
      data: { content: message, role: 'user', sessionId: chatSession.id }
    })

    // Build message history
    const history = (chatSession.messages || []).slice(-10).map(msg => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content
    }))

    const systemPrompt = `You are an expert legal AI assistant helping with case management and legal analysis. ${caseContext ? `\n\nYou are currently assisting with the following case:\n${caseContext}` : ''}\n\nProvide clear, professional, and accurate legal guidance. When appropriate, reference specific case details provided in the context.`

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        ...history,
        { role: 'user', content: message }
      ],
      max_tokens: 1000,
      temperature: 0.3
    })

    const aiResponse = completion.choices[0]?.message?.content || 'I apologize, I was unable to generate a response.'

    // Save AI response
    await prisma.chatMessage.create({
      data: { content: aiResponse, role: 'assistant', sessionId: chatSession.id }
    })

    return NextResponse.json({
      message: aiResponse,
      sessionId: chatSession.id
    })

  } catch (error) {
    console.error('Case chat error:', error)
    return NextResponse.json(
      { error: 'An error occurred while processing your message' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const caseId = searchParams.get('caseId')
    const sessionId = searchParams.get('sessionId')

    if (sessionId) {
      const chatSession = await prisma.chatSession.findFirst({
        where: { id: sessionId, userId: session.user.id },
        include: { messages: { orderBy: { createdAt: 'asc' } } }
      })
      return NextResponse.json({ messages: chatSession?.messages || [] })
    }

    if (caseId) {
      // Get the most recent chat session for this case
      const chatSession = await prisma.chatSession.findFirst({
        where: { caseId, userId: session.user.id },
        orderBy: { updatedAt: 'desc' },
        include: { messages: { orderBy: { createdAt: 'asc' } } }
      })
      return NextResponse.json({ 
        messages: chatSession?.messages || [],
        sessionId: chatSession?.id || null
      })
    }

    return NextResponse.json({ messages: [], sessionId: null })
  } catch (error) {
    console.error('Chat GET error:', error)
    return NextResponse.json({ error: 'An error occurred' }, { status: 500 })
  }
}
