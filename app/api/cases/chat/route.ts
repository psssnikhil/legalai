import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'

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

    // Fetch case data for context
    let caseRecord: Awaited<ReturnType<typeof prisma.case.findFirst>> & {
      hearings?: { hearingDate: Date; title: string; court: string | null; status: string }[]
    } | null = null
    if (caseId) {
      caseRecord = await prisma.case.findFirst({
        where: { id: caseId, userId: session.user.id },
        include: {
          hearings: { orderBy: { hearingDate: 'asc' }, take: 3 },
        },
      })
    }

    // Get or create chat session
    let chatSession = sessionId
      ? await prisma.chatSession.findFirst({ where: { id: sessionId, userId: session.user.id } })
      : null

    if (!chatSession) {
      chatSession = await prisma.chatSession.create({
        data: {
          userId: session.user.id,
          caseId: caseId || null,
          title: message.substring(0, 50) + (message.length > 50 ? '...' : ''),
        },
      })
    }

    let aiResponse = ''

    if (process.env.OPENAI_API_KEY) {
      // Try OpenAI Assistants API first
      try {
        const {
          getOrCreateAssistant,
          getOrCreateVectorStore,
          getOrCreateThread,
          sendMessageToThread,
        } = await import('@/lib/openai-assistant')

        const assistantId = await getOrCreateAssistant()

        // Ensure vector store exists for the case
        let vectorStoreId: string | null = caseRecord?.openaiVectorStoreId ?? null
        if (caseRecord && !vectorStoreId) {
          vectorStoreId = await getOrCreateVectorStore(caseRecord.id, caseRecord.title, null)
          await prisma.case.update({
            where: { id: caseRecord.id },
            data: { openaiVectorStoreId: vectorStoreId },
          })
        }

        // Ensure thread exists for the chat session
        let threadId = chatSession.openaiThreadId
        if (!threadId) {
          threadId = await getOrCreateThread(null, vectorStoreId)
          await prisma.chatSession.update({
            where: { id: chatSession.id },
            data: { openaiThreadId: threadId },
          })
        }

        aiResponse = await sendMessageToThread(threadId, assistantId, message, undefined)
      } catch (assistantsError) {
        console.error('[Chat] Assistants API error, falling back to basic chat:', assistantsError)
        aiResponse = ''
      }

      // Fallback: plain chat completions (no thread/vector store)
      if (!aiResponse) {
        const OpenAI = (await import('openai')).default
        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

        const caseContext = caseRecord
          ? `\n\nCase context:\n- Title: ${caseRecord.title}\n- Type: ${caseRecord.caseType || 'General'}\n- Status: ${caseRecord.status}\n- Client: ${caseRecord.clientName || 'Unknown'}`
          : ''

        const completion = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: `You are an expert legal AI assistant.${caseContext}` },
            { role: 'user', content: message },
          ],
          max_tokens: 1000,
        })
        aiResponse = completion.choices[0]?.message?.content || 'No response generated.'
      }
    }

    if (!aiResponse) {
      aiResponse = 'AI is not configured. Please add OPENAI_API_KEY to your environment.'
    }

    // Persist both turns
    await prisma.chatMessage.create({ data: { content: message, role: 'user', sessionId: chatSession.id } })
    await prisma.chatMessage.create({ data: { content: aiResponse, role: 'assistant', sessionId: chatSession.id } })

    return NextResponse.json({ message: aiResponse, sessionId: chatSession.id })
  } catch (error) {
    console.error('Case chat error:', error)
    const message = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const caseId = searchParams.get('caseId')
    const sessionId = searchParams.get('sessionId')

    if (sessionId) {
      const chatSession = await prisma.chatSession.findFirst({
        where: { id: sessionId, userId: session.user.id },
        include: { messages: { orderBy: { createdAt: 'asc' } } },
      })
      return NextResponse.json({ messages: chatSession?.messages || [] })
    }

    if (caseId) {
      const chatSession = await prisma.chatSession.findFirst({
        where: { caseId, userId: session.user.id },
        orderBy: { updatedAt: 'desc' },
        include: { messages: { orderBy: { createdAt: 'asc' } } },
      })
      return NextResponse.json({
        messages: chatSession?.messages || [],
        sessionId: chatSession?.id || null,
      })
    }

    return NextResponse.json({ messages: [], sessionId: null })
  } catch (error) {
    console.error('Chat GET error:', error)
    return NextResponse.json({ error: 'An error occurred' }, { status: 500 })
  }
}
