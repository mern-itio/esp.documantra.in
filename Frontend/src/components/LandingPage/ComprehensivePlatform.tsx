import { FileText, Edit, Users, Send, Shield, Zap, CheckCircle, ArrowRight, Upload, Eye, Building } from 'lucide-react'
import { Link } from 'react-router-dom'

const ComprehensivePlatform = () => {
  const platformFeatures = [
    {
      icon: Upload,
      title: "Document Preparation",
      description: "Upload any document format or create from scratch with our intelligent templates",
      features: ["Multi-format support", "Smart templates", "Bulk upload", "Auto-formatting"],
      color: "bg-blue-500"
    },
    {
      icon: Zap,
      title: "AI-Powered Generation",
      description: "Generate legal documents instantly using natural language prompts",
      features: ["Natural language input", "Legal compliance", "Custom fields", "Instant generation"],
      color: "bg-purple-500"
    },
    {
      icon: Edit,
      title: "Advanced Editing Suite",
      description: "Professional editing tools with real-time collaboration and version control",
      features: ["Real-time editing", "Version history", "Collaborative review", "Track changes"],
      color: "bg-green-500"
    },
    {
      icon: Eye,
      title: "Document Comparison",
      description: "Compare documents side-by-side with intelligent difference detection",
      features: ["Side-by-side view", "Change highlighting", "Merge conflicts", "Export reports"],
      color: "bg-orange-500"
    },
    {
      icon: Users,
      title: "E-Signature Workflows",
      description: "Secure electronic signatures with custom signing orders and notifications",
      features: ["Multi-signer support", "Custom workflows", "Auto-reminders", "Legal compliance"],
      color: "bg-indigo-500"
    },
    {
      icon: Send,
      title: "Smart Distribution",
      description: "Send documents with tracking, notifications, and automated follow-ups",
      features: ["Delivery tracking", "Read receipts", "Auto-reminders", "Bulk sending"],
      color: "bg-pink-500"
    }
  ]

  const workflowSteps = [
    {
      step: "01",
      title: "Prepare & Generate",
      description: "Upload documents or generate new ones using AI-powered templates",
      icon: FileText
    },
    {
      step: "02",
      title: "Edit & Customize",
      description: "Use advanced editing tools to customize and perfect your documents",
      icon: Edit
    },
    {
      step: "03",
      title: "Compare & Review",
      description: "Compare versions and collaborate with team members for review",
      icon: Eye
    },
    {
      step: "04",
      title: "Sign & Send",
      description: "Collect signatures and distribute final documents securely",
      icon: Send
    }
  ]

  const benefits = [
    {
      icon: CheckCircle,
      title: "All-in-One Solution",
      description: "Everything you need in one platform - no more switching between tools"
    },
    {
      icon: Shield,
      title: "Enterprise Security",
      description: "Bank-level encryption and compliance with global regulations"
    },
    {
      icon: Zap,
      title: "10x Faster Processing",
      description: "Automated workflows reduce document processing time dramatically"
    },
    {
      icon: Building,
      title: "Team Organization",
      description: "Create organizations, invite team members, and share documents with role-based permissions"
    }
  ]

  return (
    <section className="section-padding bg-gradient-to-br from-gray-50 to-white">
      <div className="container-max">
        {/* Modern overview of the platform */}
        <div className="mb-16 rounded-3xl bg-gradient-to-r from-[#260559]/90 via-[#4b0ea0]/90 to-[#7b2fff]/90 text-white overflow-hidden">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] items-stretch px-6 py-8 md:px-10 md:py-12">
            {/* Copy + compact feature list */}
            <div className="flex flex-col justify-between gap-8">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium backdrop-blur">
                  <span className="inline-flex h-2 w-2 rounded-full bg-emerald-300" />
                  All-in-one e‑sign workspace
                </div>
                <h2 className="mt-4 text-3xl md:text-4xl font-semibold leading-tight tracking-tight">
                  One connected platform
                  <span className="block text-indigo-100/90">
                    for every document stage
                  </span>
                </h2>
                <p className="mt-4 text-sm md:text-base text-indigo-100/80 max-w-xl">
                  Draft &amp; Sign replaces scattered tools with a single, orchestrated
                  platform—from document preparation and AI generation to comparison,
                  signing, and final delivery.
                </p>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                {platformFeatures.slice(0, 4).map((feature, index) => (
                  <div
                    key={index}
                    className="group rounded-xl bg-white/8 p-4 border border-white/10 hover:border-emerald-300/70 transition-colors cursor-pointer"
                  >
                    <div className="mb-3 inline-flex items-center gap-2 text-[11px] font-medium uppercase tracking-wide text-emerald-200">
                      <feature.icon className="h-3.5 w-3.5 text-emerald-200" />
                      {feature.title}
                    </div>
                    <p className="text-xs md:text-sm text-indigo-50/90 line-clamp-3">
                      {feature.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: vertical "pill" list for the rest */}
            <div className="relative">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.16),transparent_60%)] pointer-events-none" />
              <div className="relative h-full rounded-2xl bg-black/15 p-4 md:p-5 border border-white/10 backdrop-blur-sm">
                <p className="text-xs font-medium uppercase tracking-[0.22em] text-indigo-100/70 mb-3">
                  PLATFORM CAPABILITIES
                </p>
                <div className="space-y-3">
                  {platformFeatures.map((feature, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-3 rounded-xl bg-white/5 px-3 py-2.5 hover:bg-white/10 transition-colors cursor-pointer"
                    >
                      <div className="mt-0.5 flex h-7 w-7 items-center justify-center rounded-full bg-white/15 text-[11px] font-semibold">
                        {String(index + 1).padStart(2, '0')}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs md:text-sm font-semibold text-white">
                            {feature.title}
                          </span>
                          <span className="hidden md:inline text-[10px] text-indigo-100/70">
                            {feature.features[0]}
                          </span>
                        </div>
                        <p className="mt-1 text-[11px] text-indigo-100/80 line-clamp-2">
                          {feature.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Lifecycle + Workflow Video — with curved bg (reference: abstract shapes behind content) */}
        <div className="relative mb-16">
          {/* Background: two curves (left outline, right blob) */}
          <div
            className="pointer-events-none absolute -left-[15%] -top-[8%] h-[min(90vw,460px)] w-[min(90vw,460px)] bg-contain bg-no-repeat opacity-90"
            style={{ backgroundImage: 'url(/left-curve.svg)' }}
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -right-[8%] -bottom-[20%] h-[min(90vw,420px)] w-[min(90vw,420px)] bg-contain bg-no-repeat opacity-90"
            style={{ backgroundImage: 'url(/right-curve.png)' }}
            aria-hidden
          />

          <div className="relative overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-lg">
          <div className="grid gap-0 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
            {/* Left: visual workflow */}
            <div className="relative bg-slate-950">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.3),transparent_60%)] pointer-events-none" />

              <div className="relative aspect-video lg:aspect-[5/4] overflow-hidden">
                <video
                  className="h-full w-full object-cover"
                  src="/videos/workflow.mp4"
                  autoPlay
                  loop
                  muted
                  playsInline
                />

                {/* Overlay label */}
                <div className="absolute left-4 top-4 inline-flex items-center gap-2 rounded-full bg-black/60 px-3 py-1 text-[11px] font-medium text-slate-100 backdrop-blur">
                  <span className="inline-flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  Real‑time workflow walkthrough
                </div>

                {/* Bottom meta */}
                <div className="absolute inset-x-0 bottom-0 p-4">
                  <div className="rounded-xl bg-black/55 px-4 py-3 backdrop-blur flex items-center justify-between gap-4">
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.22em] text-slate-300/80">
                        Lifecycle in motion
                      </p>
                      <p className="text-xs md:text-sm font-medium text-slate-50">
                        See how a contract moves from draft to signed in a single, connected flow.
                      </p>
                    </div>
                    <div className="hidden sm:flex flex-col items-end text-[11px] text-slate-200">
                      <span>~60 seconds</span>
                      <span className="text-slate-400">from upload to signature</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: lifecycle steps */}
            <div className="px-6 py-8 md:px-8 lg:px-10 lg:py-10">
              <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700 mb-4">
                <span className="inline-flex h-2 w-2 rounded-full bg-indigo-500" />
                Document lifecycle, end‑to‑end
              </div>

              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                From first draft to final signature
              </h3>
              <p className="text-sm md:text-base text-gray-600 mb-6 max-w-md">
                Every stage of your e‑signature journey is connected in one orchestrated flow,
                so nothing falls through the cracks.
              </p>

              <ol className="relative mt-4 space-y-5 before:absolute before:left-4 before:top-0 before:h-full before:w-px before:bg-gradient-to-b before:from-indigo-200 before:via-indigo-100 before:to-transparent">
                {workflowSteps.map((step, index) => (
                  <li key={index} className="relative flex gap-4 pl-8">
                    {/* Step node */}
                    <div className="absolute left-0 top-1 flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-indigo-100">
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 text-[11px] font-semibold text-white">
                        {step.step}
                      </div>
                    </div>

                    {/* Icon + content */}
                    <div className="flex-1">
                      <div className="mb-1 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-indigo-700">
                        <step.icon className="h-3.5 w-3.5 text-indigo-500" />
                        {step.title}
                      </div>
                      <p className="text-xs md:text-sm text-gray-600">
                        {step.description}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>

              <p className="mt-6 text-xs md:text-sm text-gray-500">
                Every lifecycle event is logged with a full audit trail and can be automated with
                reminders, approvals, and role‑based access.
              </p>
            </div>
          </div>
          </div>
        </div>

        {/* Benefits Section */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {benefits.map((benefit, index) => (
            <div key={index} className=" cursor-pointer border border-transparent hover:border-blue-500 text-center p-6 bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: 'rgba(38, 5, 89, 0.1)' }}>
                <benefit.icon className="h-6 w-6 text-[#260559]" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">{benefit.title}</h4>
              <p className="text-gray-600 text-sm">{benefit.description}</p>
            </div>
          ))}
        </div>

        {/* Team Sharing Feature Highlight */}
      <div className="p-8 mb-12 text-white rounded-sm bg-gradient-to-r from-[#260559] via-[#4b0ea0] to-[#7b2fff]">

          <div className="grid lg:grid-cols-2 gap-8 items-center">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <Building className="h-8 w-8 text-indigo-200" />
                <span className="text-indigo-200 font-medium">Paid Plans Feature</span>
              </div>
              <h3 className="text-2xl font-bold mb-4">
                Team Organization & Document Sharing
              </h3>
              <p className="text-indigo-100 mb-6 leading-relaxed">
                Create your organization and invite team members with customizable role-based permissions.
                Share documents seamlessly across your team while maintaining complete control over access rights and collaboration levels.
              </p>
              <ul className="space-y-3 mb-6">
                <li className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-indigo-200" />
                  <span className="text-indigo-100">Create unlimited organizations</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-indigo-200" />
                  <span className="text-indigo-100">Invite unlimited team members</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-indigo-200" />
                  <span className="text-indigo-100">Role-based access control</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-indigo-200" />
                  <span className="text-indigo-100">Shared document libraries</span>
                </li>
              </ul>
            </div>

            {/* Mock Organization Interface */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
              <div className="bg-white rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-gray-200">
                  <h4 className="font-semibold text-gray-900">Acme Corp Organization</h4>
                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">Active</span>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold">JD</div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900">John Doe</div>
                      <div className="text-xs text-gray-500">Admin • Full Access</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white text-sm font-bold">SM</div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900">Sarah Miller</div>
                      <div className="text-xs text-gray-500">Editor • Can Edit & Sign</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                    <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-white text-sm font-bold">MJ</div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900">Mike Johnson</div>
                      <div className="text-xs text-gray-500">Viewer • Read Only</div>
                    </div>
                  </div>
                </div>
                <Link to="/login">
                  <button className="w-full text-white py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors" style={{ backgroundColor: '#260559' }}>
                    + Invite Team Member
                  </button>

                </Link>

              </div>
            </div>
          </div>
        </div>

        {/* Free Plan Highlight */}
     <div className="p-8 mb-12 text-white rounded-sm bg-gradient-to-r from-[#260559] via-[#4b0ea0] to-[#7b2fff]">

          <div className="max-w-3xl mx-auto">
            <h3 className="text-2xl font-bold mb-4">
              Start with Our Free Forever Plan
            </h3>
            <p className="text-primary-100 mb-6 text-lg">
              Get full access to all platform features with generous usage limits.
              Perfect for individuals and small teams to experience the complete DocuSigner ecosystem.
            </p>

            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white/10 rounded-lg p-4">
                <div className="text-2xl font-bold mb-1">10</div>
                <div className="text-primary-100 text-sm">Envelopes/month</div>
              </div>
              <div className="bg-white/10 rounded-lg p-4">
                <div className="text-2xl font-bold mb-1">30+</div>
                <div className="text-primary-100 text-sm">Free PDF tools</div>
              </div>
              <div className="bg-white/10 rounded-lg p-4">
                <div className="text-2xl font-bold mb-1">10</div>
                <div className="text-primary-100 text-sm">Legal templates/month</div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {/* Primary Filled (White with Icon) */}
              <Link to="/signup">
               <button className="flex items-center justify-center gap-2 bg-white text-[#260559] hover:bg-gray-100 font-semibold text-base px-6 py-3 rounded-md shadow-md transition-all duration-200">
                Start Free Forever
                <ArrowRight className="h-4 w-4 align-middle" />
              </button>
              </Link>
             

                <Link to="/login">
              <button className="flex items-center justify-center gap-2 border-2 border-white text-white hover:bg-white hover:text-blue-600 font-semibold text-base px-6 py-3 rounded-md transition-all duration-200">
                View All Features
              </button>
              </Link>
            </div>

          </div>
        </div>
      </div>
    </section>
  )
}

export default ComprehensivePlatform