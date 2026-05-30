import React, { useState } from "react";
import { Routes, Route, Link, useLocation } from "react-router-dom";
import {
  Book,
  Code,
  Zap,
  Settings,
  ChevronRight,
  Search,
  ExternalLink,
  Copy,
  Check,
} from "lucide-react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { tomorrow } from "react-syntax-highlighter/dist/esm/styles/prism";

const Main: React.FC = () => {
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  // ...existing code...

  const navigation = [
    {
      name: "Getting Started",
      href: "/docs",
      icon: Book,
      children: [
        { name: "Quick Start", href: "/docs/quickstart" },
        { name: "Authentication", href: "/docs/authentication" },
        { name: "Rate Limiting", href: "/docs/rate-limiting" },
        { name: "Error Handling", href: "/docs/errors" },
      ],
    },
    {
      name: "API Reference",
      href: "/docs/api",
      icon: Code,
      children: [
        { name: "Users", href: "/docs/api/users" },
        { name: "Documents", href: "/docs/api/documents" },
        { name: "Envelopes", href: "/docs/api/envelopes" },
        { name: "Templates", href: "/docs/api/templates" },
        { name: "Webhooks", href: "/docs/api/webhooks" },
      ],
    },
    {
      name: "Webhooks",
      href: "/docs/webhooks",
      icon: Zap,
      children: [
        { name: "Overview", href: "/docs/webhooks/overview" },
        { name: "Event Types", href: "/docs/webhooks/events" },
        { name: "Security", href: "/docs/webhooks/security" },
        { name: "Testing", href: "/docs/webhooks/testing" },
      ],
    },
    {
      name: "SDKs",
      href: "/docs/sdks",
      icon: Settings,
      children: [
        { name: "Python", href: "/docs/sdks/python" },
        { name: "JavaScript", href: "/docs/sdks/javascript" },
        { name: "Java", href: "/docs/sdks/java" },
        { name: "C#", href: "/docs/sdks/csharp" },
        { name: "PHP", href: "/docs/sdks/php" },
        { name: "Ruby", href: "/docs/sdks/ruby" },
        { name: "Go", href: "/docs/sdks/go" },
      ],
    },
  ];

  // ...existing code...


  const isActive = (path: string) => {
    if (path === "/docs" && location.pathname === "/docs") return true;
    if (path !== "/docs" && location.pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <div className="flex min-h-screen bg-[#F5F2EE]">
      {/* Sidebar */}
      <div className="w-80 bg-[#F7F3EE] border-r border-gray-200 h-full">
        <div className="p-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search documentation..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </div>

        <nav className="px-6 pb-6">
          {navigation.map((section) => {
            const Icon = section.icon;
            return (
              <div key={section.name} className="mb-6">
                <div className="flex items-center space-x-2 mb-3">
                  <Icon className="h-5 w-5 text-gray-400" />
                  <h3 className="font-semibold text-gray-900">
                    {section.name}
                  </h3>
                </div>
                <ul className="space-y-1 ml-7">
                  {section.children.map((item) => (
                    <li key={item.name}>
                      <Link
                        to={item.href}
                        className={`block px-3 py-2 text-sm rounded-md transition-colors ${
                          isActive(item.href)
                            ? "bg-primary-100 text-primary-700 font-medium"
                            : "text-gray-600 hover:text-gray-900 hover:bg-[#F5F2EE]"
                        }`}
                      >
                        {item.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-8 py-12">
          <Routes>
            <Route path="/" element={<DocsOverview />} />
            <Route path="/quickstart" element={<QuickStartDocs />} />
            <Route path="/authentication" element={<AuthenticationDocs />} />
            <Route path="/api/users" element={<UsersAPIDocs />} />
            <Route path="/api/envelopes" element={<EnvelopesAPIDocs />} />
            <Route
              path="/webhooks/overview"
              element={<WebhooksOverviewDocs />}
            />
            <Route path="/sdks/python" element={<PythonSDKDocs />} />
            <Route path="/sdks/javascript" element={<JavaScriptSDKDocs />} />
          </Routes>
        </div>
      </div>
    </div>
  );
};

const DocsOverview: React.FC = () => (
  <div>
    <h1 className="text-4xl font-bold text-gray-900 mb-6">
      DraftnSign API Documentation
    </h1>
    <p className="text-xl text-gray-600 mb-8">
      Welcome to the DraftnSign API documentation. Here you'll find
      comprehensive guides and API references to help you integrate document
      signing and management into your applications.
    </p>

    <div className="grid md:grid-cols-2 gap-6 mb-12">
      <Link
        to="/docs/quickstart"
        className="block p-6 bg-[#F7F3EE] rounded-lg border border-gray-200 hover:border-primary-300 transition-colors"
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Quick Start Guide
        </h3>
        <p className="text-gray-600 mb-4">
          Get up and running with the DraftnSign API in minutes.
        </p>
        <div className="flex items-center text-primary-600 font-medium">
          Get started <ChevronRight className="ml-1 h-4 w-4" />
        </div>
      </Link>

      <Link
        to="/docs/api/envelopes"
        className="block p-6 bg-[#F7F3EE] rounded-lg border border-gray-200 hover:border-primary-300 transition-colors"
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          API Reference
        </h3>
        <p className="text-gray-600 mb-4">
          Detailed documentation for all API endpoints and methods.
        </p>
        <div className="flex items-center text-primary-600 font-medium">
          Explore API <ChevronRight className="ml-1 h-4 w-4" />
        </div>
      </Link>

      <Link
        to="/docs/webhooks/overview"
        className="block p-6 bg-[#F7F3EE] rounded-lg border border-gray-200 hover:border-primary-300 transition-colors"
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Webhooks</h3>
        <p className="text-gray-600 mb-4">
          Learn how to receive real-time notifications for document events.
        </p>
        <div className="flex items-center text-primary-600 font-medium">
          Learn more <ChevronRight className="ml-1 h-4 w-4" />
        </div>
      </Link>

      <Link
        to="/docs/sdks/python"
        className="block p-6 bg-[#F7F3EE] rounded-lg border border-gray-200 hover:border-primary-300 transition-colors"
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          SDKs & Libraries
        </h3>
        <p className="text-gray-600 mb-4">
          Official SDKs for Python, JavaScript, Java, and more.
        </p>
        <div className="flex items-center text-primary-600 font-medium">
          View SDKs <ChevronRight className="ml-1 h-4 w-4" />
        </div>
      </Link>
    </div>

    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-blue-900 mb-2">Need Help?</h3>
      <p className="text-blue-800 mb-4">
        Can't find what you're looking for? Our developer community and support
        team are here to help.
      </p>
      <div className="flex space-x-4">
        <Link
          to="/community"
          className="text-blue-600 hover:text-blue-700 font-medium"
        >
          Join Community →
        </Link>
        <Link
          to="/support"
          className="text-blue-600 hover:text-blue-700 font-medium"
        >
          Contact Support →
        </Link>
      </div>
    </div>
  </div>
);

const QuickStartDocs: React.FC = () => {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const copyToClipboard = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const CodeBlock: React.FC<{ code: string; language: string; id: string }> = ({
    code,
    language,
    id,
  }) => (
    <div className="relative">
      <div className="flex items-center justify-between bg-gray-800 px-4 py-2 rounded-t-lg">
        <span className="text-gray-300 text-sm font-medium">{language}</span>
        <button
          onClick={() => copyToClipboard(code, id)}
          className="flex items-center space-x-1 text-gray-300 hover:text-white transition-colors"
        >
          {copiedCode === id ? (
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
        language={language.toLowerCase()}
        style={tomorrow}
        customStyle={{
          margin: 0,
          borderTopLeftRadius: 0,
          borderTopRightRadius: 0,
          borderBottomLeftRadius: "0.5rem",
          borderBottomRightRadius: "0.5rem",
        }}
      >
        {code}
      </SyntaxHighlighter>
    </div>
  );

  return (
    <div>
      <h1 className="text-4xl font-bold text-gray-900 mb-6">
        Quick Start Guide
      </h1>
      <p className="text-xl text-gray-600 mb-8">
        Get started with the DraftnSign API in just a few steps. This guide will
        walk you through creating your first envelope and sending it for
        signature.
      </p>

      <div className="space-y-8">
        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            1. Get Your API Key
          </h2>
          <p className="text-gray-600 mb-4">
            First, you'll need to create an API key from your developer
            dashboard.
          </p>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
            <p className="text-yellow-800">
              <strong>Note:</strong> Keep your API key secure and never expose
              it in client-side code.
            </p>
          </div>
          <Link
            to="/api-keys"
            className="inline-flex items-center text-primary-600 hover:text-primary-700 font-medium"
          >
            Create API Key <ExternalLink className="ml-1 h-4 w-4" />
          </Link>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            2. Install SDK
          </h2>
          <p className="text-gray-600 mb-4">
            Install the DraftnSign SDK for your preferred programming language:
          </p>

          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Python</h3>
              <CodeBlock
                code="pip install draftn-sign"
                language="bash"
                id="install-python"
              />
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                JavaScript/Node.js
              </h3>
              <CodeBlock
                code="npm install @draftn/sign-js"
                language="bash"
                id="install-js"
              />
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            3. Create Your First Envelope
          </h2>
          <p className="text-gray-600 mb-4">
            Here's how to create and send an envelope for signature:
          </p>

          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Python Example
              </h3>
              <CodeBlock
                code={`import draftn_sign
import base64

# Initialize the client
client = draftn_sign.Client(api_key="your_api_key_here")

# Read and encode your document
with open("contract.pdf", "rb") as file:
    document_content = base64.b64encode(file.read()).decode()

# Create envelope
envelope = client.envelopes.create({
    "subject": "Please sign this contract",
    "message": "Please review and sign the attached contract.",
    "documents": [{
        "name": "contract.pdf",
        "content": document_content
    }],
    "recipients": [{
        "name": "John Doe",
        "email": "john@example.com",
        "role": "signer"
    }]
})

print(f"Envelope created with ID: {envelope.id}")
print(f"Status: {envelope.status}")`}
                language="python"
                id="python-example"
              />
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                JavaScript Example
              </h3>
              <CodeBlock
                code={`const DraftnSign = require('@draftn/sign-js');
const fs = require('fs');

// Initialize the client
const client = new DraftnSign({
    apiKey: 'your_api_key_here'
});

// Read and encode your document
const documentContent = fs.readFileSync('contract.pdf', { encoding: 'base64' });

// Create envelope
const envelope = await client.envelopes.create({
    subject: 'Please sign this contract',
    message: 'Please review and sign the attached contract.',
    documents: [{
        name: 'contract.pdf',
        content: documentContent
    }],
    recipients: [{
        name: 'John Doe',
        email: 'john@example.com',
        role: 'signer'
    }]
});

console.log(\`Envelope created with ID: \${envelope.id}\`);
console.log(\`Status: \${envelope.status}\`);`}
                language="javascript"
                id="js-example"
              />
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            4. Monitor Envelope Status
          </h2>
          <p className="text-gray-600 mb-4">
            You can check the status of your envelope at any time:
          </p>

          <CodeBlock
            code={`# Get envelope status
envelope = client.envelopes.get("envelope_id_here")
print(f"Current status: {envelope.status}")

# List all envelopes
envelopes = client.envelopes.list(limit=10)
for env in envelopes:
    print(f"{env.id}: {env.status}")`}
            language="python"
            id="status-example"
          />
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            Next Steps
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            <Link
              to="/docs/webhooks/overview"
              className="block p-4 bg-[#F7F3EE] border border-gray-200 rounded-lg hover:border-primary-300 transition-colors"
            >
              <h3 className="font-semibold text-gray-900 mb-2">
                Set up Webhooks
              </h3>
              <p className="text-gray-600 text-sm">
                Get real-time notifications when documents are signed.
              </p>
            </Link>

            <Link
              to="/docs/api/envelopes"
              className="block p-4 bg-[#F7F3EE] border border-gray-200 rounded-lg hover:border-primary-300 transition-colors"
            >
              <h3 className="font-semibold text-gray-900 mb-2">
                Explore API Reference
              </h3>
              <p className="text-gray-600 text-sm">
                Learn about all available endpoints and parameters.
              </p>
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Main;

const AuthenticationDocs: React.FC = () => (
  <div>
    <h1 className="text-4xl font-bold text-gray-900 mb-6">Authentication</h1>
    <p className="text-xl text-gray-600 mb-8">
      Learn how to authenticate your requests to the DraftnSign API using API
      keys and OAuth 2.0.
    </p>
    {/* Add authentication documentation content */}
  </div>
);

const UsersAPIDocs: React.FC = () => (
  <div>
    <h1 className="text-4xl font-bold text-gray-900 mb-6">Users API</h1>
    <p className="text-xl text-gray-600 mb-8">
      Manage users in your DraftnSign organization with the Users API.
    </p>
    {/* Add users API documentation content */}
  </div>
);

const EnvelopesAPIDocs: React.FC = () => (
  <div>
    <h1 className="text-4xl font-bold text-gray-900 mb-6">Envelopes API</h1>
    <p className="text-xl text-gray-600 mb-8">
      Create, manage, and track document envelopes for signature workflows.
    </p>
    {/* Add envelopes API documentation content */}
  </div>
);

const WebhooksOverviewDocs: React.FC = () => (
  <div>
    <h1 className="text-4xl font-bold text-gray-900 mb-6">Webhooks Overview</h1>
    <p className="text-xl text-gray-600 mb-8">
      Receive real-time notifications about document events using webhooks.
    </p>
    {/* Add webhooks documentation content */}
  </div>
);

const PythonSDKDocs: React.FC = () => (
  <div>
    <h1 className="text-4xl font-bold text-gray-900 mb-6">Python SDK</h1>
    <p className="text-xl text-gray-600 mb-8">
      Official Python SDK for the DraftnSign API with full feature support.
    </p>
    {/* Add Python SDK documentation content */}
  </div>
);

const JavaScriptSDKDocs: React.FC = () => (
  <div>
    <h1 className="text-4xl font-bold text-gray-900 mb-6">JavaScript SDK</h1>
    <p className="text-xl text-gray-600 mb-8">
      Official JavaScript/Node.js SDK for the DraftnSign API.
    </p>
    {/* Add JavaScript SDK documentation content */}
  </div>
);
