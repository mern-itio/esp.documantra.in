import React from 'react'
import { APP_NAME } from '../constants/appConfig'

const lifecycleSteps = [
  {
    id: 1,
    title: 'Intake & request',
    description:
      'The contract management process begins when a business need is identified and a formal request for a contract is initiated. This stage ensures that the purpose, scope, and objectives of the agreement are clearly defined before any drafting begins. Proper initiation helps align stakeholders, reduces ambiguity, and ensures that contracts are created only when there is a valid commercial, legal, or operational requirement.',
    image: '/images/contract/first.jpg',
    bullets: [
      "Identify the business, legal, or operational need for a contract",
      "Define the scope, objectives, and key requirements of the agreement",
      "Initiate a formal contract request through an approved process or system",
      "Assign ownership and identify relevant stakeholders early in the process"
    ]
  },
  {
    id: 2,
    title: 'Draft & collaborate',
    description:
      'During the drafting and collaboration stage, the contract is prepared using standardized templates, approved clauses, and established legal language. Collaboration between legal, business, and other stakeholders ensures that the contract accurately reflects the agreed terms while remaining compliant with applicable laws and organizational policies.',
    image: '/images/contract/second.jpg',
    bullets: [
      "Use approved contract templates and clause libraries to ensure consistency",
      "Customize terms to reflect specific business requirements and risk levels",
      "Collaborate with legal, procurement, finance, and business teams",
      "Maintain version control to track changes and avoid conflicting drafts"
    ]
  },
  {
    id: 3,
    title: 'Review & approve',
    description:
      'At this stage, the drafted contract undergoes a structured review by required stakeholders to ensure legal compliance, financial accuracy, and business alignment. Formal approvals are obtained to confirm that risks are understood and accepted before the contract is executed.',
    image: '/images/contract/third.jpg',
    bullets: [
      "Conduct legal review to ensure compliance with laws and regulations",
      "Perform financial and commercial review to validate pricing and obligations",
      "Obtain management or executive approval based on authority levels",
      "Document approvals to maintain audit and compliance records"
    ]
  },
  {
    id: 4,
    title: 'Sign & execute',
    description:
      'Once approvals are secured, the contract is formally signed and executed by all authorized parties. Execution makes the contract legally binding and enforceable. Increasingly, organizations use electronic signature tools to improve efficiency, security, and traceability.',
    image: '/images/contract/fourth.jpg',
    bullets: [
      "Verify that all signatories have proper authority to execute the contract",
      "Execute the agreement using physical or approved e-signature platforms",
      "Ensure all parties receive fully signed copies of the contract",
      "Confirm the contract’s effective date and execution status"
    ]
  },
  {
    id: 5,
    title: 'Store & search',
    description:
      'After execution, the finalized contract is securely stored in a centralized repository to ensure accessibility, traceability, and compliance. Active monitoring helps organizations track contractual obligations, deadlines, and performance throughout the contract lifecycle.',
    image: '/images/contract/fifth.jpg',
    bullets: [
      "Store contracts in a centralized and secure contract repository",
      "Track key obligations, deliverables, and performance requirements",
      "Monitor critical dates such as renewals, expirations, and milestones",
      "Use alerts and reporting to prevent missed deadlines or non-compliance"
    ]
  },
  {
    id: 6,
    title: 'Monitor & renew',
    description:
      'As the contract approaches expiration, a decision is made to renew, amend, or terminate the agreement based on performance, business needs, and strategic considerations. Proper closure or renewal ensures legal clarity and minimizes future risks.',
    image: '/images/contract/sixth.jpg',
    bullets: [
      "Review contract performance before expiration",
      "Decide whether to renew, amend, or terminate",
      "Execute amendments or renewal agreements when applicable",
      "Formally close terminated contracts and archive records as required"
    ]
  },
]

