import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link, usePage } from "@inertiajs/react";

export default function Dashboard({
    stats = {},
    recentRequests = [],
    recentEois = [],
    userRole = {},
}) {
    const { auth } = usePage().props;
    const user = auth?.user;
    const userPermissions = user?.permissions || [];

    const hasPermission = (perm) =>
        userPermissions.includes(perm) || !!user?.is_superadmin;

    // Determine user role label without assuming "employee"
    const getRoleLabel = () => {
        if (user?.is_superadmin) return "Super Administrator";
        if (user?.roles && user.roles.length > 0) {
            return user.roles
                .map((r) => r.charAt(0).toUpperCase() + r.slice(1))
                .join(", ");
        }
        if (userRole.can_approve) return "Approver / Manager";
        if (userRole.can_manage_eoi) return "Procurement Officer";
        return "Staff / User";
    };

    return (
        <AuthenticatedLayout>
            <Head title="Dashboard | Procurement System" />

            <div className="space-y-6">
                {/* Header Profile & Quick Action Bar */}
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                                {getRoleLabel()}
                            </span>
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900">
                            Welcome, {user?.name || "User"}
                        </h1>
                        <p className="text-xs text-gray-500 mt-0.5">
                            Procurement management dashboard & activity overview.
                        </p>
                    </div>

                    {/* Contextual Action Buttons based on permissions */}
                    <div className="flex items-center gap-2.5 flex-wrap">
                        {hasPermission("create_request") && (
                            <Link
                                href="/requests/create"
                                className="px-3.5 py-2 rounded-lg bg-[#00AB66] hover:bg-emerald-600 text-white text-xs font-semibold shadow-sm transition flex items-center gap-1.5"
                            >
                                <i className="fa fa-plus text-xs"></i>
                                <span>New Request</span>
                            </Link>
                        )}

                        {userRole.can_manage_eoi && (
                            <Link
                                href="/eois/publish"
                                className="px-3.5 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold transition flex items-center gap-1.5"
                            >
                                <i className="fa fa-bullhorn text-xs text-gray-500"></i>
                                <span>Publish EOI</span>
                            </Link>
                        )}

                        {(hasPermission("view_workflow") || hasPermission("view_report")) && (
                            <Link
                                href="/reports"
                                className="px-3.5 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold transition flex items-center gap-1.5"
                            >
                                <i className="fa fa-bar-chart text-xs text-gray-500"></i>
                                <span>Reports</span>
                            </Link>
                        )}
                    </div>
                </div>

                {/* Overall KPI Metrics Cards - Rendered dynamically based on View Permissions */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                    {/* 1. Purchase Requisitions Card */}
                    {(hasPermission("view_all_request") || hasPermission("view_request")) && (
                        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between">
                            <div>
                                <div className="flex justify-between items-center">
                                    <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
                                        {hasPermission("view_all_request") ? "Purchase Requisitions (Org)" : "My Requisitions"}
                                    </span>
                                    <span className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center text-sm">
                                        <i className="fa fa-file-text-o"></i>
                                    </span>
                                </div>
                                <div className="text-2xl font-extrabold text-gray-900 mt-2">
                                    {hasPermission("view_all_request") ? (stats.total_requests ?? 0) : (stats.my_total_requests ?? 0)}
                                </div>
                            </div>
                            <div className="text-xs text-gray-500 mt-3 pt-2.5 border-t border-gray-100 flex items-center justify-between">
                                <div className="flex gap-2.5">
                                    <span className="text-amber-600 font-semibold">
                                        {hasPermission("view_all_request") ? (stats.pending_requests ?? 0) : (stats.my_pending_requests ?? 0)} Pending
                                    </span>
                                    <span className="text-emerald-600 font-semibold">
                                        {hasPermission("view_all_request") ? (stats.approved_requests ?? 0) : (stats.my_approved_requests ?? 0)} Approved
                                    </span>
                                </div>
                                <Link
                                    href="/requests"
                                    className="text-xs font-semibold text-[#00AB66] hover:underline"
                                >
                                    View &rarr;
                                </Link>
                            </div>
                        </div>
                    )}

                    {/* 2. Overall Tenders / EOIs Card */}
                    {hasPermission("view_eoi") && (
                        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between">
                            <div>
                                <div className="flex justify-between items-center">
                                    <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
                                        Active Tenders (EOI)
                                    </span>
                                    <span className="w-8 h-8 rounded-lg bg-emerald-50 text-[#00AB66] flex items-center justify-center text-sm">
                                        <i className="fa fa-bullhorn"></i>
                                    </span>
                                </div>
                                <div className="text-2xl font-extrabold text-emerald-700 mt-2">
                                    {stats.active_eois ?? 0}
                                </div>
                            </div>
                            <div className="text-xs text-gray-500 mt-3 pt-2.5 border-t border-gray-100 flex items-center justify-between">
                                <span>
                                    <strong className="text-gray-700">{stats.closed_eois ?? 0}</strong> Closed / Evaluating
                                </span>
                                <Link
                                    href="/eois"
                                    className="text-xs font-semibold text-[#00AB66] hover:underline"
                                >
                                    View &rarr;
                                </Link>
                            </div>
                        </div>
                    )}

                    {/* 3. Overall Registered Suppliers / Vendors Card */}
                    {(hasPermission("view_user") ||
                        hasPermission("view_role") ||
                        hasPermission("view_submissions_eoi") ||
                        hasPermission("view_workflow")) && (
                            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between">
                                <div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
                                            Registered Suppliers
                                        </span>
                                        <span className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center text-sm">
                                            <i className="fa fa-building-o"></i>
                                        </span>
                                    </div>
                                    <div className="text-2xl font-extrabold text-teal-700 mt-2">
                                        {stats.total_vendors ?? 0}
                                    </div>
                                </div>
                                <div className="text-xs text-gray-400 mt-3 pt-2.5 border-t border-gray-100 flex items-center justify-between">
                                    <span>Verified vendor accounts</span>
                                    <span className="text-teal-600 font-semibold">Active</span>
                                </div>
                            </div>
                        )}

                    {/* 4. Products in Catalog Card */}
                    {hasPermission("view_product") && (
                        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between">
                            <div>
                                <div className="flex justify-between items-center">
                                    <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
                                        Product Catalog
                                    </span>
                                    <span className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center text-sm">
                                        <i className="fa fa-cubes"></i>
                                    </span>
                                </div>
                                <div className="text-2xl font-extrabold text-indigo-700 mt-2">
                                    {stats.total_products ?? 0}
                                </div>
                            </div>
                            <div className="text-xs text-gray-400 mt-3 pt-2.5 border-t border-gray-100 flex items-center justify-between">
                                <span>Catalog items & specs</span>
                                <Link
                                    href="/products"
                                    className="text-xs font-semibold text-indigo-600 hover:underline"
                                >
                                    Manage &rarr;
                                </Link>
                            </div>
                        </div>
                    )}

                    {/* 5. Product Categories Card */}
                    {hasPermission("view_category") && (
                        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between">
                            <div>
                                <div className="flex justify-between items-center">
                                    <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
                                        Product Categories
                                    </span>
                                    <span className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center text-sm">
                                        <i className="fa fa-tags"></i>
                                    </span>
                                </div>
                                <div className="text-2xl font-extrabold text-purple-700 mt-2">
                                    {stats.total_categories ?? 0}
                                </div>
                            </div>
                            <div className="text-xs text-gray-400 mt-3 pt-2.5 border-t border-gray-100 flex items-center justify-between">
                                <span>Classification groups</span>
                                <Link
                                    href="/categories"
                                    className="text-xs font-semibold text-purple-600 hover:underline"
                                >
                                    Manage &rarr;
                                </Link>
                            </div>
                        </div>
                    )}

                    {/* 6. Approval Workflows Card */}
                    {hasPermission("view_workflow") && (
                        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between">
                            <div>
                                <div className="flex justify-between items-center">
                                    <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
                                        Approval Workflows
                                    </span>
                                    <span className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center text-sm">
                                        <i className="fa fa-sitemap"></i>
                                    </span>
                                </div>
                                <div className="text-2xl font-extrabold text-amber-700 mt-2">
                                    {stats.total_workflows ?? 0}
                                </div>
                            </div>
                            <div className="text-xs text-gray-400 mt-3 pt-2.5 border-t border-gray-100 flex items-center justify-between">
                                <span>Tiered budget chains</span>
                                <Link
                                    href="/approval-workflows"
                                    className="text-xs font-semibold text-amber-600 hover:underline"
                                >
                                    Configure &rarr;
                                </Link>
                            </div>
                        </div>
                    )}

                    {/* 7. My Requisitions (Personal Submissions Overview) */}
                    {hasPermission("create_request") && (
                        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between">
                            <div>
                                <div className="flex justify-between items-center">
                                    <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
                                        My Requisitions
                                    </span>
                                    <span className="w-8 h-8 rounded-lg bg-emerald-50 text-[#00AB66] flex items-center justify-center text-sm">
                                        <i className="fa fa-user-circle-o"></i>
                                    </span>
                                </div>
                                <div className="text-2xl font-extrabold text-gray-900 mt-2">
                                    {stats.my_total_requests ?? 0}
                                </div>
                            </div>
                            <div className="text-xs text-gray-500 mt-3 pt-2.5 border-t border-gray-100 flex items-center justify-between">
                                <div className="flex gap-2.5">
                                    <span className="text-amber-600 font-semibold">
                                        {stats.my_pending_requests ?? 0} Pending
                                    </span>
                                    <span className="text-emerald-600 font-semibold">
                                        {stats.my_approved_requests ?? 0} Approved
                                    </span>
                                </div>
                                <Link
                                    href="/requests"
                                    className="text-xs font-semibold text-[#00AB66] hover:underline"
                                >
                                    Mine &rarr;
                                </Link>
                            </div>
                        </div>
                    )}
                </div>

                {/* Activity Tables Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Left Column: Purchase Requisitions (Organization or Personal depending on view_request permission) */}
                    {(hasPermission("view_all_request") || hasPermission("view_request") || hasPermission("create_request")) && (
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                            <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                                <div>
                                    <h3 className="text-sm font-bold text-gray-800">
                                        {hasPermission("view_all_request")
                                            ? "Recent Purchase Requisitions"
                                            : "My Recent Requisitions"}
                                    </h3>
                                    <p className="text-[11px] text-gray-500">
                                        {hasPermission("view_all_request")
                                            ? "Latest requisitions across the organization"
                                            : "Track the status of your submitted requests"}
                                    </p>
                                </div>
                                <Link
                                    href="/requests"
                                    className="text-xs font-semibold text-[#00AB66] hover:text-emerald-700"
                                >
                                    View All →
                                </Link>
                            </div>

                            <div className="divide-y divide-gray-100">
                                {recentRequests.length > 0 ? (
                                    recentRequests.map((req) => (
                                        <div
                                            key={req.id}
                                            className="p-3.5 px-4 flex items-center justify-between hover:bg-gray-50 transition"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-gray-100 text-gray-700 flex items-center justify-center font-bold text-xs">
                                                    #{req.id}
                                                </div>
                                                <div>
                                                    <div className="text-xs font-bold text-gray-900">
                                                        {req.user?.name || "Requester"}
                                                    </div>
                                                    <div className="text-[11px] text-gray-400">
                                                        {new Date(req.created_at).toLocaleDateString()}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="text-right">
                                                <div className="text-xs font-bold text-gray-900 font-mono">
                                                    ${Number(req.total).toLocaleString()}
                                                </div>
                                                <span
                                                    className={`inline-block text-[10px] font-bold uppercase px-2 py-0.5 rounded-full mt-0.5 ${req.status === "approved"
                                                        ? "bg-emerald-100 text-emerald-800"
                                                        : req.status === "rejected"
                                                            ? "bg-red-100 text-red-800"
                                                            : "bg-amber-100 text-amber-800"
                                                        }`}
                                                >
                                                    {req.status}
                                                </span>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="p-8 text-center text-gray-400 text-xs">
                                        No purchase requisitions found.
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Right Column: Recent EOIs */}
                    {(hasPermission("view_eoi") || user?.is_superadmin) && (
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                            <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                                <div>
                                    <h3 className="text-sm font-bold text-gray-800">
                                        Expressions of Interest (EOI)
                                    </h3>
                                    <p className="text-[11px] text-gray-500">
                                        Active tender bidding notices and deadlines
                                    </p>
                                </div>
                                <Link
                                    href="/eois"
                                    className="text-xs font-semibold text-[#00AB66] hover:text-emerald-700"
                                >
                                    View All →
                                </Link>
                            </div>

                            <div className="divide-y divide-gray-100">
                                {recentEois.length > 0 ? (
                                    recentEois.map((eoi) => (
                                        <div
                                            key={eoi.id}
                                            className="p-3.5 px-4 flex items-center justify-between hover:bg-gray-50 transition"
                                        >
                                            <div className="max-w-[65%]">
                                                <div className="text-xs font-bold text-gray-900 truncate">
                                                    {eoi.title}
                                                </div>
                                                <div className="text-[11px] text-gray-400 mt-0.5">
                                                    Deadline: {eoi.deadline_date}
                                                </div>
                                            </div>

                                            <div className="text-right">
                                                <span
                                                    className={`inline-block text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${eoi.status === "published"
                                                        ? "bg-emerald-100 text-emerald-800"
                                                        : "bg-gray-100 text-gray-700"
                                                        }`}
                                                >
                                                    {eoi.status}
                                                </span>
                                                {typeof eoi.eoi_vendor_applications_count !== "undefined" && (
                                                    <div className="text-[10px] text-gray-400 mt-0.5">
                                                        {eoi.eoi_vendor_applications_count} Bids Submitted
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="p-8 text-center text-gray-400 text-xs">
                                        No active EOIs currently.
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Administration Shortcuts - Only for Authorized Roles */}
                {(user?.is_superadmin ||
                    hasPermission("view_workflow") ||
                    hasPermission("view_product") ||
                    hasPermission("view_document") ||
                    hasPermission("view_user") ||
                    hasPermission("view_category")) && (
                        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">
                                Quick Management Shortcuts
                            </h3>
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                                {hasPermission("view_workflow") && (
                                    <Link
                                        href="/approval-workflows"
                                        className="p-3 rounded-lg border border-gray-200 hover:border-emerald-300 hover:bg-emerald-50/50 transition text-center"
                                    >
                                        <i className="fa fa-sitemap text-lg text-[#00AB66] mb-1.5 block"></i>
                                        <div className="text-xs font-bold text-gray-800">Workflows</div>
                                        <div className="text-[10px] text-gray-400">Budget thresholds</div>
                                    </Link>
                                )}

                                {hasPermission("view_product") && (
                                    <Link
                                        href="/products"
                                        className="p-3 rounded-lg border border-gray-200 hover:border-emerald-300 hover:bg-emerald-50/50 transition text-center"
                                    >
                                        <i className="fa fa-cubes text-lg text-[#00AB66] mb-1.5 block"></i>
                                        <div className="text-xs font-bold text-gray-800">Catalog</div>
                                        <div className="text-[10px] text-gray-400">Items & specs</div>
                                    </Link>
                                )}

                                {hasPermission("view_category") && (
                                    <Link
                                        href="/categories"
                                        className="p-3 rounded-lg border border-gray-200 hover:border-emerald-300 hover:bg-emerald-50/50 transition text-center"
                                    >
                                        <i className="fa fa-tags text-lg text-[#00AB66] mb-1.5 block"></i>
                                        <div className="text-xs font-bold text-gray-800">Categories</div>
                                        <div className="text-[10px] text-gray-400">Item groups</div>
                                    </Link>
                                )}

                                {hasPermission("view_document") && (
                                    <Link
                                        href="/documents"
                                        className="p-3 rounded-lg border border-gray-200 hover:border-emerald-300 hover:bg-emerald-50/50 transition text-center"
                                    >
                                        <i className="fa fa-folder-open-o text-lg text-[#00AB66] mb-1.5 block"></i>
                                        <div className="text-xs font-bold text-gray-800">Documents</div>
                                        <div className="text-[10px] text-gray-400">Compliance checklist</div>
                                    </Link>
                                )}

                                {hasPermission("view_user") && (
                                    <Link
                                        href="/users"
                                        className="p-3 rounded-lg border border-gray-200 hover:border-emerald-300 hover:bg-emerald-50/50 transition text-center"
                                    >
                                        <i className="fa fa-users text-lg text-[#00AB66] mb-1.5 block"></i>
                                        <div className="text-xs font-bold text-gray-800">Users</div>
                                        <div className="text-[10px] text-gray-400">Staff accounts</div>
                                    </Link>
                                )}

                                {hasPermission("view_role") && (
                                    <Link
                                        href="/roles"
                                        className="p-3 rounded-lg border border-gray-200 hover:border-emerald-300 hover:bg-emerald-50/50 transition text-center"
                                    >
                                        <i className="fa fa-shield text-lg text-[#00AB66] mb-1.5 block"></i>
                                        <div className="text-xs font-bold text-gray-800">Roles</div>
                                        <div className="text-[10px] text-gray-400">Permissions matrix</div>
                                    </Link>
                                )}
                            </div>
                        </div>
                    )}
            </div>
        </AuthenticatedLayout>
    );
}
