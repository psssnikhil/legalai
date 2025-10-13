'use client'

import { useState } from 'react'
import { Send, BookOpen, Search, Sparkles, FileText, Scale, Download, ExternalLink, Loader2, AlertCircle } from 'lucide-react'

interface Message {
    id: string
    role: 'user' | 'assistant'
    content: string
    timestamp: Date
    cases?: any[]
}

interface CaseResult {
    tid: string
    title: string
    court: string
    date: string
    snippet: string
    link: string
}

export default function LegalLibraryChatPage() {
    const [activeTab, setActiveTab] = useState<'chat' | 'search' | 'cnr'>('search')
    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            role: 'assistant',
            content: "Hello! I'm your Legal Research Assistant. I can help you find relevant case laws, statutes, and legal precedents from Indian courts.",
            timestamp: new Date()
        }
    ])
    const [input, setInput] = useState('')
    const [isLoading, setIsLoading] = useState(false)

    // Search states
    const [searchQuery, setSearchQuery] = useState('')
    const [searchResults, setSearchResults] = useState<CaseResult[]>([])
    const [isSearching, setIsSearching] = useState(false)
    const [searchError, setSearchError] = useState('')

    // CNR search states
    const [cnrNumber, setCnrNumber] = useState('')
    const [cnrResult, setCnrResult] = useState<any>(null)
    const [isCnrSearching, setIsCnrSearching] = useState(false)
    const [cnrError, setCnrError] = useState('')

    const suggestedSearches = [
        'intellectual property infringement',
        'contract breach Section 73',
        'fundamental rights Article 21',
        'criminal procedure Section 154',
        'trademark infringement',
        'property dispute'
    ]

    const handleChatSend = async () => {
        if (!input.trim() || isLoading) return

        const userMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: input,
            timestamp: new Date()
        }

        setMessages(prev => [...prev, userMessage])
        setInput('')
        setIsLoading(true)

        // Simulate AI response (replace with actual AI call)
        setTimeout(() => {
            const assistantMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: "I'm a placeholder response. Configure your OpenAI API key in .env.local to enable AI-powered legal research assistance.",
                timestamp: new Date()
            }
            setMessages(prev => [...prev, assistantMessage])
            setIsLoading(false)
        }, 1000)
    }

    const handleKeywordSearch = async () => {
        if (!searchQuery.trim()) return

        setIsSearching(true)
        setSearchError('')
        setSearchResults([])

        try {
            const response = await fetch(`/api/legal-research/search?query=${encodeURIComponent(searchQuery)}&limit=10`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            })

            if (!response.ok) {
                throw new Error('Search failed')
            }

            const data = await response.json()

            if (data.success && data.cases) {
                setSearchResults(data.cases)
            } else {
                setSearchError(data.error || 'No results found')
            }
        } catch (error) {
            console.error('Search error:', error)
            setSearchError('Failed to search cases. The Indian Kanoon API might be temporarily unavailable.')
        } finally {
            setIsSearching(false)
        }
    }

    const handleCNRSearch = async () => {
        if (!cnrNumber.trim()) return

        setIsCnrSearching(true)
        setCnrError('')
        setCnrResult(null)

        try {
            const response = await fetch(`/api/legal-research/cnr?cnr=${encodeURIComponent(cnrNumber)}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            })

            if (!response.ok) {
                throw new Error('CNR search failed')
            }

            const data = await response.json()

            if (data.success && data.case) {
                setCnrResult(data.case)
            } else {
                setCnrError(data.error || 'Case not found')
            }
        } catch (error) {
            console.error('CNR search error:', error)
            setCnrError('Failed to fetch case details. The E-Courts API might be temporarily unavailable.')
        } finally {
            setIsCnrSearching(false)
        }
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-6 py-4">
                <div className="max-w-[1600px] mx-auto">
                    <div className="flex items-center justify-between flex-wrap gap-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-purple-100 rounded-lg">
                                <Scale className="w-6 h-6 text-purple-600" />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-gray-900">Legal Research Assistant</h1>
                                <p className="text-sm text-gray-600">Search Indian case laws, statutes, and E-Courts data</p>
                            </div>
                        </div>

                        {/* Tab Navigation */}
                        <div className="flex gap-2 bg-gray-100 p-1 rounded-lg">
                            <button
                                onClick={() => setActiveTab('search')}
                                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'search'
                                    ? 'bg-white text-blue-600 shadow-sm'
                                    : 'text-gray-600 hover:text-gray-900'
                                    }`}
                            >
                                <Search className="w-4 h-4 inline mr-2" />
                                Keyword Search
                            </button>
                            <button
                                onClick={() => setActiveTab('cnr')}
                                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'cnr'
                                    ? 'bg-white text-blue-600 shadow-sm'
                                    : 'text-gray-600 hover:text-gray-900'
                                    }`}
                            >
                                <FileText className="w-4 h-4 inline mr-2" />
                                CNR Lookup
                            </button>
                            <button
                                onClick={() => setActiveTab('chat')}
                                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'chat'
                                    ? 'bg-white text-blue-600 shadow-sm'
                                    : 'text-gray-600 hover:text-gray-900'
                                    }`}
                            >
                                <Sparkles className="w-4 h-4 inline mr-2" />
                                AI Chat
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 max-w-[1600px] w-full mx-auto p-6">
                {/* Keyword Search Tab */}
                {activeTab === 'search' && (
                    <div className="space-y-6">
                        {/* Search Box */}
                        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">Search Indian Case Laws</h2>
                            <div className="flex gap-3">
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleKeywordSearch()}
                                    placeholder="Enter keywords, section number, or party name..."
                                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                                <button
                                    onClick={handleKeywordSearch}
                                    disabled={!searchQuery.trim() || isSearching}
                                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                                >
                                    {isSearching ? (
                                        <><Loader2 className="w-5 h-5 animate-spin" /> Searching...</>
                                    ) : (
                                        <><Search className="w-5 h-5" /> Search</>
                                    )}
                                </button>
                            </div>

                            {/* Suggested Searches */}
                            <div className="mt-4">
                                <p className="text-sm text-gray-600 mb-2">Suggested searches:</p>
                                <div className="flex flex-wrap gap-2">
                                    {suggestedSearches.map((suggestion, index) => (
                                        <button
                                            key={index}
                                            onClick={() => setSearchQuery(suggestion)}
                                            className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs hover:bg-gray-200 transition-colors"
                                        >
                                            {suggestion}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Search Results */}
                        {searchError && (
                            <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
                                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                                <div>
                                    <h3 className="font-semibold text-red-900">Search Error</h3>
                                    <p className="text-sm text-red-700 mt-1">{searchError}</p>
                                </div>
                            </div>
                        )}

                        {searchResults.length > 0 && (
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold text-gray-900">
                                    Found {searchResults.length} case{searchResults.length !== 1 ? 's' : ''}
                                </h3>
                                {searchResults.map((caseItem) => (
                                    <div
                                        key={caseItem.tid}
                                        className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow"
                                    >
                                        <div className="flex items-start justify-between mb-3">
                                            <h4 className="text-lg font-semibold text-gray-900 flex-1">{caseItem.title}</h4>
                                            <a
                                                href={caseItem.link}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="ml-4 p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                title="View full case"
                                            >
                                                <ExternalLink className="w-5 h-5" />
                                            </a>
                                        </div>

                                        <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                                            <span className="flex items-center gap-1">
                                                <Scale className="w-4 h-4" />
                                                {caseItem.court}
                                            </span>
                                            <span>•</span>
                                            <span>{caseItem.date}</span>
                                        </div>

                                        <p className="text-gray-700 text-sm leading-relaxed mb-4">
                                            {caseItem.snippet}
                                        </p>

                                        <div className="flex items-center gap-2">
                                            <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                                                Case ID: {caseItem.tid}
                                            </span>
                                            <button className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg text-xs hover:bg-gray-200 transition-colors flex items-center gap-1">
                                                <Download className="w-3 h-3" />
                                                Save
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {searchResults.length === 0 && !searchError && !isSearching && (
                            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                                <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">Search Indian Case Laws</h3>
                                <p className="text-gray-600">
                                    Enter keywords, section numbers, or party names to find relevant cases from Indian Kanoon
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {/* CNR Lookup Tab */}
                {activeTab === 'cnr' && (
                    <div className="space-y-6">
                        {/* CNR Search Box */}
                        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">Search by CNR Number</h2>
                            <p className="text-sm text-gray-600 mb-4">
                                CNR (Case Number Reference) is a unique 16-digit alpha-numeric code assigned to every case filed in Indian courts.
                            </p>
                            <div className="flex gap-3">
                                <input
                                    type="text"
                                    value={cnrNumber}
                                    onChange={(e) => setCnrNumber(e.target.value.toUpperCase())}
                                    onKeyPress={(e) => e.key === 'Enter' && handleCNRSearch()}
                                    placeholder="Enter CNR number (e.g., DLHC010123456789)"
                                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
                                    maxLength={16}
                                />
                                <button
                                    onClick={handleCNRSearch}
                                    disabled={!cnrNumber.trim() || isCnrSearching}
                                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                                >
                                    {isCnrSearching ? (
                                        <><Loader2 className="w-5 h-5 animate-spin" /> Searching...</>
                                    ) : (
                                        <><FileText className="w-5 h-5" /> Lookup</>
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* CNR Error */}
                        {cnrError && (
                            <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
                                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                                <div>
                                    <h3 className="font-semibold text-red-900">CNR Lookup Error</h3>
                                    <p className="text-sm text-red-700 mt-1">{cnrError}</p>
                                </div>
                            </div>
                        )}

                        {/* CNR Result */}
                        {cnrResult && (
                            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Case Details</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm font-medium text-gray-600">CNR Number</label>
                                        <p className="text-gray-900 font-mono mt-1">{cnrResult.cnrNumber}</p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-600">Case Number</label>
                                        <p className="text-gray-900 mt-1">{cnrResult.caseNumber || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-600">Court</label>
                                        <p className="text-gray-900 mt-1">{cnrResult.court}</p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-600">Case Status</label>
                                        <p className="text-gray-900 mt-1">
                                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${cnrResult.caseStatus.toLowerCase().includes('pending') ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'
                                                }`}>
                                                {cnrResult.caseStatus}
                                            </span>
                                        </p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-600">Filing Date</label>
                                        <p className="text-gray-900 mt-1">{cnrResult.filingDate || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-600">Next Hearing</label>
                                        <p className="text-gray-900 mt-1">{cnrResult.nextHearingDate || 'N/A'}</p>
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="text-sm font-medium text-gray-600">Petitioner(s)</label>
                                        <p className="text-gray-900 mt-1">{cnrResult.petitioner?.join(', ') || 'N/A'}</p>
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="text-sm font-medium text-gray-600">Respondent(s)</label>
                                        <p className="text-gray-900 mt-1">{cnrResult.respondent?.join(', ') || 'N/A'}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {!cnrResult && !cnrError && !isCnrSearching && (
                            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                                <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">CNR Number Lookup</h3>
                                <p className="text-gray-600">
                                    Enter a valid CNR number to fetch case details from E-Courts
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {/* AI Chat Tab */}
                {activeTab === 'chat' && (
                    <div className="flex flex-col h-[calc(100vh-200px)]">
                        {/* Messages */}
                        <div className="flex-1 space-y-6 mb-6 overflow-y-auto">
                            {messages.map((message) => (
                                <div
                                    key={message.id}
                                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div
                                        className={`max-w-[70%] rounded-xl p-4 ${message.role === 'user'
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-white border border-gray-200 text-gray-900'
                                            }`}
                                    >
                                        {message.role === 'assistant' && (
                                            <div className="flex items-center gap-2 mb-2">
                                                <Sparkles className="w-4 h-4 text-purple-600" />
                                                <span className="text-xs font-semibold text-purple-600">AI Assistant</span>
                                            </div>
                                        )}
                                        <p className="text-sm leading-relaxed">{message.content}</p>
                                        <p className={`text-xs mt-2 ${message.role === 'user' ? 'text-blue-100' : 'text-gray-500'
                                            }`}>
                                            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>
                                </div>
                            ))}

                            {isLoading && (
                                <div className="flex justify-start">
                                    <div className="bg-white border border-gray-200 rounded-xl p-4">
                                        <div className="flex items-center gap-2">
                                            <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                                            <span className="text-sm text-gray-600">Thinking...</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Input Area */}
                        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-lg">
                            <div className="flex gap-3">
                                <input
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleChatSend()}
                                    placeholder="Ask about case laws, statutes, or legal concepts..."
                                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    disabled={isLoading}
                                />
                                <button
                                    onClick={handleChatSend}
                                    disabled={!input.trim() || isLoading}
                                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                                >
                                    <Send className="w-5 h-5" />
                                    Send
                                </button>
                            </div>
                            <p className="text-xs text-gray-500 mt-2 text-center">
                                AI can make mistakes. Verify important legal information.
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
