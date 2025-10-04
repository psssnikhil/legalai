'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import {
  Home,
  FileText,
  Users,
  Settings,
  ChevronLeft,
  ChevronRight,
  Scale,
  Brain,
  BookOpen,
  MessageSquare,
  LogOut,
  User,
  Mic,
  Calendar,
  Briefcase
} from 'lucide-react'

const menuItems = [
  { name: 'Dashboard', icon: Home, href: '/', active: false },
  { name: 'AI Case Intake', icon: MessageSquare, href: '/ai-case-intake', active: false },
  { name: 'AI Case Assistant', icon: Brain, href: '/ai-case-assistant', active: false },
  { name: 'AI Drafting', icon: FileText, href: '/ai-drafting', active: false },
  { name: 'Cases', icon: Briefcase, href: '/cases', active: false },
  { name: 'Court Diary', icon: Calendar, href: '/court-diary', active: false },
  { name: 'Clients', icon: Users, href: '/clients', active: false },
  { name: 'Documents', icon: FileText, href: '/documents', active: false },
  { name: 'Legal Library', icon: BookOpen, href: '/legal-library', active: false },
  { name: 'Legal Library Chat', icon: MessageSquare, href: '/legal-library-chat', active: false },
]

const adminMenuItems = [
  { name: 'Company Settings', icon: Settings, href: '/company-settings', active: false },
]

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const { data: session } = useSession()

  const handleLogout = () => {
    signOut({ callbackUrl: '/auth/signin' })
  }

  return (
    <div className={`bg-white border-r border-gray-200 transition-all duration-300 ${collapsed ? 'w-16' : 'w-64'
      }`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          {!collapsed && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Scale className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-lg text-gray-900">Legal AI</span>
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="p-4 space-y-1 flex-1 overflow-y-auto">
        {menuItems.map((item) => (
          <Link
            key={item.name}
            href={item.href}
            className={`sidebar-item ${item.active ? 'active' : ''}`}
          >
            <item.icon className="w-5 h-5 flex-shrink-0" />
            {!collapsed && <span>{item.name}</span>}
          </Link>
        ))}

        {/* Admin Section */}
        {!collapsed && (
          <div className="pt-4 mt-4 border-t border-gray-200">
            <div className="px-2 mb-2">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Admin
              </span>
            </div>
            {adminMenuItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`sidebar-item ${item.active ? 'active' : ''}`}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                <span>{item.name}</span>
              </Link>
            ))}
          </div>
        )}
      </nav>

      {/* User Profile */}
      {!collapsed && (
        <div className="absolute bottom-4 left-4 right-4">
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                {session?.user?.image ? (
                  <img
                    src={session.user.image}
                    alt="Profile"
                    className="w-8 h-8 rounded-full"
                  />
                ) : (
                  <User className="w-4 h-4 text-blue-600" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {session?.user?.name || 'User'}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {session?.user?.email}
                </p>
              </div>
              <button
                onClick={handleLogout}
                className="p-1 hover:bg-gray-200 rounded transition-colors"
                title="Sign out"
              >
                <LogOut className="w-4 h-4 text-gray-500" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
