import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export interface CaseAnalysisResult {
  parties: {
    plaintiff?: string
    defendant?: string
    other?: string[]
  }
  caseType: string
  jurisdiction: string
  winningProbability: number
  keyFacts: string[]
  evidence: string[]
  actionItems: string[]
  confidence: number
  summary: string
  legalIssues: string[]
  timeline: string[]
}

export async function analyzeCaseWithAI(
  chatHistory: string,
  documents: Array<{ text: string; filename: string }>,
  voiceNotes?: string[]
): Promise<CaseAnalysisResult> {
  try {
    // Combine all input data
    const combinedInput = `
CHAT HISTORY:
${chatHistory}

DOCUMENTS:
${documents.map(doc => `\n--- ${doc.filename} ---\n${doc.text}`).join('\n')}

${voiceNotes ? `\nVOICE NOTES:\n${voiceNotes.join('\n')}` : ''}
`

    const systemPrompt = `You are an expert legal AI assistant specializing in case analysis and intake. Analyze the provided legal case information and extract structured data.

Return a JSON response with the following structure:
{
  "parties": {
    "plaintiff": "string or null",
    "defendant": "string or null", 
    "other": ["array of other parties"]
  },
  "caseType": "string describing the type of legal case",
  "jurisdiction": "string describing the court/jurisdiction",
  "winningProbability": 0.0-1.0,
  "keyFacts": ["array of key factual findings"],
  "evidence": ["array of evidence mentioned"],
  "actionItems": ["array of immediate action items"],
  "confidence": 0.0-1.0,
  "summary": "brief case summary",
  "legalIssues": ["array of legal issues identified"],
  "timeline": ["array of important dates/events"]
}

Guidelines:
- Be thorough but concise
- Focus on factual information, not legal advice
- If information is unclear, indicate uncertainty in confidence score
- Extract specific names, dates, amounts, and legal terms
- Identify the most important facts and evidence
- Suggest practical next steps
- Use 0.0-1.0 scale for probabilities and confidence
- Return valid JSON only, no additional text`

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: combinedInput }
      ],
      max_tokens: 2000,
      temperature: 0.3,
    })

    const response = completion.choices[0]?.message?.content
    if (!response) {
      throw new Error('No response from AI')
    }

    // Parse JSON response
    const analysis = JSON.parse(response) as CaseAnalysisResult

    // Validate and clean the response
    return {
      parties: analysis.parties || { other: [] },
      caseType: analysis.caseType || 'Unknown',
      jurisdiction: analysis.jurisdiction || 'Unknown',
      winningProbability: Math.max(0, Math.min(1, analysis.winningProbability || 0)),
      keyFacts: Array.isArray(analysis.keyFacts) ? analysis.keyFacts : [],
      evidence: Array.isArray(analysis.evidence) ? analysis.evidence : [],
      actionItems: Array.isArray(analysis.actionItems) ? analysis.actionItems : [],
      confidence: Math.max(0, Math.min(1, analysis.confidence || 0)),
      summary: analysis.summary || 'No summary available',
      legalIssues: Array.isArray(analysis.legalIssues) ? analysis.legalIssues : [],
      timeline: Array.isArray(analysis.timeline) ? analysis.timeline : [],
    }

  } catch (error) {
    console.error('AI Analysis error:', error)
    
    // Return a default structure if analysis fails
    return {
      parties: { other: [] },
      caseType: 'Unknown',
      jurisdiction: 'Unknown',
      winningProbability: 0.5,
      keyFacts: ['Analysis failed - please review manually'],
      evidence: [],
      actionItems: ['Review case details manually', 'Consult with legal team'],
      confidence: 0.1,
      summary: 'AI analysis failed. Please review the case details manually.',
      legalIssues: ['Analysis incomplete'],
      timeline: [],
    }
  }
}

export async function generateChatResponse(
  message: string,
  context: {
    chatHistory: string
    documents: Array<{ text: string; filename: string }>
    caseAnalysis?: CaseAnalysisResult
  }
): Promise<string> {
  try {
    const systemPrompt = `You are an AI legal assistant specializing in case intake. You help users describe their legal cases and gather comprehensive information.

Context about the current case:
${context.caseAnalysis ? `\nCASE ANALYSIS:\n${JSON.stringify(context.caseAnalysis, null, 2)}` : ''}

${context.documents.length > 0 ? `\nUPLOADED DOCUMENTS:\n${context.documents.map(doc => `- ${doc.filename}`).join('\n')}` : ''}

Guidelines:
- Be professional, empathetic, and thorough
- Ask specific questions to understand the case better
- Help organize information systematically
- Focus on gathering facts, not providing legal advice
- If you need more information, ask targeted questions
- Be encouraging and supportive
- Reference uploaded documents when relevant
- Build on previous conversation context`

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message }
      ],
      max_tokens: 1000,
      temperature: 0.7,
    })

    return completion.choices[0]?.message?.content || "I'm sorry, I couldn't process your request. Please try again."

  } catch (error) {
    console.error('Chat response error:', error)
    return "I'm sorry, I encountered an error. Please try again."
  }
}
