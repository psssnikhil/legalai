'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import {
  Home,
  Users,
  Settings,
  ChevronLeft,
  ChevronRight,
  Scale,
  LogOut,
  User,
  Calendar,
  Briefcase,
  Mic,
  Search,
  ClipboardList
} from 'lucide-react'

const menuItems = [
  { name: 'Dashboard', icon: Home, href: '/' },
  { name: 'Cases', icon: Briefcase, href: '/cases' },
  { name: 'Clients', icon: Users, href: '/clients' },
  { name: 'Court Diary', icon: Calendar, href: '/court-diary' },
  { name: 'eCourts', icon: Search, href: '/ecourts' },
  { name: 'Intake', icon: ClipboardList, href: '/intake' },
  { name: 'Dictation', icon: Mic, href: '/dictation' },
  { name: 'Settings', icon: Settings, href: '/settings' },
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
    <div className={`relative bg-white border-r border-slate-200/60 transition-all duration-300 flex flex-col h-screen shadow-xl ${collapsed ? 'w-20' : 'w-72'}`}>
      {/* Premium Header */}
      <div className="p-5 border-b border-slate-200/60 flex-shrink-0 bg-gradient-to-b from-white to-slate-50/30">
        <div className="flex items-center justify-between">
          {!collapsed && (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 legal-gradient-indigo rounded-xl flex items-center justify-center shadow-lg glow-hover transition-all duration-300 hover:scale-110">
                <Scale className="w-6 h-6 text-white" strokeWidth={2.5} />
              </div>
              <span className="font-black text-xl text-gradient-indigo tracking-tight">Legal AI</span>
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-2 rounded-xl hover:bg-slate-100 transition-all duration-300 hover:scale-110 hover:shadow-md"
          >
            {collapsed ? <ChevronRight className="w-5 h-5 text-slate-600" strokeWidth={2.5} /> : <ChevronLeft className="w-5 h-5 text-slate-600" strokeWidth={2.5} />}
          </button>
        </div>
      </div>

      {/* Premium Navigation */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto legal-scrollbar">
        {menuItems.map((item) => (
          <Link
            key={item.name}
            href={item.href}
            className={`group flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 relative overflow-hidden ${isActive(item.href)
              ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold shadow-lg shadow-indigo-500/30'
              : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900 font-semibold hover:shadow-md hover:-translate-x-1'
              }`}
          >
            {isActive(item.href) && (
              <div className="absolute inset-0 bg-white/10 shimmer"></div>
            )}
            <item.icon className={`flex-shrink-0 transition-transform duration-300 ${isActive(item.href) ? 'w-5 h-5 scale-110' : 'w-5 h-5 group-hover:scale-110'}`} strokeWidth={2.5} />
            {!collapsed && <span className="truncate relative z-10">{item.name}</span>}
            {isActive(item.href) && !collapsed && (
              <div className="ml-auto flex-shrink-0">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
              </div>
            )}
          </Link>
        ))}

      </nav>

      {/* Premium User Profile */}
      {!collapsed && (
        <div className="p-5 flex-shrink-0 border-t border-slate-200/60 bg-gradient-to-t from-slate-50/50 to-white">
          <div className="relative bg-gradient-to-br from-slate-50 to-white rounded-2xl p-4 border border-slate-200/60 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/0 to-purple-500/0 group-hover:from-indigo-500/5 group-hover:to-purple-500/5 transition-all duration-300"></div>
            <div className="flex items-center gap-3 relative z-10">
              <div className="w-11 h-11 legal-gradient-indigo rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg group-hover:scale-110 transition-transform duration-300">
                {session?.user?.image ? (
                  <img
                    src={session.user.image}
                    alt="Profile"
                    className="w-11 h-11 rounded-xl object-cover"
                  />
                ) : (
                  <User className="w-6 h-6 text-white" strokeWidth={2.5} />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-900 truncate">
                  {session?.user?.name || 'Admin User'}
                </p>
                <p className="text-xs font-medium text-slate-500 truncate">
                  {session?.user?.email || 'admin@legalai.com'}
                </p>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 hover:bg-rose-50 rounded-xl transition-all duration-300 flex-shrink-0 hover:scale-110 group/logout"
                title="Sign out"
              >
                <LogOut className="w-5 h-5 text-slate-500 group-hover/logout:text-rose-600 transition-colors" strokeWidth={2.5} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
