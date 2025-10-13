'use client'

import { useState } from 'react'
import { Plus, Search, Mail, Phone, MapPin, Briefcase, MoreVertical, User } from 'lucide-react'

interface Client {
    id: string
    name: string
    email: string
    phone: string
    company?: string
    address: string
    activeCases: number
    totalCases: number
    status: 'active' | 'inactive'
    joinedDate: string
}

export default function ClientsPage() {
    const [searchQuery, setSearchQuery] = useState('')

    const clients: Client[] = [
        {
            id: 'CLI-001',
            name: 'John Smith',
            email: 'john.smith@email.com',
            phone: '+1 (555) 123-4567',
            company: 'Smith Enterprises',
            address: '123 Main St, New York, NY',
            activeCases: 2,
            totalCases: 5,
            status: 'active',
            joinedDate: 'Jan 15, 2024'
        },
        {
            id: 'CLI-002',
            name: 'ABC Corporation',
            email: 'legal@abccorp.com',
            phone: '+1 (555) 234-5678',
            company: 'ABC Corporation',
            address: '456 Business Ave, Chicago, IL',
            activeCases: 3,
            totalCases: 8,
            status: 'active',
            joinedDate: 'Feb 20, 2024'
        },
        {
            id: 'CLI-003',
            name: 'Tech Innovations Inc',
            email: 'contact@techinnovations.com',
            phone: '+1 (555) 345-6789',
            company: 'Tech Innovations Inc',
            address: '789 Tech Park, San Francisco, CA',
            activeCases: 1,
            totalCases: 3,
            status: 'active',
            joinedDate: 'Mar 10, 2024'
        },
        {
            id: 'CLI-004',
            name: 'Jane Miller',
            email: 'jane.miller@email.com',
            phone: '+1 (555) 456-7890',
            address: '321 Oak Street, Boston, MA',
            activeCases: 0,
            totalCases: 2,
            status: 'inactive',
            joinedDate: 'Dec 5, 2023'
        },
        {
            id: 'CLI-005',
            name: 'Real Estate Holdings',
            email: 'info@reholdings.com',
            phone: '+1 (555) 567-8901',
            company: 'Real Estate Holdings LLC',
            address: '555 Property Lane, Miami, FL',
            activeCases: 1,
            totalCases: 6,
            status: 'active',
            joinedDate: 'Apr 3, 2024'
        },
        {
            id: 'CLI-006',
            name: 'Innovation Labs',
            email: 'legal@innovationlabs.com',
            phone: '+1 (555) 678-9012',
            company: 'Innovation Labs',
            address: '888 Research Blvd, Austin, TX',
            activeCases: 2,
            totalCases: 4,
            status: 'active',
            joinedDate: 'May 18, 2024'
        }
    ]

    const filteredClients = clients.filter(client =>
        client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        client.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        client.company?.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const stats = [
        { label: 'Total Clients', value: clients.length, color: 'text-blue-600' },
        { label: 'Active Clients', value: clients.filter(c => c.status === 'active').length, color: 'text-green-600' },
        { label: 'Total Cases', value: clients.reduce((sum, c) => sum + c.totalCases, 0), color: 'text-purple-600' },
        { label: 'Active Cases', value: clients.reduce((sum, c) => sum + c.activeCases, 0), color: 'text-orange-600' }
    ]

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-[1800px] mx-auto space-y-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Clients</h1>
                        <p className="text-gray-600 mt-1">Manage your client relationships</p>
                    </div>
                    <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
                        <Plus className="w-4 h-4" />
                        Add Client
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

                {/* Search */}
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                    <div className="relative">
                        <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search clients by name, email, or company..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>
                </div>

                {/* Clients Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredClients.map((client) => (
                        <div key={client.id} className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow">
                            {/* Header */}
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                                        <User className="w-6 h-6 text-blue-600" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-900">{client.name}</h3>
                                        <p className="text-xs text-gray-500">{client.id}</p>
                                    </div>
                                </div>
                                <button className="p-1 hover:bg-gray-100 rounded transition-colors">
                                    <MoreVertical className="w-4 h-4 text-gray-500" />
                                </button>
                            </div>

                            {/* Company */}
                            {client.company && (
                                <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                                    <Briefcase className="w-4 h-4" />
                                    {client.company}
                                </div>
                            )}

                            {/* Contact Info */}
                            <div className="space-y-2 mb-4">
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <Mail className="w-4 h-4" />
                                    <span className="truncate">{client.email}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <Phone className="w-4 h-4" />
                                    {client.phone}
                                </div>
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <MapPin className="w-4 h-4" />
                                    <span className="truncate">{client.address}</span>
                                </div>
                            </div>

                            {/* Cases Info */}
                            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                                <div>
                                    <p className="text-xs text-gray-500">Active Cases</p>
                                    <p className="text-lg font-bold text-blue-600">{client.activeCases}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">Total Cases</p>
                                    <p className="text-lg font-bold text-gray-700">{client.totalCases}</p>
                                </div>
                                <div>
                                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${client.status === 'active'
                                            ? 'bg-green-100 text-green-700'
                                            : 'bg-gray-100 text-gray-700'
                                        }`}>
                                        {client.status}
                                    </span>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="mt-4 pt-4 border-t border-gray-200">
                                <p className="text-xs text-gray-500">Client since {client.joinedDate}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {filteredClients.length === 0 && (
                    <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                        <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">No clients found</h3>
                        <p className="text-gray-600">Try adjusting your search criteria</p>
                    </div>
                )}
            </div>
        </div>
    )
}

