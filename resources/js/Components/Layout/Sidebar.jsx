import { Link, usePage } from "@inertiajs/react"

export default function Sidebar() {
    const { auth } = usePage().props;
    const userPermissions = auth?.user?.permissions || [];

    const hasPermission = (permission) => userPermissions.includes(permission);

    return (
        <aside className="bg-white h-screen sticky top-0 overflow-y-auto">
            <ul>
                <li className="border-b border-b-gray-300"><Link className="p-2 px-4 block" href="/dashboard">Dashboard</Link></li>
                {hasPermission('view_request') &&
                    <li className="border-b border-b-gray-300"><Link className="p-2 px-4 block" href="/requests">Requests</Link></li>
                }
                {hasPermission('view_role') &&
                    <li className="border-b border-b-gray-300"><Link className="p-2 px-4 block" href="/roles">Roles</Link></li>
                }
                {hasPermission('view_user') &&
                    <li className="border-b border-b-gray-300"><Link className="p-2 px-4 block" href="/users">Users</Link></li>
                }
                {hasPermission('view_eoi') &&
                    <li className="border-b border-b-gray-300"><Link className="p-2 px-4 block" href="/eois">EOI</Link></li>
                }
                {hasPermission('view_product') &&
                    <li className="border-b border-b-gray-300"><Link className="p-2 px-4 block" href="/products">Products</Link></li>
                }
                {hasPermission('view_category') &&
                    <li className="border-b border-b-gray-300"><Link className="p-2 px-4 block" href="/categories">Categories</Link></li>
                }
                {hasPermission('view_document') &&
                    <li className="border-b border-b-gray-300"><Link className="p-2 px-4 block" href="/documents">Documents</Link></li>
                } 
                {/* {hasPermission('manage_approvals') &&
                    <li className="border-b border-b-gray-300"><Link className="p-2 px-4 block" href="/">Approvals</Link></li>
                } */}
            </ul>
        </aside>
    )
}