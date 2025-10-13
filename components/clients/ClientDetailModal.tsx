'use client'

import { useState, useEffect } from 'react'
import { X, Plus, Trash2, Edit2, Save, Mail, Phone, MapPin, Building2, Briefcase, FileText, Calendar, User as UserIcon } from 'lucide-react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Badge from '@/components/ui/Badge'
import Card from '@/components/ui/Card'

interface CustomField {
  id: string
  label: string
  value: string
  type: 'text' | 'number' | 'email' | 'date' | 'phone'
}

interface Client {
  id: string
  name: string
  email: string
  phone: string
  company?: string
  address?: string
  clientType: string
  status: string
  customFields?: Record<string, { value: string; type: string }>
  activeCases: number
  totalCases: number
  totalDocuments: number
  totalHearings: number
  createdAt: string
  cases?: any[]
  documents?: any[]
  hearings?: any[]
}

interface ClientDetailModalProps {
  isOpen: boolean
  clientId: string | null
  onClose: () => void
  onSuccess: () => void
}

export default function ClientDetailModal({ isOpen, clientId, onClose, onSuccess }: ClientDetailModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [client, setClient] = useState<Client | null>(null)

  // Edit form state
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [company, setCompany] = useState('')
  const [address, setAddress] = useState('')
  const [clientType, setClientType] = useState('INDIVIDUAL')
  const [status, setStatus] = useState('ACTIVE')
  const [customFields, setCustomFields] = useState<CustomField[]>([])

  useEffect(() => {
    if (isOpen && clientId) {
      fetchClient()
    }
  }, [isOpen, clientId])

  const fetchClient = async () => {
    if (!clientId) return
    
    setLoading(true)
    setError('')
    
    try {
      const response = await fetch(`/api/clients/${clientId}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch client')
      }

      setClient(data.client)
      
      // Set form values
      setName(data.client.name)
      setEmail(data.client.email)
      setPhone(data.client.phone)
      setCompany(data.client.company || '')
      setAddress(data.client.address || '')
      setClientType(data.client.clientType)
      setStatus(data.client.status)

      // Convert custom fields object to array
      if (data.client.customFields) {
        const fieldsArray: CustomField[] = Object.entries(data.client.customFields).map(([label, fieldData]: [string, any], index) => ({
          id: `${Date.now()}-${index}`,
          label,
          value: fieldData.value,
          type: fieldData.type
        }))
        setCustomFields(fieldsArray)
      } else {
        setCustomFields([])
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch client')
    } finally {
      setLoading(false)
    }
  }

  const addCustomField = () => {
    const newField: CustomField = {
      id: Date.now().toString(),
      label: '',
      value: '',
      type: 'text'
    }
    setCustomFields([...customFields, newField])
  }

  const removeCustomField = (id: string) => {
    setCustomFields(customFields.filter(field => field.id !== id))
  }

  const updateCustomField = (id: string, key: keyof CustomField, value: string) => {
    setCustomFields(customFields.map(field =>
      field.id === id ? { ...field, [key]: value } : field
    ))
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!clientId) return

    setError('')
    setLoading(true)

    try {
      // Convert custom fields to object
      const customFieldsObject: Record<string, any> = {}
      customFields.forEach(field => {
        if (field.label && field.value) {
          customFieldsObject[field.label] = {
            value: field.value,
            type: field.type
          }
        }
      })

      const response = await fetch(`/api/clients/${clientId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name,
          email,
          phone,
          company: company || undefined,
          address: address || undefined,
          clientType,
          status,
          customFields: Object.keys(customFieldsObject).length > 0 ? customFieldsObject : undefined
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update client')
      }

      setClient(data.client)
      setIsEditing(false)
      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update client')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!clientId || !confirm('Are you sure you want to delete this client?')) return

    setLoading(true)
    setError('')

    try {
      const response = await fetch(`/api/clients/${clientId}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete client')
      }

      onSuccess()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete client')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen || !client) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <UserIcon className="w-8 h-8 text-white" />
              </div>
              <div>
                {isEditing ? (
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="text-2xl font-bold"
                  />
                ) : (
                  <h2 className="text-2xl font-bold text-slate-900">{client.name}</h2>
                )}
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant={client.status === 'ACTIVE' ? 'success' : client.status === 'INACTIVE' ? 'warning' : 'default'} dot>
                    {client.status}
                  </Badge>
                  <Badge variant="slate">
                    {client.clientType}
                  </Badge>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {!isEditing && (
                <Button
                  variant="outline"
                  size="sm"
                  icon={Edit2}
                  onClick={() => setIsEditing(true)}
                >
                  Edit
                </Button>
              )}
              <button
                onClick={onClose}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <Card className="text-center">
              <Briefcase className="w-6 h-6 text-blue-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-slate-900">{client.activeCases}</div>
              <div className="text-xs text-slate-600">Active Cases</div>
            </Card>
            <Card className="text-center">
              <Briefcase className="w-6 h-6 text-slate-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-slate-900">{client.totalCases}</div>
              <div className="text-xs text-slate-600">Total Cases</div>
            </Card>
            <Card className="text-center">
              <FileText className="w-6 h-6 text-purple-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-slate-900">{client.totalDocuments}</div>
              <div className="text-xs text-slate-600">Documents</div>
            </Card>
            <Card className="text-center">
              <Calendar className="w-6 h-6 text-emerald-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-slate-900">{client.totalHearings}</div>
              <div className="text-xs text-slate-600">Hearings</div>
            </Card>
          </div>

          {isEditing ? (
            <form onSubmit={handleUpdate} className="space-y-6">
              {/* Edit Form */}
              <Card>
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Basic Information</h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Email *
                      </label>
                      <Input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Phone *
                      </label>
                      <Input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Company
                    </label>
                    <Input
                      type="text"
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Address
                    </label>
                    <Input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Client Type
                      </label>
                      <Select
                        value={clientType}
                        onChange={(e) => setClientType(e.target.value)}
                      >
                        <option value="INDIVIDUAL">Individual</option>
                        <option value="COMPANY">Company</option>
                        <option value="ORGANIZATION">Organization</option>
                      </Select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Status
                      </label>
                      <Select
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                      >
                        <option value="ACTIVE">Active</option>
                        <option value="INACTIVE">Inactive</option>
                        <option value="ARCHIVED">Archived</option>
                      </Select>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Custom Fields in Edit Mode */}
              <Card>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-slate-900">Custom Fields</h3>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    icon={Plus}
                    onClick={addCustomField}
                  >
                    Add Field
                  </Button>
                </div>

                <div className="space-y-3">
                  {customFields.map((field) => (
                    <div key={field.id} className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                      <div className="grid grid-cols-12 gap-3">
                        <div className="col-span-4">
                          <Input
                            type="text"
                            value={field.label}
                            onChange={(e) => updateCustomField(field.id, 'label', e.target.value)}
                            placeholder="Field Name"
                            size="sm"
                          />
                        </div>
                        <div className="col-span-3">
                          <Select
                            value={field.type}
                            onChange={(e) => updateCustomField(field.id, 'type', e.target.value)}
                            size="sm"
                          >
                            <option value="text">Text</option>
                            <option value="number">Number</option>
                            <option value="email">Email</option>
                            <option value="phone">Phone</option>
                            <option value="date">Date</option>
                          </Select>
                        </div>
                        <div className="col-span-4">
                          <Input
                            type={field.type}
                            value={field.value}
                            onChange={(e) => updateCustomField(field.id, 'value', e.target.value)}
                            placeholder="Value"
                            size="sm"
                          />
                        </div>
                        <div className="col-span-1 flex items-center">
                          <button
                            type="button"
                            onClick={() => removeCustomField(field.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}

                  {customFields.length === 0 && (
                    <div className="text-center py-6 text-sm text-slate-500">
                      No custom fields added
                    </div>
                  )}
                </div>
              </Card>

              {/* Edit Actions */}
              <div className="flex items-center justify-between">
                <Button
                  type="button"
                  variant="danger"
                  onClick={handleDelete}
                  disabled={loading}
                >
                  Delete Client
                </Button>
                <div className="flex items-center gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsEditing(false)
                      // Reset form
                      setName(client.name)
                      setEmail(client.email)
                      setPhone(client.phone)
                      setCompany(client.company || '')
                      setAddress(client.address || '')
                      setClientType(client.clientType)
                      setStatus(client.status)
                    }}
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    icon={Save}
                    loading={loading}
                    disabled={loading}
                  >
                    Save Changes
                  </Button>
                </div>
              </div>
            </form>
          ) : (
            <div className="space-y-6">
              {/* View Mode */}
              <Card>
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Contact Information</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-slate-700">
                    <Mail className="w-5 h-5 text-slate-400" />
                    <span>{client.email}</span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-700">
                    <Phone className="w-5 h-5 text-slate-400" />
                    <span>{client.phone}</span>
                  </div>
                  {client.company && (
                    <div className="flex items-center gap-3 text-slate-700">
                      <Building2 className="w-5 h-5 text-slate-400" />
                      <span>{client.company}</span>
                    </div>
                  )}
                  {client.address && (
                    <div className="flex items-center gap-3 text-slate-700">
                      <MapPin className="w-5 h-5 text-slate-400" />
                      <span>{client.address}</span>
                    </div>
                  )}
                </div>
              </Card>

              {/* Custom Fields in View Mode */}
              {client.customFields && Object.keys(client.customFields).length > 0 && (
                <Card>
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">Custom Fields</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {Object.entries(client.customFields).map(([label, fieldData]: [string, any]) => (
                      <div key={label} className="bg-slate-50 p-3 rounded-lg">
                        <div className="text-xs font-medium text-slate-600 mb-1">{label}</div>
                        <div className="text-sm text-slate-900">{fieldData.value}</div>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {/* Recent Cases */}
              {client.cases && client.cases.length > 0 && (
                <Card>
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">Recent Cases</h3>
                  <div className="space-y-2">
                    {client.cases.map((caseItem: any) => (
                      <div key={caseItem.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                        <div>
                          <div className="font-medium text-slate-900">{caseItem.title}</div>
                          <div className="text-xs text-slate-500">
                            {new Date(caseItem.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                        <Badge variant={caseItem.status === 'ACTIVE' ? 'success' : 'default'}>
                          {caseItem.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

