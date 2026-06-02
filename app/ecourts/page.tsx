'use client'

import { useState } from 'react'
import { Search, Loader2, AlertCircle, Scale, Calendar, User, FileText, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react'

interface CaseData {
  courtCaseData?: {
    case_no?: string
    case_type?: string
    filing_number?: string
    filing_date?: string
    registration_number?: string
    registration_date?: string
    cnr_number?: string
    first_hearing_date?: string
    next_hearing_date?: string
    case_stage?: string
    court_number_desg?: string
    petitioner_and_advocate?: string[]
    respondent_and_advocate?: string[]
    acts?: { act?: string; section?: string }[]
    case_status?: string
    nature_of_disposal?: string
    decision_date?: string
    subordinate_court_info?: string
  }
  history?: {
    srno?: string
    judge?: string
    business_date?: string
    hearing_date?: string
    purpose?: string
  }[]
  orders?: {
    order_no?: string
    order_date?: string
    order_details?: string
  }[]
}

export default function ECourtsPage() {
  const [cnr, setCnr] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [caseData, setCaseData] = useState<CaseData | null>(null)
  const [showHistory, setShowHistory] = useState(false)

  const lookup = async () => {
    const trimmed = cnr.trim().toUpperCase().replace(/\s/g, '')
    if (!trimmed) return

    setLoading(true)
    setError('')
    setCaseData(null)

    try {
      const res = await fetch(`/api/ecourts?cnr=${trimmed}`)
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to fetch case details')
        return
      }

      // ecourtsindia API wraps in data.data or data directly
      const caseInfo = data?.data || data
      setCaseData(caseInfo)
    } catch (err) {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const c = caseData?.courtCaseData

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
              <Scale className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">eCourts CNR Lookup</h1>
          </div>
          <p className="text-gray-500 text-sm ml-13 pl-13">Search live Indian court case status using a CNR number</p>
        </div>

        {/* Search Box */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">CNR Number</label>
          <div className="flex gap-3">
            <input
              type="text"
              value={cnr}
              onChange={e => setCnr(e.target.value.toUpperCase())}
              onKeyDown={e => e.key === 'Enter' && lookup()}
              placeholder="e.g. DLND010012342015"
              maxLength={16}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-indigo-500 focus:border-transparent uppercase"
            />
            <button
              onClick={lookup}
              disabled={loading || !cnr.trim()}
              className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              {loading ? 'Searching...' : 'Search'}
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-2">16-character CNR number found on any court notice or eCourts portal</p>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {/* Results */}
        {caseData && c && (
          <div className="space-y-4">

            {/* Case Header */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">
                    {c.case_type} {c.case_no || c.registration_number}
                  </h2>
                  <p className="text-sm text-gray-500 mt-1 font-mono">{c.cnr_number}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  c.case_status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                  c.case_status === 'Disposed' ? 'bg-green-100 text-green-800' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {c.case_status || 'Unknown'}
                </span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                {c.filing_date && (
                  <div>
                    <p className="text-gray-400 text-xs">Filing Date</p>
                    <p className="font-medium text-gray-900 mt-0.5">{c.filing_date}</p>
                  </div>
                )}
                {c.registration_date && (
                  <div>
                    <p className="text-gray-400 text-xs">Registration Date</p>
                    <p className="font-medium text-gray-900 mt-0.5">{c.registration_date}</p>
                  </div>
                )}
                {c.first_hearing_date && (
                  <div>
                    <p className="text-gray-400 text-xs">First Hearing</p>
                    <p className="font-medium text-gray-900 mt-0.5">{c.first_hearing_date}</p>
                  </div>
                )}
                {c.next_hearing_date && (
                  <div>
                    <p className="text-gray-400 text-xs">Next Hearing</p>
                    <p className="font-medium text-gray-900 mt-0.5 text-indigo-600 font-semibold">{c.next_hearing_date}</p>
                  </div>
                )}
                {c.case_stage && (
                  <div>
                    <p className="text-gray-400 text-xs">Stage</p>
                    <p className="font-medium text-gray-900 mt-0.5">{c.case_stage}</p>
                  </div>
                )}
                {c.court_number_desg && (
                  <div>
                    <p className="text-gray-400 text-xs">Court</p>
                    <p className="font-medium text-gray-900 mt-0.5">{c.court_number_desg}</p>
                  </div>
                )}
                {c.nature_of_disposal && (
                  <div>
                    <p className="text-gray-400 text-xs">Disposal</p>
                    <p className="font-medium text-gray-900 mt-0.5">{c.nature_of_disposal}</p>
                  </div>
                )}
                {c.decision_date && (
                  <div>
                    <p className="text-gray-400 text-xs">Decision Date</p>
                    <p className="font-medium text-gray-900 mt-0.5">{c.decision_date}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Parties */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {c.petitioner_and_advocate && c.petitioner_and_advocate.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <User className="w-4 h-4 text-blue-500" /> Petitioner(s)
                  </h3>
                  <div className="space-y-2">
                    {c.petitioner_and_advocate.map((p, i) => (
                      <p key={i} className="text-sm text-gray-800 leading-relaxed">{p}</p>
                    ))}
                  </div>
                </div>
              )}

              {c.respondent_and_advocate && c.respondent_and_advocate.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <User className="w-4 h-4 text-red-500" /> Respondent(s)
                  </h3>
                  <div className="space-y-2">
                    {c.respondent_and_advocate.map((r, i) => (
                      <p key={i} className="text-sm text-gray-800 leading-relaxed">{r}</p>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Acts */}
            {c.acts && c.acts.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-purple-500" /> Acts & Sections
                </h3>
                <div className="flex flex-wrap gap-2">
                  {c.acts.map((act, i) => (
                    <span key={i} className="px-3 py-1 bg-purple-50 text-purple-700 rounded-full text-xs font-medium">
                      {act.act}{act.section ? ` § ${act.section}` : ''}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Hearing History */}
            {caseData.history && caseData.history.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200">
                <button
                  onClick={() => setShowHistory(!showHistory)}
                  className="w-full flex items-center justify-between p-5 text-left hover:bg-gray-50 rounded-xl transition-colors"
                >
                  <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-green-500" />
                    Hearing History ({caseData.history.length} hearings)
                  </h3>
                  {showHistory ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                </button>

                {showHistory && (
                  <div className="border-t border-gray-100">
                    <div className="divide-y divide-gray-100 max-h-80 overflow-y-auto">
                      {caseData.history.map((h, i) => (
                        <div key={i} className="px-5 py-3 text-sm">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium text-gray-900">{h.business_date}</span>
                            {h.hearing_date && <span className="text-xs text-indigo-600">Next: {h.hearing_date}</span>}
                          </div>
                          {h.purpose && <p className="text-gray-500 text-xs">{h.purpose}</p>}
                          {h.judge && <p className="text-gray-400 text-xs mt-0.5">Judge: {h.judge}</p>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Orders */}
            {caseData.orders && caseData.orders.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-orange-500" /> Orders ({caseData.orders.length})
                </h3>
                <div className="space-y-2">
                  {caseData.orders.map((o, i) => (
                    <div key={i} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                      <div>
                        <p className="text-sm font-medium text-gray-900">Order {o.order_no}</p>
                        {o.order_date && <p className="text-xs text-gray-500">{o.order_date}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Open on eCourts */}
            <div className="flex justify-end">
              <a
                href={`https://services.ecourts.gov.in/ecourtindia_v6/?p=casestatus/viewCase&cnr_number=${c.cnr_number}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-indigo-600 hover:underline"
              >
                View on eCourts portal <ExternalLink className="w-3 h-3" />
              </a>
            </div>

          </div>
        )}

        {/* Empty state */}
        {!loading && !error && !caseData && (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <Scale className="w-12 h-12 text-gray-200 mx-auto mb-4" />
            <p className="text-gray-500 font-medium">Enter a CNR number to look up a case</p>
            <p className="text-gray-400 text-sm mt-1">
              Find the CNR on any court notice, summons, or at{' '}
              <a href="https://services.ecourts.gov.in" target="_blank" rel="noopener noreferrer" className="text-indigo-500 hover:underline">
                services.ecourts.gov.in
              </a>
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
