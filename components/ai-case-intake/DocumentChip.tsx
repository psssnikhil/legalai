'use client'

import { useState } from 'react'
import { FileText, X, ChevronDown, ChevronUp } from 'lucide-react'

interface DocumentChipProps {
    doc: any
    index: number
    onRemove: (index: number) => void
}

export default function DocumentChip({ doc, index, onRemove }: DocumentChipProps) {
    const [isExpanded, setIsExpanded] = useState(false)

    return (
        <div className="bg-white border border-blue-200 rounded-lg overflow-hidden">
            {/* Chip Header */}
            <div className="flex items-center gap-2 px-3 py-2">
                <FileText className="w-4 h-4 text-blue-600 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-blue-900 truncate">{doc.filename}</span>
                        <span className="text-xs text-blue-600">({doc.wordCount || 0} words)</span>
                    </div>
                </div>
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                    title={isExpanded ? 'Collapse' : 'Expand details'}
                >
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                <button
                    onClick={() => onRemove(index)}
                    className="p-1 text-blue-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                    title="Remove document"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>

            {/* Expanded Details */}
            {isExpanded && doc.keyInfo && (
                <div className="border-t border-blue-100 bg-blue-25 p-3 text-xs">
                    <div className="grid grid-cols-2 gap-3">
                        {doc.keyInfo.parties && doc.keyInfo.parties.length > 0 && (
                            <div>
                                <div className="font-semibold text-blue-900 mb-1">Parties ({doc.keyInfo.parties.length})</div>
                                <div className="text-blue-700 space-y-0.5">
                                    {doc.keyInfo.parties.slice(0, 3).map((party: string, i: number) => (
                                        <div key={i}>• {party}</div>
                                    ))}
                                    {doc.keyInfo.parties.length > 3 && (
                                        <div className="text-blue-500">... +{doc.keyInfo.parties.length - 3} more</div>
                                    )}
                                </div>
                            </div>
                        )}

                        {doc.keyInfo.caseTypes && doc.keyInfo.caseTypes.length > 0 && (
                            <div>
                                <div className="font-semibold text-blue-900 mb-1">Case Types</div>
                                <div className="text-blue-700 space-y-0.5">
                                    {doc.keyInfo.caseTypes.slice(0, 3).map((type: string, i: number) => (
                                        <div key={i}>• {type}</div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {doc.keyInfo.dates && doc.keyInfo.dates.length > 0 && (
                            <div>
                                <div className="font-semibold text-blue-900 mb-1">Dates ({doc.keyInfo.dates.length})</div>
                                <div className="text-blue-700 space-y-0.5">
                                    {doc.keyInfo.dates.slice(0, 3).map((date: string, i: number) => (
                                        <div key={i}>• {date}</div>
                                    ))}
                                    {doc.keyInfo.dates.length > 3 && (
                                        <div className="text-blue-500">... +{doc.keyInfo.dates.length - 3} more</div>
                                    )}
                                </div>
                            </div>
                        )}

                        {doc.keyInfo.amounts && doc.keyInfo.amounts.length > 0 && (
                            <div>
                                <div className="font-semibold text-blue-900 mb-1">Amounts</div>
                                <div className="text-blue-700 space-y-0.5">
                                    {doc.keyInfo.amounts.slice(0, 3).map((amount: string, i: number) => (
                                        <div key={i}>• {amount}</div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {doc.keyInfo.jurisdictions && doc.keyInfo.jurisdictions.length > 0 && (
                            <div>
                                <div className="font-semibold text-blue-900 mb-1">Jurisdictions</div>
                                <div className="text-blue-700 space-y-0.5">
                                    {doc.keyInfo.jurisdictions.slice(0, 2).map((j: string, i: number) => (
                                        <div key={i}>• {j}</div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {doc.textLength && (
                        <div className="mt-2 pt-2 border-t border-blue-100 text-blue-600">
                            📄 {doc.textLength} characters extracted • AI can answer questions about this document
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

