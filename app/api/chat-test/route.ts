import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
    try {
        const { message, documents } = await request.json()

        if (!message) {
            return NextResponse.json({ message: 'Message is required' }, { status: 400 })
        }

        // Legal AI Assistant System Prompt
        const systemPrompt = `You are an expert AI legal assistant with comprehensive knowledge of law, legal procedures, and case management. You help users understand their legal situations, analyze documents, and organize case information effectively.

**Document Analysis:**
When users upload documents (indicated by "[UPLOADED DOCUMENTS CONTEXT]" in their message), you have full access to read and analyze them thoroughly. Always:
- Read the complete document content carefully
- Extract and cite specific details, names, dates, amounts, and key facts
- Reference exact quotes when relevant
- Identify important legal elements (parties, jurisdictions, case types, timelines)
- Point out critical information the user should be aware of

**Your Expertise Includes:**
- Contract Law, Tort Law, Criminal Law, Family Law, Corporate Law, Employment Law
- Legal procedures, court systems, and jurisdictions
- Document review and evidence assessment
- Case strategy and information gathering
- Legal terminology and concept explanation

**Your Approach:**
1. **Listen Carefully**: Understand the user's situation and concerns
2. **Analyze Thoroughly**: Review all provided information and documents in detail
3. **Ask Smart Questions**: Probe for critical details (who, what, when, where, why, how)
4. **Organize Information**: Structure case details logically and clearly
5. **Educate**: Explain legal concepts in accessible language
6. **Guide Next Steps**: Suggest what additional information or actions might be needed

**Communication Style:**
- Professional yet approachable and empathetic
- Clear, well-structured responses
- Use plain language while maintaining legal accuracy
- Be thorough but concise
- Always cite specific details from documents
- Acknowledge when you reference uploaded materials

**Important Guidelines:**
- You do NOT provide formal legal advice or act as a licensed attorney
- You DO help gather facts, analyze information, explain legal concepts, and organize case details
- Be empathetic - legal matters are often stressful for users
- Be thorough - missing details can be critical in legal situations
- Be honest about limitations and suggest consulting a licensed attorney for legal advice

Remember: You're a knowledgeable assistant helping with case intake, document analysis, and legal information organization - not providing attorney-client privileged legal counsel.`

        // Build context with uploaded documents
        let userMessageWithContext = message

        if (documents && documents.length > 0) {
            const documentContext = documents.map((doc: any) => {
                let context = `\n\n--- Document: ${doc.filename} ---\n`

                if (doc.extractedText) {
                    context += `\nContent Preview:\n${doc.extractedText}\n`
                }

                if (doc.keyInfo) {
                    context += `\nExtracted Information:\n`
                    if (doc.keyInfo.parties?.length > 0) {
                        context += `- Parties: ${doc.keyInfo.parties.join(', ')}\n`
                    }
                    if (doc.keyInfo.caseTypes?.length > 0) {
                        context += `- Case Types: ${doc.keyInfo.caseTypes.join(', ')}\n`
                    }
                    if (doc.keyInfo.jurisdictions?.length > 0) {
                        context += `- Jurisdictions: ${doc.keyInfo.jurisdictions.join(', ')}\n`
                    }
                    if (doc.keyInfo.dates?.length > 0) {
                        context += `- Important Dates: ${doc.keyInfo.dates.join(', ')}\n`
                    }
                    if (doc.keyInfo.amounts?.length > 0) {
                        context += `- Amounts: ${doc.keyInfo.amounts.join(', ')}\n`
                    }
                }

                return context
            }).join('\n')

            userMessageWithContext = `${message}\n\n[UPLOADED DOCUMENTS CONTEXT]:${documentContext}`
        }

        // Create streaming response
        const stream = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userMessageWithContext }
            ],
            max_tokens: 2000,
            temperature: 0.7,
            stream: true,
        })

        // Create a ReadableStream for SSE
        const encoder = new TextEncoder()
        const readable = new ReadableStream({
            async start(controller) {
                try {
                    for await (const chunk of stream) {
                        const content = chunk.choices[0]?.delta?.content || ''
                        if (content) {
                            const data = `data: ${JSON.stringify({ content })}\n\n`
                            controller.enqueue(encoder.encode(data))
                        }
                    }
                    controller.enqueue(encoder.encode('data: [DONE]\n\n'))
                    controller.close()
                } catch (error) {
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
        console.error('Chat API error:', error)
        return NextResponse.json(
            {
                message: 'An error occurred while processing your request',
                error: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        )
    }
}

