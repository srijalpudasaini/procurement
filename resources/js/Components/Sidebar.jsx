import { Link, usePage } from "@inertiajs/react"

export default function Sidebar() {
    const { auth } = usePage().props;
    const userPermissions = auth?.permissions || [];
    // const userRole = auth?.role || "";

    const hasPermission = (permission) => userPermissions.includes(permission);
    console.log(auth)

    return (
        <aside className="bg-white h-screen">
            <ul>
                <li className="border-b border-b-gray-300"><Link className="p-2 px-4 block" href="/dashboard">Dashboard</Link></li>
                <li className="border-b border-b-gray-300"><Link className="p-2 px-4 block" href="/">Requests</Link></li>
                {hasPermission('manage_users') &&
                    <li className="border-b border-b-gray-300"><Link className="p-2 px-4 block" href="/">Users</Link></li>
                }
                {hasPermission('manage_eoi') &&
                    <li className="border-b border-b-gray-300"><Link className="p-2 px-4 block" href="/">EOI</Link></li>
                }
                {hasPermission('manage_products') &&
                    <li className="border-b border-b-gray-300"><Link className="p-2 px-4 block" href="/">Products</Link></li>
                }
                {hasPermission('manage_categories') &&
                    <li className="border-b border-b-gray-300"><Link className="p-2 px-4 block" href="/">Categories</Link></li>
                }
                {hasPermission('manage_approvals') &&
                    <li className="border-b border-b-gray-300"><Link className="p-2 px-4 block" href="/">Approvals</Link></li>
                }
            </ul>
        </aside>
    )
}