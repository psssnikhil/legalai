import { Upload, FileText, Search, Users, Plus, Brain } from 'lucide-react'

interface QuickActionsProps {
  onUploadClick: () => void
}

export default function QuickActions({ onUploadClick }: QuickActionsProps) {
  const actions = [
    {
      title: 'Upload Document',
      description: 'Analyze legal documents with AI',
      icon: Upload,
      onClick: onUploadClick,
      color: 'bg-blue-50 text-blue-600'
    },
    {
      title: 'Create Case',
      description: 'Start a new case file',
      icon: FileText,
      onClick: () => {},
      color: 'bg-green-50 text-green-600'
    },
    {
      title: 'Legal Research',
      description: 'Search case law and precedents',
      icon: Search,
      onClick: () => {},
      color: 'bg-purple-50 text-purple-600'
    },
    {
      title: 'AI Assistant',
      description: 'Get instant legal advice',
      icon: Brain,
      onClick: () => {},
      color: 'bg-orange-50 text-orange-600'
    },
    {
      title: 'Add Team Member',
      description: 'Invite colleagues to collaborate',
      icon: Users,
      onClick: () => {},
      color: 'bg-indigo-50 text-indigo-600'
    },
    {
      title: 'Quick Add',
      description: 'Add notes or tasks',
      icon: Plus,
      onClick: () => {},
      color: 'bg-gray-50 text-gray-600'
    }
  ]

  return (
    <div className="card">
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
        <p className="text-sm text-gray-600 mt-1">Common tasks and shortcuts</p>
      </div>
      
      <div className="p-6">
        <div className="grid grid-cols-2 gap-3">
          {actions.map((action, index) => (
            <button
              key={index}
              onClick={action.onClick}
              className="p-4 rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all text-left group"
            >
              <div className={`w-8 h-8 rounded-lg ${action.color} flex items-center justify-center mb-2 group-hover:scale-110 transition-transform`}>
                <action.icon className="w-4 h-4" />
              </div>
              <h4 className="text-sm font-medium text-gray-900 mb-1">{action.title}</h4>
              <p className="text-xs text-gray-600">{action.description}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
