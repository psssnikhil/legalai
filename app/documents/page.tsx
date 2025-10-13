'use client'

import { useState, useEffect } from 'react'
import { Plus, Download, Eye, Trash2, FileText, File, Image, FileArchive, Calendar, User, FolderOpen, Upload, X, AlertCircle, Briefcase, Users } from 'lucide-react'
import PageHeader from '@/components/ui/PageHeader'
import Button from '@/components/ui/Button'
import SearchBar from '@/components/ui/SearchBar'
import Badge from '@/components/ui/Badge'
import StatCard from '@/components/ui/StatCard'
import Card from '@/components/ui/Card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table'
import Select from '@/components/ui/Select'
import EmptyState from '@/components/ui/EmptyState'
import Modal from '@/components/ui/Modal'

interface Document {
    id: string
    filename: string
    originalName: string
    mimeType: string
    size: number
    content?: string
    analysis?: string
    createdAt: string
    user?: {
        id: string
        name: string | null
        email: string
    }
    case?: {
        id: string
        title: string
        caseType: string | null
    }
    client?: {
        id: string
        name: string
        email: string
    }
}

interface DocumentStats {
    total: number
    totalSize: number
    thisMonth: number
    byType: Record<string, number>
}

export default function DocumentsPage() {
    const [documents, setDocuments] = useState<Document[]>([])
    const [stats, setStats] = useState<DocumentStats>({
        total: 0,
        totalSize: 0,
        thisMonth: 0,
        byType: {}
    })
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [sortBy, setSortBy] = useState<string>('date')
    const [filterType, setFilterType] = useState<string>('all')
    const [showUploadModal, setShowUploadModal] = useState(false)
    const [uploading, setUploading] = useState(false)
    const [uploadFiles, setUploadFiles] = useState<File[]>([])
    const [uploadCaseId, setUploadCaseId] = useState<string>('')
    const [uploadClientId, setUploadClientId] = useState<string>('')
    const [cases, setCases] = useState<Array<{ id: string; title: string }>>([])
    const [clients, setClients] = useState<Array<{ id: string; name: string }>>([])
    const [deleteModal, setDeleteModal] = useState<{ show: boolean; documentId: string | null }>({
        show: false,
        documentId: null
    })

    useEffect(() => {
        fetchDocuments()
        fetchCasesAndClients()
    }, [searchQuery, sortBy, filterType])

    const fetchCasesAndClients = async () => {
        try {
            // Fetch cases
            const casesResponse = await fetch('/api/cases')
            if (casesResponse.ok) {
                const casesData = await casesResponse.json()
                setCases(casesData.cases || [])
            }

            // Fetch clients
            const clientsResponse = await fetch('/api/clients')
            if (clientsResponse.ok) {
                const clientsData = await clientsResponse.json()
                setClients(clientsData.clients || [])
            }
        } catch (error) {
            console.error('Error fetching cases and clients:', error)
        }
    }

    const fetchDocuments = async () => {
        try {
            setLoading(true)
            const params = new URLSearchParams()
            if (searchQuery) params.append('search', searchQuery)
            if (sortBy) params.append('sortBy', sortBy)

            const response = await fetch(`/api/documents?${params.toString()}`)
            const data = await response.json()

            if (response.ok) {
                setDocuments(data.documents)
                setStats(data.stats)
            } else {
                console.error('Failed to fetch documents:', data.message)
            }
        } catch (error) {
            console.error('Error fetching documents:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setUploadFiles(Array.from(e.target.files))
        }
    }

    const handleUpload = async () => {
        if (uploadFiles.length === 0) return

        try {
            setUploading(true)
            const formData = new FormData()
            uploadFiles.forEach(file => {
                formData.append('files', file)
            })

            // Add optional case and client IDs
            if (uploadCaseId) {
                formData.append('caseId', uploadCaseId)
            }
            if (uploadClientId) {
                formData.append('clientId', uploadClientId)
            }

            const response = await fetch('/api/documents/upload', {
                method: 'POST',
                body: formData
            })

            const data = await response.json()

            if (response.ok) {
                setShowUploadModal(false)
                setUploadFiles([])
                setUploadCaseId('')
                setUploadClientId('')
                fetchDocuments() // Refresh the list
            } else {
                console.error('Upload failed:', data.message)
                alert('Upload failed: ' + data.message)
            }
        } catch (error) {
            console.error('Error uploading files:', error)
            alert('Error uploading files. Please try again.')
        } finally {
            setUploading(false)
        }
    }

    const handleDelete = async () => {
        if (!deleteModal.documentId) return

        try {
            const response = await fetch(`/api/documents?id=${deleteModal.documentId}`, {
                method: 'DELETE'
            })

            const data = await response.json()

            if (response.ok) {
                setDeleteModal({ show: false, documentId: null })
                fetchDocuments() // Refresh the list
            } else {
                console.error('Delete failed:', data.message)
                alert('Delete failed: ' + data.message)
            }
        } catch (error) {
            console.error('Error deleting document:', error)
            alert('Error deleting document. Please try again.')
        }
    }

    const getFileIcon = (mimeType: string, filename: string) => {
        const ext = filename.split('.').pop()?.toLowerCase()

        if (mimeType.includes('pdf') || ext === 'pdf') {
            return <FileText className="w-5 h-5 text-red-500" />
        } else if (mimeType.includes('word') || ext === 'doc' || ext === 'docx') {
            return <File className="w-5 h-5 text-blue-500" />
        } else if (mimeType.includes('image') || ['jpg', 'jpeg', 'png', 'gif', 'svg'].includes(ext || '')) {
            return <Image className="w-5 h-5 text-green-500" />
        } else if (mimeType.includes('zip') || mimeType.includes('compressed') || ext === 'zip' || ext === 'rar') {
            return <FileArchive className="w-5 h-5 text-purple-500" />
        } else {
            return <FileText className="w-5 h-5 text-slate-500" />
        }
    }

    const getFileType = (mimeType: string, filename: string): string => {
        const ext = filename.split('.').pop()?.toLowerCase()

        if (mimeType.includes('pdf') || ext === 'pdf') return 'PDF'
        if (mimeType.includes('word') || ext === 'doc' || ext === 'docx') return 'Word'
        if (mimeType.includes('image')) return 'Image'
        if (mimeType.includes('zip') || mimeType.includes('compressed')) return 'Archive'
        return ext?.toUpperCase() || 'File'
    }

    const formatFileSize = (bytes: number): string => {
        if (bytes === 0) return '0 Bytes'
        const k = 1024
        const sizes = ['Bytes', 'KB', 'MB', 'GB']
        const i = Math.floor(Math.log(bytes) / Math.log(k))
        return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
    }

    const formatTotalSize = (bytes: number): string => {
        if (bytes === 0) return '0 GB'
        const gb = bytes / (1024 * 1024 * 1024)
        if (gb < 1) {
            const mb = bytes / (1024 * 1024)
            return mb.toFixed(1) + ' MB'
        }
        return gb.toFixed(2) + ' GB'
    }

    const formatDate = (dateString: string): string => {
        const date = new Date(dateString)
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        })
    }

    const removeUploadFile = (index: number) => {
        setUploadFiles(prev => prev.filter((_, i) => i !== index))
    }

    const getFilteredDocuments = () => {
        if (filterType === 'all') return documents
        if (filterType === 'case') return documents.filter(d => d.case)
        if (filterType === 'client') return documents.filter(d => d.client)
        if (filterType === 'unlinked') return documents.filter(d => !d.case && !d.client)

        // Filter by file type
        return documents.filter(d => {
            const ext = d.originalName.split('.').pop()?.toLowerCase()
            if (filterType === 'pdf') return d.mimeType.includes('pdf') || ext === 'pdf'
            if (filterType === 'word') return d.mimeType.includes('word') || ext === 'doc' || ext === 'docx'
            if (filterType === 'image') return d.mimeType.includes('image')
            return false
        })
    }

    const filteredDocuments = getFilteredDocuments()

    const statCards = [
        {
            label: 'Total Documents',
            value: stats.total,
            icon: FileText,
            iconColor: 'text-slate-600',
            iconBgColor: 'bg-slate-100'
        },
        {
            label: 'This Month',
            value: stats.thisMonth,
            icon: Calendar,
            iconColor: 'text-emerald-600',
            iconBgColor: 'bg-emerald-100',
            trend: stats.thisMonth > 0 ? { value: `+${stats.thisMonth} documents`, isPositive: true } : undefined
        },
        {
            label: 'Total Size',
            value: formatTotalSize(stats.totalSize),
            icon: FolderOpen,
            iconColor: 'text-blue-600',
            iconBgColor: 'bg-blue-100'
        },
        {
            label: 'File Types',
            value: Object.keys(stats.byType).length,
            icon: File,
            iconColor: 'text-purple-600',
            iconBgColor: 'bg-purple-100'
        }
    ]

    return (
        <div className="legal-page">
            <PageHeader
                title="Documents"
                description="Manage and organize your legal documents"
                icon={FileText}
                badge={{ text: `${stats.total} Documents`, variant: 'slate' }}
                actions={
                    <>
                        <Button variant="outline" size="md">
                            Export
                        </Button>
                        <Button
                            variant="primary"
                            icon={Plus}
                            onClick={() => setShowUploadModal(true)}
                        >
                            Upload Document
                        </Button>
                    </>
                }
            />

            <div className="p-6">
                <div className="legal-container space-y-6">
                    {/* Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {statCards.map((stat, index) => (
                            <StatCard key={index} {...stat} />
                        ))}
                    </div>

                    {/* Search, Filter and Sort */}
                    <Card>
                        <div className="space-y-4">
                            <div className="flex flex-col md:flex-row gap-4">
                                <div className="flex-1">
                                    <SearchBar
                                        placeholder="Search documents by name, case, or client..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </div>
                                <Select
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value)}
                                    className="md:w-48"
                                >
                                    <option value="date">Sort by Date</option>
                                    <option value="name">Sort by Name</option>
                                    <option value="size">Sort by Size</option>
                                </Select>
                            </div>

                            {/* Quick Filters */}
                            <div className="flex flex-wrap gap-2">
                                <button
                                    onClick={() => setFilterType('all')}
                                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${filterType === 'all'
                                            ? 'bg-indigo-100 text-indigo-700'
                                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                        }`}
                                >
                                    All
                                </button>
                                <button
                                    onClick={() => setFilterType('case')}
                                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${filterType === 'case'
                                            ? 'bg-indigo-100 text-indigo-700'
                                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                        }`}
                                >
                                    <Briefcase className="w-3.5 h-3.5 inline mr-1.5" />
                                    Linked to Cases
                                </button>
                                <button
                                    onClick={() => setFilterType('client')}
                                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${filterType === 'client'
                                            ? 'bg-indigo-100 text-indigo-700'
                                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                        }`}
                                >
                                    <Users className="w-3.5 h-3.5 inline mr-1.5" />
                                    Linked to Clients
                                </button>
                                <button
                                    onClick={() => setFilterType('unlinked')}
                                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${filterType === 'unlinked'
                                            ? 'bg-indigo-100 text-indigo-700'
                                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                        }`}
                                >
                                    Unlinked
                                </button>
                                <div className="w-px bg-slate-200 mx-1"></div>
                                <button
                                    onClick={() => setFilterType('pdf')}
                                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${filterType === 'pdf'
                                            ? 'bg-red-100 text-red-700'
                                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                        }`}
                                >
                                    PDF
                                </button>
                                <button
                                    onClick={() => setFilterType('word')}
                                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${filterType === 'word'
                                            ? 'bg-blue-100 text-blue-700'
                                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                        }`}
                                >
                                    Word
                                </button>
                                <button
                                    onClick={() => setFilterType('image')}
                                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${filterType === 'image'
                                            ? 'bg-green-100 text-green-700'
                                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                        }`}
                                >
                                    Images
                                </button>
                            </div>
                        </div>
                    </Card>

                    {/* Results Count */}
                    {!loading && (searchQuery || filterType !== 'all') && (
                        <div className="flex items-center justify-between text-sm text-slate-600">
                            <span>
                                Showing <span className="font-medium text-slate-900">{filteredDocuments.length}</span> of <span className="font-medium text-slate-900">{documents.length}</span> documents
                            </span>
                            {(searchQuery || filterType !== 'all') && (
                                <button
                                    onClick={() => {
                                        setSearchQuery('')
                                        setFilterType('all')
                                    }}
                                    className="text-indigo-600 hover:text-indigo-700 font-medium"
                                >
                                    Clear filters
                                </button>
                            )}
                        </div>
                    )}

                    {/* Documents Table */}
                    <Card padding="none">
                        {loading ? (
                            <div className="p-12 text-center">
                                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-slate-300 border-r-transparent"></div>
                                <p className="mt-4 text-slate-600">Loading documents...</p>
                            </div>
                        ) : filteredDocuments.length === 0 ? (
                            <EmptyState
                                icon={FileText}
                                title="No documents found"
                                description={searchQuery || filterType !== 'all' ? "Try adjusting your search or filter criteria" : "Upload your first document to get started"}
                                action={{
                                    label: 'Upload Document',
                                    onClick: () => setShowUploadModal(true),
                                    icon: Plus
                                }}
                            />
                        ) : (
                            <Table>
                                <TableHeader>
                                    <tr>
                                        <TableHead>Document</TableHead>
                                        <TableHead>Type</TableHead>
                                        <TableHead>Related To</TableHead>
                                        <TableHead>Size</TableHead>
                                        <TableHead>Uploaded By</TableHead>
                                        <TableHead>Date</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </tr>
                                </TableHeader>
                                <TableBody>
                                    {filteredDocuments.map((doc) => (
                                        <TableRow key={doc.id}>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-slate-50 rounded-lg">
                                                        {getFileIcon(doc.mimeType, doc.originalName)}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <div className="font-medium text-slate-900 truncate max-w-xs" title={doc.originalName}>
                                                            {doc.originalName}
                                                        </div>
                                                        <div className="text-xs text-slate-500">{doc.id.slice(0, 8)}</div>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="info" size="sm">
                                                    {getFileType(doc.mimeType, doc.originalName)}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="space-y-1">
                                                    {doc.case && (
                                                        <div className="flex items-center gap-2 text-sm">
                                                            <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                                                            <span className="text-slate-700 truncate max-w-xs" title={doc.case.title}>
                                                                {doc.case.title}
                                                            </span>
                                                        </div>
                                                    )}
                                                    {doc.client && (
                                                        <div className="flex items-center gap-2 text-sm">
                                                            <Users className="w-3.5 h-3.5 text-slate-400" />
                                                            <span className="text-slate-700 truncate max-w-xs" title={doc.client.name}>
                                                                {doc.client.name}
                                                            </span>
                                                        </div>
                                                    )}
                                                    {!doc.case && !doc.client && (
                                                        <span className="text-slate-400 text-sm">-</span>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <span className="text-slate-700 font-medium">
                                                    {formatFileSize(doc.size)}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <div className="w-7 h-7 bg-slate-100 rounded-full flex items-center justify-center">
                                                        <User className="w-4 h-4 text-slate-600" />
                                                    </div>
                                                    <span className="text-slate-700">
                                                        {doc.user?.name || doc.user?.email || 'Unknown'}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="w-4 h-4 text-slate-400" />
                                                    <span className="text-slate-700">{formatDate(doc.createdAt)}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                                                        title="View"
                                                        onClick={() => {
                                                            // TODO: Implement document viewer
                                                            alert('Document viewer coming soon!')
                                                        }}
                                                    >
                                                        <Eye className="w-4 h-4 text-slate-500" />
                                                    </button>
                                                    <button
                                                        className="p-2 hover:bg-emerald-50 rounded-lg transition-colors"
                                                        title="Download"
                                                        onClick={() => {
                                                            // TODO: Implement download from S3
                                                            alert('Download functionality coming soon!')
                                                        }}
                                                    >
                                                        <Download className="w-4 h-4 text-emerald-600" />
                                                    </button>
                                                    <button
                                                        className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                                                        title="Delete"
                                                        onClick={() => setDeleteModal({ show: true, documentId: doc.id })}
                                                    >
                                                        <Trash2 className="w-4 h-4 text-red-500" />
                                                    </button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </Card>
                </div>
            </div>

            {/* Upload Modal */}
            <Modal
                isOpen={showUploadModal}
                onClose={() => {
                    if (!uploading) {
                        setShowUploadModal(false)
                        setUploadFiles([])
                        setUploadCaseId('')
                        setUploadClientId('')
                    }
                }}
                title="Upload Documents"
                size="lg"
            >
                <div className="space-y-6">
                    {/* Link to Case or Client (Optional) */}
                    <div className="space-y-3">
                        <h4 className="text-sm font-medium text-slate-700">
                            Link to Case or Client (Optional)
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs text-slate-600 mb-1">Case</label>
                                <Select
                                    value={uploadCaseId}
                                    onChange={(e) => {
                                        setUploadCaseId(e.target.value)
                                        if (e.target.value) setUploadClientId('') // Clear client if case is selected
                                    }}
                                    disabled={uploading || !!uploadClientId}
                                >
                                    <option value="">Select a case...</option>
                                    {cases.map((c) => (
                                        <option key={c.id} value={c.id}>
                                            {c.title}
                                        </option>
                                    ))}
                                </Select>
                            </div>
                            <div>
                                <label className="block text-xs text-slate-600 mb-1">Client</label>
                                <Select
                                    value={uploadClientId}
                                    onChange={(e) => {
                                        setUploadClientId(e.target.value)
                                        if (e.target.value) setUploadCaseId('') // Clear case if client is selected
                                    }}
                                    disabled={uploading || !!uploadCaseId}
                                >
                                    <option value="">Select a client...</option>
                                    {clients.map((c) => (
                                        <option key={c.id} value={c.id}>
                                            {c.name}
                                        </option>
                                    ))}
                                </Select>
                            </div>
                        </div>
                        <p className="text-xs text-slate-500">
                            You can link documents to a case or client, or leave them unlinked for general documents.
                        </p>
                    </div>

                    {/* File Input */}
                    <div className="border-2 border-dashed border-slate-200 rounded-lg p-8 text-center hover:border-slate-300 transition-colors">
                        <input
                            type="file"
                            id="file-upload"
                            multiple
                            className="hidden"
                            onChange={handleFileSelect}
                            disabled={uploading}
                        />
                        <label
                            htmlFor="file-upload"
                            className="cursor-pointer flex flex-col items-center gap-2"
                        >
                            <Upload className="w-12 h-12 text-slate-400" />
                            <div>
                                <span className="text-sm font-medium text-slate-700">
                                    Click to upload
                                </span>
                                <span className="text-sm text-slate-500"> or drag and drop</span>
                            </div>
                            <span className="text-xs text-slate-500">
                                PDF, Word, Images, and more (Max 10MB per file)
                            </span>
                        </label>
                    </div>

                    {/* Selected Files */}
                    {uploadFiles.length > 0 && (
                        <div className="space-y-2">
                            <h4 className="text-sm font-medium text-slate-700">
                                Selected Files ({uploadFiles.length})
                            </h4>
                            <div className="space-y-2 max-h-64 overflow-y-auto">
                                {uploadFiles.map((file, index) => (
                                    <div
                                        key={index}
                                        className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                                    >
                                        <div className="flex items-center gap-3 flex-1 min-w-0">
                                            <div className="p-2 bg-white rounded-lg">
                                                {getFileIcon(file.type, file.name)}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="text-sm font-medium text-slate-900 truncate">
                                                    {file.name}
                                                </div>
                                                <div className="text-xs text-slate-500">
                                                    {formatFileSize(file.size)}
                                                </div>
                                            </div>
                                        </div>
                                        {!uploading && (
                                            <button
                                                onClick={() => removeUploadFile(index)}
                                                className="p-1 hover:bg-slate-200 rounded transition-colors"
                                            >
                                                <X className="w-4 h-4 text-slate-500" />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex justify-end gap-3 pt-4 border-t">
                        <Button
                            variant="outline"
                            onClick={() => {
                                setShowUploadModal(false)
                                setUploadFiles([])
                                setUploadCaseId('')
                                setUploadClientId('')
                            }}
                            disabled={uploading}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="primary"
                            onClick={handleUpload}
                            disabled={uploadFiles.length === 0 || uploading}
                        >
                            {uploading ? 'Uploading...' : `Upload ${uploadFiles.length} File${uploadFiles.length !== 1 ? 's' : ''}`}
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={deleteModal.show}
                onClose={() => setDeleteModal({ show: false, documentId: null })}
                title="Delete Document"
                size="sm"
            >
                <div className="space-y-4">
                    <div className="flex items-start gap-3">
                        <div className="p-2 bg-red-50 rounded-lg">
                            <AlertCircle className="w-5 h-5 text-red-600" />
                        </div>
                        <div>
                            <p className="text-sm text-slate-700">
                                Are you sure you want to delete this document? This action cannot be undone.
                            </p>
                        </div>
                    </div>
                    <div className="flex justify-end gap-3 pt-4 border-t">
                        <Button
                            variant="outline"
                            onClick={() => setDeleteModal({ show: false, documentId: null })}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="danger"
                            onClick={handleDelete}
                        >
                            Delete Document
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    )
}
