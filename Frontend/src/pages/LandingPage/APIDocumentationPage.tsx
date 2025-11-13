import { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Code, Webhook, Send, BarChart3, Copy, Check, FileText, 
  Database, Settings, Search, Cloud, Lock,
  ChevronDown, ChevronRight, ExternalLink, Terminal, Play,
  ArrowRight
} from 'lucide-react';

const APIDocumentationPage = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [activeSidebar, setActiveSidebar] = useState('introduction');
  const [copied, setCopied] = useState(false);
const [expandedSection, setExpandedSection] = useState<string | null>('authentication');


  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleSection = (section: string) => {
    if (expandedSection === section) {
      setExpandedSection(null);
    } else {
      setExpandedSection(section);
    }
  };

  const codeExamples = {
    authentication: `// Authentication example
const docusigner = require('@docusigner/sdk');

// Initialize with API key
const client = new docusigner.Client({
  apiKey: 'YOUR_API_KEY',
  environment: 'production' // or 'sandbox' for testing
});`,
    createEnvelope: `// Create and send an envelope
const envelope = await docusigner.envelopes.create({
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
    useTemplate: `// Use template via API
const envelope = await docusigner.templates.use({
  templateId: "template_123",
  recipients: [{
    email: "client@example.com",
    name: "Jane Smith",
    role: "signer"
  }],
  data: {
    companyName: "Acme Corp",
    contractDate: "2025-01-15"
  }
});`,
    sendEnvelope: `// Send document programmatically
const result = await docusigner.envelopes.send({
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
  };

  const apiEndpoints = [
    {
      name: "Authentication",
      endpoint: "POST /auth/token",
      description: "Get an access token for API requests",
      parameters: [
        { name: "api_key", type: "string", required: true, description: "Your API key" },
        { name: "secret", type: "string", required: true, description: "Your API secret" }
      ]
    },
    {
      name: "Create Envelope",
      endpoint: "POST /envelopes",
      description: "Create a new envelope with documents",
      parameters: [
        { name: "documents", type: "array", required: true, description: "Array of document objects" },
        { name: "recipients", type: "array", required: true, description: "Array of recipient objects" },
        { name: "fields", type: "array", required: false, description: "Array of field objects" },
        { name: "options", type: "object", required: false, description: "Additional options" }
      ]
    },
    {
      name: "Get Envelope",
      endpoint: "GET /envelopes/{id}",
      description: "Get envelope details by ID",
      parameters: [
        { name: "id", type: "string", required: true, description: "Envelope ID" },
        { name: "include", type: "string", required: false, description: "Additional data to include" }
      ]
    },
    {
      name: "Send Envelope",
      endpoint: "POST /envelopes/{id}/send",
      description: "Send an existing envelope to recipients",
      parameters: [
        { name: "id", type: "string", required: true, description: "Envelope ID" },
        { name: "message", type: "string", required: false, description: "Custom message" },
        { name: "subject", type: "string", required: false, description: "Email subject" }
      ]
    },
    {
      name: "Get Templates",
      endpoint: "GET /templates",
      description: "List all available templates",
      parameters: [
        { name: "limit", type: "integer", required: false, description: "Number of results per page" },
        { name: "offset", type: "integer", required: false, description: "Pagination offset" },
        { name: "folder", type: "string", required: false, description: "Filter by folder" }
      ]
    }
  ];

  const sdkLanguages = [
    { name: "JavaScript", icon: "JS", color: "bg-yellow-500" },
    { name: "Python", icon: "PY", color: "bg-blue-500" },
    { name: "PHP", icon: "PHP", color: "bg-purple-500" },
    { name: "Ruby", icon: "RB", color: "bg-red-500" },
    { name: "Java", icon: "JV", color: "bg-orange-500" },
    { name: ".NET", icon: "NET", color: "bg-blue-600" }
  ];

  return (
    <div className="min-h-screen bg-gray-50 mt-8 pt-24 pb-16">
      <div className="container-max">
        {/* Hero Section */}
        <div className="bg-gradient-to-br from-[#260559] to-[#3a0a7e] text-white rounded-2xl shadow-lg p-8 mb-8 text-white">
          <div className="max-w-4xl">
            <h1 className="text-3xl md:text-4xl font-bold mb-4">API Documentation</h1>
            <p className="text-xl text-primary-100 mb-6">
              Integrate Draft&Sign's powerful document and e-signature capabilities directly into your applications with our comprehensive API.
            </p>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full">
                <Code className="h-5 w-5" />
                <span className="font-medium">RESTful API</span>
              </div>
              <div className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full">
                <Webhook className="h-5 w-5" />
                <span className="font-medium">Webhook Support</span>
              </div>
              <div className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full">
                <Lock className="h-5 w-5" />
                <span className="font-medium">OAuth 2.0</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-12 gap-8">
          {/* Sidebar */}
          <div className="col-span-12 md:col-span-3">
            <div className="bg-white rounded-xl shadow-md p-4 sticky top-24">
              <div className="mb-6">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search API docs..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <button
                  onClick={() => setActiveSidebar('introduction')}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium ${
                    activeSidebar === 'introduction' ? 'bg-[#260559]-50 text-[#260559]' : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  Introduction
                </button>
                <button
                  onClick={() => setActiveSidebar('authentication')}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium ${
                    activeSidebar === 'authentication' ? 'bg-primary-50 text-primary-700' : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  Authentication
                </button>
                <button
                  onClick={() => setActiveSidebar('envelopes')}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium ${
                    activeSidebar === 'envelopes' ? 'bg-primary-50 text-primary-700' : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  Envelopes
                </button>
                <button
                  onClick={() => setActiveSidebar('templates')}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium ${
                    activeSidebar === 'templates' ? 'bg-primary-50 text-primary-700' : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  Templates
                </button>
                <button
                  onClick={() => setActiveSidebar('documents')}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium ${
                    activeSidebar === 'documents' ? 'bg-primary-50 text-primary-700' : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  Documents
                </button>
                <button
                  onClick={() => setActiveSidebar('webhooks')}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium ${
                    activeSidebar === 'webhooks' ? 'bg-primary-50 text-primary-700' : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  Webhooks
                </button>
                <button
                  onClick={() => setActiveSidebar('sdks')}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium ${
                    activeSidebar === 'sdks' ? 'bg-primary-50 text-primary-700' : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  SDKs & Libraries
                </button>
                <button
                  onClick={() => setActiveSidebar('errors')}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium ${
                    activeSidebar === 'errors' ? 'bg-primary-50 text-primary-700' : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  Error Handling
                </button>
                <button
                  onClick={() => setActiveSidebar('rate-limits')}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium ${
                    activeSidebar === 'rate-limits' ? 'bg-primary-50 text-primary-700' : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  Rate Limits
                </button>
              </div>

              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="font-medium text-gray-900 mb-3 text-sm">Resources</h3>
                <div className="space-y-2">
                  <a href="#" className="flex items-center gap-2 text-[#260559]-600 hover:text-[#260559]-700 text-sm">
                    <FileText className="h-4 w-4" />
                    <span>API Reference</span>
                  </a>
                  <a href="#" className="flex items-center gap-2 text-[#260559]-600 hover:text-[#260559]-700 text-sm">
                    <Code className="h-4 w-4" />
                    <span>Code Examples</span>
                  </a>
                  <a href="#" className="flex items-center gap-2 text-[#260559]-600 hover:text-[#260559]-700 text-sm">
                    <Terminal className="h-4 w-4" />
                    <span>CLI Reference</span>
                  </a>
                  <a href="#" className="flex items-center gap-2 text-[#260559]-600 hover:text-[#260559]-700 text-sm">
                    <ExternalLink className="h-4 w-4" />
                    <span>API Status</span>
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="col-span-12 md:col-span-9">
            {/* Tabs */}
            <div className="bg-white rounded-xl shadow-md mb-8">
              <div className="flex overflow-x-auto">
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`px-6 py-4 font-medium border-b-2 ${
                    activeTab === 'overview' ? 'border-[#260559] text-[#260559]' : 'border-transparent text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Overview
                </button>
                <button
                  onClick={() => setActiveTab('reference')}
                  className={`px-6 py-4 font-medium border-b-2 ${
                    activeTab === 'reference' ? 'border-[#260559] text-[#260559]' : 'border-transparent text-gray-600 hover:text-gray-900'
                  }`}
                >
                  API Reference
                </button>
                <button
                  onClick={() => setActiveTab('guides')}
                  className={`px-6 py-4 font-medium border-b-2 ${
                    activeTab === 'guides' ? 'border-[#260559] text-[#260559]' : 'border-transparent text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Guides
                </button>
                <button
                  onClick={() => setActiveTab('examples')}
                  className={`px-6 py-4 font-medium border-b-2 ${
                    activeTab === 'examples' ? 'border-[#260559] text-[#260559]' : 'border-transparent text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Examples
                </button>
              </div>
            </div>

            {/* Overview Tab Content */}
            {activeTab === 'overview' && (
              <div className="space-y-8">
                <div className="bg-white rounded-xl shadow-md p-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">Getting Started with Draft&Sign API</h2>
                  <p className="text-gray-600 mb-6">
                    The Draft&Sign API allows you to integrate our document and e-signature capabilities directly into your applications. 
                    This guide will help you get started with the basics of our API.
                  </p>

                  <div className="space-y-6">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-3">Base URL</h3>
                      <div className="bg-gray-50 p-4 rounded-lg flex justify-between items-center">
                        <code className="text-sm font-mono text-gray-800">https://api.docusigner.com/v1</code>
                        <button 
                          onClick={() => copyToClipboard('https://api.docusigner.com/v1')}
                          className="text-gray-500 hover:text-gray-700"
                        >
                          {copied ? <Check className="h-5 w-5 text-green-500" /> : <Copy className="h-5 w-5" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-3">Authentication</h3>
                      <p className="text-gray-600 mb-4">
                        All API requests must be authenticated using an API key. You can obtain your API key from the 
                        <Link to="/dashboard/settings/api" className="text-primary-600 hover:text-primary-700"> API settings page</Link> in your dashboard.
                      </p>
                      <div className="bg-gray-800 rounded-lg p-4 text-white font-mono text-sm overflow-x-auto">
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-gray-400">// Authentication example</span>
                          <button 
                            onClick={() => copyToClipboard(codeExamples.authentication)}
                            className="text-gray-400 hover:text-gray-300"
                          >
                            {copied ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
                          </button>
                        </div>
                        <pre>{codeExamples.authentication}</pre>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-3">Quick Start</h3>
                      <p className="text-gray-600 mb-4">
                        Here's a simple example of creating and sending a document for signature:
                      </p>
                      <div className="bg-gray-800 rounded-lg p-4 text-white font-mono text-sm overflow-x-auto">
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-gray-400">// Create and send an envelope</span>
                          <button 
                            onClick={() => copyToClipboard(codeExamples.createEnvelope)}
                            className="text-gray-400 hover:text-gray-300"
                          >
                            {copied ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
                          </button>
                        </div>
                        <pre>{codeExamples.createEnvelope}</pre>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-md p-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">API Features</h2>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-[#260559]/60 rounded-lg flex items-center justify-center">
                          <Send className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">Prepare Envelopes</h3>
                          <p className="text-sm text-gray-600">Create and configure documents programmatically</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-[#260559]/60 rounded-lg flex items-center justify-center">
                          <Code className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">Template Integration</h3>
                          <p className="text-sm text-gray-600">Use pre-built templates with dynamic data</p>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-[#260559]/60 rounded-lg flex items-center justify-center">
                          <BarChart3 className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">Status Tracking</h3>
                          <p className="text-sm text-gray-600">Monitor signing progress in real-time</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-[#260559]/60 rounded-lg flex items-center justify-center">
                          <Webhook className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">Webhook Events</h3>
                          <p className="text-sm text-gray-600">Receive instant notifications on status changes</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-md p-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">Available SDKs</h2>
                  <p className="text-gray-600 mb-6">
                    We provide official SDKs for popular programming languages to make integration easier:
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {sdkLanguages.map((lang, index) => (
                      <a 
                        key={index}
                        href="#"
                        className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors"
                      >
                        <div className={`w-10 h-10 ${lang.color} rounded-lg flex items-center justify-center text-white font-bold text-sm`}>
                          {lang.icon}
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{lang.name} SDK</h3>
                          <p className="text-xs text-gray-500">View Documentation</p>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-md p-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">API Pricing</h2>
                  <p className="text-gray-600 mb-6">
                    Our API is available on all plans, with usage limits based on your subscription:
                  </p>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Plan</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">API Calls</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rate Limit</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        <tr>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Free</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">10 calls/month</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">10 calls/minute</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">$0</td>
                        </tr>
                        <tr>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Starter</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">100 calls/month</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">60 calls/minute</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">$10/month</td>
                        </tr>
                        <tr>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Business</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">1,000 calls/month</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">120 calls/minute</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">$30/month</td>
                        </tr>
                        <tr>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Enterprise</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Unlimited</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Custom</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Contact Sales</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <div className="mt-6 text-center">
                    <Link to="/pricing" className="text-[#260559]-600 hover:text-primary-700 font-medium">
                      View full pricing details →
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {/* API Reference Tab Content */}
            {activeTab === 'reference' && (
              <div className="space-y-8">
                <div className="bg-white rounded-xl shadow-md p-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">API Reference</h2>
                  <p className="text-gray-600 mb-8">
                    Explore our comprehensive API endpoints and learn how to integrate Draft&Sign into your applications.
                  </p>

                  <div className="space-y-6">
                    {apiEndpoints.map((endpoint, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg overflow-hidden">
                        <div className="flex items-center justify-between p-4 bg-gray-50">
                          <div className="flex items-center gap-3">
                            <span className="px-3 py-1 bg-primary-100 text-primary-800 rounded-lg text-xs font-medium">
                              {endpoint.endpoint.split(' ')[0]}
                            </span>
                            <span className="font-mono text-sm text-gray-800">
                              {endpoint.endpoint.split(' ')[1]}
                            </span>
                          </div>
                          <span className="text-sm font-medium text-gray-700">{endpoint.name}</span>
                        </div>
                        <div className="p-4">
                          <p className="text-gray-600 mb-4">{endpoint.description}</p>
                          <h4 className="font-medium text-gray-900 mb-2">Parameters</h4>
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="bg-gray-50">
                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Required</th>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-200">
                                {endpoint.parameters.map((param, paramIndex) => (
                                  <tr key={paramIndex}>
                                    <td className="px-4 py-2 font-mono">{param.name}</td>
                                    <td className="px-4 py-2">{param.type}</td>
                                    <td className="px-4 py-2">
                                      {param.required ? (
                                        <span className="text-red-600">Required</span>
                                      ) : (
                                        <span className="text-gray-500">Optional</span>
                                      )}
                                    </td>
                                    <td className="px-4 py-2">{param.description}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Guides Tab Content */}
            {activeTab === 'guides' && (
              <div className="space-y-8">
                <div className="bg-white rounded-xl shadow-md p-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">API Guides</h2>
                  <p className="text-gray-600 mb-8">
                    Step-by-step guides to help you implement common workflows with the Draft&Sign API.
                  </p>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="border border-gray-200 rounded-lg p-6 hover:border-primary-300 hover:shadow-md transition-all">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                          <Send className="h-5 w-5 text-primary-600" />
                        </div>
                        <h3 className="font-semibold text-gray-900">Sending Documents for Signature</h3>
                      </div>
                      <p className="text-gray-600 mb-4">
                        Learn how to create and send documents for signature using the API, including setting up recipients and signature fields.
                      </p>
                      <a href="#" className="text-primary-600 hover:text-primary-700 font-medium flex items-center">
                        Read guide
                        <ChevronRight className="ml-1 h-4 w-4" />
                      </a>
                    </div>

                    <div className="border border-gray-200 rounded-lg p-6 hover:border-primary-300 hover:shadow-md transition-all">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                          <FileText className="h-5 w-5 text-primary-600" />
                        </div>
                        <h3 className="font-semibold text-gray-900">Working with Templates</h3>
                      </div>
                      <p className="text-gray-600 mb-4">
                        Discover how to use document templates to streamline your workflow and maintain consistency across documents.
                      </p>
                      <a href="#" className="text-primary-600 hover:text-primary-700 font-medium flex items-center">
                        Read guide
                        <ChevronRight className="ml-1 h-4 w-4" />
                      </a>
                    </div>

                    <div className="border border-gray-200 rounded-lg p-6 hover:border-primary-300 hover:shadow-md transition-all">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                          <Webhook className="h-5 w-5 text-primary-600" />
                        </div>
                        <h3 className="font-semibold text-gray-900">Setting Up Webhooks</h3>
                      </div>
                      <p className="text-gray-600 mb-4">
                        Learn how to configure webhooks to receive real-time notifications about document and signature events.
                      </p>
                      <a href="#" className="text-primary-600 hover:text-primary-700 font-medium flex items-center">
                        Read guide
                        <ChevronRight className="ml-1 h-4 w-4" />
                      </a>
                    </div>

                    <div className="border border-gray-200 rounded-lg p-6 hover:border-primary-300 hover:shadow-md transition-all">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                          <BarChart3 className="h-5 w-5 text-primary-600" />
                        </div>
                        <h3 className="font-semibold text-gray-900">Tracking Document Status</h3>
                      </div>
                      <p className="text-gray-600 mb-4">
                        Discover how to monitor document status and retrieve signing events and audit trails.
                      </p>
                      <a href="#" className="text-primary-600 hover:text-primary-700 font-medium flex items-center">
                        Read guide
                        <ChevronRight className="ml-1 h-4 w-4" />
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Examples Tab Content */}
            {activeTab === 'examples' && (
              <div className="space-y-8">
                <div className="bg-white rounded-xl shadow-md p-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Code Examples</h2>
                  <p className="text-gray-600 mb-8">
                    Explore practical examples of common API operations in different programming languages.
                  </p>

                  <div className="space-y-6">
                    <div>
                      <div 
                        className="flex items-center justify-between cursor-pointer"
                        onClick={() => toggleSection('authentication')}
                      >
                        <h3 className="text-xl font-semibold text-gray-900">Authentication</h3>
                        {expandedSection === 'authentication' ? (
                          <ChevronDown className="h-5 w-5 text-gray-500" />
                        ) : (
                          <ChevronRight className="h-5 w-5 text-gray-500" />
                        )}
                      </div>
                      {expandedSection === 'authentication' && (
                        <div className="mt-4 bg-gray-800 rounded-lg p-4 text-white font-mono text-sm overflow-x-auto">
                          <div className="flex justify-between items-start mb-2">
                            <span className="text-gray-400">// Authentication example</span>
                            <button 
                              onClick={() => copyToClipboard(codeExamples.authentication)}
                              className="text-gray-400 hover:text-gray-300"
                            >
                              {copied ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
                            </button>
                          </div>
                          <pre>{codeExamples.authentication}</pre>
                        </div>
                      )}
                    </div>

                    <div>
                      <div 
                        className="flex items-center justify-between cursor-pointer"
                        onClick={() => toggleSection('createEnvelope')}
                      >
                        <h3 className="text-xl font-semibold text-gray-900">Creating an Envelope</h3>
                        {expandedSection === 'createEnvelope' ? (
                          <ChevronDown className="h-5 w-5 text-gray-500" />
                        ) : (
                          <ChevronRight className="h-5 w-5 text-gray-500" />
                        )}
                      </div>
                      {expandedSection === 'createEnvelope' && (
                        <div className="mt-4 bg-gray-800 rounded-lg p-4 text-white font-mono text-sm overflow-x-auto">
                          <div className="flex justify-between items-start mb-2">
                            <span className="text-gray-400">// Create and send an envelope</span>
                            <button 
                              onClick={() => copyToClipboard(codeExamples.createEnvelope)}
                              className="text-gray-400 hover:text-gray-300"
                            >
                              {copied ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
                            </button>
                          </div>
                          <pre>{codeExamples.createEnvelope}</pre>
                        </div>
                      )}
                    </div>

                    <div>
                      <div 
                        className="flex items-center justify-between cursor-pointer"
                        onClick={() => toggleSection('useTemplate')}
                      >
                        <h3 className="text-xl font-semibold text-gray-900">Using Templates</h3>
                        {expandedSection === 'useTemplate' ? (
                          <ChevronDown className="h-5 w-5 text-gray-500" />
                        ) : (
                          <ChevronRight className="h-5 w-5 text-gray-500" />
                        )}
                      </div>
                      {expandedSection === 'useTemplate' && (
                        <div className="mt-4 bg-gray-800 rounded-lg p-4 text-white font-mono text-sm overflow-x-auto">
                          <div className="flex justify-between items-start mb-2">
                            <span className="text-gray-400">// Use template via API</span>
                            <button 
                              onClick={() => copyToClipboard(codeExamples.useTemplate)}
                              className="text-gray-400 hover:text-gray-300"
                            >
                              {copied ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
                            </button>
                          </div>
                          <pre>{codeExamples.useTemplate}</pre>
                        </div>
                      )}
                    </div>

                    <div>
                      <div 
                        className="flex items-center justify-between cursor-pointer"
                        onClick={() => toggleSection('sendEnvelope')}
                      >
                        <h3 className="text-xl font-semibold text-gray-900">Sending Envelopes</h3>
                        {expandedSection === 'sendEnvelope' ? (
                          <ChevronDown className="h-5 w-5 text-gray-500" />
                        ) : (
                          <ChevronRight className="h-5 w-5 text-gray-500" />
                        )}
                      </div>
                      {expandedSection === 'sendEnvelope' && (
                        <div className="mt-4 bg-gray-800 rounded-lg p-4 text-white font-mono text-sm overflow-x-auto">
                          <div className="flex justify-between items-start mb-2">
                            <span className="text-gray-400">// Send document programmatically</span>
                            <button 
                              onClick={() => copyToClipboard(codeExamples.sendEnvelope)}
                              className="text-gray-400 hover:text-gray-300"
                            >
                              {copied ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
                            </button>
                          </div>
                          <pre>{codeExamples.sendEnvelope}</pre>
                        </div>
                      )}
                    </div>

                    <div>
                      <div 
                        className="flex items-center justify-between cursor-pointer"
                        onClick={() => toggleSection('webhook')}
                      >
                        <h3 className="text-xl font-semibold text-gray-900">Webhook Integration</h3>
                        {expandedSection === 'webhook' ? (
                          <ChevronDown className="h-5 w-5 text-gray-500" />
                        ) : (
                          <ChevronRight className="h-5 w-5 text-gray-500" />
                        )}
                      </div>
                      {expandedSection === 'webhook' && (
                        <div className="mt-4 bg-gray-800 rounded-lg p-4 text-white font-mono text-sm overflow-x-auto">
                          <div className="flex justify-between items-start mb-2">
                            <span className="text-gray-400">// Track status via webhooks</span>
                            <button 
                              onClick={() => copyToClipboard(codeExamples.webhook)}
                              className="text-gray-400 hover:text-gray-300"
                            >
                              {copied ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
                            </button>
                          </div>
                          <pre>{codeExamples.webhook}</pre>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-md p-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Interactive API Explorer</h2>
                  <p className="text-gray-600 mb-6">
                    Try out API calls directly in your browser with our interactive API explorer.
                  </p>
                  <div className="bg-gray-50 rounded-lg p-8 text-center">
                    <Play className="h-12 w-12 text-primary-600 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">API Explorer</h3>
                    <p className="text-gray-600 mb-4">
                      Test API endpoints, view responses, and generate code snippets in your preferred language.
                    </p>
                    <Link to="/api/explorer" className="btn-primary inline-flex items-center">
                      Launch API Explorer
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-br from-[#260559] to-[#3a0a7e] text-white rounded-2xl shadow-lg p-8 mt-12 text-white">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <h2 className="text-2xl font-bold mb-4">Ready to Integrate?</h2>
              <p className="text-primary-100 mb-6">
                Get started with the Draft&Sign API today. Sign up for a free account to receive your API key and start building.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/signup" className="bg-white text-[#260559] hover:bg-gray-100 font-semibold py-3 px-6 rounded-lg transition-colors shadow-lg hover:shadow-xl">
                  Get Your API Key
                </Link>
                <Link to="/contact" className="border-2 border-white text-white hover:bg-white hover:text-[#260559] font-semibold py-3 px-6 rounded-lg transition-colors">
                  Contact Developer Support
                </Link>
              </div>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
              <h3 className="text-xl font-semibold mb-4">API Support Resources</h3>
              <div className="space-y-4">
                <a href="#" className="flex items-center gap-3 p-3 bg-white/20 rounded-lg hover:bg-white/30 transition-colors">
                  <Database className="h-5 w-5" />
                  <div>
                    <div className="font-medium">Sample Applications</div>
                    <div className="text-sm text-primary-100">Complete example projects</div>
                  </div>
                </a>
                <a href="#" className="flex items-center gap-3 p-3 bg-white/20 rounded-lg hover:bg-white/30 transition-colors">
                  <Settings className="h-5 w-5" />
                  <div>
                    <div className="font-medium">Developer Tools</div>
                    <div className="text-sm text-primary-100">Debugging and testing utilities</div>
                  </div>
                </a>
                <a href="#" className="flex items-center gap-3 p-3 bg-white/20 rounded-lg hover:bg-white/30 transition-colors">
                  <Cloud className="h-5 w-5" />
                  <div>
                    <div className="font-medium">Sandbox Environment</div>
                    <div className="text-sm text-primary-100">Test your integration safely</div>
                  </div>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default APIDocumentationPage;