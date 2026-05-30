import React, { useState } from 'react';
import { Code, Copy, Play, Settings } from 'lucide-react';

interface APIEndpoint {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string;
  description: string;
  parameters: Array<{
    name: string;
    type: string;
    required: boolean;
    description: string;
  }>;
  response: any;
}

interface TemplateGenerationAPIProps {
  templateId?: string;
  onAPIGenerated: (apiConfig: any) => void;
}

export const TemplateGenerationAPI: React.FC<TemplateGenerationAPIProps> = ({
  templateId:_templateId,
  onAPIGenerated
}) => {
  const [selectedLanguage, setSelectedLanguage] = useState('python');
  const [apiKey, setApiKey] = useState('sk_test_4aBcDeFgHiJkLmNoPqRsTuVwXyZ');
  const [isGenerating, setIsGenerating] = useState(false);

  const apiEndpoints: APIEndpoint[] = [
    {
      method: 'POST',
      path: '/api/ai/templates/generate',
      description: 'Generate template from natural language description',
      parameters: [
        { name: 'description', type: 'string', required: true, description: 'Natural language description of the template' },
        { name: 'industry', type: 'string', required: false, description: 'Target industry for the template' },
        { name: 'complexity', type: 'string', required: false, description: 'Template complexity level (simple, medium, complex)' }
      ],
      response: {
        template_id: 'ai_template_001',
        name: 'Generated Template',
        structure: { sections: [], fields: [] },
        confidence: 94.2
      }
    },
    {
      method: 'POST',
      path: '/api/ai/templates/{template_id}/optimize',
      description: 'Optimize existing template using AI',
      parameters: [
        { name: 'template_id', type: 'string', required: true, description: 'ID of the template to optimize' },
        { name: 'optimization_type', type: 'string', required: false, description: 'Type of optimization (performance, accessibility, compliance)' }
      ],
      response: {
        optimized_template: {},
        improvements: [],
        confidence: 89.7
      }
    },
    {
      method: 'POST',
      path: '/api/ai/fields/detect',
      description: 'Detect and place fields automatically',
      parameters: [
        { name: 'document_content', type: 'string', required: true, description: 'Document content for field detection' },
        { name: 'auto_optimize', type: 'boolean', required: false, description: 'Whether to auto-optimize field placement' }
      ],
      response: {
        detected_fields: [],
        optimization: {},
        confidence: 96.8
      }
    }
  ];

  const codeExamples = {
    python: `import requests
import json

# AI Template Generation
url = "https://api.draftnSign.com/v1/ai/templates/generate"
headers = {
    "Authorization": "Bearer ${apiKey}",
    "Content-Type": "application/json"
}

data = {
    "description": "Create an employment contract for software engineers",
    "industry": "technology",
    "complexity": "medium"
}

response = requests.post(url, headers=headers, json=data)
template = response.json()

print(f"Generated template: {template['name']}")
print(f"AI confidence: {template['confidence']}%")`,

    nodejs: `const axios = require('axios');

// AI Template Generation
const generateTemplate = async () => {
    try {
        const response = await axios.post(
            'https://api.draftnSign.com/v1/ai/templates/generate',
            {
                description: 'Create an employment contract for software engineers',
                industry: 'technology',
                complexity: 'medium'
            },
            {
                headers: {
                    'Authorization': 'Bearer ${apiKey}',
                    'Content-Type': 'application/json'
                }
            }
        );
        
        console.log('Generated template:', response.data.name);
        console.log('AI confidence:', response.data.confidence + '%');
        return response.data;
    } catch (error) {
        console.error('Error generating template:', error);
    }
};

generateTemplate();`,

    curl: `# AI Template Generation
curl -X POST https://api.draftnSign.com/v1/ai/templates/generate \\
  -H "Authorization: Bearer ${apiKey}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "description": "Create an employment contract for software engineers",
    "industry": "technology",
    "complexity": "medium"
  }'`,

    php: `<?php
// AI Template Generation
$url = 'https://api.draftnSign.com/v1/ai/templates/generate';
$headers = [
    'Authorization: Bearer ${apiKey}',
    'Content-Type: application/json'
];

$data = [
    'description' => 'Create an employment contract for software engineers',
    'industry' => 'technology',
    'complexity' => 'medium'
];

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_POST, 1);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

$response = curl_exec($ch);
curl_close($ch);

$template = json_decode($response, true);
echo "Generated template: " . $template['name'] . "\\n";
echo "AI confidence: " . $template['confidence'] . "%\\n";
?>`
  };

  const generateAPIConfig = async () => {
    setIsGenerating(true);
    
    // Simulate API configuration generation
    await new Promise(resolve => setTimeout(resolve, 1500));

    const apiConfig = {
      endpoints: apiEndpoints,
      authentication: {
        type: 'bearer_token',
        key: apiKey
      },
      baseUrl: 'https://api.draftnSign.com/v1',
      sdks: {
        python: 'pip install draftnSign-ai',
        nodejs: 'npm install @draftnSign/ai-sdk',
        php: 'composer require draftnSign/ai-sdk'
      }
    };

    onAPIGenerated(apiConfig);
    setIsGenerating(false);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="bg-[#F7F3EE] rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center mb-6">
        <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-purple-500 rounded-lg flex items-center justify-center mr-4">
          <Code className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-900">AI Template Generation API</h2>
          <p className="text-sm text-gray-600">Programmatic access to AI-powered template features</p>
        </div>
      </div>

      {/* API Configuration */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Programming Language</label>
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="python">Python</option>
              <option value="nodejs">Node.js</option>
              <option value="curl">cURL</option>
              <option value="php">PHP</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">API Key</label>
            <input
              type="text"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
              placeholder="Your API key"
            />
          </div>
        </div>
        <button
          onClick={generateAPIConfig}
          disabled={isGenerating}
          className="flex items-center px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md font-medium disabled:opacity-50"
        >
          {isGenerating ? (
            <>
              <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Generating...
            </>
          ) : (
            <>
              <Settings className="w-4 h-4 mr-2" />
              Generate API Config
            </>
          )}
        </button>
      </div>

      {/* API Endpoints */}
      <div className="mb-6">
        <h3 className="text-md font-medium text-gray-900 mb-4">Available AI Endpoints</h3>
        <div className="space-y-3">
          {apiEndpoints.map((endpoint, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-3">
                  <span className={`px-2 py-1 text-xs font-medium rounded ${
                    endpoint.method === 'GET' ? 'bg-green-100 text-green-700' :
                    endpoint.method === 'POST' ? 'bg-blue-100 text-blue-700' :
                    endpoint.method === 'PUT' ? 'bg-orange-100 text-orange-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {endpoint.method}
                  </span>
                  <code className="text-sm font-mono text-gray-800">{endpoint.path}</code>
                </div>
                <button
                  onClick={() => copyToClipboard(endpoint.path)}
                  className="p-1 text-gray-400 hover:text-gray-600"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
              <p className="text-sm text-gray-600 mb-3">{endpoint.description}</p>
              
              {/* Parameters */}
              <div className="mb-3">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Parameters:</h4>
                <div className="space-y-1">
                  {endpoint.parameters.map((param, paramIndex) => (
                    <div key={paramIndex} className="flex items-center space-x-2 text-sm">
                      <code className="text-blue-600">{param.name}</code>
                      <span className="text-gray-500">({param.type})</span>
                      {param.required && <span className="text-red-500">*</span>}
                      <span className="text-gray-600">- {param.description}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Code Example */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-md font-medium text-gray-900">Code Example</h3>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => copyToClipboard(codeExamples[selectedLanguage as keyof typeof codeExamples])}
              className="flex items-center px-3 py-2 border border-gray-300 hover:border-gray-400 text-gray-700 rounded-md text-sm"
            >
              <Copy className="w-4 h-4 mr-2" />
              Copy Code
            </button>
            <button className="flex items-center px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md text-sm">
              <Play className="w-4 h-4 mr-2" />
              Test API
            </button>
          </div>
        </div>

        <div className="relative">
          <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
            <code>{codeExamples[selectedLanguage as keyof typeof codeExamples]}</code>
          </pre>
        </div>
      </div>

      {/* SDK Information */}
      <div className="border-t border-gray-200 pt-6">
        <h3 className="text-md font-medium text-gray-900 mb-4">SDK Installation</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-[#F5F2EE] rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Python SDK</h4>
            <code className="text-sm text-gray-700">pip install draftnSign-ai</code>
            <button
              onClick={() => copyToClipboard('pip install draftnSign-ai')}
              className="ml-2 p-1 text-gray-400 hover:text-gray-600"
            >
              <Copy className="w-3 h-3" />
            </button>
          </div>
          <div className="p-4 bg-[#F5F2EE] rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Node.js SDK</h4>
            <code className="text-sm text-gray-700">npm install @draftnSign/ai-sdk</code>
            <button
              onClick={() => copyToClipboard('npm install @draftnSign/ai-sdk')}
              className="ml-2 p-1 text-gray-400 hover:text-gray-600"
            >
              <Copy className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};