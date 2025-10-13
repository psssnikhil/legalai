'use client'

import { useState, useEffect, useRef } from 'react'
import {
    Mic,
    MicOff,
    Download,
    Copy,
    Trash2,
    Settings,
    Save,
    FileText,
    Sparkles,
    Loader2,
    Eye,
    EyeOff,
    Zap
} from 'lucide-react'

interface SpeechRecognition extends EventTarget {
    continuous: boolean
    interimResults: boolean
    lang: string
    start(): void
    stop(): void
    abort(): void
    onresult: (event: SpeechRecognitionEvent) => void
    onerror: (event: SpeechRecognitionErrorEvent) => void
    onend: () => void
}

interface SpeechRecognitionEvent extends Event {
    results: SpeechRecognitionResultList
    resultIndex: number
}

interface SpeechRecognitionResultList {
    length: number
    item(index: number): SpeechRecognitionResult
    [index: number]: SpeechRecognitionResult
}

interface SpeechRecognitionResult {
    isFinal: boolean
    length: number
    item(index: number): SpeechRecognitionAlternative
    [index: number]: SpeechRecognitionAlternative
}

interface SpeechRecognitionAlternative {
    transcript: string
    confidence: number
}

interface SpeechRecognitionErrorEvent extends Event {
    error: string
    message: string
}

declare global {
    interface Window {
        SpeechRecognition: any
        webkitSpeechRecognition: any
    }
}

