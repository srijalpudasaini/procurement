import { Link, usePage } from "@inertiajs/react";

export default function VendorSidebar() {
    const { auth, url } = usePage().props;
    const vendor = auth?.vendor;

    const currentUrl = url || (typeof window !== "undefined" ? window.location.pathname : "");

    const isActive = (href) => {
        if (href === "/vendor/dashboard") {
            return currentUrl === "/vendor/dashboard";
        }
        return currentUrl.startsWith(href);
    };

    const navItems = [
        {
            name: "Dashboard",
            href: "/vendor/dashboard",
            icon: "fa-tachometer",
        },
        {
            name: "My Applications",
            href: "/vendor/eois",
            icon: "fa-file-text-o",
        },
        {
            name: "Browse Tenders",
            href: "/eoi",
            icon: "fa-bullhorn",
        },
    ];

    return (
        <aside className="bg-white border-r border-gray-200 min-h-screen sticky top-16 shadow-sm flex flex-col justify-between">
            <div className="py-4">
                <div className="px-4 mb-3">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                        Vendor Portal
                    </span>
                </div>

                <nav className="space-y-0.5">
                    {navItems.map((item) => {
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

            {/* Vendor Profile Info Footer */}
            {vendor && (
                <div className="p-4 border-t border-slate-100 bg-slate-50/70">
                    <div className="flex items-center gap-2.5 mb-1">
                        <div className="w-8 h-8 rounded-lg bg-emerald-100 text-[#00AB66] font-bold flex items-center justify-center text-xs">
                            {vendor.name ? vendor.name.charAt(0).toUpperCase() : "V"}
                        </div>
                        <div className="overflow-hidden">
                            <p className="text-xs font-bold text-slate-800 truncate">
                                {vendor.name}
                            </p>
                            <p className="text-[10px] text-slate-400 truncate">
                                {vendor.email}
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </aside>
    );
}