const ContractManagementSection: React.FC = () => {
  const [activeStepId, setActiveStepId] = React.useState<number>(1)

  const activeStep = lifecycleSteps.find((step) => step.id === activeStepId) ?? lifecycleSteps[0]

  return (
    <section className="relative bg-[#F5F2EE] py-20 sm:py-24">
       <div
        className="pointer-events-none absolute inset-0 bg-[url('/images/contract-section.jpg')] bg-cover bg-center opacity-20 md:opacity-30"
        aria-hidden="true"
      />
      <div className="mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-12 flex flex-col gap-4 text-left sm:text-center">

          <h2 className="heading">
            See your entire contract lifecycle in one place
          </h2>
          <p className="details-text">
            From the first request to renewal, {APP_NAME} gives teams a single, consistent workflow for every
            agreement. No more lost versions, missed renewals, or unclear owners.
          </p>
        </div>

        <div className="space-y-8">
          {/* Horizontal flow with arrows */}
          <div className="flex flex-wrap items-stretch gap-3 lg:gap-4">
            {lifecycleSteps.map((step, index) => (
              <React.Fragment key={step.id}>
                <button
                  type="button"
                  onClick={() => setActiveStepId(step.id)}
                  className={`group flex items-center gap-2 rounded-md border px-4 py-2 text-left text-sm shadow-sm ring-1 transition ${activeStepId === step.id
                    ? 'border-emerald-500/70 ring-emerald-500/30 shadow-md bg-[#F7F3EE] text-black'
                    : 'border-[#E6D8C9] ring-slate-100 hover:border-emerald-300 hover:ring-emerald-100 bg-[#084bdc] text-white hover:bg-blue-600'
                    }`}
                >
                  <div
                    className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-xs font-semibold ${activeStepId === step.id
                      ? 'bg-[#2563eb] text-white'
                      : 'bg-[#F7F3EE] text-black'
                      }`}
                  >
                    {step.id}
                  </div>
                  <div className="flex flex-col">

                    <span
                      className={`text-[13px] font-semibold ${activeStepId === step.id ? 'text-slate-900' : 'text-white'
                        }`}
                    >
                      {step.title}
                    </span>
                  </div>
                </button>

                {index < lifecycleSteps.length - 1 && (
                  <svg viewBox="0 0 100 20" width="50" height="40" xmlns="http://www.w3.org">

                    <line x1="0" y1="10" x2="80" y2="10" stroke="blue" stroke-width="5" />

                    <polygon points="80,2 110,10 80,18" fill="blue" />
                  </svg>

                )}
              </React.Fragment>
            ))}
          </div>

          {/* Tab content with text + image */}
          <div className="relative p-5 shadow-sm ring-1 ring-slate-100 sm:p-6 lg:p-7">
           
            <div className="grid gap-6 lg:grid-cols-2 lg:items-center">
              {/* Left: content */}
              <div>

                <h3 className="desc-text text-3xl ">
                  Streamline the {activeStep.title.toLowerCase()} stage
                </h3>
                <p className="mt-2 text-sm text-black sm:text-[15px]">{activeStep.description}</p>

                <ul className="mt-4 space-y-2 text-sm text-black-800 sm:text-[14px]">
                  {activeStep.bullets.map((item, index) => (
                    <li key={index} className="flex gap-2">
                      <span className="mt-[6px] h-1.5 w-1.5 flex-shrink-0 rounded-full bg-emerald-500" />
                      <span>{item}</span>
                    </li>
                  ))}
                  <li className="flex gap-2">
                    <span className="mt-[6px] h-1.5 w-1.5 flex-shrink-0 rounded-full bg-emerald-500" />
                    <span>Reduce manual follow‑ups with clear next steps at every stage.</span>
                  </li>
                </ul>
              </div>

              {/* Right: illustrative image panel */}
              <div className="relative overflow-hidden rounded-2xl bg-slate-100">
                <img
                  src={activeStep.image}
                  alt={`${activeStep.title} illustration`}
                  className="h-full w-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default ContractManagementSection

