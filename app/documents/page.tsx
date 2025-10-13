'use client'

import { useState } from 'react'
import { Plus, Search, Filter, Download, Eye, Trash2, FileText, File, Image, FileArchive, Calendar, User } from 'lucide-react'

interface Document {
    id: string
    name: string
    type: 'pdf' | 'doc' | 'image' | 'other'
    size: string
    uploadedBy: string
    uploadedDate: string
    case?: string
    category: string
}

export default function DocumentsPage() {
    const [searchQuery, setSearchQuery] = useState('')
    const [filterCategory, setFilterCategory] = useState<string>('all')

    const documents: Document[] = [
        {
            id: 'DOC-001',
            name: 'Contract Agreement - Smith vs Johnson.pdf',
            type: 'pdf',
            size: '2.4 MB',
            uploadedBy: 'Sarah Wilson',
            uploadedDate: 'Oct 12, 2025',
            case: 'Smith vs. Johnson',
            category: 'Contracts'
        },
        {
            id: 'DOC-002',
            name: 'Corporate Merger Documents.pdf',
            type: 'pdf',
            size: '5.1 MB',
            uploadedBy: 'Mike Chen',
            uploadedDate: 'Oct 11, 2025',
            case: 'Corporate Merger - ABC Ltd',
            category: 'Corporate'
        },
        {
            id: 'DOC-003',
            name: 'Employment Agreement Template.docx',
            type: 'doc',
            size: '156 KB',
            uploadedBy: 'Emily Davis',
            uploadedDate: 'Oct 10, 2025',
            category: 'Templates'
        },
        {
            id: 'DOC-004',
            name: 'Evidence Photos - Case 2024.zip',
            type: 'other',
            size: '12.3 MB',
            uploadedBy: 'Alex Rodriguez',
            uploadedDate: 'Oct 9, 2025',
            case: 'Employment Dispute #2024',
            category: 'Evidence'
        },
        {
            id: 'DOC-005',
            name: 'Property Deed Scan.pdf',
            type: 'pdf',
            size: '1.8 MB',
            uploadedBy: 'Sarah Wilson',
            uploadedDate: 'Oct 8, 2025',
            case: 'Property Dispute',
            category: 'Real Estate'
        },
        {
            id: 'DOC-006',
            name: 'Patent Application.pdf',
            type: 'pdf',
            size: '3.2 MB',
            uploadedBy: 'Mike Chen',
            uploadedDate: 'Oct 7, 2025',
            case: 'Patent Infringement',
            category: 'IP'
        },
        {
            id: 'DOC-007',
            name: 'Court Filing Receipt.jpg',
            type: 'image',
            size: '890 KB',
            uploadedBy: 'Emily Davis',
            uploadedDate: 'Oct 6, 2025',
            category: 'Court Filings'
        },
        {
            id: 'DOC-008',
            name: 'Legal Research Notes.pdf',
            type: 'pdf',
            size: '645 KB',
            uploadedBy: 'Alex Rodriguez',
            uploadedDate: 'Oct 5, 2025',
            category: 'Research'
        }
    ]

    const getFileIcon = (type: string) => {
        switch (type) {
            case 'pdf':
                return <FileText className="w-5 h-5 text-red-500" />
            case 'doc':
                return <File className="w-5 h-5 text-blue-500" />
            case 'image':
                return <Image className="w-5 h-5 text-green-500" />
            default:
                return <FileArchive className="w-5 h-5 text-gray-500" />
        }
    }

    const filteredDocuments = documents.filter(doc => {
        const matchesSearch = doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            doc.case?.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesFilter = filterCategory === 'all' || doc.category === filterCategory
        return matchesSearch && matchesFilter
    })

    const categories = ['all', ...Array.from(new Set(documents.map(d => d.category)))]

    const stats = [
        { label: 'Total Documents', value: documents.length, color: 'text-blue-600' },
        { label: 'This Month', value: documents.filter(d => d.uploadedDate.includes('Oct')).length, color: 'text-green-600' },
        { label: 'Total Size', value: '26.4 GB', color: 'text-purple-600' },
        { label: 'Categories', value: categories.length - 1, color: 'text-orange-600' }
    ]

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-[1800px] mx-auto space-y-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Documents</h1>
                        <p className="text-gray-600 mt-1">Manage and organize your legal documents</p>
                    </div>
                    <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
                        <Plus className="w-4 h-4" />
                        Upload Document
                    </button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {stats.map((stat, index) => (
                        <div key={index} className="bg-white rounded-xl border border-gray-200 p-6">
                            <p className="text-sm font-medium text-gray-600 mb-2">{stat.label}</p>
                            <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
                        </div>
                    ))}
                </div>

                {/* Search and Filter */}
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1 relative">
                            <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search documents by name or case..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                        <select
                            value={filterCategory}
                            onChange={(e) => setFilterCategory(e.target.value)}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            {categories.map((cat) => (
                                <option key={cat} value={cat}>
                                    {cat === 'all' ? 'All Categories' : cat}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Documents List */}
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        Document
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        Category
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        Case
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        Size
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        Uploaded By
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        Date
                                    </th>
                                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {filteredDocuments.map((doc) => (
                                    <tr key={doc.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                {getFileIcon(doc.type)}
                                                <div>
                                                    <div className="font-medium text-gray-900">{doc.name}</div>
                                                    <div className="text-xs text-gray-500">{doc.id}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
                                                {doc.category}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-gray-700">{doc.case || '-'}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-gray-700">{doc.size}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <User className="w-4 h-4 text-gray-400" />
                                                <span className="text-gray-700">{doc.uploadedBy}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <Calendar className="w-4 h-4 text-gray-400" />
                                                <span className="text-gray-700">{doc.uploadedDate}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="View">
                                                    <Eye className="w-4 h-4 text-gray-500" />
                                                </button>
                                                <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="Download">
                                                    <Download className="w-4 h-4 text-gray-500" />
                                                </button>
                                                <button className="p-2 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
                                                    <Trash2 className="w-4 h-4 text-red-500" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {filteredDocuments.length === 0 && (
                    <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                        <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">No documents found</h3>
                        <p className="text-gray-600">Try adjusting your search or filter criteria</p>
                    </div>
                )}
            </div>
        </div>
    )
}

