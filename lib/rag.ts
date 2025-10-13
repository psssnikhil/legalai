import OpenAI from 'openai'

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || '',
})

/**
 * Router to decide if document retrieval is needed
 * Uses a lightweight model to classify the query
 */
export async function shouldUseDocumentRetrieval(query: string): Promise<{ useRetrieval: boolean; reasoning: string }> {
    try {
        const response = await openai.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: [
                {
                    role: 'system',
                    content: `You are a query router. Analyze if a user's question requires retrieving information from documents.

Answer YES if the query:
- Asks about specific document content ("what does the document say", "summarize this document")
- Requests facts, dates, names, or details that would be in uploaded documents
- References "the document", "the file", "the contract", "the case", etc.
- Asks to extract, analyze, or cite information from documents

Answer NO if the query:
- Is a general legal question that doesn't need specific documents
- Asks for legal advice or explanations of concepts
- Is conversational or greeting
- Asks about how to use the system
- Is about legal theory, procedures, or general information

Respond in this exact JSON format:
{"useRetrieval": true/false, "reasoning": "brief explanation"}`
                },
                {
                    role: 'user',
                    content: `Query: "${query}"\n\nShould I use document retrieval?`
                }
            ],
            temperature: 0.1,
            max_tokens: 100,
        })

        const content = response.choices[0]?.message?.content || ''
        console.log('[Router] Raw response:', content)

        // Try to parse JSON response
        try {
            const parsed = JSON.parse(content)
            console.log(`[Router] Decision: ${parsed.useRetrieval ? 'USE RETRIEVAL' : 'DIRECT ANSWER'} - ${parsed.reasoning}`)
            return {
                useRetrieval: parsed.useRetrieval === true,
                reasoning: parsed.reasoning || 'No reasoning provided'
            }
        } catch (parseError) {
            // Fallback: look for keywords if JSON parsing fails
            const lowerContent = content.toLowerCase()
            const useRetrieval = lowerContent.includes('"useretrieval": true') ||
                lowerContent.includes('yes') ||
                lowerContent.includes('true')
            console.log(`[Router] Fallback decision: ${useRetrieval ? 'USE RETRIEVAL' : 'DIRECT ANSWER'}`)
            return {
                useRetrieval,
                reasoning: 'Fallback decision based on keyword matching'
            }
        }
    } catch (error) {
        console.error('[Router] Error:', error)
        // On error, default to NOT using retrieval (safer and cheaper)
        return {
            useRetrieval: false,
            reasoning: 'Error in routing, defaulting to direct answer'
        }
    }
}

// In-memory vector store (cleared after each session)
interface VectorDocument {
    id: string
    documentId: string
    documentName: string
    chunk: string
    embedding: number[]
    chunkIndex: number
    pageNumber?: number
    metadata?: any
}

// Session-based vector stores (auto-cleanup)
const vectorStores = new Map<string, VectorDocument[]>()
const sessionTimestamps = new Map<string, number>()

// Auto-cleanup: Clear stores older than 1 hour
const CLEANUP_INTERVAL = 60 * 60 * 1000 // 1 hour
const SESSION_TIMEOUT = 60 * 60 * 1000 // 1 hour

setInterval(() => {
    const now = Date.now()
    for (const [sessionId, timestamp] of sessionTimestamps.entries()) {
        if (now - timestamp > SESSION_TIMEOUT) {
            vectorStores.delete(sessionId)
            sessionTimestamps.delete(sessionId)
            console.log(`[RAG] Cleaned up expired session: ${sessionId}`)
        }
    }
}, CLEANUP_INTERVAL)

/**
 * Check if a session is already indexed
 */
export function isSessionIndexed(sessionId: string): boolean {
    const vectorDocs = vectorStores.get(sessionId)
    return vectorDocs !== undefined && vectorDocs.length > 0
}

/**
 * Get indexed session info
 */
export function getSessionIndexInfo(sessionId: string): { indexed: boolean; documentCount: number; chunkCount: number } {
    const vectorDocs = vectorStores.get(sessionId)
    if (!vectorDocs || vectorDocs.length === 0) {
        return { indexed: false, documentCount: 0, chunkCount: 0 }
    }

    // Count unique documents
    const uniqueDocIds = new Set(vectorDocs.map(doc => doc.documentId))

    return {
        indexed: true,
        documentCount: uniqueDocIds.size,
        chunkCount: vectorDocs.length
    }
}

/**
 * Split text into chunks for embedding
 */
