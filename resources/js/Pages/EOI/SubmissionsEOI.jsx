import InputLabel from '@/Components/Form/InputLabel'
import TextInput from '@/Components/Form/TextInput'
import Alert from '@/Components/ui/Alert'
import Breadcrumb from '@/Components/ui/Breadcrumb'
import Modal from '@/Components/ui/Modal'
import Pagination from '@/Components/ui/Pagination'
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import { Link, usePage, router } from '@inertiajs/react'
import React, { useEffect, useState } from 'react'
import DataTable from 'react-data-table-component'

const ExpandedComponent = ({ data }) => (
    <div className='p-2 px-8 bg-gray-100'>
        <h2 className='mb-2 text-lg font-semibold text-gray-800'>Product Quotations</h2>
        <table className='mb-3 w-full border border-collapse text-center'>
            <thead>
                <tr className='bg-[#00AB66] text-white'>
                    <th className='p-2'>S.N.</th>
                    <th className='p-2'>Product</th>
                    <th className='p-2'>Unit</th>
                    <th className='p-2'>Required Quantity</th>
                    <th className='p-2'>Unit Price Offered</th>
                    <th className='p-2'>Total</th>
                </tr>
            </thead>
            <tbody>
                {
                    data?.proposals.map((proposal, index) => (
                        <tr key={proposal.id} className='bg-white border border-b-2'>
                            <td className='p-2'>{index + 1}</td>
                            <td className='p-2'>{proposal.purchase_request_item.product.name}</td>
                            <td className='p-2'>{proposal.purchase_request_item.product.unit}</td>
                            <td className='p-2'>{proposal.purchase_request_item.quantity}</td>
                            <td className='p-2'>{proposal.price}</td>
                            <td className='p-2'>{proposal.price * proposal.purchase_request_item.quantity}</td>
                        </tr>
                    ))
                }
            </tbody>
        </table>
        <h2 className='mb-2 text-lg font-semibold text-gray-800'>Documents uploaded</h2>
        <ul className='ms-6 list-disc'>
            {data?.documents.map((doc, index) => (
                <li key={index}>
                    <a href={`/storage/${doc.name}`} className='text-blue-600 font-bold' target='blank'>
                        {doc.document.title}
                    </a>
                </li>
            ))}
        </ul>
    </div>
)

