'use client'

import { useState } from 'react'
import {
    Plus,
    Search,
    Filter,
    MoreVertical,
    Calendar,
    User,
    FileText,
    Clock,
    CheckCircle,
    AlertCircle,
    TrendingUp
} from 'lucide-react'

type CaseStatus = 'active' | 'pending' | 'closed' | 'urgent'

interface Case {
    id: string
    title: string
    client: string
    caseType: string
    status: CaseStatus
    lastUpdated: string
    nextHearing: string
    assignedTo: string
    priority: 'high' | 'medium' | 'low'
}

export default function CasesPage() {
    const [searchQuery, setSearchQuery] = useState('')
    const [filterStatus, setFilterStatus] = useState<string>('all')

    const cases: Case[] = [
        {
            id: 'CASE-2024-001',
            title: 'Smith vs. Johnson - Contract Dispute',
            client: 'John Smith',
            caseType: 'Civil Litigation',
            status: 'active',
            lastUpdated: '2 hours ago',
            nextHearing: 'Oct 15, 2025',
            assignedTo: 'Sarah Wilson',
            priority: 'high'
        },
        {
            id: 'CASE-2024-002',
            title: 'Corporate Merger - ABC Ltd',
            client: 'ABC Corporation',
            caseType: 'Corporate Law',
            status: 'active',
            lastUpdated: '5 hours ago',
            nextHearing: 'Oct 20, 2025',
            assignedTo: 'Mike Chen',
            priority: 'medium'
        },
        {
            id: 'CASE-2024-003',
            title: 'Employment Dispute #2024',
            client: 'Tech Innovations Inc',
            caseType: 'Employment Law',
            status: 'urgent',
            lastUpdated: '1 hour ago',
            nextHearing: 'Oct 14, 2025',
            assignedTo: 'Emily Davis',
            priority: 'high'
        },
        {
            id: 'CASE-2024-004',
            title: 'Property Dispute - Downtown',
            client: 'Real Estate Holdings',
            caseType: 'Real Estate Law',
            status: 'pending',
            lastUpdated: '1 day ago',
            nextHearing: 'Oct 25, 2025',
            assignedTo: 'Alex Rodriguez',
            priority: 'low'
        },
        {
            id: 'CASE-2024-005',
            title: 'Patent Infringement Case',
            client: 'Innovation Labs',
            caseType: 'Intellectual Property',
            status: 'active',
            lastUpdated: '3 hours ago',
            nextHearing: 'Oct 18, 2025',
            assignedTo: 'Sarah Wilson',
            priority: 'high'
        },
        {
            id: 'CASE-2023-089',
            title: 'Divorce Settlement - Miller',
            client: 'Jane Miller',
            caseType: 'Family Law',
            status: 'closed',
            lastUpdated: '1 week ago',
            nextHearing: 'Completed',
            assignedTo: 'Mike Chen',
            priority: 'medium'
        }
    ]

    const getStatusBadge = (status: CaseStatus) => {
        const styles = {
            active: 'bg-green-100 text-green-700',
            pending: 'bg-yellow-100 text-yellow-700',
            closed: 'bg-gray-100 text-gray-700',
            urgent: 'bg-red-100 text-red-700'
        }
        return styles[status]
    }

    const getStatusIcon = (status: CaseStatus) => {
        switch (status) {
            case 'active':
                return <TrendingUp className="w-4 h-4" />
            case 'pending':
                return <Clock className="w-4 h-4" />
            case 'closed':
                return <CheckCircle className="w-4 h-4" />
            case 'urgent':
                return <AlertCircle className="w-4 h-4" />
        }
    }

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'high':
                return 'text-red-600'
            case 'medium':
                return 'text-yellow-600'
            case 'low':
                return 'text-green-600'
            default:
                return 'text-gray-600'
        }
    }

    const filteredCases = cases.filter(c => {
        const matchesSearch = c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            c.client.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesFilter = filterStatus === 'all' || c.status === filterStatus
        return matchesSearch && matchesFilter
    })

    const stats = [
        { label: 'Total Cases', value: cases.length, color: 'text-blue-600' },
        { label: 'Active', value: cases.filter(c => c.status === 'active').length, color: 'text-green-600' },
        { label: 'Pending', value: cases.filter(c => c.status === 'pending').length, color: 'text-yellow-600' },
        { label: 'Urgent', value: cases.filter(c => c.status === 'urgent').length, color: 'text-red-600' }
    ]

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-[1800px] mx-auto space-y-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Cases</h1>
                        <p className="text-gray-600 mt-1">Manage and track all your legal cases</p>
                    </div>
                    <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
                        <Plus className="w-4 h-4" />
                        New Case
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
                                placeholder="Search cases by title or client..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value="all">All Status</option>
                            <option value="active">Active</option>
                            <option value="pending">Pending</option>
                            <option value="urgent">Urgent</option>
                            <option value="closed">Closed</option>
                        </select>
                    </div>
                </div>

                {/* Cases List */}
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        Case Details
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        Client
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        Type
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        Next Hearing
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        Assigned To
                                    </th>
                                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {filteredCases.map((caseItem) => (
                                    <tr key={caseItem.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div>
                                                <div className="font-semibold text-gray-900">{caseItem.title}</div>
                                                <div className="text-sm text-gray-500">{caseItem.id}</div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <User className="w-4 h-4 text-gray-400" />
                                                <span className="text-gray-900">{caseItem.client}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <FileText className="w-4 h-4 text-gray-400" />
                                                <span className="text-gray-700">{caseItem.caseType}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadge(caseItem.status)}`}>
                                                {getStatusIcon(caseItem.status)}
                                                {caseItem.status.charAt(0).toUpperCase() + caseItem.status.slice(1)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <Calendar className="w-4 h-4 text-gray-400" />
                                                <span className="text-gray-700">{caseItem.nextHearing}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-gray-700">{caseItem.assignedTo}</span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                                                <MoreVertical className="w-4 h-4 text-gray-500" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {filteredCases.length === 0 && (
                    <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                        <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">No cases found</h3>
                        <p className="text-gray-600">Try adjusting your search or filter criteria</p>
                    </div>
                )}
            </div>
        </div>
    )
}

