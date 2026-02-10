import React from 'react'
import { APP_NAME } from '../constants/appConfig'

const lifecycleSteps = [
  {
    id: 1,
    title: 'Intake & request',
    description:
      'Start new contracts from structured request forms instead of email. Capture business owner, counterparties, value, and due dates up front so legal has all the context they need.',
  },
  {
    id: 2,
    title: 'Draft & collaborate',
    description:
      'Generate contracts from approved templates with the right clauses every time. Let legal, sales, and stakeholders collaborate in real time with comments, suggestions, and redlines all in one place.',
  },
  {
    id: 3,
    title: 'Review & approve',
    description:
      'Route contracts through the right approval path automatically—finance for pricing, security for data terms, leadership for high‑value deals—so nothing gets stuck waiting in inboxes.',
  },
  {
    id: 4,
    title: 'Sign & execute',
    description:
      'Send contracts for e‑signature with predefined signing order and roles. Track who has signed, who is pending, and send reminders with a single click until everything is fully executed.',
  },
  {
    id: 5,
    title: 'Store & search',
    description:
      'Once signed, contracts are stored in a central, searchable repository with version history, custom tags, and role‑based permissions so every team can safely find what they need.',
  },
  {
    id: 6,
    title: 'Monitor & renew',
    description:
      'Stay ahead of expirations, renewals, and key obligations with automated reminders. See upcoming renewals by owner, customer, or value and take action before revenue or compliance risks appear.',
  },
]

const ContractManagementSection: React.FC = () => {
  return (
    <section className="relative bg-slate-50 py-20 sm:py-24">
      <div className="mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-12 flex flex-col gap-4 text-left sm:text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-500">
            Contract management flow
          </p>
          <h2 className="text-2xl font-semibold text-slate-900 sm:text-3xl lg:text-[32px]">
            See your entire contract lifecycle in one place
          </h2>
          <p className="mx-auto max-w-3xl text-sm text-slate-600 sm:text-[15px]">
            From the first request to renewal, {APP_NAME} gives teams a single, consistent workflow for every
            agreement. No more lost versions, missed renewals, or unclear owners.
          </p>
        </div>

        {/* Horizontal flow on desktop, stacked on mobile */}
        <div className="relative">
          {/* background line for the flow */}
          <div className="pointer-events-none absolute inset-x-4 top-7 hidden h-px bg-gradient-to-r from-slate-200 via-slate-300 to-slate-200 sm:block lg:inset-x-10" />

          <div className="grid gap-8 sm:grid-cols-3 lg:grid-cols-6">
            {lifecycleSteps.map((step) => (
              <div
                key={step.id}
                className="relative flex flex-col rounded-2xl border border-slate-200 bg-white p-4 pt-7 shadow-sm ring-1 ring-slate-100 transition hover:-translate-y-0.5 hover:shadow-md"
              >
                {/* Number pill */}
                <div className="absolute -top-3 left-4 flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-xs font-semibold text-white shadow-sm">
                  {step.id}
                </div>

                <h3 className="text-sm font-semibold text-slate-900 sm:text-[15px]">{step.title}</h3>
                <p className="mt-2 text-xs text-slate-600 sm:text-[13px]">{step.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Summary band */}
        <div className="mt-12 rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm text-slate-700 shadow-sm sm:px-6 sm:py-5">
          <span className="font-semibold text-slate-900">Outcome:&nbsp;</span>
          Every team works from the same reliable workflow, with contracts that are easy to create, approve, sign, and
          report on—whether you manage ten agreements a month or thousands.
        </div>
      </div>
    </section>
  )
}

export default ContractManagementSection

