import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { generateChatResponse } from '@/lib/aiAnalysis'
import { indexDocuments, generateRAGResponse, clearSessionVectorStore, shouldUseDocumentRetrieval, isSessionIndexed, getSessionIndexInfo } from '@/lib/rag'

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

    // Check if RAG is enabled for this user
    const userSettings = await prisma.userSettings.findUnique({
      where: { userId: session.user.id }
    })
    const ragEnabled = userSettings?.ragEnabled ?? false

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

    let aiResponse: string
    let sources: Array<{ documentId: string; documentName: string; chunkIndex: number; relevanceScore: number }> = []
    let routerDecision: { useRetrieval: boolean; reasoning: string } | null = null

    if (ragEnabled) {
      console.log('[Chat API] RAG is enabled, routing query...')

      // Use router to decide if document retrieval is needed
      routerDecision = await shouldUseDocumentRetrieval(message)
      console.log(`[Chat API] Router decision: ${routerDecision.useRetrieval ? 'USE RETRIEVAL' : 'DIRECT ANSWER'}`)
      console.log(`[Chat API] Router reasoning: ${routerDecision.reasoning}`)

      if (routerDecision.useRetrieval) {
        console.log('[Chat API] Using document retrieval tool')

        // Check if session is already indexed
        const indexInfo = getSessionIndexInfo(chatSession.id)
        console.log(`[Chat API] Session ${chatSession.id} index status:`, indexInfo)

        if (!indexInfo.indexed) {
          // Only index if not already indexed
          console.log('[Chat API] Session not indexed yet, fetching and indexing documents...')

          // Get documents for THIS session
          const documents = await prisma.document.findMany({
            where: {
              userId: session.user.id,
              message: {
                sessionId: chatSession.id
              }
            },
            select: {
              id: true,
              originalName: true,
              content: true,
              messageId: true,
              createdAt: true,
            },
            distinct: ['id'], // Avoid duplicates
          })

          console.log(`[Chat API] Found ${documents.length} documents already linked to session ${chatSession.id}`)

          // Only on the FIRST message of a new session, check for recent orphans
          // Count actual messages in DB (the chatSession.messages array might be stale)
          const messageCount = await prisma.chatMessage.count({
            where: { sessionId: chatSession.id }
          })
          const isFirstMessage = messageCount <= 1 // Only the user's message exists (or less)

          console.log(`[Chat API] Message count in session: ${messageCount}, isFirstMessage: ${isFirstMessage}`)

          if (isFirstMessage) {
            console.log('[Chat API] First message in session, checking for orphaned documents...')

            // Find orphaned documents uploaded in the last 5 minutes
            const orphanedDocs = await prisma.document.findMany({
              where: {
                userId: session.user.id,
                messageId: null,
                createdAt: {
                  gte: new Date(Date.now() - 5 * 60 * 1000) // Last 5 minutes only
                }
              },
              select: {
                id: true,
                originalName: true,
                content: true,
                createdAt: true,
              }
            })

            console.log(`[Chat API] Found ${orphanedDocs.length} orphaned documents from last 5 minutes`)

            if (orphanedDocs.length > 0) {
              console.log(`[Chat API] Linking ${orphanedDocs.length} orphaned documents to session:`, orphanedDocs.map(d => d.originalName))

              // Create a system message for the uploaded documents
              const uploadMessage = await prisma.chatMessage.create({
                data: {
                  content: `📎 ${orphanedDocs.length} document(s) uploaded: ${orphanedDocs.map(d => d.originalName).join(', ')}`,
                  role: 'system',
                  sessionId: chatSession.id,
                }
              })

              // Link all orphaned documents to this message
              await prisma.document.updateMany({
                where: {
                  id: { in: orphanedDocs.map(d => d.id) }
                },
                data: {
                  messageId: uploadMessage.id
                }
              })

              console.log(`[Chat API] Linked orphaned documents to message ${uploadMessage.id}`)

              // Add orphaned docs to the documents array for indexing
              documents.push(...orphanedDocs.map(doc => ({
                ...doc,
                messageId: uploadMessage.id
              })))
            }
          }

          console.log(`[Chat API] Total documents available: ${documents.length}`)

          // Index documents if they exist
          if (documents.length > 0) {
            const docsWithContent = documents.filter(doc => doc.content && doc.content.trim().length > 0)
            const docsWithoutContent = documents.filter(doc => !doc.content || doc.content.trim().length === 0)

            console.log(`[Chat API] ${docsWithContent.length} documents have content, ${docsWithoutContent.length} have no content`)

            if (docsWithoutContent.length > 0) {
              console.log(`[Chat API] ⚠️  Documents with no extractable text (cannot be used for RAG):`,
                docsWithoutContent.map(d => d.originalName))
            }

            if (docsWithContent.length > 0) {
              console.log(`[Chat API] Indexing documents for session ${chatSession.id}:`, docsWithContent.map(d => d.originalName))

              await indexDocuments(
                chatSession.id,
                docsWithContent.map(doc => ({
                  id: doc.id,
                  name: doc.originalName,
                  content: doc.content!,
                }))
              )

              const newIndexInfo = getSessionIndexInfo(chatSession.id)
              console.log(`[Chat API] Documents indexed successfully:`, newIndexInfo)
            } else {
              console.log(`[Chat API] ⚠️  No documents with extractable text found - RAG cannot be used`)
            }
          } else {
            console.log(`[Chat API] No documents found for this session`)
          }
        } else {
          console.log(`[Chat API] Session already indexed with ${indexInfo.documentCount} documents (${indexInfo.chunkCount} chunks), skipping re-indexing`)
        }

        // Generate RAG-enhanced response
        try {
          const ragResult = await generateRAGResponse(message, chatSession.id, chatHistory)
          aiResponse = ragResult.response
          sources = ragResult.sources
          console.log(`[Chat API] RAG response generated with ${sources.length} sources`)
        } catch (error) {
          console.error('[Chat API] RAG error, falling back to standard response:', error)
          // Fallback to standard response if RAG fails
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

          aiResponse = await generateChatResponse(message, {
            chatHistory,
            documents: documents.map(doc => ({
              text: doc.content || '',
              filename: doc.originalName
            }))
          })
        }
      } else {
        console.log('[Chat API] Router decided: Direct answer (no retrieval needed)')
        // Use standard chat response for general questions
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

        aiResponse = await generateChatResponse(message, {
          chatHistory,
          documents: documents.map(doc => ({
            text: doc.content || '',
            filename: doc.originalName
          }))
        })
      }
    } else {
      console.log('[Chat API] RAG is disabled, using standard response')

      // Standard response (existing functionality)
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

      aiResponse = await generateChatResponse(message, {
        chatHistory,
        documents: documents.map(doc => ({
          text: doc.content || '',
          filename: doc.originalName
        }))
      })
    }

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
      messageId: aiMessage.id,
      sources: sources.length > 0 ? sources : undefined,
      ragEnabled,
      retrievalUsed: routerDecision?.useRetrieval || false,
      routerReasoning: routerDecision?.reasoning,
    })

  } catch (error) {
    console.error('Chat API error:', error)
    return NextResponse.json(
      { message: 'An error occurred while processing your request' },
      { status: 500 }
    )
  }
}

// DELETE - Clear RAG vector store for session
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('sessionId')

    if (sessionId) {
      clearSessionVectorStore(sessionId)
      return NextResponse.json({ message: 'Vector store cleared' })
    }

    return NextResponse.json({ message: 'Session ID required' }, { status: 400 })

  } catch (error) {
    console.error('Chat API DELETE error:', error)
    return NextResponse.json(
      { message: 'An error occurred' },
      { status: 500 }
    )
  }
}
