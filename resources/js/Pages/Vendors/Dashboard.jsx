import VendorLayout from "@/Layouts/VendorLayout";
import { Head, Link } from "@inertiajs/react";

export default function Dashboard({
    vendor,
    stats = {},
    recentApplications = [],
    openEois = [],
    appliedEoiIds = [],
}) {
    const calculateTotal = (proposals) => {
        if (!proposals || !proposals.length) return 0;
        return proposals.reduce((acc, p) => {
            const qty = p.purchase_request_item?.quantity || 1;
            const price = parseFloat(p.price) || 0;
            return acc + price * qty;
        }, 0);
    };

    const getDaysRemaining = (deadline) => {
        if (!deadline) return null;
        const diff = Math.ceil(
            (new Date(deadline).getTime() - new Date().getTime()) /
                (1000 * 60 * 60 * 24)
        );
        return diff;
    };

    return (
        <VendorLayout>
            <Head title="Vendor Dashboard" />

            {/* Welcome & Profile Header */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <h1 className="text-2xl font-bold text-slate-800">
                                Welcome, {vendor?.name || "Vendor"}
                            </h1>
                            <span className="inline-flex items-center gap-1 bg-emerald-50 text-[#00AB66] border border-emerald-200 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                                <i className="fa fa-check-circle"></i> Verified Vendor
                            </span>
                        </div>
                        <p className="text-sm text-slate-500">
                            Monitor your submitted tender proposals, track evaluation outcomes, and discover new bidding opportunities.
                        </p>

                        <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-slate-600">
                            {vendor?.registration_number && (
                                <span className="flex items-center gap-1.5 bg-slate-100 px-2.5 py-1 rounded-md">
                                    <i className="fa fa-id-card-o text-slate-400"></i>
                                    Reg No: <strong className="text-slate-700">{vendor.registration_number}</strong>
                                </span>
                            )}
                            {vendor?.pan_number && (
                                <span className="flex items-center gap-1.5 bg-slate-100 px-2.5 py-1 rounded-md">
                                    <i className="fa fa-hashtag text-slate-400"></i>
                                    PAN: <strong className="text-slate-700">{vendor.pan_number}</strong>
                                </span>
                            )}
                            <span className="flex items-center gap-1.5 bg-amber-50 text-amber-800 border border-amber-200 px-2.5 py-1 rounded-md">
                                <i className="fa fa-star text-amber-500"></i>
                                Rating: <strong>{Number(vendor?.rating || 0).toFixed(1)} / 5.0</strong>
                                <span className="text-amber-600 font-normal">
                                    ({vendor?.rating_count || 0} reviews)
                                </span>
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 self-start md:self-auto">
                        <Link
                            href="/eoi"
                            className="inline-flex items-center gap-2 bg-[#00AB66] hover:bg-emerald-600 text-white text-xs font-semibold px-4 py-2.5 rounded-lg shadow-sm transition"
                        >
                            <i className="fa fa-search"></i>
                            Browse Open Tenders
                        </Link>
                    </div>
                </div>
            </div>

            {/* KPI Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {/* Total Applications */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                                Total Bids Submitted
                            </p>
                            <h3 className="text-2xl font-black text-slate-800 mt-1">
                                {stats.total_applications ?? 0}
                            </h3>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center text-lg">
                            <i className="fa fa-file-text-o"></i>
                        </div>
                    </div>
                    <div className="mt-3 flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
                        <span>All proposals</span>
                        <Link
                            href="/vendor/eois"
                            className="text-[#00AB66] font-semibold hover:underline"
                        >
                            View all &rarr;
                        </Link>
                    </div>
                </div>

                {/* Under Review */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-wider text-amber-500">
                                Under Evaluation
                            </p>
                            <h3 className="text-2xl font-black text-slate-800 mt-1">
                                {stats.pending_applications ?? 0}
                            </h3>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center text-lg">
                            <i className="fa fa-hourglass-half"></i>
                        </div>
                    </div>
                    <div className="mt-3 flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
                        <span>Awaiting evaluation</span>
                        <span className="text-amber-600 font-medium">Pending review</span>
                    </div>
                </div>

                {/* Awarded / Approved */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-wider text-emerald-600">
                                Awarded / Approved
                            </p>
                            <h3 className="text-2xl font-black text-slate-800 mt-1">
                                {stats.approved_applications ?? 0}
                            </h3>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#00AB66] flex items-center justify-center text-lg">
                            <i className="fa fa-check-circle-o"></i>
                        </div>
                    </div>
                    <div className="mt-3 flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
                        <span>Selected proposals</span>
                        <span className="text-[#00AB66] font-medium">Approved bids</span>
                    </div>
                </div>

                {/* Available Tenders */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-wider text-blue-500">
                                Active Open Tenders
                            </p>
                            <h3 className="text-2xl font-black text-slate-800 mt-1">
                                {stats.available_tenders ?? 0}
                            </h3>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-lg">
                            <i className="fa fa-bullhorn"></i>
                        </div>
                    </div>
                    <div className="mt-3 flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
                        <span>Accepting bids</span>
                        <Link href="/eoi" className="text-blue-600 font-semibold hover:underline">
                            Explore &rarr;
                        </Link>
                    </div>
                </div>
            </div>

            {/* Main Sections: Recent Applications & Open Opportunities */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Recent Applications (2 cols) */}
                <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 p-5">
                    <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
                        <div>
                            <h2 className="text-base font-bold text-slate-800">
                                Recent Applications
                            </h2>
                            <p className="text-xs text-slate-400">
                                Your most recently submitted proposals
                            </p>
                        </div>
                        <Link
                            href="/vendor/eois"
                            className="text-xs font-semibold text-[#00AB66] hover:underline"
                        >
                            View all applications &rarr;
                        </Link>
                    </div>

                    {recentApplications.length === 0 ? (
                        <div className="text-center py-10 text-slate-400">
                            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center text-lg mb-2">
                                <i className="fa fa-inbox"></i>
                            </div>
                            <p className="text-sm font-medium text-slate-600">No applications submitted yet</p>
                            <p className="text-xs text-slate-400 mt-1">Browse published tenders and submit your first bid.</p>
                            <Link
                                href="/eoi"
                                className="inline-block mt-3 bg-[#00AB66] hover:bg-emerald-600 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition"
                            >
                                Find Tenders
                            </Link>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <thead>
                                    <tr className="border-b border-slate-200 text-slate-400 font-semibold uppercase">
                                        <th className="pb-3">Tender / EOI</th>
                                        <th className="pb-3">Applied Date</th>
                                        <th className="pb-3">Quoted Amount</th>
                                        <th className="pb-3">Status</th>
                                        <th className="pb-3 text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {recentApplications.map((app) => {
                                        const totalAmt = calculateTotal(app.proposals);
                                        const statusColor =
                                            app.status === "approved"
                                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                                : app.status === "rejected"
                                                ? "bg-rose-50 text-rose-700 border-rose-200"
                                                : "bg-amber-50 text-amber-700 border-amber-200";

                                        return (
                                            <tr key={app.id} className="hover:bg-slate-50/70 transition">
                                                <td className="py-3 pr-2">
                                                    <Link
                                                        href={`/eoi/${app.eoi?.id}`}
                                                        className="font-bold text-slate-800 hover:text-[#00AB66] transition block"
                                                    >
                                                        {app.eoi?.title || "Tender"}
                                                    </Link>
                                                    <span className="text-[10px] text-slate-400">
                                                        #{app.eoi?.eoi_number}
                                                    </span>
                                                </td>
                                                <td className="py-3 text-slate-600">
                                                    {app.application_date || "—"}
                                                </td>
                                                <td className="py-3 font-semibold text-slate-700">
                                                    {totalAmt > 0
                                                        ? `Rs. ${totalAmt.toLocaleString()}`
                                                        : "—"}
                                                </td>
                                                <td className="py-3">
                                                    <span
                                                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${statusColor}`}
                                                    >
                                                        {app.status}
                                                    </span>
                                                </td>
                                                <td className="py-3 text-right">
                                                    <Link
                                                        href="/vendor/eois"
                                                        className="text-xs font-semibold text-slate-600 hover:text-[#00AB66] bg-slate-100 hover:bg-emerald-50 px-2.5 py-1 rounded transition"
                                                    >
                                                        Details
                                                    </Link>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Open Opportunities for You (1 col) */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
                    <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
                        <div>
                            <h2 className="text-base font-bold text-slate-800">
                                Open Tenders
                            </h2>
                            <p className="text-xs text-slate-400">
                                Ready for bids and quotations
                            </p>
                        </div>
                        <Link
                            href="/eoi"
                            className="text-xs font-semibold text-[#00AB66] hover:underline"
                        >
                            Browse all &rarr;
                        </Link>
                    </div>

                    {openEois.length === 0 ? (
                        <div className="text-center py-8 text-slate-400">
                            <p className="text-xs">No open tenders at this moment.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {openEois.map((eoi) => {
                                const hasApplied = appliedEoiIds.includes(eoi.id);
                                const daysLeft = getDaysRemaining(eoi.deadline_date);

                                return (
                                    <div
                                        key={eoi.id}
                                        className="p-3.5 rounded-lg border border-slate-200 hover:border-emerald-300 hover:shadow-sm transition bg-slate-50/50"
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <div>
                                                <Link
                                                    href={`/eoi/${eoi.id}`}
                                                    className="text-xs font-bold text-slate-800 hover:text-[#00AB66] transition line-clamp-1"
                                                >
                                                    {eoi.title}
                                                </Link>
                                                <span className="text-[10px] text-slate-400">
                                                    #{eoi.eoi_number} &bull; {eoi.purchase_request_items_count || 0} item(s)
                                                </span>
                                            </div>

                                            {daysLeft !== null && (
                                                <span
                                                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap ${
                                                        daysLeft <= 3
                                                            ? "bg-rose-100 text-rose-700"
                                                            : "bg-slate-200 text-slate-700"
                                                    }`}
                                                >
                                                    {daysLeft <= 0 ? "Deadline Today" : `${daysLeft}d left`}
                                                </span>
                                            )}
                                        </div>

                                        <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-200/60">
                                            <span className="text-[11px] text-slate-500">
                                                Deadline: {eoi.deadline_date}
                                            </span>

                                            {hasApplied ? (
                                                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                                                    <i className="fa fa-check"></i> Applied
                                                </span>
                                            ) : (
                                                <Link
                                                    href={`/vendor/eoi/apply/${eoi.id}`}
                                                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-white bg-[#00AB66] hover:bg-emerald-600 px-2.5 py-1 rounded transition shadow-xs"
                                                >
                                                    Apply &rarr;
                                                </Link>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </VendorLayout>
    );
}