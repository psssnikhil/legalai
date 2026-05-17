'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import ReactMarkdown from 'react-markdown'
import {
  ArrowLeft, Briefcase, Calendar, User, FileText, MessageSquare,
  FolderOpen, Upload, Trash2, Send, Loader2, Plus, ExternalLink,
  Edit2, Check, X, Clock, AlertCircle, ChevronRight, Download,
  BookOpen, Scale, Mic
} from 'lucide-react'

type Tab = 'overview' | 'documents' | 'hearings' | 'chat'

interface Case {
  id: string
  title: string
  description?: string
  status: string
  priority: string
  caseType?: string
  clientName?: string
  clientEmail?: string
  clientPhone?: string
  assignedTo?: string
  nextHearing?: string
  caseValue?: number
  googleDriveFolderId?: string
  googleDriveFolderUrl?: string
  createdAt: string
  updatedAt: string
}

interface Document {
  id: string
  originalName: string
  filename: string
  mimeType: string
  size: number
  createdAt: string
}

interface Hearing {
  id: string
  title: string
  hearingDate: string
  startTime: string
  court?: string
  courtType?: string
  status: string
  priority: string
  notes?: string
  clientName?: string
}

interface ChatMessage {
  id: string
  role: string
  content: string
  createdAt: string
}

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-800',
  PENDING: 'bg-yellow-100 text-yellow-800',
  REVIEW: 'bg-blue-100 text-blue-800',
  CLOSED: 'bg-gray-100 text-gray-800',
  URGENT: 'bg-red-100 text-red-800',
}

const PRIORITY_COLORS: Record<string, string> = {
  HIGH: 'bg-red-100 text-red-700',
  MEDIUM: 'bg-yellow-100 text-yellow-700',
  LOW: 'bg-green-100 text-green-700',
}

