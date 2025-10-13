'use client'

import { useState, useEffect } from 'react'
import { Calendar as CalendarIcon, Plus, Clock, MapPin, User, FileText, ChevronLeft, ChevronRight, Edit, Trash2, X, AlertCircle } from 'lucide-react'

interface Hearing {
    id: string
    title: string
    hearingDate: string
    startTime: string
    endTime?: string
    duration: number
    caseId?: string
    clientName?: string
    state?: string
    district?: string
    court?: string
    courtType?: string
    courtRoom?: string
    judgeName?: string
    priority: string
    status: string
    hearingType?: string
    notes?: string
    case?: {
        id: string
        title: string
        clientName?: string
        caseType?: string
        status: string
    }
}

interface Case {
    id: string
    title: string
    clientName?: string
}

export default function CourtDiaryPage() {
    const [currentDate, setCurrentDate] = useState(new Date())
    const [selectedDate, setSelectedDate] = useState(new Date())
    const [hearings, setHearings] = useState<Hearing[]>([])
    const [filteredHearings, setFilteredHearings] = useState<Hearing[]>([])
    const [cases, setCases] = useState<Case[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    // Modal states
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [isEditing, setIsEditing] = useState(false)
    const [currentHearing, setCurrentHearing] = useState<Partial<Hearing>>({})

    // Filter states
    const [filters, setFilters] = useState({
        clientName: '',
        caseId: '',
        state: '',
        district: '',
        courtType: '',
        status: ''
    })

    // Form state
    const [formData, setFormData] = useState({
        title: '',
        hearingDate: '',
        startTime: '09:00',
        endTime: '',
        duration: 60,
        caseId: '',
        clientName: '',
        state: '',
        district: '',
        court: '',
        courtType: '',
        courtRoom: '',
        judgeName: '',
        priority: 'MEDIUM',
        status: 'SCHEDULED',
        hearingType: '',
        notes: ''
    })

    // Fetch hearings
    const fetchHearings = async (date?: Date) => {
        try {
            setLoading(true)
            const targetDate = date || selectedDate
            const dateStr = targetDate.toISOString().split('T')[0]

            const response = await fetch(`/api/hearings?date=${dateStr}`)
            const data = await response.json()

            if (response.ok) {
                setHearings(data.hearings)
                setFilteredHearings(data.hearings)
            } else {
                setError(data.message || 'Failed to fetch hearings')
            }
        } catch (err) {
            setError('An error occurred while fetching hearings')
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    // Fetch cases for dropdown
    const fetchCases = async () => {
        try {
            const response = await fetch('/api/cases')
            if (response.ok) {
                const data = await response.json()
                setCases(data.cases || [])
            }
        } catch (err) {
            console.error('Failed to fetch cases:', err)
        }
    }

    useEffect(() => {
        fetchHearings()
        fetchCases()
    }, [selectedDate])

    // Apply filters
    useEffect(() => {
        let filtered = [...hearings]

        if (filters.clientName) {
            filtered = filtered.filter(h =>
                h.clientName?.toLowerCase().includes(filters.clientName.toLowerCase())
            )
        }
        if (filters.caseId && filters.caseId !== 'all') {
            filtered = filtered.filter(h => h.caseId === filters.caseId)
        }
        if (filters.state) {
            filtered = filtered.filter(h => h.state === filters.state)
        }
        if (filters.district) {
            filtered = filtered.filter(h => h.district === filters.district)
        }
        if (filters.courtType && filters.courtType !== 'all') {
            filtered = filtered.filter(h => h.courtType === filters.courtType)
        }
        if (filters.status && filters.status !== 'all') {
            filtered = filtered.filter(h => h.status === filters.status)
        }

        setFilteredHearings(filtered)
    }, [filters, hearings])

    // Handle create/update hearing
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        try {
            const url = isEditing
                ? `/api/hearings/${currentHearing.id}`
                : '/api/hearings/create'

            const method = isEditing ? 'PUT' : 'POST'

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            })

            const data = await response.json()

            if (response.ok) {
                setIsModalOpen(false)
                resetForm()
                fetchHearings()
            } else {
                setError(data.message || 'Failed to save hearing')
            }
        } catch (err) {
            setError('An error occurred while saving the hearing')
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    // Handle delete hearing
    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this hearing?')) return

        try {
            setLoading(true)
            const response = await fetch(`/api/hearings/${id}`, {
                method: 'DELETE'
            })

            if (response.ok) {
                fetchHearings()
            } else {
                const data = await response.json()
                setError(data.message || 'Failed to delete hearing')
            }
        } catch (err) {
            setError('An error occurred while deleting the hearing')
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    // Open modal for editing
    const handleEdit = (hearing: Hearing) => {
        setIsEditing(true)
        setCurrentHearing(hearing)
        setFormData({
            title: hearing.title,
            hearingDate: hearing.hearingDate.split('T')[0],
            startTime: hearing.startTime,
            endTime: hearing.endTime || '',
            duration: hearing.duration,
            caseId: hearing.caseId || '',
            clientName: hearing.clientName || '',
            state: hearing.state || '',
            district: hearing.district || '',
            court: hearing.court || '',
            courtType: hearing.courtType || '',
            courtRoom: hearing.courtRoom || '',
            judgeName: hearing.judgeName || '',
            priority: hearing.priority,
            status: hearing.status,
            hearingType: hearing.hearingType || '',
            notes: hearing.notes || ''
        })
        setIsModalOpen(true)
    }

    // Reset form
    const resetForm = () => {
        setIsEditing(false)
        setCurrentHearing({})
        setFormData({
            title: '',
            hearingDate: selectedDate.toISOString().split('T')[0],
            startTime: '09:00',
            endTime: '',
            duration: 60,
            caseId: '',
            clientName: '',
            state: '',
            district: '',
            court: '',
            courtType: '',
            courtRoom: '',
            judgeName: '',
            priority: 'MEDIUM',
            status: 'SCHEDULED',
            hearingType: '',
            notes: ''
        })
    }

    // Open modal for creating
    const handleOpenCreateModal = () => {
        resetForm()
        setIsModalOpen(true)
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'SCHEDULED': return 'bg-indigo-50 text-indigo-700 border-indigo-200'
            case 'COMPLETED': return 'bg-emerald-50 text-emerald-700 border-emerald-200'
            case 'RESCHEDULED': return 'bg-amber-50 text-amber-700 border-amber-200'
            case 'CANCELLED': return 'bg-rose-50 text-rose-700 border-rose-200'
            default: return 'bg-slate-100 text-slate-700 border-slate-200'
        }
    }

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'URGENT': return 'bg-rose-50 text-rose-700 border-rose-300'
            case 'HIGH': return 'bg-amber-50 text-amber-700 border-amber-300'
            case 'MEDIUM': return 'bg-indigo-50 text-indigo-700 border-indigo-300'
            case 'LOW': return 'bg-slate-100 text-slate-600 border-slate-300'
            default: return 'bg-slate-100 text-slate-600 border-slate-300'
        }
    }

    // Navigate dates
    const navigateDate = (direction: 'prev' | 'next') => {
        const newDate = new Date(selectedDate)
        newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1))
        setSelectedDate(newDate)
    }

    const navigateMonth = (direction: 'prev' | 'next') => {
        const newDate = new Date(currentDate)
        newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1))
        setCurrentDate(newDate)
    }

    // Generate week days
    const getWeekDays = () => {
        const days = []
        const start = new Date(selectedDate)
        start.setDate(start.getDate() - start.getDay()) // Start from Sunday

        for (let i = 0; i < 7; i++) {
            const date = new Date(start)
            date.setDate(start.getDate() + i)
            days.push(date)
        }
        return days
    }

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-[1800px] mx-auto space-y-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Court Diary</h1>
                        <p className="text-gray-600 mt-1">Schedule and manage court hearings</p>
                    </div>
                    <button
                        onClick={handleOpenCreateModal}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all duration-200 flex items-center gap-2 shadow-sm hover:shadow-md"
                    >
                        <Plus className="w-5 h-5" />
                        Schedule Hearing
                    </button>
                </div>

                {/* Error Alert */}
                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
                        <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                        <p className="text-red-800">{error}</p>
                        <button onClick={() => setError('')} className="ml-auto text-red-600 hover:text-red-800">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                )}

                {/* Filters */}
                <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                    <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                        <FileText className="w-5 h-5 text-indigo-600" />
                        Filter Hearings
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
                        <input
                            type="text"
                            placeholder="Client Name"
                            value={filters.clientName}
                            onChange={(e) => setFilters({ ...filters, clientName: e.target.value })}
                            className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                        />
                        <select
                            value={filters.caseId}
                            onChange={(e) => setFilters({ ...filters, caseId: e.target.value })}
                            className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                        >
                            <option value="">All Cases</option>
                            {cases.map(c => (
                                <option key={c.id} value={c.id}>{c.title}</option>
                            ))}
                        </select>
                        <input
                            type="text"
                            placeholder="State"
                            value={filters.state}
                            onChange={(e) => setFilters({ ...filters, state: e.target.value })}
                            className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                        />
                        <input
                            type="text"
                            placeholder="District"
                            value={filters.district}
                            onChange={(e) => setFilters({ ...filters, district: e.target.value })}
                            className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                        />
                        <select
                            value={filters.courtType}
                            onChange={(e) => setFilters({ ...filters, courtType: e.target.value })}
                            className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                        >
                            <option value="">All Court Types</option>
                            <option value="Supreme Court">Supreme Court</option>
                            <option value="High Court">High Court</option>
                            <option value="District Court">District Court</option>
                            <option value="Session Court">Session Court</option>
                        </select>
                        <select
                            value={filters.status}
                            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                            className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                        >
                            <option value="">All Status</option>
                            <option value="SCHEDULED">Scheduled</option>
                            <option value="COMPLETED">Completed</option>
                            <option value="RESCHEDULED">Rescheduled</option>
                            <option value="CANCELLED">Cancelled</option>
                        </select>
                    </div>
                </div>

                {/* Calendar View */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Calendar */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Week Navigator */}
                        <div className="bg-white rounded-xl border border-gray-200 p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold text-slate-900">
                                    {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                                </h2>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => navigateMonth('prev')}
                                        className="p-2 hover:bg-slate-100 rounded-lg transition-all duration-200"
                                    >
                                        <ChevronLeft className="w-5 h-5 text-slate-600" />
                                    </button>
                                    <button
                                        onClick={() => navigateMonth('next')}
                                        className="p-2 hover:bg-slate-100 rounded-lg transition-all duration-200"
                                    >
                                        <ChevronRight className="w-5 h-5 text-slate-600" />
                                    </button>
                                </div>
                            </div>

                            {/* Week View */}
                            <div className="flex items-center justify-between mb-4">
                                <button
                                    onClick={() => navigateDate('prev')}
                                    className="p-2 hover:bg-slate-100 rounded-lg transition-all duration-200"
                                >
                                    <ChevronLeft className="w-5 h-5 text-slate-600" />
                                </button>
                                <div className="grid grid-cols-7 gap-2 flex-1">
                                    {getWeekDays().map((day, index) => {
                                        const isSelected = day.toDateString() === selectedDate.toDateString()
                                        const hearingCount = hearings.filter(h =>
                                            new Date(h.hearingDate).toDateString() === day.toDateString()
                                        ).length

                                        return (
                                            <div
                                                key={index}
                                                onClick={() => setSelectedDate(day)}
                                                className={`p-4 rounded-lg text-center cursor-pointer transition-all duration-200 ${isSelected
                                                    ? 'bg-indigo-50 border-2 border-indigo-500 shadow-sm'
                                                    : 'bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:border-slate-300'
                                                    }`}
                                            >
                                                <div className="text-xs text-slate-500 mb-1">
                                                    {day.toLocaleDateString('en-US', { weekday: 'short' })}
                                                </div>
                                                <div className={`text-lg font-bold mb-2 ${isSelected ? 'text-indigo-700' : 'text-slate-900'}`}>
                                                    {day.getDate()}
                                                </div>
                                                {hearingCount > 0 && (
                                                    <div className={`text-xs rounded-full px-2 py-1 font-medium ${isSelected ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-200 text-slate-700'}`}>
                                                        {hearingCount}
                                                    </div>
                                                )}
                                            </div>
                                        )
                                    })}
                                </div>
                                <button
                                    onClick={() => navigateDate('next')}
                                    className="p-2 hover:bg-slate-100 rounded-lg transition-all duration-200"
                                >
                                    <ChevronRight className="w-5 h-5 text-slate-600" />
                                </button>
                            </div>
                        </div>

                        {/* Hearings List */}
                        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                            <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                                <CalendarIcon className="w-5 h-5 text-indigo-600" />
                                Hearings for {selectedDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                            </h3>

                            {loading ? (
                                <div className="text-center py-8">
                                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
                                    <p className="text-slate-600 mt-4">Loading hearings...</p>
                                </div>
                            ) : filteredHearings.length === 0 ? (
                                <div className="text-center py-12">
                                    <CalendarIcon className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                                    <p className="text-slate-600">No hearings scheduled for this date</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {filteredHearings.map((hearing) => (
                                        <div
                                            key={hearing.id}
                                            className={`border-l-4 ${getPriorityColor(hearing.priority)} border rounded-lg p-4 hover:shadow-md transition-all duration-200 bg-white`}
                                        >
                                            <div className="flex items-start justify-between mb-3">
                                                <div className="flex items-center gap-3 flex-1">
                                                    <div className="bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-lg px-3 py-2 font-semibold text-sm">
                                                        {hearing.startTime}
                                                    </div>
                                                    <div className="flex-1">
                                                        <h4 className="font-semibold text-slate-900">{hearing.title}</h4>
                                                        <p className="text-sm text-slate-600">
                                                            {hearing.case?.title || hearing.clientName || 'No case linked'}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(hearing.status)}`}>
                                                        {hearing.status}
                                                    </span>
                                                    <button
                                                        onClick={() => handleEdit(hearing)}
                                                        className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all duration-200"
                                                    >
                                                        <Edit className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(hearing.id)}
                                                        className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-all duration-200"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                                                {hearing.court && (
                                                    <div className="flex items-center gap-2 text-slate-600">
                                                        <MapPin className="w-4 h-4" />
                                                        {hearing.court}
                                                    </div>
                                                )}
                                                {hearing.judgeName && (
                                                    <div className="flex items-center gap-2 text-slate-600">
                                                        <User className="w-4 h-4" />
                                                        {hearing.judgeName}
                                                    </div>
                                                )}
                                                {hearing.hearingType && (
                                                    <div className="flex items-center gap-2 text-slate-600">
                                                        <FileText className="w-4 h-4" />
                                                        {hearing.hearingType}
                                                    </div>
                                                )}
                                            </div>
                                            {hearing.notes && (
                                                <div className="mt-3 pt-3 border-t border-slate-200">
                                                    <p className="text-sm text-slate-600">{hearing.notes}</p>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Sidebar - Quick Stats */}
                    <div className="space-y-6">
                        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                            <h3 className="text-lg font-semibold text-slate-900 mb-4">Quick Stats</h3>
                            <div className="space-y-4">
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm text-slate-600">Today</span>
                                        <span className="text-2xl font-bold text-indigo-600">
                                            {hearings.filter(h =>
                                                new Date(h.hearingDate).toDateString() === new Date().toDateString()
                                            ).length}
                                        </span>
                                    </div>
                                    <div className="w-full bg-slate-200 rounded-full h-2">
                                        <div className="bg-indigo-600 h-2 rounded-full transition-all duration-300" style={{ width: '60%' }}></div>
                                    </div>
                                </div>
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm text-slate-600">Selected Date</span>
                                        <span className="text-2xl font-bold text-emerald-600">{filteredHearings.length}</span>
                                    </div>
                                    <div className="w-full bg-slate-200 rounded-full h-2">
                                        <div className="bg-emerald-600 h-2 rounded-full transition-all duration-300" style={{ width: '75%' }}></div>
                                    </div>
                                </div>
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm text-slate-600">Total</span>
                                        <span className="text-2xl font-bold text-slate-700">{hearings.length}</span>
                                    </div>
                                    <div className="w-full bg-slate-200 rounded-full h-2">
                                        <div className="bg-slate-600 h-2 rounded-full transition-all duration-300" style={{ width: '85%' }}></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Schedule/Edit Hearing Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900">
                                    {isEditing ? 'Edit Hearing' : 'Schedule Court Hearing'}
                                </h2>
                                <p className="text-sm text-gray-600">
                                    {isEditing ? 'Update hearing details' : 'Create a new court hearing or appointment'}
                                </p>
                            </div>
                            <button
                                onClick={() => {
                                    setIsModalOpen(false)
                                    resetForm()
                                }}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <X className="w-6 h-6 text-gray-600" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-6">
                            {/* Case and Client */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Case (Optional)
                                    </label>
                                    <select
                                        value={formData.caseId}
                                        onChange={(e) => setFormData({ ...formData, caseId: e.target.value })}
                                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                                    >
                                        <option value="">Select case</option>
                                        {cases.map(c => (
                                            <option key={c.id} value={c.id}>{c.title}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        Client Name
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.clientName}
                                        onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                                        placeholder="Client name"
                                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                                    />
                                </div>
                            </div>

                            {/* Hearing Title */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Hearing Title *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    placeholder="e.g., Final Arguments - Case Name"
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                                />
                            </div>

                            {/* Date and Time */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        Hearing Date *
                                    </label>
                                    <input
                                        type="date"
                                        required
                                        value={formData.hearingDate}
                                        onChange={(e) => setFormData({ ...formData, hearingDate: e.target.value })}
                                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        Start Time *
                                    </label>
                                    <input
                                        type="time"
                                        required
                                        value={formData.startTime}
                                        onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        Duration (minutes)
                                    </label>
                                    <input
                                        type="number"
                                        value={formData.duration}
                                        onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
                                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                                    />
                                </div>
                            </div>

                            {/* Location Details */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        State
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.state}
                                        onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                                        placeholder="State"
                                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        District
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.district}
                                        onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                                        placeholder="District"
                                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        Court Type
                                    </label>
                                    <select
                                        value={formData.courtType}
                                        onChange={(e) => setFormData({ ...formData, courtType: e.target.value })}
                                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                                    >
                                        <option value="">Select court type</option>
                                        <option value="Supreme Court">Supreme Court</option>
                                        <option value="High Court">High Court</option>
                                        <option value="District Court">District Court</option>
                                        <option value="Session Court">Session Court</option>
                                        <option value="Civil Court">Civil Court</option>
                                        <option value="Family Court">Family Court</option>
                                    </select>
                                </div>
                            </div>

                            {/* Court and Judge */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        Court Name
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.court}
                                        onChange={(e) => setFormData({ ...formData, court: e.target.value })}
                                        placeholder="Court name"
                                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        Judge Name
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.judgeName}
                                        onChange={(e) => setFormData({ ...formData, judgeName: e.target.value })}
                                        placeholder="Hon'ble Justice Name"
                                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                                    />
                                </div>
                            </div>

                            {/* Hearing Type, Priority, Status */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        Hearing Type
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.hearingType}
                                        onChange={(e) => setFormData({ ...formData, hearingType: e.target.value })}
                                        placeholder="e.g., Motion Hearing"
                                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        Priority
                                    </label>
                                    <select
                                        value={formData.priority}
                                        onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                                    >
                                        <option value="LOW">Low</option>
                                        <option value="MEDIUM">Medium</option>
                                        <option value="HIGH">High</option>
                                        <option value="URGENT">Urgent</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        Status
                                    </label>
                                    <select
                                        value={formData.status}
                                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                                    >
                                        <option value="SCHEDULED">Scheduled</option>
                                        <option value="COMPLETED">Completed</option>
                                        <option value="RESCHEDULED">Rescheduled</option>
                                        <option value="CANCELLED">Cancelled</option>
                                    </select>
                                </div>
                            </div>

                            {/* Notes */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Notes
                                </label>
                                <textarea
                                    value={formData.notes}
                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                    placeholder="Additional notes..."
                                    rows={3}
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                                />
                            </div>

                            {/* Action Buttons */}
                            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsModalOpen(false)
                                        resetForm()
                                    }}
                                    className="px-6 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-all duration-200"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all duration-200 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
                                >
                                    <CalendarIcon className="w-4 h-4" />
                                    {loading ? 'Saving...' : (isEditing ? 'Update Hearing' : 'Schedule Hearing')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
