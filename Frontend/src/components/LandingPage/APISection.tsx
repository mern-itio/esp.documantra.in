import { useState } from 'react'
import { Code, Webhook, Send, BarChart3, Copy, Check } from 'lucide-react'
import { Link } from 'react-router-dom'

const APISection = () => {
  const [activeTab, setActiveTab] = useState<'prepare' | 'template' | 'send' | 'webhook'>('prepare')
  const [copied, setCopied] = useState(false)

  const codeExamples = {
    prepare: `// Prepare envelope via API
const envelope = await docufie.envelopes.create({
  documents: [{
    name: "contract.pdf",
    content: base64Content
  }],
  recipients: [{
    email: "signer@example.com",
    name: "John Doe",
    role: "signer"
  }],
  fields: [{
    type: "signature",
    page: 1,
    x: 100,
    y: 200
  }]
});`,
    template: `// Use template via API
const envelope = await docufie.templates.use({
  templateId: "template_123",
  recipients: [{
    email: "client@example.com",
    name: "Jane Smith",
    role: "signer"
  }],
  data: {
    companyName: "Acme Corp",
    contractDate: "2024-01-15"
  }
});`,
    send: `// Send document programmatically
const result = await docufie.envelopes.send({
  envelopeId: envelope.id,
  message: "Please sign this document",
  subject: "Contract for Review"
});

console.log("Envelope sent:", result.status);`,
    webhook: `// Track status via webhooks
app.post('/webhook', (req, res) => {
  const event = req.body;
  
  if (event.type === 'envelope.completed') {
    console.log('Document signed!', event.data);
    // Update your database
    updateDocumentStatus(event.data.envelopeId, 'completed');
  }
  
  res.status(200).send('OK');
});`
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(codeExamples[activeTab])
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const features = [
    {
      icon: Send,
      title: "Prepare Envelopes",
      description: "Create and configure documents programmatically"
    },
    {
      icon: Code,
      title: "Template Integration",
      description: "Use pre-built templates with dynamic data"
    },
    {
      icon: BarChart3,
      title: "Status Tracking",
      description: "Monitor signing progress in real-time"
    },
    {
      icon: Webhook,
      title: "Webhook Events",
      description: "Receive instant notifications on status changes"
    }
  ]

  return (
    <section id="api" className="section-padding bg-gray-900 text-white">
      <div className="container-max">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Automate Documents with <span className="gradient-text">Developer-Friendly APIs</span>
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Integrate Draft&Sign powerful document automation into your applications
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Left Side - Features */}
          <div className="space-y-8">
            <div className="grid sm:grid-cols-2 gap-6">
              {features.map((feature, index) => (
                <div key={index} className="space-y-3">
                  <div className="w-12 h-12 bg-primary-600 rounded-lg flex items-center justify-center">
                    <feature.icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="font-semibold text-white">{feature.title}</h3>
                  <p className="text-gray-300 text-sm">{feature.description}</p>
                </div>
              ))}
            </div>

            {/* Pricing */}
            <div className="bg-gray-800 rounded-lg p-6 space-y-4">
              <h3 className="font-semibold text-white mb-4">API Pricing</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Free Tier</span>
                  <span className="text-white font-medium">10 calls/month</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Starter Plan</span>
                  <span className="text-white font-medium">$10 - 100 calls/month</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Custom Plan</span>
                  <span className="text-white font-medium">Contact for pricing</span>
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <Link to='/api-documentation'>
                <button className="btn-primary">View API Docs</button>
              </Link>
              <Link to='/login'>
                <button className="btn-secondary">Get Your API Key</button>
              </Link>
            </div>
          </div>

          {/* Right Side - Code Examples */}
          <div className="bg-gray-800 rounded-lg overflow-hidden">
            {/* Tabs */}
            <div className="flex border-b border-gray-700">
              {Object.keys(codeExamples).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab as 'prepare' | 'template' | 'send' | 'webhook')}
                  className={`px-4 py-3 text-sm font-medium capitalize transition-colors ${
                    activeTab === tab
                      ? 'bg-gray-700 text-white border-b-2 border-primary-500'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Code Block */}
            <div className="relative">
              <button
                onClick={copyToClipboard}
                className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white transition-colors"
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </button>
              <pre className="p-6 text-sm text-gray-300 overflow-x-auto">
                <code>{codeExamples[activeTab]}</code>
              </pre>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default APISection