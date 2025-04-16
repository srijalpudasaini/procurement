import Breadcrumb from '@/Components/ui/Breadcrumb'
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import { router } from '@inertiajs/react';
import React, { useEffect, useState } from 'react'

const EOI = ({ results }) => {
    const urlParams = new URLSearchParams(window.location.search);

    const params = {};

    urlParams.forEach((value, key) => {
        params[key] = value;
    });

    const [filters, setFilters] = useState({
        status: params.status || '',
        startDate: params.startDate || '',
        endDate: params.endDate || '',
        minTotal: params.minTotal || '',
        maxTotal: params.maxTotal || '',
    })
    const [isInitialLoad, setIsInitialLoad] = useState(true);

    useEffect(() => {
        if (isInitialLoad) {
            setIsInitialLoad(false);
            return;
        }
        setTimeout(() => {
            router.get('/reports', filters);
        }, 1000)
    }, [filters])

    const breadCrumbItems = [
        {
            title: 'Dashboard',
            href: '/dashboard'
        },
        {
            title: 'EOI Report',
        }
    ]
    return (
        <AuthenticatedLayout>
            <Breadcrumb items={breadCrumbItems} />
            <div className="bg-white p-4 shadow sm:rounded-lg sm:p-8">
                <h2 className="text-center text-2xl font-bold">EOI</h2>
                <h3 className="text-lg font-semibold border-b pb-2">Filters</h3>
                <div className="flex justify-between gap-y-4 mt-4 flex-wrap">
                    <div className='w-1/2'>
                        <h3 className="text-base font-semibold mb-1">EOI status</h3>
                        <select
                            className='py-1 px-3 border rounded-md w-64'
                            value={filters.status}
                            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                        >
                            <option value="">Any</option>
                            <option value="published">Published</option>
                            <option value="closed">Closed</option>
                        </select>
                    </div>
                    <div className='w-1/2'>
                        <h3 className="text-base font-semibold mb-1">EOI published Date Range</h3>
                        <input
                            type="date"
                            className='py-1 px-3 border rounded-md w-64'
                            value={filters.startDate}
                            onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                        />
                        <span className='mx-2'>-</span>
                        <input
                            type="date"
                            className='py-1 px-3 border rounded-md w-64'
                            value={filters.endDate}
                            onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                        />
                    </div>
                    <div className='w-1/2'>
                        <h3 className="text-base font-semibold mb-1">EOI price range</h3>
                        <input
                            type="number"
                            className='py-1 px-3 border rounded-md w-64'
                            value={filters.minTotal}
                            onChange={(e) => setFilters({ ...filters, minTotal: e.target.value })}
                        />
                        <span className='mx-2'>-</span>
                        <input
                            type="number"
                            className='py-1 px-3 border rounded-md w-64'
                            value={filters.maxTotal}
                            onChange={(e) => setFilters({ ...filters, maxTotal: e.target.value })}
                        />

                    </div>
                </div>
                <div className="overflow-x-auto scrollbar-none">
                    <table className='border text-center mt-4 whitespace-nowrap max-w-full'>
                        {/* <thead> */}
                            <tr className='bg-green-600 text-white'>
                                <th className='p-1'>EOI</th>
                                <th className='p-1'>Published Date</th>
                                <th className='p-1'>Deadline Date</th>
                                <th className='p-1'>Total Products</th>
                                <th className='p-1'>Total Applications</th>
                                <th className='p-1'>Details</th>
                            </tr>
                        {/* </thead> */}
                        {/* <tbody> */}
                            {results.map((result, index) => {
                                // Collect unique vendors for this EOI across all products
                                const uniqueVendors = [];
                                result.products.forEach(product => {
                                    product.vendor_submissions?.forEach(submission => {
                                        if (!uniqueVendors.find(v => v.vendor_id === submission.vendor_id)) {
                                            uniqueVendors.push({
                                                vendor_id: submission.vendor_id,
                                                vendor_name: submission.vendor_name,
                                            });
                                        }
                                    });
                                });

                                return (
                                    <tr key={index}>
                                        <td className='p-1 min-w-32 border border-gray-500'>
                                            {result.eoi_title}
                                        </td>
                                        <td className='p-1 min-w-32 border border-gray-500'>
                                            {result.published_date}
                                        </td>
                                        <td className='p-1 min-w-32 border border-gray-500'>
                                            {result.deadline_date}
                                        </td>
                                        <td className='p-1 min-w-32 border border-gray-500'>
                                            {result.product_count}
                                        </td>
                                        <td className='p-1 min-w-32 border border-gray-500'>
                                            {result.application_count || 0}
                                        </td>
                                        <td className='p-0 border border-gray-500'>
                                            <div className="cell-row">
                                                {/* Header Row */}
                                                <div className="flex min-w-max">
                                                    <div className="cell w-32 border border-gray-300 p-1 font-bold">Products</div>
                                                    <div className="cell w-32 border border-gray-300 p-1 font-bold">Request Price</div>
                                                    <div className="cell w-32 border border-gray-300 p-1 font-bold">Quantity</div>
                                                    {uniqueVendors.map((vendor, i) => (
                                                        <div key={i} className="cell w-32 border border-gray-300 p-1 font-bold whitespace-nowrap">
                                                            {vendor.vendor_name}
                                                        </div>
                                                    ))}
                                                </div>

                                                {/* Products Rows */}
                                                {result.products.map((product, productIndex) => (
                                                    <div className="flex min-w-max" key={productIndex}>
                                                        <div className="cell w-32 border border-gray-300 p-1 font-semibold">
                                                            {product.product_name}
                                                        </div>
                                                        <div className="cell w-32 border border-gray-300 p-1">
                                                            {product.request_price}
                                                        </div>
                                                        <div className="cell w-32 border border-gray-300 p-1">
                                                            {product.quantity}
                                                        </div>
                                                        {uniqueVendors.map((vendor, vendorIndex) => {
                                                            const match = product.vendor_submissions?.find(
                                                                sub => sub.vendor_id === vendor.vendor_id
                                                            );
                                                            return (
                                                                <div key={vendorIndex} className="cell w-32 border border-gray-300 p-1">
                                                                    {match ? match.proposed_price : '-'}
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                ))}

                                                {/* Footer Row for Vendor Totals (quantity * proposed_price) */}
                                                <div className="flex min-w-max bg-gray-100 font-semibold">
                                                    <div className="cell w-32 border border-gray-300 p-1">Total</div>
                                                    <div className="cell w-32 border border-gray-300 p-1"></div>
                                                    <div className="cell w-32 border border-gray-300 p-1">
                                                        {result.total_amount}
                                                    </div>
                                                    {uniqueVendors.map((vendor, vendorIndex) => {
                                                        let total = 0;
                                                        result.products.forEach(product => {
                                                            const match = product.vendor_submissions?.find(
                                                                sub => sub.vendor_id === vendor.vendor_id
                                                            );
                                                            if (match && match.proposed_price && product.quantity) {
                                                                total += match.proposed_price * product.quantity;
                                                            }
                                                        });
                                                        return (
                                                            <div key={vendorIndex} className="cell w-32 border border-gray-300 p-1">
                                                                {total > 0 ? total.toFixed(2) : '-'}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        {/* </tbody> */}
                    </table>
                </div>
            </div>
        </AuthenticatedLayout>
    )
}

export default EOI