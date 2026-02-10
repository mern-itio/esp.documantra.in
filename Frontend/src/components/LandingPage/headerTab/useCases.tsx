import { Briefcase, ChevronRight, Globe, Users } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '../../DocumentService/ui/button'

const UseCases = () => {
    return (
        <>
            <div className="flex flex-col md:flex-row">
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-8 p-6 md:p-8">
                    <div>
                        <div className="flex items-center gap-2 mb-4">
                            <Briefcase className="h-4 w-4 text-slate-400" />
                            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                Use case
                            </span>
                        </div>
                        <ul className="space-y-8">
                            <li >
                                <Link
                                    to="/use-cases"
                                    className="text-heading"
                                >
                                    eSignatures
                                </Link>
                            </li>
                            <li >
                                <Link
                                    to="/use-cases"
                                    className="text-heading mb-4"
                                >
                                    Proposals
                                </Link>
                            </li>
                            <li >
                                <Link
                                    to="/use-cases"
                                    className="text-heading"
                                >
                                    Contracts
                                </Link>
                            </li>
                            <li >
                                <Link
                                    to="/use-cases"
                                    className="text-heading"
                                >
                                    Quotes
                                </Link>
                            </li>
                            <li >
                                <Link
                                    to="/use-cases"
                                    className="text-heading"
                                >
                                    Payments
                                </Link>
                            </li>

                        </ul>
                        <Link
                            to="/use-cases"
                            className="inline-flex items-center gap-1 mt-4 text-xs text-slate-500 hover:text-slate-700 transition-colors"
                        >
                            All use cases
                            <ChevronRight className="h-3.5 w-3.5" />
                        </Link>
                    </div>

                    {/* INDUSTRY */}
                    <div>
                        <div className="flex items-center gap-2 mb-4">
                            <Globe className="h-4 w-4 text-slate-400" />
                            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                Industry
                            </span>
                        </div>
                        <ul className="space-y-8">

                            <li >
                                <Link
                                    to="/use-cases"
                                    className="text-heading"
                                >
                                    Software & technology
                                </Link>
                            </li>
                            <li >
                                <Link
                                    to="/use-cases"
                                    className="text-heading"
                                >
                                    Professional services
                                </Link>
                            </li>
                            <li >
                                <Link
                                    to="/use-cases"
                                    className="text-heading"
                                >
                                    Education
                                </Link>
                            </li>
                            <li >
                                <Link
                                    to="/use-cases"
                                    className="text-heading"
                                >
                                    Healthcare
                                </Link>
                            </li>
                            <li >
                                <Link
                                    to="/use-cases"
                                    className="text-heading"
                                >
                                    Construction
                                </Link>
                            </li>

                        </ul>
                        <Link
                            to="/use-cases"
                            className="inline-flex items-center gap-1 mt-4 text-xs text-slate-500 hover:text-slate-700 transition-colors"
                        >
                            All industries
                            <ChevronRight className="h-3.5 w-3.5" />
                        </Link>
                    </div>

                    {/* TEAM */}
                    <div>
                        <div className="flex items-center gap-2 mb-4">
                            <Users className="h-4 w-4 text-slate-400" />
                            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                Team
                            </span>
                        </div>
                        <ul className="space-y-8">
                            <li >
                                <Link
                                    to="/use-cases"
                                    className="text-heading"
                                >
                                    Sales
                                </Link>
                            </li>
                            <li >
                                <Link
                                    to="/use-cases"
                                    className="text-heading"
                                >
                                    HR
                                </Link>
                            </li>
                            <li >
                                <Link
                                    to="/use-cases"
                                    className="text-heading"
                                >
                                    Marketing
                                </Link>
                            </li>
                            <li >
                                <Link
                                    to="/use-cases"
                                    className="text-heading"
                                >
                                    Customer success
                                </Link>
                            </li>
                            <li >
                                <Link
                                    to="/use-cases"
                                    className="text-heading"
                                >
                                    Legal
                                </Link>
                            </li>

                        </ul>
                        <Link
                            to="/use-cases"
                            className="inline-flex items-center gap-1 mt-4 text-xs text-slate-500 hover:text-slate-700 transition-colors"
                        >
                            All teams
                            <ChevronRight className="h-3.5 w-3.5" />
                        </Link>
                    </div>
                </div>

                {/* Right: Customer Stories (beige panel) */}
                <div className="w-full md:w-[340px] lg:w-[380px] flex-shrink-0 bg-amber-50/80 border-l border-slate-200/80 p-6 md:p-8">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Customer Diary
                    </span>
                    <div className="mt-4 space-y-4">
                        <Link
                            to="/customer-stories"
                            className="flex items-start gap-3 group"
                        >
                            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-teal-600 text-white text-xs font-bold">
                                <img src="./logos/apple.png" alt="Autodesk logo" className="h-6 w-auto" />
                            </div>
                            <p className="text-sm font-semibold text-slate-900 group-hover:text-[#260559] transition-colors leading-snug">
                                Autodesk now tracks sales metrics across its entire org
                            </p>
                        </Link>
                        <Link
                            to="/customer-stories"
                            className="flex items-start gap-3 group"
                        >
                            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-rose-500 text-white text-xs font-bold">
                                <img src="./logos/bosch.png" alt="Nomad logo" className="h-6 w-auto" />
                            </div>
                            <p className="text-sm font-semibold text-slate-900 group-hover:text-[#260559] transition-colors leading-snug">
                                Nomad cut customer acquisition costs by 20%
                            </p>
                        </Link>
                        <Link
                            to="/customer-stories"
                            className="flex items-start gap-3 group"
                        >
                            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-violet-600 text-white text-xs font-bold">
                                <img src="./logos/hsbc.png" alt="TheKey logo" className="h-6 w-auto" />
                            </div>
                            <p className="text-sm font-semibold text-slate-900 group-hover:text-[#260559] transition-colors leading-snug">
                                TheKey saves 3,000 hours per year using DraftnSign
                            </p>
                        </Link>
                    </div>
                    <Link
                        to="/customer-stories"
                        className="inline-flex items-center gap-1 mt-4 text-xs text-slate-500 hover:text-slate-700 transition-colors"
                    >
                        All customer stories
                        <ChevronRight className="h-3.5 w-3.5" />
                    </Link>
                </div>
            </div>

            {/* Bottom CTA row */}
            <div className="border-t border-slate-200 px-6 md:px-8 py-4 flex flex-wrap items-center gap-6">
                <Button variant='new'>
                    <Link
                        to="/request-demo"
                        className="text-sm font-medium text-white hover:text-[#260559] transition-colors"
                    >
                        Request a demo
                    </Link>
                </Button>

                <Link
                    to="/contact-sales"
                    className="text-sm font-medium text-slate-900 hover:text-[#260559] transition-colors"
                >
                    Contact sales
                </Link>
            </div>
        </>

    )
}

export default UseCases
