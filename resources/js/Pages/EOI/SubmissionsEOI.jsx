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

const SubmissionEOI = ({ eoi }) => {
    const { flash, auth } = usePage().props;
    const [showModal, setShowModal] = useState(false);
    const [deleteId, setDeleteId] = useState(null);
    const [application, setApplication] = useState(null);
    const userPermissions = auth?.user?.permissions || [];
    // console.log(eoi)

    const columns = [
        { name: "Vendor", selector: row => row.vendor.name, sortable: true },
        { name: "Submission Date", selector: row => row.application_date, sortable: true },
        {
            name: "Total", selector: row => row.proposals?.reduce((total, proposal) =>
                total + proposal.price * proposal.purchase_request_item.quantity, 0
            ), sortable: true
        },
        { name: "Status", selector: row => row.status },
        {
            name: "Action",
            cell: row => (
                <div className="flex gap-2">
                    <button
                        className='rounded-md border border-transparent bg-green-800 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-white transition duration-150 ease-in-out hover:bg-green-700 me-2'
                        onClick={() => openApplication(row)}
                    >
                        View
                    </button>
                </div>
            ),
            ignoreRowClick: true,
        }
    ];

    const hasPermission = (permission) => (userPermissions.includes(permission))

    const confirmDelete = (id, type) => {
        setDeleteId(id);
        setShowModal(true);
    };

    const openApplication = (application) => {
        setApplication(application);
        setShowModal(true)
    }

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


    const closeDetail = () => {
        setShowModal(false)
    }

    return (
        <AuthenticatedLayout>
            {/* {hasPermission('edit_request') && */}
            <Modal show={showModal} onClose={closeDetail}>
                <div className="p-6">
                    <h2 className="text-lg font-semibold text-gray-800">
                        Application Details
                    </h2>
                    <div className="application-details">
                        <table className='my-3'>
                            <tr>
                                <th className='p-1'>Vendor Name: </th>
                                <td className='p-1'>{application?.vendor.name}</td>
                            </tr>
                            <tr>
                                <th className='p-1'>Submitted on: </th>
                                <td className='p-1'>{application?.application_date}</td>
                            </tr>
                            <tr>
                                <th className='p-1'>Total Amount: </th>
                                <td className='p-1'>
                                    {application?.proposals?.reduce((total, proposal) =>
                                        total + proposal.price * proposal.purchase_request_item.quantity, 0
                                    )}
                                </td>
                            </tr>
                        </table>
                        <h2 className='mb-2 text-lg font-semibold text-gray-800'>Product Quotations</h2>
                        <table className='mb-3 w-full border border-collapse text-center'>
                            <thead>
                                <tr className='bg-gray-600 text-white'>
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
                                    application?.proposals.map((proposal, index) => (
                                        <tr key={proposal.id} className={index % 2 === 1 ? 'bg-gray-100' : ''}>
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
                            {application?.documents.map((doc, index) => (
                                <li key={index}>
                                    <a href={`/storage/${doc.name}`} className='text-blue-600 font-bold' target='blank'>
                                        {doc.document.title}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div className="mt-4 flex justify-end">
                        <button
                            onClick={() => setShowModal(false)}
                            className="px-4 py-2 text-gray-700 bg-gray-200 rounded mr-2 hover:bg-gray-300"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </Modal>
            {/* } */}

            <Breadcrumb items={breadCrumbItems} />
            <div className="bg-white p-4 shadow sm:rounded-lg sm:p-8">
                <h2 className="text-center text-2xl font-bold">EOI Applications</h2>
                <div className="flex justify-between items-center">
                    {/* <div>
                        Show
                        <select
                            name=""
                            id=""
                            className='py-1 mx-1'
                            value={eois.per_page}
                            onChange={(e) => router.get('/eois/submissions', { per_page: e.target.value })}
                        >
                            <option value="5">5</option>
                            <option value="10">10</option>
                            <option value="20">20</option>
                        </select>
                        entries
                    </div> */}
                </div>

                {flash?.success && (
                    <Alert type='success' message={flash.success} />
                )}
                {flash?.error && (
                    <Alert type='error' message={flash.error} />
                )}

                {/* <table className='w-full mt-4 text-center'>
                    <thead>
                        <tr className='bg-gray-600 text-white'>
                            <th className='p-2'>S.N.</th>
                            <th className='p-2'>Vendor</th>
                            <th className='p-2'>Submission Date</th>
                            <th className='p-2'>Total</th>
                            <th className='p-2'>Status</th>
                            <th className='p-2'>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {eoi?.eoi_vendor_applications?.length === 0 ?
                            <tr><td colSpan={5} className='p-2'>No Applications Found</td></tr>
                            :
                            eoi?.eoi_vendor_applications?.map((application, index) => (
                                <tr key={application.id} className={index % 2 === 1 ? 'bg-gray-100' : ''}>
                                    <td className='p-2'>{index + 1}</td>
                                    <td className='p-2'>{application.vendor.name}</td>
                                    <td className='p-2'>{application.application_date}</td>
                                    <td className='p-2'>
                                        {application.proposals?.reduce((total, proposal) =>
                                            total + proposal.price * proposal.purchase_request_item.quantity, 0
                                        )}
                                    </td>
                                    <td className='p-2'>{application.status}</td>
                                    <td className='p-2'>
                                        <button
                                            className='rounded-md border border-transparent bg-green-800 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-white transition duration-150 ease-in-out hover:bg-green-700 me-2'
                                            onClick={() => openApplication(application)}
                                        >
                                            View
                                        </button>
                                    </td>
                                </tr>
                            ))
                        }
                    </tbody>
                </table> */}
                {/* <Pagination links={eois.links} per_page={eois.per_page} /> */}

                <div className="my-4">
                    <DataTable
                        columns={columns}
                        data={eoi.eoi_vendor_applications}
                        expandableRows
                        expandableRowsComponent={ExpandedComponent}
                    />
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

export default SubmissionEOI;
