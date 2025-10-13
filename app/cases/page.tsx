'use client'

import { useState, useEffect } from 'react'
import {
    Plus,
    Search,
    Clock,
    User,
    FileText,
    CheckCircle,
    AlertCircle,
    TrendingUp,
    DollarSign,
    Sparkles,
    AlertTriangle,
    Briefcase,
    Calendar,
    MoreVertical,
    Eye,
    Edit,
    Trash2,
    Filter as FilterIcon,
    Gavel
} from 'lucide-react'
import PageHeader from '@/components/ui/PageHeader'
import Button from '@/components/ui/Button'
import SearchBar from '@/components/ui/SearchBar'
import Badge from '@/components/ui/Badge'
import StatCard from '@/components/ui/StatCard'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table'
import Tabs from '@/components/ui/Tabs'
import EmptyState from '@/components/ui/EmptyState'
import Modal from '@/components/ui/Modal'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Card from '@/components/ui/Card'

type CaseStatus = 'ACTIVE' | 'PENDING' | 'REVIEW' | 'CLOSED' | 'URGENT'
type CasePriority = 'HIGH' | 'MEDIUM' | 'LOW'

interface Case {
    id: string
    title: string
    description?: string
    clientName?: string
    caseType?: string
    status: CaseStatus
    priority: CasePriority
    caseValue?: number
    assignedTo?: string
    nextHearing?: string
    lastUpdated: string
    createdAt: string
    _count?: {
        documents: number
        chatSessions: number
    }
}

interface CaseStats {
    total: number
    totalValue: number
    byStatus: Record<string, number>
}

