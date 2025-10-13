import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(req: NextRequest) {
    try {
        const { text, beforeContext, afterContext, mode, isRealTimeEdit } = await req.json()

        if (!text || text.trim().length === 0) {
            return NextResponse.json(
                { error: 'Text is required' },
                { status: 400 }
            )
        }

        // Different correction modes
        const systemPrompts = {
            legal: `You are an expert legal document formatter. Your task is to:
1. Add proper punctuation (periods, commas, question marks, etc.)
2. Fix grammar and spelling errors
3. Format text appropriately for legal documents
4. Capitalize proper nouns and legal terms correctly
5. Structure paragraphs logically
6. Preserve legal terminology and context
7. Maintain consistency with surrounding text
8. DO NOT change the meaning or add new information
9. Return ONLY the corrected text without explanations or commentary`,

            general: `You are a professional text editor. Your task is to:
1. Add proper punctuation (periods, commas, question marks, etc.)
2. Fix grammar and spelling errors
3. Correct capitalization
4. Format sentences and paragraphs properly
5. Improve readability while preserving meaning
6. Maintain consistency with surrounding text
7. DO NOT add new information or change the core message
8. Return ONLY the corrected text without explanations or commentary`,

            minimal: `You are a punctuation and grammar assistant. Your task is to:
1. Add missing punctuation (periods, commas, etc.)
2. Fix obvious spelling errors
3. Correct basic grammar mistakes
4. Maintain consistency with surrounding text
5. Keep changes minimal - preserve the original style
6. Return ONLY the corrected text without explanations or commentary`
        }

        const systemPrompt = systemPrompts[mode as keyof typeof systemPrompts] || systemPrompts.general

        const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
            {
                role: 'system',
                content: systemPrompt
            }
        ]

        // Build context-aware prompt
        let contextPrompt = ''

        if (beforeContext && beforeContext.trim()) {
            contextPrompt += `Text that comes BEFORE (for context):\n"${beforeContext}"\n\n`
        }

        contextPrompt += `Text to correct:\n"${text}"\n`

        if (afterContext && afterContext.trim()) {
            contextPrompt += `\nText that comes AFTER (for context):\n"${afterContext}"`
        }

        if (isRealTimeEdit) {
            contextPrompt += `\n\nNote: This is a real-time edit. Ensure the correction flows naturally with the surrounding context and maintains sentence continuity.`
        }

        messages.push({
            role: 'user',
            content: contextPrompt
        })

        const completion = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages,
            temperature: 0.3,
            max_tokens: 1000,
        })

        const correctedText = completion.choices[0]?.message?.content?.trim() || text

        return NextResponse.json({
            original: text,
            corrected: correctedText,
            mode
        })

    } catch (error: any) {
        console.error('Dictation correction error:', error)

        // Return original text if AI fails
        const { text } = await req.json().catch(() => ({ text: '' }))

        return NextResponse.json(
            {
                error: error.message || 'Failed to correct text',
                original: text,
                corrected: text // Fallback to original
            },
            { status: 500 }
        )
    }
}

