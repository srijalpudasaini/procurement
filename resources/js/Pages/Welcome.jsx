import Layout from "@/Layouts/Layout";
import { Head, Link } from "@inertiajs/react";

export default function Welcome({ activeEois = [], stats = {} }) {
    return (
        <Layout>
            <Head title="Procurement & Tender Management System" />

            {/* Clean, Simple Hero Section */}
            <section className="bg-slate-50 border-b border-slate-200 py-14 sm:py-18">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center max-w-3xl mx-auto">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-[#00AB66] text-xs font-semibold mb-4">
                            <i className="fa fa-shield"></i>
                            E-Procurement & Tender Portal
                        </span>

                        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-800 tracking-tight leading-tight">
                            Transparent Procurement &{" "}
                            <span className="text-[#00AB66]">Tender Evaluation</span>
                        </h1>

                        <p className="mt-4 text-sm sm:text-base text-slate-600 leading-relaxed max-w-2xl mx-auto">
                            Streamline departmental purchase requisitions, multi-tier budget approvals, and evaluate vendor proposals through multi-criteria decision intelligence.
                        </p>

                        {/* CTA Buttons */}
                        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                            <Link
                                href="/eoi"
                                className="px-5 py-2.5 rounded-lg bg-[#00AB66] hover:bg-emerald-600 text-white font-semibold text-xs shadow-sm transition flex items-center gap-2"
                            >
                                <i className="fa fa-bullhorn text-xs"></i>
                                <span>Browse Open Tenders</span>
                            </Link>

                            <Link
                                href="/vendor-login"
                                className="px-5 py-2.5 rounded-lg bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-semibold text-xs shadow-sm transition flex items-center gap-2"
                            >
                                <i className="fa fa-building-o text-slate-500"></i>
                                <span>Vendor Portal</span>
                            </Link>

                            <Link
                                href="/login"
                                className="px-5 py-2.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold text-xs transition"
                            >
                                Staff Login
                            </Link>
                        </div>
                    </div>

                    {/* Stats Strip */}
                    <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
                        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm text-center">
                            <div className="text-2xl font-bold text-[#00AB66]">
                                {stats.active_tenders ?? 0}
                            </div>
                            <div className="text-xs text-slate-500 mt-0.5">
                                Active Tenders (EOI)
                            </div>
                        </div>

                        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm text-center">
                            <div className="text-2xl font-bold text-slate-800">
                                {stats.registered_vendors ?? 0}
                            </div>
                            <div className="text-xs text-slate-500 mt-0.5">
                                Registered Suppliers
                            </div>
                        </div>

                        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm text-center">
                            <div className="text-2xl font-bold text-slate-800">
                                {stats.total_requests ?? 0}
                            </div>
                            <div className="text-xs text-slate-500 mt-0.5">
                                Purchase Requisitions
                            </div>
                        </div>

                        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm text-center">
                            <div className="text-2xl font-bold text-emerald-600">
                                100%
                            </div>
                            <div className="text-xs text-slate-500 mt-0.5">
                                Auditable & Compliant
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Active Tenders Preview Section */}
            <section className="py-12 bg-white border-b border-slate-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-6">
                        <div>
                            <span className="text-xs font-bold uppercase tracking-wider text-[#00AB66]">
                                Open for Proposals
                            </span>
                            <h2 className="text-xl font-bold text-slate-800">
                                Current Active Tenders
                            </h2>
                        </div>
                        <Link
                            href="/eoi"
                            className="text-xs font-semibold text-[#00AB66] hover:underline self-start sm:self-auto"
                        >
                            View All Tenders &rarr;
                        </Link>
                    </div>

                    {activeEois.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                            {activeEois.map((eoi) => (
                                <div
                                    key={eoi.id}
                                    className="p-5 rounded-xl border border-slate-200 bg-white hover:border-emerald-300 hover:shadow-sm transition flex flex-col justify-between"
                                >
                                    <div>
                                        <div className="flex justify-between items-center mb-2.5">
                                            <span className="text-[11px] font-semibold text-slate-500">
                                                #{eoi.eoi_number}
                                            </span>
                                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                Open
                                            </span>
                                        </div>

                                        <h3 className="text-sm font-bold text-slate-800 line-clamp-2 mb-1.5 hover:text-[#00AB66] transition">
                                            <Link href={`/eoi/${eoi.id}`}>
                                                {eoi.title}
                                            </Link>
                                        </h3>

                                        <p className="text-xs text-slate-500 line-clamp-2 mb-3">
                                            {eoi.description || "Specifications and required items detailed in tender notice."}
                                        </p>
                                    </div>

                                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                                        <span className="text-slate-500 text-[11px]">
                                            Deadline: <strong className="text-rose-600">{eoi.deadline_date}</strong>
                                        </span>
                                        <Link
                                            href={`/eoi/${eoi.id}`}
                                            className="font-semibold text-[#00AB66] hover:underline"
                                        >
                                            Details &rarr;
                                        </Link>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="p-8 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl">
                            No open tenders published at this moment. Check back soon.
                        </div>
                    )}
                </div>
            </section>

            {/* How It Works: 3-Step Lifecycle */}
            <section className="py-12 bg-slate-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center max-w-xl mx-auto mb-8">
                        <span className="text-xs font-bold uppercase tracking-wider text-[#00AB66]">
                            Procurement Lifecycle
                        </span>
                        <h2 className="text-xl font-bold text-slate-800 mt-1">
                            How the System Operates
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-xs">
                            <div className="w-9 h-9 rounded-lg bg-emerald-50 text-[#00AB66] flex items-center justify-center text-sm font-bold mb-3">
                                1
                            </div>
                            <h3 className="text-sm font-bold text-slate-800 mb-1">
                                Requisitions & Tiered Approvals
                            </h3>
                            <p className="text-xs text-slate-500 leading-relaxed">
                                Department staff submit item requirements. Requests are routed through sequential budget approval levels (Manager &rarr; Finance &rarr; Director).
                            </p>
                        </div>

                        <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-xs">
                            <div className="w-9 h-9 rounded-lg bg-emerald-50 text-[#00AB66] flex items-center justify-center text-sm font-bold mb-3">
                                2
                            </div>
                            <h3 className="text-sm font-bold text-slate-800 mb-1">
                                Public Bidding & Proposals
                            </h3>
                            <p className="text-xs text-slate-500 leading-relaxed">
                                Approved requests are published as competitive Expressions of Interest (EOI). Registered suppliers submit quotations and compliance documents.
                            </p>
                        </div>

                        <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-xs">
                            <div className="w-9 h-9 rounded-lg bg-emerald-50 text-[#00AB66] flex items-center justify-center text-sm font-bold mb-3">
                                3
                            </div>
                            <h3 className="text-sm font-bold text-slate-800 mb-1">
                                TOPSIS Multi-Criteria Decision
                            </h3>
                            <p className="text-xs text-slate-500 leading-relaxed">
                                Proposals are evaluated scientifically by evaluating price, delivery time, vendor ratings, and document compliance relative to the ideal solution.
                            </p>
                        </div>
                    </div>
                </div>
            </section>
        </Layout>
    );
}