import React, { useState } from 'react';
import {
  Copy, 
  Eye, 
  EyeOff, 
  Plus, 
  Trash2, 
  Activity,
  BookOpen,
  Download,
  Terminal
} from 'lucide-react';

export const APIManagement: React.FC = () => {
  const [showApiKey, setShowApiKey] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('python');

  const apiKeys = [
    {
      id: '1',
      name: 'Production API Key',
      key: 'sk_live_4aBcDeFgHiJkLmNoPqRsTuVwXyZ',
      created: '2024-01-15',
      lastUsed: '2 hours ago',
      usage: '1,234 calls',
      status: 'active'
    },
    {
      id: '2',
      name: 'Development API Key',
      key: 'sk_test_1ZyXwVuTsRqPoNmLkJiHgFeD',
      created: '2024-01-10',
      lastUsed: '1 day ago',
      usage: '456 calls',
      status: 'active'
    }
  ];

  const endpoints = [
    {
      method: 'POST',
      path: '/api/templates/{template_id}/generate',
      description: 'Generate document from template',
      usage: '2,456 calls'
    },
    {
      method: 'GET',
      path: '/api/templates',
      description: 'List all templates',
      usage: '1,234 calls'
    },
    {
      method: 'POST',
      path: '/api/templates',
      description: 'Create new template',
      usage: '567 calls'
    },
    {
      method: 'PUT',
      path: '/api/templates/{template_id}',
      description: 'Update template',
      usage: '234 calls'
    }
  ];

  const codeExamples = {
    python: `import requests

url = "https://api.draftnSign.com/v1/templates/template_001/generate"
headers = {
    "Authorization": "Bearer sk_live_4aBcDeFgHiJkLmNoPqRsTuVwXyZ",
    "Content-Type": "application/json"
}

data = {
    "variables": {
        "employee_name": "John Doe",
        "start_date": "2024-02-01",
        "salary": 75000
    }
}

response = requests.post(url, headers=headers, json=data)
document = response.json()`,

    nodejs: `const axios = require('axios');

const url = 'https://api.draftnSign.com/v1/templates/template_001/generate';
const headers = {
    'Authorization': 'Bearer sk_live_4aBcDeFgHiJkLmNoPqRsTuVwXyZ',
    'Content-Type': 'application/json'
};

const data = {
    variables: {
        employee_name: 'John Doe',
        start_date: '2024-02-01',
        salary: 75000
    }
};

axios.post(url, data, { headers })
    .then(response => {
        console.log(response.data);
    })
    .catch(error => {
        console.error(error);
    });`,

    curl: `curl -X POST https://api.draftnSign.com/v1/templates/template_001/generate \\
  -H "Authorization: Bearer sk_live_4aBcDeFgHiJkLmNoPqRsTuVwXyZ" \\
  -H "Content-Type: application/json" \\
  -d '{
    "variables": {
      "employee_name": "John Doe",
      "start_date": "2024-02-01",
      "salary": 75000
    }
  }'`,

    php: `<?php
$url = 'https://api.draftnSign.com/v1/templates/template_001/generate';
$headers = [
    'Authorization: Bearer sk_live_4aBcDeFgHiJkLmNoPqRsTuVwXyZ',
    'Content-Type: application/json'
];

$data = [
    'variables' => [
        'employee_name' => 'John Doe',
        'start_date' => '2024-02-01',
        'salary' => 75000
    ]
];

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_POST, 1);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

$response = curl_exec($ch);
curl_close($ch);

$document = json_decode($response, true);
?>`
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // You could add a toast notification here
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">API Management</h1>
        <p className="text-gray-600">Manage your API keys and integrate templates into your applications</p>
      </div>

      {/* API Keys Section */}
      <div className="bg-[#F7F3EE] rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">API Keys</h2>
          <button className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium">
            <Plus className="w-4 h-4 mr-2" />
            Create New Key
          </button>
        </div>

        <div className="space-y-4">
          {apiKeys.map((apiKey) => (
            <div key={apiKey.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="font-medium text-gray-900">{apiKey.name}</h3>
                  <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                    <span>Created {apiKey.created}</span>
                    <span>•</span>
                    <span>Last used {apiKey.lastUsed}</span>
                    <span>•</span>
                    <span>{apiKey.usage}</span>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    apiKey.status === 'active' 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-gray-100 text-gray-700'
                  }`}>
                    {apiKey.status}
                  </span>
                  <button className="p-1 text-gray-400 hover:text-red-600">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <div className="flex-1 font-mono text-sm bg-[#F5F2EE] p-3 rounded border">
                  {showApiKey ? apiKey.key : apiKey.key.replace(/./g, '•')}
                </div>
                <button
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="p-2 text-gray-400 hover:text-gray-600 border border-gray-200 rounded"
                >
                  {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => copyToClipboard(apiKey.key)}
                  className="p-2 text-gray-400 hover:text-gray-600 border border-gray-200 rounded"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* API Documentation */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Endpoints */}
        <div className="bg-[#F7F3EE] rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">API Endpoints</h2>
            <button className="flex items-center text-blue-600 hover:text-blue-700 text-sm font-medium">
              <BookOpen className="w-4 h-4 mr-2" />
              Full Documentation
            </button>
          </div>

          <div className="space-y-3">
            {endpoints.map((endpoint, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center space-x-3">
                    <span className={`px-2 py-1 text-xs font-medium rounded ${
                      endpoint.method === 'GET' ? 'bg-green-100 text-green-700' :
                      endpoint.method === 'POST' ? 'bg-blue-100 text-blue-700' :
                      'bg-orange-100 text-orange-700'
                    }`}>
                      {endpoint.method}
                    </span>
                    <code className="text-sm font-mono text-gray-800">{endpoint.path}</code>
                  </div>
                  <span className="text-xs text-gray-500">{endpoint.usage}</span>
                </div>
                <p className="text-sm text-gray-600">{endpoint.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Usage Statistics */}
        <div className="bg-[#F7F3EE] rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">API Usage</h2>
          
          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Monthly Usage</span>
                <span className="text-sm font-semibold text-gray-900">4,567 / 10,000</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-blue-500 h-2 rounded-full" style={{ width: '45.67%' }}></div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Rate Limit</span>
                <span className="text-sm font-semibold text-gray-900">120 / 1000 per hour</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full" style={{ width: '12%' }}></div>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-200">
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-gray-900">99.9%</div>
                  <div className="text-sm text-gray-600">Uptime</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">45ms</div>
                  <div className="text-sm text-gray-600">Avg Response</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Code Examples */}
      <div className="bg-[#F7F3EE] rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">Code Examples</h2>
          <div className="flex items-center space-x-2">
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            >
              <option value="python">Python</option>
              <option value="nodejs">Node.js</option>
              <option value="curl">cURL</option>
              <option value="php">PHP</option>
            </select>
            <button
              onClick={() => copyToClipboard(codeExamples[selectedLanguage as keyof typeof codeExamples])}
              className="flex items-center px-3 py-2 border border-gray-300 hover:border-gray-400 text-gray-700 rounded-md text-sm"
            >
              <Copy className="w-4 h-4 mr-2" />
              Copy
            </button>
          </div>
        </div>

        <div className="relative">
          <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
            <code>{codeExamples[selectedLanguage as keyof typeof codeExamples]}</code>
          </pre>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
        <button className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 transition-colors">
          <Terminal className="w-5 h-5 mr-2 text-gray-400" />
          <span className="text-gray-600 font-medium">Test API Endpoint</span>
        </button>
        <button className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 transition-colors">
          <Download className="w-5 h-5 mr-2 text-gray-400" />
          <span className="text-gray-600 font-medium">Download SDK</span>
        </button>
        <button className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 transition-colors">
          <Activity className="w-5 h-5 mr-2 text-gray-400" />
          <span className="text-gray-600 font-medium">View Logs</span>
        </button>
      </div>
    </div>
  );
};