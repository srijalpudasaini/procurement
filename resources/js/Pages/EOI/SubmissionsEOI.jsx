import InputLabel from '@/Components/Form/InputLabel'
import TextInput from '@/Components/Form/TextInput'
import Alert from '@/Components/ui/Alert'
import Breadcrumb from '@/Components/ui/Breadcrumb'
import Modal from '@/Components/ui/Modal'
import Pagination from '@/Components/ui/Pagination'
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import { Link, usePage, router } from '@inertiajs/react'
import React, { useState } from 'react'
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

    const columns = [
        { name: "Vendor", selector: row => row.vendor.name, sortable: true },
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

    const [filters, setFilters] = useState(
        {
            allProducts: false,
            allDocuments: false,
            minPrice: '',
            maxPrice: '',
            sortBy: '',
            sort: ''
        }
    )

    const closeDetail = () => {
        setShowModal(false)
    }

    const filteredData = submissions.data
        .filter(row => {
            if (filters.allProducts) {
                const submittedProductIds = row.proposals.map(p => p.purchase_request_item.product.id);
                const requiredProductIds = eoi.purchase_request_items.map(p => p.product.id);
                const allProductsSubmitted = requiredProductIds.every(id => submittedProductIds.includes(id));
                if (!allProductsSubmitted) return false;
            }

            if (filters.allDocuments) {
                const submittedDocumentIds = row.documents.map(p => p.document.id);
                const requiredDocumentIds = eoi.eoi_documents.map(p => p.document_id);
                const allProductsSubmitted = requiredDocumentIds.every(id => submittedDocumentIds.includes(id));
                if (!allProductsSubmitted) return false;
            }

            const totalPrice = row.proposals.reduce((total, proposal) =>
                total + proposal.price * proposal.purchase_request_item.quantity, 0
            );
            if (filters.minPrice && totalPrice < parseFloat(filters.minPrice)) return false;
            if (filters.maxPrice && totalPrice > parseFloat(filters.maxPrice)) return false;

            return true;
        })
        .sort((a, b) => {
            if (filters.sortBy && filters.sort) {
                const productId = filters.sortBy;
                const priceA = a.proposals.find(p => p.purchase_request_item.id == productId)?.price || 0;
                const priceB = b.proposals.find(p => p.purchase_request_item.id == productId)?.price || 0;

                if (priceA === 0 && priceB !== 0) return 1;
                if (priceB === 0 && priceA !== 0) return -1;

                return filters.sort === "asc" ? priceA - priceB : priceB - priceA;
            }
            return 0;
        });

    return (
        <AuthenticatedLayout>


            <Breadcrumb items={breadCrumbItems} />
            <div className="bg-white p-4 shadow sm:rounded-lg sm:p-8">
                <h2 className="text-center text-2xl font-bold">EOI Applications</h2>
                <div className="flex justify-between items-center">
                    <div>
                        Show
                        <select
                            name=""
                            id=""
                            className='py-1 mx-1'
                            value={submissions.per_page}
                            onChange={(e) => router.get(`/eois/submissions/${eoi.id}`, { per_page: e.target.value })}
                        >
                            <option value="5">5</option>
                            <option value="10">10</option>
                            <option value="20">20</option>
                        </select>
                        entries
                    </div>
                    <div className={`filter border border-gray-300 rounded-sm py-1 px-4 cursor-pointer select-none
                        ${filterDropdownOpen ? 'bg-gray-300' : ''}
                    `}
                        onClick={() => setFilterDropdownOpen(!filterDropdownOpen)}
                    >
                        <i className="fa fa-filter"></i> Filter
                    </div>
                </div>

                {filterDropdownOpen &&
                    <div className="filters mt-3">
                        <h3 className='mb-1 text-lg font-semibold'>Filters</h3>
                        <div className='flex gap-2 mt-1 text-xs items-center'>
                            <div className={`py-1 px-3 rounded-md text-nowrap border select-none cursor-pointer
                                            ${filters.allProducts ? 'bg-[#00AB66] text-white border-[#00AB66]' : 'border-gray-400'}
                                        `}
                                onClick={() => setFilters({ ...filters, allProducts: !filters.allProducts })}
                            >
                                All Products Submitted
                            </div>
                            <div className={`py-1 px-3 rounded-md text-nowrap border select-none cursor-pointer
                                            ${filters.allDocuments ? 'bg-[#00AB66] text-white border-[#00AB66]' : 'border-gray-400'}
                                        `}
                                onClick={() => setFilters({ ...filters, allDocuments: !filters.allDocuments })}
                            >
                                All Documents Submitted
                            </div>
                        </div>
                        <div className="mt-3 flex gap-2 items-center">
                            <h3 className='text-base font-semibold'>Enter Price Range</h3>
                            <TextInput
                                value={filters.minPrice}
                                placeholder="Min Total"
                                className="py-1"
                                onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })}
                            />
                            <TextInput
                                value={filters.maxPrice}
                                placeholder="Max Total"
                                className="py-1"
                                onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
                            />
                        </div>
                        <div className="mt-3 flex gap-2 items-center">
                            <h3 className='text-base font-semibold'>Sort by Product Price</h3>
                            <select
                                value={filters.sortBy}
                                className="py-1"
                                onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
                            >
                                <option value="">Select Product</option>
                                {eoi.purchase_request_items.map((p, index) => (
                                    <option value={p.id} key={index}>{p.product.name}</option>
                                ))}
                            </select>

                            <select
                                value={filters.sort}
                                className="py-1"
                                onChange={(e) => setFilters({ ...filters, sort: e.target.value })}
                            >
                                <option value="asc">Ascending</option>
                                <option value="desc">Descending</option>
                            </select>
                        </div>
                    </div>
                }

                {flash?.success && (
                    <Alert type='success' message={flash.success} />
                )}
                {flash?.error && (
                    <Alert type='error' message={flash.error} />
                )}

                <div className="my-4">
                    <DataTable
                        columns={columns}
                        data={filteredData}
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
                            }, { preserveState: true, replace: true });
                        }}
                        onChangeRowsPerPage={(perPage) => {
                            router.get(`/eois/submissions/${eoi.id}`, {
                                per_page: perPage,
                                page: 1
                            }, { preserveState: true, replace: true });
                        }}
                        paginationComponentOptions={{ noRowsPerPage: true }}
                    />
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

export default SubmissionEOI;
