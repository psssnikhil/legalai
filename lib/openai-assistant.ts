import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

const ASSISTANT_INSTRUCTIONS = `You are an expert legal AI assistant for a law firm. You help lawyers with:
- Analyzing case documents and summarizing key facts
- Answering questions about uploaded case files
- Drafting legal documents and correspondence
- Identifying risks, deadlines, and action items
- Providing legal research insights

Always be precise, professional, and cite specific parts of documents when relevant. When you don't have enough information, say so clearly.`

// Get or create the singleton Legal AI Assistant.
// The assistant ID is stored in OPENAI_ASSISTANT_ID env var after first creation.
export async function getOrCreateAssistant(): Promise<string> {
  if (process.env.OPENAI_ASSISTANT_ID) {
    return process.env.OPENAI_ASSISTANT_ID
  }

  const assistant = await openai.beta.assistants.create({
    name: 'Legal AI Assistant',
    instructions: ASSISTANT_INSTRUCTIONS,
    tools: [{ type: 'file_search' }],
    model: 'gpt-4o-mini',
  })

  console.log(`[OpenAI] Created assistant: ${assistant.id}`)
  console.log(`[OpenAI] Add OPENAI_ASSISTANT_ID="${assistant.id}" to your .env.local`)
  return assistant.id
}

// Get or create a vector store for a case.
// Note: vectorStores is at the top level of the OpenAI client (openai.vectorStores), not on beta.
export async function getOrCreateVectorStore(
  caseId: string,
  caseTitle: string,
  existingVectorStoreId?: string | null
): Promise<string> {
  if (existingVectorStoreId) {
    try {
      await openai.vectorStores.retrieve(existingVectorStoreId)
      return existingVectorStoreId
    } catch {
      // Vector store was deleted; fall through to create a new one
    }
  }

  const vectorStore = await openai.vectorStores.create({
    name: `Legal AI - Case: ${caseTitle}`,
  })

  console.log(`[OpenAI] Created vector store for case ${caseId}: ${vectorStore.id}`)
  return vectorStore.id
}

// Upload a file to OpenAI Files API and add it to a vector store
export async function uploadFileToOpenAI(
  buffer: Buffer,
  filename: string,
  mimeType: string,
  vectorStoreId: string
): Promise<string> {
  // Copy into a fresh ArrayBuffer to satisfy the Blob BlobPart type constraint
  const arrayBuffer = new ArrayBuffer(buffer.length)
  new Uint8Array(arrayBuffer).set(buffer)
  const blob = new Blob([arrayBuffer], { type: mimeType })
  const file = new File([blob], filename, { type: mimeType })

  const uploadedFile = await openai.files.create({
    file,
    purpose: 'assistants',
  })

  await openai.vectorStores.files.create(vectorStoreId, {
    file_id: uploadedFile.id,
  })

  console.log(`[OpenAI] Uploaded file ${filename}: ${uploadedFile.id}`)
  return uploadedFile.id
}

// Get or create a thread for a chat session
export async function getOrCreateThread(
  existingThreadId?: string | null,
  vectorStoreId?: string | null
): Promise<string> {
  if (existingThreadId) {
    try {
      await openai.beta.threads.retrieve(existingThreadId)
      return existingThreadId
    } catch {
      // Thread was deleted; fall through to create a new one
    }
  }

  const threadParams: OpenAI.Beta.ThreadCreateParams = {}
  if (vectorStoreId) {
    threadParams.tool_resources = {
      file_search: { vector_store_ids: [vectorStoreId] },
    }
  }

  const thread = await openai.beta.threads.create(threadParams)
  console.log(`[OpenAI] Created thread: ${thread.id}`)
  return thread.id
}

// Send a message and get a response using polling
export async function sendMessageToThread(
  threadId: string,
  assistantId: string,
  message: string,
  caseContext?: string
): Promise<string> {
  const fullMessage = caseContext
    ? `${message}\n\n---\nCase context:\n${caseContext}`
    : message

  await openai.beta.threads.messages.create(threadId, {
    role: 'user',
    content: fullMessage,
  })

  const run = await openai.beta.threads.runs.createAndPoll(threadId, {
    assistant_id: assistantId,
  })

  if (run.status !== 'completed') {
    throw new Error(`Run failed with status: ${run.status}`)
  }

  const messages = await openai.beta.threads.messages.list(threadId, {
    order: 'desc',
    limit: 1,
  })

  const lastMessage = messages.data[0]
  if (!lastMessage || lastMessage.role !== 'assistant') {
    throw new Error('No assistant response received')
  }

  const content = lastMessage.content[0]
  if (content.type !== 'text') {
    throw new Error('Unexpected response type')
  }

  // Strip citation markers like 【4:0†source】
  return content.text.value.replace(/【[^】]*】/g, '').trim()
}

// Delete a file from OpenAI (cleanup)
export async function deleteOpenAIFile(fileId: string): Promise<void> {
  try {
    await openai.files.del(fileId)
  } catch (err) {
    console.error(`[OpenAI] Failed to delete file ${fileId}:`, err)
  }
}
