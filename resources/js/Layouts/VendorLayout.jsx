
import VendorSidebar from '@/Components/Layout/VendorSidebar';
import Layout from './Layout';

export default function VendorLayout({ header, children }) {
    return (
        <Layout>
            <div className="min-h-screen bg-gray-200">
                <div className="flex">
                    <div className='min-w-1/6 w-1/6 bg-white'>
                        <VendorSidebar />
                    </div>
                    <main className='mx-5 mt-4 w-5/6'>{children}</main>
                </div>
            </div>
        </Layout>
    );
}