function chunkText(text: string, chunkSize: number = 1000, overlap: number = 200): string[] {
    const chunks: string[] = []
    let start = 0

    while (start < text.length) {
        const end = Math.min(start + chunkSize, text.length)
        chunks.push(text.substring(start, end))

        // Move forward by chunkSize - overlap to create overlapping chunks
        // but ensure we always make progress
        const nextStart = start + chunkSize - overlap
        if (nextStart <= start) {
            // Safety check: if we're not making progress, break
            break
        }
        start = nextStart
    }

    return chunks
}

/**
 * Calculate cosine similarity between two vectors
 */
function cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0

    let dotProduct = 0
    let normA = 0
    let normB = 0

    for (let i = 0; i < a.length; i++) {
        dotProduct += a[i] * b[i]
        normA += a[i] * a[i]
        normB += b[i] * b[i]
    }

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB))
}

/**
 * Create embeddings for text chunks
 */
async function createEmbedding(text: string): Promise<number[]> {
    try {
        const response = await openai.embeddings.create({
            model: 'text-embedding-3-small',
            input: text,
        })
        return response.data[0].embedding
    } catch (error) {
        console.error('[RAG] Error creating embedding:', error)
        throw error
    }
}

/**
 * Index documents for a user session
 */
export async function indexDocuments(
    sessionId: string,
    documents: Array<{ id: string; name: string; content: string; metadata?: any }>
): Promise<{ success: boolean; chunksIndexed: number }> {
    try {
        console.log(`[RAG] Indexing ${documents.length} documents for session ${sessionId}`)

        const vectorDocs: VectorDocument[] = []

        for (const doc of documents) {
            if (!doc.content || doc.content.trim().length === 0) {
                console.log(`[RAG] Skipping empty document: ${doc.name}`)
                continue
            }

            // Split document into chunks
            const chunks = chunkText(doc.content)
            console.log(`[RAG] Document ${doc.name}: ${chunks.length} chunks`)

            // Create embeddings for each chunk
            // Estimate page numbers (rough estimate: ~3000 chars per page)
            const CHARS_PER_PAGE = 3000

            for (let i = 0; i < chunks.length; i++) {
                const embedding = await createEmbedding(chunks[i])

                // Calculate approximate starting character position for this chunk
                const chunkSize = 1000
                const overlap = 200
                const charPosition = i * (chunkSize - overlap)
                const estimatedPage = Math.floor(charPosition / CHARS_PER_PAGE) + 1

                vectorDocs.push({
                    id: `${doc.id}_chunk_${i}`,
                    documentId: doc.id,
                    documentName: doc.name,
                    chunk: chunks[i],
                    embedding,
                    chunkIndex: i,
                    pageNumber: estimatedPage,
                    metadata: doc.metadata,
                })
            }
        }

        // Store in memory
        vectorStores.set(sessionId, vectorDocs)
        sessionTimestamps.set(sessionId, Date.now())

        console.log(`[RAG] Indexed ${vectorDocs.length} chunks for session ${sessionId}`)

        return {
            success: true,
            chunksIndexed: vectorDocs.length,
        }
    } catch (error) {
        console.error('[RAG] Error indexing documents:', error)
        return {
            success: false,
            chunksIndexed: 0,
        }
    }
}

/**
 * Retrieve relevant document chunks for a query
 */
export async function retrieveRelevantChunks(
    sessionId: string,
    query: string,
    topK: number = 5
): Promise<Array<{ documentId: string; documentName: string; chunk: string; score: number; chunkIndex: number }>> {
    try {
        // Get vector store for session
        const vectorDocs = vectorStores.get(sessionId)

        if (!vectorDocs || vectorDocs.length === 0) {
            console.log(`[RAG] No indexed documents for session ${sessionId}`)
            return []
        }

        // Update session timestamp
        sessionTimestamps.set(sessionId, Date.now())

        // Create query embedding
        const queryEmbedding = await createEmbedding(query)

        // Calculate similarities
        const results = vectorDocs.map((doc) => ({
            documentId: doc.documentId,
            documentName: doc.documentName,
            chunk: doc.chunk,
            chunkIndex: doc.chunkIndex,
            score: cosineSimilarity(queryEmbedding, doc.embedding),
        }))

        // Sort by similarity and return top K
        results.sort((a, b) => b.score - a.score)

        const topResults = results.slice(0, topK)
        console.log(`[RAG] Retrieved ${topResults.length} relevant chunks (scores: ${topResults.map(r => r.score.toFixed(3)).join(', ')})`)

        return topResults
    } catch (error) {
        console.error('[RAG] Error retrieving chunks:', error)
        return []
    }
}

/**
 * Get a specific chunk by session, document ID, and chunk index
 */
