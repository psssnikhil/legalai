import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
    try {
        const { caseTitle, documents, analysisType } = await request.json()

        console.log('[case-analysis] Starting analysis:', analysisType, 'for case:', caseTitle)

        // Build document context
        let documentContext = ''
        if (documents && documents.length > 0) {
            documentContext = documents.map((doc: any) => {
                return `\n\n--- Document: ${doc.filename} ---\n${doc.extractedText || ''}`
            }).join('\n')
        }

        let prompt = ''

        if (analysisType === 'quick') {
            prompt = `Analyze the following legal case and documents.

Case Title: ${caseTitle}

Documents:${documentContext}

You MUST respond with ONLY a valid JSON object (no markdown, no extra text) in exactly this format:

{
  "executiveSummary": "2-3 sentence case summary",
  "parties": {
    "plaintiff": "plaintiff name if found",
    "defendant": "defendant name if found"
  },
  "keyFacts": ["fact 1", "fact 2", "fact 3", "fact 4", "fact 5"],
  "riskLevel": "Low/Medium/High",
  "riskReason": "brief explanation of risk assessment",
  "actionItems": ["action 1", "action 2", "action 3", "action 4"]
}

IMPORTANT: Return ONLY the JSON object, no other text or markdown.`
        } else {
            prompt = `Perform a COMPREHENSIVE LEGAL ANALYSIS of the following case and documents:

Case Title: ${caseTitle}

Documents:${documentContext}

You MUST respond with ONLY a valid JSON object (no markdown, no extra text) in exactly this format:

{
  "executiveSummary": "4-5 sentence summary here",
  "parties": {
    "plaintiff": "plaintiff name",
    "defendant": "defendant name",
    "other": []
  },
  "caseType": "type of case",
  "jurisdiction": "jurisdiction info",
  "winningProbability": "XX%",
  "strengths": ["strength 1", "strength 2", "strength 3"],
  "weaknesses": ["weakness 1", "weakness 2", "weakness 3"],
  "opportunities": ["opportunity 1", "opportunity 2"],
  "threats": ["threat 1", "threat 2"],
  "recommendations": ["recommendation 1", "recommendation 2", "recommendation 3"],
  "actionItems": ["action 1", "action 2", "action 3"],
  "riskAssessment": "comprehensive risk assessment text"
}

IMPORTANT: Return ONLY the JSON object, no other text or markdown.`
        }

        console.log('[case-analysis] Calling OpenAI for', analysisType, 'analysis')

        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                {
                    role: "system",
                    content: `You are an expert legal analyst specializing in Indian law and legal procedures. Provide thorough, accurate legal analysis based on the information provided. Format your response as valid JSON.`
                },
                {
                    role: "user",
                    content: prompt
                }
            ],
            temperature: 0.3,
            max_tokens: analysisType === 'quick' ? 1500 : 4000,
        })

        const analysisText = completion.choices[0]?.message?.content || '{}'

        // Try to parse as JSON, fallback to structured text
        let analysis
        try {
            // Remove markdown code blocks if present
            let cleanedText = analysisText
            if (cleanedText.includes('```json')) {
                cleanedText = cleanedText.replace(/```json\n?/g, '').replace(/```\n?/g, '')
            }
            if (cleanedText.includes('```')) {
                cleanedText = cleanedText.replace(/```\n?/g, '')
            }

            analysis = JSON.parse(cleanedText.trim())
        } catch (parseError) {
            console.error('[case-analysis] JSON parse error:', parseError)
            // If not valid JSON, create structured response from text
            analysis = {
                executiveSummary: analysisText,
                type: analysisType,
                generatedAt: new Date().toISOString(),
                note: 'Analysis generated in text format'
            }
        }

        console.log('[case-analysis] Analysis completed successfully')

        return NextResponse.json({
            success: true,
            analysis,
            type: analysisType,
            caseTitle
        })

    } catch (error) {
        console.error('[case-analysis] Error:', error)
        return NextResponse.json(
            {
                success: false,
                message: error instanceof Error ? error.message : 'Analysis failed'
            },
            { status: 500 }
        )
    }
}

