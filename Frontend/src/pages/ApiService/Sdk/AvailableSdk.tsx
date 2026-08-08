import React, { useState } from 'react'
import { 
  Download, 
  Star, 
  Copy, 
  Check, 
  Code, 
  Book,
  Github,
  Package,
  Calendar,
} from 'lucide-react'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { useAPI } from '../../../context/ApiContext'
import { BRAND } from '../../../config/brand'
import { useBrandSettings } from '../../../hooks/useBrandSettings'

export const AvailableSdk: React.FC = () => {
  const { name: brandName } = useBrandSettings();
  const { sdks } = useAPI()
  const [selectedSDK, setSelectedSDK] = useState(sdks[0])
  const [copiedCode, setCopiedCode] = useState<string | null>(null)

  const copyToClipboard = (code: string, id: string) => {
    navigator.clipboard.writeText(code)
    setCopiedCode(id)
    setTimeout(() => setCopiedCode(null), 2000)
  }

  const getLanguageIcon = (language: string) => {
    const icons: Record<string, string> = {
      'Python': '🐍',
      'JavaScript': '🟨',
      'Java': '☕',
      'C#': '🔷',
      'PHP': '🐘',
      'Ruby': '💎',
      'Go': '🐹'
    }
    return icons[language] || '📦'
  }

  const getInstallationExample = (sdk: any) => {
    const examples: Record<string, string> = {
      'Python': `# Install the SDK
${sdk.installCommand}

# Basic usage
import draftn_sign

client = draftn_sign.Client(api_key="your_api_key")

# Create an envelope
envelope = client.envelopes.create({
    "subject": "Please sign this document",
    "documents": [{
        "name": "contract.pdf",
        "content": base64_content
    }],
    "recipients": [{
        "name": "John Doe",
        "email": "john@example.com",
        "role": "signer"
    }]
})

print(f"Envelope ID: {envelope.id}")`,
      'JavaScript': `// Install the SDK
${sdk.installCommand}

// Basic usage
const DraftnSign = require('@draftn/sign-js');

const client = new DraftnSign({
    apiKey: 'your_api_key'
});

// Create an envelope
const envelope = await client.envelopes.create({
    subject: 'Please sign this document',
    documents: [{
        name: 'contract.pdf',
        content: base64Content
    }],
    recipients: [{
        name: 'John Doe',
        email: 'john@example.com',
        role: 'signer'
    }]
});

console.log(\`Envelope ID: \${envelope.id}\`);`,
      'Java': `// Add to your build.gradle
${sdk.installCommand}

// Basic usage
import com.draftn.sign.DraftnSignClient;
import com.draftn.sign.models.Envelope;

DraftnSignClient client = new DraftnSignClient("your_api_key");

Envelope envelope = client.envelopes().create(
    Envelope.builder()
        .subject("Please sign this document")
        .addDocument("contract.pdf", base64Content)
        .addRecipient("John Doe", "john@example.com", "signer")
        .build()
);

System.out.println("Envelope ID: " + envelope.getId());`,
      'C#': `// Install via NuGet Package Manager
${sdk.installCommand}

// Basic usage
using DraftnSign;

var client = new DraftnSignClient("your_api_key");

var envelope = await client.Envelopes.CreateAsync(new CreateEnvelopeRequest
{
    Subject = "Please sign this document",
    Documents = new[]
    {
        new Document { Name = "contract.pdf", Content = base64Content }
    },
    Recipients = new[]
    {
        new Recipient { Name = "John Doe", Email = "john@example.com", Role = "signer" }
    }
});

Console.WriteLine($"Envelope ID: {envelope.Id}");`,
      'PHP': `<?php
// Install via Composer
${sdk.installCommand}

// Basic usage
require_once 'vendor/autoload.php';

use Draftn\\Sign\\Client;

$client = new Client('your_api_key');

$envelope = $client->envelopes()->create([
    'subject' => 'Please sign this document',
    'documents' => [
        [
            'name' => 'contract.pdf',
            'content' => $base64Content
        ]
    ],
    'recipients' => [
        [
            'name' => 'John Doe',
            'email' => 'john@example.com',
            'role' => 'signer'
        ]
    ]
]);

echo "Envelope ID: " . $envelope->id;`,
      'Ruby': `# Install the gem
${sdk.installCommand}

# Basic usage
require 'draftn_sign'

client = DraftnSign::Client.new(api_key: 'your_api_key')

envelope = client.envelopes.create(
  subject: 'Please sign this document',
  documents: [
    {
      name: 'contract.pdf',
      content: base64_content
    }
  ],
  recipients: [
    {
      name: 'John Doe',
      email: 'john@example.com',
      role: 'signer'
    }
  ]
)

puts "Envelope ID: #{envelope.id}"`,
      'Go': `// Install the package
${sdk.installCommand}

// Basic usage
package main

import (
    "fmt"
    "github.com/draftn/sign-go"
)

func main() {
    client := draftn.NewClient("your_api_key")
    
    envelope, err := client.Envelopes.Create(&draftn.CreateEnvelopeRequest{
        Subject: "Please sign this document",
        Documents: []draftn.Document{
            {
                Name:    "contract.pdf",
                Content: base64Content,
            },
        },
        Recipients: []draftn.Recipient{
            {
                Name:  "John Doe",
                Email: "john@example.com",
                Role:  "signer",
            },
        },
    })
    
    if err != nil {
        panic(err)
    }
    
    fmt.Printf("Envelope ID: %s\\n", envelope.ID)
}`
    }
    return examples[sdk.language] || `# Install ${sdk.language} SDK\n${sdk.installCommand}`
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">

      <div className="grid lg:grid-cols-3 gap-8">
        {/* SDK List */}
        <div className="lg:col-span-1">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Available SDKs</h2>
          <div className="space-y-3">
            {sdks.map((sdk) => (
              <button
                key={sdk.language}
                onClick={() => setSelectedSDK(sdk)}
                className={`w-full text-left p-4 rounded-lg border transition-colors ${
                  selectedSDK.language === sdk.language
                    ? 'border-primary-300 bg-primary-50'
                    : 'border-gray-200 hover:border-gray-300 bg-[#F7F3EE]'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{getLanguageIcon(sdk.language)}</span>
                    <div>
                      <h3 className="font-semibold text-gray-900">{sdk.language}</h3>
                      <p className="text-sm text-gray-600">v{sdk.version}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1 text-yellow-500">
                    <Star className="h-4 w-4 fill-current" />
                    <span className="text-sm font-medium">{sdk.rating}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <div className="flex items-center space-x-1">
                    <Download className="h-4 w-4" />
                    <span>{sdk.downloads.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-4 w-4" />
                    <span>{new Date(sdk.lastUpdated).toLocaleDateString()}</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* SDK Details */}
        <div className="lg:col-span-2">
          <div className="bg-[#F7F3EE] rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <span className="text-4xl">{getLanguageIcon(selectedSDK.language)}</span>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{selectedSDK.language} SDK</h2>
                  <p className="text-gray-600">Version {selectedSDK.version}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-1 text-yellow-500">
                  <Star className="h-5 w-5 fill-current" />
                  <span className="font-medium">{selectedSDK.rating}</span>
                </div>
                <div className="flex items-center space-x-1 text-gray-600">
                  <Download className="h-5 w-5" />
                  <span>{selectedSDK.downloads.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="text-center p-4 bg-[#F5F2EE] rounded-lg">
                <div className="text-2xl font-bold text-gray-900">{selectedSDK.downloads.toLocaleString()}</div>
                <div className="text-sm text-gray-600">Downloads</div>
              </div>
              <div className="text-center p-4 bg-[#F5F2EE] rounded-lg">
                <div className="text-2xl font-bold text-gray-900">{selectedSDK.rating}</div>
                <div className="text-sm text-gray-600">Rating</div>
              </div>
              <div className="text-center p-4 bg-[#F5F2EE] rounded-lg">
                <div className="text-2xl font-bold text-gray-900">v{selectedSDK.version}</div>
                <div className="text-sm text-gray-600">Latest Version</div>
              </div>
            </div>

            {/* Installation & Usage */}
            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Installation & Quick Start</h3>
                  <button
                    onClick={() => copyToClipboard(getInstallationExample(selectedSDK), `${selectedSDK.language}-example`)}
                    className="flex items-center space-x-1 text-gray-600 hover:text-gray-900"
                  >
                    {copiedCode === `${selectedSDK.language}-example` ? (
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
                  language={selectedSDK.language.toLowerCase() === 'c#' ? 'csharp' : selectedSDK.language.toLowerCase()}
                  style={tomorrow}
                  customStyle={{ fontSize: '14px' }}
                >
                  {getInstallationExample(selectedSDK)}
                </SyntaxHighlighter>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3">
                <a
                  href={selectedSDK.documentation}
                  className="btn btn-primary flex items-center space-x-2"
                >
                  <Book className="h-4 w-4" />
                  <span>Documentation</span>
                </a>
                <a
                  href={selectedSDK.examples}
                  className="btn btn-outline flex items-center space-x-2"
                >
                  <Code className="h-4 w-4" />
                  <span>Examples</span>
                </a>
                <button className="btn btn-outline flex items-center space-x-2">
                  <Github className="h-4 w-4" />
                  <span>GitHub</span>
                </button>
                <button className="btn btn-outline flex items-center space-x-2">
                  <Package className="h-4 w-4" />
                  <span>Package Registry</span>
                </button>
              </div>

              {/* Features */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Features</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                    <div>
                      <h4 className="font-medium text-gray-900">Full API Coverage</h4>
                      <p className="text-sm text-gray-600">Complete access to all {brandName} API endpoints</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                    <div>
                      <h4 className="font-medium text-gray-900">Type Safety</h4>
                      <p className="text-sm text-gray-600">Strongly typed interfaces and models</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                    <div>
                      <h4 className="font-medium text-gray-900">Error Handling</h4>
                      <p className="text-sm text-gray-600">Comprehensive error handling and retry logic</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                    <div>
                      <h4 className="font-medium text-gray-900">Async Support</h4>
                      <p className="text-sm text-gray-600">Modern async/await patterns where applicable</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                    <div>
                      <h4 className="font-medium text-gray-900">Authentication</h4>
                      <p className="text-sm text-gray-600">Built-in API key and OAuth 2.0 support</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                    <div>
                      <h4 className="font-medium text-gray-900">Testing Support</h4>
                      <p className="text-sm text-gray-600">Mock mode for development and testing</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Changelog */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Updates</h3>
                <div className="space-y-3">
                  <div className="flex items-start space-x-3 p-3 bg-green-50 rounded-lg">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                    <div>
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="font-medium text-gray-900">v{selectedSDK.version}</span>
                        <span className="text-sm text-gray-600">{new Date(selectedSDK.lastUpdated).toLocaleDateString()}</span>
                      </div>
                      <p className="text-sm text-gray-700">Added support for bulk envelope operations and improved error handling</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3 p-3 bg-[#F5F2EE] rounded-lg">
                    <div className="w-2 h-2 bg-gray-400 rounded-full mt-2"></div>
                    <div>
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="font-medium text-gray-900">v{(parseFloat(selectedSDK.version) - 0.1).toFixed(1)}</span>
                        <span className="text-sm text-gray-600">2 weeks ago</span>
                      </div>
                      <p className="text-sm text-gray-700">Performance improvements and bug fixes for webhook handling</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SDK Comparison */}
      <div className="mt-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">SDK Comparison</h2>
        <div className="bg-[#F7F3EE] rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#F5F2EE]">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-900">Language</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-900">Version</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-900">Downloads</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-900">Rating</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-900">Last Updated</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {sdks.map((sdk) => (
                  <tr key={sdk.language} className="hover:bg-[#F5F2EE]">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <span className="text-xl">{getLanguageIcon(sdk.language)}</span>
                        <span className="font-medium text-gray-900">{sdk.language}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">v{sdk.version}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-1 text-sm text-gray-600">
                        <Download className="h-4 w-4" />
                        <span>{sdk.downloads.toLocaleString()}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-1">
                        <Star className="h-4 w-4 text-yellow-500 fill-current" />
                        <span className="text-sm font-medium">{sdk.rating}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(sdk.lastUpdated).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <a
                          href={sdk.documentation}
                          className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                        >
                          Docs
                        </a>
                        <a
                          href={sdk.examples}
                          className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                        >
                          Examples
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}