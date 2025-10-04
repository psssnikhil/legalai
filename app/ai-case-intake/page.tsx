'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import ChatInterface from '@/components/ai-case-intake/ChatInterface'
import DocumentUpload from '@/components/ai-case-intake/DocumentUpload'
import VoiceRecorder from '@/components/ai-case-intake/VoiceRecorder'
import CaseAnalysis from '@/components/ai-case-intake/CaseAnalysis'
import {
  Bot,
  Paperclip,
  Mic,
  Plus,
  RefreshCw,
  FileText,
  Upload,
  Brain
} from 'lucide-react'

export default function AICaseIntakePage() {
  const { data: session } = useSession()
  const [activeTab, setActiveTab] = useState('chat')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisData, setAnalysisData] = useState(null)
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null)
  const [uploadedDocuments, setUploadedDocuments] = useState<any[]>([])

  const handleNewChat = () => {
    // Reset chat and start new session
    setUploadedDocuments([])
    window.location.reload()
  }

  const handleClear = () => {
    // Clear current session
    setUploadedDocuments([])
    window.location.reload()
  }

  const handleFileUpload = (files: File[], uploadResults: any[]) => {
    console.log('[AICaseIntakePage] Files uploaded:', files)
    console.log('[AICaseIntakePage] Upload results:', uploadResults)
    // Store the uploaded documents
    setUploadedDocuments(prev => [...prev, ...uploadResults])
    // Switch back to chat after upload
    setActiveTab('chat')
  }

  const handleVoiceRecording = (transcript: string) => {
    console.log('Voice transcript:', transcript)
    // Switch back to chat after recording
    setActiveTab('chat')
  }

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">AI Case Intake</h1>
            <p className="text-gray-600 mt-1">
              Upload documents and let AI analyze your case details automatically
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleNewChat}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              New Chat
            </button>
            <button
              onClick={handleClear}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Clear
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Left Sidebar - Quick Actions */}
        <div className="w-80 bg-white border-r border-gray-200 p-6">
          <div className="space-y-6">
            {/* AI Assistant Info */}
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Bot className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">AI Legal Assistant</h3>
              <p className="text-sm text-gray-600">Case intake and document analysis</p>
            </div>

            {/* Quick Actions */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-gray-900">Quick Actions</h4>

              <button
                onClick={() => setActiveTab('upload')}
                className="w-full flex items-center gap-3 p-3 text-left bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
              >
                <Upload className="w-5 h-5 text-blue-600" />
                <div>
                  <div className="font-medium text-blue-900">Upload Documents</div>
                  <div className="text-sm text-blue-700">PDFs, Word docs, images</div>
                </div>
              </button>

              <button
                onClick={() => setActiveTab('voice')}
                className="w-full flex items-center gap-3 p-3 text-left bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
              >
                <Mic className="w-5 h-5 text-green-600" />
                <div>
                  <div className="font-medium text-green-900">Voice Recording</div>
                  <div className="text-sm text-green-700">Record case details</div>
                </div>
              </button>

              <button
                onClick={() => setActiveTab('analysis')}
                className="w-full flex items-center gap-3 p-3 text-left bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
              >
                <Brain className="w-5 h-5 text-purple-600" />
                <div>
                  <div className="font-medium text-purple-900">AI Analysis</div>
                  <div className="text-sm text-purple-700">Review extracted data</div>
                </div>
              </button>
            </div>

            {/* What AI Can Help With */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-3">What I can help with</h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2 bg-gray-50 rounded text-gray-700">Contract disputes</div>
                <div className="p-2 bg-gray-50 rounded text-gray-700">Criminal matters</div>
                <div className="p-2 bg-gray-50 rounded text-gray-700">Corporate litigation</div>
                <div className="p-2 bg-gray-50 rounded text-gray-700">Property cases</div>
                <div className="p-2 bg-gray-50 rounded text-gray-700">Family law issues</div>
                <div className="p-2 bg-gray-50 rounded text-gray-700">Document analysis</div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col">
          {activeTab === 'chat' && (
            <ChatInterface
              onSessionChange={setCurrentSessionId}
              initialDocuments={uploadedDocuments}
            />
          )}
          {activeTab === 'upload' && (
            <div className="flex-1 p-6">
              <DocumentUpload
                onUpload={handleFileUpload}
                onClose={() => setActiveTab('chat')}
              />
            </div>
          )}
          {activeTab === 'voice' && (
            <div className="flex-1 p-6">
              <VoiceRecorder
                onTranscription={handleVoiceRecording}
                onClose={() => setActiveTab('chat')}
              />
            </div>
          )}
          {activeTab === 'analysis' && <CaseAnalysis data={analysisData} sessionId={currentSessionId} />}
        </div>
      </div>
    </div>
  )
}
