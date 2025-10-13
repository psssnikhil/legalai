'use client'

import { useState } from 'react'
import { X, Plus, Trash2, Building2, User as UserIcon } from 'lucide-react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'

interface CustomField {
  id: string
  label: string
  value: string
  type: 'text' | 'number' | 'email' | 'date' | 'phone'
}

interface AddClientModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function AddClientModal({ isOpen, onClose, onSuccess }: AddClientModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Basic fields
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [company, setCompany] = useState('')
  const [address, setAddress] = useState('')
  const [clientType, setClientType] = useState('INDIVIDUAL')

  // Custom fields
  const [customFields, setCustomFields] = useState<CustomField[]>([])

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // Validate required fields
      if (!name || !email || !phone) {
        setError('Name, email, and phone are required')
        setLoading(false)
        return
      }

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

      const payload = {
        name,
        email,
        phone,
        company: company || undefined,
        address: address || undefined,
        clientType,
        customFields: Object.keys(customFieldsObject).length > 0 ? customFieldsObject : undefined
      }

      console.log('Submitting client:', payload)

      const response = await fetch('/api/clients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })

      const data = await response.json()
      console.log('Response:', { status: response.status, data })

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create client')
      }

      console.log('Client created successfully:', data.client)

      // Reset form
      setName('')
      setEmail('')
      setPhone('')
      setCompany('')
      setAddress('')
      setClientType('INDIVIDUAL')
      setCustomFields([])

      // Call onSuccess first to refresh the list
      await onSuccess()

      // Then close the modal
      onClose()
    } catch (err) {
      console.error('Error creating client:', err)
      setError(err instanceof Error ? err.message : 'Failed to create client')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Add New Client</h2>
            <p className="text-sm text-slate-600 mt-1">Enter client information and add custom fields if needed</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
            {error && (
              <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            {/* Client Type */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Client Type *
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setClientType('INDIVIDUAL')}
                  className={`p-4 rounded-lg border-2 transition-all duration-200 ${clientType === 'INDIVIDUAL'
                    ? 'border-indigo-500 bg-indigo-50 shadow-sm'
                    : 'border-slate-200 hover:border-slate-300'
                    }`}
                >
                  <UserIcon className={`w-6 h-6 mx-auto mb-2 ${clientType === 'INDIVIDUAL' ? 'text-indigo-600' : 'text-slate-400'
                    }`} />
                  <div className="font-medium text-slate-900">Individual</div>
                  <div className="text-xs text-slate-500">Person</div>
                </button>
                <button
                  type="button"
                  onClick={() => setClientType('COMPANY')}
                  className={`p-4 rounded-lg border-2 transition-all duration-200 ${clientType === 'COMPANY'
                    ? 'border-indigo-500 bg-indigo-50 shadow-sm'
                    : 'border-slate-200 hover:border-slate-300'
                    }`}
                >
                  <Building2 className={`w-6 h-6 mx-auto mb-2 ${clientType === 'COMPANY' ? 'text-indigo-600' : 'text-slate-400'
                    }`} />
                  <div className="font-medium text-slate-900">Company</div>
                  <div className="text-xs text-slate-500">Business</div>
                </button>
              </div>
            </div>

            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-900">Basic Information</h3>

              <div>
                <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-2">
                  {clientType === 'COMPANY' ? 'Company Name' : 'Full Name'} *
                </label>
                <Input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={clientType === 'COMPANY' ? 'ABC Corporation' : 'John Doe'}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">
                    Email *
                  </label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email@example.com"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-slate-700 mb-2">
                    Phone *
                  </label>
                  <Input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 (555) 123-4567"
                    required
                  />
                </div>
              </div>

              {clientType === 'COMPANY' && (
                <div>
                  <label htmlFor="company" className="block text-sm font-medium text-slate-700 mb-2">
                    Company Name (Optional)
                  </label>
                  <Input
                    id="company"
                    type="text"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    placeholder="ABC Corporation"
                  />
                </div>
              )}

              <div>
                <label htmlFor="address" className="block text-sm font-medium text-slate-700 mb-2">
                  Address (Optional)
                </label>
                <Input
                  id="address"
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="123 Main St, City, State, ZIP"
                />
              </div>
            </div>

            {/* Custom Fields */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">Custom Fields</h3>
                  <p className="text-sm text-slate-600">Add additional fields specific to this client</p>
                </div>
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

              {customFields.length > 0 && (
                <div className="space-y-3">
                  {customFields.map((field) => (
                    <div key={field.id} className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                        <div className="md:col-span-4">
                          <label className="block text-xs font-medium text-slate-700 mb-1">
                            Field Name
                          </label>
                          <Input
                            type="text"
                            value={field.label}
                            onChange={(e) => updateCustomField(field.id, 'label', e.target.value)}
                            placeholder="e.g., Tax ID"
                          />
                        </div>
                        <div className="md:col-span-3">
                          <label className="block text-xs font-medium text-slate-700 mb-1">
                            Type
                          </label>
                          <Select
                            value={field.type}
                            onChange={(e) => updateCustomField(field.id, 'type', e.target.value)}
                          >
                            <option value="text">Text</option>
                            <option value="number">Number</option>
                            <option value="email">Email</option>
                            <option value="phone">Phone</option>
                            <option value="date">Date</option>
                          </Select>
                        </div>
                        <div className="md:col-span-4">
                          <label className="block text-xs font-medium text-slate-700 mb-1">
                            Value
                          </label>
                          <Input
                            type={field.type}
                            value={field.value}
                            onChange={(e) => updateCustomField(field.id, 'value', e.target.value)}
                            placeholder="Enter value"
                          />
                        </div>
                        <div className="md:col-span-1 flex items-end">
                          <button
                            type="button"
                            onClick={() => removeCustomField(field.id)}
                            className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-all duration-200"
                            title="Remove field"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {customFields.length === 0 && (
                <div className="text-center py-8 bg-slate-50 rounded-lg border-2 border-dashed border-slate-200">
                  <Plus className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <p className="text-sm text-slate-600">No custom fields added</p>
                  <p className="text-xs text-slate-500 mt-1">Click "Add Field" to add custom fields</p>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={loading}
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create Client'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

