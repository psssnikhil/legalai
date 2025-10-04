'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import {
    CheckCircle2,
    Circle,
    FileText,
    Brain,
    MessageSquare,
    Search,
    Clock,
    TrendingUp,
    AlertCircle,
    ChevronLeft,
    ChevronRight,
    Zap,
    Target,
    Upload,
    X,
    Plus,
    Download,
    Scale,
    Send
} from 'lucide-react'
import DocumentUpload from '@/components/ai-case-intake/DocumentUpload'
import FormattedMessage from '@/components/ai-case-intake/FormattedMessage'

type AnalysisType = 'quick' | 'comprehensive' | null
type Step = 'select-case' | 'choose-documents' | 'analysis-type' | 'case-summary' | 'similar-cases' | 'ai-chat'

interface CaseData {
    title: string
    description: string
    caseType: string
    jurisdiction: string
}

export default function AICaseAssistant() {
    const { data: session } = useSession()
    const [currentStep, setCurrentStep] = useState<Step>('select-case')
    const [caseData, setCaseData] = useState<CaseData>({
        title: '',
        description: '',
        caseType: '',
        jurisdiction: 'India'
    })
    const [selectedDocuments, setSelectedDocuments] = useState<any[]>([])
    const [analysisType, setAnalysisType] = useState<AnalysisType>(null)
    const [isAnalyzing, setIsAnalyzing] = useState(false)
    const [analysisProgress, setAnalysisProgress] = useState(0)
    const [analysisResult, setAnalysisResult] = useState<any>(null)
    const [similarCases, setSimilarCases] = useState<any[]>([])
    const [chatMessages, setChatMessages] = useState<any[]>([])
    const [chatInput, setChatInput] = useState('')
    const [isChatLoading, setIsChatLoading] = useState(false)
    const [showDocumentUpload, setShowDocumentUpload] = useState(false)

    const steps: { id: Step; label: string; icon: any }[] = [
        { id: 'select-case', label: 'Select Case', icon: FileText },
        { id: 'choose-documents', label: 'Choose Documents', icon: Upload },
        { id: 'analysis-type', label: 'Analysis Type', icon: Brain },
        { id: 'case-summary', label: 'Case Summary', icon: FileText },
        { id: 'similar-cases', label: 'Similar Cases', icon: Search },
        { id: 'ai-chat', label: 'AI Chat', icon: MessageSquare },
    ]

    const getCurrentStepIndex = () => steps.findIndex(s => s.id === currentStep)
    const progressPercentage = ((getCurrentStepIndex() + 1) / steps.length) * 100

    const goToStep = (stepId: Step) => {
        setCurrentStep(stepId)
    }

    const nextStep = () => {
        const currentIndex = getCurrentStepIndex()
        if (currentIndex < steps.length - 1) {
            setCurrentStep(steps[currentIndex + 1].id)
        }
    }

    const prevStep = () => {
        const currentIndex = getCurrentStepIndex()
        if (currentIndex > 0) {
            setCurrentStep(steps[currentIndex - 1].id)
        }
    }

    const handleDocumentUpload = (files: File[], uploadResults: any[]) => {
        setSelectedDocuments(prev => [...prev, ...uploadResults])
        setShowDocumentUpload(false)
    }

    const startAnalysis = async () => {
        if (!analysisType) return

        setIsAnalyzing(true)
        setAnalysisProgress(0)

        // Simulate progress
        const progressInterval = setInterval(() => {
            setAnalysisProgress(prev => {
                if (prev >= 90) return prev
                return prev + 10
            })
        }, 500)

        try {
            const response = await fetch('/api/case-analysis', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    caseTitle: caseData.title,
                    caseType: caseData.caseType,
                    jurisdiction: caseData.jurisdiction,
                    description: caseData.description,
                    documents: selectedDocuments,
                    analysisType
                })
            })

            const data = await response.json()

            if (data.success) {
                setAnalysisResult(data.analysis)
                setAnalysisProgress(100)

                setTimeout(() => {
                    clearInterval(progressInterval)
                    setIsAnalyzing(false)
                    nextStep()

                    // Auto-fetch similar cases
                    fetchSimilarCases()
                }, 500)
            }
        } catch (error) {
            console.error('Analysis error:', error)
            clearInterval(progressInterval)
            setIsAnalyzing(false)
        }
    }

    const fetchSimilarCases = async () => {
        try {
            const response = await fetch('/api/similar-cases', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    caseTitle: caseData.title,
                    caseType: caseData.caseType,
                    jurisdiction: caseData.jurisdiction,
                    facts: analysisResult?.keyFacts || caseData.description
                })
            })

            const data = await response.json()
            if (data.success) {
                setSimilarCases(data.cases || [])
            }
        } catch (error) {
            console.error('Similar cases error:', error)
        }
    }

    const sendChatMessage = async () => {
        if (!chatInput.trim() || isChatLoading) return

        const userMessage = {
            id: Date.now().toString(),
            role: 'user',
            content: chatInput,
            timestamp: new Date()
        }

        setChatMessages(prev => [...prev, userMessage])
        const userInput = chatInput
        setChatInput('')
        setIsChatLoading(true)

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
            const response = await fetch('/api/chat-test', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: userInput,
                    documents: selectedDocuments,
                    context: {
                        caseTitle: caseData.title,
                        analysis: analysisResult,
                        similarCases: similarCases
                    }
                })
            })

            if (!response.body) throw new Error('No response body')

            const reader = response.body.getReader()
            const decoder = new TextDecoder()
            let accumulatedContent = ''

            while (true) {
                const { done, value } = await reader.read()
                if (done) break

                const chunk = decoder.decode(value)
                const lines = chunk.split('\n')

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const data = line.slice(6)
                        if (data === '[DONE]') {
                            setIsChatLoading(false)
                            setChatMessages(prev =>
                                prev.map(msg =>
                                    msg.id === aiMessageId
                                        ? { ...msg, isStreaming: false }
                                        : msg
                                )
                            )
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
                        } catch (e) {
                            // Skip invalid JSON
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Chat error:', error)
            setChatMessages(prev =>
                prev.map(msg =>
                    msg.id === aiMessageId
                        ? { ...msg, content: 'Sorry, there was an error processing your request.', isStreaming: false }
                        : msg
                )
            )
        } finally {
            setIsChatLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-8 py-6">
                <div className="max-w-7xl mx-auto">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                            <Brain className="w-7 h-7 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">AI Case Assistant</h1>
                            <p className="text-gray-600 mt-1">AI-powered case analysis and legal research</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-8 py-8">
                {/* Progress Bar */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-8">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">Progress</h3>
                        <span className="text-sm font-medium text-blue-600">{Math.round(progressPercentage)}% Complete</span>
                    </div>

                    <div className="relative h-2 bg-gray-200 rounded-full mb-8">
                        <div
                            className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-600 to-purple-600 rounded-full transition-all duration-300"
                            style={{ width: `${progressPercentage}%` }}
                        />
                    </div>

                    <div className="flex justify-between">
                        {steps.map((step, index) => {
                            const Icon = step.icon
                            const isCompleted = index < getCurrentStepIndex()
                            const isCurrent = step.id === currentStep

                            return (
                                <div key={step.id} className="flex flex-col items-center flex-1">
                                    <button
                                        onClick={() => isCompleted || isCurrent ? goToStep(step.id) : null}
                                        disabled={!isCompleted && !isCurrent}
                                        className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 transition-all ${isCompleted
                                            ? 'bg-green-500 text-white cursor-pointer hover:bg-green-600'
                                            : isCurrent
                                                ? 'bg-blue-600 text-white ring-4 ring-blue-100'
                                                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                            }`}
                                    >
                                        {isCompleted ? <CheckCircle2 className="w-6 h-6" /> : <Icon className="w-6 h-6" />}
                                    </button>
                                    <span className={`text-xs font-medium text-center ${isCurrent ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-400'
                                        }`}>
                                        {step.label}
                                    </span>
                                </div>
                            )
                        })}
                    </div>
                </div>

                {/* Main Content */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 min-h-[500px]">
                    {/* Step 1: Select Case */}
                    {currentStep === 'select-case' && (
                        <div>
                            <div className="flex items-center gap-3 mb-6">
                                <FileText className="w-8 h-8 text-blue-600" />
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900">Select or Create Case</h2>
                                    <p className="text-gray-600 mt-1">Enter the details of your legal case</p>
                                </div>
                            </div>

                            <div className="max-w-3xl space-y-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Case Title *
                                    </label>
                                    <input
                                        type="text"
                                        value={caseData.title}
                                        onChange={(e) => setCaseData({ ...caseData, title: e.target.value })}
                                        placeholder="e.g., ABC Corp vs XYZ Ltd - Breach of Contract"
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Case Type *
                                    </label>
                                    <select
                                        value={caseData.caseType}
                                        onChange={(e) => setCaseData({ ...caseData, caseType: e.target.value })}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    >
                                        <option value="">Select case type...</option>
                                        <option value="Civil">Civil</option>
                                        <option value="Criminal">Criminal</option>
                                        <option value="Contract Dispute">Contract Dispute</option>
                                        <option value="Property Dispute">Property Dispute</option>
                                        <option value="Family Law">Family Law</option>
                                        <option value="Corporate">Corporate</option>
                                        <option value="Employment">Employment</option>
                                        <option value="Tax">Tax</option>
                                        <option value="Intellectual Property">Intellectual Property</option>
                                        <option value="Consumer">Consumer</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Jurisdiction
                                    </label>
                                    <input
                                        type="text"
                                        value={caseData.jurisdiction}
                                        onChange={(e) => setCaseData({ ...caseData, jurisdiction: e.target.value })}
                                        placeholder="e.g., Supreme Court of India, Delhi High Court"
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Case Description *
                                    </label>
                                    <textarea
                                        value={caseData.description}
                                        onChange={(e) => setCaseData({ ...caseData, description: e.target.value })}
                                        placeholder="Brief description of the case, key facts, and parties involved..."
                                        rows={6}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Choose Documents */}
                    {currentStep === 'choose-documents' && (
                        <div>
                            <div className="flex items-center gap-3 mb-6">
                                <Upload className="w-8 h-8 text-blue-600" />
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900">Choose Documents</h2>
                                    <p className="text-gray-600 mt-1">Upload relevant legal documents for analysis</p>
                                </div>
                            </div>

                            {!showDocumentUpload && (
                                <div className="max-w-3xl">
                                    <button
                                        onClick={() => setShowDocumentUpload(true)}
                                        className="w-full p-8 border-2 border-dashed border-gray-300 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all group"
                                    >
                                        <Upload className="w-12 h-12 text-gray-400 group-hover:text-blue-600 mx-auto mb-4" />
                                        <p className="text-lg font-medium text-gray-700 group-hover:text-blue-600">
                                            Click to Upload Documents
                                        </p>
                                        <p className="text-sm text-gray-500 mt-2">
                                            Supports PDF, Word, Text files
                                        </p>
                                    </button>

                                    {selectedDocuments.length > 0 && (
                                        <div className="mt-6 space-y-3">
                                            <h3 className="font-semibold text-gray-900">Uploaded Documents ({selectedDocuments.length})</h3>
                                            {selectedDocuments.map((doc, index) => (
                                                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                                                    <div className="flex items-center gap-3">
                                                        <FileText className="w-5 h-5 text-blue-600" />
                                                        <div>
                                                            <p className="font-medium text-gray-900">{doc.filename}</p>
                                                            <p className="text-sm text-gray-500">{doc.wordCount || 0} words</p>
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => setSelectedDocuments(prev => prev.filter((_, i) => i !== index))}
                                                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                    >
                                                        <X className="w-5 h-5" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {showDocumentUpload && (
                                <div className="max-w-3xl">
                                    <DocumentUpload
                                        onUpload={handleDocumentUpload}
                                        onClose={() => setShowDocumentUpload(false)}
                                    />
                                </div>
                            )}
                        </div>
                    )}

                    {/* Step 3: Analysis Type */}
                    {currentStep === 'analysis-type' && (
                        <div>
                            <div className="flex items-center gap-3 mb-6">
                                <Brain className="w-8 h-8 text-blue-600" />
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900">Choose Analysis Type</h2>
                                    <p className="text-gray-600 mt-1">Select the type of AI analysis you want to perform</p>
                                </div>
                            </div>

                            <div className="grid md:grid-cols-2 gap-6 mt-8">
                                <button
                                    onClick={() => setAnalysisType('quick')}
                                    className={`relative p-8 rounded-2xl border-2 transition-all text-left ${analysisType === 'quick'
                                        ? 'border-blue-600 bg-blue-50 shadow-lg'
                                        : 'border-gray-200 hover:border-blue-300 hover:shadow-md'
                                        }`}
                                >
                                    <div className="flex items-start gap-4 mb-4">
                                        <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                                            <Zap className="w-6 h-6 text-blue-600" />
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="text-xl font-bold text-gray-900 mb-2">Quick Analysis</h3>
                                            <p className="text-gray-600 text-sm mb-4">
                                                Fast summary of key points, parties, and basic case assessment
                                            </p>
                                        </div>
                                    </div>

                                    <div className="space-y-2 mb-4">
                                        <div className="flex items-center gap-2 text-sm text-gray-700">
                                            <Circle className="w-1.5 h-1.5 fill-current" />
                                            <span>Case summary and key facts</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-gray-700">
                                            <Circle className="w-1.5 h-1.5 fill-current" />
                                            <span>Party identification</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-gray-700">
                                            <Circle className="w-1.5 h-1.5 fill-current" />
                                            <span>Basic risk assessment</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 text-blue-600 font-medium">
                                        <Clock className="w-4 h-4" />
                                        <span className="text-sm">Estimated time: 1-2 minutes</span>
                                    </div>

                                    {analysisType === 'quick' && (
                                        <div className="absolute top-4 right-4">
                                            <CheckCircle2 className="w-6 h-6 text-blue-600" />
                                        </div>
                                    )}
                                </button>

                                <button
                                    onClick={() => setAnalysisType('comprehensive')}
                                    className={`relative p-8 rounded-2xl border-2 transition-all text-left ${analysisType === 'comprehensive'
                                        ? 'border-purple-600 bg-purple-50 shadow-lg'
                                        : 'border-gray-200 hover:border-purple-300 hover:shadow-md'
                                        }`}
                                >
                                    <div className="flex items-start gap-4 mb-4">
                                        <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center flex-shrink-0">
                                            <Target className="w-6 h-6 text-purple-600" />
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="text-xl font-bold text-gray-900 mb-2">Comprehensive Analysis</h3>
                                            <p className="text-gray-600 text-sm mb-4">
                                                Deep analysis with winning probability, strategy recommendations, and legal precedents
                                            </p>
                                        </div>
                                    </div>

                                    <div className="space-y-2 mb-4">
                                        <div className="flex items-center gap-2 text-sm text-gray-700">
                                            <Circle className="w-1.5 h-1.5 fill-current" />
                                            <span>Complete case analysis</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-gray-700">
                                            <Circle className="w-1.5 h-1.5 fill-current" />
                                            <span>Winning probability calculation</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-gray-700">
                                            <Circle className="w-1.5 h-1.5 fill-current" />
                                            <span>SWOT analysis</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-gray-700">
                                            <Circle className="w-1.5 h-1.5 fill-current" />
                                            <span>Legal precedents research</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-gray-700">
                                            <Circle className="w-1.5 h-1.5 fill-current" />
                                            <span>Strategy recommendations</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 text-purple-600 font-medium">
                                        <Clock className="w-4 h-4" />
                                        <span className="text-sm">Estimated time: 3-5 minutes</span>
                                    </div>

                                    {analysisType === 'comprehensive' && (
                                        <div className="absolute top-4 right-4">
                                            <CheckCircle2 className="w-6 h-6 text-purple-600" />
                                        </div>
                                    )}
                                </button>
                            </div>

                            {isAnalyzing && (
                                <div className="mt-8 p-6 bg-blue-50 rounded-xl border border-blue-200">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                                        <span className="font-medium text-blue-900">
                                            Running {analysisType === 'quick' ? 'Quick' : 'Comprehensive'} Analysis...
                                        </span>
                                    </div>
                                    <div className="h-2 bg-blue-200 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-blue-600 transition-all duration-300"
                                            style={{ width: `${analysisProgress}%` }}
                                        />
                                    </div>
                                    <p className="text-sm text-blue-700 mt-2">{Math.round(analysisProgress)}% complete</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Step 4: Case Summary */}
                    {currentStep === 'case-summary' && analysisResult && (
                        <div>
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <FileText className="w-8 h-8 text-blue-600" />
                                    <div>
                                        <h2 className="text-2xl font-bold text-gray-900">Case Analysis Summary</h2>
                                        <p className="text-gray-600 mt-1">Review the AI-generated analysis</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => window.print()}
                                    className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    <Download className="w-4 h-4" />
                                    Export PDF
                                </button>
                            </div>

                            <div className="space-y-6">
                                {/* Executive Summary */}
                                <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-xl border border-blue-200">
                                    <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                                        <FileText className="w-5 h-5 text-blue-600" />
                                        Executive Summary
                                    </h3>
                                    <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                                        {analysisResult['Executive Summary'] ||
                                            analysisResult.executiveSummary ||
                                            analysisResult.summary ||
                                            analysisResult['Case Summary'] ||
                                            'Analysis completed successfully'}
                                    </p>
                                </div>

                                {/* Parties */}
                                {(analysisResult.parties || analysisResult['Parties Involved']) && (
                                    <div className="bg-white border border-gray-200 p-6 rounded-xl">
                                        <h3 className="text-lg font-bold text-gray-900 mb-3">Parties Involved</h3>
                                        <div className="grid md:grid-cols-3 gap-4">
                                            {(() => {
                                                const parties = analysisResult.parties || analysisResult['Parties Involved']
                                                if (typeof parties === 'string') {
                                                    return <p className="text-sm text-gray-700">{parties}</p>
                                                }
                                                return (
                                                    <>
                                                        {parties?.plaintiff && (
                                                            <div className="p-3 bg-blue-50 rounded-lg">
                                                                <p className="text-xs font-semibold text-blue-600 mb-1">Plaintiff</p>
                                                                <p className="text-sm text-gray-900">{parties.plaintiff}</p>
                                                            </div>
                                                        )}
                                                        {parties?.defendant && (
                                                            <div className="p-3 bg-red-50 rounded-lg">
                                                                <p className="text-xs font-semibold text-red-600 mb-1">Defendant</p>
                                                                <p className="text-sm text-gray-900">{parties.defendant}</p>
                                                            </div>
                                                        )}
                                                        {parties?.other && Array.isArray(parties.other) && parties.other.length > 0 && (
                                                            <div className="p-3 bg-gray-50 rounded-lg">
                                                                <p className="text-xs font-semibold text-gray-600 mb-1">Others</p>
                                                                <p className="text-sm text-gray-900">{parties.other.join(', ')}</p>
                                                            </div>
                                                        )}
                                                    </>
                                                )
                                            })()}
                                        </div>
                                    </div>
                                )}

                                {/* Winning Probability */}
                                {(analysisResult.winningProbability || analysisResult['Winning Probability']) && (
                                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 p-6 rounded-xl">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h3 className="text-lg font-bold text-gray-900 mb-1">Winning Probability</h3>
                                                <p className="text-sm text-gray-600">Based on case analysis and precedents</p>
                                            </div>
                                            <span className="text-4xl font-bold text-green-600">
                                                {analysisResult.winningProbability || analysisResult['Winning Probability']}
                                            </span>
                                        </div>
                                    </div>
                                )}

                                {/* SWOT Analysis */}
                                <div className="grid md:grid-cols-2 gap-6">
                                    {/* Strengths */}
                                    {(analysisResult.strengths || analysisResult.Strengths) && (
                                        <div className="bg-green-50 p-6 rounded-xl border-2 border-green-200">
                                            <h4 className="font-bold text-green-900 mb-4 flex items-center gap-2">
                                                <CheckCircle2 className="w-5 h-5" />
                                                Strengths
                                            </h4>
                                            <div className="space-y-3">
                                                {(() => {
                                                    const strengths = analysisResult.strengths || analysisResult.Strengths
                                                    return Array.isArray(strengths) ? (
                                                        strengths.map((item: string, i: number) => (
                                                            <div key={i} className="flex items-start gap-2 text-sm text-green-800">
                                                                <div className="w-1.5 h-1.5 rounded-full bg-green-600 mt-2 flex-shrink-0"></div>
                                                                <span className="leading-relaxed">{item}</span>
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <p className="text-sm text-green-800 whitespace-pre-line">{strengths}</p>
                                                    )
                                                })()}
                                            </div>
                                        </div>
                                    )}

                                    {/* Weaknesses */}
                                    {(analysisResult.weaknesses || analysisResult.Weaknesses) && (
                                        <div className="bg-red-50 p-6 rounded-xl border-2 border-red-200">
                                            <h4 className="font-bold text-red-900 mb-4 flex items-center gap-2">
                                                <AlertCircle className="w-5 h-5" />
                                                Weaknesses
                                            </h4>
                                            <div className="space-y-3">
                                                {(() => {
                                                    const weaknesses = analysisResult.weaknesses || analysisResult.Weaknesses
                                                    return Array.isArray(weaknesses) ? (
                                                        weaknesses.map((item: string, i: number) => (
                                                            <div key={i} className="flex items-start gap-2 text-sm text-red-800">
                                                                <div className="w-1.5 h-1.5 rounded-full bg-red-600 mt-2 flex-shrink-0"></div>
                                                                <span className="leading-relaxed">{item}</span>
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <p className="text-sm text-red-800 whitespace-pre-line">{weaknesses}</p>
                                                    )
                                                })()}
                                            </div>
                                        </div>
                                    )}

                                    {/* Opportunities */}
                                    {(analysisResult.opportunities || analysisResult.Opportunities) && (
                                        <div className="bg-blue-50 p-6 rounded-xl border-2 border-blue-200">
                                            <h4 className="font-bold text-blue-900 mb-4 flex items-center gap-2">
                                                <TrendingUp className="w-5 h-5" />
                                                Opportunities
                                            </h4>
                                            <div className="space-y-3">
                                                {(() => {
                                                    const opportunities = analysisResult.opportunities || analysisResult.Opportunities
                                                    return Array.isArray(opportunities) ? (
                                                        opportunities.map((item: string, i: number) => (
                                                            <div key={i} className="flex items-start gap-2 text-sm text-blue-800">
                                                                <div className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-2 flex-shrink-0"></div>
                                                                <span className="leading-relaxed">{item}</span>
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <p className="text-sm text-blue-800 whitespace-pre-line">{opportunities}</p>
                                                    )
                                                })()}
                                            </div>
                                        </div>
                                    )}

                                    {/* Threats */}
                                    {(analysisResult.threats || analysisResult.Threats) && (
                                        <div className="bg-orange-50 p-6 rounded-xl border-2 border-orange-200">
                                            <h4 className="font-bold text-orange-900 mb-4 flex items-center gap-2">
                                                <AlertCircle className="w-5 h-5" />
                                                Threats
                                            </h4>
                                            <div className="space-y-3">
                                                {(() => {
                                                    const threats = analysisResult.threats || analysisResult.Threats
                                                    return Array.isArray(threats) ? (
                                                        threats.map((item: string, i: number) => (
                                                            <div key={i} className="flex items-start gap-2 text-sm text-orange-800">
                                                                <div className="w-1.5 h-1.5 rounded-full bg-orange-600 mt-2 flex-shrink-0"></div>
                                                                <span className="leading-relaxed">{item}</span>
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <p className="text-sm text-orange-800 whitespace-pre-line">{threats}</p>
                                                    )
                                                })()}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Strategy Recommendations */}
                                {(analysisResult.recommendations || analysisResult['Strategy Recommendations']) && (
                                    <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-xl border-2 border-purple-200">
                                        <h4 className="font-bold text-purple-900 mb-4 flex items-center gap-2">
                                            <Target className="w-5 h-5" />
                                            Strategy Recommendations
                                        </h4>
                                        <div className="space-y-3">
                                            {(() => {
                                                const recommendations = analysisResult.recommendations || analysisResult['Strategy Recommendations']
                                                return Array.isArray(recommendations) ? (
                                                    recommendations.map((item: string, i: number) => (
                                                        <div key={i} className="flex items-start gap-3 p-3 bg-white rounded-lg">
                                                            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-600 text-white text-xs font-bold flex items-center justify-center">
                                                                {i + 1}
                                                            </span>
                                                            <span className="text-sm text-gray-800 leading-relaxed">{item}</span>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <p className="text-sm text-purple-800 whitespace-pre-line">{recommendations}</p>
                                                )
                                            })()}
                                        </div>
                                    </div>
                                )}

                                {/* Action Items */}
                                {(analysisResult.actionItems || analysisResult['Action Items']) && (
                                    <div className="bg-yellow-50 p-6 rounded-xl border-2 border-yellow-300">
                                        <h4 className="font-bold text-yellow-900 mb-4 flex items-center gap-2">
                                            <Clock className="w-5 h-5" />
                                            Immediate Action Items
                                        </h4>
                                        <div className="space-y-2">
                                            {(() => {
                                                const actionItems = analysisResult.actionItems || analysisResult['Action Items']
                                                return Array.isArray(actionItems) ? (
                                                    actionItems.map((item: string, i: number) => (
                                                        <div key={i} className="flex items-center gap-3 p-3 bg-white rounded-lg">
                                                            <input type="checkbox" className="w-4 h-4 text-blue-600 border-gray-300 rounded" />
                                                            <span className="text-sm text-gray-800">{item}</span>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <p className="text-sm text-yellow-800 whitespace-pre-line">{actionItems}</p>
                                                )
                                            })()}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Step 5: Similar Cases */}
                    {currentStep === 'similar-cases' && (
                        <div>
                            <div className="flex items-center gap-3 mb-6">
                                <Search className="w-8 h-8 text-blue-600" />
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900">Similar Indian Cases</h2>
                                    <p className="text-gray-600 mt-1">Relevant legal precedents from Indian courts</p>
                                </div>
                            </div>

                            {similarCases.length === 0 ? (
                                <div className="flex items-center justify-center h-64">
                                    <div className="text-center">
                                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                                        <p className="text-gray-600">Searching Indian case law database...</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {similarCases.map((caseItem: any, index: number) => {
                                        // Handle different possible field names
                                        const caseName = caseItem.name || caseItem.caseName || caseItem['Case Name'] || 'Untitled Case'
                                        const citation = caseItem.citation || caseItem['Case Citation'] || 'N/A'
                                        const court = caseItem.court || caseItem.Court || 'Indian Court'
                                        const year = caseItem.year || caseItem.Year || ''
                                        const summary = caseItem.summary || caseItem['Brief Summary'] || caseItem.briefSummary || 'No summary available'
                                        const relevance = caseItem.relevance || caseItem['Relevance to current case'] || 'Relevant to case'
                                        const legalPrinciple = caseItem.legalPrinciple || caseItem['Key Legal Principle established'] || caseItem.keyLegalPrinciple || ''
                                        const outcome = caseItem.outcome || caseItem.Outcome || ''

                                        return (
                                            <div key={index} className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
                                                <div className="flex items-start justify-between mb-3">
                                                    <div className="flex-1">
                                                        <h3 className="text-lg font-bold text-gray-900">{caseName}</h3>
                                                        <p className="text-sm text-blue-600 font-medium mt-1">
                                                            {citation} {court && `| ${court}`} {year && `| ${year}`}
                                                        </p>
                                                    </div>
                                                    {outcome && (
                                                        <span className={`ml-4 px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${outcome.toLowerCase().includes('plaintiff') ||
                                                            outcome.toLowerCase().includes('petitioner') ||
                                                            outcome.toLowerCase().includes('favored')
                                                            ? 'bg-green-100 text-green-800'
                                                            : 'bg-red-100 text-red-800'
                                                            }`}>
                                                            {outcome}
                                                        </span>
                                                    )}
                                                </div>

                                                <div className="mb-4">
                                                    <h4 className="font-semibold text-gray-900 text-sm mb-2">Summary:</h4>
                                                    <p className="text-gray-700 text-sm leading-relaxed">
                                                        {summary}
                                                    </p>
                                                </div>

                                                <div className="border-t border-gray-200 pt-4 mb-4">
                                                    <h4 className="font-semibold text-gray-900 text-sm mb-2">
                                                        <TrendingUp className="w-4 h-4 inline mr-1" />
                                                        Relevance to Your Case:
                                                    </h4>
                                                    <p className="text-gray-600 text-sm leading-relaxed">{relevance}</p>
                                                </div>

                                                {legalPrinciple && (
                                                    <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                                                        <p className="text-sm font-medium text-blue-900">
                                                            <Scale className="w-4 h-4 inline mr-2" />
                                                            Key Legal Principle: <span className="font-normal">{legalPrinciple}</span>
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Step 6: AI Chat */}
                    {currentStep === 'ai-chat' && (
                        <div className="h-[600px] flex flex-col">
                            <div className="flex items-center gap-3 mb-6">
                                <MessageSquare className="w-8 h-8 text-blue-600" />
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900">AI Legal Chat</h2>
                                    <p className="text-gray-600 mt-1">Ask questions about your case analysis</p>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto mb-4 p-6 bg-gradient-to-b from-gray-50 to-white rounded-xl">
                                {chatMessages.length === 0 ? (
                                    <div className="text-center text-gray-500 py-12">
                                        <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                                        <p className="font-medium text-gray-700">Start a conversation about your case</p>
                                        <p className="text-sm mt-2">Ask about analysis, precedents, or strategy</p>
                                    </div>
                                ) : (
                                    <div>
                                        {chatMessages.map((msg: any) => (
                                            <FormattedMessage
                                                key={msg.id}
                                                content={msg.content}
                                                role={msg.role}
                                                isStreaming={msg.isStreaming}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={chatInput}
                                    onChange={(e) => setChatInput(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && sendChatMessage()}
                                    placeholder="Ask about your case analysis..."
                                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    disabled={isChatLoading}
                                />
                                <button
                                    onClick={sendChatMessage}
                                    disabled={!chatInput.trim() || isChatLoading}
                                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Send className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Navigation Buttons */}
                <div className="flex items-center justify-between mt-8">
                    <button
                        onClick={prevStep}
                        disabled={getCurrentStepIndex() === 0}
                        className="flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                    >
                        <ChevronLeft className="w-5 h-5" />
                        Back
                    </button>

                    {currentStep === 'analysis-type' ? (
                        <button
                            onClick={startAnalysis}
                            disabled={!analysisType || isAnalyzing}
                            className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <TrendingUp className="w-5 h-5" />
                            Start Full Analysis
                        </button>
                    ) : currentStep === 'select-case' ? (
                        <button
                            onClick={nextStep}
                            disabled={!caseData.title || !caseData.caseType || !caseData.description}
                            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Next
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    ) : (
                        <button
                            onClick={nextStep}
                            disabled={getCurrentStepIndex() === steps.length - 1}
                            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Next
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    )}
                </div>
            </div>
        </div>
    )
}
