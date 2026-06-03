'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ChevronRight, Loader2, CheckCircle, AlertCircle,
  FileText, User, Scale, ArrowRight, RotateCcw, Sparkles, ClipboardList
} from 'lucide-react'
import Link from 'next/link'

type Stage = 'summary' | 'questions' | 'done'

interface Round {
  questions: string[]
  answers: string[]
}

interface CaseData {
  title: string
  caseType: string
  clientName: string
  clientPhone: string
  clientEmail: string
  description: string
  oppositeParty: string
  keyFacts: string[]
  legalIssues: string[]
  reliefSought: string
  urgency: string
  recommendedActions: string[]
  documentsNeeded: string[]
  courtJurisdiction: string
}

const ROUND_LABELS = ['Round 1 — The Basics', 'Round 2 — Deeper Details', 'Round 3 — Final Gaps']
const MAX_ROUNDS = 3

export default function IntakePage() {
  const router = useRouter()
  const [stage, setStage] = useState<Stage>('summary')
  const [summary, setSummary] = useState('')
  const [rounds, setRounds] = useState<Round[]>([])
  const [currentQuestions, setCurrentQuestions] = useState<string[]>([])
  const [currentAnswers, setCurrentAnswers] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [caseData, setCaseData] = useState<CaseData | null>(null)
  const [caseId, setCaseId] = useState<string | null>(null)

  const wordCount = summary.trim().split(/\s+/).filter(Boolean).length
  const currentRound = rounds.length + 1
  const allAnswered = currentAnswers.length === currentQuestions.length &&
    currentAnswers.every(a => a.trim().length > 0)

  // Step 1 → generate round 1 questions
  const startIntake = async () => {
    if (wordCount < 20) { setError('Please provide at least a brief summary (20+ words)'); return }
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/intake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ summary, rounds: [], action: 'questions' }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setCurrentQuestions(data.questions)
      setCurrentAnswers(new Array(data.questions.length).fill(''))
      setStage('questions')
    } catch (e: any) {
      setError(e.message || 'Failed to generate questions')
    } finally {
      setLoading(false)
    }
  }

  // After answering a round → next round or finalize
  const submitRound = async () => {
    const completedRound: Round = { questions: currentQuestions, answers: currentAnswers }
    const newRounds = [...rounds, completedRound]
    setRounds(newRounds)
    setError('')
    setLoading(true)

    try {
      if (currentRound >= MAX_ROUNDS) {
        // Finalize — generate case summary
        const res = await fetch('/api/intake', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ summary, rounds: newRounds, action: 'finalize' }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error)
        setCaseData(data.caseData)
        setCaseId(data.caseId)
        setStage('done')
      } else {
        // Generate next round
        const res = await fetch('/api/intake', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ summary, rounds: newRounds, action: 'questions' }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error)
        setCurrentQuestions(data.questions)
        setCurrentAnswers(new Array(data.questions.length).fill(''))
      }
    } catch (e: any) {
      setError(e.message || 'Something went wrong')
      setRounds(rounds) // rollback
    } finally {
      setLoading(false)
    }
  }

  const reset = () => {
    setSummary('')
    setRounds([])
    setCurrentQuestions([])
    setCurrentAnswers([])
    setCaseData(null)
    setCaseId(null)
    setError('')
    setStage('summary')
  }

  const urgencyColor = {
    HIGH: 'bg-red-100 text-red-700',
    MEDIUM: 'bg-amber-100 text-amber-700',
    LOW: 'bg-green-100 text-green-700',
  }[caseData?.urgency || 'MEDIUM'] || 'bg-gray-100 text-gray-600'

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6">
      <div className="max-w-3xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
              <ClipboardList className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Case Intake</h1>
              <p className="text-sm text-slate-500">AI-guided case information collection</p>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        {stage === 'questions' && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-slate-700">{ROUND_LABELS[currentRound - 1]}</span>
              <span className="text-sm text-slate-500">Round {currentRound} of {MAX_ROUNDS}</span>
            </div>
            <div className="h-2 bg-slate-200 rounded-full">
              <div
                className="h-2 bg-indigo-600 rounded-full transition-all duration-500"
                style={{ width: `${(currentRound / MAX_ROUNDS) * 100}%` }}
              />
            </div>
            {/* Completed rounds summary */}
            {rounds.length > 0 && (
              <p className="text-xs text-slate-400 mt-1">{rounds.reduce((a, r) => a + r.answers.filter(x => x.trim()).length, 0)} answers collected so far</p>
            )}
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {/* ─── STAGE 1: Summary ─── */}
        {stage === 'summary' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8">
            <div className="flex items-start gap-3 mb-6">
              <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                <FileText className="w-4 h-4 text-indigo-600" />
              </div>
              <div>
                <h2 className="font-semibold text-slate-900">Step 1 — Case Summary</h2>
                <p className="text-sm text-slate-500 mt-0.5">
                  Ask the client to describe their situation in their own words. You type it here.
                  Keep it to half a page — just the basics of what happened.
                </p>
              </div>
            </div>

            <textarea
              value={summary}
              onChange={e => setSummary(e.target.value)}
              placeholder="E.g. My client Mr. Rajesh Kumar owns a plot of land in Hyderabad that was registered in his name in 2010. His neighbour has been claiming ownership over a portion of the land and has illegally constructed a boundary wall encroaching 2 feet into our property. We have the original sale deed and survey documents..."
              rows={10}
              className="w-full px-4 py-3 border border-slate-300 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none leading-relaxed"
            />

            <div className="flex items-center justify-between mt-3">
              <span className={`text-xs font-medium ${wordCount < 20 ? 'text-slate-400' : wordCount < 50 ? 'text-amber-500' : 'text-green-600'}`}>
                {wordCount} words {wordCount < 20 ? '— please add more detail' : wordCount < 50 ? '— good, more detail helps' : '— great'}
              </span>
              <button
                onClick={startIntake}
                disabled={loading || wordCount < 20}
                className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-colors"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                {loading ? 'Analysing...' : 'Start Intake'}
                {!loading && <ChevronRight className="w-4 h-4" />}
              </button>
            </div>
          </div>
        )}

        {/* ─── STAGE 2: Questions ─── */}
        {stage === 'questions' && (
          <div className="space-y-4">
            <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 text-sm text-indigo-800">
              <strong>Instructions:</strong> Read each question to the client and type their answer below.
              Answer all questions before proceeding to the next round.
            </div>

            {currentQuestions.map((q, i) => (
              <div key={i} className="bg-white rounded-xl border border-slate-200 p-5">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0 text-white text-xs font-bold">
                    {i + 1}
                  </div>
                  <p className="text-sm font-semibold text-slate-900 leading-relaxed pt-0.5">{q}</p>
                </div>
                <textarea
                  value={currentAnswers[i] || ''}
                  onChange={e => {
                    const updated = [...currentAnswers]
                    updated[i] = e.target.value
                    setCurrentAnswers(updated)
                  }}
                  placeholder="Type the client's answer here..."
                  rows={3}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none bg-slate-50"
                />
              </div>
            ))}

            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-slate-400">
                {currentAnswers.filter(a => a.trim()).length} of {currentQuestions.length} answered
              </span>
              <button
                onClick={submitRound}
                disabled={loading || !allAnswered}
                className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-colors"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {loading
                  ? currentRound >= MAX_ROUNDS ? 'Generating Case Summary...' : 'Generating Next Round...'
                  : currentRound >= MAX_ROUNDS ? 'Generate Case Summary' : `Next Round →`}
              </button>
            </div>
          </div>
        )}

        {/* ─── STAGE 3: Done ─── */}
        {stage === 'done' && caseData && (
          <div className="space-y-5">

            {/* Success banner */}
            <div className="bg-green-50 border border-green-200 rounded-xl p-5 flex items-start gap-4">
              <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-green-900">Intake Complete — Draft Case Created</p>
                <p className="text-sm text-green-700 mt-0.5">
                  Review the summary below. The advocate can open the draft case and make any edits before marking it active.
                </p>
              </div>
            </div>

            {/* Case header */}
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">{caseData.title}</h2>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs bg-indigo-100 text-indigo-700 px-2.5 py-0.5 rounded-full font-medium">{caseData.caseType}</span>
                    <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${urgencyColor}`}>{caseData.urgency} Priority</span>
                  </div>
                </div>
                <Scale className="w-8 h-8 text-slate-300 flex-shrink-0" />
              </div>

              <p className="text-sm text-slate-700 leading-relaxed">{caseData.description}</p>
            </div>

            {/* Client + Opposite Party */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="bg-white rounded-xl border border-slate-200 p-5">
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Client</h3>
                <p className="font-semibold text-slate-900">{caseData.clientName || '—'}</p>
                {caseData.clientPhone && <p className="text-sm text-slate-500 mt-0.5">{caseData.clientPhone}</p>}
                {caseData.clientEmail && <p className="text-sm text-slate-500">{caseData.clientEmail}</p>}
              </div>
              <div className="bg-white rounded-xl border border-slate-200 p-5">
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Opposite Party</h3>
                <p className="font-semibold text-slate-900">{caseData.oppositeParty || '—'}</p>
                {caseData.courtJurisdiction && <p className="text-sm text-slate-500 mt-0.5">Jurisdiction: {caseData.courtJurisdiction}</p>}
              </div>
            </div>

            {/* Key Facts */}
            {caseData.keyFacts?.length > 0 && (
              <div className="bg-white rounded-xl border border-slate-200 p-5">
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Key Facts</h3>
                <ul className="space-y-2">
                  {caseData.keyFacts.map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                      <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full mt-1.5 flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Legal Issues */}
            {caseData.legalIssues?.length > 0 && (
              <div className="bg-white rounded-xl border border-slate-200 p-5">
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Legal Issues</h3>
                <div className="flex flex-wrap gap-2">
                  {caseData.legalIssues.map((issue, i) => (
                    <span key={i} className="px-3 py-1 bg-purple-50 text-purple-700 rounded-full text-xs font-medium border border-purple-100">{issue}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Relief Sought */}
            {caseData.reliefSought && (
              <div className="bg-white rounded-xl border border-slate-200 p-5">
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Relief Sought</h3>
                <p className="text-sm text-slate-700">{caseData.reliefSought}</p>
              </div>
            )}

            {/* Documents Needed */}
            {caseData.documentsNeeded?.length > 0 && (
              <div className="bg-amber-50 rounded-xl border border-amber-200 p-5">
                <h3 className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-3">Documents to Collect from Client</h3>
                <ul className="space-y-1.5">
                  {caseData.documentsNeeded.map((doc, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-amber-800">
                      <span className="text-amber-500 font-bold">□</span> {doc}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Recommended Actions (auto-created as tasks) */}
            {caseData.recommendedActions?.length > 0 && (
              <div className="bg-white rounded-xl border border-slate-200 p-5">
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Recommended Next Actions <span className="text-indigo-500">(auto-added as tasks)</span></h3>
                <ul className="space-y-2">
                  {caseData.recommendedActions.map((action, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                      <CheckCircle className="w-4 h-4 text-indigo-400 mt-0.5 flex-shrink-0" />
                      {action}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              {caseId && (
                <Link
                  href={`/cases/${caseId}`}
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors"
                >
                  <ArrowRight className="w-4 h-4" />
                  Open Draft Case
                </Link>
              )}
              <button
                onClick={reset}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-white border border-slate-300 text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                Start New Intake
              </button>
            </div>

          </div>
        )}

      </div>
    </div>
  )
}
