'use client'

import { Upload, FileText, Search, Users, Plus, Brain, UserPlus } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface QuickActionsProps {
  onUploadClick: () => void
}

export default function QuickActions({ onUploadClick }: QuickActionsProps) {
  const router = useRouter()

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
      onClick: () => router.push('/ai-case-intake'),
      color: 'bg-green-50 text-green-600'
    },
    {
      title: 'Legal Research',
      description: 'Search case law and precedents',
      icon: Search,
      onClick: () => router.push('/legal-library'),
      color: 'bg-purple-50 text-purple-600'
    },
    {
      title: 'AI Assistant',
      description: 'Get instant legal advice',
      icon: Brain,
      onClick: () => router.push('/ai-case-assistant'),
      color: 'bg-orange-50 text-orange-600'
    },
    {
      title: 'Add Client',
      description: 'Add new client to database',
      icon: UserPlus,
      onClick: () => router.push('/clients'),
      color: 'bg-indigo-50 text-indigo-600'
    },
    {
      title: 'Court Diary',
      description: 'Schedule hearings',
      icon: Plus,
      onClick: () => router.push('/court-diary'),
      color: 'bg-amber-50 text-amber-600'
    }
  ]

  return (
    <div className="card">
      <div className="p-4 sm:p-6 border-b border-gray-200">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900">Quick Actions</h3>
        <p className="text-xs sm:text-sm text-gray-600 mt-1">Common tasks and shortcuts</p>
      </div>

      <div className="p-4 sm:p-6">
        <div className="grid grid-cols-2 gap-2 sm:gap-3">
          {actions.map((action, index) => (
            <button
              key={index}
              onClick={action.onClick}
              className="p-3 sm:p-4 rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all text-left group"
            >
              <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg ${action.color} flex items-center justify-center mb-2 group-hover:scale-110 transition-transform`}>
                <action.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
              <h4 className="text-xs sm:text-sm font-medium text-gray-900 mb-1 truncate">{action.title}</h4>
              <p className="text-[10px] sm:text-xs text-gray-600 line-clamp-2">{action.description}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
