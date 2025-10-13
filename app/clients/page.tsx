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
            <div className="min-h-screen legal-gradient-mesh flex items-center justify-center">
                <div className="text-center">
                    <div className="inline-flex p-5 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-3xl mb-4">
                        <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent"></div>
                    </div>
                    <p className="text-lg font-bold text-slate-900">Loading clients...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen legal-gradient-mesh">
            <div className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 max-w-[1920px] mx-auto">
                {/* Premium Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-2">
                        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900">
                            Client <span className="text-gradient-indigo">Management</span>
                        </h1>
                        <p className="text-base sm:text-lg text-slate-600 font-medium">
                            Complete client lifecycle with integrated case & document management
                        </p>
                    </div>
                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="group px-4 sm:px-6 py-2.5 legal-gradient-indigo text-white rounded-xl hover:shadow-2xl hover:shadow-indigo-500/30 transition-all duration-300 flex items-center gap-2 text-sm sm:text-base font-bold hover:scale-105"
                    >
                        <Plus className="w-4 h-4 sm:w-5 sm:h-5 group-hover:rotate-90 transition-transform duration-300" />
                        Add Client
                    </button>
                </div>

                <div className="space-y-6 sm:space-y-8">
                    {error && (
                        <div className="premium-card p-4 border-rose-200 bg-gradient-to-r from-rose-50 to-rose-100">
                            <p className="text-rose-700 font-semibold">{error}</p>
                        </div>
                    )}

                    {/* Premium Stats Dashboard */}
                    <div className="premium-card p-6 sm:p-8">
                        <div className="mb-6 sm:mb-8">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2.5 bg-gradient-to-br from-purple-500/10 to-indigo-500/10 rounded-xl">
                                    <Briefcase className="w-6 h-6 text-purple-600" strokeWidth={2.5} />
                                </div>
                                <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                                    Client Services Overview
                                </h3>
                            </div>
                            <p className="text-sm sm:text-base text-slate-600 font-medium">
                                Integrated case, document, and research management
                            </p>
                        </div>
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                            {stats.map((stat, index) => (
                                <div key={index} className="group text-center p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-slate-50 to-white border border-slate-200 hover:shadow-xl hover:border-slate-300 hover:-translate-y-1 transition-all duration-300">
                                    <div className={`w-12 h-12 sm:w-14 sm:h-14 ${stat.iconBgColor} rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform duration-300`}>
                                        <stat.icon className={`w-6 h-6 sm:w-7 sm:h-7 ${stat.iconColor}`} strokeWidth={2.5} />
                                    </div>
                                    <div className="text-3xl sm:text-4xl font-black text-slate-900 mb-1 tracking-tight">{stat.value}</div>
                                    <div className="text-xs sm:text-sm text-slate-600 font-semibold">{stat.label}</div>
                                </div>
                            ))}
                        </div>
                    </div>

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

                    {/* Premium Clients Grid */}
                    {filteredClients.length === 0 ? (
                        <div className="premium-card p-12 sm:p-16">
                            <div className="text-center">
                                <div className="inline-flex p-5 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-3xl mb-4">
                                    <Users className="w-12 h-12 sm:w-14 sm:h-14 text-indigo-600" strokeWidth={2.5} />
                                </div>
                                <p className="text-xl font-black text-slate-900 mb-2">
                                    {clients.length === 0 ? "No clients yet" : "No clients found"}
                                </p>
                                <p className="text-sm sm:text-base text-slate-600 font-medium mb-6">
                                    {clients.length === 0 ? "Get started by adding your first client" : "Try adjusting your search criteria or filters"}
                                </p>
                                <button
                                    onClick={() => setIsAddModalOpen(true)}
                                    className="group px-6 py-3 legal-gradient-indigo text-white rounded-xl hover:shadow-2xl hover:shadow-indigo-500/30 transition-all duration-300 inline-flex items-center gap-2 font-bold hover:scale-105"
                                >
                                    <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
                                    Add Client
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                            {filteredClients.map((client) => (
                                <div
                                    key={client.id}
                                    className="group relative premium-card p-5 sm:p-6 cursor-pointer overflow-hidden"
                                    onClick={() => handleClientClick(client.id)}
                                >
                                    {/* Gradient Overlay */}
                                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/0 to-purple-500/0 group-hover:from-indigo-500/5 group-hover:to-purple-500/5 transition-all duration-300"></div>

                                    {/* Content */}
                                    <div className="relative z-10">
                                        {/* Header */}
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 legal-gradient-indigo rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                                                    <User className="w-6 h-6 text-white" strokeWidth={2.5} />
                                                </div>
                                                <div>
                                                    <h3 className="font-black text-slate-900 text-base sm:text-lg tracking-tight">{client.name}</h3>
                                                    <span className="inline-block mt-1 text-xs font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
                                                        {client.clientType}
                                                    </span>
                                                </div>
                                            </div>
                                            <span className={`text-xs font-black px-3 py-1.5 rounded-lg ${client.status === 'ACTIVE' ? 'bg-emerald-600 text-white' : client.status === 'INACTIVE' ? 'bg-amber-600 text-white' : 'bg-slate-600 text-white'}`}>
                                                {client.status}
                                            </span>
                                        </div>

                                        {/* Company */}
                                        {client.company && (
                                            <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-3 pb-3 border-b border-slate-200">
                                                <Briefcase className="w-4 h-4 text-slate-500" strokeWidth={2.5} />
                                                <span className="truncate">{client.company}</span>
                                            </div>
                                        )}

                                        {/* Contact Info */}
                                        <div className="space-y-2.5 mb-4">
                                            <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
                                                <Mail className="w-4 h-4 text-slate-400 flex-shrink-0" strokeWidth={2.5} />
                                                <span className="truncate">{client.email}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
                                                <Phone className="w-4 h-4 text-slate-400 flex-shrink-0" strokeWidth={2.5} />
                                                <span>{client.phone}</span>
                                            </div>
                                            {client.address && (
                                                <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
                                                    <MapPin className="w-4 h-4 text-slate-400 flex-shrink-0" strokeWidth={2.5} />
                                                    <span className="truncate">{client.address}</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Premium Stats Grid */}
                                        <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-200">
                                            <div className="text-center bg-gradient-to-br from-emerald-50 to-emerald-100/50 rounded-xl p-3 border border-emerald-200">
                                                <Briefcase className="w-4 h-4 text-emerald-600 mx-auto mb-1" strokeWidth={2.5} />
                                                <p className="text-xl font-black text-emerald-600">{client.activeCases}</p>
                                                <p className="text-xs text-slate-600 font-semibold">Active Cases</p>
                                            </div>
                                            <div className="text-center bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-xl p-3 border border-purple-200">
                                                <FileText className="w-4 h-4 text-purple-600 mx-auto mb-1" strokeWidth={2.5} />
                                                <p className="text-xl font-black text-purple-600">{client.totalDocuments || 0}</p>
                                                <p className="text-xs text-slate-600 font-semibold">Documents</p>
                                            </div>
                                        </div>

                                        {/* Footer */}
                                        <div className="mt-4 pt-4 border-t border-slate-200">
                                            <p className="text-xs text-slate-500 font-medium">
                                                Client since {new Date(client.createdAt).toLocaleDateString('en-US', {
                                                    month: 'short',
                                                    day: 'numeric',
                                                    year: 'numeric'
                                                })}
                                            </p>
                                        </div>
                                    </div>
                                </div>
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
