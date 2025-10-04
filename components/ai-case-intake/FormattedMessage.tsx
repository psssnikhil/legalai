'use client'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { User, Bot } from 'lucide-react'

interface FormattedMessageProps {
    content: string
    role: 'user' | 'assistant'
    isStreaming?: boolean
}

export default function FormattedMessage({ content, role, isStreaming = false }: FormattedMessageProps) {
    return (
        <div className={`flex gap-4 ${role === 'user' ? 'justify-end' : 'justify-start'} mb-6`}>
            {role === 'assistant' && (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center flex-shrink-0">
                    <Bot className="w-5 h-5 text-white" />
                </div>
            )}

            <div
                className={`max-w-[80%] rounded-2xl px-5 py-4 ${role === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-white border border-gray-200 text-gray-900 shadow-sm'
                    }`}
            >
                {role === 'user' ? (
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{content}</p>
                ) : (
                    <div className="prose prose-sm max-w-none prose-headings:mt-4 prose-headings:mb-2 prose-p:my-2 prose-ul:my-2 prose-ol:my-2 prose-li:my-1">
                        <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={{
                                h1: ({ node, ...props }) => <h1 className="text-xl font-bold text-gray-900 mt-4 mb-2" {...props} />,
                                h2: ({ node, ...props }) => <h2 className="text-lg font-bold text-gray-900 mt-3 mb-2" {...props} />,
                                h3: ({ node, ...props }) => <h3 className="text-base font-semibold text-gray-900 mt-3 mb-1" {...props} />,
                                h4: ({ node, ...props }) => <h4 className="text-sm font-semibold text-gray-800 mt-2 mb-1" {...props} />,
                                p: ({ node, ...props }) => <p className="text-sm leading-relaxed text-gray-800 my-2" {...props} />,
                                ul: ({ node, ...props }) => <ul className="list-disc list-inside space-y-1 my-2 text-sm text-gray-800" {...props} />,
                                ol: ({ node, ...props }) => <ol className="list-decimal list-inside space-y-1 my-2 text-sm text-gray-800" {...props} />,
                                li: ({ node, ...props }) => <li className="ml-2 text-gray-800" {...props} />,
                                strong: ({ node, ...props }) => <strong className="font-semibold text-gray-900" {...props} />,
                                em: ({ node, ...props }) => <em className="italic text-gray-700" {...props} />,
                                code: ({ node, inline, ...props }: any) =>
                                    inline ? (
                                        <code className="px-1.5 py-0.5 bg-gray-100 text-red-600 rounded text-xs font-mono" {...props} />
                                    ) : (
                                        <code className="block px-4 py-3 bg-gray-100 text-gray-800 rounded-lg text-xs font-mono overflow-x-auto my-2" {...props} />
                                    ),
                                pre: ({ node, ...props }) => <pre className="bg-gray-100 rounded-lg p-4 overflow-x-auto my-2" {...props} />,
                                blockquote: ({ node, ...props }) => (
                                    <blockquote className="border-l-4 border-blue-500 pl-4 py-2 my-2 italic text-gray-700 bg-blue-50" {...props} />
                                ),
                                a: ({ node, ...props }) => (
                                    <a className="text-blue-600 hover:text-blue-800 underline" target="_blank" rel="noopener noreferrer" {...props} />
                                ),
                                table: ({ node, ...props }) => (
                                    <div className="overflow-x-auto my-4">
                                        <table className="min-w-full divide-y divide-gray-200 border border-gray-200 rounded-lg" {...props} />
                                    </div>
                                ),
                                thead: ({ node, ...props }) => <thead className="bg-gray-50" {...props} />,
                                tbody: ({ node, ...props }) => <tbody className="bg-white divide-y divide-gray-200" {...props} />,
                                tr: ({ node, ...props }) => <tr {...props} />,
                                th: ({ node, ...props }) => (
                                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider" {...props} />
                                ),
                                td: ({ node, ...props }) => <td className="px-4 py-2 text-sm text-gray-800" {...props} />,
                                hr: ({ node, ...props }) => <hr className="my-4 border-gray-200" {...props} />,
                            }}
                        >
                            {content}
                        </ReactMarkdown>
                    </div>
                )}

                {isStreaming && role === 'assistant' && (
                    <span className="inline-block w-2 h-4 bg-blue-600 animate-pulse ml-1"></span>
                )}
            </div>

            {role === 'user' && (
                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                    <User className="w-5 h-5 text-gray-600" />
                </div>
            )}
        </div>
    )
}

