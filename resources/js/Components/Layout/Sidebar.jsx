import { Link, usePage } from "@inertiajs/react"

export default function Sidebar() {
    const { auth } = usePage().props;
    const userPermissions = auth?.permissions || [];

    const hasPermission = (permission) => userPermissions.includes(permission);

    return (
        <aside className="bg-white h-screen sticky top-0 overflow-y-auto">
            <ul>
                <li className="border-b border-b-gray-300"><Link className="p-2 px-4 block" href="/dashboard">Dashboard</Link></li>
                {hasPermission('create_request') &&
                    <li className="border-b border-b-gray-300"><Link className="p-2 px-4 block" href="/requests">Requests</Link></li>
                }
                {hasPermission('create_role') &&
                    <li className="border-b border-b-gray-300"><Link className="p-2 px-4 block" href="/roles">Roles</Link></li>
                }
                {hasPermission('create_user') &&
                    <li className="border-b border-b-gray-300"><Link className="p-2 px-4 block" href="/users">Users</Link></li>
                }
                {hasPermission('create_eoi') &&
                    <li className="border-b border-b-gray-300"><Link className="p-2 px-4 block" href="/">EOI</Link></li>
                }
                {hasPermission('create_product') &&
                    <li className="border-b border-b-gray-300"><Link className="p-2 px-4 block" href="/products">Products</Link></li>
                }
                {hasPermission('create_category') &&
                    <li className="border-b border-b-gray-300"><Link className="p-2 px-4 block" href="/categories">Categories</Link></li>
                }
                {hasPermission('manage_approvals') &&
                    <li className="border-b border-b-gray-300"><Link className="p-2 px-4 block" href="/">Approvals</Link></li>
                }
            </ul>
        </aside>
    )
}