import { Link } from "@inertiajs/react"

export default function VendorSidebar() {

    return (
        <aside className="bg-white h-screen sticky top-0 overflow-y-auto">
            <ul>
                <li className="border-b border-b-gray-300"><Link className="p-2 px-4 block" href="/vendor/dashboard">Dashboard</Link></li>
                <li className="border-b border-b-gray-300"><Link className="p-2 px-4 block" href="/vendor/eois">EOI Applications</Link></li>
            </ul>
        </aside>
    )
}