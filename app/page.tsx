'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Briefcase, Zap, Calendar, Users, Plus, Mic, Scale,
  ArrowRight, Clock, AlertCircle, TrendingUp, Search
} from 'lucide-react'

interface Case {
  id: string
  title: string
  clientName: string
  status: string
  caseType: string
  updatedAt: string
}

interface CasesStats {
  total: number
  byStatus: Record<string, number>
}

interface Hearing {
  id: string
  hearingDate: string
  court: string
  clientName: string
  title: string
  priority: string
  case: { id: string; title: string }
}

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: 'bg-emerald-100 text-emerald-700',
  PENDING: 'bg-amber-100 text-amber-700',
  CLOSED: 'bg-slate-100 text-slate-600',
  URGENT: 'bg-red-100 text-red-700',
  REVIEW: 'bg-blue-100 text-blue-700',
}

const PRIORITY_DOT: Record<string, string> = {
  HIGH: 'bg-red-500',
  URGENT: 'bg-red-500',
  MEDIUM: 'bg-amber-400',
  LOW: 'bg-emerald-400',
}

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [cases, setCases] = useState<Case[]>([])
  const [stats, setStats] = useState<CasesStats>({ total: 0, byStatus: {} })
  const [hearings, setHearings] = useState<Hearing[]>([])
  const [clientsCount, setClientsCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/auth/signin')
  }, [status, router])

  useEffect(() => {
    if (status !== 'authenticated') return
    async function fetchAll() {
      try {
        const [casesRes, hearingsRes, clientsRes] = await Promise.all([
          fetch('/api/cases'),
          fetch('/api/hearings'),
          fetch('/api/clients'),
        ])
        if (casesRes.ok) {
          const data = await casesRes.json()
          setCases(data.cases ?? [])
          setStats(data.stats ?? { total: 0, byStatus: {} })
        }
        if (hearingsRes.ok) {
          const data = await hearingsRes.json()
          setHearings(data.hearings ?? [])
        }
        if (clientsRes.ok) {
          const data = await clientsRes.json()
          setClientsCount((data.clients ?? []).length)
        }
      } finally {
        setLoading(false)
      }
    }
    fetchAll()
  }, [status])

  const now = new Date()
  const todayStr = now.toDateString()
  const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

  const todayHearings = hearings.filter(h => new Date(h.hearingDate).toDateString() === todayStr)
  const upcomingHearings = hearings
    .filter(h => { const d = new Date(h.hearingDate); return d > now && d <= weekFromNow })
    .sort((a, b) => new Date(a.hearingDate).getTime() - new Date(b.hearingDate).getTime())
    .slice(0, 5)

  const recentCases = [...cases].slice(0, 6)
  const urgentCases = cases.filter(c => c.status === 'URGENT').length
  const activeCases = stats.byStatus?.ACTIVE ?? stats.byStatus?.active ?? 0

  const userName = session?.user?.name?.split(' ')[0] ?? 'Counselor'
  const today = now.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-500 font-medium">Loading your workspace...</p>
        </div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">

        {/* Welcome Banner */}
        <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-700 rounded-2xl p-6 sm:p-8 text-white">
          {/* Background decoration */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-32 translate-x-32" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-24 -translate-x-16" />

          <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Scale className="w-5 h-5 text-indigo-300" />
                <span className="text-indigo-200 text-sm font-medium">Legal AI Workspace</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold mb-1">Good {getTimeOfDay()}, {userName} 👋</h1>
              <p className="text-indigo-200 text-sm">{today}</p>

              {todayHearings.length > 0 && (
                <div className="mt-3 inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-full px-3 py-1.5 text-sm font-medium">
                  <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
                  {todayHearings.length} hearing{todayHearings.length > 1 ? 's' : ''} today
                </div>
              )}
            </div>

            <Link
              href="/cases/new"
              className="inline-flex items-center gap-2 bg-white text-indigo-700 font-semibold px-5 py-2.5 rounded-xl hover:bg-indigo-50 transition-colors shadow-lg text-sm whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              New Case
            </Link>
          </div>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Link href="/cases" className="group bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md hover:border-indigo-200 transition-all">
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center group-hover:bg-indigo-600 transition-colors">
                <Briefcase className="w-5 h-5 text-indigo-600 group-hover:text-white transition-colors" />
              </div>
              <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-500 transition-colors" />
            </div>
            <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
            <p className="text-sm text-slate-500 mt-0.5">Total Cases</p>
          </Link>

          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                <Zap className="w-5 h-5 text-emerald-600" />
              </div>
              {urgentCases > 0 && (
                <span className="text-xs font-semibold bg-red-100 text-red-600 px-2 py-0.5 rounded-full">{urgentCases} urgent</span>
              )}
            </div>
            <p className="text-2xl font-bold text-slate-900">{activeCases}</p>
            <p className="text-sm text-slate-500 mt-0.5">Active Cases</p>
          </div>

          <Link href="/court-diary" className="group bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md hover:border-amber-200 transition-all">
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center group-hover:bg-amber-500 transition-colors">
                <Calendar className="w-5 h-5 text-amber-600 group-hover:text-white transition-colors" />
              </div>
              <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-amber-500 transition-colors" />
            </div>
            <p className="text-2xl font-bold text-slate-900">{upcomingHearings.length}</p>
            <p className="text-sm text-slate-500 mt-0.5">Upcoming Hearings</p>
          </Link>

          <Link href="/clients" className="group bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md hover:border-purple-200 transition-all">
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center group-hover:bg-purple-600 transition-colors">
                <Users className="w-5 h-5 text-purple-600 group-hover:text-white transition-colors" />
              </div>
              <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-purple-500 transition-colors" />
            </div>
            <p className="text-2xl font-bold text-slate-900">{clientsCount}</p>
            <p className="text-sm text-slate-500 mt-0.5">Total Clients</p>
          </Link>
        </div>

        {/* Today's Hearings — shown only if there are any */}
        {todayHearings.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
              <h2 className="font-semibold text-amber-900">Today's Hearings</h2>
              <span className="text-xs bg-amber-200 text-amber-800 px-2 py-0.5 rounded-full font-medium">{todayHearings.length}</span>
            </div>
            <div className="space-y-2">
              {todayHearings.map(h => (
                <Link key={h.id} href={`/cases/${h.case?.id}`} className="flex items-center gap-3 bg-white rounded-lg p-3 hover:shadow-sm transition-shadow border border-amber-100">
                  <Clock className="w-4 h-4 text-amber-500 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-900 truncate">{h.title || h.case?.title}</p>
                    <p className="text-xs text-slate-500">{h.court} · {h.clientName}</p>
                  </div>
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${PRIORITY_DOT[h.priority] ?? 'bg-slate-300'}`} />
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-2 gap-6">

          {/* Recent Cases */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <h2 className="font-semibold text-slate-900">Recent Cases</h2>
              <Link href="/cases" className="flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-700 font-medium">
                View all <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            {recentCases.length === 0 ? (
              <div className="px-5 py-10 text-center">
                <Briefcase className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                <p className="text-sm text-slate-400">No cases yet.</p>
                <Link href="/cases/new" className="inline-flex items-center gap-1.5 mt-3 text-sm text-indigo-600 hover:underline font-medium">
                  <Plus className="w-4 h-4" /> Create your first case
                </Link>
              </div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {recentCases.map(c => (
                  <li key={c.id}>
                    <Link href={`/cases/${c.id}`} className="flex items-center justify-between px-5 py-3.5 hover:bg-slate-50 transition-colors group">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate group-hover:text-indigo-600 transition-colors">{c.title}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{c.clientName || 'No client'} · {c.caseType || 'General'}</p>
                      </div>
                      <span className={`ml-3 flex-shrink-0 px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[c.status] ?? 'bg-slate-100 text-slate-600'}`}>
                        {c.status.charAt(0) + c.status.slice(1).toLowerCase()}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Upcoming Hearings */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <h2 className="font-semibold text-slate-900">Upcoming Hearings</h2>
              <Link href="/court-diary" className="flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-700 font-medium">
                View diary <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            {upcomingHearings.length === 0 ? (
              <div className="px-5 py-10 text-center">
                <Calendar className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                <p className="text-sm text-slate-400">No upcoming hearings this week.</p>
              </div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {upcomingHearings.map(h => {
                  const d = new Date(h.hearingDate)
                  const isThisWeek = d <= weekFromNow
                  return (
                    <li key={h.id}>
                      <Link href={`/cases/${h.case?.id}`} className="flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50 transition-colors group">
                        <div className="flex-shrink-0 w-11 h-11 bg-indigo-50 rounded-xl flex flex-col items-center justify-center">
                          <p className="text-xs font-bold text-indigo-500 uppercase leading-none">
                            {d.toLocaleDateString('en-IN', { month: 'short' })}
                          </p>
                          <p className="text-lg font-black text-indigo-700 leading-none">{d.getDate()}</p>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-slate-900 truncate group-hover:text-indigo-600 transition-colors">
                            {h.case?.title ?? 'Untitled Case'}
                          </p>
                          <p className="text-xs text-slate-500 mt-0.5 truncate">{h.court || 'Court TBD'} · {h.clientName}</p>
                        </div>
                        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${PRIORITY_DOT[h.priority] ?? 'bg-slate-300'}`} />
                      </Link>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">Quick Actions</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { href: '/cases/new', icon: Plus, label: 'New Case', desc: 'Start a new matter', color: 'indigo' },
              { href: '/ecourts', icon: Search, label: 'CNR Lookup', desc: 'Search eCourts', color: 'blue' },
              { href: '/dictation', icon: Mic, label: 'Dictation', desc: 'Voice to text', color: 'purple' },
              { href: '/court-diary', icon: Calendar, label: 'Court Diary', desc: 'View hearings', color: 'amber' },
            ].map(action => (
              <Link
                key={action.href}
                href={action.href}
                className="group bg-white border border-slate-200 rounded-xl p-4 hover:shadow-md hover:border-slate-300 transition-all"
              >
                <div className={`w-9 h-9 rounded-lg mb-3 flex items-center justify-center transition-colors ${
                  action.color === 'indigo' ? 'bg-indigo-100 group-hover:bg-indigo-600' :
                  action.color === 'blue' ? 'bg-blue-100 group-hover:bg-blue-600' :
                  action.color === 'purple' ? 'bg-purple-100 group-hover:bg-purple-600' :
                  'bg-amber-100 group-hover:bg-amber-500'
                }`}>
                  <action.icon className={`w-4 h-4 transition-colors ${
                    action.color === 'indigo' ? 'text-indigo-600 group-hover:text-white' :
                    action.color === 'blue' ? 'text-blue-600 group-hover:text-white' :
                    action.color === 'purple' ? 'text-purple-600 group-hover:text-white' :
                    'text-amber-600 group-hover:text-white'
                  }`} />
                </div>
                <p className="text-sm font-semibold text-slate-900">{action.label}</p>
                <p className="text-xs text-slate-400 mt-0.5">{action.desc}</p>
              </Link>
            ))}
          </div>
        </div>

      </div>
    </main>
  )
}

function getTimeOfDay() {
  const h = new Date().getHours()
  if (h < 12) return 'morning'
  if (h < 17) return 'afternoon'
  return 'evening'
}