export default function CaseDetailPage() {
  const params = useParams()
  const router = useRouter()
  const caseId = params.id as string

  const [activeTab, setActiveTab] = useState<Tab>('overview')
  const [caseData, setCaseData] = useState<Case | null>(null)
  const [documents, setDocuments] = useState<Document[]>([])
  const [hearings, setHearings] = useState<Hearing[]>([])
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [chatSessionId, setChatSessionId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Edit state
  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState<Partial<Case>>({})
  const [saving, setSaving] = useState(false)

  // Document upload
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Hearing form
  const [showHearingForm, setShowHearingForm] = useState(false)
  const [hearingForm, setHearingForm] = useState({
    title: '', hearingDate: '', startTime: '10:00', court: '',
    courtType: '', notes: '', priority: 'MEDIUM'
  })
  const [savingHearing, setSavingHearing] = useState(false)

  // Chat state
  const [chatInput, setChatInput] = useState('')
  const [sendingMessage, setSendingMessage] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)

  // Drive state
  const [creatingDriveFolder, setCreatingDriveFolder] = useState(false)
  const [driveMessage, setDriveMessage] = useState('')

  useEffect(() => {
    fetchCase()
  }, [caseId])

  useEffect(() => {
    if (activeTab === 'documents') fetchDocuments()
    if (activeTab === 'hearings') fetchHearings()
    if (activeTab === 'chat') fetchChatHistory()
  }, [activeTab])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages])

  const fetchCase = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/cases?id=${caseId}`)
      if (!res.ok) throw new Error('Failed to fetch case')
      const data = await res.json()
      const found = data.case || data.cases?.find((c: Case) => c.id === caseId)
      if (!found) throw new Error('Case not found')
      setCaseData(found)
      setEditForm(found)
    } catch (err) {
      setError('Could not load case details')
    } finally {
      setLoading(false)
    }
  }

  const fetchDocuments = async () => {
    const res = await fetch(`/api/documents?caseId=${caseId}`)
    if (res.ok) {
      const data = await res.json()
      setDocuments(data.documents || data || [])
    }
  }

  const fetchHearings = async () => {
    const res = await fetch(`/api/hearings?caseId=${caseId}`)
    if (res.ok) {
      const data = await res.json()
      setHearings(data.hearings || [])
    }
  }

  const fetchChatHistory = async () => {
    const res = await fetch(`/api/cases/chat?caseId=${caseId}`)
    if (res.ok) {
      const data = await res.json()
      setChatMessages(data.messages || [])
      setChatSessionId(data.sessionId || null)
    }
  }

  const saveCase = async () => {
    if (!caseData) return
    setSaving(true)
    try {
      const res = await fetch('/api/cases', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: caseId, ...editForm })
      })
      if (res.ok) {
        const data = await res.json()
        setCaseData(data.case || { ...caseData, ...editForm })
        setEditing(false)
      }
    } catch (err) {
      console.error('Save error:', err)
    } finally {
      setSaving(false)
    }
  }

  const uploadDocument = async (file: File) => {
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('caseId', caseId)

      const res = await fetch('/api/documents/upload', { method: 'POST', body: formData })
      if (res.ok) {
        fetchDocuments()
      }
    } catch (err) {
      console.error('Upload error:', err)
    } finally {
      setUploading(false)
    }
  }

  const deleteDocument = async (docId: string) => {
    if (!confirm('Delete this document?')) return
    await fetch(`/api/documents?id=${docId}`, { method: 'DELETE' })
    fetchDocuments()
  }

  const createHearing = async () => {
    if (!hearingForm.title || !hearingForm.hearingDate) return
    setSavingHearing(true)
    try {
      const res = await fetch('/api/hearings/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...hearingForm, caseId, clientName: caseData?.clientName })
      })
      if (res.ok) {
        setShowHearingForm(false)
        setHearingForm({ title: '', hearingDate: '', startTime: '10:00', court: '', courtType: '', notes: '', priority: 'MEDIUM' })
        fetchHearings()
      }
    } catch (err) {
      console.error('Hearing creation error:', err)
    } finally {
      setSavingHearing(false)
    }
  }

  const sendMessage = async () => {
    if (!chatInput.trim() || sendingMessage) return
    const userMsg = chatInput.trim()
    setChatInput('')
    setSendingMessage(true)

    const tempId = Date.now().toString()
    setChatMessages(prev => [...prev, { id: tempId, role: 'user', content: userMsg, createdAt: new Date().toISOString() }])

    try {
      const res = await fetch('/api/cases/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg, caseId, sessionId: chatSessionId })
      })
      const data = await res.json()
      if (data.sessionId) setChatSessionId(data.sessionId)
      setChatMessages(prev => [...prev, {
        id: Date.now().toString() + '_ai',
        role: 'assistant',
        content: data.message || data.error || 'No response',
        createdAt: new Date().toISOString()
      }])
    } catch (err) {
      setChatMessages(prev => [...prev, {
        id: Date.now().toString() + '_err',
        role: 'assistant',
        content: 'Failed to get response. Please try again.',
        createdAt: new Date().toISOString()
      }])
    } finally {
      setSendingMessage(false)
    }
  }

  const createDriveFolder = async () => {
    setCreatingDriveFolder(true)
    setDriveMessage('')
    try {
      const res = await fetch('/api/cases/drive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ caseId })
      })
      const data = await res.json()
      if (res.ok) {
        setCaseData(prev => prev ? { ...prev, googleDriveFolderUrl: data.folderUrl, googleDriveFolderId: data.folderId } : prev)
        setDriveMessage('Google Drive folder created!')
      } else {
        setDriveMessage(data.error || 'Failed to create folder')
      }
    } catch (err) {
      setDriveMessage('Error connecting to Google Drive')
    } finally {
      setCreatingDriveFolder(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    )
  }

  if (error || !caseData) {
    return (
      <div className="p-8 text-center">
        <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <p className="text-gray-600">{error || 'Case not found'}</p>
        <Link href="/cases" className="mt-4 inline-flex items-center gap-2 text-indigo-600 hover:underline">
          <ArrowLeft className="w-4 h-4" /> Back to Cases
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
            <Link href="/cases" className="hover:text-indigo-600 flex items-center gap-1">
              <ArrowLeft className="w-4 h-4" /> Cases
            </Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-gray-900 font-medium">{caseData.title}</span>
          </div>
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-2xl font-bold text-gray-900">{caseData.title}</h1>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${STATUS_COLORS[caseData.status] || 'bg-gray-100 text-gray-700'}`}>
                  {caseData.status}
                </span>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${PRIORITY_COLORS[caseData.priority] || 'bg-gray-100 text-gray-700'}`}>
                  {caseData.priority}
                </span>
              </div>
              <p className="text-gray-500 text-sm">{caseData.caseType || 'General'} • Created {new Date(caseData.createdAt).toLocaleDateString()}</p>
            </div>
            <div className="flex items-center gap-2">
              {caseData.googleDriveFolderUrl ? (
                <a
                  href={caseData.googleDriveFolderUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <FolderOpen className="w-4 h-4 text-yellow-500" />
                  Open Drive Folder
                  <ExternalLink className="w-3 h-3" />
                </a>
              ) : (
                <button
                  onClick={createDriveFolder}
                  disabled={creatingDriveFolder}
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  {creatingDriveFolder ? <Loader2 className="w-4 h-4 animate-spin" /> : <FolderOpen className="w-4 h-4 text-gray-400" />}
                  Connect Drive
                </button>
              )}
            </div>
          </div>
          {driveMessage && (
            <p className={`text-sm mt-2 ${driveMessage.includes('created') ? 'text-green-600' : 'text-red-600'}`}>
              {driveMessage}
            </p>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200 px-6">
        <div className="max-w-6xl mx-auto flex gap-6">
          {[
            { id: 'overview', label: 'Overview', icon: Briefcase },
            { id: 'documents', label: 'Documents', icon: FileText },
            { id: 'hearings', label: 'Hearings', icon: Calendar },
            { id: 'chat', label: 'AI Chat', icon: MessageSquare },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as Tab)}
              className={`flex items-center gap-2 py-3 px-1 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.id
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-6 py-6">

        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* Case Details Card */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">Case Details</h2>
                  {!editing ? (
                    <button
                      onClick={() => setEditing(true)}
                      className="flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-700"
                    >
                      <Edit2 className="w-4 h-4" /> Edit
                    </button>
                  ) : (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={saveCase}
                        disabled={saving}
                        className="flex items-center gap-1.5 text-sm bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                      >
                        {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                        Save
                      </button>
                      <button onClick={() => { setEditing(false); setEditForm(caseData) }} className="text-gray-500 hover:text-gray-700">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                {editing ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Title</label>
                      <input
                        value={editForm.title || ''}
                        onChange={e => setEditForm({ ...editForm, title: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Description</label>
                      <textarea
                        value={editForm.description || ''}
                        onChange={e => setEditForm({ ...editForm, description: e.target.value })}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
                        <select
                          value={editForm.status || 'ACTIVE'}
                          onChange={e => setEditForm({ ...editForm, status: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        >
                          {['ACTIVE', 'PENDING', 'REVIEW', 'URGENT', 'CLOSED'].map(s => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Priority</label>
                        <select
                          value={editForm.priority || 'MEDIUM'}
                          onChange={e => setEditForm({ ...editForm, priority: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        >
                          {['LOW', 'MEDIUM', 'HIGH'].map(p => (
                            <option key={p} value={p}>{p}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Case Type</label>
                        <input
                          value={editForm.caseType || ''}
                          onChange={e => setEditForm({ ...editForm, caseType: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                          placeholder="e.g. Civil Litigation"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Assigned To</label>
                        <input
                          value={editForm.assignedTo || ''}
                          onChange={e => setEditForm({ ...editForm, assignedTo: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                          placeholder="Attorney name"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {caseData.description && (
                      <p className="text-gray-700 text-sm leading-relaxed">{caseData.description}</p>
                    )}
                    <div className="grid grid-cols-2 gap-y-3 text-sm">
                      <div>
                        <span className="text-gray-500">Case Type</span>
                        <p className="font-medium text-gray-900 mt-0.5">{caseData.caseType || '—'}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Assigned To</span>
                        <p className="font-medium text-gray-900 mt-0.5">{caseData.assignedTo || '—'}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Next Hearing</span>
                        <p className="font-medium text-gray-900 mt-0.5">
                          {caseData.nextHearing ? new Date(caseData.nextHearing).toLocaleDateString() : '—'}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-500">Case Value</span>
                        <p className="font-medium text-gray-900 mt-0.5">
                          {caseData.caseValue ? `$${caseData.caseValue.toLocaleString()}` : '—'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Quick Actions */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setActiveTab('documents')}
                    className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 text-left transition-colors"
                  >
                    <FileText className="w-5 h-5 text-blue-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Documents</p>
                      <p className="text-xs text-gray-500">Upload & manage</p>
                    </div>
                  </button>
                  <button
                    onClick={() => setActiveTab('hearings')}
                    className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 text-left transition-colors"
                  >
                    <Calendar className="w-5 h-5 text-green-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Hearings</p>
                      <p className="text-xs text-gray-500">Schedule & track</p>
                    </div>
                  </button>
                  <button
                    onClick={() => setActiveTab('chat')}
                    className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 text-left transition-colors"
                  >
                    <MessageSquare className="w-5 h-5 text-purple-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">AI Chat</p>
                      <p className="text-xs text-gray-500">Get AI assistance</p>
                    </div>
                  </button>
                  <Link
                    href="/dictation"
                    className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 text-left transition-colors"
                  >
                    <Mic className="w-5 h-5 text-red-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Dictation</p>
                      <p className="text-xs text-gray-500">Voice to text</p>
                    </div>
                  </Link>
                </div>
              </div>
            </div>

            {/* Client Info Card */}
            <div className="space-y-4">
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h2 className="text-base font-semibold text-gray-900 mb-4">Client Information</h2>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{caseData.clientName || 'No client assigned'}</p>
                    {caseData.clientEmail && <p className="text-sm text-gray-500">{caseData.clientEmail}</p>}
                  </div>
                </div>
                {caseData.clientPhone && (
                  <p className="text-sm text-gray-600">{caseData.clientPhone}</p>
                )}
              </div>

              {/* Drive Status */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h2 className="text-base font-semibold text-gray-900 mb-3">Google Drive</h2>
                {caseData.googleDriveFolderUrl ? (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-2 h-2 bg-green-400 rounded-full" />
                      <span className="text-sm text-green-700 font-medium">Connected</span>
                    </div>
                    <a
                      href={caseData.googleDriveFolderUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-indigo-600 hover:underline"
                    >
                      <FolderOpen className="w-4 h-4" />
                      Open Case Folder
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm text-gray-500 mb-3">
                      Connect a Google Drive folder to store all case files in one place.
                    </p>
                    <button
                      onClick={createDriveFolder}
                      disabled={creatingDriveFolder}
                      className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                    >
                      {creatingDriveFolder ? <Loader2 className="w-4 h-4 animate-spin" /> : <FolderOpen className="w-4 h-4" />}
                      Create Drive Folder
                    </button>
                    {driveMessage && (
                      <p className="text-xs text-red-600 mt-2">{driveMessage}</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* DOCUMENTS TAB */}
        {activeTab === 'documents' && (
          <div className="bg-white rounded-xl border border-gray-200">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">Documents</h2>
              <div className="flex items-center gap-3">
                {caseData.googleDriveFolderUrl && (
                  <a
                    href={caseData.googleDriveFolderUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <FolderOpen className="w-4 h-4 text-yellow-500" />
                    Drive Folder
                  </a>
                )}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
                >
                  {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  Upload
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  onChange={e => e.target.files?.[0] && uploadDocument(e.target.files[0])}
                  accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg"
                />
              </div>
            </div>

            {documents.length === 0 ? (
              <div className="p-12 text-center">
                <FileText className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">No documents yet</p>
                <p className="text-gray-400 text-sm mt-1">Upload documents to get started</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {documents.map(doc => (
                  <div key={doc.id} className="flex items-center justify-between px-6 py-4 hover:bg-gray-50">
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-blue-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{doc.originalName}</p>
                        <p className="text-xs text-gray-500">
                          {(doc.size / 1024).toFixed(1)} KB • {new Date(doc.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <a
                        href={`/api/documents/${doc.id}/pdf`}
                        target="_blank"
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Download"
                      >
                        <Download className="w-4 h-4 text-gray-500" />
                      </a>
                      <button
                        onClick={() => deleteDocument(doc.id)}
                        className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4 text-red-400" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* HEARINGS TAB */}
        {activeTab === 'hearings' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Hearings</h2>
              <button
                onClick={() => setShowHearingForm(!showHearingForm)}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700"
              >
                <Plus className="w-4 h-4" />
                Add Hearing
              </button>
            </div>

            {showHearingForm && (
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-base font-semibold text-gray-900 mb-4">Schedule New Hearing</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-gray-500 mb-1">Hearing Title *</label>
                    <input
                      value={hearingForm.title}
                      onChange={e => setHearingForm({ ...hearingForm, title: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      placeholder="e.g. Preliminary Hearing"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Date *</label>
                    <input
                      type="date"
                      value={hearingForm.hearingDate}
                      onChange={e => setHearingForm({ ...hearingForm, hearingDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Time</label>
                    <input
                      type="time"
                      value={hearingForm.startTime}
                      onChange={e => setHearingForm({ ...hearingForm, startTime: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Court</label>
                    <input
                      value={hearingForm.court}
                      onChange={e => setHearingForm({ ...hearingForm, court: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      placeholder="Court name"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Priority</label>
                    <select
                      value={hearingForm.priority}
                      onChange={e => setHearingForm({ ...hearingForm, priority: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    >
                      {['LOW', 'MEDIUM', 'HIGH', 'URGENT'].map(p => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-gray-500 mb-1">Notes</label>
                    <textarea
                      value={hearingForm.notes}
                      onChange={e => setHearingForm({ ...hearingForm, notes: e.target.value })}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      placeholder="Additional notes..."
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-3 mt-4">
                  <button
                    onClick={() => setShowHearingForm(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={createHearing}
                    disabled={savingHearing}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {savingHearing ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                    Schedule Hearing
                  </button>
                </div>
              </div>
            )}

            {hearings.length === 0 && !showHearingForm ? (
              <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                <Calendar className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">No hearings scheduled</p>
                <p className="text-gray-400 text-sm mt-1">Add a hearing to track court dates</p>
              </div>
            ) : (
              <div className="space-y-3">
                {hearings.map(hearing => (
                  <div key={hearing.id} className="bg-white rounded-xl border border-gray-200 p-5">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-900">{hearing.title}</h3>
                        <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {new Date(hearing.hearingDate).toLocaleDateString()} at {hearing.startTime}
                          </span>
                          {hearing.court && (
                            <span className="flex items-center gap-1">
                              <Scale className="w-4 h-4" />
                              {hearing.court}
                            </span>
                          )}
                        </div>
                        {hearing.notes && (
                          <p className="text-sm text-gray-600 mt-2">{hearing.notes}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[hearing.status] || 'bg-gray-100 text-gray-700'}`}>
                          {hearing.status}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${PRIORITY_COLORS[hearing.priority] || 'bg-gray-100 text-gray-700'}`}>
                          {hearing.priority}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* CHAT TAB */}
        {activeTab === 'chat' && (
          <div className="bg-white rounded-xl border border-gray-200 flex flex-col" style={{ height: '65vh' }}>
            <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100">
              <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                <MessageSquare className="w-4 h-4 text-indigo-600" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-gray-900">AI Case Assistant</h2>
                <p className="text-xs text-gray-500">Ask anything about this case</p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {chatMessages.length === 0 && (
                <div className="text-center py-8">
                  <MessageSquare className="w-8 h-8 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm">Ask me anything about this case</p>
                  <div className="mt-4 flex flex-wrap gap-2 justify-center">
                    {[
                      'What are the key legal issues?',
                      'Summarize the case status',
                      'What documents do I need?',
                      'Draft a hearing preparation checklist'
                    ].map(suggestion => (
                      <button
                        key={suggestion}
                        onClick={() => setChatInput(suggestion)}
                        className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-full transition-colors"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {chatMessages.map(msg => (
                <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.role !== 'user' && (
                    <div className="w-7 h-7 bg-indigo-600 rounded-full flex items-center justify-center mr-2 mt-1 flex-shrink-0">
                      <Scale className="w-3.5 h-3.5 text-white" />
                    </div>
                  )}
                  <div className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm ${msg.role === 'user'
                      ? 'bg-indigo-600 text-white rounded-tr-sm'
                      : 'bg-gray-100 text-gray-900 rounded-tl-sm'
                    }`}>
                    {msg.role === 'user' ? (
                      <p>{msg.content}</p>
                    ) : (
                      <div className="prose prose-sm max-w-none prose-p:my-1 prose-ul:my-1">
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {sendingMessage && (
                <div className="flex justify-start">
                  <div className="w-7 h-7 bg-indigo-600 rounded-full flex items-center justify-center mr-2 flex-shrink-0">
                    <Scale className="w-3.5 h-3.5 text-white" />
                  </div>
                  <div className="bg-gray-100 rounded-2xl rounded-tl-sm px-4 py-3">
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input */}
            <div className="px-6 py-4 border-t border-gray-100">
              <div className="flex items-center gap-3">
                <input
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                  placeholder="Ask about this case..."
                  className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  disabled={sendingMessage}
                />
                <button
                  onClick={sendMessage}
                  disabled={!chatInput.trim() || sendingMessage}
                  className="w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
