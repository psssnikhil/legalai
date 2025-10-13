'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
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
  Shield
} from 'lucide-react'
import StatsCard from '@/components/StatsCard'
import RecentActivity from '@/components/RecentActivity'
import QuickActions from '@/components/QuickActions'
import DocumentUpload from '@/components/DocumentUpload'

export default function Dashboard() {
  const { data: session } = useSession()
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000)
    return () => clearInterval(timer)
  }, [])

  const getGreeting = () => {
    const hour = currentTime.getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 17) return 'Good afternoon'
    return 'Good evening'
  }

  const stats = [
    {
      title: 'Total Cases',
      value: '47',
      change: '+12%',
      changeType: 'positive' as const,
      icon: FileText,
      color: 'blue',
      subtitle: 'vs last month'
    },
    {
      title: 'Active Cases',
      value: '23',
      change: '+5%',
      changeType: 'positive' as const,
      icon: Activity,
      color: 'green',
      subtitle: '5 urgent'
    },
    {
      title: 'Documents Analyzed',
      value: '156',
      change: '+23%',
      changeType: 'positive' as const,
      icon: Upload,
      color: 'purple',
      subtitle: 'AI processed'
    },
    {
      title: 'Win Rate',
      value: '87%',
      change: '+3%',
      changeType: 'positive' as const,
      icon: Award,
      color: 'orange',
      subtitle: 'success rate'
    }
  ]

  const aiInsights = [
    {
      title: 'High Priority Cases',
      description: '3 cases require immediate attention with upcoming deadlines',
      icon: AlertCircle,
      color: 'text-red-600 bg-red-50',
      action: 'Review Now',
      priority: 'urgent'
    },
    {
      title: 'AI Document Analysis',
      description: '12 new documents ready for AI-powered legal analysis',
      icon: Brain,
      color: 'text-blue-600 bg-blue-50',
      action: 'Analyze',
      priority: 'high'
    },
    {
      title: 'Case Law Updates',
      description: '5 relevant precedents found matching your active cases',
      icon: Sparkles,
      color: 'text-purple-600 bg-purple-50',
      action: 'View',
      priority: 'medium'
    },
    {
      title: 'Team Performance',
      description: 'Your team closed 8 cases this week with 92% success rate',
      icon: TrendingUp,
      color: 'text-green-600 bg-green-50',
      action: 'Details',
      priority: 'low'
    }
  ]

  const upcomingDeadlines = [
    { case: 'Smith vs. Johnson', type: 'Motion Filing', date: '2 days', status: 'urgent' },
    { case: 'Corporate Merger - ABC Ltd', type: 'Document Review', date: '5 days', status: 'upcoming' },
    { case: 'Employment Dispute #2024', type: 'Court Hearing', date: '1 week', status: 'scheduled' }
  ]

  const caseStatistics = [
    { label: 'Civil Litigation', count: 18, percentage: 38, color: 'bg-blue-500' },
    { label: 'Corporate Law', count: 12, percentage: 26, color: 'bg-green-500' },
    { label: 'Criminal Defense', count: 9, percentage: 19, color: 'bg-red-500' },
    { label: 'Family Law', count: 8, percentage: 17, color: 'bg-purple-500' }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-6 space-y-6 max-w-[1800px] mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {getGreeting()}, {session?.user?.name?.split(' ')[0] || 'User'}! 👋
            </h1>
            <p className="text-gray-600 mt-1">
              Here's your AI-powered legal practice overview for {currentTime.toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Schedule
            </button>
            <button className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Reports
            </button>
            <button
              onClick={() => setShowUploadModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              New Case
            </button>
          </div>
        </div>

        {/* AI Insights Banner */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold">AI-Powered Legal Intelligence</h2>
              <p className="text-blue-100 text-sm">Get instant insights and recommendations for your practice</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm">Cases Analyzed</p>
                  <p className="text-2xl font-bold mt-1">156</p>
                </div>
                <Brain className="w-8 h-8 text-blue-200" />
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm">AI Recommendations</p>
                  <p className="text-2xl font-bold mt-1">24</p>
                </div>
                <Target className="w-8 h-8 text-purple-200" />
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm">Success Probability</p>
                  <p className="text-2xl font-bold mt-1">87%</p>
                </div>
                <Shield className="w-8 h-8 text-blue-200" />
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <StatsCard key={index} {...stat} />
          ))}
        </div>

        {/* AI Insights Cards */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-yellow-500" />
              <h3 className="text-lg font-semibold text-gray-900">AI Insights & Recommendations</h3>
            </div>
            <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
              View All
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {aiInsights.map((insight, index) => (
              <div
                key={index}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${insight.color}`}>
                    <insight.icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 mb-1">{insight.title}</h4>
                    <p className="text-sm text-gray-600 mb-3">{insight.description}</p>
                    <button className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
                      {insight.action}
                      <ArrowUpRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Activity - 2 columns */}
          <div className="lg:col-span-2 space-y-6">
            <RecentActivity />

            {/* Case Distribution */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <PieChart className="w-5 h-5 text-blue-600" />
                  Case Distribution by Type
                </h3>
                <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                  View Details
                </button>
              </div>
              <div className="space-y-4">
                {caseStatistics.map((stat, index) => (
                  <div key={index}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">{stat.label}</span>
                      <span className="text-sm text-gray-600">{stat.count} cases ({stat.percentage}%)</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`${stat.color} h-2 rounded-full transition-all duration-500`}
                        style={{ width: `${stat.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Sidebar - 1 column */}
          <div className="space-y-6">
            <QuickActions onUploadClick={() => setShowUploadModal(true)} />

            {/* Upcoming Deadlines */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-orange-600" />
                  Upcoming Deadlines
                </h3>
              </div>
              <div className="space-y-3">
                {upcomingDeadlines.map((deadline, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg border ${deadline.status === 'urgent'
                        ? 'border-red-200 bg-red-50'
                        : deadline.status === 'upcoming'
                          ? 'border-yellow-200 bg-yellow-50'
                          : 'border-blue-200 bg-blue-50'
                      }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="text-sm font-semibold text-gray-900">{deadline.case}</h4>
                        <p className="text-xs text-gray-600 mt-1">{deadline.type}</p>
                      </div>
                      <span
                        className={`text-xs font-medium px-2 py-1 rounded ${deadline.status === 'urgent'
                            ? 'bg-red-100 text-red-700'
                            : deadline.status === 'upcoming'
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-blue-100 text-blue-700'
                          }`}
                      >
                        {deadline.date}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <button className="w-full mt-4 text-sm text-blue-600 hover:text-blue-700 font-medium">
                View All Deadlines
              </button>
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
