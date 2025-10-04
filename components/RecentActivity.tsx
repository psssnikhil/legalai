import { Clock, FileText, CheckCircle, AlertCircle, User } from 'lucide-react'

const activities = [
  {
    id: 1,
    type: 'document',
    title: 'Contract Review Completed',
    description: 'Smith vs. Johnson contract analysis finished',
    time: '2 hours ago',
    status: 'completed',
    user: 'Sarah Wilson'
  },
  {
    id: 2,
    type: 'case',
    title: 'New Case Filed',
    description: 'Employment dispute case #2024-001',
    time: '4 hours ago',
    status: 'pending',
    user: 'Mike Chen'
  },
  {
    id: 3,
    type: 'document',
    title: 'Legal Research Updated',
    description: 'Updated precedents for patent case',
    time: '6 hours ago',
    status: 'completed',
    user: 'Emily Davis'
  },
  {
    id: 4,
    type: 'alert',
    title: 'Deadline Reminder',
    description: 'Motion filing due in 2 days',
    time: '8 hours ago',
    status: 'urgent',
    user: 'System'
  },
  {
    id: 5,
    type: 'document',
    title: 'Document Uploaded',
    description: 'New evidence files added to case #2024-002',
    time: '1 day ago',
    status: 'completed',
    user: 'Alex Rodriguez'
  }
]

export default function RecentActivity() {
  const getIcon = (type: string, status: string) => {
    if (type === 'document') return <FileText className="w-4 h-4" />
    if (type === 'case') return <CheckCircle className="w-4 h-4" />
    if (type === 'alert') return <AlertCircle className="w-4 h-4" />
    return <Clock className="w-4 h-4" />
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-50'
      case 'pending': return 'text-yellow-600 bg-yellow-50'
      case 'urgent': return 'text-red-600 bg-red-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  return (
    <div className="card">
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
        <p className="text-sm text-gray-600 mt-1">Latest updates from your team</p>
      </div>
      
      <div className="p-6">
        <div className="space-y-4">
          {activities.map((activity) => (
            <div key={activity.id} className="flex items-start gap-3">
              <div className={`p-2 rounded-lg ${getStatusColor(activity.status)}`}>
                {getIcon(activity.type, activity.status)}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium text-gray-900 truncate">
                    {activity.title}
                  </h4>
                  <span className="text-xs text-gray-500">{activity.time}</span>
                </div>
                <p className="text-sm text-gray-600 mt-1">{activity.description}</p>
                <div className="flex items-center gap-1 mt-2">
                  <User className="w-3 h-3 text-gray-400" />
                  <span className="text-xs text-gray-500">{activity.user}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <button className="w-full mt-4 text-sm text-primary-600 hover:text-primary-700 font-medium">
          View all activity
        </button>
      </div>
    </div>
  )
}
