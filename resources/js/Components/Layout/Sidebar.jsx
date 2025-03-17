import { Link, usePage } from "@inertiajs/react"

export default function Sidebar() {
    const { auth } = usePage().props;
    const userPermissions = auth?.permissions || [];
    // const userRole = auth?.role || "";

    const hasPermission = (permission) => userPermissions.includes(permission);

    return (
        <aside className="bg-white h-screen sticky top-0 overflow-y-auto">
            <ul>
                <li className="border-b border-b-gray-300"><Link className="p-2 px-4 block" href="/dashboard">Dashboard</Link></li>
                <li className="border-b border-b-gray-300"><Link className="p-2 px-4 block" href="/">Requests</Link></li>
                <li className="border-b border-b-gray-300"><Link className="p-2 px-4 block" href="/roles">Roles</Link></li>
                <li className="border-b border-b-gray-300"><Link className="p-2 px-4 block" href="/permissions">Permissions</Link></li>
                {/* {hasPermission('manage_users') && */}
                    <li className="border-b border-b-gray-300"><Link className="p-2 px-4 block" href="/users">Users</Link></li>
                {/*  } */}
                {hasPermission('manage_eoi') &&
                    <li className="border-b border-b-gray-300"><Link className="p-2 px-4 block" href="/">EOI</Link></li>
                }
                {/* {hasPermission('manage_products') && */}
                    <li className="border-b border-b-gray-300"><Link className="p-2 px-4 block" href="/products">Products</Link></li>
                {/* } */}
                {/* {hasPermission('manage_categories') && */}
                    <li className="border-b border-b-gray-300"><Link className="p-2 px-4 block" href="/categories">Categories</Link></li>
                {/* } */}
                {hasPermission('manage_approvals') &&
                    <li className="border-b border-b-gray-300"><Link className="p-2 px-4 block" href="/">Approvals</Link></li>
                }
            </ul>
        </aside>
    )
}