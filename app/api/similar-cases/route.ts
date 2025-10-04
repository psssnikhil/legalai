import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
    try {
        const { caseTitle, caseType, facts, jurisdiction } = await request.json()

        console.log('[similar-cases] Searching for similar Indian cases')

        // Use OpenAI to generate relevant Indian case law precedents
        const prompt = `Based on the following case details, identify relevant Indian legal precedents:

Case Title: ${caseTitle}
Case Type: ${caseType || 'General'}
Jurisdiction: ${jurisdiction || 'India'}
Key Facts: ${facts || 'Not provided'}

You MUST respond with ONLY a valid JSON array (no markdown, no extra text) with 5-7 Indian cases in exactly this format:

[
  {
    "citation": "AIR 2020 SC 123",
    "caseName": "State of Maharashtra vs. Ranjit Singh",
    "court": "Supreme Court of India",
    "year": "2020",
    "summary": "Brief 2-3 sentence summary of the case",
    "relevance": "Why this case is relevant to the current case",
    "legalPrinciple": "Key legal principle established",
    "outcome": "Defendant favored"
  }
]

Focus on REAL Indian Supreme Court/High Court cases if you know them. IMPORTANT: Return ONLY the JSON array, no other text or markdown.`

        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                {
                    role: "system",
                    content: `You are an Indian legal research expert with deep knowledge of Supreme Court and High Court precedents. Provide accurate case citations and legal precedents from Indian jurisprudence.`
                },
                {
                    role: "user",
                    content: prompt
                }
            ],
            temperature: 0.3,
            max_tokens: 3000,
        })

        const casesText = completion.choices[0]?.message?.content || '[]'

        let similarCases
        try {
            // Remove markdown code blocks if present
            let cleanedText = casesText
            if (cleanedText.includes('```json')) {
                cleanedText = cleanedText.replace(/```json\n?/g, '').replace(/```\n?/g, '')
            }
            if (cleanedText.includes('```')) {
                cleanedText = cleanedText.replace(/```\n?/g, '')
            }

            const parsed = JSON.parse(cleanedText.trim())
            similarCases = Array.isArray(parsed) ? parsed : (parsed.cases || [parsed])
        } catch (parseError) {
            console.error('[similar-cases] JSON parse error:', parseError)
            // Fallback structure
            similarCases = [{
                citation: "Error parsing cases",
                caseName: "See raw data below",
                court: "N/A",
                year: "N/A",
                summary: casesText.substring(0, 500),
                relevance: "Please review the analysis manually",
                legalPrinciple: "N/A",
                outcome: "N/A"
            }]
        }

        console.log('[similar-cases] Found', similarCases.length, 'similar cases')

        return NextResponse.json({
            success: true,
            cases: similarCases,
            totalFound: similarCases.length
        })

    } catch (error) {
        console.error('[similar-cases] Error:', error)
        return NextResponse.json(
            {
                success: false,
                message: error instanceof Error ? error.message : 'Case search failed',
                cases: []
            },
            { status: 500 }
        )
    }
}

