import React, { useState } from 'react'
import { 
  Play, 
  Plus, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Edit, 
  Trash2,
  BarChart3,
} from 'lucide-react'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { mockTestCases } from '../../../data/mockAPIData'
import toast from 'react-hot-toast'

 const Main: React.FC = () => {
  const [testCases, setTestCases] = useState(mockTestCases)
  const [selectedTest, setSelectedTest] = useState<any>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [runningTests, setRunningTests] = useState<Set<string>>(new Set())
  const [testResults, setTestResults] = useState<Record<string, any>>({})
    
  const runTest = async (testCase: any) => {
    setRunningTests(prev => new Set([...prev, testCase.id]))
    
    // Simulate test execution
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // Mock test result
    const success = Math.random() > 0.3 // 70% success rate
    const result = {
      id: `result_${Date.now()}`,
      testCaseId: testCase.id,
      status: success ? 'passed' : 'failed',
      duration: Math.floor(Math.random() * 500) + 100,
      response: {
        status: success ? testCase.expectedStatus : 400,
        headers: {
          'Content-Type': 'application/json',
          'X-Request-ID': `req_${Math.random().toString(36).substr(2, 9)}`
        },
        body: success ? { success: true, data: 'Test data' } : { error: 'Test failed' }
      },
      assertions: testCase.assertions.map((assertion: any) => ({
        assertion,
        passed: success,
        actual: success ? assertion.value : 'unexpected_value',
        message: success ? 'Assertion passed' : 'Assertion failed'
      })),
      runAt: new Date().toISOString()
    }
    
    setTestResults(prev => ({ ...prev, [testCase.id]: result }))
    setRunningTests(prev => {
      const newSet = new Set(prev)
      newSet.delete(testCase.id)
      return newSet
    })
    
    // Update test case status
   const allowedStatus = ["passed", "failed", "pending"];
const incomingStatus = testCase.status;

const safeStatus = allowedStatus.includes(incomingStatus) ? incomingStatus : "pending";

setTestCases(prev =>
  prev.map(tc =>
    tc.id === testCase.Id
      ? { ...tc, status: safeStatus as "passed" | "failed" | "pending" }
      : tc
  )
)
    
    toast.success(`Test ${success ? 'passed' : 'failed'}: ${testCase.name}`)
  }

  const runAllTests = async () => {
    for (const testCase of testCases) {
      await runTest(testCase)
      await new Promise(resolve => setTimeout(resolve, 500)) // Small delay between tests
    }
  }

  const deleteTest = (testId: string) => {
    if (confirm('Are you sure you want to delete this test case?')) {
      setTestCases(prev => prev.filter(tc => tc.id !== testId))
      toast.success('Test case deleted')
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">API Testing</h1>
          <p className="text-gray-600">
            Create and run automated tests for your API endpoints
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={runAllTests}
            className="btn btn-outline flex items-center space-x-2"
          >
            <Play className="h-4 w-4" />
            <span>Run All Tests</span>
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn btn-primary flex items-center space-x-2"
          >
            <Plus className="h-5 w-5" />
            <span>New Test</span>
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Test Cases List */}
        <div className="lg:col-span-1">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Test Cases</h2>
          <div className="space-y-3">
            {testCases.map((testCase) => (
              <div
                key={testCase.id}
                className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                  selectedTest?.id === testCase.id
                    ? 'border-primary-300 bg-primary-50'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
                onClick={() => setSelectedTest(testCase)}
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-medium text-gray-900">{testCase.name}</h3>
                  <div className="flex items-center space-x-1">
                    {runningTests.has(testCase.id) ? (
                      <Clock className="h-4 w-4 text-yellow-500 animate-spin" />
                    ) : testCase.status === 'passed' ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : testCase.status === 'failed' ? (
                      <XCircle className="h-4 w-4 text-red-500" />
                    ) : (
                      <div className="h-4 w-4 rounded-full bg-gray-300" />
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2 mb-2">
                  <span className={`px-2 py-1 text-xs font-medium rounded ${
                    testCase.method === 'GET' ? 'bg-green-100 text-green-800' :
                    testCase.method === 'POST' ? 'bg-blue-100 text-blue-800' :
                    testCase.method === 'PUT' ? 'bg-yellow-100 text-yellow-800' :
                    testCase.method === 'DELETE' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {testCase.method}
                  </span>
                  <code className="text-xs text-gray-600">{testCase.endpoint}</code>
                </div>
                <p className="text-sm text-gray-600 line-clamp-2">{testCase.description}</p>
                {testCase.lastRun && (
                  <p className="text-xs text-gray-500 mt-2">
                    Last run: {new Date(testCase.lastRun).toLocaleString()}
                  </p>
                )}
              </div>
            ))}
          </div>

          {testCases.length === 0 && (
            <div className="text-center py-8">
              <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">No test cases yet</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="btn btn-primary"
              >
                Create First Test
              </button>
            </div>
          )}
        </div>

        {/* Test Details */}
        <div className="lg:col-span-2">
          {selectedTest ? (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{selectedTest.name}</h2>
                  <p className="text-gray-600">{selectedTest.description}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => runTest(selectedTest)}
                    disabled={runningTests.has(selectedTest.id)}
                    className="btn btn-primary flex items-center space-x-2"
                  >
                    {runningTests.has(selectedTest.id) ? (
                      <>
                        <Clock className="h-4 w-4 animate-spin" />
                        <span>Running...</span>
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4" />
                        <span>Run Test</span>
                      </>
                    )}
                  </button>
                  <button className="btn btn-outline">
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => deleteTest(selectedTest.id)}
                    className="btn text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Test Configuration */}
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Request Configuration</h3>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Method</label>
                      <span className={`inline-block px-3 py-1 text-sm font-medium rounded ${
                        selectedTest.method === 'GET' ? 'bg-green-100 text-green-800' :
                        selectedTest.method === 'POST' ? 'bg-blue-100 text-blue-800' :
                        selectedTest.method === 'PUT' ? 'bg-yellow-100 text-yellow-800' :
                        selectedTest.method === 'DELETE' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {selectedTest.method}
                      </span>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Expected Status</label>
                      <span className="text-sm text-gray-900">{selectedTest.expectedStatus}</span>
                    </div>
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Endpoint</label>
                    <code className="block p-2 bg-gray-100 rounded text-sm">{selectedTest.endpoint}</code>
                  </div>
                  
                  {Object.keys(selectedTest.headers).length > 0 && (
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Headers</label>
                      <SyntaxHighlighter
                        language="json"
                        style={tomorrow}
                        customStyle={{ fontSize: '12px' }}
                      >
                        {JSON.stringify(selectedTest.headers, null, 2)}
                      </SyntaxHighlighter>
                    </div>
                  )}

                  {selectedTest.body && (
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Request Body</label>
                      <SyntaxHighlighter
                        language="json"
                        style={tomorrow}
                        customStyle={{ fontSize: '12px' }}
                      >
                        {JSON.stringify(selectedTest.body, null, 2)}
                      </SyntaxHighlighter>
                    </div>
                  )}
                </div>

                {/* Assertions */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Assertions</h3>
                  <div className="space-y-2">
                    {selectedTest.assertions.map((assertion: any, index: number) => (
                      <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <span className="text-sm font-medium text-gray-900">
                            {assertion.type === 'status' ? 'Status Code' :
                             assertion.type === 'header' ? `Header: ${assertion.field}` :
                             assertion.type === 'body' ? `Body: ${assertion.field}` :
                             assertion.type === 'response_time' ? 'Response Time' :
                             assertion.type}
                          </span>
                          <span className="text-sm text-gray-600 ml-2">
                            {assertion.operator} {assertion.value}
                          </span>
                        </div>
                        {testResults[selectedTest.id] && (
                          <div>
                            {testResults[selectedTest.id].assertions[index]?.passed ? (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : (
                              <XCircle className="h-4 w-4 text-red-500" />
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Test Results */}
                {testResults[selectedTest.id] && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Last Test Result</h3>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          {testResults[selectedTest.id].status === 'passed' ? (
                            <CheckCircle className="h-6 w-6 text-green-500" />
                          ) : (
                            <XCircle className="h-6 w-6 text-red-500" />
                          )}
                          <span className="font-medium text-gray-900">
                            {testResults[selectedTest.id].status === 'passed' ? 'Test Passed' : 'Test Failed'}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600">
                          {testResults[selectedTest.id].duration}ms
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Response</h4>
                          <div className="text-sm text-gray-600 mb-2">
                            Status: {testResults[selectedTest.id].response.status}
                          </div>
                          <SyntaxHighlighter
                            language="json"
                            style={tomorrow}
                            customStyle={{ fontSize: '12px' }}
                          >
                            {JSON.stringify(testResults[selectedTest.id].response.body, null, 2)}
                          </SyntaxHighlighter>
                        </div>

                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Assertion Results</h4>
                          <div className="space-y-2">
                            {testResults[selectedTest.id].assertions.map((result: any, index: number) => (
                              <div key={index} className={`p-2 rounded ${
                                result.passed ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                              }`}>
                                <div className="flex items-center space-x-2">
                                  {result.passed ? (
                                    <CheckCircle className="h-4 w-4 text-green-500" />
                                  ) : (
                                    <XCircle className="h-4 w-4 text-red-500" />
                                  )}
                                  <span className="text-sm font-medium">
                                    {result.assertion.type} {result.assertion.operator} {result.assertion.value}
                                  </span>
                                </div>
                                {!result.passed && (
                                  <p className="text-sm text-red-600 mt-1 ml-6">
                                    Expected: {result.assertion.value}, Got: {result.actual}
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
              <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Select a test case</h3>
              <p className="text-gray-600">
                Choose a test case from the list to view details and run tests
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Create Test Modal */}
      {showCreateModal && (
        <CreateTestModal
          onClose={() => setShowCreateModal(false)}
          onSave={(testData) => {
            const newTest = {
              ...testData,
              id: `test_${Date.now()}`,
              createdAt: new Date().toISOString()
            }
            setTestCases(prev => [...prev, newTest])
            setShowCreateModal(false)
            toast.success('Test case created successfully!')
          }}
        />
      )}
    </div>
  )
}

const CreateTestModal: React.FC<{
  onClose: () => void
  onSave: (data: any) => void
}> = ({ onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    endpoint: '',
    method: 'GET',
    headers: '{\n  "Authorization": "Bearer your_api_key",\n  "Content-Type": "application/json"\n}',
    body: '',
    expectedStatus: 200,
    assertions: [
      {
        type: 'status',
        operator: 'equals',
        value: 200
      }
    ]
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const parsedHeaders = JSON.parse(formData.headers)
      const parsedBody = formData.body ? JSON.parse(formData.body) : undefined
      
      onSave({
        ...formData,
        headers: parsedHeaders,
        body: parsedBody
      })
    } catch (error) {
      toast.error('Invalid JSON in headers or body')
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Create Test Case</h2>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Test Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="input w-full"
              placeholder="Create User Test"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="input w-full h-20"
              placeholder="Test creating a new user with valid data"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Method
              </label>
              <select
                value={formData.method}
                onChange={(e) => setFormData(prev => ({ ...prev, method: e.target.value }))}
                className="input w-full"
              >
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="DELETE">DELETE</option>
                <option value="PATCH">PATCH</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Expected Status
              </label>
              <input
                type="number"
                value={formData.expectedStatus}
                onChange={(e) => setFormData(prev => ({ ...prev, expectedStatus: parseInt(e.target.value) }))}
                className="input w-full"
                min="100"
                max="599"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Endpoint
            </label>
            <input
              type="text"
              value={formData.endpoint}
              onChange={(e) => setFormData(prev => ({ ...prev, endpoint: e.target.value }))}
              className="input w-full"
              placeholder="/api/v1/users"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Headers (JSON)
            </label>
            <textarea
              value={formData.headers}
              onChange={(e) => setFormData(prev => ({ ...prev, headers: e.target.value }))}
              className="input w-full h-24 font-mono text-sm"
            />
          </div>

          {formData.method !== 'GET' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Request Body (JSON)
              </label>
              <textarea
                value={formData.body}
                onChange={(e) => setFormData(prev => ({ ...prev, body: e.target.value }))}
                className="input w-full h-32 font-mono text-sm"
                placeholder='{\n  "name": "John Doe",\n  "email": "john@example.com"\n}'
              />
            </div>
          )}

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
            >
              Create Test
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default Main;