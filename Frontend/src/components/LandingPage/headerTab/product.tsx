import { Link } from 'react-router-dom'
import { APP_NAME } from '../../constants/appConfig'
import { Building, FileCheck, Shield, Users } from 'lucide-react'

const ProductSection = () => {
    return (
        <div>
            {/* Top product cards row */}
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-[0.18em] mb-3">
                Our products
            </p>
            <div className="grid gap-4 md:gap-6 md:grid-cols-3 mb-6">
                {/* Web App card */}
                <Link
                    to="/e-sign/web-app"
                    className="group flex flex-col overflow-hidden rounded-xl border border-blue-500 bg-sky-50/40 shadow-[0_10px_40px_rgba(15,23,42,0.08)] hover:border-sky-300/80 hover:ring-3 hover:ring-sky-300/80 hover:bg-sky-100/80 transition-colors-150"
                >

                    <div className="relative h-32 md:h-40 w-full overflow-hidden bg-gradient-to-r from-sky-500/10 via-sky-300/20 to-sky-500/10">
                        <img
                            src="/images/e-sign.jpg"
                            alt="Web app dashboard"
                            className="h-full w-full object-cover"
                        />
                    </div>
                    <div className="px-4 py-4 md:px-5 md:py-5">
                        <h3 className="text-heading">
                            {APP_NAME} E-sign Service
                        </h3>
                        <p className="text-[12px]">
                            Create, share, and complete document signing workflows digitally with speed and simplicity.
                        </p>
                    </div>
                </Link>

                {/* API card */}
                <Link
                    to="/api-documentation"
                    className="group flex flex-col overflow-hidden rounded-2xl border border-emerald-500 bg-emerald-50/40 shadow-[0_10px_40px_rgba(15,23,42,0.08)] hover:border-emerald-300/80 hover:ring-3 hover:ring-emerald-300/80 hover:bg-emerald-100/80 transition-colors-150"
                >
                    <div className="relative h-32 md:h-40 w-full overflow-hidden bg-slate-900">
                        <img
                            src="/images/pdf.jpg"
                            alt="API quickstart"
                            className="h-full w-full object-cover opacity-90"
                        />
                    </div>
                    <div className="px-4 py-4 md:px-5 md:py-5">
                        <h3 className="text-heading">
                            {APP_NAME} PDF Tools
                        </h3>
                        <p className="text-[12px]">
                            Smart PDF tools to transform, manage, and automate your document handling.
                        </p>
                    </div>
                </Link>

                {/* Bulk Send card */}
                <Link
                    to="/login"
                    className="group flex flex-col overflow-hidden rounded-2xl border border-emerald-500 bg-emerald-50/40 shadow-[0_10px_40px_rgba(15,23,42,0.08)] hover:border-emerald-300/80  hover:ring-3 hover:ring-emerald-300/80 hover:bg-emerald-100/80 transition-colors-150"
                >
                    <div className="relative h-32 md:h-40 w-full overflow-hidden bg-gradient-to-r from-emerald-400/15 via-sky-300/15 to-emerald-400/15">
                        <img
                            src="/images/bulk-send.jpg"
                            alt="Bulk send & sign"
                            className="h-full w-full object-cover"
                        />
                    </div>
                    <div className="px-4 py-4 md:px-5 md:py-5">
                        <h3 className="text-heading">
                            {APP_NAME} Bulk Send &amp; Sign
                        </h3>
                        <p className="text-[12px]">
                            Send one document to many users at once and monitor progress from a single dashboard.
                        </p>
                    </div>
                </Link>
            </div>

            {/* Bottom feature tiles row */}
            <p className="text-heading mb-4">
                DraftnSign in your business
            </p>
            <div className="grid gap-4 mt-4 md:grid-cols-3">
                <Link
                    to="/discover-e-signatures"
                    className="flex items-start gap-3 rounded-2xl bg-sky-50/80 px-4 py-3 hover:bg-sky-100 transition-colors"
                >
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F7F3EE] shadow-sm">
                        <FileCheck className="h-4 w-4 text-sky-600" />
                    </div>
                    <div>
                        <div className="text-sm font-semibold text-slate-900">
                            E-Signature Law
                        </div>
                        <div className="text-xs text-slate-600">
                            Rules and usage explained.
                        </div>
                    </div>
                </Link>

                <Link
                    to="/customer-stories"
                    className="flex items-start gap-3 rounded-2xl bg-sky-50/40 px-4 py-3 hover:bg-sky-100 transition-colors"
                >
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F7F3EE] shadow-sm">
                        <Users className="h-4 w-4 text-sky-600" />
                    </div>
                    <div>
                        <div className="text-sm font-semibold text-slate-900">
                            Why Choose Us?
                        </div>
                        <div className="text-xs text-slate-600">
                            Secure. Simple. Reliable.
                        </div>
                    </div>
                </Link>

                <Link
                    to="/why-draft-sign"
                    className="flex items-start gap-3 rounded-2xl bg-sky-50/40 px-4 py-3 hover:bg-sky-100 transition-colors"
                >
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F7F3EE] shadow-sm">
                        <Shield className="h-4 w-4 text-sky-600" />
                    </div>
                    <div>
                        <div className="text-sm font-semibold text-slate-900">
                            Blogs
                        </div>
                        <div className="text-xs text-slate-600">
                            Insights and updates.
                        </div>
                    </div>
                </Link>

                <Link
                    to="/for-business"
                    className="flex items-start gap-3 rounded-2xl bg-sky-50/40 px-4 py-3 hover:bg-sky-100 transition-colors"
                >
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F7F3EE] shadow-sm">
                        <Building className="h-4 w-4 text-sky-600" />
                    </div>
                    <div>
                        <div className="text-sm font-semibold text-slate-900">
                            For business
                        </div>
                        <div className="text-xs text-slate-600">
                            Built for daily workflows.
                        </div>
                    </div>
                </Link>
                <Link
                    to="/for-business"
                    className="flex items-start gap-3 rounded-2xl bg-sky-50/40 px-4 py-3 hover:bg-sky-100 transition-colors"
                >
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F7F3EE] shadow-sm">
                        <Building className="h-4 w-4 text-sky-600" />
                    </div>
                    <div>
                        <div className="text-sm font-semibold text-slate-900">
                            Trust & Compilance
                        </div>
                        <div className="text-xs text-slate-600">
                            Security you can rely on.
                        </div>
                    </div>
                </Link>
                <Link
                    to="/for-business"
                    className="flex items-start gap-3 rounded-2xl bg-sky-50/40 px-4 py-3 hover:bg-sky-100 transition-colors"
                >
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F7F3EE] shadow-sm">
                        <Building className="h-4 w-4 text-sky-600" />
                    </div>
                    <div>
                        <div className="text-sm font-semibold text-slate-900">
                            Customer Diary
                        </div>
                        <div className="text-xs text-slate-600">
                            Real user experiences.
                        </div>
                    </div>
                </Link>
            </div>
        </div>
    )
}

export default ProductSection
