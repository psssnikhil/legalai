'use client'

import { useState } from 'react'
import { BookOpen, Star, Download, Eye, Scale, Gavel, Clock, FileText } from 'lucide-react'
import PageHeader from '@/components/ui/PageHeader'
import Button from '@/components/ui/Button'
import SearchBar from '@/components/ui/SearchBar'
import Badge from '@/components/ui/Badge'
import StatCard from '@/components/ui/StatCard'
import Card from '@/components/ui/Card'
import Select from '@/components/ui/Select'
import EmptyState from '@/components/ui/EmptyState'

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
        {
            label: 'Total Resources',
            value: resources.length,
            icon: BookOpen,
            iconColor: 'text-slate-600',
            iconBgColor: 'bg-slate-100'
        },
        {
            label: 'Acts & Statutes',
            value: resources.filter(r => r.type === 'Act' || r.type === 'Statute').length,
            icon: Scale,
            iconColor: 'text-emerald-600',
            iconBgColor: 'bg-emerald-100'
        },
        {
            label: 'Case Laws',
            value: resources.filter(r => r.type === 'Case Law').length,
            icon: Gavel,
            iconColor: 'text-blue-600',
            iconBgColor: 'bg-blue-100'
        },
        {
            label: 'Articles',
            value: resources.filter(r => r.type === 'Article').length,
            icon: FileText,
            iconColor: 'text-purple-600',
            iconBgColor: 'bg-purple-100'
        }
    ]

    const categories = ['Contract Law', 'Constitutional Law', 'Corporate Law', 'Intellectual Property', 'Environmental Law', 'Civil Procedure']

    return (
        <div className="legal-page">
            <PageHeader
                title="Legal Library"
                description="Access comprehensive legal resources and references"
                icon={BookOpen}
                badge={{ text: `${resources.length} Resources`, variant: 'purple' }}
                actions={
                    <>
                        <Button variant="outline" size="md">
                            Import
                        </Button>
                        <Button variant="primary" size="md">
                            Add Resource
                        </Button>
                    </>
                }
            />

            <div className="p-6">
                <div className="legal-container space-y-6">
                    {/* Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {stats.map((stat, index) => (
                            <StatCard key={index} {...stat} />
                        ))}
                    </div>

                    {/* Search and Filter */}
                    <Card>
                        <div className="flex flex-col md:flex-row gap-4">
                            <div className="flex-1">
                                <SearchBar
                                    placeholder="Search legal resources by title, citation, or description..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                            <Select
                                value={filterType}
                                onChange={(e) => setFilterType(e.target.value)}
                                className="md:w-64"
                            >
                                <option value="all">All Types</option>
                                <option value="Act">Acts</option>
                                <option value="Case Law">Case Laws</option>
                                <option value="Article">Articles</option>
                                <option value="Statute">Statutes</option>
                            </Select>
                        </div>
                    </Card>

                    {/* Main Content */}
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                        {/* Categories Sidebar */}
                        <div className="lg:col-span-1">
                            <Card className="sticky top-6">
                                <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                                    <Scale className="w-5 h-5 text-slate-600" />
                                    Categories
                                </h3>
                                <div className="space-y-2">
                                    {categories.map((category, index) => (
                                        <button
                                            key={index}
                                            className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-900 hover:text-white transition-all duration-200 text-sm text-slate-700 font-medium"
                                        >
                                            {category}
                                        </button>
                                    ))}
                                </div>
                            </Card>
                        </div>

                        {/* Resources List */}
                        <div className="lg:col-span-3 space-y-4">
                            {filteredResources.length === 0 ? (
                                <Card>
                                    <EmptyState
                                        icon={BookOpen}
                                        title="No resources found"
                                        description="Try adjusting your search criteria or add a new resource"
                                    />
                                </Card>
                            ) : (
                                filteredResources.map((resource) => (
                                    <Card
                                        key={resource.id}
                                        hover
                                        className="bg-gradient-to-br from-white to-slate-50"
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <h3 className="text-xl font-semibold text-slate-900">{resource.title}</h3>
                                                    <Badge variant="info" size="sm">
                                                        {resource.type}
                                                    </Badge>
                                                </div>
                                                {resource.citation && (
                                                    <p className="text-sm text-slate-600 mb-2 font-mono">{resource.citation}</p>
                                                )}
                                                <p className="text-slate-700 mb-3">{resource.description}</p>
                                                <div className="flex items-center gap-4 text-sm text-slate-500">
                                                    <div className="flex items-center gap-1">
                                                        <Clock className="w-4 h-4" />
                                                        {resource.year}
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <Eye className="w-4 h-4" />
                                                        {resource.views} views
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        {Array.from({ length: resource.rating }).map((_, i) => (
                                                            <Star key={i} className="w-4 h-4 text-amber-500 fill-amber-500" />
                                                        ))}
                                                    </div>
                                                </div>
                                                <div className="mt-3 pt-3 border-t border-slate-200">
                                                    <Badge variant="default" size="sm">
                                                        {resource.category}
                                                    </Badge>
                                                </div>
                                            </div>
                                            <div className="flex flex-col gap-2 ml-4">
                                                <Button variant="outline" size="sm">
                                                    <Eye className="w-4 h-4" />
                                                </Button>
                                                <Button variant="primary" size="sm">
                                                    <Download className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </Card>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
