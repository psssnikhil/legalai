'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
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
  Calendar,
  Briefcase,
  Mic
} from 'lucide-react'

const menuItems = [
  { name: 'Dashboard', icon: Home, href: '/' },
  { name: 'AI Case Intake', icon: MessageSquare, href: '/ai-case-intake' },
  { name: 'AI Case Assistant', icon: Brain, href: '/ai-case-assistant' },
  { name: 'AI Drafting', icon: FileText, href: '/ai-drafting' },
  { name: 'Dictation', icon: Mic, href: '/dictation' },
  { name: 'Cases', icon: Briefcase, href: '/cases' },
  { name: 'Court Diary', icon: Calendar, href: '/court-diary' },
  { name: 'Clients', icon: Users, href: '/clients' },
  { name: 'Documents', icon: FileText, href: '/documents' },
  { name: 'Legal Library', icon: BookOpen, href: '/legal-library' },
  { name: 'Legal Research', icon: Scale, href: '/legal-library-chat' },
]

const adminMenuItems = [
  { name: 'Company Settings', icon: Settings, href: '/company-settings' },
]

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const { data: session } = useSession()
  const pathname = usePathname()

  const handleLogout = () => {
    signOut({ callbackUrl: '/auth/signin' })
  }

  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === '/'
    }
    return pathname?.startsWith(href)
  }

  return (
    <div className={`relative bg-white border-r border-gray-200 transition-all duration-300 flex flex-col h-screen ${collapsed ? 'w-16' : 'w-64'}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex-shrink-0">
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
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {menuItems.map((item) => (
          <Link
            key={item.name}
            href={item.href}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${isActive(item.href)
              ? 'bg-blue-50 text-blue-700 font-medium'
              : 'text-gray-700 hover:bg-gray-50'
              }`}
          >
            <item.icon className="w-5 h-5 flex-shrink-0" />
            {!collapsed && <span className="truncate">{item.name}</span>}
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
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${isActive(item.href)
                  ? 'bg-blue-50 text-blue-700 font-medium'
                  : 'text-gray-700 hover:bg-gray-50'
                  }`}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                <span className="truncate">{item.name}</span>
              </Link>
            ))}
          </div>
        )}
      </nav>

      {/* User Profile */}
      {!collapsed && (
        <div className="p-4 flex-shrink-0 border-t border-gray-200">
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
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
                  {session?.user?.name || 'Admin User'}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {session?.user?.email || 'admin@legalai.com'}
                </p>
              </div>
              <button
                onClick={handleLogout}
                className="p-1 hover:bg-gray-200 rounded transition-colors flex-shrink-0"
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
