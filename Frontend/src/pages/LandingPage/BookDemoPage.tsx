
import { CalendarClock, Building2, Users, Mail, Phone, CheckCircle2 } from 'lucide-react'
import { APP_NAME } from '../../components/constants/appConfig'

const BookDemoPage = () => {
  return (
    <div className="min-h-screen bg-[#F7F3EE] pt-24">
      {/* Hero / Intro */}
      <section className="py-16 bg-gradient-to-br from-primary-50 via-white to-sky-50 relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-32 -right-24 h-72 w-72 rounded-full bg-[#260559]/10 blur-3xl" />
          <div className="absolute -bottom-24 -left-10 h-80 w-80 rounded-full bg-sky-300/20 blur-3xl" />
        </div>

        <div className="container-max relative px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-sky-100 bg-[#F7F3EE]/80 px-3 py-1 text-xs font-medium text-slate-700 shadow-sm backdrop-blur">
              <CalendarClock className="h-3.5 w-3.5 text-[#084bdc]" />
              Live, personalised walkthrough in 30 minutes
            </span>
            <h1 className="mt-4 text-4xl md:text-5xl font-bold text-gray-900 tracking-tight">
              Book a live demo of{' '}
              <span className="bg-gradient-to-r from-[#260559] via-sky-600 to-emerald-500 bg-clip-text text-transparent">
                {APP_NAME}
              </span>
            </h1>
            <p className="mt-4 text-lg text-gray-600">
              See how teams like yours create, approve, and sign documents in minutes – not days. No slide decks, just
              your workflows, live in product.
            </p>
          </div>
        </div>
      </section>

      {/* Content: Form + Benefits */}
      <section className="mt-10 pb-20">
        <div className="container-max px-4 sm:px-6 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] items-start">
            {/* Left: Demo request form */}
            <div className="rounded-3xl border border-sky-100 bg-[#F7F3EE]/90 p-6 sm:p-8 shadow-[0_18px_80px_rgba(15,23,42,0.06)]">
              <div className="mb-6">
                <h2 className="text-heading">Tell us about your team</h2>
                <p className="mt-1 text-xs text-slate-500">
                  Share a few details so we can tailor the demo to your document workflows.
                </p>
              </div>

              <form className="space-y-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label htmlFor="fullName" className="block text-xs font-medium text-slate-800">
                      Full name
                    </label>
                    <input
                      id="fullName"
                      type="text"
                      className="w-full rounded-xl border border-[#E6D8C9] bg-[#F7F3EE] px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#084bdc] focus:outline-none focus:ring-2 focus:ring-[#084bdc]/20"
                      placeholder="Alex Johnson"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="workEmail" className="block text-xs font-medium text-slate-800">
                      Work email
                    </label>
                    <div className="relative">
                      <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <input
                        id="workEmail"
                        type="email"
                        className="w-full rounded-xl border border-[#E6D8C9] bg-[#F7F3EE] px-9 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#084bdc] focus:outline-none focus:ring-2 focus:ring-[#084bdc]/20"
                        placeholder="you@company.com"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label htmlFor="company" className="block text-xs font-medium text-slate-800">
                      Company
                    </label>
                    <div className="relative">
                      <Building2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <input
                        id="company"
                        type="text"
                        className="w-full rounded-xl border border-[#E6D8C9] bg-[#F7F3EE] px-9 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#084bdc] focus:outline-none focus:ring-2 focus:ring-[#084bdc]/20"
                        placeholder="Acme Inc."
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="teamSize" className="block text-xs font-medium text-slate-800">
                      Team size
                    </label>
                    <div className="relative">
                      <Users className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <select
                        id="teamSize"
                        className="w-full rounded-xl border border-[#E6D8C9] bg-[#F7F3EE] px-9 py-2.5 text-sm text-slate-900 focus:border-[#084bdc] focus:outline-none focus:ring-2 focus:ring-[#084bdc]/20"
                        defaultValue=""
                      >
                        <option value="" disabled>
                          Select range
                        </option>
                        <option value="1-10">1–10</option>
                        <option value="11-50">11–50</option>
                        <option value="51-250">51–250</option>
                        <option value="251-1000">251–1000</option>
                        <option value="1000+">1000+</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label htmlFor="role" className="block text-xs font-medium text-slate-800">
                      Role
                    </label>
                    <input
                      id="role"
                      type="text"
                      className="w-full rounded-xl border border-[#E6D8C9] bg-[#F7F3EE] px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#084bdc] focus:outline-none focus:ring-2 focus:ring-[#084bdc]/20"
                      placeholder="Head of Sales, Legal Ops..."
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="phone" className="block text-xs font-medium text-slate-800">
                      Phone (optional)
                    </label>
                    <div className="relative">
                      <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <input
                        id="phone"
                        type="tel"
                        className="w-full rounded-xl border border-[#E6D8C9] bg-[#F7F3EE] px-9 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#084bdc] focus:outline-none focus:ring-2 focus:ring-[#084bdc]/20"
                        placeholder="+1 555 000 0000"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="focus" className="block text-xs font-medium text-slate-800">
                    What would you like to focus on?
                  </label>
                  <textarea
                    id="focus"
                    rows={4}
                    className="w-full rounded-2xl border border-[#E6D8C9] bg-[#F7F3EE] px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#084bdc] focus:outline-none focus:ring-2 focus:ring-[#084bdc]/20 resize-none"
                    placeholder="E.g. sales contracts, HR onboarding, legal approvals, integrations..."
                  />
                </div>

                <div className="flex flex-col gap-3 pt-2 text-xs text-slate-500">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    <span>No obligation — this is a discovery call to see if {APP_NAME} is a fit.</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    <span>We’ll follow up with a recording and recommended next steps.</span>
                  </div>
                </div>

                <button
                  type="button"
                  className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#084bdc] px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-[#084bdc]/30 transition hover:bg-[#084bdc]/90"
                >
                  Book Demo
                  <CheckCircle2 className="h-3.5 w-3.5" />
                </button>
              </form>
            </div>

            {/* Right: What to expect / highlights */}
            <aside className="space-y-6 rounded-3xl bg-gradient-to-b from-[#260559] to-[#3a0a7e] p-6 sm:p-7 text-white shadow-xl">
              <h3 className="text-lg font-semibold mb-1">What we’ll cover in your demo</h3>
              <p className="text-sm text-[#CBB9FF] mb-4">
                Every session is tailored to your role, industry, and current tools — so you only see what matters.
              </p>

              <div className="space-y-4 text-sm">
                <div className="flex gap-3">
                  <div className="mt-1 flex h-7 w-7 items-center justify-center rounded-full bg-[#F7F3EE]/10">
                    <span className="text-xs font-semibold">1</span>
                  </div>
                  <div>
                    <div className="font-medium">Current workflow deep-dive</div>
                    <p className="text-[#E4DAFF] text-xs mt-1">
                      We map where documents slow down today — from creation and approvals to final signatures.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="mt-1 flex h-7 w-7 items-center justify-center rounded-full bg-[#F7F3EE]/10">
                    <span className="text-xs font-semibold">2</span>
                  </div>
                  <div>
                    <div className="font-medium">Live product walkthrough</div>
                    <p className="text-[#E4DAFF] text-xs mt-1">
                      See how {APP_NAME} creates, routes, and signs your key documents with templates and automation.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="mt-1 flex h-7 w-7 items-center justify-center rounded-full bg-[#F7F3EE]/10">
                    <span className="text-xs font-semibold">3</span>
                  </div>
                  <div>
                    <div className="font-medium">Security & compliance review</div>
                    <p className="text-[#E4DAFF] text-xs mt-1">
                      Learn how we protect your data with encryption, audit trails, and role-based access controls.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="mt-1 flex h-7 w-7 items-center justify-center rounded-full bg-[#F7F3EE]/10">
                    <span className="text-xs font-semibold">4</span>
                  </div>
                  <div>
                    <div className="font-medium">Rollout plan & pricing</div>
                    <p className="text-[#E4DAFF] text-xs mt-1">
                      Get a clear view of rollout timelines, change management, and pricing that matches your scale.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-4 rounded-2xl bg-[#F7F3EE]/5 p-4 text-xs flex flex-col gap-3">
                <div className="flex items-center gap-2 text-[#E4DAFF]">
                  <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                  <span>Avg. time to first live workflow: under 2 weeks</span>
                </div>
                <div className="flex items-center gap-2 text-[#E4DAFF]">
                  <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                  <span>Dedicated onboarding support included on all paid plans</span>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>
    </div>
  )
}

export default BookDemoPage

