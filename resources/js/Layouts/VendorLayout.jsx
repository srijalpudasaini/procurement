
import VendorSidebar from "@/Components/Layout/VendorSidebar";
import Layout from "./Layout";

export default function VendorLayout({ header, children }) {
    return (
        <Layout>
            <div className="min-h-screen bg-slate-100 flex flex-col">
                <div className="flex flex-1">
                    {/* Fixed Width Left Sidebar */}
                    <div className="w-56 shrink-0 bg-white">
                        <VendorSidebar />
                    </div>

                    {/* Main Content Area */}
                    <main className="flex-1 p-6 overflow-x-hidden">
                        {header && (
                            <header className="bg-white shadow-sm rounded-xl p-4 mb-6 border border-slate-200">
                                {header}
                            </header>
                        )}
                        {children}
                    </main>
                </div>
            </div>
        </Layout>
    );
}
