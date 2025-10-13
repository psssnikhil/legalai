'use client'

import { Bot, User, FileText, Sparkles } from 'lucide-react'

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

interface MessageBubbleProps {
  message: Message
  onViewPDF?: (documentId: string, documentName: string, pageNumber?: number) => void
}

export default function MessageBubble({ message, onViewPDF }: MessageBubbleProps) {
  const isUser = message.role === 'user'
  const isAssistant = message.role === 'assistant'

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  // Parse message content and render inline citations
  const renderMessageWithCitations = (content: string) => {
    if (!message.sources || message.sources.length === 0) {
      return <div className="whitespace-pre-wrap">{content}</div>
    }

    // Split content by citation pattern [1], [2], etc.
    const citationPattern = /\[(\d+)\]/g
    const parts: Array<{ text: string; citation?: number }> = []
    let lastIndex = 0
    let match

    while ((match = citationPattern.exec(content)) !== null) {
      // Add text before citation
      if (match.index > lastIndex) {
        parts.push({ text: content.substring(lastIndex, match.index) })
      }
      // Add citation
      parts.push({ citation: parseInt(match[1]) })
      lastIndex = match.index + match[0].length
    }

    // Add remaining text
    if (lastIndex < content.length) {
      parts.push({ text: content.substring(lastIndex) })
    }

    return (
      <div className="whitespace-pre-wrap">
        {parts.map((part, idx) => {
          if (part.citation) {
            const sourceIdx = part.citation - 1
            const source = message.sources?.[sourceIdx]

            if (!source) return null

            const relevancePercent = (source.relevanceScore * 100).toFixed(0)

            return (
              <span key={idx} className="relative inline-block group mx-0.5">
                <button
                  onClick={() => {
                    if (onViewPDF) {
                      onViewPDF(source.documentId, source.documentName, source.pageNumber)
                    }
                  }}
                  className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-gradient-to-br from-purple-600 to-indigo-600 rounded hover:from-purple-700 hover:to-indigo-700 transition-all hover:scale-110 align-super cursor-pointer shadow-sm"
                >
                  {part.citation}
                </button>

                {/* Hover Tooltip */}
                <div className="invisible group-hover:visible absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 z-50">
                  <div className="bg-gray-900 text-white text-xs rounded-lg shadow-xl p-3 relative">
                    {/* Arrow */}
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
                      <div className="border-4 border-transparent border-t-gray-900"></div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-start gap-2">
                        <FileText className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-white truncate">{source.documentName}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-xs">
                        {source.pageNumber && (
                          <span className="bg-indigo-600 px-2 py-0.5 rounded">
                            📄 Page {source.pageNumber}
                          </span>
                        )}
                        <span className="bg-green-600 px-2 py-0.5 rounded">
                          {relevancePercent}% match
                        </span>
                      </div>

                      <div className="text-xs text-gray-300 pt-1 border-t border-gray-700">
                        💡 Click to view in PDF
                      </div>
                    </div>
                  </div>
                </div>
              </span>
            )
          }
          return <span key={idx}>{part.text}</span>
        })}
      </div>
    )
  }

  return (
    <div className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {/* Avatar */}
      {!isUser && (
        <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
          <Bot className="w-4 h-4 text-purple-600" />
        </div>
      )}

      {/* Message Content */}
      <div className={`max-w-3xl ${isUser ? 'order-first' : ''}`}>
        <div
          className={`px-4 py-3 rounded-lg ${isUser
            ? 'bg-blue-600 text-white'
            : 'bg-white border border-gray-200 text-gray-900'
            }`}
        >
          {/* Message Text with Inline Citations */}
          {renderMessageWithCitations(message.content)}

          {/* Small badge showing Document Retrieval was used */}
          {message.retrievalUsed && message.sources && message.sources.length > 0 && (
            <div className="mt-3 flex items-center gap-2 text-xs text-purple-700 bg-purple-50 px-3 py-1.5 rounded-lg border border-purple-200 w-fit">
              <Sparkles className="w-3.5 h-3.5" />
              <span className="font-medium">Cited {message.sources.length} source{message.sources.length > 1 ? 's' : ''}</span>
            </div>
          )}

          {/* Attachments */}
          {message.attachments && message.attachments.length > 0 && (
            <div className="mt-3 space-y-2">
              {message.attachments.map((attachment) => (
                <div
                  key={attachment.id}
                  className={`flex items-center gap-2 p-2 rounded ${isUser
                    ? 'bg-blue-500 bg-opacity-20'
                    : 'bg-gray-50'
                    }`}
                >
                  <FileText className="w-4 h-4" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">
                      {attachment.name}
                    </div>
                    <div className="text-xs opacity-75">
                      {attachment.type} • {formatFileSize(attachment.size)}
                    </div>
                  </div>
                  <button
                    className="p-1 hover:bg-black hover:bg-opacity-10 rounded transition-colors"
                    title="Download file"
                  >
                    <Download className="w-3 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Timestamp */}
        <div className={`text-xs text-gray-500 mt-1 ${isUser ? 'text-right' : 'text-left'}`}>
          {formatTime(message.timestamp)}
        </div>
      </div>

      {/* User Avatar */}
      {isUser && (
        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
          <User className="w-4 h-4 text-blue-600" />
        </div>
      )}
    </div>
  )
}
