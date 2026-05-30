import React from 'react'
import { Link } from 'react-router-dom'
import { APP_NAME } from '../../../components/constants/appConfig'
import { Diamond, ShieldCheck, FileSearch2 } from 'lucide-react'

const ESignServiceWebAppPage: React.FC = () => {
  return (
    <main className="bg-[#F5F2EE] text-slate-900">
      <section className="relative overflow-hidden bg-[#0B0F1F] min-h-screen flex items-center">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(56,189,248,0.12),_transparent_60%)]" />
        <div className="relative mx-auto max-w-7xl px-6 lg:px-10 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="max-w-xl">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-sky-300">
                E-SIGN SERVICE WEB APP
              </p>

              <h1 className="mt-5 text-4xl font-semibold leading-tight text-white sm:text-5xl">
                The web app for managing agreements from first draft to final signature.
              </h1>

              <p className="mt-5 text-base leading-relaxed text-slate-300">
                {APP_NAME} brings document sending, tracking, and signing into a single workspace.
                Give teams a clear view of what needs to happen next — without email chaos.
              </p>

              <div className="mt-8 flex flex-wrap gap-4">
                <Link
                  to="/signup"
                  className="inline-flex items-center justify-center rounded-full bg-[#F7F3EE] px-6 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
                >
                  Start free
                </Link>

                <Link
                  to="/contact-sales"
                  className="inline-flex items-center justify-center rounded-full border border-slate-500/40 bg-slate-900/40 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800/60"
                >
                  Talk to our team
                </Link>
              </div>
            </div>

            {/* RIGHT VISUAL */}
            <div className="relative flex justify-center lg:justify-end">
              {/* Glow */}
              <div className="absolute -inset-10 bg-[radial-gradient(circle,_rgba(56,189,248,0.15),_transparent_60%)] blur-3xl" />

              {/* Floating hero image */}
              <div className="relative w-full max-w-[700px] lg:max-w-[820px]">
                <img
                  src="/images/Inside-Pages/e-sign.png"
                  alt="E-sign web app interface"
                  className="w-full h-auto object-contain drop-shadow-[0_40px_100px_rgba(15,23,42,0.9)]"
                />
              </div>
            </div>

          </div>
        </div>
      </section>


      {/* Controlled sending / visibility / security */}
      <section className="bg-[#F5F2EE] py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 md:grid-cols-3">
            {[
              {
                title: 'Controlled sending',
                body: 'Use defined workflows and permissions so every agreement is created and sent in a consistent, low-friction way for senders and recipients.',
                icon: Diamond,
              },
              {
                title: 'Smart authentication',
                body: 'Choose the right authentication for each use case, from email links and one-time codes to stronger checks where they are appropriate.',
                icon: ShieldCheck,
              },
              {
                title: 'Detailed audit trail',
                body: 'See when documents are opened, who has completed their part, and what still needs attention, with a readable history for each agreement.',
                icon: FileSearch2,
              },
            ].map(({ title, body, icon: Icon }) => (
              <div key={title}>
                <Icon className="h-9 w-9 text-sky-600" />
                <h3 className="mt-3 inside-heading">{title}</h3>
                <p className="mt-2 text-sm text-slate-600 sm:text-[14px]">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What is the E‑sign web app */}
      <section className="bg-[#F7F3EE] py-16 sm:py-20">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 sm:px-6 lg:grid-cols-2 lg:px-8 lg:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-600">
              What is the {APP_NAME} E‑sign web app?
            </p>
            <h2 className="mt-3 text-2xl font-semibold text-slate-900 sm:text-3xl">
              A single browser‑based workspace for agreements and forms.
            </h2>
            <p className="mt-3 text-sm text-slate-600 sm:text-[15px]">
              The {APP_NAME} E‑sign web app lets you upload agreements, configure recipients, collect signatures, and
              manage completed documents without leaving your browser. Use groups and permissions to control who can
              send, approve, or view different types of agreements.
            </p>
            <p className="mt-3 text-sm text-slate-600 sm:text-[15px]">
              Teams can work in multiple languages, use ordered or parallel signing, and reuse templates for recurring
              agreements such as onboarding packs, NDAs, or service contracts.
            </p>
          </div>

          <div className="rounded-3xl bg-slate-100 p-4 shadow-sm ring-1 ring-slate-200">
            <div className="rounded-2xl bg-[#F7F3EE] p-4 text-sm text-slate-800 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <span className="font-semibold text-slate-900">Send for review</span>
                <span className="text-xs text-slate-500">Workspace · E‑sign</span>
              </div>
              <div className="mt-3 space-y-2 text-xs">
                <div className="flex items-center justify-between rounded-xl bg-[#F5F2EE] px-3 py-2">
                  <span>Standard services agreement</span>
                  <span className="rounded-full bg-slate-900 px-2 py-0.5 text-[10px] font-medium text-white">
                    Template
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-[#F5F2EE] px-3 py-2">
                  <span>Recipients</span>
                  <span className="text-[11px] text-slate-600">Client signer · Internal approver</span>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-[#F5F2EE] px-3 py-2">
                  <span>Signing order</span>
                  <span className="text-[11px] text-slate-600">Internal approval → Client signature</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Document lifecycle */}
      <section className="bg-[#F5F2EE] py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-semibold text-slate-900 sm:text-3xl">
            Track and manage the document lifecycle in one view.
          </h2>
          <p className="mt-3 max-w-3xl text-sm text-slate-600 sm:text-[15px]">
            Every agreement passes through a predictable sequence: drafting, review, sending, signing, and follow‑up.
            {APP_NAME} gives you a single timeline that shows exactly where each document sits, and who is responsible
            for the next step.
          </p>

          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {[
              {
                label: 'Prepare',
                title: 'Create consistent agreements',
                body: 'Start from templates with pre‑approved language, merge in data from your CRM or internal systems, and avoid copy‑paste errors.',
              },
              {
                label: 'Send & sign',
                title: 'Share with the right people',
                body: 'Choose recipients, define the sequence, and send secure links so each signer can review and complete their part from any device.',
              },
              {
                label: 'After signing',
                title: 'Keep agreements actionable',
                body: 'Store completed documents with clear owners, set reminders for key dates, and quickly export activity for audits and reporting.',
              },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-2xl border border-[#E6D8C9] bg-[#F7F3EE] p-5 shadow-sm ring-1 ring-slate-100"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-600">{item.label}</p>
                <h3 className="mt-2 text-sm font-semibold text-slate-900 sm:text-[15px]">{item.title}</h3>
                <p className="mt-2 text-sm text-slate-600 sm:text-[14px]">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Security & controls */}
      <section className="bg-[#F7F3EE] py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-2 lg:items-start">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-600">
                Security and access control
              </p>
              <h2 className="mt-3 text-2xl font-semibold text-slate-900 sm:text-3xl">
                Keep sensitive agreements in the right hands.
              </h2>
              <p className="mt-3 text-sm text-slate-600 sm:text-[15px]">
                Use groups, roles, and project‑based workspaces to control who can draft, send, or view each type of
                document. Combine this with activity history on every agreement so you always know who did what and
                when.
              </p>
              <ul className="mt-4 space-y-2 text-sm text-slate-600 sm:text-[14px]">
                <li>Role‑based access for senders, approvers, and viewers.</li>
                <li>Configurable retention periods and workspace‑level policies.</li>
                <li>Detailed audit history on views, sends, and completed signatures.</li>
              </ul>
            </div>

            <div className="rounded-3xl bg-slate-900 p-5 text-slate-50 shadow-lg ring-1 ring-slate-800">
              <h3 className="text-sm font-semibold">Agreement activity snapshot</h3>
              <div className="mt-3 space-y-2 text-[12px]">
                {[
                  'Viewed by recipient',
                  'Internal approval granted',
                  'Fields completed',
                  'Final copy shared with all parties',
                ].map((item, idx) => (
                  <div key={item} className="flex items-center justify-between rounded-xl bg-slate-800 px-3 py-2">
                    <span className="text-slate-100">{item}</span>
                    <span className="text-slate-400">Step {idx + 1}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Key capabilities grid */}
      <section className="bg-[#F5F2EE] py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-semibold text-slate-900 sm:text-3xl">Key capabilities in the web app.</h2>
          <p className="mt-3 max-w-3xl text-sm text-slate-600 sm:text-[15px]">
            Everything you need to move agreements from first draft to signed copy, without leaving your browser.
          </p>

          <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[
              'Reusable templates for standard agreements and forms.',
              'Flexible routing for approvals and signing order.',
              'Automatic reminders to keep signatures moving.',
              'Searchable agreement library with filters and tags.',
              'Support for multiple recipients and roles per document.',
              'Activity insights to understand where work is slowing down.',
            ].map((text) => (
              <div
                key={text}
                className="flex items-start gap-3 rounded-2xl border border-[#E6D8C9] bg-[#F7F3EE] p-4 shadow-sm"
              >
                <span className="mt-1 inline-flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-sky-100 text-xs font-semibold text-sky-700">
                  ✓
                </span>
                <p className="text-sm text-slate-700 sm:text-[14px]">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-[#F7F3EE] py-16 sm:py-20">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-2xl font-semibold text-slate-900 sm:text-3xl">
            Start managing agreements in one connected workspace.
          </h2>
          <p className="mt-3 text-sm text-slate-600 sm:text-[15px]">
            Try {APP_NAME} with your team and see how a purpose‑built E‑sign web app can shorten cycles, reduce manual
            chasing, and keep every agreement easy to find.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              to="/signup"
              className="inline-flex items-center justify-center rounded-full bg-sky-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-700"
            >
              Start free
            </Link>
            <Link
              to="/contact-sales"
              className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-[#F7F3EE] px-6 py-2.5 text-sm font-semibold text-slate-900 shadow-sm transition hover:bg-[#F5F2EE]"
            >
              Book a live demo
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}

export default ESignServiceWebAppPage

