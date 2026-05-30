import React, { useState } from 'react'
import { 
  Webhook, 
  Settings, 
  Trash2,  
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  ExternalLink,
  Copy,
  Check
} from 'lucide-react'
import toast from 'react-hot-toast'
import { useAPI } from '../../../context/ApiContext'

export const WebhooksPage: React.FC = () => {
  const { selectedProject } = useAPI()
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedWebhook, setSelectedWebhook] = useState<any>(null)
  const [copiedSecret, setCopiedSecret] = useState(false)

  const webhooks = selectedProject?.webhooks || []

  const eventTypes = [
    { id: 'user.created', name: 'User Created', description: 'Triggered when a new user is created' },
    { id: 'user.updated', name: 'User Updated', description: 'Triggered when user information is updated' },
    { id: 'document.uploaded', name: 'Document Uploaded', description: 'Triggered when a document is uploaded' },
    { id: 'document.shared', name: 'Document Shared', description: 'Triggered when a document is shared' },
    { id: 'envelope.sent', name: 'Envelope Sent', description: 'Triggered when an envelope is sent for signature' },
    { id: 'envelope.viewed', name: 'Envelope Viewed', description: 'Triggered when a recipient views an envelope' },
    { id: 'envelope.signed', name: 'Envelope Signed', description: 'Triggered when an envelope is signed' },
    { id: 'envelope.completed', name: 'Envelope Completed', description: 'Triggered when all signatures are collected' },
    { id: 'envelope.declined', name: 'Envelope Declined', description: 'Triggered when an envelope is declined' },
    { id: 'envelope.expired', name: 'Envelope Expired', description: 'Triggered when an envelope expires' }
  ]

  const copySecret = (secret: string) => {
    navigator.clipboard.writeText(secret)
    setCopiedSecret(true)
    setTimeout(() => setCopiedSecret(false), 2000)
    toast.success('Webhook secret copied to clipboard')
  }

  const testWebhook = async (webhookId: string) => {
    toast.loading('Sending test webhook...', { id: 'test-webhook' })
    
    // Simulate API call using webhookId
    await new Promise(resolve => setTimeout(resolve, 2000))
    console.log(`Test webhook sent for webhookId: ${webhookId}`)
    
    toast.success('Test webhook sent successfully!', { id: 'test-webhook' })
  }

  const deleteWebhook = async (webhookId: string) => {
    if (!confirm('Are you sure you want to delete this webhook?')) return
    
    toast.loading('Deleting webhook...', { id: 'delete-webhook' })
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    console.log(`Test webhook delete for webhookId: ${webhookId}`)
    toast.success('Webhook deleted successfully!', { id: 'delete-webhook' })
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">

      {/* Webhooks List */}
      <div className="grid gap-6">
        {webhooks.length === 0 ? (
          <div className="text-center py-12 bg-[#F7F3EE] rounded-lg border border-gray-200">
            <Webhook className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No webhooks configured</h3>
            <p className="text-gray-600 mb-6">
              Create your first webhook to start receiving real-time notifications
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn btn-primary"
            >
              Create Webhook
            </button>
          </div>
        ) : (
          webhooks.map((webhook) => (
            <div key={webhook.id} className="bg-[#F7F3EE] rounded-lg border border-gray-200 p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{webhook.name}</h3>
                    <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${
                      webhook.isActive 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {webhook.isActive ? (
                        <CheckCircle className="h-3 w-3" />
                      ) : (
                        <XCircle className="h-3 w-3" />
                      )}
                      <span>{webhook.isActive ? 'Active' : 'Inactive'}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-600 mb-2">
                    <ExternalLink className="h-4 w-4" />
                    <code className="bg-gray-100 px-2 py-1 rounded">{webhook.url}</code>
                  </div>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {webhook.events.map((event: string) => (
                      <span
                        key={event}
                        className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded"
                      >
                        {event}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => testWebhook(webhook.id)}
                    className="btn btn-outline text-sm"
                  >
                    Test
                  </button>
                  <button
                    onClick={() => setSelectedWebhook(webhook)}
                    className="btn btn-outline text-sm"
                  >
                    <Settings className="h-4 w-4 cursor-pointer" />
                  </button>
                  <button
                    onClick={() => deleteWebhook(webhook.id)}
                    className="btn text-red-600 hover:bg-red-50 text-sm "
                  >
                    <Trash2 className="h-4 w-4 cursor-pointer" />
                  </button>
                </div>
              </div>

              {/* Delivery Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="text-center p-3 bg-[#F5F2EE] rounded-lg">
                  <div className="text-2xl font-bold text-gray-900">
                    {webhook.deliveryStats.totalDeliveries}
                  </div>
                  <div className="text-sm text-gray-600">Total</div>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {webhook.deliveryStats.successfulDeliveries}
                  </div>
                  <div className="text-sm text-gray-600">Success</div>
                </div>
                <div className="text-center p-3 bg-red-50 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">
                    {webhook.deliveryStats.failedDeliveries}
                  </div>
                  <div className="text-sm text-gray-600">Failed</div>
                </div>
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {webhook.deliveryStats.avgLatency}ms
                  </div>
                  <div className="text-sm text-gray-600">Avg Latency</div>
                </div>
              </div>

              {/* Webhook Secret */}
              {webhook.secret && (
                <div className="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    <span className="text-sm font-medium text-yellow-800">Webhook Secret</span>
                  </div>
                  <button
                    onClick={() => webhook.secret && copySecret(webhook.secret)}
                    className="flex items-center space-x-1 text-yellow-700 hover:text-yellow-800"
                  >
                    {copiedSecret ? (
                      <>
                        <Check className="h-4 w-4" />
                        <span className="text-sm">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4" />
                        <span className="text-sm">Copy Secret</span>
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Last Delivery */}
              {webhook.deliveryStats.lastDelivery && (
                <div className="mt-4 p-3 bg-[#F5F2EE] rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-900">Last Delivery</span>
                    <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${
                      webhook.deliveryStats.lastDelivery.status === 'success'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {webhook.deliveryStats.lastDelivery.status === 'success' ? (
                        <CheckCircle className="h-3 w-3" />
                      ) : (
                        <XCircle className="h-3 w-3" />
                      )}
                      <span>{webhook.deliveryStats.lastDelivery.status}</span>
                    </div>
                  </div>
                  <div className="text-sm text-gray-600">
                    <div>Event: {webhook.deliveryStats.lastDelivery.event}</div>
                    <div>Response: {webhook.deliveryStats.lastDelivery.responseCode} ({webhook.deliveryStats.lastDelivery.responseTime}ms)</div>
                    <div>Time: {new Date(webhook.deliveryStats.lastDelivery.lastAttempt).toLocaleString()}</div>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Create Webhook Modal */}
      {showCreateModal && (
        <CreateWebhookModal
          eventTypes={eventTypes}
          onClose={() => setShowCreateModal(false)}
          onSave={(webhookData) => {
            console.log('Creating webhook:', webhookData)
            setShowCreateModal(false)
            toast.success('Webhook created successfully!')
          }}
        />
      )}

      {/* Webhook Details Modal */}
      {selectedWebhook && (
        <WebhookDetailsModal
          webhook={selectedWebhook}
          eventTypes={eventTypes}
          onClose={() => setSelectedWebhook(null)}
          onSave={(webhookData) => {
            console.log('Updating webhook:', webhookData)
            setSelectedWebhook(null)
            toast.success('Webhook updated successfully!')
          }}
        />
      )}
    </div>
  )
}

const CreateWebhookModal: React.FC<{
  eventTypes: any[]
  onClose: () => void
  onSave: (data: any) => void
}> = ({ eventTypes, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    events: [] as string[],
    secret: '',
    isActive: true
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }

  const toggleEvent = (eventId: string) => {
    setFormData(prev => ({
      ...prev,
      events: prev.events.includes(eventId)
        ? prev.events.filter(e => e !== eventId)
        : [...prev.events, eventId]
    }))
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-[#F7F3EE] rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Create Webhook</h2>
        
        <form onSubmit={handleSubmit} className="space-y-6">  
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Webhook Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="input w-full"
              placeholder="My Webhook"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Endpoint URL
            </label>
            <input
              type="url"
              value={formData.url}
              onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
              className="input w-full"
              placeholder="https://your-app.com/webhooks/draftn"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Events to Subscribe
            </label>
            <div className="max-h-48 overflow-y-auto border border-gray-300 rounded-lg p-3">
              {eventTypes.map((event) => (
                <label key={event.id} className="flex items-start space-x-3 py-2">
                  <input
                    type="checkbox"
                    checked={formData.events.includes(event.id)}
                    onChange={() => toggleEvent(event.id)}
                    className="mt-1"
                  />
                  <div>
                    <div className="font-medium text-gray-900">{event.name}</div>
                    <div className="text-sm text-gray-600">{event.description}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Webhook Secret (Optional)
            </label>
            <input
              type="text"
              value={formData.secret}
              onChange={(e) => setFormData(prev => ({ ...prev, secret: e.target.value }))}
              className="input w-full"
              placeholder="Leave empty to auto-generate"
            />
            <p className="text-sm text-gray-600 mt-1">
              Used to verify webhook authenticity. Will be auto-generated if not provided.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
            />
            <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
              Enable webhook immediately
            </label>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-outline"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={!formData.name || !formData.url || formData.events.length === 0}
            >
              Create Webhook
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

const WebhookDetailsModal: React.FC<{
  webhook: any
  eventTypes: any[]
  onClose: () => void
  onSave: (data: any) => void
}> = ({ webhook, eventTypes, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: webhook.name,
    url: webhook.url,
    events: webhook.events,
    secret: webhook.secret || '',
    isActive: webhook.isActive
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }

  const toggleEvent = (eventId: string) => {
    setFormData(prev => ({
      ...prev,
      events: prev.events.includes(eventId)
        ? prev.events.filter((e: string) => e !== eventId)
        : [...prev.events, eventId]
    }))
  }

  return (
   <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
       <div className="bg-[#F7F3EE] rounded-xl p-6 shadow-lg w-full max-w-md">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 cursor-pointer">Edit Webhook</h2>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Webhook Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="input w-full"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Endpoint URL
            </label>
            <input
              type="url"
              value={formData.url}
              onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
              className="input w-full"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Events to Subscribe
            </label>
            <div className="max-h-48 overflow-y-auto border border-gray-300 rounded-lg p-3">
              {eventTypes.map((event) => (
                <label key={event.id} className="flex items-start space-x-3 py-2">
                  <input
                    type="checkbox"
                    checked={formData.events.includes(event.id)}
                    onChange={() => toggleEvent(event.id)}
                    className="mt-1"
                  />
                  <div>
                    <div className="font-medium text-gray-900">{event.name}</div>
                    <div className="text-sm text-gray-600">{event.description}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
            />
            <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
              Webhook is active
            </label>
          </div>

          <div className="flex justify-end space-x-3 ">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-outline cursor-pointer"
              
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}