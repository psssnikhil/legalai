'use client'

import { useState } from 'react'
import { Calendar as CalendarIcon, Plus, Clock, MapPin, User, FileText, ChevronLeft, ChevronRight } from 'lucide-react'

interface Hearing {
    id: string
    time: string
    title: string
    case: string
    court: string
    judge: string
    type: string
    status: 'upcoming' | 'completed' | 'rescheduled'
}

export default function CourtDiaryPage() {
    const [currentDate, setCurrentDate] = useState(new Date())

    const hearings: Hearing[] = [
        {
            id: '1',
            time: '10:00 AM',
            title: 'Motion Hearing',
            case: 'Smith vs. Johnson',
            court: 'District Court, Room 301',
            judge: 'Hon. Justice Williams',
            type: 'Civil',
            status: 'upcoming'
        },
        {
            id: '2',
            time: '02:30 PM',
            title: 'Case Conference',
            case: 'Corporate Merger - ABC Ltd',
            court: 'High Court, Room 105',
            judge: 'Hon. Justice Brown',
            type: 'Corporate',
            status: 'upcoming'
        },
        {
            id: '3',
            time: '11:00 AM',
            title: 'Final Arguments',
            case: 'Employment Dispute #2024',
            court: 'Labour Court, Room 202',
            judge: 'Hon. Justice Davis',
            type: 'Employment',
            status: 'upcoming'
        }
    ]

    const upcomingDays = [
        { date: 'Oct 14', count: 3, day: 'Mon' },
        { date: 'Oct 15', count: 2, day: 'Tue' },
        { date: 'Oct 16', count: 0, day: 'Wed' },
        { date: 'Oct 17', count: 1, day: 'Thu' },
        { date: 'Oct 18', count: 4, day: 'Fri' },
        { date: 'Oct 19', count: 0, day: 'Sat' },
        { date: 'Oct 20', count: 0, day: 'Sun' }
    ]

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'upcoming': return 'bg-blue-100 text-blue-700'
            case 'completed': return 'bg-green-100 text-green-700'
            case 'rescheduled': return 'bg-yellow-100 text-yellow-700'
            default: return 'bg-gray-100 text-gray-700'
        }
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
                    <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
                        <Plus className="w-4 h-4" />
                        Add Hearing
                    </button>
                </div>

                {/* Calendar View */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Calendar */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Month Navigator */}
                        <div className="bg-white rounded-xl border border-gray-200 p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold text-gray-900">
                                    {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                                </h2>
                                <div className="flex gap-2">
                                    <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                                        <ChevronLeft className="w-5 h-5 text-gray-600" />
                                    </button>
                                    <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                                        <ChevronRight className="w-5 h-5 text-gray-600" />
                                    </button>
                                </div>
                            </div>

                            {/* Week View */}
                            <div className="grid grid-cols-7 gap-2">
                                {upcomingDays.map((day, index) => (
                                    <div
                                        key={index}
                                        className={`p-4 rounded-lg text-center cursor-pointer transition-colors ${index === 0
                                                ? 'bg-blue-50 border-2 border-blue-500'
                                                : 'bg-gray-50 hover:bg-gray-100 border border-gray-200'
                                            }`}
                                    >
                                        <div className="text-xs text-gray-500 mb-1">{day.day}</div>
                                        <div className="text-lg font-bold text-gray-900 mb-2">{day.date}</div>
                                        {day.count > 0 && (
                                            <div className="text-xs bg-blue-100 text-blue-700 rounded-full px-2 py-1">
                                                {day.count} {day.count === 1 ? 'hearing' : 'hearings'}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Today's Hearings */}
                        <div className="bg-white rounded-xl border border-gray-200 p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                <CalendarIcon className="w-5 h-5 text-blue-600" />
                                Today's Schedule - {currentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </h3>
                            <div className="space-y-4">
                                {hearings.map((hearing) => (
                                    <div
                                        key={hearing.id}
                                        className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                                    >
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="flex items-center gap-3">
                                                <div className="bg-blue-100 text-blue-700 rounded-lg px-3 py-2 font-semibold text-sm">
                                                    {hearing.time}
                                                </div>
                                                <div>
                                                    <h4 className="font-semibold text-gray-900">{hearing.title}</h4>
                                                    <p className="text-sm text-gray-600">{hearing.case}</p>
                                                </div>
                                            </div>
                                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(hearing.status)}`}>
                                                {hearing.status}
                                            </span>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                                            <div className="flex items-center gap-2 text-gray-600">
                                                <MapPin className="w-4 h-4" />
                                                {hearing.court}
                                            </div>
                                            <div className="flex items-center gap-2 text-gray-600">
                                                <User className="w-4 h-4" />
                                                {hearing.judge}
                                            </div>
                                            <div className="flex items-center gap-2 text-gray-600">
                                                <FileText className="w-4 h-4" />
                                                {hearing.type}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Quick Stats */}
                        <div className="bg-white rounded-xl border border-gray-200 p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Stats</h3>
                            <div className="space-y-4">
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm text-gray-600">Today</span>
                                        <span className="text-2xl font-bold text-blue-600">3</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div className="bg-blue-600 h-2 rounded-full" style={{ width: '60%' }}></div>
                                    </div>
                                </div>
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm text-gray-600">This Week</span>
                                        <span className="text-2xl font-bold text-green-600">10</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div className="bg-green-600 h-2 rounded-full" style={{ width: '75%' }}></div>
                                    </div>
                                </div>
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm text-gray-600">This Month</span>
                                        <span className="text-2xl font-bold text-purple-600">42</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div className="bg-purple-600 h-2 rounded-full" style={{ width: '85%' }}></div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Upcoming Reminders */}
                        <div className="bg-white rounded-xl border border-gray-200 p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Reminders</h3>
                            <div className="space-y-3">
                                <div className="flex items-start gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                                    <Clock className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">Motion filing due</p>
                                        <p className="text-xs text-gray-600">Smith vs. Johnson - 2 hours</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                    <Clock className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">Document submission</p>
                                        <p className="text-xs text-gray-600">Corporate Merger - Tomorrow</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                                    <Clock className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">Urgent: Hearing prep</p>
                                        <p className="text-xs text-gray-600">Employment Dispute - 30 min</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

