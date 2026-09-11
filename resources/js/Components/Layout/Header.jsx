import { Link, usePage } from "@inertiajs/react";
import Dropdown from "../Dropdown";

export default function Header() {
    const { auth, url } = usePage().props;

    const isActive = (path) => {
        if (path === "/") {
            return window.location.pathname === "/";
        }
        return window.location.pathname.startsWith(path);
    };

    return (
        <header className="bg-[#00AB66] shadow-sm sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Brand Logo */}
                    <div className="flex items-center">
                        <Link
                            href={auth?.user ? "/dashboard" : "/"}
                            className="flex items-center gap-2.5 group"
                        >
                            <span className="w-9 h-9 rounded-xl bg-white/20 group-hover:bg-white/30 text-white flex items-center justify-center font-black text-lg transition shadow-sm">
                                P
                            </span>
                            <span className="text-white text-lg font-extrabold tracking-wide">
                                Procurement
                            </span>
                        </Link>
                    </div>

                    {/* Navigation Links */}
                    <nav>
                        <ul className="flex items-center gap-6 sm:gap-8">
                            <li>
                                <Link
                                    href="/"
                                    className={`text-sm font-medium transition py-1.5 px-3 rounded-lg ${
                                        isActive("/")
                                            ? "bg-white/20 text-white font-bold"
                                            : "text-white/90 hover:text-white hover:bg-white/10"
                                    }`}
                                >
                                    Home
                                </Link>
                            </li>

                            <li>
                                <Link
                                    href="/eoi"
                                    className={`text-sm font-medium transition py-1.5 px-3 rounded-lg ${
                                        isActive("/eoi")
                                            ? "bg-white/20 text-white font-bold"
                                            : "text-white/90 hover:text-white hover:bg-white/10"
                                    }`}
                                >
                                    Tenders & EOIs
                                </Link>
                            </li>

                            {auth?.user && (
                                <li>
                                    <Link
                                        href="/dashboard"
                                        className={`text-sm font-medium transition py-1.5 px-3 rounded-lg ${
                                            isActive("/dashboard")
                                                ? "bg-white/20 text-white font-bold"
                                                : "text-white/90 hover:text-white hover:bg-white/10"
                                        }`}
                                    >
                                        Dashboard
                                    </Link>
                                </li>
                            )}

                            {auth?.vendor && (
                                <li>
                                    <Link
                                        href="/vendor/dashboard"
                                        className={`text-sm font-medium transition py-1.5 px-3 rounded-lg ${
                                            isActive("/vendor/dashboard")
                                                ? "bg-white/20 text-white font-bold"
                                                : "text-white/90 hover:text-white hover:bg-white/10"
                                        }`}
                                    >
                                        Vendor Dashboard
                                    </Link>
                                </li>
                            )}

                            {/* Auth Dropdown or Login Buttons */}
                            {auth?.user || auth?.vendor ? (
                                <li className="ms-2">
                                    <Dropdown>
                                        <Dropdown.Trigger>
                                            <button
                                                type="button"
                                                className="inline-flex items-center gap-2 rounded-lg bg-white px-3.5 py-1.5 text-xs font-bold text-gray-800 transition shadow-sm hover:bg-gray-50 focus:outline-none"
                                            >
                                                <i className="fa fa-user-circle text-sm text-[#00AB66]"></i>
                                                <span>{auth.user?.name || auth.vendor?.name}</span>
                                                <i className="fa fa-caret-down text-gray-500 text-xs"></i>
                                            </button>
                                        </Dropdown.Trigger>

                                        <Dropdown.Content>
                                            <Dropdown.Link
                                                href={auth.vendor ? "/vendor/dashboard" : "/dashboard"}
                                            >
                                                Dashboard
                                            </Dropdown.Link>
                                            <Dropdown.Link href={route("profile.edit")}>
                                                Profile
                                            </Dropdown.Link>
                                            <Dropdown.Link
                                                href={auth.vendor ? "/vendor/logout" : "/logout"}
                                                method="post"
                                                as="button"
                                            >
                                                Log Out
                                            </Dropdown.Link>
                                        </Dropdown.Content>
                                    </Dropdown>
                                </li>
                            ) : (
                                <li className="flex items-center gap-2.5 ms-2">
                                    <Link
                                        href="/login"
                                        className="text-xs font-semibold text-white bg-white/15 hover:bg-white/25 px-3.5 py-2 rounded-lg transition"
                                    >
                                        Staff Login
                                    </Link>
                                    <Link
                                        href="/vendor-login"
                                        className="text-xs font-bold text-[#00AB66] bg-white hover:bg-gray-100 px-3.5 py-2 rounded-lg transition shadow-sm"
                                    >
                                        Vendor Login
                                    </Link>
                                </li>
                            )}
                        </ul>
                    </nav>
                </div>
            </div>
        </header>
    );
}