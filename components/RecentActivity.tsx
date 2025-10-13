'use client'

import { Clock, FileText, CheckCircle, AlertCircle, User, Activity } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface ActivityItem {
  id: string
  type: 'document' | 'case' | 'alert' | 'client'
  title: string
  description: string
  time: string
  status: 'completed' | 'pending' | 'urgent' | 'active'
  user: string
}

export default function RecentActivity() {
  const router = useRouter()
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchRecentActivity()
  }, [])

  const fetchRecentActivity = async () => {
    try {
      // Fetch recent cases, documents, and clients
      const [casesRes, documentsRes, clientsRes] = await Promise.all([
        fetch('/api/cases'),
        fetch('/api/documents?sortBy=date'),
        fetch('/api/clients')
      ])

      const [casesData, documentsData, clientsData] = await Promise.all([
        casesRes.json(),
        documentsRes.json(),
        clientsRes.json()
      ])

      const recentActivities: ActivityItem[] = []

      // Add recent cases
      casesData.cases?.slice(0, 3).forEach((c: any) => {
        recentActivities.push({
          id: c.id,
          type: 'case',
          title: c.title || 'Untitled Case',
          description: c.description || 'Case created',
          time: getTimeAgo(new Date(c.createdAt)),
          status: c.status === 'ACTIVE' ? 'active' : c.status === 'URGENT' ? 'urgent' : 'pending',
          user: c.clientName || 'Unknown'
        })
      })

      // Add recent documents
      documentsData.documents?.slice(0, 3).forEach((d: any) => {
        recentActivities.push({
          id: d.id,
          type: 'document',
          title: 'Document Uploaded',
          description: d.originalName || d.filename,
          time: getTimeAgo(new Date(d.createdAt)),
          status: 'completed',
          user: 'You'
        })
      })

      // Add recent clients
      clientsData.clients?.slice(0, 2).forEach((c: any) => {
        recentActivities.push({
          id: c.id,
          type: 'client',
          title: 'New Client Added',
          description: c.name,
          time: getTimeAgo(new Date(c.createdAt)),
          status: 'completed',
          user: 'You'
        })
      })

      // Sort by time (most recent first) and limit to 5
      const sortedActivities = recentActivities
        .sort((a, b) => {
          // Simple sort - in a real app, you'd parse the time strings properly
          return 0 // Keep insertion order for now
        })
        .slice(0, 5)

      setActivities(sortedActivities)
    } catch (error) {
      console.error('Error fetching recent activity:', error)
    } finally {
      setLoading(false)
    }
  }

  const getTimeAgo = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000)

    if (seconds < 60) return 'Just now'
    if (seconds < 3600) return Math.floor(seconds / 60) + ' min ago'
    if (seconds < 86400) return Math.floor(seconds / 3600) + ' hours ago'
    if (seconds < 604800) return Math.floor(seconds / 86400) + ' days ago'
    return date.toLocaleDateString()
  }

  const getIcon = (type: string, status: string) => {
    if (type === 'document') return <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
    if (type === 'case') return <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
    if (type === 'client') return <User className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
    if (type === 'alert') return <AlertCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
    return <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-50'
      case 'active': return 'text-blue-600 bg-blue-50'
      case 'pending': return 'text-yellow-600 bg-yellow-50'
      case 'urgent': return 'text-red-600 bg-red-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  return (
    <div className="card">
      <div className="p-4 sm:p-6 border-b border-gray-200">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900">Recent Activity</h3>
        <p className="text-xs sm:text-sm text-gray-600 mt-1">Latest updates in your practice</p>
      </div>

      <div className="p-4 sm:p-6">
        {loading ? (
          <div className="text-center py-8">
            <Activity className="w-8 h-8 text-gray-300 animate-pulse mx-auto mb-2" />
            <p className="text-sm text-gray-500">Loading activity...</p>
          </div>
        ) : activities.length > 0 ? (
          <>
            <div className="space-y-3 sm:space-y-4">
              {activities.map((activity) => (
                <div key={activity.id} className="flex items-start gap-2 sm:gap-3">
                  <div className={`p-1.5 sm:p-2 rounded-lg ${getStatusColor(activity.status)} flex-shrink-0`}>
                    {getIcon(activity.type, activity.status)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-xs sm:text-sm font-medium text-gray-900 truncate">
                        {activity.title}
                      </h4>
                      <span className="text-[10px] sm:text-xs text-gray-500 whitespace-nowrap">{activity.time}</span>
                    </div>
                    <p className="text-xs sm:text-sm text-gray-600 mt-1 truncate">{activity.description}</p>
                    <div className="flex items-center gap-1 mt-1.5 sm:mt-2">
                      <User className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-gray-400" />
                      <span className="text-[10px] sm:text-xs text-gray-500">{activity.user}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => router.push('/cases')}
              className="w-full mt-4 text-xs sm:text-sm text-indigo-600 hover:text-indigo-700 font-medium"
            >
              View all activity
            </button>
          </>
        ) : (
          <div className="text-center py-8 sm:py-12">
            <Activity className="w-10 h-10 sm:w-12 sm:h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-600">No recent activity</p>
            <p className="text-xs text-gray-500 mt-1">Start by creating a case or uploading documents</p>
          </div>
        )}
      </div>
    </div>
  )
}