export function getChunkContent(
    sessionId: string,
    documentId: string,
    chunkIndex: number
): { chunk: string; documentName: string } | null {
    try {
        const vectorDocs = vectorStores.get(sessionId)

        if (!vectorDocs) {
            return null
        }

        const chunkDoc = vectorDocs.find(
            doc => doc.documentId === documentId && doc.chunkIndex === chunkIndex
        )

        if (!chunkDoc) {
            return null
        }

        return {
            chunk: chunkDoc.chunk,
            documentName: chunkDoc.documentName
        }
    } catch (error) {
        console.error('[RAG] Error getting chunk content:', error)
        return null
    }
}

/**
 * Clear vector store for a session
 */
export function clearSessionVectorStore(sessionId: string): void {
    vectorStores.delete(sessionId)
    sessionTimestamps.delete(sessionId)
    console.log(`[RAG] Cleared vector store for session ${sessionId}`)
}

/**
 * Get store statistics
 */
export function getStoreStats() {
    const stats = {
        totalSessions: vectorStores.size,
        sessions: [] as Array<{ sessionId: string; chunks: number; age: number }>,
    }

    const now = Date.now()
    for (const [sessionId, docs] of vectorStores.entries()) {
        const timestamp = sessionTimestamps.get(sessionId) || now
        stats.sessions.push({
            sessionId,
            chunks: docs.length,
            age: Math.floor((now - timestamp) / 1000 / 60), // minutes
        })
    }

    return stats
}

/**
 * Generate RAG-enhanced response with source attribution
 */
export async function generateRAGResponse(
    query: string,
    sessionId: string,
    chatHistory?: string
): Promise<{ response: string; sources: Array<{ documentId: string; documentName: string; chunkIndex: number; relevanceScore: number; chunkContent?: string; pageNumber?: number }> }> {
    try {
        // Retrieve relevant chunks
        const relevantChunks = await retrieveRelevantChunks(sessionId, query, 5)

        if (relevantChunks.length === 0) {
            // No relevant documents, return standard response
            const completion = await openai.chat.completions.create({
                model: 'gpt-4',
                messages: [
                    {
                        role: 'system',
                        content: 'You are a helpful legal AI assistant. Provide accurate and thoughtful responses to legal questions.',
                    },
                    ...(chatHistory ? [{ role: 'system' as const, content: `Previous conversation:\n${chatHistory}` }] : []),
                    {
                        role: 'user',
                        content: query,
                    },
                ],
                temperature: 0.7,
                max_tokens: 1000,
            })

            return {
                response: completion.choices[0]?.message?.content || 'I apologize, but I could not generate a response.',
                sources: [],
            }
        }

        // Build context from relevant chunks with numbered sources
        const context = relevantChunks
            .map((chunk, idx) => `[${idx + 1}] Document: "${chunk.documentName}"\n${chunk.chunk}`)
            .join('\n\n---\n\n')

        // Generate response with context
        const completion = await openai.chat.completions.create({
            model: 'gpt-4',
            messages: [
                {
                    role: 'system',
                    content: `You are a helpful legal AI assistant with access to document context. 

IMPORTANT: When answering, write naturally and conversationally. Use inline citations by adding [1], [2], etc. after statements that come from specific sources.

Example:
"The applicant's visa appointment is scheduled for March 15, 2024 [1]. The required documents include a valid passport and proof of financial support [2]."

Guidelines:
- Write in a clear, professional tone
- Use inline citations [1], [2], [3] etc. to reference sources
- Only cite information that actually comes from the provided sources
- You can make multiple citations in one response
- Don't mention "according to the document" - just use the citation number
- Be specific and accurate`,
                },
                {
                    role: 'system',
                    content: `Here are the relevant excerpts from the documents:\n\n${context}`,
                },
                ...(chatHistory ? [{ role: 'system' as const, content: `Previous conversation:\n${chatHistory}` }] : []),
                {
                    role: 'user',
                    content: query,
                },
            ],
            temperature: 0.7,
            max_tokens: 1500,
        })

        // Extract sources with chunk content
        const sources = relevantChunks.map((chunk) => ({
            documentId: chunk.documentId,
            documentName: chunk.documentName,
            chunkIndex: chunk.chunkIndex,
            relevanceScore: chunk.score,
            chunkContent: chunk.chunk, // Include the actual chunk content
            pageNumber: chunk.pageNumber, // Include estimated page number
        }))

        return {
            response: completion.choices[0]?.message?.content || 'I apologize, but I could not generate a response.',
            sources,
        }
    } catch (error) {
        console.error('[RAG] Error generating RAG response:', error)
        throw error
    }
}

