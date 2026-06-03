import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// POST /api/intake — generate next round of questions OR finalize
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { summary, rounds, action } = await request.json()
    // rounds = [{ questions: [...], answers: [...] }, ...]
    // action = 'questions' | 'finalize'

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 503 })
    }

    const OpenAI = (await import('openai')).default
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

    // Build context from all previous rounds
    const previousContext = rounds?.length
      ? rounds.map((r: any, i: number) => {
          const qa = r.questions.map((q: string, qi: number) =>
            `Q: ${q}\nA: ${r.answers[qi] || '(not answered)'}`
          ).join('\n\n')
          return `--- Round ${i + 1} ---\n${qa}`
        }).join('\n\n')
      : ''

    if (action === 'finalize') {
      // Generate final structured case summary
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are an expert Indian legal intake specialist. Based on the case summary and all answers collected, generate a comprehensive structured case brief that an advocate can use immediately.

Return a JSON object with these exact fields:
{
  "title": "Short case title (e.g. 'Property Dispute - Sharma vs Kumar')",
  "caseType": "Type of case (Civil/Criminal/Family/Property/Employment/Consumer/Constitutional/Other)",
  "clientName": "Client's full name",
  "clientPhone": "Phone number if mentioned",
  "clientEmail": "Email if mentioned",
  "description": "2-3 paragraph comprehensive case description",
  "oppositeParty": "Opposing party name(s)",
  "keyFacts": ["fact 1", "fact 2", "fact 3", ...],
  "legalIssues": ["issue 1", "issue 2", ...],
  "reliefSought": "What the client wants",
  "urgency": "HIGH / MEDIUM / LOW",
  "recommendedActions": ["action 1", "action 2", ...],
  "documentsNeeded": ["document 1", "document 2", ...],
  "courtJurisdiction": "Which court has jurisdiction"
}`
          },
          {
            role: 'user',
            content: `INITIAL CASE SUMMARY:\n${summary}\n\nQUESTIONS & ANSWERS COLLECTED:\n${previousContext}`
          }
        ],
        response_format: { type: 'json_object' },
        max_tokens: 1500,
      })

      const caseData = JSON.parse(completion.choices[0].message.content || '{}')

      // Save as draft case
      const draftCase = await prisma.case.create({
        data: {
          title: caseData.title || 'Untitled Intake',
          description: caseData.description || '',
          status: 'PENDING',
          priority: caseData.urgency === 'HIGH' ? 'HIGH' : caseData.urgency === 'LOW' ? 'LOW' : 'MEDIUM',
          caseType: caseData.caseType || '',
          clientName: caseData.clientName || '',
          clientPhone: caseData.clientPhone || '',
          clientEmail: caseData.clientEmail || '',
          oppositeParty: caseData.oppositeParty || '',
          isDraft: true,
          tags: JSON.stringify({
            keyFacts: caseData.keyFacts || [],
            legalIssues: caseData.legalIssues || [],
            reliefSought: caseData.reliefSought || '',
            recommendedActions: caseData.recommendedActions || [],
            documentsNeeded: caseData.documentsNeeded || [],
            courtJurisdiction: caseData.courtJurisdiction || '',
            intakeSummary: summary,
            intakeRounds: rounds,
          }),
          userId: session.user.id,
        }
      })

      // Auto-create recommended action tasks
      if (caseData.recommendedActions?.length) {
        await prisma.task.createMany({
          data: caseData.recommendedActions.slice(0, 6).map((action: string) => ({
            title: action,
            caseId: draftCase.id,
          }))
        })
      }

      return NextResponse.json({ caseData, caseId: draftCase.id })
    }

    // Generate next round of questions
    const roundNumber = (rounds?.length || 0) + 1

    const systemPrompt = `You are an expert Indian legal intake specialist conducting a case intake interview. Your job is to ask the most important questions to fully understand a client's legal case.

Round ${roundNumber} of 3. ${roundNumber === 1
  ? 'Ask foundational questions to understand the basic facts of the case.'
  : roundNumber === 2
  ? 'Dig deeper based on answers given. Focus on timeline, evidence, parties involved, and any legal complications.'
  : 'Final round. Fill any remaining gaps — focus on documents, previous legal action, financial aspects, urgency, and anything that could affect the case strategy.'}

Generate exactly 6 questions. Rules:
- Questions must be specific to THIS case, not generic
- Each question should uncover information not already mentioned
- Use simple language (staff filling this on behalf of client)
- For Indian legal context (Indian courts, laws, procedures)
- Cover different aspects — don't ask similar questions
- No yes/no questions — ask for details

Return JSON: { "questions": ["question 1", "question 2", ..., "question 6"] }`

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: `CASE SUMMARY:\n${summary}\n\n${previousContext ? `INFORMATION COLLECTED SO FAR:\n${previousContext}` : 'This is the first round of questions.'}`
        }
      ],
      response_format: { type: 'json_object' },
      max_tokens: 800,
    })

    const result = JSON.parse(completion.choices[0].message.content || '{}')
    return NextResponse.json({ questions: result.questions || [] })

  } catch (err) {
    console.error('[Intake] Error:', err)
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Failed' }, { status: 500 })
  }
}
