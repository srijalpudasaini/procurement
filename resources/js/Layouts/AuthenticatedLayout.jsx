
import { Link, usePage } from '@inertiajs/react';
import { useState } from 'react';
import Layout from './Layout';
import Sidebar from '@/Components/Sidebar';

export default function AuthenticatedLayout({ header, children }) {

    const [showingNavigationDropdown, setShowingNavigationDropdown] =
        useState(false);

    return (
        <Layout>
            <div className="min-h-screen bg-gray-300">
                <div className="flex">
                    <div className='w-1/6'>
                        <Sidebar />
                    </div>
                    <main>{children}</main>
                </div>
            </div>
        </Layout>
    );
}
