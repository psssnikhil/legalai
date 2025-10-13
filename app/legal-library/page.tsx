'use client'

import { useState } from 'react'
import { Search, BookOpen, Star, Download, Eye, FileText, Scale, Gavel, Clock } from 'lucide-react'

interface LegalResource {
    id: string
    title: string
    type: 'Act' | 'Case Law' | 'Article' | 'Statute'
    category: string
    description: string
    year: string
    citation?: string
    rating: number
    views: number
}

export default function LegalLibraryPage() {
    const [searchQuery, setSearchQuery] = useState('')
    const [filterType, setFilterType] = useState<string>('all')

    const resources: LegalResource[] = [
        {
            id: 'RES-001',
            title: 'Indian Contract Act, 1872',
            type: 'Act',
            category: 'Contract Law',
            description: 'An Act to define and amend certain parts of the law relating to contracts',
            year: '1872',
            citation: 'Act No. 9 of 1872',
            rating: 5,
            views: 1234
        },
        {
            id: 'RES-002',
            title: 'Kesavananda Bharati vs State of Kerala',
            type: 'Case Law',
            category: 'Constitutional Law',
            description: 'Landmark Supreme Court judgment establishing the basic structure doctrine',
            year: '1973',
            citation: 'AIR 1973 SC 1461',
            rating: 5,
            views: 987
        },
        {
            id: 'RES-003',
            title: 'Code of Civil Procedure, 1908',
            type: 'Act',
            category: 'Civil Procedure',
            description: 'The procedural law for administration of civil proceedings in Indian courts',
            year: '1908',
            citation: 'Act No. 5 of 1908',
            rating: 4,
            views: 856
        },
        {
            id: 'RES-004',
            title: 'Understanding IP Rights in India',
            type: 'Article',
            category: 'Intellectual Property',
            description: 'Comprehensive guide to intellectual property rights and their protection',
            year: '2024',
            rating: 4,
            views: 543
        },
        {
            id: 'RES-005',
            title: 'Companies Act, 2013',
            type: 'Act',
            category: 'Corporate Law',
            description: 'An Act to consolidate and amend the law relating to companies',
            year: '2013',
            citation: 'Act No. 18 of 2013',
            rating: 5,
            views: 1567
        },
        {
            id: 'RES-006',
            title: 'M.C. Mehta vs Union of India',
            type: 'Case Law',
            category: 'Environmental Law',
            description: 'Series of cases on environmental protection and public interest litigation',
            year: '1986',
            citation: 'AIR 1987 SC 1086',
            rating: 5,
            views: 432
        }
    ]

    const filteredResources = resources.filter(resource => {
        const matchesSearch = resource.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            resource.description.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesFilter = filterType === 'all' || resource.type === filterType
        return matchesSearch && matchesFilter
    })

    const stats = [
        { label: 'Total Resources', value: resources.length, icon: BookOpen, color: 'text-blue-600 bg-blue-50' },
        { label: 'Acts & Statutes', value: resources.filter(r => r.type === 'Act' || r.type === 'Statute').length, icon: Scale, color: 'text-green-600 bg-green-50' },
        { label: 'Case Laws', value: resources.filter(r => r.type === 'Case Law').length, icon: Gavel, color: 'text-purple-600 bg-purple-50' },
        { label: 'Articles', value: resources.filter(r => r.type === 'Article').length, icon: FileText, color: 'text-orange-600 bg-orange-50' }
    ]

    const categories = ['Contract Law', 'Constitutional Law', 'Corporate Law', 'Intellectual Property', 'Environmental Law', 'Civil Procedure']

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-[1800px] mx-auto space-y-6">
                {/* Header */}
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Legal Library</h1>
                    <p className="text-gray-600 mt-1">Access comprehensive legal resources and references</p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {stats.map((stat, index) => (
                        <div key={index} className="bg-white rounded-xl border border-gray-200 p-6">
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                                <div className={`p-2 rounded-lg ${stat.color}`}>
                                    <stat.icon className="w-5 h-5" />
                                </div>
                            </div>
                            <p className={`text-3xl font-bold ${stat.color.split(' ')[0]}`}>{stat.value}</p>
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
                                placeholder="Search legal resources..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                        <select
                            value={filterType}
                            onChange={(e) => setFilterType(e.target.value)}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value="all">All Types</option>
                            <option value="Act">Acts</option>
                            <option value="Case Law">Case Laws</option>
                            <option value="Article">Articles</option>
                            <option value="Statute">Statutes</option>
                        </select>
                    </div>
                </div>

                {/* Main Content */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {/* Categories Sidebar */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-xl border border-gray-200 p-6 sticky top-6">
                            <h3 className="font-semibold text-gray-900 mb-4">Categories</h3>
                            <div className="space-y-2">
                                {categories.map((category, index) => (
                                    <button
                                        key={index}
                                        className="w-full text-left px-3 py-2 rounded-lg hover:bg-blue-50 hover:text-blue-600 transition-colors text-sm text-gray-700"
                                    >
                                        {category}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Resources List */}
                    <div className="lg:col-span-3 space-y-4">
                        {filteredResources.map((resource) => (
                            <div
                                key={resource.id}
                                className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow"
                            >
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <h3 className="text-xl font-semibold text-gray-900">{resource.title}</h3>
                                            <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
                                                {resource.type}
                                            </span>
                                        </div>
                                        {resource.citation && (
                                            <p className="text-sm text-gray-600 mb-2">{resource.citation}</p>
                                        )}
                                        <p className="text-gray-700 mb-3">{resource.description}</p>
                                        <div className="flex items-center gap-4 text-sm text-gray-500">
                                            <div className="flex items-center gap-1">
                                                <Clock className="w-4 h-4" />
                                                {resource.year}
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Eye className="w-4 h-4" />
                                                {resource.views} views
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                                                {resource.rating}.0
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <button className="p-2 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors" title="View">
                                            <Eye className="w-5 h-5 text-blue-600" />
                                        </button>
                                        <button className="p-2 bg-green-50 hover:bg-green-100 rounded-lg transition-colors" title="Download">
                                            <Download className="w-5 h-5 text-green-600" />
                                        </button>
                                    </div>
                                </div>
                                <div className="pt-3 border-t border-gray-200">
                                    <span className="inline-block px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                                        {resource.category}
                                    </span>
                                </div>
                            </div>
                        ))}

                        {filteredResources.length === 0 && (
                            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                                <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">No resources found</h3>
                                <p className="text-gray-600">Try adjusting your search criteria</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

