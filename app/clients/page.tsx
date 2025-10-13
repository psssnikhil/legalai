'use client'

import { useState, useEffect } from 'react'
import { Plus, Mail, Phone, MapPin, Briefcase, MoreVertical, User, Users, FileText, Calendar } from 'lucide-react'
import PageHeader from '@/components/ui/PageHeader'
import Button from '@/components/ui/Button'
import SearchBar from '@/components/ui/SearchBar'
import Badge from '@/components/ui/Badge'
import StatCard from '@/components/ui/StatCard'
import Card from '@/components/ui/Card'
import EmptyState from '@/components/ui/EmptyState'
import Tabs from '@/components/ui/Tabs'
import Select from '@/components/ui/Select'
import AddClientModal from '@/components/clients/AddClientModal'
import ClientDetailModal from '@/components/clients/ClientDetailModal'

interface Client {
    id: string
    name: string
    email: string
    phone: string
    company?: string
    address?: string
    clientType: string
    status: string
    activeCases: number
    totalCases: number
    totalDocuments: number
    totalHearings: number
    customFields?: Record<string, { value: string; type: string }>
    createdAt: string
}

export default function ClientsPage() {
    const [searchQuery, setSearchQuery] = useState('')
    const [activeTab, setActiveTab] = useState('ALL')
    const [clients, setClients] = useState<Client[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [isAddModalOpen, setIsAddModalOpen] = useState(false)
    const [selectedClientId, setSelectedClientId] = useState<string | null>(null)
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)

    useEffect(() => {
        fetchClients()
    }, [])

    const fetchClients = async () => {
        console.log('fetchClients: Starting to fetch clients...')
        setLoading(true)
        setError('')

        try {
            const response = await fetch('/api/clients')
            const data = await response.json()
            console.log('fetchClients: Response received', { status: response.status, clientCount: data.clients?.length })

            if (!response.ok) {
                throw new Error(data.error || 'Failed to fetch clients')
            }

            console.log('fetchClients: Setting clients', data.clients)
            setClients(data.clients || [])
        } catch (err) {
            console.error('fetchClients: Error', err)
            setError(err instanceof Error ? err.message : 'Failed to fetch clients')
        } finally {
            setLoading(false)
            console.log('fetchClients: Completed')
        }
    }

    const handleClientClick = (clientId: string) => {
        setSelectedClientId(clientId)
        setIsDetailModalOpen(true)
    }

    const filteredClients = clients.filter(client => {
        // Filter by status tab
        if (activeTab !== 'ALL' && client.status !== activeTab) {
            return false
        }

        // Filter by search query
        if (searchQuery) {
            const query = searchQuery.toLowerCase()
            return (
                client.name.toLowerCase().includes(query) ||
                client.email.toLowerCase().includes(query) ||
                client.company?.toLowerCase().includes(query)
            )
        }

        return true
    })

    const stats = [
        {
            label: 'Total Clients',
            value: clients.length,
            icon: Users,
            iconColor: 'text-slate-600',
            iconBgColor: 'bg-slate-100'
        },
        {
            label: 'Active Clients',
            value: clients.filter(c => c.status === 'ACTIVE').length,
            icon: User,
            iconColor: 'text-emerald-600',
            iconBgColor: 'bg-emerald-100'
        },
        {
            label: 'Total Cases',
            value: clients.reduce((sum, c) => sum + c.totalCases, 0),
            icon: Briefcase,
            iconColor: 'text-blue-600',
            iconBgColor: 'bg-blue-100'
        },
        {
            label: 'Documents',
            value: clients.reduce((sum, c) => sum + (c.totalDocuments || 0), 0),
            icon: FileText,
            iconColor: 'text-purple-600',
            iconBgColor: 'bg-purple-100'
        }
    ]

    const tabs = [
        { id: 'ALL', label: 'All', count: clients.length },
        { id: 'ACTIVE', label: 'Active', count: clients.filter(c => c.status === 'ACTIVE').length },
        { id: 'INACTIVE', label: 'Inactive', count: clients.filter(c => c.status === 'INACTIVE').length },
        { id: 'ARCHIVED', label: 'Archived', count: clients.filter(c => c.status === 'ARCHIVED').length }
    ]

    if (loading) {
        return (
            <div className="legal-page">
                <PageHeader
                    title="Clients"
                    description="Manage your client relationships and cases"
                    icon={Users}
                />
                <div className="p-6">
                    <div className="legal-container">
                        <Card>
                            <div className="text-center py-12">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                                <p className="mt-4 text-slate-600">Loading clients...</p>
                            </div>
                        </Card>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="legal-page">
            <PageHeader
                title="Integrated Client Management"
                description="Complete client lifecycle with connected case, document, and research management"
                icon={Users}
                badge={{ text: `${clients.length} Clients`, variant: 'slate' }}
                actions={
                    <Button variant="primary" icon={Plus} onClick={() => setIsAddModalOpen(true)}>
                        Add Client
                    </Button>
                }
            />

            <div className="p-6">
                <div className="legal-container space-y-6">
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                            {error}
                        </div>
                    )}

                    {/* Stats Dashboard */}
                    <Card>
                        <div className="mb-6">
                            <div className="flex items-center gap-2 text-purple-600 mb-2">
                                <Briefcase className="w-5 h-5" />
                                <h3 className="font-semibold">Integrated Client Services Dashboard</h3>
                            </div>
                            <p className="text-sm text-slate-600">
                                Connect clients with cases, documents, court schedules, and AI research
                            </p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {stats.map((stat, index) => (
                                <div key={index} className="text-center">
                                    <div className={`w-12 h-12 ${stat.iconBgColor} rounded-xl flex items-center justify-center mx-auto mb-3`}>
                                        <stat.icon className={`w-6 h-6 ${stat.iconColor}`} />
                                    </div>
                                    <div className="text-3xl font-bold text-slate-900 mb-1">{stat.value}</div>
                                    <div className="text-sm text-slate-600">{stat.label}</div>
                                </div>
                            ))}
                        </div>
                    </Card>

                    {/* Search and Filter */}
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="flex-1">
                            <SearchBar
                                placeholder="Search clients..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <Select value="all-types" onChange={() => { }}>
                            <option value="all-types">All Types</option>
                            <option value="individual">Individual</option>
                            <option value="company">Company</option>
                            <option value="organization">Organization</option>
                        </Select>
                    </div>

                    {/* Tabs */}
                    <Tabs
                        tabs={tabs}
                        activeTab={activeTab}
                        onChange={setActiveTab}
                    />

                    {/* Clients Grid */}
                    {filteredClients.length === 0 ? (
                        <Card>
                            <EmptyState
                                icon={Users}
                                title={clients.length === 0 ? "No clients yet" : "No clients found"}
                                description={clients.length === 0 ? "Get started by adding your first client" : "Try adjusting your search criteria or filters"}
                                action={{
                                    label: 'Add Client',
                                    onClick: () => setIsAddModalOpen(true),
                                    icon: Plus
                                }}
                            />
                        </Card>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredClients.map((client) => (
                                <Card
                                    key={client.id}
                                    hover
                                    className="relative cursor-pointer"
                                    onClick={() => handleClientClick(client.id)}
                                >
                                    {/* Header */}
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                                                <User className="w-6 h-6 text-white" />
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-slate-900">{client.name}</h3>
                                                <Badge variant="slate" className="mt-1">
                                                    {client.clientType}
                                                </Badge>
                                            </div>
                                        </div>
                                        <Badge variant={client.status === 'ACTIVE' ? 'success' : client.status === 'INACTIVE' ? 'warning' : 'default'} dot>
                                            {client.status}
                                        </Badge>
                                    </div>

                                    {/* Company */}
                                    {client.company && (
                                        <div className="flex items-center gap-2 text-sm text-slate-600 mb-3 pb-3 border-b border-slate-100">
                                            <Briefcase className="w-4 h-4 text-slate-400" />
                                            <span className="truncate">{client.company}</span>
                                        </div>
                                    )}

                                    {/* Contact Info */}
                                    <div className="space-y-2 mb-4">
                                        <div className="flex items-center gap-2 text-sm text-slate-600">
                                            <Mail className="w-4 h-4 text-slate-400 flex-shrink-0" />
                                            <span className="truncate">{client.email}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-slate-600">
                                            <Phone className="w-4 h-4 text-slate-400 flex-shrink-0" />
                                            <span>{client.phone}</span>
                                        </div>
                                        {client.address && (
                                            <div className="flex items-center gap-2 text-sm text-slate-600">
                                                <MapPin className="w-4 h-4 text-slate-400 flex-shrink-0" />
                                                <span className="truncate">{client.address}</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Stats Grid */}
                                    <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-100">
                                        <div className="text-center bg-emerald-50 rounded-lg p-3">
                                            <Briefcase className="w-4 h-4 text-emerald-600 mx-auto mb-1" />
                                            <p className="text-lg font-bold text-emerald-600">{client.activeCases}</p>
                                            <p className="text-xs text-slate-600">Active Cases</p>
                                        </div>
                                        <div className="text-center bg-purple-50 rounded-lg p-3">
                                            <FileText className="w-4 h-4 text-purple-600 mx-auto mb-1" />
                                            <p className="text-lg font-bold text-purple-600">{client.totalDocuments || 0}</p>
                                            <p className="text-xs text-slate-600">Documents</p>
                                        </div>
                                    </div>

                                    {/* Footer */}
                                    <div className="mt-4 pt-4 border-t border-slate-100">
                                        <p className="text-xs text-slate-500">
                                            Client since {new Date(client.createdAt).toLocaleDateString('en-US', {
                                                month: 'short',
                                                day: 'numeric',
                                                year: 'numeric'
                                            })}
                                        </p>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Modals */}
            <AddClientModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onSuccess={fetchClients}
            />
            <ClientDetailModal
                isOpen={isDetailModalOpen}
                clientId={selectedClientId}
                onClose={() => {
                    setIsDetailModalOpen(false)
                    setSelectedClientId(null)
                }}
                onSuccess={fetchClients}
            />
        </div>
    )
}
