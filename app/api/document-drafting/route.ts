import { NextRequest } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
    try {
        const { message, conversationHistory, uploadedFiles, selectedCase } = await request.json()

        if (!message) {
            return new Response(JSON.stringify({ error: 'Message is required' }), { status: 400 })
        }

        // Build context from conversation history
        const messages: any[] = [
            {
                role: "system",
                content: `You are an expert legal document drafting assistant. Your role is to help create professional, legally sound documents.

**Your PRIMARY ROLE: Personal Document Automation Assistant**
You are designed to AUTOMATE the user's repetitive document workflows by learning from their reference documents and adapting to their unique writing style.

**Core Workflow:**
1. User uploads REFERENCE documents (their templates, previous work, their writing style)
2. User provides NEW CASE details (voice dictation or text)
3. You generate NEW documents by adapting the reference documents with the new case details

**Critical Capabilities:**
- **LEARN from reference documents**: Extract writing style, tone, structure, clause patterns
- **ADAPT templates**: Take reference documents and populate them with new case details
- **MAINTAIN consistency**: Use the exact style, formatting, and language patterns from references
- **AUTOMATE repetitive work**: Recognize patterns in reference docs and apply to new situations
- **PRESERVE user's voice**: Don't impose generic legal language - match THEIR way of writing

**When reference documents are uploaded:**
- ANALYZE the writing style (formal vs conversational, clause structure, headings)
- EXTRACT reusable templates and patterns
- IDENTIFY standard clauses and provisions the user prefers
- NOTE specific legal language, definitions, and terminology they use
- RECOGNIZE formatting preferences (numbering, sections, emphasis)
- UNDERSTAND their document organization approach

**Document Generation Process:**
1. If user provides case details + reference docs: AUTOMATICALLY generate new document by adapting reference
2. Use the EXACT style from reference documents (tone, language, structure)
3. Fill in new case-specific details (parties, dates, amounts, facts)
4. Maintain all formatting, clause patterns, and provisions from reference
5. Only ask clarifying questions if critical information is missing

**When drafting:**
- DON'T ask obvious questions if info is in the case details
- DO use reference documents as exact templates
- DO preserve the user's unique writing patterns
- DO automate the repetitive parts (standard clauses, formatting)
- DO generate complete drafts quickly for review/editing

**Response Format:**
- For questions/clarifications: Respond normally
- For complete documents: First provide brief explanation, then output:

DOCUMENT:
[The complete legal document here]

**Important:** Be conversational when gathering information, but formal and precise when drafting the actual document. When documents are uploaded, acknowledge what you can see and use that information proactively.`
            }
        ]

        // Add conversation history (last 10 messages)
        if (conversationHistory && Array.isArray(conversationHistory)) {
            const recentHistory = conversationHistory.slice(-10)
            recentHistory.forEach((msg: any) => {
                if (msg.role === 'user' || msg.role === 'assistant') {
                    messages.push({
                        role: msg.role,
                        content: msg.content
                    })
                }
            })
        }

        // Add current message with full document context
        let currentMessage = message

        // Add full context from uploaded files with extracted content
        if (uploadedFiles && uploadedFiles.length > 0) {
            const documentsContext = uploadedFiles.map((file: any) => {
                let context = `\n\n========== REFERENCE TEMPLATE: ${file.filename} ==========`

                if (file.extractedText) {
                    context += `\n\n[COMPLETE DOCUMENT TEXT - USE AS TEMPLATE]:\n${file.extractedText}`
                }

                if (file.keyInfo) {
                    context += `\n\n[EXTRACTED METADATA]:`
                    if (file.keyInfo.parties?.length > 0) {
                        context += `\n- Parties: ${file.keyInfo.parties.join(', ')}`
                    }
                    if (file.keyInfo.caseTypes?.length > 0) {
                        context += `\n- Case Types: ${file.keyInfo.caseTypes.join(', ')}`
                    }
                    if (file.keyInfo.jurisdictions?.length > 0) {
                        context += `\n- Jurisdictions: ${file.keyInfo.jurisdictions.join(', ')}`
                    }
                    if (file.keyInfo.dates?.length > 0) {
                        context += `\n- Important Dates: ${file.keyInfo.dates.join(', ')}`
                    }
                    if (file.keyInfo.amounts?.length > 0) {
                        context += `\n- Amounts: ${file.keyInfo.amounts.join(', ')}`
                    }
                }

                context += `\n========== END REFERENCE: ${file.filename} ==========\n`
                return context
            }).join('\n')

            currentMessage += `\n\n[USER'S REFERENCE DOCUMENTS - LEARN THEIR STYLE]:${documentsContext}

**INSTRUCTIONS FOR DOCUMENT GENERATION:**
- The documents above are the USER'S templates and writing samples
- ANALYZE their writing style: tone, language patterns, clause structure, formatting
- When the user provides new case details, ADAPT these reference documents
- PRESERVE the user's unique voice and style exactly
- REPLACE old case details with new ones while keeping the template structure
- If user says "draft [document type]", immediately generate using the reference style
- Don't ask unnecessary questions - be proactive and generate drafts quickly`
        }

        // Add case context if selected
        if (selectedCase) {
            currentMessage += `\n\n[Related case: ${selectedCase}]`
        }

        messages.push({
            role: "user",
            content: currentMessage
        })

        // Create streaming response
        const stream = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: messages,
            max_tokens: 3000,
            temperature: 0.7,
            stream: true,
        })

        // Create a ReadableStream for SSE
        const encoder = new TextEncoder()
        const readable = new ReadableStream({
            async start(controller) {
                try {
                    let fullResponse = ''
                    let documentContent = ''
                    let isInDocument = false

                    for await (const chunk of stream) {
                        const content = chunk.choices[0]?.delta?.content || ''
                        if (content) {
                            fullResponse += content

                            // Check if we're starting a document section
                            if (fullResponse.includes('DOCUMENT:') && !isInDocument) {
                                isInDocument = true
                                const parts = fullResponse.split('DOCUMENT:')
                                documentContent = parts[1] || ''
                            } else if (isInDocument) {
                                documentContent += content
                            }

                            // Send content chunk
                            const data = `data: ${JSON.stringify({
                                content,
                                document: isInDocument ? documentContent.trim() : null
                            })}\n\n`
                            controller.enqueue(encoder.encode(data))
                        }
                    }

                    // If we have a document, send final document
                    if (documentContent) {
                        const finalData = `data: ${JSON.stringify({
                            document: documentContent.trim()
                        })}\n\n`
                        controller.enqueue(encoder.encode(finalData))
                    }

                    controller.enqueue(encoder.encode('data: [DONE]\n\n'))
                    controller.close()
                } catch (error) {
                    console.error('Streaming error:', error)
                    controller.error(error)
                }
            },
        })

        return new Response(readable, {
            headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
            },
        })

    } catch (error) {
        console.error('Document drafting error:', error)
        return new Response(
            JSON.stringify({
                error: 'An error occurred while drafting the document',
                details: error instanceof Error ? error.message : 'Unknown error'
            }),
            {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            }
        )
    }
}

