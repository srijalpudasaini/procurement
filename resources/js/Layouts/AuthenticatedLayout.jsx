
import Layout from './Layout';
import Sidebar from '@/Components/Layout/Sidebar';

export default function AuthenticatedLayout({ header, children }) {
    return (
        <Layout>
            <div className="min-h-screen bg-gray-200">
                <div className="flex">
                    <div className='w-1/6 bg-white'>
                        <Sidebar />
                    </div>
                    <main className='flex-grow mx-5 mt-4'>{children}</main>
                </div>
            </div>
        </Layout>
    );
}
