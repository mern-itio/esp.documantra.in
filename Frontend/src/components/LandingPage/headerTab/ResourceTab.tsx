import { ChevronRight, DollarSign, ExternalLink, FileCheck, FileText, Globe, HelpCircle, Shield, Zap } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { APP_NAME } from '../../constants/appConfig'

const ResourceTab = () => {
    type ResourceTab = 'blogs' | 'support' | 'learn-more'

    const [resourceTab, setResourceTab] = useState<ResourceTab>('blogs')

    return (
        <div className="flex flex-col md:flex-row min-h-[380px]">
            {/* Left sidebar – tabs + static links */}
            <div className="w-full md:w-[240px] flex-shrink-0 border-b md:border-b-0 md:border-r border-[#E6D8C9] bg-[#F5F2EE]/50 p-5">
                <div className="space-y-2 mb-2">
                    {(['blogs', 'support', 'learn-more'] as const).map((tab) => (
                        <button
                            key={tab}
                            type="button"
                            onClick={() => setResourceTab(tab)}
                            className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${resourceTab === tab
                                ? 'bg-[#2563eb] text-white'
                                : 'text-slate-700 hover:bg-slate-200/60'
                                }`}
                        >
                            {tab === 'blogs' && 'Blogs'}
                            {tab === 'support' && 'Support'}
                            {tab === 'learn-more' && 'Learn More'}
                        </button>
                    ))}
                </div>
                <div className="h-px bg-slate-200 mt-20 mb-1" />
                <div className="space-y-2 mt-5">
                    <Link to="/app-documentation"  className="flex items-center gap-2 w-full border border-gray px-4 py-2.5 rounded-xl text-sm text-slate-600 hover:bg-slate-200/60 transition-colors">
                        App Documentation
                    </Link>
                    <a href="/api-documentation" target="_blank" rel="noopener noreferrer"  className="flex items-center justify-between gap-2 w-full px-4 py-2.5 border border-gray rounded-xl text-sm text-slate-600 hover:bg-slate-200/60 transition-colors">
                        API Documentation
                        <ExternalLink className="h-3.5 w-3.5 text-slate-400" />
                    </a>
                    <Link to="/downloads"  className="flex items-center gap-2 w-full px-4 py-2.5 border border-gray rounded-xl text-sm text-slate-600 hover:bg-slate-200/60 transition-colors">
                        Downloads
                    </Link>
                    <Link to="/electronic-signature-law"  className="flex items-center gap-2 w-full px-4 py-2.5 border border-gray rounded-xl text-sm text-slate-600 hover:bg-slate-200/60 transition-colors">
                        Electronic Signature Law
                    </Link>
                </div>
            </div>

            {/* Middle – dynamic content per tab */}
            <div className="flex-1 p-6 md:p-8 overflow-y-auto">
                {resourceTab === 'blogs' && (
                    <>
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">Featured</p>
                        <div className="grid sm:grid-cols-2 gap-4 mb-4">
                            <Link to="/blog/qes-digidentity"  className="group block rounded-2xl border border-[#E6D8C9] bg-[#F7F3EE] overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                                <div
                                    className="aspect-[16/12] flex items-end p-4 bg-cover bg-center"
                                    style={{ backgroundImage: "url('/images/contract-mang.jpg')" }}
                                >
                                </div>
                                <div className="p-4">
                                    <h3 className="font-semibold text-slate-900 group-hover:text-[#260559] transition-colors">Simplify contract management with Contract Repository</h3>
                                    <p className="text-xs text-slate-600 mt-1">Upgrade your signing with QES and PAdES for the highest standard of eSignature.</p>
                                </div>
                            </Link>
                            <Link to="/blog/accidental-contract"  className="group block rounded-2xl border border-[#E6D8C9] bg-[#F7F3EE] overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                                <div
                                    className="aspect-[16/12] flex items-end p-4 bg-cover bg-center"
                                    style={{ backgroundImage: "url('/images/contract2.jpg')" }}
                                >
                                </div>
                                <div className="p-4">
                                    <h3 className="font-semibold text-slate-900 group-hover:text-[#260559] transition-colors">The Best contract management software tools (full comparison)</h3>
                                    <p className="text-xs text-slate-600 mt-1">Contracting via email and WhatsApp – how to formalize with {APP_NAME}.</p>
                                </div>
                            </Link>
                        </div>
                        <Link to="/blog"  className="inline-flex items-center gap-1 border border-gray-400 justify-between w-full rounded-xl p-2 text-sm font-medium text-slate-700 hover:text-[#260559] transition-colors">
                            View All
                            <ChevronRight className="h-4 w-4" />
                        </Link>
                    </>
                )}

                {resourceTab === 'support' && (
                    <>
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">Contact support</p>
                        <div className="space-y-4 max-w-xl">
                            <input type="text" placeholder="Name" className="w-full px-4 py-2.5 rounded-xl border border-[#E6D8C9] bg-[#F7F3EE] text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2563eb]/30 focus:border-[#2563eb]" />
                            <input type="email" placeholder="Email" className="w-full px-4 py-2.5 rounded-xl border border-[#E6D8C9] bg-[#F7F3EE] text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2563eb]/30 focus:border-[#2563eb]" />
                            <textarea placeholder="What can we help you with..." rows={4} maxLength={500} className="w-full px-4 py-2.5 rounded-xl border border-[#E6D8C9] bg-[#F7F3EE] text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2563eb]/30 focus:border-[#2563eb] resize-y" />
                            <p className="text-xs text-slate-500">0/500</p>
                            <button type="button" className="inline-flex justify-between items-center gap-2 px-4 py-2.5 rounded-xl border border-[#E6D8C9] bg-[#F7F3EE] text-sm font-medium text-slate-700 hover:bg-[#F5F2EE] transition-colors w-full">
                                Send Message to Support
                                <HelpCircle className="h-4 w-4 text-amber-500" />
                            </button>

                        </div>
                        <button className='mt-8 p-1 border border-gray w-full rounded-xl'>
                            <Link to="/faqs"  className="inline-flex gap-1 items-center text-sm font-medium text-slate-700 hover:text-[#260559] transition-colors mt-2">
                                FAQs
                                <ChevronRight className="h-4 w-4" />
                            </Link>
                        </button>
                    </>
                )}

                {resourceTab === 'learn-more' && (
                    <>
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">Explore</p>
                        <div className="space-y-3">
                            <Link to="/blog"  className="flex items-start gap-3 p-3 rounded-xl hover:bg-[#F5F2EE] transition-colors">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100"><FileText className="h-5 w-5 text-emerald-600" /></div>
                                <div>
                                    <div className="font-semibold text-slate-900 text-sm">View All</div>
                                    <div className="text-xs text-slate-600">View more articles about eSignature and what it can do for your business</div>
                                </div>
                            </Link>
                            <Link to="/blog/what-is-esignature"  className="flex items-start gap-3 p-3 rounded-xl hover:bg-[#F5F2EE] transition-colors">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100"><FileCheck className="h-5 w-5 text-emerald-600" /></div>
                                <div>
                                    <div className="font-semibold text-slate-900 text-sm">What is eSignature?</div>
                                    <div className="text-xs text-slate-600">Learn what electronic signature is and how {APP_NAME} eSignature works.</div>
                                </div>
                            </Link>
                            <Link to="/blog/pdf-certification"  className="flex items-start gap-3 p-3 rounded-xl hover:bg-[#F5F2EE] transition-colors">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100"><Shield className="h-5 w-5 text-emerald-600" /></div>
                                <div>
                                    <div className="font-semibold text-slate-900 text-sm">PDF Certification with Long-Term Validation</div>
                                    <div className="text-xs text-slate-600">Why certified PDF with long-term validation matters for eSignatures and contracts.</div>
                                </div>
                            </Link>
                            <Link to="/blog/sign-document-online"  className="flex items-start gap-3 p-3 rounded-xl hover:bg-[#F5F2EE] transition-colors">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100"><Globe className="h-5 w-5 text-emerald-600" /></div>
                                <div>
                                    <div className="font-semibold text-slate-900 text-sm">How to get a document signed online</div>
                                    <div className="text-xs text-slate-600">Use {APP_NAME} eSignature to get documents signed online quickly.</div>
                                </div>
                            </Link>
                            <Link to="/blog/faster-signing"  className="flex items-start gap-3 p-3 rounded-xl hover:bg-[#F5F2EE] transition-colors">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100"><Zap className="h-5 w-5 text-emerald-600" /></div>
                                <div>
                                    <div className="font-semibold text-slate-900 text-sm">Faster document signing</div>
                                    <div className="text-xs text-slate-600">Simplify and accelerate signing and give customers the flexibility they need.</div>
                                </div>
                            </Link>
                            <Link to="/blog/reduce-costs"  className="flex items-start gap-3 p-3 rounded-xl hover:bg-[#F5F2EE] transition-colors">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100"><DollarSign className="h-5 w-5 text-emerald-600" /></div>
                                <div>
                                    <div className="font-semibold text-slate-900 text-sm">Reduce costs</div>
                                    <div className="text-xs text-slate-600">Integrate eSignatures into workflows to save time and money vs. postal contracts.</div>
                                </div>
                            </Link>
                        </div>
                    </>
                )}
            </div>

            {/* Right sidebar – About us */}
            <div className="w-full md:w-[200px] flex-shrink-0 border-t md:border-t-0 md:border-l border-[#E6D8C9] bg-[#F5F2EE]/30 p-5 md:p-6">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">About us</p>
                <ul className="space-y-8">
                    <li><Link to="/contact"  className="text-sm text-slate-700 hover:text-[#260559] transition-colors">Contact us</Link></li>
                    <li><Link to="/about"  className="text-sm text-slate-700 hover:text-[#260559] transition-colors">About {APP_NAME}</Link></li>
                    <li><Link to="/why-draft-sign"  className="text-sm text-slate-700 hover:text-[#260559] transition-colors">Why {APP_NAME}</Link></li>
                </ul>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-5 mb-2">Resellers &amp; Partners</p>
            </div>
        </div>
    )
}

export default ResourceTab
