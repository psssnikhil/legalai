'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

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
  case: {
    id: string
    title: string
  }
}

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-700',
  PENDING: 'bg-yellow-100 text-yellow-700',
  CLOSED: 'bg-slate-100 text-slate-600',
  URGENT: 'bg-red-100 text-red-700',
  REVIEW: 'bg-blue-100 text-blue-700',
}

function StatusBadge({ status }: { status: string }) {
  const cls = STATUS_COLORS[status] ?? 'bg-slate-100 text-slate-600'
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${cls}`}>
      {status.charAt(0) + status.slice(1).toLowerCase()}
    </span>
  )
}

function StatCard({
  label,
  value,
  href,
  icon,
}: {
  label: string
  value: number | string
  href?: string
  icon: React.ReactNode
}) {
  const inner = (
    <div className="bg-white rounded-xl border border-slate-200 p-5 flex items-center gap-4 hover:shadow-md transition-shadow">
      <div className="flex-shrink-0 w-11 h-11 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600">
        {icon}
      </div>
      <div>
        <p className="text-sm text-slate-500">{label}</p>
        <p className="text-2xl font-semibold text-slate-800">{value}</p>
      </div>
    </div>
  )
  return href ? <Link href={href}>{inner}</Link> : <div>{inner}</div>
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
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    }
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
  const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

  const upcomingHearings = hearings
    .filter((h) => {
      const d = new Date(h.hearingDate)
      return d >= now && d <= weekFromNow
    })
    .sort((a, b) => new Date(a.hearingDate).getTime() - new Date(b.hearingDate).getTime())

  const recentCases = [...cases].slice(0, 5)
  const nextHearings = hearings
    .filter((h) => new Date(h.hearingDate) >= now)
    .sort((a, b) => new Date(a.hearingDate).getTime() - new Date(b.hearingDate).getTime())
    .slice(0, 5)

  const today = now.toLocaleDateString('en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  const userName = session?.user?.name?.split(' ')[0] ?? 'Counselor'

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Welcome back, {userName}</h1>
            <p className="text-sm text-slate-500 mt-1">{today}</p>
          </div>
          <div className="flex gap-2">
            <Link
              href="/cases"
              className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Case
            </Link>
          </div>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Total Cases"
            value={stats.total}
            href="/cases"
            icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            }
          />
          <StatCard
            label="Active Cases"
            value={stats.byStatus?.active ?? 0}
            icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            }
          />
          <StatCard
            label="Upcoming Hearings"
            value={upcomingHearings.length}
            href="/court-diary"
            icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            }
          />
          <StatCard
            label="Total Clients"
            value={clientsCount}
            href="/clients"
            icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            }
          />
        </div>

        <div className="grid lg:grid-cols-2 gap-6">

          {/* Recent Cases */}
          <section className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <h2 className="font-semibold text-slate-800">Recent Cases</h2>
              <Link href="/cases" className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">
                View all
              </Link>
            </div>
            {recentCases.length === 0 ? (
              <p className="text-sm text-slate-400 px-5 py-6">No cases yet.</p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {recentCases.map((c) => (
                  <li key={c.id}>
                    <Link
                      href={`/cases/${c.id}`}
                      className="flex items-center justify-between px-5 py-3.5 hover:bg-slate-50 transition-colors"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-800 truncate">{c.title}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{c.clientName} · {c.caseType}</p>
                      </div>
                      <StatusBadge status={c.status} />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Upcoming Hearings */}
          <section className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <h2 className="font-semibold text-slate-800">Upcoming Hearings</h2>
              <Link href="/court-diary" className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">
                View diary
              </Link>
            </div>
            {nextHearings.length === 0 ? (
              <p className="text-sm text-slate-400 px-5 py-6">No upcoming hearings.</p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {nextHearings.map((h) => {
                  const d = new Date(h.hearingDate)
                  return (
                    <li key={h.id}>
                      <Link
                        href={`/cases/${h.case?.id}`}
                        className="flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50 transition-colors"
                      >
                        <div className="flex-shrink-0 text-center w-10">
                          <p className="text-xs font-semibold text-indigo-600 uppercase">
                            {d.toLocaleDateString('en-IN', { month: 'short' })}
                          </p>
                          <p className="text-lg font-bold text-slate-800 leading-none">
                            {d.getDate()}
                          </p>
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-slate-800 truncate">
                            {h.case?.title ?? 'Untitled Case'}
                          </p>
                          <p className="text-xs text-slate-500 mt-0.5 truncate">{h.court} · {h.clientName}</p>
                        </div>
                      </Link>
                    </li>
                  )
                })}
              </ul>
            )}
          </section>
        </div>

        {/* Quick Actions */}
        <section>
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">Quick Actions</h2>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/cases/new"
              className="inline-flex items-center gap-2 bg-white border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 text-sm font-medium px-4 py-2.5 rounded-lg transition-colors shadow-sm"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Case
            </Link>
            <Link
              href="/dictation"
              className="inline-flex items-center gap-2 bg-white border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 text-sm font-medium px-4 py-2.5 rounded-lg transition-colors shadow-sm"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
              Start Dictation
            </Link>
            <Link
              href="/court-diary"
              className="inline-flex items-center gap-2 bg-white border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 text-sm font-medium px-4 py-2.5 rounded-lg transition-colors shadow-sm"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Court Diary
            </Link>
          </div>
        </section>

      </div>
    </main>
  )
}