export default function DictationPage() {
    const [isListening, setIsListening] = useState(false)
    const [rawText, setRawText] = useState('')
    const [correctedText, setCorrectedText] = useState('')
    const [interimText, setInterimText] = useState('')
    const [language, setLanguage] = useState('en-US')
    const [showSettings, setShowSettings] = useState(false)
    const [isSupported, setIsSupported] = useState(true)
    const [error, setError] = useState('')
    const [savedDocs, setSavedDocs] = useState<Array<{ id: string; title: string; content: string; date: string }>>([])
    const [currentDocTitle, setCurrentDocTitle] = useState('')
    const [showSaveDialog, setShowSaveDialog] = useState(false)

    // AI Correction features
    const [aiCorrectionEnabled, setAiCorrectionEnabled] = useState(true)
    const [correctionMode, setCorrectionMode] = useState<'legal' | 'general' | 'minimal'>('legal')
    const [isCorrectingText, setIsCorrectingText] = useState(false)
    const [showRawText, setShowRawText] = useState(false)
    const [pendingCorrection, setPendingCorrection] = useState('')
    const [cursorPosition, setCursorPosition] = useState(0)

    const recognitionRef = useRef<SpeechRecognition | null>(null)
    const textAreaRef = useRef<HTMLTextAreaElement>(null)
    const correctionTimeoutRef = useRef<NodeJS.Timeout | null>(null)
    const editTimeoutRef = useRef<NodeJS.Timeout | null>(null)

    // Function to get context around cursor position
    const getContextAroundCursor = (text: string, position: number, contextLength: number = 300) => {
        // Get text before cursor
        const beforeStart = Math.max(0, position - contextLength)
        const beforeContext = text.slice(beforeStart, position)

        // Get text after cursor
        const afterEnd = Math.min(text.length, position + contextLength)
        const afterContext = text.slice(position, afterEnd)

        return { beforeContext, afterContext }
    }

    // Function to correct text using AI with surrounding context
    const correctText = async (
        textToCorrect: string,
        isRealTimeEdit: boolean = false,
        customPosition?: number
    ) => {
        if (!textToCorrect.trim() || !aiCorrectionEnabled) return textToCorrect

        try {
            setIsCorrectingText(true)

            // Get cursor position from textarea or use custom position
            const position = customPosition !== undefined
                ? customPosition
                : textAreaRef.current?.selectionStart || correctedText.length

            // Extract context around the position where new text will be added
            const fullText = correctedText
            const { beforeContext, afterContext } = getContextAroundCursor(fullText, position)

            const response = await fetch('/api/dictation-correct', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    text: textToCorrect,
                    beforeContext,
                    afterContext,
                    mode: correctionMode,
                    isRealTimeEdit
                })
            })

            const data = await response.json()

            if (data.corrected) {
                return data.corrected
            }

            return textToCorrect
        } catch (error) {
            console.error('Correction error:', error)
            return textToCorrect // Fallback to original
        } finally {
            setIsCorrectingText(false)
        }
    }

    // Function to re-correct selected text
    const recorrectSelection = async () => {
        const textarea = textAreaRef.current
        if (!textarea || !aiCorrectionEnabled) return

        const start = textarea.selectionStart
        const end = textarea.selectionEnd

        if (start === end) {
            alert('Please select text to re-correct')
            return
        }

        const selectedText = showRawText ? rawText.slice(start, end) : correctedText.slice(start, end)

        if (!selectedText.trim()) return

        setIsCorrectingText(true)

        // Get surrounding context
        const currentText = showRawText ? rawText : correctedText
        const beforeText = currentText.slice(0, start)
        const afterText = currentText.slice(end)
        const { beforeContext, afterContext } = getContextAroundCursor(
            beforeText + afterText,
            start,
            200
        )

        try {
            const response = await fetch('/api/dictation-correct', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    text: selectedText,
                    beforeContext,
                    afterContext,
                    mode: correctionMode,
                    isRealTimeEdit: true
                })
            })

            const data = await response.json()

            if (data.corrected) {
                const newText = beforeText + data.corrected + afterText
                if (showRawText) {
                    setRawText(newText)
                } else {
                    setCorrectedText(newText)
                }

                // Restore cursor position after correction
                setTimeout(() => {
                    textarea.focus()
                    textarea.setSelectionRange(start, start + data.corrected.length)
                }, 0)
            }
        } catch (error) {
            console.error('Re-correction error:', error)
        } finally {
            setIsCorrectingText(false)
        }
    }

    useEffect(() => {
        // Check if speech recognition is supported
        if (typeof window !== 'undefined') {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
            if (!SpeechRecognition) {
                setIsSupported(false)
                setError('Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.')
                return
            }

            // Initialize speech recognition
            const recognition = new SpeechRecognition() as SpeechRecognition
            recognition.continuous = true
            recognition.interimResults = true
            recognition.lang = language

            recognition.onresult = async (event: SpeechRecognitionEvent) => {
                let interim = ''
                let final = ''

                for (let i = event.resultIndex; i < event.results.length; i++) {
                    const transcript = event.results[i][0].transcript
                    if (event.results[i].isFinal) {
                        final += transcript + ' '
                    } else {
                        interim += transcript
                    }
                }

                if (final) {
                    // Update raw text immediately
                    setRawText((prevText) => prevText + final)

                    // Handle AI correction with debounce
                    if (aiCorrectionEnabled) {
                        setPendingCorrection(prev => prev + final)

                        // Clear existing timeout
                        if (correctionTimeoutRef.current) {
                            clearTimeout(correctionTimeoutRef.current)
                        }

                        // Debounce correction (wait 800ms after last word)
                        correctionTimeoutRef.current = setTimeout(async () => {
                            const textToCorrect = pendingCorrection + final
                            // Get current cursor position for context
                            const position = textAreaRef.current?.selectionStart || correctedText.length
                            const corrected = await correctText(textToCorrect, false, position)
                            setCorrectedText(prev => prev + corrected)
                            setPendingCorrection('')
                        }, 800)
                    } else {
                        setCorrectedText((prevText) => prevText + final)
                    }

                    setInterimText('')
                } else {
                    setInterimText(interim)
                }
            }

            recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
                console.error('Speech recognition error:', event.error)
                if (event.error === 'no-speech') {
                    return
                }
                setError(`Error: ${event.error}`)
                setIsListening(false)
            }

            recognition.onend = () => {
                if (isListening) {
                    try {
                        recognition.start()
                    } catch (e) {
                        console.error('Error restarting recognition:', e)
                    }
                }
            }

            recognitionRef.current = recognition
        }

        // Load saved documents from localStorage
        const saved = localStorage.getItem('dictation-docs')
        if (saved) {
            setSavedDocs(JSON.parse(saved))
        }

        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.abort()
            }
            if (correctionTimeoutRef.current) {
                clearTimeout(correctionTimeoutRef.current)
            }
            if (editTimeoutRef.current) {
                clearTimeout(editTimeoutRef.current)
            }
        }
    }, [])

    useEffect(() => {
        if (recognitionRef.current) {
            recognitionRef.current.lang = language
        }
    }, [language])

    const toggleListening = () => {
        if (!isSupported) return

        if (isListening) {
            recognitionRef.current?.stop()
            setIsListening(false)
            setInterimText('')

            // Process any pending correction
            if (pendingCorrection && aiCorrectionEnabled) {
                correctText(pendingCorrection).then(corrected => {
                    setCorrectedText(prev => prev + corrected)
                    setPendingCorrection('')
                })
            }
        } else {
            setError('')
            try {
                recognitionRef.current?.start()
                setIsListening(true)
            } catch (e) {
                console.error('Error starting recognition:', e)
                setError('Failed to start speech recognition. Please try again.')
            }
        }
    }

    // Handle manual text edits with auto-recorrection
    const handleTextChange = (newText: string) => {
        if (showRawText) {
            setRawText(newText)
            return
        }

        setCorrectedText(newText)

        // If AI correction is enabled and user is manually editing, trigger re-correction
        if (aiCorrectionEnabled && !isListening) {
            // Clear existing timeout
            if (editTimeoutRef.current) {
                clearTimeout(editTimeoutRef.current)
            }

            // Debounce re-correction (wait 2 seconds after user stops typing)
            editTimeoutRef.current = setTimeout(async () => {
                const textarea = textAreaRef.current
                if (!textarea) return

                const position = textarea.selectionStart
                const text = newText

                // Get a reasonable chunk around the cursor to re-correct
                const chunkStart = Math.max(0, position - 200)
                const chunkEnd = Math.min(text.length, position + 200)
                const textChunk = text.slice(chunkStart, chunkEnd)

                if (!textChunk.trim()) return

                const corrected = await correctText(textChunk, true, position)

                // Replace the chunk with corrected version
                const newFullText = text.slice(0, chunkStart) + corrected + text.slice(chunkEnd)
                setCorrectedText(newFullText)
            }, 2000)
        }
    }

    const clearText = () => {
        if (confirm('Are you sure you want to clear all text?')) {
            setRawText('')
            setCorrectedText('')
            setInterimText('')
            setPendingCorrection('')
            if (correctionTimeoutRef.current) clearTimeout(correctionTimeoutRef.current)
            if (editTimeoutRef.current) clearTimeout(editTimeoutRef.current)
        }
    }

    const copyToClipboard = async () => {
        const textToCopy = aiCorrectionEnabled ? correctedText : rawText
        try {
            await navigator.clipboard.writeText(textToCopy)
            alert('Text copied to clipboard!')
        } catch (e) {
            console.error('Failed to copy:', e)
            alert('Failed to copy text')
        }
    }

    const downloadAsText = () => {
        const textToDownload = aiCorrectionEnabled ? correctedText : rawText
        const element = document.createElement('a')
        const file = new Blob([textToDownload], { type: 'text/plain' })
        element.href = URL.createObjectURL(file)
        element.download = `dictation-${new Date().toISOString().split('T')[0]}.txt`
        document.body.appendChild(element)
        element.click()
        document.body.removeChild(element)
    }

    const saveDocument = () => {
        const textToSave = aiCorrectionEnabled ? correctedText : rawText
        if (!textToSave.trim()) {
            alert('Cannot save empty document')
            return
        }
        setShowSaveDialog(true)
    }

    const confirmSave = () => {
        const textToSave = aiCorrectionEnabled ? correctedText : rawText
        const title = currentDocTitle.trim() || `Dictation ${new Date().toLocaleString()}`
        const newDoc = {
            id: Date.now().toString(),
            title,
            content: textToSave,
            date: new Date().toISOString()
        }
        const updated = [newDoc, ...savedDocs]
        setSavedDocs(updated)
        localStorage.setItem('dictation-docs', JSON.stringify(updated))
        setShowSaveDialog(false)
        setCurrentDocTitle('')
        alert('Document saved!')
    }

    const loadDocument = (doc: typeof savedDocs[0]) => {
        const currentText = aiCorrectionEnabled ? correctedText : rawText
        if (currentText.trim() && !confirm('Loading a document will replace current text. Continue?')) {
            return
        }
        setRawText(doc.content)
        setCorrectedText(doc.content)
        setInterimText('')
        setPendingCorrection('')
    }

    const deleteDocument = (id: string) => {
        if (!confirm('Are you sure you want to delete this document?')) return
        const updated = savedDocs.filter(doc => doc.id !== id)
        setSavedDocs(updated)
        localStorage.setItem('dictation-docs', JSON.stringify(updated))
    }

    const languages = [
        { code: 'en-US', name: 'English (US)' },
        { code: 'en-GB', name: 'English (UK)' },
        { code: 'hi-IN', name: 'Hindi' },
        { code: 'ta-IN', name: 'Tamil' },
        { code: 'te-IN', name: 'Telugu' },
        { code: 'mr-IN', name: 'Marathi' },
        { code: 'bn-IN', name: 'Bengali' },
        { code: 'gu-IN', name: 'Gujarati' },
        { code: 'kn-IN', name: 'Kannada' },
        { code: 'ml-IN', name: 'Malayalam' },
        { code: 'pa-IN', name: 'Punjabi' },
    ]

    const displayText = showRawText ? rawText : (aiCorrectionEnabled ? correctedText : rawText)

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto p-6">
                {/* Header */}
                <div className="mb-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                                <Mic className="w-8 h-8 text-blue-600" />
                                Real-Time Dictation
                                {aiCorrectionEnabled && (
                                    <span className="flex items-center gap-1 text-sm font-normal text-purple-600 bg-purple-50 px-3 py-1 rounded-full">
                                        <Sparkles className="w-4 h-4" />
                                        AI Correction
                                    </span>
                                )}
                            </h1>
                            <p className="text-gray-600 mt-1">
                                Speak naturally and watch your words appear with intelligent formatting
                            </p>
                        </div>
                        <button
                            onClick={() => setShowSettings(!showSettings)}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <Settings className="w-5 h-5 text-gray-600" />
                        </button>
                    </div>

                    {/* Settings Panel */}
                    {showSettings && (
                        <div className="mt-4 bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                            <h3 className="font-semibold text-gray-900 mb-4">Settings</h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Language Selection */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Language
                                    </label>
                                    <select
                                        value={language}
                                        onChange={(e) => setLanguage(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        disabled={isListening}
                                    >
                                        {languages.map((lang) => (
                                            <option key={lang.code} value={lang.code}>
                                                {lang.name}
                                            </option>
                                        ))}
                                    </select>
                                    {isListening && (
                                        <p className="text-xs text-amber-600 mt-1">
                                            Stop recording to change language
                                        </p>
                                    )}
                                </div>

                                {/* AI Correction Mode */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Correction Mode
                                    </label>
                                    <select
                                        value={correctionMode}
                                        onChange={(e) => setCorrectionMode(e.target.value as any)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                        disabled={!aiCorrectionEnabled}
                                    >
                                        <option value="legal">Legal Format (Professional)</option>
                                        <option value="general">General Format (Standard)</option>
                                        <option value="minimal">Minimal (Light Touch)</option>
                                    </select>
                                </div>
                            </div>

                            {/* AI Correction Toggle */}
                            <div className="mt-4 pt-4 border-t border-gray-200">
                                <label className="flex items-center justify-between cursor-pointer">
                                    <div className="flex items-center gap-2">
                                        <Sparkles className="w-5 h-5 text-purple-600" />
                                        <div>
                                            <span className="font-medium text-gray-900">AI-Powered Correction</span>
                                            <p className="text-xs text-gray-500">
                                                Automatically format, punctuate, and correct grammar
                                            </p>
                                        </div>
                                    </div>
                                    <div className="relative">
                                        <input
                                            type="checkbox"
                                            checked={aiCorrectionEnabled}
                                            onChange={(e) => setAiCorrectionEnabled(e.target.checked)}
                                            className="sr-only peer"
                                        />
                                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                                    </div>
                                </label>
                            </div>
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Dictation Area */}
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                            {/* Error Message */}
                            {error && (
                                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                                    {error}
                                </div>
                            )}

                            {/* Control Buttons */}
                            <div className="flex flex-wrap gap-3 mb-4">
                                <button
                                    onClick={toggleListening}
                                    disabled={!isSupported}
                                    className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${isListening
                                        ? 'bg-red-600 hover:bg-red-700 text-white animate-pulse'
                                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                                        } disabled:bg-gray-300 disabled:cursor-not-allowed`}
                                >
                                    {isListening ? (
                                        <>
                                            <MicOff className="w-5 h-5" />
                                            Stop Recording
                                        </>
                                    ) : (
                                        <>
                                            <Mic className="w-5 h-5" />
                                            Start Recording
                                        </>
                                    )}
                                </button>

                                {aiCorrectionEnabled && (
                                    <button
                                        onClick={() => setShowRawText(!showRawText)}
                                        className="flex items-center gap-2 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                                        title={showRawText ? 'Show corrected text' : 'Show raw transcript'}
                                    >
                                        {showRawText ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                                        {showRawText ? 'Raw' : 'Corrected'}
                                    </button>
                                )}

                                <button
                                    onClick={copyToClipboard}
                                    disabled={!correctedText && !rawText}
                                    className="flex items-center gap-2 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Copy className="w-4 h-4" />
                                    Copy
                                </button>

                                <button
                                    onClick={saveDocument}
                                    disabled={!correctedText && !rawText}
                                    className="flex items-center gap-2 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Save className="w-4 h-4" />
                                    Save
                                </button>

                                <button
                                    onClick={downloadAsText}
                                    disabled={!correctedText && !rawText}
                                    className="flex items-center gap-2 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Download className="w-4 h-4" />
                                    Download
                                </button>

                                <button
                                    onClick={clearText}
                                    disabled={!correctedText && !rawText}
                                    className="flex items-center gap-2 px-4 py-3 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    Clear
                                </button>

                                {aiCorrectionEnabled && (
                                    <button
                                        onClick={recorrectSelection}
                                        disabled={isCorrectingText}
                                        className="flex items-center gap-2 px-4 py-3 border border-purple-300 text-purple-600 rounded-lg hover:bg-purple-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        title="Select text and click to re-correct with AI"
                                    >
                                        <Sparkles className="w-4 h-4" />
                                        Re-Correct Selection
                                    </button>
                                )}
                            </div>

                            {/* Status Indicators */}
                            <div className="flex items-center gap-4 mb-4">
                                {isListening && (
                                    <div className="flex items-center gap-2 text-sm">
                                        <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                                        <span className="text-gray-700 font-medium">Listening...</span>
                                    </div>
                                )}

                                {isCorrectingText && (
                                    <div className="flex items-center gap-2 text-sm text-purple-600">
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        <span className="font-medium">AI Correcting...</span>
                                    </div>
                                )}

                                {pendingCorrection && !isCorrectingText && (
                                    <div className="flex items-center gap-2 text-sm text-amber-600">
                                        <Zap className="w-4 h-4" />
                                        <span className="font-medium">Waiting to correct...</span>
                                    </div>
                                )}
                            </div>

                            {/* Text Area */}
                            <div className="relative">
                                <textarea
                                    ref={textAreaRef}
                                    value={displayText + interimText}
                                    onChange={(e) => handleTextChange(e.target.value)}
                                    onSelect={(e) => {
                                        const target = e.target as HTMLTextAreaElement
                                        setCursorPosition(target.selectionStart)
                                    }}
                                    placeholder={
                                        isSupported
                                            ? 'Click "Start Recording" and begin speaking. Your words will appear here with intelligent formatting...'
                                            : 'Speech recognition is not supported in this browser.'
                                    }
                                    className="w-full h-[500px] p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none font-mono text-gray-900"
                                    disabled={!isSupported}
                                />
                                {interimText && (
                                    <div className="absolute bottom-4 right-4 text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">
                                        Interim text (processing...)
                                    </div>
                                )}
                                {showRawText && aiCorrectionEnabled && (
                                    <div className="absolute top-4 right-4 text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded border border-amber-200">
                                        Raw Transcript
                                    </div>
                                )}
                            </div>

                            {/* Word Count */}
                            <div className="mt-3 text-sm text-gray-500">
                                Words: {displayText.trim() ? displayText.trim().split(/\s+/).length : 0} |
                                Characters: {displayText.length}
                            </div>
                        </div>
                    </div>

                    {/* Saved Documents Sidebar */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                <FileText className="w-5 h-5" />
                                Saved Documents
                            </h3>

                            {savedDocs.length === 0 ? (
                                <p className="text-gray-500 text-sm text-center py-8">
                                    No saved documents yet
                                </p>
                            ) : (
                                <div className="space-y-2 max-h-[600px] overflow-y-auto">
                                    {savedDocs.map((doc) => (
                                        <div
                                            key={doc.id}
                                            className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                                        >
                                            <div className="flex items-start justify-between gap-2">
                                                <button
                                                    onClick={() => loadDocument(doc)}
                                                    className="flex-1 text-left"
                                                >
                                                    <h4 className="font-medium text-gray-900 text-sm truncate">
                                                        {doc.title}
                                                    </h4>
                                                    <p className="text-xs text-gray-500 mt-1">
                                                        {new Date(doc.date).toLocaleDateString()}
                                                    </p>
                                                    <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                                                        {doc.content.substring(0, 100)}...
                                                    </p>
                                                </button>
                                                <button
                                                    onClick={() => deleteDocument(doc.id)}
                                                    className="p-1 hover:bg-red-50 rounded transition-colors"
                                                >
                                                    <Trash2 className="w-4 h-4 text-red-500" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Tips */}
                        <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <h4 className="font-semibold text-blue-900 text-sm mb-2">💡 Tips</h4>
                            <ul className="text-xs text-blue-800 space-y-1">
                                <li>• Speak clearly and at a natural pace</li>
                                {aiCorrectionEnabled ? (
                                    <>
                                        <li>• AI adds punctuation automatically using context</li>
                                        <li>• Just speak - don't say "comma" or "period"</li>
                                        <li>• AI corrects grammar with awareness of surrounding text</li>
                                        <li>• Edit manually - AI will re-correct after 2 seconds</li>
                                        <li>• Select text and click "Re-Correct Selection" to fix it</li>
                                    </>
                                ) : (
                                    <>
                                        <li>• Say "comma", "period", "question mark" for punctuation</li>
                                        <li>• Say "new line" or "new paragraph" to add breaks</li>
                                    </>
                                )}
                                <li>• Documents are saved locally in your browser</li>
                                <li>• Toggle between raw and corrected text views</li>
                            </ul>
                        </div>

                        {/* Correction Mode Info */}
                        {aiCorrectionEnabled && (
                            <div className="mt-4 bg-purple-50 border border-purple-200 rounded-lg p-4">
                                <h4 className="font-semibold text-purple-900 text-sm mb-2 flex items-center gap-1">
                                    <Sparkles className="w-4 h-4" />
                                    Current Mode: {correctionMode.charAt(0).toUpperCase() + correctionMode.slice(1)}
                                </h4>
                                <p className="text-xs text-purple-800">
                                    {correctionMode === 'legal' && 'Professional legal document formatting with proper terminology'}
                                    {correctionMode === 'general' && 'Standard grammar and punctuation correction'}
                                    {correctionMode === 'minimal' && 'Light corrections, preserving your style'}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Save Dialog */}
            {showSaveDialog && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">
                            Save Document
                        </h3>
                        <input
                            type="text"
                            value={currentDocTitle}
                            onChange={(e) => setCurrentDocTitle(e.target.value)}
                            placeholder="Enter document title (optional)"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-4"
                            autoFocus
                            onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                    confirmSave()
                                }
                            }}
                        />
                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={() => {
                                    setShowSaveDialog(false)
                                    setCurrentDocTitle('')
                                }}
                                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmSave}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                Save
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
