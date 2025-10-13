'use client'

import { useState, useRef, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Paperclip, Mic, Send, Bot, User, FileText, Download, X } from 'lucide-react'
import MessageBubble from './MessageBubble'
import DocumentUpload from './DocumentUpload'
import VoiceRecorder from './VoiceRecorder'
import DocumentChip from './DocumentChip'

interface Message {
  id: string
  content: string
  role: 'user' | 'assistant'
  timestamp: Date
  attachments?: Array<{
    id: string
    name: string
    type: string
    size: number
  }>
  sources?: Array<{
    documentId: string
    documentName: string
    chunkIndex: number
    relevanceScore: number
    chunkContent?: string
    pageNumber?: number
  }>
  ragEnabled?: boolean
  retrievalUsed?: boolean
  routerReasoning?: string
}

interface ChatInterfaceProps {
  onSessionChange?: (sessionId: string) => void
  initialDocuments?: any[]
  onViewPDF?: (documentId: string, documentName: string, pageNumber?: number) => void
}

export default function ChatInterface({ onSessionChange, initialDocuments = [], onViewPDF }: ChatInterfaceProps) {
  const { data: session } = useSession()
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: "Hello! I'm your AI Legal Assistant. I'm here to help you understand your legal situation, analyze documents, and organize case information.\n\n**I can help you with:**\n• Analyzing legal documents (contracts, agreements, court filings)\n• Understanding case details and legal concepts\n• Identifying parties, dates, amounts, and key facts\n• Organizing information for your case\n• Explaining legal terminology in plain language\n• Gathering comprehensive case details\n\n**To get started:**\n• Upload documents for detailed analysis\n• Ask me questions about your legal situation\n• Share details about your case\n\nHow can I assist you today?",
      role: 'assistant',
      timestamp: new Date()
    }
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showUpload, setShowUpload] = useState(false)
  const [showVoice, setShowVoice] = useState(false)
  const [uploadedDocuments, setUploadedDocuments] = useState<any[]>(initialDocuments)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Update documents when initialDocuments changes
  useEffect(() => {
    if (initialDocuments.length > 0 && initialDocuments.length > uploadedDocuments.length) {
      console.log('[ChatInterface] Received new documents from parent:', initialDocuments)
      setUploadedDocuments(initialDocuments)

      // Add a system message about the newly uploaded documents
      const newDocs = initialDocuments.slice(uploadedDocuments.length)
      if (newDocs.length > 0) {
        const uploadMessage: Message = {
          id: Date.now().toString(),
          content: `📄 Uploaded ${newDocs.length} document(s): ${newDocs.map((d: any) => d.filename).join(', ')}. I can now answer questions about these documents!`,
          role: 'assistant',
          timestamp: new Date()
        }
        setMessages(prev => [...prev, uploadMessage])
      }
    }
  }, [initialDocuments])

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      content: input.trim(),
      role: 'user',
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage.content,
          sessionId: 'current-session',
          documents: uploadedDocuments // Include uploaded documents for context
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Chat error:', errorText)
        throw new Error('Failed to send message')
      }

      const data = await response.json()

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: data.message,
        role: 'assistant',
        timestamp: new Date(),
        sources: data.sources,
        ragEnabled: data.ragEnabled,
        retrievalUsed: data.retrievalUsed,
        routerReasoning: data.routerReasoning
      }

      setMessages(prev => [...prev, assistantMessage])

      // Notify parent component of session change
      if (data.sessionId && onSessionChange) {
        onSessionChange(data.sessionId)
      }
    } catch (error) {
      console.error('Error sending message:', error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: "I'm sorry, I encountered an error. Please try again.",
        role: 'assistant',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleFileUpload = async (files: File[], uploadResults: any[]) => {
    console.log('[ChatInterface] Files uploaded:', files.length)
    console.log('[ChatInterface] Upload results:', uploadResults)

    // Store the uploaded documents with their extracted content
    setUploadedDocuments(prev => [...prev, ...uploadResults])

    // Add a system message about the upload
    const uploadMessage: Message = {
      id: Date.now().toString(),
      content: `📄 Uploaded ${files.length} document(s): ${files.map(f => f.name).join(', ')}. I can now answer questions about these documents!`,
      role: 'assistant',
      timestamp: new Date()
    }
    setMessages(prev => [...prev, uploadMessage])
  }

  const handleVoiceRecording = (transcript: string) => {
    if (transcript.trim()) {
      setInput(transcript)
      setShowVoice(false)
    }
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-white">
      {/* Document Context Banner */}
      {uploadedDocuments.length > 0 && (
        <div className="bg-blue-50 border-b border-blue-200 px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-900">
                {uploadedDocuments.length} Document{uploadedDocuments.length !== 1 ? 's' : ''} Loaded
              </span>
            </div>
            <button
              onClick={() => setUploadedDocuments([])}
              className="text-xs text-blue-600 hover:text-blue-800 underline"
            >
              Clear All
            </button>
          </div>
          <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2">
            {uploadedDocuments.map((doc, index) => (
              <DocumentChip
                key={index}
                doc={doc}
                index={index}
                onRemove={(idx) => setUploadedDocuments(prev => prev.filter((_, i) => i !== idx))}
              />
            ))}
          </div>
        </div>
      )}

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Messages */}
        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} onViewPDF={onViewPDF} />
        ))}

        {/* Loading indicator */}
        {isLoading && (
          <div className="flex items-center gap-2 text-gray-500">
            <Bot className="w-5 h-5 animate-pulse" />
            <span>AI is thinking...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area - ChatGPT Style */}
      <div className="border-t border-gray-200 bg-white p-6">
        <div className="max-w-4xl mx-auto">
          <div className="relative">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Message Legal AI Assistant... (Press Enter to send, Shift+Enter for new line)"
              className="w-full p-4 pr-12 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none shadow-sm"
              rows={3}
              disabled={isLoading}
              autoFocus
            />
            <button
              onClick={handleSendMessage}
              disabled={!input.trim() || isLoading}
              className="absolute bottom-3 right-3 p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105"
              title="Send message"
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </div>
          <div className="mt-2 text-xs text-gray-500 text-center">
            Legal AI can make mistakes. Verify important information.
          </div>
        </div>

      </div>
    </div>
  )
}
