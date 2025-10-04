'use client'

import { useState, useRef, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import {
    MessageSquare,
    Eye,
    FileText,
    Send,
    Upload,
    Mic,
    Copy,
    Download,
    Save,
    PlusCircle,
    FileDown,
    CheckCircle2,
    Loader2
} from 'lucide-react'
import FormattedMessage from '@/components/ai-case-intake/FormattedMessage'

type Tab = 'chat' | 'preview' | 'documents'

interface GeneratedDocument {
    id: string
    title: string
    type: string
    case?: string
    client?: string
    content: string
    createdAt: Date
    status: 'draft' | 'final'
}

export default function AIDraftingPage() {
    const { data: session } = useSession()
    const [activeTab, setActiveTab] = useState<Tab>('chat')
    const [selectedCase, setSelectedCase] = useState<string>('')
    const [chatMessages, setChatMessages] = useState<any[]>([
        {
            id: '1',
            role: 'assistant',
            content: `**Welcome to AI Document Automation! 🚀**

I'll help automate your repetitive document workflows by learning from YOUR templates and writing style.

**How it works:**
1. 📄 **Upload your reference documents** - Your templates, previous cases, or any documents written in your style
2. 🎤 **Tell me about the new case** - Dictate or type the case details (parties, facts, dates, etc.)
3. ✨ **I'll generate the new document** - Automatically adapted from your reference docs with the new case details

**What I can do:**
- Learn and preserve YOUR unique writing style
- Extract and reuse your clause patterns and provisions
- Maintain your formatting preferences
- Fill in new case details into your templates
- Automate repetitive drafting work

**Ready to start?** Upload your reference documents, then tell me about your new case!`,
            timestamp: new Date()
        }
    ])
    const [inputMessage, setInputMessage] = useState('')
    const [isGenerating, setIsGenerating] = useState(false)
    const [currentDocument, setCurrentDocument] = useState<string>('')
    const [documentTitle, setDocumentTitle] = useState<string>('Untitled Document')
    const [includeLetterhead, setIncludeLetterhead] = useState(true)
    const [generatedDocuments, setGeneratedDocuments] = useState<GeneratedDocument[]>([])
    const [uploadedFiles, setUploadedFiles] = useState<any[]>([])
    const [isRecording, setIsRecording] = useState(false)
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
    const [isTranscribing, setIsTranscribing] = useState(false)
    const [transcriptionToast, setTranscriptionToast] = useState<string | null>(null)
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const mediaRecorderRef = useRef<MediaRecorder | null>(null)
    const audioChunksRef = useRef<Blob[]>([])

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

    useEffect(() => {
        scrollToBottom()
    }, [chatMessages])

    const handleSendMessage = async () => {
        if (!inputMessage.trim() || isGenerating) return

        const userMessage = {
            id: Date.now().toString(),
            role: 'user',
            content: inputMessage,
            timestamp: new Date()
        }

        setChatMessages(prev => [...prev, userMessage])
        const userInput = inputMessage
        setInputMessage('')
        setIsGenerating(true)

        // Create placeholder for streaming message
        const aiMessageId = (Date.now() + 1).toString()
        const aiMessage = {
            id: aiMessageId,
            role: 'assistant',
            content: '',
            timestamp: new Date(),
            isStreaming: true
        }
        setChatMessages(prev => [...prev, aiMessage])

        try {
            const response = await fetch('/api/document-drafting', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: userInput,
                    conversationHistory: chatMessages,
                    uploadedFiles: uploadedFiles,
                    selectedCase: selectedCase
                })
            })

            if (!response.body) throw new Error('No response body')

            const reader = response.body.getReader()
            const decoder = new TextDecoder()
            let accumulatedContent = ''
            let documentContent = ''

            while (true) {
                const { done, value } = await reader.read()
                if (done) break

                const chunk = decoder.decode(value)
                const lines = chunk.split('\n')

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const data = line.slice(6)
                        if (data === '[DONE]') {
                            setIsGenerating(false)
                            setChatMessages(prev =>
                                prev.map(msg =>
                                    msg.id === aiMessageId
                                        ? { ...msg, isStreaming: false }
                                        : msg
                                )
                            )

                            // If document was generated, set it
                            if (documentContent) {
                                setCurrentDocument(documentContent)
                                setActiveTab('preview')
                            }
                            break
                        }

                        try {
                            const parsed = JSON.parse(data)
                            if (parsed.content) {
                                accumulatedContent += parsed.content
                                setChatMessages(prev =>
                                    prev.map(msg =>
                                        msg.id === aiMessageId
                                            ? { ...msg, content: accumulatedContent }
                                            : msg
                                    )
                                )
                            }
                            if (parsed.document) {
                                documentContent = parsed.document
                            }
                        } catch (e) {
                            // Skip invalid JSON
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Document generation error:', error)
            setChatMessages(prev =>
                prev.map(msg =>
                    msg.id === aiMessageId
                        ? { ...msg, content: 'Sorry, there was an error generating the document.', isStreaming: false }
                        : msg
                )
            )
        } finally {
            setIsGenerating(false)
        }
    }

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files
        if (!files) return

        // Upload files to server for processing
        const formData = new FormData()
        Array.from(files).forEach(file => {
            formData.append('files', file)
        })

        try {
            const response = await fetch('/api/documents/upload-test', {
                method: 'POST',
                body: formData,
            })

            const result = await response.json()

            if (result.success && result.results) {
                setUploadedFiles(prev => [...prev, ...result.results])

                // Add system message about uploaded files
                const uploadMessage = {
                    id: Date.now().toString(),
                    role: 'assistant',
                    content: `✅ **Reference documents analyzed!**

I've processed ${result.results.length} document(s): **${result.results.map((r: any) => r.filename).join(', ')}**

I've learned:
- Your writing style and tone
- Document structure and formatting
- Standard clauses and provisions
- Legal language patterns

**Now tell me about your new case:**
- Who are the parties? (plaintiff, defendant, client, etc.)
- What are the key facts and dates?
- What's the case type/situation?
- Any specific details I should include?

You can dictate using the microphone 🎤 or type below. I'll generate a new document using your reference templates!`,
                    timestamp: new Date()
                }
                setChatMessages(prev => [...prev, uploadMessage])
            }
        } catch (error) {
            console.error('File upload error:', error)
            alert('Failed to upload files. Please try again.')
        }
    }

    const startRecording = async () => {
        try {
            console.log('[Voice] Requesting microphone access...')
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
            console.log('[Voice] Microphone access granted')

            const mediaRecorder = new MediaRecorder(stream)
            mediaRecorderRef.current = mediaRecorder
            audioChunksRef.current = []

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data)
                    console.log('[Voice] Audio chunk received:', event.data.size, 'bytes')
                }
            }

            mediaRecorder.onstop = async () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
                console.log('[Voice] Recording stopped. Total size:', audioBlob.size, 'bytes')
                setAudioBlob(audioBlob)

                // Transcribe the audio
                await transcribeAudio(audioBlob)

                // Stop all tracks
                stream.getTracks().forEach(track => track.stop())
            }

            mediaRecorder.start()
            setIsRecording(true)
            console.log('[Voice] Recording started')
        } catch (error) {
            console.error('[Voice] Error starting recording:', error)
            alert('Failed to start recording. Please check microphone permissions.')
        }
    }

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop()
            setIsRecording(false)
        }
    }

    const transcribeAudio = async (audioBlob: Blob) => {
        try {
            console.log('[Voice] Starting transcription... Audio size:', audioBlob.size, 'bytes')

            if (audioBlob.size < 100) {
                throw new Error('Audio recording is too short. Please record for at least 1 second.')
            }

            setIsTranscribing(true)

            const formData = new FormData()
            formData.append('audio', audioBlob, 'recording.webm')

            console.log('[Voice] Sending request to /api/voice/transcribe')
            const response = await fetch('/api/voice/transcribe', {
                method: 'POST',
                body: formData,
            })

            console.log('[Voice] Response status:', response.status)

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}))
                console.error('[Voice] Error response:', errorData)
                throw new Error(`Transcription failed: ${response.status} - ${errorData.message || 'Unknown error'}`)
            }

            const result = await response.json()
            console.log('[Voice] Transcription result:', result)

            const transcribedText = result.transcript || result.text

            if (transcribedText) {
                console.log('[Voice] Transcribed text:', transcribedText)
                setInputMessage(transcribedText)

                // Show success toast
                setTranscriptionToast('Voice transcribed successfully! ✓')
                setTimeout(() => setTranscriptionToast(null), 3000)
            } else {
                throw new Error('No transcription text received from API')
            }
        } catch (error) {
            console.error('[Voice] Transcription error:', error)
            setTranscriptionToast(`Transcription failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
            setTimeout(() => setTranscriptionToast(null), 4000)
        } finally {
            setIsTranscribing(false)
        }
    }

    const handleSaveDocument = () => {
        if (!currentDocument) return

        const newDoc: GeneratedDocument = {
            id: Date.now().toString(),
            title: documentTitle,
            type: 'Legal Document',
            content: currentDocument,
            createdAt: new Date(),
            status: 'draft'
        }

        setGeneratedDocuments(prev => [newDoc, ...prev])
        alert('Document saved successfully!')
    }

    const handleExportPDF = () => {
        // In production, this would use a PDF generation library
        alert('PDF export would be implemented here')
    }

    const handleExportWord = () => {
        // In production, this would generate a .docx file
        const blob = new Blob([currentDocument], { type: 'application/msword' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${documentTitle}.doc`
        a.click()
    }

    const handleCopy = () => {
        navigator.clipboard.writeText(currentDocument)
        alert('Document copied to clipboard!')
    }

    const handleNewDraft = () => {
        setCurrentDocument('')
        setDocumentTitle('Untitled Document')
        setChatMessages([
            {
                id: Date.now().toString(),
                role: 'assistant',
                content: "Let's create a new document! What legal document would you like to draft?",
                timestamp: new Date()
            }
        ])
        setActiveTab('chat')
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Transcription Toast */}
            {transcriptionToast && (
                <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top">
                    <div className={`px-6 py-3 rounded-lg shadow-lg ${transcriptionToast.includes('failed') || transcriptionToast.includes('error')
                        ? 'bg-red-600 text-white'
                        : 'bg-green-600 text-white'
                        } flex items-center gap-2`}>
                        {transcriptionToast.includes('failed') ? '❌' : '✓'}
                        <span className="font-medium">{transcriptionToast}</span>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-8 py-6">
                <div className="max-w-7xl mx-auto">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                                    <FileText className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-2xl font-bold text-gray-900">AI Document Drafting</h1>
                                    <p className="text-gray-600 text-sm mt-0.5">Chat-based legal document generation with AI assistance</p>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 rounded-full">
                            <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
                            <span className="text-xs font-medium text-blue-600">AI-Powered</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-8 py-6">
                {/* Tabs */}
                <div className="flex gap-2 mb-6">
                    <button
                        onClick={() => setActiveTab('chat')}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all ${activeTab === 'chat'
                            ? 'bg-white text-blue-600 shadow-sm border-2 border-blue-600'
                            : 'bg-white text-gray-600 hover:bg-gray-50 border-2 border-transparent'
                            }`}
                    >
                        <MessageSquare className="w-4 h-4" />
                        Chat & Generate
                    </button>
                    <button
                        onClick={() => setActiveTab('preview')}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all ${activeTab === 'preview'
                            ? 'bg-white text-blue-600 shadow-sm border-2 border-blue-600'
                            : 'bg-white text-gray-600 hover:bg-gray-50 border-2 border-transparent'
                            }`}
                    >
                        <Eye className="w-4 h-4" />
                        Document Preview
                    </button>
                    <button
                        onClick={() => setActiveTab('documents')}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all ${activeTab === 'documents'
                            ? 'bg-white text-blue-600 shadow-sm border-2 border-blue-600'
                            : 'bg-white text-gray-600 hover:bg-gray-50 border-2 border-transparent'
                            }`}
                    >
                        <FileText className="w-4 h-4" />
                        Generated Documents
                    </button>
                </div>

                {/* Content */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    {/* Chat & Generate Tab */}
                    {activeTab === 'chat' && (
                        <div className="flex flex-col h-[calc(100vh-280px)]">
                            {/* Header */}
                            <div className="border-b border-gray-200 p-4">
                                <h2 className="text-lg font-bold text-gray-900 mb-3">Document Generation Chat</h2>
                                <select
                                    value={selectedCase}
                                    onChange={(e) => setSelectedCase(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    <option value="">Select Case (Optional)</option>
                                    <option value="case1">Case 1 - Sample Case</option>
                                    <option value="case2">Case 2 - Another Case</option>
                                </select>
                            </div>

                            {/* Uploaded Documents Banner */}
                            {uploadedFiles.length > 0 && (
                                <div className="border-b border-gray-200 p-4 bg-blue-50">
                                    <div className="flex items-center gap-2 mb-2">
                                        <FileText className="w-4 h-4 text-blue-600" />
                                        <span className="text-sm font-semibold text-blue-900">
                                            Reference Documents ({uploadedFiles.length})
                                        </span>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {uploadedFiles.map((file, index) => (
                                            <div
                                                key={index}
                                                className="px-3 py-1.5 bg-white border border-blue-200 rounded-lg text-xs font-medium text-blue-700 flex items-center gap-1"
                                            >
                                                <CheckCircle2 className="w-3 h-3" />
                                                {file.filename}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Messages */}
                            <div className="flex-1 overflow-y-auto p-6 bg-gradient-to-b from-gray-50 to-white">
                                {chatMessages.map((msg) => (
                                    <FormattedMessage
                                        key={msg.id}
                                        content={msg.content}
                                        role={msg.role}
                                        isStreaming={msg.isStreaming}
                                    />
                                ))}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Input Area */}
                            <div className="border-t border-gray-200 p-4 bg-white">
                                {/* Upload Section */}
                                <div className="mb-4">
                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                                    >
                                        <Upload className="w-4 h-4" />
                                        Upload Reference Documents
                                    </button>
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        multiple
                                        onChange={handleFileUpload}
                                        className="hidden"
                                        accept=".pdf,.docx,.doc,.txt"
                                    />
                                    <p className="text-xs text-gray-500 mt-2">
                                        Upload PDFs, Word docs, images, or text files. Content will be extracted and analyzed for AI drafting.
                                    </p>
                                    {uploadedFiles.length > 0 && (
                                        <div className="mt-3 flex flex-wrap gap-2">
                                            {uploadedFiles.map((file, i) => (
                                                <div key={i} className="px-3 py-2 bg-green-50 border border-green-200 text-green-700 rounded-lg text-xs font-medium flex items-center gap-1.5">
                                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                                    {file.filename || file.name}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Message Input */}
                                <div className="flex gap-2">
                                    <button
                                        onClick={isRecording ? stopRecording : startRecording}
                                        disabled={isTranscribing || isGenerating}
                                        className={`p-3 rounded-lg transition-all relative ${isRecording
                                            ? 'bg-red-500 hover:bg-red-600 shadow-lg'
                                            : isTranscribing
                                                ? 'bg-yellow-100 cursor-wait'
                                                : 'bg-gray-100 hover:bg-gray-200'
                                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                                        title={
                                            isTranscribing
                                                ? 'Transcribing...'
                                                : isRecording
                                                    ? 'Click to stop recording'
                                                    : 'Click to start voice recording'
                                        }
                                    >
                                        {isTranscribing ? (
                                            <Loader2 className="w-5 h-5 text-yellow-600 animate-spin" />
                                        ) : (
                                            <Mic className={`w-5 h-5 ${isRecording ? 'text-white animate-pulse' : 'text-gray-600'}`} />
                                        )}
                                        {isRecording && (
                                            <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-600 rounded-full animate-ping"></span>
                                        )}
                                    </button>
                                    <input
                                        type="text"
                                        value={inputMessage}
                                        onChange={(e) => setInputMessage(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && !isGenerating && !isRecording && handleSendMessage()}
                                        placeholder={
                                            isRecording
                                                ? '🔴 Recording... Click mic to stop'
                                                : isTranscribing
                                                    ? '⏳ Transcribing your voice...'
                                                    : 'Tell me about your new case details (parties, facts, dates) or use voice 🎤...'
                                        }
                                        className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                                        disabled={isGenerating || isRecording || isTranscribing}
                                    />
                                    <button
                                        onClick={handleSendMessage}
                                        disabled={!inputMessage.trim() || isGenerating || isRecording || isTranscribing}
                                        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                    >
                                        {isGenerating ? (
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                        ) : (
                                            <Send className="w-5 h-5" />
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Document Preview Tab */}
                    {activeTab === 'preview' && (
                        <div className="p-6">
                            {/* Preview Header */}
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900 mb-2">Document Preview</h2>
                                    <div className="flex items-center gap-4">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={includeLetterhead}
                                                onChange={(e) => setIncludeLetterhead(e.target.checked)}
                                                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                            />
                                            <span className="text-sm text-gray-700">Include Letterhead</span>
                                        </label>
                                        {!currentDocument && (
                                            <a href="#" className="text-sm text-blue-600 hover:text-blue-800">
                                                Create one
                                            </a>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={handleCopy}
                                        className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                                    >
                                        <Copy className="w-4 h-4" />
                                        Copy
                                    </button>
                                    <button
                                        onClick={handleExportPDF}
                                        className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                                    >
                                        <FileDown className="w-4 h-4" />
                                        PDF
                                    </button>
                                    <button
                                        onClick={handleExportWord}
                                        className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                                    >
                                        <Download className="w-4 h-4" />
                                        Word
                                    </button>
                                    <button
                                        onClick={handleSaveDocument}
                                        disabled={!currentDocument}
                                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                                    >
                                        <Save className="w-4 h-4" />
                                        Save
                                    </button>
                                    <button
                                        onClick={handleNewDraft}
                                        className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                                    >
                                        <PlusCircle className="w-4 h-4" />
                                        New Draft
                                    </button>
                                </div>
                            </div>

                            {/* Document Content */}
                            <div className="min-h-[600px] bg-white border border-gray-300 rounded-lg p-12 shadow-sm">
                                {currentDocument ? (
                                    <div className="prose max-w-none">
                                        <div className="whitespace-pre-wrap font-serif text-gray-900 leading-relaxed">
                                            {currentDocument}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-center h-full">
                                        <div className="text-center text-gray-500">
                                            <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                                            <p className="text-lg">Document content will appear here after generation</p>
                                            <button
                                                onClick={() => setActiveTab('chat')}
                                                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                            >
                                                Start Drafting
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Generated Documents Tab */}
                    {activeTab === 'documents' && (
                        <div className="p-6">
                            <h2 className="text-xl font-bold text-gray-900 mb-6">Generated Documents</h2>

                            {generatedDocuments.length === 0 ? (
                                <div className="text-center py-12">
                                    <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                                    <p className="text-gray-500">No documents generated yet</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-gray-50 border-b border-gray-200">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Title</th>
                                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Type</th>
                                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Case</th>
                                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Client</th>
                                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Date</th>
                                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</th>
                                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {generatedDocuments.map((doc) => (
                                                <tr key={doc.id} className="hover:bg-gray-50">
                                                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{doc.title}</td>
                                                    <td className="px-6 py-4 text-sm text-gray-600">{doc.type}</td>
                                                    <td className="px-6 py-4 text-sm text-gray-600">{doc.case || '-'}</td>
                                                    <td className="px-6 py-4 text-sm text-gray-600">{doc.client || '-'}</td>
                                                    <td className="px-6 py-4 text-sm text-gray-600">
                                                        {doc.createdAt.toLocaleDateString()}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${doc.status === 'final'
                                                            ? 'bg-green-100 text-green-800'
                                                            : 'bg-yellow-100 text-yellow-800'
                                                            }`}>
                                                            {doc.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-sm">
                                                        <button
                                                            onClick={() => {
                                                                setCurrentDocument(doc.content)
                                                                setDocumentTitle(doc.title)
                                                                setActiveTab('preview')
                                                            }}
                                                            className="text-blue-600 hover:text-blue-800 font-medium"
                                                        >
                                                            View
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

