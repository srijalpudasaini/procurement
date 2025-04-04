import { Link, usePage } from "@inertiajs/react";
import Dropdown from "../Dropdown";

export default function Header() {
    const { auth } = usePage().props;
    return (
        <header className="py-3 bg-[#00AB66]">
            <div className="container">
                <div className="flex justify-between items-center">
                    <div className="logo">
                        <h1 className="text-white text-xl letter tracking-wider font-bold">Procurement</h1>
                    </div>
                    <nav>
                        <ul className="flex gap-12 items-center">
                            <li><Link href="/eoi" className="text-white">Home</Link></li>
                            <li><Link href="/eoi" className="text-white">About</Link></li>
                            <li><Link href="/eoi" className="text-white">EOI</Link></li>
                            {
                                auth.user || auth.vendor ?
                                    <li>
                                        <Dropdown>
                                            <Dropdown.Trigger>
                                                <span className="inline-flex rounded-md">
                                                    <button
                                                        type="button"
                                                        className="inline-flex items-center rounded-md border border-transparent bg-white px-3 py-2 text-sm font-medium leading-4 text-gray-500 transition duration-150 ease-in-out hover:text-gray-700 focus:outline-none"
                                                    >
                                                        {auth.user?.name || auth.vendor?.name}

                                                        <svg
                                                            className="-me-0.5 ms-2 h-4 w-4"
                                                            xmlns="http://www.w3.org/2000/svg"
                                                            viewBox="0 0 20 20"
                                                            fill="currentColor"
                                                        >
                                                            <path
                                                                fillRule="evenodd"
                                                                d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                                                                clipRule="evenodd"
                                                            />
                                                        </svg>
                                                    </button>
                                                </span>
                                            </Dropdown.Trigger>

                                            <Dropdown.Content>
                                                <Dropdown.Link
                                                    href={auth.vendor ? '/vendor/dashboard' : '/dashboard'}
                                                >
                                                    Dashboard
                                                </Dropdown.Link>
                                                <Dropdown.Link
                                                    href={route('profile.edit')}
                                                >
                                                    Profile
                                                </Dropdown.Link>
                                                <Dropdown.Link
                                                    href={auth.vendor ? '/vendor/logout' : '/logout'}
                                                    method="post"
                                                    as="button"
                                                >
                                                    Log Out
                                                </Dropdown.Link>
                                            </Dropdown.Content>
                                        </Dropdown>
                                    </li>
                                    :
                                    <>
                                        {/* <li><Link href="/vendor/login" className="text-white">VendorLogin</Link></li> */}
                                        <li><Link href="/login" className="text-white">Login</Link></li>
                                    </>
                            }
                        </ul>
                    </nav>
                </div>
            </div>
        </header>
    )
}