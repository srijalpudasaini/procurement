import { Link, usePage } from "@inertiajs/react";

export default function Sidebar() {
    const { auth } = usePage().props;
    const userPermissions = auth?.user?.permissions || [];

    const hasPermission = (permission) =>
        userPermissions.includes(permission) || !!auth?.user?.is_superadmin;

    const currentPath = typeof window !== "undefined" ? window.location.pathname : "";

    const isActive = (href) => {
        if (href === "/dashboard") {
            return currentPath === "/dashboard";
        }
        return currentPath.startsWith(href);
    };

    const navItems = [
        {
            name: "Dashboard",
            href: "/dashboard",
            icon: "fa-tachometer",
            visible: true,
        },
        {
            name: "Purchase Requests",
            href: "/requests",
            icon: "fa-file-text-o",
            visible: hasPermission("view_request"),
        },
        {
            name: "EOI Tenders",
            href: "/eois",
            icon: "fa-bullhorn",
            visible: hasPermission("view_eoi"),
        },
        {
            name: "Evaluation Reports",
            href: "/reports",
            icon: "fa-bar-chart",
            visible: hasPermission("view_workflow"),
        },
        {
            name: "Approval Workflows",
            href: "/approval-workflows",
            icon: "fa-sitemap",
            visible: hasPermission("view_workflow"),
        },
        {
            name: "Products Catalog",
            href: "/products",
            icon: "fa-cubes",
            visible: hasPermission("view_product"),
        },
        {
            name: "Categories",
            href: "/categories",
            icon: "fa-tags",
            visible: hasPermission("view_category"),
        },
        {
            name: "Required Documents",
            href: "/documents",
            icon: "fa-folder-open-o",
            visible: hasPermission("view_document"),
        },
        {
            name: "User Accounts",
            href: "/users",
            icon: "fa-users",
            visible: hasPermission("view_user"),
        },
        {
            name: "Roles & Permissions",
            href: "/roles",
            icon: "fa-shield",
            visible: hasPermission("view_role"),
        },
    ];

    return (
        <aside className="bg-white border-r border-gray-200 min-h-screen sticky top-16 shadow-sm">
            <div className="py-4">
                <div className="px-4 mb-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                        Menu
                    </span>
                </div>

                <nav className="space-y-0.5">
                    {navItems
                        .filter((item) => item.visible)
                        .map((item) => {
                            const active = isActive(item.href);
                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    className={`flex items-center gap-3 px-4 py-2.5 text-xs font-medium transition duration-150 ${
                                        active
                                            ? "bg-emerald-50 text-emerald-800 font-bold border-r-4 border-[#00AB66]"
                                            : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                                    }`}
                                >
                                    <span
                                        className={`w-5 text-center text-sm ${
                                            active ? "text-[#00AB66]" : "text-gray-400"
                                        }`}
                                    >
                                        <i className={`fa ${item.icon}`}></i>
                                    </span>
                                    <span>{item.name}</span>
                                </Link>
                            );
                        })}
                </nav>
            </div>
        </aside>
    );
}