'use client'

import { useState, useEffect } from 'react'
import { X, Download, Maximize2, Minimize2, ExternalLink } from 'lucide-react'

interface PDFViewerProps {
    documentId: string
    documentName: string
    initialPage?: number
    onClose: () => void
    isFullscreen?: boolean
    onToggleFullscreen?: () => void
}

export default function PDFViewer({
    documentId,
    documentName,
    initialPage = 1,
    onClose,
    isFullscreen = false,
    onToggleFullscreen
}: PDFViewerProps) {
    const [pdfUrl, setPdfUrl] = useState<string>('')
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // Set up PDF URL with page navigation
    useEffect(() => {
        if (documentId) {
            console.log('[PDFViewer] Setting PDF URL for document:', documentId, 'page:', initialPage)
            // Use #page=N to navigate to specific page in PDF
            const url = `/api/documents/${documentId}/pdf#page=${initialPage || 1}`
            setPdfUrl(url)
            setLoading(true)
            setError(null)
        }
    }, [documentId, initialPage])

    const handleLoad = () => {
        console.log('[PDFViewer] PDF loaded successfully')
        setLoading(false)
        setError(null)
    }

    const handleError = () => {
        console.error('[PDFViewer] Error loading PDF')
        setLoading(false)
        setError('Failed to load PDF document')
    }

    const handleDownload = () => {
        // Download the PDF
        const link = document.createElement('a')
        link.href = `/api/documents/${documentId}/pdf`
        link.download = documentName
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }

    const handleOpenNewTab = () => {
        window.open(pdfUrl, '_blank')
    }

    return (
        <div className={`flex flex-col bg-white border-l border-gray-200 ${isFullscreen ? 'fixed inset-0 z-50' : 'h-full'}`}>
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="flex items-center gap-2 text-purple-600 bg-purple-50 px-3 py-1.5 rounded-lg">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                        </svg>
                        <span className="font-medium text-sm">PDF</span>
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-gray-900 truncate">{documentName}</h3>
                        <p className="text-xs text-gray-500">
                            {initialPage && initialPage > 1 ? `Opening at page ${initialPage}` : 'Document viewer'}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={handleDownload}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Download PDF"
                    >
                        <Download className="w-4 h-4 text-gray-600" />
                    </button>
                    <button
                        onClick={handleOpenNewTab}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Open in new tab"
                    >
                        <ExternalLink className="w-4 h-4 text-gray-600" />
                    </button>
                    {onToggleFullscreen && (
                        <button
                            onClick={onToggleFullscreen}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
                        >
                            {isFullscreen ? (
                                <Minimize2 className="w-4 h-4 text-gray-600" />
                            ) : (
                                <Maximize2 className="w-4 h-4 text-gray-600" />
                            )}
                        </button>
                    )}
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                        title="Close"
                    >
                        <X className="w-4 h-4 text-gray-600 hover:text-red-600" />
                    </button>
                </div>
            </div>

            {/* PDF Content */}
            <div className="flex-1 relative bg-gray-50">
                {loading && !error && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-white z-10">
                        <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mb-4" />
                        <p className="text-sm text-gray-600">Loading PDF...</p>
                        <p className="text-xs text-gray-500 mt-2">Page {initialPage}</p>
                    </div>
                )}

                {error && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-white z-10">
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                            <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <p className="text-sm text-gray-900 font-medium mb-2">{error}</p>
                        <p className="text-xs text-gray-600 mb-4">The PDF could not be loaded</p>
                        <button
                            onClick={onClose}
                            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                        >
                            Close
                        </button>
                    </div>
                )}

                {/* Native PDF Viewer using iframe */}
                {pdfUrl && (
                    <iframe
                        src={pdfUrl}
                        className="w-full h-full border-0"
                        title={documentName}
                        onLoad={handleLoad}
                        onError={handleError}
                    />
                )}
            </div>

            {/* Footer tip */}
            <div className="bg-white border-t border-gray-200 px-4 py-2">
                <p className="text-xs text-gray-500 text-center">
                    💡 Use browser controls to zoom and navigate • Page {initialPage} is highlighted
                </p>
            </div>
        </div>
    )
}
