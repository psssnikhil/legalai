'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import {
  Plus,
  Upload,
  Search,
  Filter,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle,
  AlertCircle,
  FileText,
  Users,
  Activity,
  Brain,
  Sparkles,
  Target,
  Award,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  PieChart,
  Zap,
  Shield,
  Loader2
} from 'lucide-react'
import StatsCard from '@/components/StatsCard'
import RecentActivity from '@/components/RecentActivity'
import QuickActions from '@/components/QuickActions'
import DocumentUpload from '@/components/DocumentUpload'

interface DashboardData {
  cases: any[]
  clients: any[]
  documents: any[]
  hearings: any[]
}

export default function Dashboard() {
  const { data: session } = useSession()
  const router = useRouter()
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [loading, setLoading] = useState(true)
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    cases: [],
    clients: [],
    documents: [],
    hearings: []
  })

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    setLoading(true)
    try {
      console.log('Fetching dashboard data...')

      // Fetch all data in parallel
      const [casesRes, clientsRes, documentsRes, hearingsRes] = await Promise.all([
        fetch('/api/cases'),
        fetch('/api/clients'),
        fetch('/api/documents?sortBy=date'),
        fetch('/api/hearings?date=' + new Date().toISOString().split('T')[0])
      ])

      const [casesData, clientsData, documentsData, hearingsData] = await Promise.all([
        casesRes.json(),
        clientsRes.json(),
        documentsRes.json(),
        hearingsRes.json()
      ])

      console.log('Dashboard data fetched:', {
        cases: casesData.cases?.length || 0,
        clients: clientsData.clients?.length || 0,
        documents: documentsData.documents?.length || 0,
        hearings: hearingsData.hearings?.length || 0
      })

      setDashboardData({
        cases: casesData.cases || [],
        clients: clientsData.clients || [],
        documents: documentsData.documents || [],
        hearings: hearingsData.hearings || []
      })
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getGreeting = () => {
    const hour = currentTime.getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 17) return 'Good afternoon'
    return 'Good evening'
  }

  // Calculate stats from real data
  const totalCases = dashboardData.cases.length
  const activeCases = dashboardData.cases.filter(c => c.status === 'ACTIVE').length
  const urgentCases = dashboardData.cases.filter(c => c.priority === 'HIGH').length
  const closedCases = dashboardData.cases.filter(c => c.status === 'CLOSED').length
  const totalDocuments = dashboardData.documents.length
  const totalClients = dashboardData.clients.length
  const winRate = closedCases > 0 ? Math.round((closedCases / totalCases) * 100) : 0

  const stats = [
    {
      title: 'Total Cases',
      value: totalCases.toString(),
      change: totalCases > 0 ? '+' + Math.round((totalCases / Math.max(totalCases - 5, 1)) * 100 - 100) + '%' : '0%',
      changeType: 'positive' as const,
      icon: FileText,
      color: 'blue',
      subtitle: `${totalClients} clients`
    },
    {
      title: 'Active Cases',
      value: activeCases.toString(),
      change: urgentCases > 0 ? urgentCases + ' urgent' : 'No urgent',
      changeType: urgentCases > 0 ? 'neutral' as const : 'positive' as const,
      icon: Activity,
      color: 'green',
      subtitle: 'in progress'
    },
    {
      title: 'Documents',
      value: totalDocuments.toString(),
      change: totalDocuments > 0 ? 'AI processed' : 'None yet',
      changeType: 'positive' as const,
      icon: Upload,
      color: 'purple',
      subtitle: 'uploaded'
    },
    {
      title: 'Success Rate',
      value: winRate + '%',
      change: closedCases + ' closed',
      changeType: 'positive' as const,
      icon: Award,
      color: 'orange',
      subtitle: 'completion rate'
    }
  ]

  // Calculate AI insights from real data
  const pendingCases = dashboardData.cases.filter(c => c.status === 'PENDING').length
  const recentDocuments = dashboardData.documents.slice(0, 10).length

  const aiInsights = [
    {
      title: 'High Priority Cases',
      description: urgentCases > 0
        ? `${urgentCases} case${urgentCases !== 1 ? 's' : ''} require immediate attention`
        : 'No urgent cases at the moment',
      icon: AlertCircle,
      color: urgentCases > 0 ? 'text-rose-600 bg-rose-50' : 'text-emerald-600 bg-emerald-50',
      action: 'Review Now',
      priority: urgentCases > 0 ? 'urgent' : 'low',
      onClick: () => router.push('/cases')
    },
    {
      title: 'Document Analysis',
      description: `${totalDocuments} document${totalDocuments !== 1 ? 's' : ''} uploaded and ready for AI analysis`,
      icon: Brain,
      color: 'text-indigo-600 bg-indigo-50',
      action: 'Analyze',
      priority: 'high',
      onClick: () => router.push('/documents')
    },
    {
      title: 'Active Clients',
      description: `Managing ${totalClients} client${totalClients !== 1 ? 's' : ''} with ${activeCases} active case${activeCases !== 1 ? 's' : ''}`,
      icon: Users,
      color: 'text-purple-600 bg-purple-50',
      action: 'View',
      priority: 'medium',
      onClick: () => router.push('/clients')
    },
    {
      title: 'Case Performance',
      description: closedCases > 0
        ? `${closedCases} case${closedCases !== 1 ? 's' : ''} successfully closed with ${winRate}% completion rate`
        : 'No closed cases yet',
      icon: TrendingUp,
      color: 'text-emerald-600 bg-emerald-50',
      action: 'Details',
      priority: 'low',
      onClick: () => router.push('/cases')
    }
  ]

  // Calculate upcoming deadlines from hearings
  const upcomingHearings = dashboardData.hearings
    .filter(h => new Date(h.hearingDate) >= new Date())
    .sort((a, b) => new Date(a.hearingDate).getTime() - new Date(b.hearingDate).getTime())
    .slice(0, 5)

  const upcomingDeadlines = upcomingHearings.map(hearing => {
    const daysUntil = Math.ceil((new Date(hearing.hearingDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    let status: 'urgent' | 'upcoming' | 'scheduled' = 'scheduled'
    let dateText = ''

    if (daysUntil === 0) {
      dateText = 'Today'
      status = 'urgent'
    } else if (daysUntil === 1) {
      dateText = 'Tomorrow'
      status = 'urgent'
    } else if (daysUntil <= 3) {
      dateText = `${daysUntil} days`
      status = 'urgent'
    } else if (daysUntil <= 7) {
      dateText = `${daysUntil} days`
      status = 'upcoming'
    } else {
      dateText = `${Math.ceil(daysUntil / 7)} week${Math.ceil(daysUntil / 7) !== 1 ? 's' : ''}`
      status = 'scheduled'
    }

    return {
      case: hearing.title || hearing.clientName || 'Unnamed Case',
      type: hearing.hearingType || 'Court Hearing',
      date: dateText,
      status
    }
  })

  // Calculate case statistics from real data
  const caseTypeGroups = dashboardData.cases.reduce((acc, c) => {
    const type = c.caseType || 'Other'
    acc[type] = (acc[type] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const caseStatistics = Object.entries(caseTypeGroups)
    .map(([label, count]): { label: string; count: number; percentage: number; color: string } => ({
      label,
      count: count as number,
      percentage: totalCases > 0 ? Math.round(((count as number) / totalCases) * 100) : 0,
      color: ['bg-indigo-600', 'bg-emerald-600', 'bg-rose-600', 'bg-amber-600', 'bg-purple-600', 'bg-blue-600'][
        Object.keys(caseTypeGroups).indexOf(label) % 6
      ]
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6)

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mx-auto mb-4" />
          <p className="text-slate-600 text-lg">Loading your dashboard...</p>
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
              {getGreeting()}, <span className="text-gradient-indigo">{session?.user?.name?.split(' ')[0] || 'User'}</span>! 👋
            </h1>
            <p className="text-base sm:text-lg text-slate-600 font-medium">
              {currentTime.toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
                year: 'numeric'
              })}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => router.push('/court-diary')}
              className="group px-4 sm:px-5 py-2.5 bg-white/80 backdrop-blur-sm border border-slate-200 rounded-xl hover:bg-white hover:border-slate-300 hover:shadow-lg transition-all duration-300 flex items-center gap-2 text-sm sm:text-base font-semibold text-slate-700 hover:text-slate-900"
            >
              <Calendar className="w-4 h-4 sm:w-5 sm:h-5 group-hover:scale-110 transition-transform" />
              <span className="hidden sm:inline">Schedule</span>
            </button>
            <button
              onClick={() => router.push('/cases')}
              className="group px-4 sm:px-5 py-2.5 bg-white/80 backdrop-blur-sm border border-slate-200 rounded-xl hover:bg-white hover:border-slate-300 hover:shadow-lg transition-all duration-300 flex items-center gap-2 text-sm sm:text-base font-semibold text-slate-700 hover:text-slate-900"
            >
              <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 group-hover:scale-110 transition-transform" />
              <span className="hidden sm:inline">Reports</span>
            </button>
            <button
              onClick={() => setShowUploadModal(true)}
              className="group px-4 sm:px-6 py-2.5 legal-gradient-indigo text-white rounded-xl hover:shadow-2xl hover:shadow-indigo-500/30 transition-all duration-300 flex items-center gap-2 text-sm sm:text-base font-bold hover:scale-105"
            >
              <Plus className="w-4 h-4 sm:w-5 sm:h-5 group-hover:rotate-90 transition-transform duration-300" />
              New Case
            </button>
          </div>
        </div>

        {/* Premium AI Insights Banner */}
        <div className="relative overflow-hidden animated-gradient rounded-3xl p-6 sm:p-8 lg:p-10 text-white shadow-2xl glow">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm shimmer">
                <Sparkles className="w-6 h-6 sm:w-7 sm:h-7" />
              </div>
              <div>
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight">AI-Powered Legal Intelligence</h2>
                <p className="text-indigo-100 text-sm sm:text-base font-medium mt-1">Real-time insights powered by advanced AI</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              <div className="group bg-white/15 backdrop-blur-md rounded-2xl p-5 sm:p-6 border border-white/30 hover:bg-white/20 hover:scale-105 transition-all duration-300 cursor-pointer">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white/80 text-xs sm:text-sm font-semibold uppercase tracking-wide">Cases Managed</p>
                    <p className="text-3xl sm:text-4xl lg:text-5xl font-black mt-2 mb-1">{totalCases}</p>
                    <p className="text-indigo-200 text-sm font-medium">{activeCases} active now</p>
                  </div>
                  <div className="p-3 bg-white/20 rounded-xl group-hover:scale-110 transition-transform">
                    <Brain className="w-8 h-8 sm:w-10 sm:h-10" />
                  </div>
                </div>
              </div>
              <div className="group bg-white/15 backdrop-blur-md rounded-2xl p-5 sm:p-6 border border-white/30 hover:bg-white/20 hover:scale-105 transition-all duration-300 cursor-pointer">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white/80 text-xs sm:text-sm font-semibold uppercase tracking-wide">Documents Analyzed</p>
                    <p className="text-3xl sm:text-4xl lg:text-5xl font-black mt-2 mb-1">{totalDocuments}</p>
                    <p className="text-indigo-200 text-sm font-medium">AI processed</p>
                  </div>
                  <div className="p-3 bg-white/20 rounded-xl group-hover:scale-110 transition-transform">
                    <Target className="w-8 h-8 sm:w-10 sm:h-10" />
                  </div>
                </div>
              </div>
              <div className="group bg-white/15 backdrop-blur-md rounded-2xl p-5 sm:p-6 border border-white/30 hover:bg-white/20 hover:scale-105 transition-all duration-300 cursor-pointer sm:col-span-2 lg:col-span-1">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white/80 text-xs sm:text-sm font-semibold uppercase tracking-wide">Success Rate</p>
                    <p className="text-3xl sm:text-4xl lg:text-5xl font-black mt-2 mb-1">{winRate}%</p>
                    <p className="text-indigo-200 text-sm font-medium">{closedCases} cases closed</p>
                  </div>
                  <div className="p-3 bg-white/20 rounded-xl group-hover:scale-110 transition-transform">
                    <Shield className="w-8 h-8 sm:w-10 sm:h-10" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {stats.map((stat, index) => (
            <StatsCard key={index} {...stat} />
          ))}
        </div>

        {/* Premium AI Insights Cards */}
        <div className="premium-card p-6 sm:p-8">
          <div className="flex items-center justify-between mb-6 sm:mb-8">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-gradient-to-br from-amber-500/10 to-orange-500/10 rounded-xl">
                <Zap className="w-6 h-6 sm:w-7 sm:h-7 text-amber-600" />
              </div>
              <div>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">AI Insights & Recommendations</h3>
                <p className="text-sm text-slate-600 font-medium">Intelligent suggestions for your practice</p>
              </div>
            </div>
            <button
              onClick={() => router.push('/cases')}
              className="group px-4 py-2 text-sm font-bold text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-xl transition-all duration-300 flex items-center gap-2"
            >
              View All
              <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
            {aiInsights.map((insight, index) => (
              <button
                key={index}
                onClick={insight.onClick}
                className="group relative bg-gradient-to-br from-slate-50 to-slate-100/50 border border-slate-200 rounded-2xl p-5 sm:p-6 hover:shadow-xl hover:shadow-slate-300/30 hover:border-slate-300 hover:-translate-y-1 transition-all duration-300 text-left w-full overflow-hidden"
              >
                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/0 to-purple-500/0 group-hover:from-indigo-500/5 group-hover:to-purple-500/5 transition-all duration-300"></div>

                <div className="relative z-10 flex items-start gap-4">
                  <div className={`p-3 rounded-2xl ${insight.color} group-hover:scale-110 transition-transform duration-300 flex-shrink-0`}>
                    <insight.icon className="w-6 h-6 sm:w-7 sm:h-7" strokeWidth={2.5} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-black text-slate-900 mb-2 text-base sm:text-lg tracking-tight">{insight.title}</h4>
                    <p className="text-sm text-slate-600 mb-4 font-medium leading-relaxed">{insight.description}</p>
                    <span className="inline-flex items-center gap-2 text-sm text-indigo-600 group-hover:text-indigo-700 font-bold group-hover:gap-3 transition-all">
                      {insight.action}
                      <ArrowUpRight className="w-4 h-4" strokeWidth={3} />
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Recent Activity - 2 columns */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            <RecentActivity />

            {/* Premium Case Distribution */}
            <div className="premium-card p-6 sm:p-8">
              <div className="flex items-center justify-between mb-6 sm:mb-8">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-xl">
                    <PieChart className="w-6 h-6 sm:w-7 sm:h-7 text-indigo-600" />
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Case Distribution</h3>
                </div>
                <button
                  onClick={() => router.push('/cases')}
                  className="group px-4 py-2 text-sm font-bold text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-xl transition-all duration-300 flex items-center gap-2"
                >
                  View Details
                  <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </button>
              </div>
              {caseStatistics.length > 0 ? (
                <div className="space-y-5 sm:space-y-6">
                  {caseStatistics.map((stat, index) => (
                    <div key={index} className="group">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-bold text-slate-900">{stat.label}</span>
                        <span className="text-sm font-bold text-slate-600">{stat.count} case{stat.count !== 1 ? 's' : ''} <span className="text-indigo-600">({stat.percentage}%)</span></span>
                      </div>
                      <div className="relative w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                        <div
                          className={`${stat.color} h-3 rounded-full transition-all duration-700 ease-out relative overflow-hidden`}
                          style={{ width: `${stat.percentage}%` }}
                        >
                          <div className="absolute inset-0 shimmer"></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 sm:py-16">
                  <div className="inline-flex p-5 bg-gradient-to-br from-slate-100 to-slate-50 rounded-3xl mb-4">
                    <PieChart className="w-12 h-12 sm:w-14 sm:h-14 text-slate-400" />
                  </div>
                  <p className="text-base font-bold text-slate-900 mb-1">No cases yet</p>
                  <p className="text-sm text-slate-600">Start by adding your first case</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Sidebar - 1 column */}
          <div className="space-y-4 sm:space-y-6">
            <QuickActions onUploadClick={() => setShowUploadModal(true)} />

            {/* Premium Upcoming Deadlines */}
            <div className="premium-card p-6 sm:p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2.5 bg-gradient-to-br from-amber-500/10 to-orange-500/10 rounded-xl">
                  <Clock className="w-6 h-6 sm:w-7 sm:h-7 text-amber-600" />
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Upcoming Deadlines</h3>
              </div>
              {upcomingDeadlines.length > 0 ? (
                <>
                  <div className="space-y-3">
                    {upcomingDeadlines.map((deadline, index) => (
                      <div
                        key={index}
                        className={`group p-4 rounded-xl border-2 transition-all duration-300 cursor-pointer hover:shadow-lg hover:-translate-y-0.5 ${deadline.status === 'urgent'
                          ? 'border-rose-200 bg-gradient-to-br from-rose-50 to-rose-100/50 hover:border-rose-300'
                          : deadline.status === 'upcoming'
                            ? 'border-amber-200 bg-gradient-to-br from-amber-50 to-amber-100/50 hover:border-amber-300'
                            : 'border-indigo-200 bg-gradient-to-br from-indigo-50 to-indigo-100/50 hover:border-indigo-300'
                          }`}
                        onClick={() => router.push('/court-diary')}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-black text-slate-900 truncate mb-1.5">{deadline.case}</h4>
                            <p className="text-xs font-semibold text-slate-600">{deadline.type}</p>
                          </div>
                          <span
                            className={`text-xs font-black px-3 py-1.5 rounded-lg whitespace-nowrap flex-shrink-0 ${deadline.status === 'urgent'
                              ? 'bg-rose-600 text-white'
                              : deadline.status === 'upcoming'
                                ? 'bg-amber-600 text-white'
                                : 'bg-indigo-600 text-white'
                              }`}
                          >
                            {deadline.date}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => router.push('/court-diary')}
                    className="w-full mt-5 py-3 text-sm font-bold text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-xl transition-all duration-300 flex items-center justify-center gap-2"
                  >
                    View All Deadlines
                    <ArrowUpRight className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <div className="text-center py-12">
                  <div className="inline-flex p-5 bg-gradient-to-br from-amber-100 to-amber-50 rounded-3xl mb-4">
                    <Clock className="w-12 h-12 text-amber-600" />
                  </div>
                  <p className="text-base font-bold text-slate-900 mb-1">No upcoming deadlines</p>
                  <p className="text-sm text-slate-600 mb-4">Schedule hearings in Court Diary</p>
                  <button
                    onClick={() => router.push('/court-diary')}
                    className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-xl transition-all duration-300"
                  >
                    Go to Court Diary
                    <ArrowUpRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Document Upload Modal */}
        {showUploadModal && (
          <DocumentUpload onClose={() => setShowUploadModal(false)} />
        )}
      </div>
    </div>
  )
}
