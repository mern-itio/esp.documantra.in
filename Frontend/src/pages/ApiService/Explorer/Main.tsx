import React, { useState } from 'react'
import { Play, Code, Copy, Check, ChevronDown, ChevronRight, AlertCircle, CheckCircle, Clock} from 'lucide-react'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { mockAPIEndpoints } from '../../../data/mockAPIData';

const Main: React.FC = () => {
  const [selectedEndpoint, setSelectedEndpoint] = useState(mockAPIEndpoints[0])
  const [requestBody, setRequestBody] = useState('')
  const [headers, setHeaders] = useState('{\n  "Authorization": "Bearer your_api_key",\n  "Content-Type": "application/json"\n}')
  const [response, setResponse] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [copiedCode, setCopiedCode] = useState<string | null>(null)
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    parameters: true,
    requestBody: true,
    responses: true
  })

  const endpoints = mockAPIEndpoints

  const copyToClipboard = (code: string, id: string) => {
    navigator.clipboard.writeText(code)
    setCopiedCode(id)
    setTimeout(() => setCopiedCode(null), 2000)
  }

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  const executeRequest = async () => {
    setIsLoading(true)
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    // Mock response based on endpoint
    let mockResponse
    if (selectedEndpoint.path === '/api/v1/users' && selectedEndpoint.method === 'GET') {
      mockResponse = {
        status: 200,
        data: {
          users: [
            {
              id: 'user_123',
              name: 'John Doe',
              email: 'john@example.com',
              created_at: '2024-06-01T10:00:00Z'
            },
            {
              id: 'user_456',
              name: 'Jane Smith',
              email: 'jane@example.com',
              created_at: '2024-06-02T10:00:00Z'
            }
          ],
          total: 2,
          limit: 20,
          offset: 0
        },
        headers: {
          'Content-Type': 'application/json',
          'X-RateLimit-Remaining': '999',
          'X-RateLimit-Reset': '1625097600'
        },
        responseTime: 145
      }
    } else if (selectedEndpoint.path === '/api/v1/envelopes' && selectedEndpoint.method === 'POST') {
      mockResponse = {
        status: 201,
        data: {
          id: 'env_' + Math.random().toString(36).substr(2, 9),
          status: 'sent',
          subject: 'Please sign this contract',
          created_at: new Date().toISOString(),
          recipients: [
            {
              name: 'John Doe',
              email: 'john@example.com',
              status: 'sent'
            }
          ]
        },
        headers: {
          'Content-Type': 'application/json',
          'Location': '/api/v1/envelopes/env_abc123'
        },
        responseTime: 234
      }
    }
    
    setResponse(mockResponse)
    setIsLoading(false)
  }

  const generateCurlCommand = () => {
    const headersObj = JSON.parse(headers)
    const headerFlags = Object.entries(headersObj)
      .map(([key, value]) => `-H "${key}: ${value}"`)
      .join(' ')
    
    let curl = `curl -X ${selectedEndpoint.method} "${selectedEndpoint.path}"`
    curl += ` ${headerFlags}`
    
    if (selectedEndpoint.method !== 'GET' && requestBody) {
      curl += ` -d '${requestBody}'`
    }
    
    return curl
  }

  return (
    <div className="h-screen bg-gray-50 flex">
      {/* Sidebar - Endpoints List */}
      <div className="w-80 bg-white border-r border-gray-200 overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-gray-900">API Explorer</h1>
          <p className="text-gray-600 mt-2">Test API endpoints interactively</p>
        </div>
        
        <div className="p-4">
          {endpoints.map((endpoint) => (
            <button
              key={`${endpoint.method}-${endpoint.path}`}
              onClick={() => setSelectedEndpoint(endpoint)}
              className={`w-full text-left p-3 rounded-lg mb-2 transition-colors ${
                selectedEndpoint === endpoint
                  ? 'bg-primary-50 border border-primary-200'
                  : 'hover:bg-gray-50 border border-transparent'
              }`}
            >
              <div className="flex items-center space-x-3">
                <span className={`px-2 py-1 text-xs font-medium rounded ${
                  endpoint.method === 'GET' ? 'bg-green-100 text-green-800' :
                  endpoint.method === 'POST' ? 'bg-blue-100 text-blue-800' :
                  endpoint.method === 'PUT' ? 'bg-yellow-100 text-yellow-800' :
                  endpoint.method === 'DELETE' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {endpoint.method}
                </span>
                <span className="font-mono text-sm text-gray-900">{endpoint.path}</span>
              </div>
              <p className="text-sm text-gray-600 mt-1">{endpoint.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Request Panel */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6">
            <div className="mb-6">
              <div className="flex items-center space-x-3 mb-4">
                <span className={`px-3 py-1 text-sm font-medium rounded ${
                  selectedEndpoint.method === 'GET' ? 'bg-green-100 text-green-800' :
                  selectedEndpoint.method === 'POST' ? 'bg-blue-100 text-blue-800' :
                  selectedEndpoint.method === 'PUT' ? 'bg-yellow-100 text-yellow-800' :
                  selectedEndpoint.method === 'DELETE' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {selectedEndpoint.method}
                </span>
                <code className="text-lg font-mono text-gray-900">{selectedEndpoint.path}</code>
              </div>
              <p className="text-gray-600">{selectedEndpoint.description}</p>
            </div>

            {/* Parameters */}
            {selectedEndpoint.parameters.length > 0 && (
              <div className="mb-6">
                <button
                  onClick={() => toggleSection('parameters')}
                  className="flex items-center space-x-2 text-lg font-semibold text-gray-900 mb-4"
                >
                  {expandedSections.parameters ? (
                    <ChevronDown className="h-5 w-5" />
                  ) : (
                    <ChevronRight className="h-5 w-5" />
                  )}
                  <span>Parameters</span>
                </button>
                
                {expandedSections.parameters && (
                  <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Name</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Type</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Required</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Description</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {selectedEndpoint.parameters.map((param, index) => (
                          <tr key={index}>
                            <td className="px-4 py-3 text-sm font-mono text-gray-900">{param.name}</td>
                            <td className="px-4 py-3 text-sm text-gray-600">{param.type}</td>
                            <td className="px-4 py-3 text-sm">
                              {param.required ? (
                                <span className="text-red-600 font-medium">Required</span>
                              ) : (
                                <span className="text-gray-500">Optional</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">{param.description}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Headers */}
            <div className="mb-6">
              <label className="block text-lg font-semibold text-gray-900 mb-4">Headers</label>
              <textarea
                value={headers}
                onChange={(e) => setHeaders(e.target.value)}
                className="w-full h-24 p-3 border border-gray-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Enter request headers as JSON"
              />
            </div>

            {/* Request Body */}
            {selectedEndpoint.method !== 'GET' && (
              <div className="mb-6">
                <button
                  onClick={() => toggleSection('requestBody')}
                  className="flex items-center space-x-2 text-lg font-semibold text-gray-900 mb-4"
                >
                  {expandedSections.requestBody ? (
                    <ChevronDown className="h-5 w-5" />
                  ) : (
                    <ChevronRight className="h-5 w-5" />
                  )}
                  <span>Request Body</span>
                </button>
                
                {expandedSections.requestBody && (
                  <div>
                    <textarea
                      value={requestBody}
                      onChange={(e) => setRequestBody(e.target.value)}
                      className="w-full h-40 p-3 border border-gray-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="Enter request body as JSON"
                    />
                    {selectedEndpoint.requestBody && (
                      <div className="mt-4">
                        <h4 className="font-medium text-gray-900 mb-2">Example:</h4>
                        <div className="relative">
                          <button
                            onClick={() => copyToClipboard(JSON.stringify(selectedEndpoint.requestBody?.example, null, 2), 'request-example')}
                            className="absolute top-2 right-2 p-2 text-gray-400 hover:text-gray-600"
                          >
                            {copiedCode === 'request-example' ? (
                              <Check className="h-4 w-4" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </button>
                          <SyntaxHighlighter
                            language="json"
                            style={tomorrow}
                            customStyle={{ fontSize: '12px' }}
                          >
                            {JSON.stringify(selectedEndpoint.requestBody.example, null, 2)}
                          </SyntaxHighlighter>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Execute Button */}
            <button
              onClick={executeRequest}
              disabled={isLoading}
              className="flex items-center space-x-2 bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <>
                  <Clock className="h-5 w-5 animate-spin" />
                  <span>Executing...</span>
                </>
              ) : (
                <>
                  <Play className="h-5 w-5" />
                  <span>Execute Request</span>
                </>
              )}
            </button>

            {/* cURL Command */}
            <div className="mt-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">cURL Command</h3>
                <button
                  onClick={() => copyToClipboard(generateCurlCommand(), 'curl-command')}
                  className="flex items-center space-x-1 text-gray-600 hover:text-gray-900"
                >
                  {copiedCode === 'curl-command' ? (
                    <>
                      <Check className="h-4 w-4" />
                      <span className="text-sm">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      <span className="text-sm">Copy</span>
                    </>
                  )}
                </button>
              </div>
              <SyntaxHighlighter
                language="bash"
                style={tomorrow}
                customStyle={{ fontSize: '12px' }}
              >
                {generateCurlCommand()}
              </SyntaxHighlighter>
            </div>
          </div>
        </div>

        {/* Response Panel */}
        <div className="w-1/2 border-l border-gray-200 bg-white overflow-y-auto">
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Response</h2>
            
            {response ? (
              <div className="space-y-6">
                {/* Status */}
                <div className="flex items-center space-x-3">
                  <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium ${
                    response.status >= 200 && response.status < 300
                      ? 'bg-green-100 text-green-800'
                      : response.status >= 400
                      ? 'bg-red-100 text-red-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {response.status >= 200 && response.status < 300 ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : (
                      <AlertCircle className="h-4 w-4" />
                    )}
                    <span>{response.status}</span>
                  </div>
                  <span className="text-gray-600">{response.responseTime}ms</span>
                </div>

                {/* Headers */}
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Response Headers</h3>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <pre className="text-sm text-gray-700">
                      {Object.entries(response.headers)
                        .map(([key, value]) => `${key}: ${value}`)
                        .join('\n')}
                    </pre>
                  </div>
                </div>

                {/* Body */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-gray-900">Response Body</h3>
                    <button
                      onClick={() => copyToClipboard(JSON.stringify(response.data, null, 2), 'response-body')}
                      className="flex items-center space-x-1 text-gray-600 hover:text-gray-900"
                    >
                      {copiedCode === 'response-body' ? (
                        <>
                          <Check className="h-4 w-4" />
                          <span className="text-sm">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4" />
                          <span className="text-sm">Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                  <SyntaxHighlighter
                    language="json"
                    style={tomorrow}
                    customStyle={{ fontSize: '12px', maxHeight: '400px' }}
                  >
                    {JSON.stringify(response.data, null, 2)}
                  </SyntaxHighlighter>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <Code className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Execute a request to see the response</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
export default Main;