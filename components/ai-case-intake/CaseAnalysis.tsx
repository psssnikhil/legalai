'use client'

import { useState, useEffect } from 'react'
import { 
  Brain, 
  Users, 
  Scale, 
  MapPin, 
  TrendingUp, 
  FileText, 
  CheckCircle, 
  AlertCircle,
  Edit3,
  Save,
  X,
  Loader2
} from 'lucide-react'

interface CaseAnalysisData {
  id?: string
  parties?: {
    plaintiff?: string
    defendant?: string
    other?: string[]
  }
  caseType?: string
  jurisdiction?: string
  winningProbability?: number
  keyFacts?: string[]
  evidence?: string[]
  actionItems?: string[]
  confidence?: number
  summary?: string
  legalIssues?: string[]
  timeline?: string[]
}

interface CaseAnalysisProps {
  data?: CaseAnalysisData | null
  sessionId?: string
}

export default function CaseAnalysis({ data, sessionId }: CaseAnalysisProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editedData, setEditedData] = useState<CaseAnalysisData>(data || {})
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(!data)
  const [analysisData, setAnalysisData] = useState<CaseAnalysisData | null>(data || null)

  useEffect(() => {
    if (!data && sessionId) {
      fetchAnalysis()
    }
  }, [sessionId, data])

  const fetchAnalysis = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/analysis?sessionId=${sessionId}`)
      if (response.ok) {
        const result = await response.json()
        setAnalysisData(result.analysis)
        setEditedData(result.analysis)
      }
    } catch (error) {
      console.error('Error fetching analysis:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const generateAnalysis = async () => {
    if (!sessionId) return

    setIsLoading(true)
    try {
      const response = await fetch('/api/analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sessionId }),
      })

      if (response.ok) {
        const result = await response.json()
        setAnalysisData(result.analysis)
        setEditedData(result.analysis)
      }
    } catch (error) {
      console.error('Error generating analysis:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleEdit = () => {
    setIsEditing(true)
    setEditedData(analysisData || {})
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      // Save the edited analysis data
      await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate API call
      setIsEditing(false)
    } catch (error) {
      console.error('Error saving analysis:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    setIsEditing(false)
    setEditedData(analysisData || {})
  }

  const handleCreateCase = async () => {
    if (!analysisData) return

    setIsSaving(true)
    try {
      const response = await fetch('/api/cases/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: `${analysisData.parties?.plaintiff || 'Plaintiff'} v. ${analysisData.parties?.defendant || 'Defendant'}`,
          description: analysisData.summary || 'Case created from AI analysis',
          clientName: analysisData.parties?.plaintiff || 'Unknown Client',
          priority: analysisData.winningProbability && analysisData.winningProbability > 0.7 ? 'HIGH' : 'MEDIUM',
          analysisId: analysisData.id
        }),
      })

      if (response.ok) {
        const result = await response.json()
        alert(`Case created successfully! Case ID: ${result.case.id}`)
        // Optionally redirect to the case or refresh the page
      } else {
        throw new Error('Failed to create case')
      }
    } catch (error) {
      console.error('Error creating case:', error)
      alert('Failed to create case. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const getConfidenceColor = (confidence?: number) => {
    if (!confidence) return 'text-gray-500'
    if (confidence >= 0.8) return 'text-green-600'
    if (confidence >= 0.6) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getProbabilityColor = (probability?: number) => {
    if (!probability) return 'text-gray-500'
    if (probability >= 0.7) return 'text-green-600'
    if (probability >= 0.5) return 'text-yellow-600'
    return 'text-red-600'
  }

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-16 h-16 text-blue-600 mx-auto mb-4 animate-spin" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Analyzing Case...</h3>
          <p className="text-gray-600">
            AI is processing your case information
          </p>
        </div>
      </div>
    )
  }

  if (!analysisData) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <Brain className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Analysis Available</h3>
          <p className="text-gray-600 mb-4">
            Upload documents or chat with the AI to generate case analysis
          </p>
          {sessionId && (
            <button
              onClick={generateAnalysis}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Generate Analysis
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">AI Case Analysis</h2>
          <p className="text-gray-600">Review and edit the extracted case information</p>
        </div>
        <div className="flex items-center gap-3">
          {!isEditing ? (
            <button
              onClick={handleEdit}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Edit3 className="w-4 h-4" />
              Edit Analysis
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={handleCancel}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <X className="w-4 h-4" />
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
              >
                <Save className="w-4 h-4" />
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Analysis Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Parties */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Parties</h3>
          </div>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-gray-700">Plaintiff</label>
              {isEditing ? (
                <input
                  type="text"
                  value={editedData.parties?.plaintiff || ''}
                  onChange={(e) => setEditedData(prev => ({
                    ...prev,
                    parties: { ...prev.parties, plaintiff: e.target.value }
                  }))}
                  className="w-full mt-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              ) : (
                <p className="mt-1 text-gray-900">{analysisData?.parties?.plaintiff || 'Not identified'}</p>
              )}
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Defendant</label>
              {isEditing ? (
                <input
                  type="text"
                  value={editedData.parties?.defendant || ''}
                  onChange={(e) => setEditedData(prev => ({
                    ...prev,
                    parties: { ...prev.parties, defendant: e.target.value }
                  }))}
                  className="w-full mt-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              ) : (
                <p className="mt-1 text-gray-900">{analysisData?.parties?.defendant || 'Not identified'}</p>
              )}
            </div>
          </div>
        </div>

        {/* Case Type & Jurisdiction */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Scale className="w-5 h-5 text-green-600" />
            <h3 className="text-lg font-semibold text-gray-900">Case Details</h3>
          </div>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-gray-700">Case Type</label>
              {isEditing ? (
                <input
                  type="text"
                  value={editedData.caseType || ''}
                  onChange={(e) => setEditedData(prev => ({ ...prev, caseType: e.target.value }))}
                  className="w-full mt-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              ) : (
                <p className="mt-1 text-gray-900">{analysisData?.caseType || 'Not identified'}</p>
              )}
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Jurisdiction</label>
              {isEditing ? (
                <input
                  type="text"
                  value={editedData.jurisdiction || ''}
                  onChange={(e) => setEditedData(prev => ({ ...prev, jurisdiction: e.target.value }))}
                  className="w-full mt-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              ) : (
                <p className="mt-1 text-gray-900">{analysisData?.jurisdiction || 'Not identified'}</p>
              )}
            </div>
          </div>
        </div>

        {/* Winning Probability */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-purple-600" />
            <h3 className="text-lg font-semibold text-gray-900">Winning Probability</h3>
          </div>
          <div className="text-center">
            <div className={`text-4xl font-bold ${getProbabilityColor(analysisData?.winningProbability)}`}>
              {analysisData?.winningProbability ? `${Math.round(analysisData.winningProbability * 100)}%` : 'N/A'}
            </div>
            <div className="mt-2">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(analysisData?.winningProbability || 0) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Confidence Score */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Brain className="w-5 h-5 text-orange-600" />
            <h3 className="text-lg font-semibold text-gray-900">Analysis Confidence</h3>
          </div>
          <div className="text-center">
            <div className={`text-4xl font-bold ${getConfidenceColor(analysisData?.confidence)}`}>
              {analysisData?.confidence ? `${Math.round(analysisData.confidence * 100)}%` : 'N/A'}
            </div>
            <div className="mt-2">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-orange-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(analysisData?.confidence || 0) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Key Facts */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <FileText className="w-5 h-5 text-indigo-600" />
          <h3 className="text-lg font-semibold text-gray-900">Key Facts</h3>
        </div>
        {isEditing ? (
          <textarea
            value={editedData.keyFacts?.join('\n') || ''}
            onChange={(e) => setEditedData(prev => ({
              ...prev,
              keyFacts: e.target.value.split('\n').filter(fact => fact.trim())
            }))}
            className="w-full h-32 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter key facts, one per line..."
          />
        ) : (
          <div className="space-y-2">
            {analysisData?.keyFacts && analysisData.keyFacts.length > 0 ? (
              analysisData.keyFacts.map((fact, index) => (
                <div key={index} className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">{fact}</span>
                </div>
              ))
            ) : (
              <p className="text-gray-500">No key facts identified</p>
            )}
          </div>
        )}
      </div>

      {/* Action Items */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <h3 className="text-lg font-semibold text-gray-900">Immediate Action Items</h3>
        </div>
        {isEditing ? (
          <textarea
            value={editedData.actionItems?.join('\n') || ''}
            onChange={(e) => setEditedData(prev => ({
              ...prev,
              actionItems: e.target.value.split('\n').filter(item => item.trim())
            }))}
            className="w-full h-32 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter action items, one per line..."
          />
        ) : (
          <div className="space-y-2">
            {analysisData?.actionItems && analysisData.actionItems.length > 0 ? (
              analysisData.actionItems.map((item, index) => (
                <div key={index} className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">{item}</span>
                </div>
              ))
            ) : (
              <p className="text-gray-500">No action items identified</p>
            )}
          </div>
        )}
      </div>

      {/* Create Case Button */}
      <div className="text-center">
        <button 
          onClick={handleCreateCase}
          disabled={isSaving}
          className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-lg font-medium"
        >
          {isSaving ? 'Creating Case...' : 'Create Case from Analysis'}
        </button>
      </div>
    </div>
  )
}