const SubmissionEOI = ({ eoi, submissions }) => {
    const { flash, auth } = usePage().props;
    const [showModal, setShowModal] = useState(false);
    const [deleteId, setDeleteId] = useState(null);
    const userPermissions = auth?.user?.permissions || [];

    const [filters, setFilters] = useState({
        allProducts: false,
        allDocuments: false,
        minPrice: '',
        maxPrice: '',
        sortBy: '',
        sort: '',
        rating: 0,
        productCoverage: false,
        mostPriority: false
    })

    const columns = [
        {
            name: "Vendor", cell: row => (
                <>
                    <span className="me-3">
                        {row.vendor.name}
                    </span>
                    ({row.vendor.rating}
                    <i className="fa fa-star text-xs ms-1 text-[#00AB66]"></i> )
                </>
            ),
        },
        { name: "Submission Date", selector: row => row.application_date, sortable: true },
        { name: "Delivery Date", selector: row => row.delivery_date, sortable: true },
        {
            name: "Total", selector: row => row.proposals?.reduce((total, proposal) =>
                total + proposal.price * proposal.purchase_request_item.quantity, 0
            ), sortable: true
        },
        {
            name: "Status", cell: row => (
                <span
                    className={`rounded-sm text-white font-medium px-2 py-1 capitalize text-xs
                                ${row.status == 'pending' ? 'bg-yellow-600' :
                            row.status == 'approved' ? 'bg-green-600' : 'bg-red-600'}
                            `}
                >
                    {row.status}
                </span>
            )
        },
        {
            name: "Action",
            cell: row => (
                <div className="flex gap-2">
                    <button
                        className='rounded-md border border-transparent bg-green-800 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-white transition duration-150 ease-in-out hover:bg-green-700 me-2'
                    >
                        View
                    </button>
                </div>
            ),
            ignoreRowClick: true,
        }
    ];

    const hasPermission = (permission) => (userPermissions.includes(permission) || auth.user.is_superadmin)

    const confirmDelete = (id, type) => {
        setDeleteId(id);
        setShowModal(true);
    };

    const handleDelete = () => {
        router.put(`/requests/updateStatus/${deleteId}`, {
            status: modalType,
        }, {
            onSuccess: () => closeDetail()
        });
    };

    const breadCrumbItems = [
        {
            title: 'Dashboard',
            href: '/dashboard'
        },
        {
            title: 'EOIs',
            href: '/eois',
        },
        {
            title: 'EOI Submissions',
        },
    ]

    const [filterDropdownOpen, setFilterDropdownOpen] = useState(false)

    const closeDetail = () => {
        setShowModal(false)
    }
    const [isInitialLoad, setIsInitialLoad] = useState(true);

    useEffect(() => {
        if (isInitialLoad) {
            setIsInitialLoad(false);
            return;
        }
        handleFilterChange();
    }, [filters]); // Add all filter dependencies here
    
    const handleFilterChange = () => {
        if (isInitialLoad) return;
        try {
            router.get(`/eois/submissions/${eoi.id}`, {
                per_page: submissions.per_page,
                min_price: filters.minPrice || null,
                max_price: filters.maxPrice || null,
                rating: filters.rating || null,
                all_products: filters.allProducts ? 1 : null,
                all_documents: filters.allDocuments ? 1 : null,
                product_coverage: filters.productCoverage ? 1 : null,
                most_priority: filters.mostPriority ? 1 : null,
                sort_by: filters.sortBy || null,
                sort: filters.sort || null,
                page: 1
            }, {
                preserveState: true,
                replace: false, // Changed to false
                preserveScroll: true,
                only: ['submissions']
            });
        } catch (error) {
            console.error('Filter error:', error);
            // Optionally show error to user
        }
    };

   
    const changeRating = (rating) => {
        const newRating = rating === filters.rating ? 0 : rating;
        setFilters({ ...filters, rating: newRating });
        handleFilterChange();
    }
    const toggleFilter = (filterName) => {
        setFilters(prev => {
            const newFilters = { ...prev };

            // Reset conflicting filters
            if (filterName === 'productCoverage') {
                newFilters.mostPriority = false;
            } else if (filterName === 'mostPriority') {
                newFilters.productCoverage = false;
            }

            // Toggle the selected filter
            newFilters[filterName] = !prev[filterName];
            return newFilters;
        });

        // No need to call handleFilterChange here - useEffect will handle it
    };

    return (
        <AuthenticatedLayout>
            <Breadcrumb items={breadCrumbItems} />
            <div className="bg-white p-4 shadow sm:rounded-lg sm:p-8">
                <h2 className="text-center text-2xl font-bold">EOI Applications</h2>
                <div className="flex justify-between items-center">
                    {/* Pagination & Filter Toggle */}
                    <div className="flex items-center gap-2">
                        <span>Show</span>
                        <select
                            className="py-1 border rounded-md"
                            value={submissions.per_page}
                            onChange={(e) => router.get(`/eois/submissions/${eoi.id}`, {
                                per_page: e.target.value
                            }, { preserveState: true })}
                        >
                            <option value="5">5</option>
                            <option value="10">10</option>
                            <option value="20">20</option>
                        </select>
                        <span>entries</span>
                    </div>

                    <div
                        className={`border border-gray-300 rounded-md py-2 px-5 cursor-pointer select-none flex items-center gap-2 transition
                            ${filterDropdownOpen ? 'bg-gray-300' : 'hover:bg-gray-100'}`}
                        onClick={() => setFilterDropdownOpen(!filterDropdownOpen)}
                    >
                        <i className="fa fa-filter"></i> <span>Filter</span>
                    </div>
                </div>

                {/* Filter Options */}
                {filterDropdownOpen && (
                    <div className="mt-4 space-y-4">
                        <h3 className="text-lg font-semibold border-b pb-2">Filters</h3>

                        {/* Checkbox Filters */}
                        <div className="flex gap-3">
                            <div
                                className={`py-1 px-3 rounded-md text-center border select-none cursor-pointer
                                    ${filters.allProducts ? 'bg-[#00AB66] text-white border-[#00AB66]' : 'border-gray-400'}`}
                                onClick={() => {
                                    setFilters({ ...filters, allProducts: !filters.allProducts });
                                    
                                }}
                            >
                                All Products Submitted
                            </div>
                            <div
                                className={`py-1 px-3 rounded-md text-center border select-none cursor-pointer
                                    ${filters.allDocuments ? 'bg-[#00AB66] text-white border-[#00AB66]' : 'border-gray-400'}`}
                                onClick={() => {
                                    setFilters({ ...filters, allDocuments: !filters.allDocuments });
                                    
                                }}
                            >
                                All Documents Submitted
                            </div>
                        </div>

                        {/* Rating Filter */}
                        <div>
                            <h3 className="text-base font-semibold mb-2">Filter by Vendor Rating</h3>
                            <div className="flex gap-3">
                                {[4, 3, 2, 1].map((rate) => (
                                    <div
                                        key={rate}
                                        className={`py-1 px-3 rounded-md text-nowrap border select-none cursor-pointer flex items-center gap-1
                                            ${filters.rating === rate ? 'bg-[#00AB66] text-white border-[#00AB66]' : 'border-gray-400'}`}
                                        onClick={() => changeRating(rate)}
                                    >
                                        {rate}.0+ <i className={`fa fa-star ${filters.rating === rate ? 'text-white' : 'text-[#00AB66]'}`}></i>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Price Range Filter */}
                        <div>
                            <h3 className="text-base font-semibold mb-2">Enter Price Range</h3>
                            <div className="flex gap-3">
                                <TextInput
                                    value={filters.minPrice}
                                    placeholder="Min"
                                    className="py-1 px-2 border rounded-md w-24"
                                    onChange={(e) => {
                                        setFilters({ ...filters, minPrice: e.target.value });
                                    }}
                                />
                                <TextInput
                                    value={filters.maxPrice}
                                    placeholder="Max"
                                    className="py-1 px-2 border rounded-md w-24"
                                    onChange={(e) => {
                                        setFilters({ ...filters, maxPrice: e.target.value });  
                                    }}
                                />
                            </div>
                        </div>

                        {/* Sorting by Product Price */}
                        <div>
                            <h3 className="text-base font-semibold mb-2">Sort by Product Price</h3>
                            <div className="flex gap-3 items-center">
                                <select
                                    value={filters.sortBy}
                                    className="py-1 px-3 border rounded-md w-48"
                                    onChange={(e) => {
                                        setFilters({ ...filters, sortBy: e.target.value });
                                    }}
                                >
                                    <option value="">Select Product</option>
                                    {eoi.purchase_request_items.map((p, index) => (
                                        <option value={p.id} key={index}>{p.product.name}</option>
                                    ))}
                                </select>

                                <select
                                    value={filters.sort}
                                    className="py-1 px-3 border rounded-md w-48"
                                    onChange={(e) => {
                                        setFilters({ ...filters, sort: e.target.value });
                                    }}
                                >
                                    <option value="asc">Ascending</option>
                                    <option value="desc">Descending</option>
                                </select>
                            </div>
                        </div>

                        {/* Additional Filters */}
                        <div className="flex gap-3">
                            <div
                                className={`py-1 px-3 rounded-md text-center border select-none cursor-pointer
            ${filters.productCoverage ? 'bg-[#00AB66] text-white border-[#00AB66]' : 'border-gray-400'}`}
                                onClick={() => toggleFilter('productCoverage')}
                            >
                                Most Products Submitted
                            </div>
                            <div
                                className={`py-1 px-3 rounded-md text-center border select-none cursor-pointer
            ${filters.mostPriority ? 'bg-[#00AB66] text-white border-[#00AB66]' : 'border-gray-400'}`}
                                onClick={() => toggleFilter('mostPriority')}
                            >
                                Most Priority Products Submitted
                            </div>
                        </div>
                    </div>
                )}

                {flash?.success && (
                    <Alert type='success' message={flash.success} />
                )}
                {flash?.error && (
                    <Alert type='error' message={flash.error} />
                )}

                <div className="my-4">
                    <DataTable
                        columns={columns}
                        data={submissions.data}
                        expandableRows
                        expandableRowsComponent={ExpandedComponent}
                        pagination
                        paginationServer
                        paginationTotalRows={submissions.total}
                        paginationPerPage={submissions.per_page}
                        onChangePage={(page) => {
                            router.get(`/eois/submissions/${eoi.id}`, {
                                page,
                                per_page: submissions.per_page
                            }, { preserveState: true });
                        }}
                        onChangeRowsPerPage={(perPage) => {
                            router.get(`/eois/submissions/${eoi.id}`, {
                                per_page: perPage,
                                page: 1
                            }, { preserveState: true });
                        }}
                        paginationComponentOptions={{ noRowsPerPage: true }}
                    />
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

export default SubmissionEOI;