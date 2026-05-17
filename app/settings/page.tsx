'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { User, Settings, Bell, Shield } from 'lucide-react'

export default function SettingsPage() {
  const { data: session } = useSession()
  const [activeTab, setActiveTab] = useState<'profile' | 'preferences'>('profile')

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Settings</h1>
          <p className="text-slate-500 mt-1 font-medium">Manage your account and preferences</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-white rounded-xl p-1 border border-slate-200/60 shadow-sm w-fit">
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
              activeTab === 'profile'
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <User className="w-4 h-4" />
            Profile
          </button>
          <button
            onClick={() => setActiveTab('preferences')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
              activeTab === 'preferences'
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Settings className="w-4 h-4" />
            Preferences
          </button>
        </div>

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100">
                <h2 className="text-base font-bold text-slate-900">Profile Information</h2>
                <p className="text-sm text-slate-500 mt-0.5">Your account details</p>
              </div>
              <div className="p-6 space-y-5">
                {/* Avatar */}
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg flex-shrink-0">
                    {session?.user?.image ? (
                      <img
                        src={session.user.image}
                        alt="Profile"
                        className="w-16 h-16 rounded-2xl object-cover"
                      />
                    ) : (
                      <User className="w-8 h-8 text-white" strokeWidth={2} />
                    )}
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 text-lg">
                      {session?.user?.name || 'User'}
                    </p>
                    <p className="text-sm text-slate-500">{session?.user?.email || '—'}</p>
                  </div>
                </div>

                {/* Fields */}
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                      Full Name
                    </label>
                    <div className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 text-sm font-medium cursor-not-allowed">
                      {session?.user?.name || '—'}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                      Email Address
                    </label>
                    <div className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 text-sm font-medium cursor-not-allowed">
                      {session?.user?.email || '—'}
                    </div>
                  </div>
                </div>

                <p className="text-xs text-slate-400 flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5" />
                  Profile editing coming soon.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Preferences Tab */}
        {activeTab === 'preferences' && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100">
                <h2 className="text-base font-bold text-slate-900">App Preferences</h2>
                <p className="text-sm text-slate-500 mt-0.5">Customize your experience</p>
              </div>
              <div className="p-6">
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center mb-4">
                    <Bell className="w-7 h-7 text-indigo-500" strokeWidth={2} />
                  </div>
                  <p className="font-bold text-slate-700 text-base">More settings coming soon</p>
                  <p className="text-sm text-slate-400 mt-1.5 max-w-xs">
                    Notifications, theme, language, and other preferences will be available here.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