export default function CasesPage() {
    const [cases, setCases] = useState<Case[]>([])
    const [stats, setStats] = useState<CaseStats>({
        total: 0,
        totalValue: 0,
        byStatus: {}
    })
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [filterStatus, setFilterStatus] = useState<string>('all')
    const [filterType, setFilterType] = useState<string>('all')
    const [sortBy, setSortBy] = useState<string>('recent')
    const [quickFilter, setQuickFilter] = useState<string>('')
    const [activeTab, setActiveTab] = useState<string>('all')
    const [showNewCaseModal, setShowNewCaseModal] = useState(false)
    const [selectedCase, setSelectedCase] = useState<Case | null>(null)
    const [showActionMenu, setShowActionMenu] = useState<string | null>(null)

    const caseTypes = [
        'Employment Law',
        'Civil Litigation',
        'Corporate Law',
        'Real Estate Law',
        'Intellectual Property',
        'Family Law',
        'Criminal Defense',
        'Tax Law',
        'Immigration Law'
    ]

    useEffect(() => {
        fetchCases()
    }, [searchQuery, filterStatus, filterType, sortBy, quickFilter, activeTab])

    const fetchCases = async () => {
        try {
            setLoading(true)
            const params = new URLSearchParams()
            if (searchQuery) params.append('search', searchQuery)
            if (filterStatus !== 'all') params.append('status', filterStatus)
            if (filterType !== 'all') params.append('type', filterType)
            if (sortBy) params.append('sortBy', sortBy)
            if (quickFilter) params.append('quickFilter', quickFilter)
            if (activeTab) params.append('tab', activeTab)

            const response = await fetch(`/api/cases?${params.toString()}`)
            if (response.ok) {
                const data = await response.json()
                setCases(data.cases)
                setStats(data.stats)
            }
        } catch (error) {
            console.error('Error fetching cases:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleDeleteCase = async (caseId: string) => {
        if (!confirm('Are you sure you want to delete this case?')) return

        try {
            const response = await fetch(`/api/cases?id=${caseId}`, {
                method: 'DELETE'
            })

            if (response.ok) {
                fetchCases()
            }
        } catch (error) {
            console.error('Error deleting case:', error)
        }
    }

    const getStatusBadge = (status: CaseStatus) => {
        const variants: Record<CaseStatus, 'success' | 'warning' | 'info' | 'default' | 'danger'> = {
            ACTIVE: 'success',
            PENDING: 'warning',
            REVIEW: 'info',
            CLOSED: 'default',
            URGENT: 'danger'
        }
        const icons: Record<CaseStatus, any> = {
            ACTIVE: TrendingUp,
            PENDING: Clock,
            REVIEW: Eye,
            CLOSED: CheckCircle,
            URGENT: AlertCircle
        }
        return { variant: variants[status], icon: icons[status] }
    }

    const formatCurrency = (value?: number) => {
        if (!value) return '-'
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(value)
    }

    const formatDate = (dateString?: string) => {
        if (!dateString) return '-'
        const date = new Date(dateString)
        return new Intl.DateTimeFormat('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        }).format(date)
    }

    const quickFilters = [
        { id: 'urgent', label: 'Urgent', icon: AlertTriangle, color: 'text-red-600 bg-red-50' },
        { id: 'thisWeek', label: 'This Week', icon: Calendar, color: 'text-blue-600 bg-blue-50' },
        { id: 'highValue', label: 'High Value', icon: DollarSign, color: 'text-green-600 bg-green-50' },
        { id: 'employment', label: 'Employment', icon: Briefcase, color: 'text-purple-600 bg-purple-50' }
    ]

    const tabs = [
        { id: 'all', label: 'All Cases', count: stats.total },
        { id: 'active', label: 'Active', count: stats.byStatus.active || 0 },
        { id: 'pending', label: 'Pending', count: stats.byStatus.pending || 0 },
        { id: 'review', label: 'Review', count: stats.byStatus.review || 0 }
    ]

    return (
        <div className="legal-page">
            <PageHeader
                title="Case Management"
                description="Manage and track all your legal cases"
                icon={Gavel}
                badge={{ text: `${stats.total} Total Cases`, variant: 'blue' }}
                actions={
                    <>
                        <Button variant="secondary" size="md">
                            Export
                        </Button>
                        <Button
                            variant="primary"
                            icon={Plus}
                            onClick={() => setShowNewCaseModal(true)}
                        >
                            New Case
                        </Button>
                    </>
                }
            />

            <div className="p-6">
                <div className="legal-container space-y-6">
                    {/* Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <StatCard
                            label="Total Cases"
                            value={stats.total}
                            icon={Briefcase}
                            iconColor="text-slate-600"
                            iconBgColor="bg-slate-100"
                        />
                        <StatCard
                            label="Total Value"
                            value={formatCurrency(stats.totalValue)}
                            icon={DollarSign}
                            iconColor="text-emerald-600"
                            iconBgColor="bg-emerald-100"
                        />
                        <StatCard
                            label="Active Cases"
                            value={stats.byStatus.active || 0}
                            icon={TrendingUp}
                            iconColor="text-blue-600"
                            iconBgColor="bg-blue-100"
                        />
                        <StatCard
                            label="Urgent Cases"
                            value={stats.byStatus.urgent || 0}
                            icon={AlertCircle}
                            iconColor="text-red-600"
                            iconBgColor="bg-red-100"
                        />
                    </div>

                    {/* AI-Powered Search */}
                    <Card className="bg-gradient-to-br from-slate-50 to-white">
                        <div className="flex items-center gap-2 mb-4">
                            <Sparkles className="w-5 h-5 text-slate-600" />
                            <h2 className="text-lg font-semibold text-slate-900">AI-Powered Search</h2>
                            <Badge variant="info" size="sm">Smart Search</Badge>
                        </div>
                        <p className="text-sm text-slate-600 mb-4">
                            Search cases using natural language and smart filters
                        </p>

                        <div className="relative mb-4">
                            <SearchBar
                                placeholder="Search cases: 'high priority employment' or 'pending hearings'"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>

                        {/* Quick Filters */}
                        <div className="mb-4">
                            <p className="text-xs font-medium text-slate-600 mb-2">Quick Filters:</p>
                            <div className="flex flex-wrap gap-2">
                                {quickFilters.map((filter) => {
                                    const Icon = filter.icon
                                    const isActive = quickFilter === filter.id
                                    return (
                                        <button
                                            key={filter.id}
                                            onClick={() => setQuickFilter(isActive ? '' : filter.id)}
                                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${isActive
                                                ? `${filter.color} ring-2 ring-offset-1 ring-slate-900`
                                                : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
                                                }`}
                                        >
                                            <Icon className="w-4 h-4" />
                                            {filter.label}
                                        </button>
                                    )
                                })}
                            </div>
                        </div>

                        {/* Advanced Filters */}
                        <div className="flex flex-wrap gap-3">
                            <div className="flex items-center gap-2">
                                <FilterIcon className="w-4 h-4 text-slate-500" />
                                <span className="text-sm font-medium text-slate-600">Status</span>
                                <select
                                    value={filterStatus}
                                    onChange={(e) => setFilterStatus(e.target.value)}
                                    className="legal-select text-sm"
                                >
                                    <option value="all">All Cases</option>
                                    <option value="active">Active</option>
                                    <option value="pending">Pending</option>
                                    <option value="review">Review</option>
                                    <option value="urgent">Urgent</option>
                                    <option value="closed">Closed</option>
                                </select>
                            </div>

                            <div className="flex items-center gap-2">
                                <FileText className="w-4 h-4 text-slate-500" />
                                <span className="text-sm font-medium text-slate-600">Type</span>
                                <select
                                    value={filterType}
                                    onChange={(e) => setFilterType(e.target.value)}
                                    className="legal-select text-sm"
                                >
                                    <option value="all">All Types</option>
                                    {caseTypes.map(type => (
                                        <option key={type} value={type}>{type}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex items-center gap-2">
                                <TrendingUp className="w-4 h-4 text-slate-500" />
                                <span className="text-sm font-medium text-slate-600">Sort By</span>
                                <select
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value)}
                                    className="legal-select text-sm"
                                >
                                    <option value="recent">Most Relevant</option>
                                    <option value="priority">Priority</option>
                                    <option value="value">Case Value</option>
                                    <option value="hearing">Next Hearing</option>
                                </select>
                            </div>
                        </div>
                    </Card>

                    {/* Cases Table */}
                    <Card padding="none">
                        <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

                        {loading ? (
                            <div className="p-12 text-center">
                                <div className="legal-spinner mx-auto"></div>
                                <p className="mt-4 text-slate-600">Loading cases...</p>
                            </div>
                        ) : cases.length === 0 ? (
                            <EmptyState
                                icon={FileText}
                                title="No cases found"
                                description="Try adjusting your search or filter criteria, or create your first case"
                                action={{
                                    label: 'Create Your First Case',
                                    onClick: () => setShowNewCaseModal(true),
                                    icon: Plus
                                }}
                            />
                        ) : (
                            <Table>
                                <TableHeader>
                                    <tr>
                                        <TableHead>Case Details</TableHead>
                                        <TableHead>Client</TableHead>
                                        <TableHead>Type</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Value</TableHead>
                                        <TableHead>Next Hearing</TableHead>
                                        <TableHead>Assigned To</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </tr>
                                </TableHeader>
                                <TableBody>
                                    {cases.map((caseItem) => {
                                        const statusBadge = getStatusBadge(caseItem.status)
                                        return (
                                            <TableRow key={caseItem.id}>
                                                <TableCell>
                                                    <div>
                                                        <div className="font-semibold text-slate-900">{caseItem.title}</div>
                                                        <div className="text-xs text-slate-500 mt-1">
                                                            {caseItem._count && (
                                                                <>
                                                                    <span>{caseItem._count.documents} docs</span>
                                                                    <span className="mx-1">•</span>
                                                                    <span>{caseItem._count.chatSessions} chats</span>
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <User className="w-4 h-4 text-slate-400" />
                                                        <span className="text-slate-900">{caseItem.clientName || '-'}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <span className="text-slate-700">{caseItem.caseType || '-'}</span>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant={statusBadge.variant} icon={statusBadge.icon}>
                                                        {caseItem.status.charAt(0) + caseItem.status.slice(1).toLowerCase()}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-1">
                                                        <DollarSign className="w-4 h-4 text-slate-400" />
                                                        <span className="text-slate-700 font-medium">
                                                            {formatCurrency(caseItem.caseValue)}
                                                        </span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <Calendar className="w-4 h-4 text-slate-400" />
                                                        <span className="text-slate-700">{formatDate(caseItem.nextHearing)}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <span className="text-slate-700">{caseItem.assignedTo || '-'}</span>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="relative inline-block">
                                                        <button
                                                            onClick={() => setShowActionMenu(showActionMenu === caseItem.id ? null : caseItem.id)}
                                                            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                                                        >
                                                            <MoreVertical className="w-4 h-4 text-slate-500" />
                                                        </button>

                                                        {showActionMenu === caseItem.id && (
                                                            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-slate-200 z-10">
                                                                <button
                                                                    onClick={() => {
                                                                        setSelectedCase(caseItem)
                                                                        setShowActionMenu(null)
                                                                    }}
                                                                    className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2 rounded-t-lg"
                                                                >
                                                                    <Eye className="w-4 h-4" />
                                                                    View Details
                                                                </button>
                                                                <button
                                                                    onClick={() => {
                                                                        setSelectedCase(caseItem)
                                                                        setShowNewCaseModal(true)
                                                                        setShowActionMenu(null)
                                                                    }}
                                                                    className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                                                                >
                                                                    <Edit className="w-4 h-4" />
                                                                    Edit Case
                                                                </button>
                                                                <button
                                                                    onClick={() => {
                                                                        handleDeleteCase(caseItem.id)
                                                                        setShowActionMenu(null)
                                                                    }}
                                                                    className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 rounded-b-lg"
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
                                                                    Delete Case
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        )
                                    })}
                                </TableBody>
                            </Table>
                        )}
                    </Card>
                </div>
            </div>

            {/* New Case Modal */}
            {showNewCaseModal && (
                <NewCaseModal
                    isOpen={showNewCaseModal}
                    onClose={() => {
                        setShowNewCaseModal(false)
                        setSelectedCase(null)
                    }}
                    onSuccess={fetchCases}
                    editCase={selectedCase}
                    caseTypes={caseTypes}
                />
            )}
        </div>
    )
}

// New Case Modal Component
function NewCaseModal({
    isOpen,
    onClose,
    onSuccess,
    editCase,
    caseTypes
}: {
    isOpen: boolean
    onClose: () => void
    onSuccess: () => void
    editCase: Case | null
    caseTypes: string[]
}) {
    const [formData, setFormData] = useState({
        title: editCase?.title || '',
        description: editCase?.description || '',
        clientName: editCase?.clientName || '',
        caseType: editCase?.caseType || '',
        status: editCase?.status || 'ACTIVE',
        priority: editCase?.priority || 'MEDIUM',
        caseValue: editCase?.caseValue?.toString() || '',
        assignedTo: editCase?.assignedTo || '',
        nextHearing: ''
    })
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const url = editCase ? '/api/cases' : '/api/cases/create'
            const method = editCase ? 'PUT' : 'POST'
            const body = editCase ? { id: editCase.id, ...formData } : formData

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            })

            if (response.ok) {
                onSuccess()
                onClose()
            } else {
                alert('Error saving case')
            }
        } catch (error) {
            console.error('Error:', error)
            alert('Error saving case')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={editCase ? 'Edit Case' : 'Create New Case'}
            description="Fill in the case details below"
            size="lg"
            footer={
                <>
                    <Button variant="outline" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button
                        variant="primary"
                        onClick={handleSubmit as any}
                        loading={loading}
                    >
                        {editCase ? 'Update Case' : 'Create Case'}
                    </Button>
                </>
            }
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                        <Input
                            label="Case Title *"
                            required
                            fullWidth
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            placeholder="e.g., Smith vs. Johnson - Contract Dispute"
                        />
                    </div>

                    <div className="col-span-2">
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">
                            Description
                        </label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            rows={3}
                            className="legal-input w-full"
                            placeholder="Brief description of the case..."
                        />
                    </div>

                    <Input
                        label="Client Name"
                        fullWidth
                        value={formData.clientName}
                        onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                        placeholder="John Doe"
                        icon={User}
                    />

                    <Select
                        label="Case Type"
                        fullWidth
                        value={formData.caseType}
                        onChange={(e) => setFormData({ ...formData, caseType: e.target.value })}
                    >
                        <option value="">Select type...</option>
                        {caseTypes.map(type => (
                            <option key={type} value={type}>{type}</option>
                        ))}
                    </Select>

                    <Select
                        label="Status"
                        fullWidth
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value as CaseStatus })}
                    >
                        <option value="ACTIVE">Active</option>
                        <option value="PENDING">Pending</option>
                        <option value="REVIEW">Review</option>
                        <option value="URGENT">Urgent</option>
                        <option value="CLOSED">Closed</option>
                    </Select>

                    <Select
                        label="Priority"
                        fullWidth
                        value={formData.priority}
                        onChange={(e) => setFormData({ ...formData, priority: e.target.value as CasePriority })}
                    >
                        <option value="LOW">Low</option>
                        <option value="MEDIUM">Medium</option>
                        <option value="HIGH">High</option>
                    </Select>

                    <Input
                        label="Case Value"
                        type="number"
                        fullWidth
                        value={formData.caseValue}
                        onChange={(e) => setFormData({ ...formData, caseValue: e.target.value })}
                        placeholder="150000"
                        icon={DollarSign}
                    />

                    <Input
                        label="Assigned To"
                        fullWidth
                        value={formData.assignedTo}
                        onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                        placeholder="Attorney Name"
                    />

                    <Input
                        label="Next Hearing Date"
                        type="date"
                        fullWidth
                        value={formData.nextHearing}
                        onChange={(e) => setFormData({ ...formData, nextHearing: e.target.value })}
                        icon={Calendar}
                    />
                </div>
            </form>
        </Modal>
    )
}
