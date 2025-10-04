'use client'

import { useState } from 'react'
import { 
  Plus, 
  Upload, 
  Search, 
  Filter,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  FileText,
  Users,
  DollarSign,
  Activity
} from 'lucide-react'
import StatsCard from '@/components/StatsCard'
import RecentActivity from '@/components/RecentActivity'
import QuickActions from '@/components/QuickActions'
import DocumentUpload from '@/components/DocumentUpload'

export default function Dashboard() {
  const [showUploadModal, setShowUploadModal] = useState(false)

  const stats = [
    {
      title: 'Total Cases',
      value: '1,247',
      change: '+12%',
      changeType: 'positive' as const,
      icon: FileText,
      color: 'blue'
    },
    {
      title: 'Active Cases',
      value: '89',
      change: '+5%',
      changeType: 'positive' as const,
      icon: Activity,
      color: 'green'
    },
    {
      title: 'Documents Processed',
      value: '3,456',
      change: '+23%',
      changeType: 'positive' as const,
      icon: Upload,
      color: 'purple'
    },
    {
      title: 'Team Members',
      value: '24',
      change: '+2',
      changeType: 'positive' as const,
      icon: Users,
      color: 'orange'
    }
  ]

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Welcome back! Here's what's happening with your cases.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="btn-secondary">
            <Search className="w-4 h-4 mr-2" />
            Search
          </button>
          <button className="btn-secondary">
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </button>
          <button 
            onClick={() => setShowUploadModal(true)}
            className="btn-primary"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Case
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <StatsCard key={index} {...stat} />
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className="lg:col-span-2">
          <RecentActivity />
        </div>

        {/* Quick Actions */}
        <div>
          <QuickActions onUploadClick={() => setShowUploadModal(true)} />
        </div>
      </div>

      {/* Document Upload Modal */}
      {showUploadModal && (
        <DocumentUpload onClose={() => setShowUploadModal(false)} />
      )}
    </div>
  )
}
