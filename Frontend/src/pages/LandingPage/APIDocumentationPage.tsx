import { useCallback, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Check,
  Code,
  Copy,
  ExternalLink,
  Key,
  Layers,
  Lock,
  Play,
  Send,
  Terminal,
} from 'lucide-react';
import { BRAND } from '../../config/brand';
import { useBrandSettings } from '../../hooks/useBrandSettings';
import {
  DOCUMANTRA_API_AUTH,
  DOCUMANTRA_SIGN_API_PREFIX,
  DOCUMANTRA_SIGN_ENDPOINTS,
  INTEGRATION_STEPS,
  buildCurlExample,
  buildFetchExample,
  getDocuMantraApiBaseUrl,
  type DocuMantraApiEndpoint,
} from '../../data/documantraSignApi';

type NavSection = 'overview' | 'auth' | 'workflow' | 'endpoints' | 'examples' | 'errors';

const METHOD_COLORS: Record<string, string> = {
  GET: 'bg-emerald-100 text-emerald-800',
  POST: 'bg-blue-100 text-blue-800',
  PUT: 'bg-amber-100 text-amber-800',
};

function CodeBlock({
  code,
  label,
  onCopy,
  copied,
}: {
  code: string;
  label?: string;
  onCopy: (text: string) => void;
  copied: boolean;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-800 bg-gray-900">
      <div className="flex items-center justify-between border-b border-gray-800 px-4 py-2">
        <span className="text-xs text-gray-400">{label || 'Example'}</span>
        <button
          type="button"
          onClick={() => onCopy(code)}
          className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-200"
        >
          {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
          Copy
        </button>
      </div>
      <pre className="overflow-x-auto p-4 text-sm leading-relaxed text-gray-100">
        <code>{code}</code>
      </pre>
    </div>
  );
}

function EndpointCard({
  endpoint,
  onCopy,
  copiedKey,
}: {
  endpoint: DocuMantraApiEndpoint;
  onCopy: (text: string, key: string) => void;
  copiedKey: string | null;
}) {
  const pathOnly = endpoint.endpoint.replace(DOCUMANTRA_SIGN_API_PREFIX, '');
  const curl = buildCurlExample(endpoint);

  return (
    <article id={endpoint.slug} className="scroll-mt-28 overflow-hidden rounded-2xl border border-[#E8E0D4] bg-[#F7F3EE] shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E8E0D4] bg-[#F5F2EE] px-5 py-4">
        <div className="flex flex-wrap items-center gap-3">
          <span className={`rounded-lg px-2.5 py-1 text-xs font-bold ${METHOD_COLORS[endpoint.method] || 'bg-gray-100 text-gray-700'}`}>
            {endpoint.method}
          </span>
          <code className="font-mono text-sm text-[#260559]">{pathOnly}</code>
          <span className="rounded-full bg-[#155E4B]/10 px-2 py-0.5 text-xs font-medium text-[#155E4B]">
            Step {endpoint.step}
          </span>
        </div>
        <h3 className="text-sm font-semibold text-gray-800">{endpoint.name}</h3>
      </div>

      <div className="space-y-4 p-5">
        <p className="text-sm text-gray-600">{endpoint.description}</p>

        {endpoint.pathParams?.length ? (
          <p className="text-sm text-gray-600">
            <span className="font-medium text-gray-800">Path params: </span>
            {endpoint.pathParams.map((p) => (
              <code key={p} className="mx-1 rounded bg-white px-1.5 py-0.5 text-xs text-[#260559]">
                :{p}
              </code>
            ))}
          </p>
        ) : null}

        {endpoint.contentType && (
          <p className="text-sm text-gray-600">
            <span className="font-medium text-gray-800">Content-Type: </span>
            <code className="text-xs">{endpoint.contentType === 'multipart' ? 'multipart/form-data' : 'application/json'}</code>
          </p>
        )}

        {endpoint.responseHint && (
          <p className="text-sm text-gray-600">
            <span className="font-medium text-gray-800">Typical response: </span>
            <code className="text-xs">{endpoint.responseHint}</code>
          </p>
        )}

        {endpoint.bodyTemplate ? (
          <CodeBlock
            code={endpoint.bodyTemplate}
            label="Request body"
            onCopy={(t) => onCopy(t, `${endpoint.slug}-body`)}
            copied={copiedKey === `${endpoint.slug}-body`}
          />
        ) : null}

        <CodeBlock
          code={curl}
          label="cURL"
          onCopy={(t) => onCopy(t, `${endpoint.slug}-curl`)}
          copied={copiedKey === `${endpoint.slug}-curl`}
        />
      </div>
    </article>
  );
}

const APIDocumentationPage = () => {
  const { supportEmail } = useBrandSettings();
  const [activeSection, setActiveSection] = useState<NavSection>('overview');
  const [selectedExample, setSelectedExample] = useState(DOCUMANTRA_SIGN_ENDPOINTS[0].slug);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const baseUrl = useMemo(() => getDocuMantraApiBaseUrl(), []);
  const exampleEndpoint = useMemo(
    () => DOCUMANTRA_SIGN_ENDPOINTS.find((e) => e.slug === selectedExample) ?? DOCUMANTRA_SIGN_ENDPOINTS[0],
    [selectedExample],
  );

  const copyToClipboard = useCallback((text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  }, []);

  const navItems: { id: NavSection; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'auth', label: 'Authentication' },
    { id: 'workflow', label: 'Envelope workflow' },
    { id: 'endpoints', label: 'API reference' },
    { id: 'examples', label: 'Code examples' },
    { id: 'errors', label: 'Errors & tips' },
  ];

  const fullWorkflowExample = useMemo(() => {
    return `// Recommended server-side flow for your custom UI
// 1. User logs into DocuMantra (session cookie on your backend)
// 2. Your server calls Sign API with cookie + sandbox key

const headers = {
  '${DOCUMANTRA_API_AUTH.sandboxHeader}': process.env.DOCUMANTRA_SANDBOX_KEY,
  Cookie: req.headers.cookie, // forward session from authenticated user
};

// Step 1 — upload PDF
const form = new FormData();
form.append('files', pdfBuffer, 'contract.pdf');
const upload = await fetch('${baseUrl}/upload-envelope', { method: 'POST', headers, body: form });
const { envelopeId, documents } = await upload.json();

// Step 2 — add recipients → Step 3 — fields → Step 4 — update → Step 5 — send
// Step 6 — poll GET /envelope/:envelopeId from your UI status screen`;
  }, [baseUrl]);

  return (
    <div className="min-h-screen bg-[#F5F2EE] pt-24 pb-16">
      <div className="container-max">
        {/* Hero */}
        <div className="mb-8 overflow-hidden rounded-2xl bg-gradient-to-br from-[#260559] to-[#155E4B] p-8 text-white shadow-lg">
          <div className="max-w-3xl">
            <p className="mb-2 text-sm font-medium uppercase tracking-wider text-white/70">Developer docs</p>
            <h1 className="mb-4 text-3xl font-bold md:text-4xl">{BRAND.name} Sign API</h1>
            <p className="mb-6 text-lg text-white/90">
              Build your own UI on top of {BRAND.name}. These endpoints match the live backend — use them to upload
              documents, add signers, place fields, send envelopes, and track status from any app.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                to={DOCUMANTRA_API_AUTH.explorerRoute}
                className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-[#260559] shadow hover:bg-white/95"
              >
                <Play className="h-4 w-4" />
                Open API Explorer
              </Link>
              <Link
                to={DOCUMANTRA_API_AUTH.keyRoute}
                className="inline-flex items-center gap-2 rounded-xl border border-white/30 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white hover:bg-white/15"
              >
                <Key className="h-4 w-4" />
                Manage API keys
              </Link>
              <Link
                to={DOCUMANTRA_API_AUTH.signupRoute}
                className="inline-flex items-center gap-2 rounded-xl border border-white/30 px-5 py-2.5 text-sm font-semibold text-white hover:bg-white/10"
              >
                Create account
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-8">
          {/* Sidebar */}
          <aside className="col-span-12 md:col-span-3">
            <div className="sticky top-24 rounded-2xl border border-[#E8E0D4] bg-[#F7F3EE] p-4 shadow-sm">
              <nav className="space-y-1">
                {navItems.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveSection(item.id)}
                    className={`w-full rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors ${
                      activeSection === item.id
                        ? 'bg-[#260559]/10 text-[#260559]'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </nav>

              <div className="mt-6 border-t border-[#E8E0D4] pt-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Endpoints</p>
                <div className="max-h-64 space-y-1 overflow-y-auto">
                  {DOCUMANTRA_SIGN_ENDPOINTS.map((ep) => (
                    <a
                      key={ep.slug}
                      href={`#${ep.slug}`}
                      onClick={() => setActiveSection('endpoints')}
                      className="block truncate rounded px-2 py-1.5 font-mono text-xs text-gray-600 hover:bg-gray-100 hover:text-[#260559]"
                    >
                      {ep.method} {ep.endpoint.replace(DOCUMANTRA_SIGN_API_PREFIX, '')}
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </aside>

          {/* Main */}
          <main className="col-span-12 space-y-8 md:col-span-9">
            {(activeSection === 'overview' || activeSection === 'auth' || activeSection === 'workflow') && (
              <>
                {activeSection === 'overview' && (
                  <section className="rounded-2xl border border-[#E8E0D4] bg-[#F7F3EE] p-6 shadow-sm md:p-8">
                    <h2 className="mb-4 text-2xl font-bold text-gray-900">Integrate with your UI</h2>
                    <p className="mb-6 text-gray-600">
                      {BRAND.name} exposes a REST Sign API under a single prefix. Your frontend (React, mobile, or
                      server-rendered app) calls your backend; your backend forwards requests with the user session and
                      sandbox key. No proprietary SDK is required — standard HTTP, JSON, and multipart uploads.
                    </p>

                    <div className="mb-6">
                      <h3 className="mb-2 text-lg font-semibold text-gray-900">Base URL</h3>
                      <div className="flex items-center justify-between gap-3 rounded-xl bg-[#F5F2EE] px-4 py-3">
                        <code className="break-all font-mono text-sm text-[#260559]">{baseUrl}</code>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(baseUrl, 'base-url')}
                          className="shrink-0 text-gray-500 hover:text-gray-700"
                        >
                          {copiedKey === 'base-url' ? (
                            <Check className="h-5 w-5 text-emerald-500" />
                          ) : (
                            <Copy className="h-5 w-5" />
                          )}
                        </button>
                      </div>
                      <p className="mt-2 text-sm text-gray-500">
                        Production: <code>{BRAND.website}{DOCUMANTRA_SIGN_API_PREFIX}</code> · Local dev uses your Vite
                        origin with proxy to port 2105.
                      </p>
                    </div>

                    <div className="grid gap-4 md:grid-cols-3">
                      <div className="rounded-xl border border-[#E8E0D4] bg-white p-4">
                        <Code className="mb-2 h-5 w-5 text-[#155E4B]" />
                        <h4 className="font-semibold text-gray-900">REST + JSON</h4>
                        <p className="mt-1 text-sm text-gray-600">Nine sign endpoints, ordered workflow</p>
                      </div>
                      <div className="rounded-xl border border-[#E8E0D4] bg-white p-4">
                        <Lock className="mb-2 h-5 w-5 text-[#155E4B]" />
                        <h4 className="font-semibold text-gray-900">Session + API key</h4>
                        <p className="mt-1 text-sm text-gray-600">Dual auth on every sign route</p>
                      </div>
                      <div className="rounded-xl border border-[#E8E0D4] bg-white p-4">
                        <Layers className="mb-2 h-5 w-5 text-[#155E4B]" />
                        <h4 className="font-semibold text-gray-900">Your UI</h4>
                        <p className="mt-1 text-sm text-gray-600">Map each step to your screens and webhooks</p>
                      </div>
                    </div>
                  </section>
                )}

                {(activeSection === 'overview' || activeSection === 'auth') && (
                  <section className="rounded-2xl border border-[#E8E0D4] bg-[#F7F3EE] p-6 shadow-sm md:p-8">
                    <h2 className="mb-4 text-2xl font-bold text-gray-900">Authentication</h2>
                    <p className="mb-4 text-gray-600">{DOCUMANTRA_API_AUTH.sessionNote}</p>

                    <div className="mb-6 overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-[#F5F2EE] text-left text-xs uppercase text-gray-500">
                            <th className="px-4 py-2">Requirement</th>
                            <th className="px-4 py-2">How</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#E8E0D4]">
                          <tr>
                            <td className="px-4 py-3 font-medium">Session (JWT cookie)</td>
                            <td className="px-4 py-3 text-gray-600">
                              Log in via{' '}
                              <Link to={DOCUMANTRA_API_AUTH.loginRoute} className="text-[#155E4B] hover:underline">
                                dashboard login
                              </Link>
                              . Browser calls use <code className="text-xs">credentials: &apos;include&apos;</code>.
                              Server integrations must forward the session cookie.
                            </td>
                          </tr>
                          <tr>
                            <td className="px-4 py-3 font-medium">{DOCUMANTRA_API_AUTH.sandboxHeader}</td>
                            <td className="px-4 py-3 text-gray-600">
                              Create a sandbox key at{' '}
                              <Link to={DOCUMANTRA_API_AUTH.keyRoute} className="text-[#155E4B] hover:underline">
                                {DOCUMANTRA_API_AUTH.keyRoute}
                              </Link>
                              . Send on every <code className="text-xs">/sign/*</code> request.
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    <CodeBlock
                      code={`// Headers required on every Sign API call
{
  "${DOCUMANTRA_API_AUTH.sandboxHeader}": "dm_sandbox_xxxxxxxx",
  "Cookie": "accessToken=...; refreshToken=..."  // from logged-in DocuMantra user
}

// Browser (same origin, user already logged in)
fetch('${baseUrl}/upload-envelope', {
  method: 'POST',
  credentials: 'include',
  headers: { '${DOCUMANTRA_API_AUTH.sandboxHeader}': 'YOUR_SANDBOX_KEY' },
  body: formData,
});`}
                      label="Auth headers"
                      onCopy={(t) => copyToClipboard(t, 'auth-example')}
                      copied={copiedKey === 'auth-example'}
                    />

                    <p className="mt-4 text-sm text-gray-500">
                      Key management API (requires login):{' '}
                      <code>GET /api/api-service/keys</code>, <code>POST /api/api-service/generate</code>
                    </p>
                  </section>
                )}

                {(activeSection === 'overview' || activeSection === 'workflow') && (
                  <section className="rounded-2xl border border-[#E8E0D4] bg-[#F7F3EE] p-6 shadow-sm md:p-8">
                    <h2 className="mb-4 text-2xl font-bold text-gray-900">Envelope workflow</h2>
                    <p className="mb-6 text-gray-600">
                      Wire these steps into your product UI — e.g. upload screen → recipient form → field placement →
                      review → send → status dashboard.
                    </p>

                    <ol className="space-y-4">
                      {INTEGRATION_STEPS.map((step, i) => (
                        <li key={step.title} className="flex gap-4">
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#260559] text-sm font-bold text-white">
                            {i + 1}
                          </span>
                          <div>
                            <h4 className="font-semibold text-gray-900">{step.title}</h4>
                            <p className="text-sm text-gray-600">{step.detail}</p>
                          </div>
                        </li>
                      ))}
                    </ol>

                    <div className="mt-8 rounded-xl border border-[#155E4B]/20 bg-[#155E4B]/5 p-4">
                      <div className="mb-2 flex items-center gap-2 font-semibold text-[#155E4B]">
                        <Send className="h-4 w-4" />
                        API call sequence
                      </div>
                      <ol className="list-inside list-decimal space-y-1 font-mono text-xs text-gray-700 md:text-sm">
                        {DOCUMANTRA_SIGN_ENDPOINTS.filter((e) => e.step <= 6).map((e) => (
                          <li key={e.slug}>
                            {e.method} {e.endpoint.replace(DOCUMANTRA_SIGN_API_PREFIX, '')} — {e.name}
                          </li>
                        ))}
                      </ol>
                      <p className="mt-3 text-sm text-gray-600">
                        Optional: <code>GET /signature/:documentId</code>, <code>POST /add-signature</code>,{' '}
                        <code>POST /initiate-recipient-auth</code> for embedded signing and OTP flows.
                      </p>
                    </div>

                    <div className="mt-6">
                      <CodeBlock
                        code={fullWorkflowExample}
                        label="Custom UI integration pattern"
                        onCopy={(t) => copyToClipboard(t, 'workflow')}
                        copied={copiedKey === 'workflow'}
                      />
                    </div>
                  </section>
                )}
              </>
            )}

            {(activeSection === 'endpoints' || activeSection === 'overview') && (
              <section>
                <h2 className="mb-4 text-2xl font-bold text-gray-900">API reference</h2>
                <p className="mb-6 text-gray-600">
                  All routes are prefixed with <code>{DOCUMANTRA_SIGN_API_PREFIX}</code>. Paths below are relative to
                  that prefix.
                </p>
                <div className="space-y-6">
                  {DOCUMANTRA_SIGN_ENDPOINTS.map((endpoint) => (
                    <EndpointCard
                      key={endpoint.slug}
                      endpoint={endpoint}
                      onCopy={copyToClipboard}
                      copiedKey={copiedKey}
                    />
                  ))}
                </div>
              </section>
            )}

            {activeSection === 'examples' && (
              <section className="rounded-2xl border border-[#E8E0D4] bg-[#F7F3EE] p-6 shadow-sm md:p-8">
                <h2 className="mb-4 text-2xl font-bold text-gray-900">Code examples</h2>
                <p className="mb-6 text-gray-600">
                  Select an endpoint to view a fetch snippet you can paste into your app. Test live responses in the{' '}
                  <Link to={DOCUMANTRA_API_AUTH.explorerRoute} className="text-[#155E4B] hover:underline">
                    API Explorer
                  </Link>
                  .
                </p>

                <div className="mb-4 flex flex-wrap gap-2">
                  {DOCUMANTRA_SIGN_ENDPOINTS.map((ep) => (
                    <button
                      key={ep.slug}
                      type="button"
                      onClick={() => setSelectedExample(ep.slug)}
                      className={`rounded-lg px-3 py-1.5 text-xs font-medium ${
                        selectedExample === ep.slug
                          ? 'bg-[#260559] text-white'
                          : 'bg-white text-gray-700 ring-1 ring-[#E8E0D4] hover:bg-gray-50'
                      }`}
                    >
                      {ep.name}
                    </button>
                  ))}
                </div>

                <CodeBlock
                  code={buildFetchExample(exampleEndpoint)}
                  label={`fetch — ${exampleEndpoint.name}`}
                  onCopy={(t) => copyToClipboard(t, 'fetch-example')}
                  copied={copiedKey === 'fetch-example'}
                />

                <div className="mt-8 rounded-xl bg-[#F5F2EE] p-6 text-center">
                  <Terminal className="mx-auto mb-3 h-10 w-10 text-[#155E4B]" />
                  <h3 className="mb-2 text-lg font-semibold text-gray-900">Try requests in the browser</h3>
                  <p className="mb-4 text-sm text-gray-600">
                    Log in, add your sandbox key, and run real calls against the same endpoints documented here.
                  </p>
                  <Link
                    to={DOCUMANTRA_API_AUTH.explorerRoute}
                    className="inline-flex items-center gap-2 rounded-xl bg-[#260559] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#260559]/90"
                  >
                    Launch API Explorer
                    <ExternalLink className="h-4 w-4" />
                  </Link>
                </div>
              </section>
            )}

            {activeSection === 'errors' && (
              <section className="rounded-2xl border border-[#E8E0D4] bg-[#F7F3EE] p-6 shadow-sm md:p-8">
                <h2 className="mb-4 text-2xl font-bold text-gray-900">Errors & integration tips</h2>
                <ul className="list-disc space-y-2 pl-5 text-gray-600">
                  <li>
                    <strong>401 Missing X-Sandbox-Api-Key</strong> — Add the header from{' '}
                    <Link to={DOCUMANTRA_API_AUTH.keyRoute} className="text-[#155E4B] hover:underline">
                      API keys
                    </Link>
                    .
                  </li>
                  <li>
                    <strong>403 Invalid sandbox key</strong> — Regenerate key; ensure mode is sandbox and key is active.
                  </li>
                  <li>
                    <strong>401 Unauthorized (JWT)</strong> — User session expired; re-login or refresh tokens.
                  </li>
                  <li>
                    Use <code>GET /envelope/:envelopeId</code> to poll status from your UI instead of blocking on send.
                  </li>
                  <li>
                    For embedded signing, combine <code>GET /signature/:documentId</code> with{' '}
                    <code>POST /add-signature</code>.
                  </li>
                  <li>Never expose sandbox keys in public frontend code — proxy through your backend.</li>
                </ul>
              </section>
            )}
          </main>
        </div>

        {/* CTA */}
        <div className="mt-12 rounded-2xl bg-gradient-to-br from-[#260559] to-[#155E4B] p-8 text-white shadow-lg">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl font-bold">Ready to build?</h2>
              <p className="mt-2 text-white/90">
                Create an account, generate a sandbox key, and connect your UI to {BRAND.name} in minutes.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                to={DOCUMANTRA_API_AUTH.signupRoute}
                className="rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-[#260559] hover:bg-white/95"
              >
                Get started
              </Link>
              <a
                href={`mailto:${supportEmail}`}
                className="rounded-xl border border-white/30 px-5 py-2.5 text-sm font-semibold text-white hover:bg-white/10"
              >
                Contact support
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default APIDocumentationPage;
