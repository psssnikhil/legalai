'use client'

import { useState, useEffect } from 'react'
import { Building2, Users, Bell, Shield, CreditCard, Globe, Save, Sparkles, AlertCircle, CheckCircle } from 'lucide-react'

export default function CompanySettingsPage() {
    const [activeTab, setActiveTab] = useState('company')
    const [ragEnabled, setRagEnabled] = useState(false)
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

    const tabs = [
        { id: 'company', label: 'Company Info', icon: Building2 },
        { id: 'team', label: 'Team Members', icon: Users },
        { id: 'notifications', label: 'Notifications', icon: Bell },
        { id: 'security', label: 'Security', icon: Shield },
        { id: 'billing', label: 'Billing', icon: CreditCard },
        { id: 'preferences', label: 'Preferences', icon: Globe },
        { id: 'ai', label: 'AI Features', icon: Sparkles }
    ]

    // Load user settings on mount
    useEffect(() => {
        loadSettings()
    }, [])

    const loadSettings = async () => {
        try {
            const response = await fetch('/api/user/settings')
            if (response.ok) {
                const data = await response.json()
                setRagEnabled(data.settings?.ragEnabled || false)
            }
        } catch (error) {
            console.error('Error loading settings:', error)
        }
    }

    const handleSaveAISettings = async () => {
        setLoading(true)
        setMessage(null)

        try {
            const response = await fetch('/api/user/settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ragEnabled })
            })

            if (response.ok) {
                setMessage({ type: 'success', text: 'AI settings saved successfully!' })
            } else {
                setMessage({ type: 'error', text: 'Failed to save settings' })
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'An error occurred while saving' })
        } finally {
            setLoading(false)
            setTimeout(() => setMessage(null), 3000)
        }
    }

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-[1400px] mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-gray-900">Company Settings</h1>
                    <p className="text-gray-600 mt-1">Manage your organization settings and preferences</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {/* Sidebar */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-xl border border-gray-200 p-2 sticky top-6">
                            <nav className="space-y-1">
                                {tabs.map((tab) => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === tab.id
                                            ? 'bg-blue-50 text-blue-700'
                                            : 'text-gray-700 hover:bg-gray-50'
                                            }`}
                                    >
                                        <tab.icon className="w-5 h-5" />
                                        <span className="font-medium">{tab.label}</span>
                                    </button>
                                ))}
                            </nav>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="lg:col-span-3">
                        <div className="bg-white rounded-xl border border-gray-200 p-8">
                            {activeTab === 'company' && (
                                <div className="space-y-6">
                                    <div>
                                        <h2 className="text-xl font-bold text-gray-900 mb-6">Company Information</h2>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Company Name
                                            </label>
                                            <input
                                                type="text"
                                                defaultValue="Legal AI Solutions"
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Business Type
                                            </label>
                                            <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                                                <option>Law Firm</option>
                                                <option>Corporate Legal</option>
                                                <option>Solo Practitioner</option>
                                                <option>Government</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Email
                                            </label>
                                            <input
                                                type="email"
                                                defaultValue="contact@legalai.com"
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Phone
                                            </label>
                                            <input
                                                type="tel"
                                                defaultValue="+1 (555) 123-4567"
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Address
                                        </label>
                                        <textarea
                                            defaultValue="123 Legal Street, Suite 400, New York, NY 10001"
                                            rows={3}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    </div>

                                    <div className="flex justify-end pt-4">
                                        <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
                                            <Save className="w-4 h-4" />
                                            Save Changes
                                        </button>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'team' && (
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900 mb-6">Team Members</h2>
                                    <div className="space-y-4">
                                        {[1, 2, 3].map((i) => (
                                            <div key={i} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                                        <Users className="w-5 h-5 text-blue-600" />
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-gray-900">Team Member {i}</p>
                                                        <p className="text-sm text-gray-500">member{i}@legalai.com</p>
                                                    </div>
                                                </div>
                                                <button className="px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                                                    Remove
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                    <button className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                                        Invite Team Member
                                    </button>
                                </div>
                            )}

                            {activeTab === 'notifications' && (
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900 mb-6">Notification Preferences</h2>
                                    <div className="space-y-4">
                                        {['Email notifications', 'Push notifications', 'Case updates', 'Deadline reminders'].map((item, i) => (
                                            <label key={i} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                                                <span className="text-gray-700">{item}</span>
                                                <input type="checkbox" defaultChecked className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500" />
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {activeTab === 'security' && (
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900 mb-6">Security Settings</h2>
                                    <div className="space-y-6">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Two-Factor Authentication
                                            </label>
                                            <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                                                Enable 2FA
                                            </button>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Change Password
                                            </label>
                                            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                                                Update Password
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'billing' && (
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900 mb-6">Billing & Subscription</h2>
                                    <div className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
                                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Pro Plan</h3>
                                        <p className="text-3xl font-bold text-blue-600 mb-4">$99<span className="text-lg font-normal text-gray-600">/month</span></p>
                                        <ul className="space-y-2 text-sm text-gray-700 mb-6">
                                            <li>✓ Unlimited cases</li>
                                            <li>✓ AI-powered analysis</li>
                                            <li>✓ Team collaboration</li>
                                            <li>✓ Priority support</li>
                                        </ul>
                                        <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                                            Manage Subscription
                                        </button>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'preferences' && (
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900 mb-6">Preferences</h2>
                                    <div className="space-y-6">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Language
                                            </label>
                                            <select className="w-full md:w-64 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                                                <option>English</option>
                                                <option>Spanish</option>
                                                <option>French</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Time Zone
                                            </label>
                                            <select className="w-full md:w-64 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                                                <option>EST (UTC-5)</option>
                                                <option>PST (UTC-8)</option>
                                                <option>CST (UTC-6)</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'ai' && (
                                <div className="space-y-6">
                                    <div>
                                        <h2 className="text-xl font-bold text-gray-900 mb-2">AI Features</h2>
                                        <p className="text-gray-600 text-sm">Configure advanced AI capabilities for your chat assistant</p>
                                    </div>

                                    {/* Success/Error Message */}
                                    {message && (
                                        <div className={`flex items-center gap-2 p-4 rounded-lg ${message.type === 'success'
                                                ? 'bg-green-50 border border-green-200 text-green-800'
                                                : 'bg-red-50 border border-red-200 text-red-800'
                                            }`}>
                                            {message.type === 'success' ? (
                                                <CheckCircle className="w-5 h-5" />
                                            ) : (
                                                <AlertCircle className="w-5 h-5" />
                                            )}
                                            <p>{message.text}</p>
                                        </div>
                                    )}

                                    {/* RAG Feature Toggle */}
                                    <div className="border border-gray-200 rounded-lg p-6">
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <Sparkles className="w-5 h-5 text-indigo-600" />
                                                    <h3 className="text-lg font-semibold text-gray-900">
                                                        RAG (Retrieval-Augmented Generation)
                                                    </h3>
                                                </div>
                                                <p className="text-sm text-gray-600 mb-3">
                                                    Enable intelligent document retrieval for more accurate AI responses with source citations
                                                </p>
                                                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
                                                    <div className="flex items-start gap-2">
                                                        <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                                                        <div className="text-xs text-amber-800">
                                                            <p className="font-semibold mb-1">Important Notes:</p>
                                                            <ul className="space-y-1 list-disc list-inside">
                                                                <li>This feature uses OpenAI embeddings and may incur additional API costs</li>
                                                                <li>Documents are indexed in-memory and cleared after each session</li>
                                                                <li>Responses will include citations to source documents</li>
                                                                <li>Best for working with multiple documents simultaneously</li>
                                                            </ul>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="space-y-2 text-sm text-gray-700">
                                                    <p><span className="font-medium">✓ When enabled:</span> AI will search through your documents to find relevant information</p>
                                                    <p><span className="font-medium">✓ Source attribution:</span> Responses include references to specific documents</p>
                                                    <p><span className="font-medium">✓ Better accuracy:</span> Grounded in your actual document content</p>
                                                </div>
                                            </div>
                                            <label className="relative inline-flex items-center cursor-pointer ml-4">
                                                <input
                                                    type="checkbox"
                                                    checked={ragEnabled}
                                                    onChange={(e) => setRagEnabled(e.target.checked)}
                                                    className="sr-only peer"
                                                />
                                                <div className="w-14 h-7 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:start-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-indigo-600"></div>
                                            </label>
                                        </div>
                                    </div>

                                    {/* Status Indicator */}
                                    <div className={`flex items-center gap-2 text-sm ${ragEnabled ? 'text-green-600' : 'text-gray-500'}`}>
                                        <div className={`w-2 h-2 rounded-full ${ragEnabled ? 'bg-green-600' : 'bg-gray-400'}`}></div>
                                        <span className="font-medium">
                                            RAG is currently {ragEnabled ? 'enabled' : 'disabled'}
                                        </span>
                                    </div>

                                    {/* Save Button */}
                                    <div className="flex justify-end pt-4 border-t border-gray-200">
                                        <button
                                            onClick={handleSaveAISettings}
                                            disabled={loading}
                                            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <Save className="w-4 h-4" />
                                            {loading ? 'Saving...' : 'Save AI Settings'}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

