import Alert from '@/Components/ui/Alert'
import Breadcrumb from '@/Components/ui/Breadcrumb'
import Modal from '@/Components/ui/Modal'
import Pagination from '@/Components/ui/Pagination'
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import { Link, usePage, router } from '@inertiajs/react'
import React, { useState } from 'react'

const Documents = ({ documents }) => {
    const { flash, auth } = usePage().props;
    const [showModal, setShowModal] = useState(false);
    const [deleteId, setDeleteId] = useState(null);
    const userPermissions = auth?.user?.permissions || [];

    const hasPermission = (permission) => (userPermissions.includes(permission))

    const confirmDelete = (id) => {
        setDeleteId(id);
        setShowModal(true);
    };

    const handleDelete = () => {
        router.delete(`/documents/${deleteId}`, {
            onSuccess: () => setShowModal(false),
        });
    };

    const breadCrumbItems = [
        {
            title: 'Dashboard',
            href: '/dashboard'
        },
        {
            title: 'Documents',
        }
    ]

    return (
        <AuthenticatedLayout>
            {hasPermission('delete_document') &&
                <Modal show={showModal} onClose={() => setShowModal(false)}>
                    <div className="p-6">
                        <h2 className="text-lg font-semibold text-gray-800">
                            Are you sure you want to delete this document?
                        </h2>
                        <div className="mt-4 flex justify-end">
                            <button
                                onClick={() => setShowModal(false)}
                                className="px-4 py-2 text-gray-700 bg-gray-200 rounded mr-2 hover:bg-gray-300"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDelete}
                                className="px-4 py-2 text-white bg-red-600 rounded hover:bg-red-700"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </Modal>
            }

            <Breadcrumb items={breadCrumbItems} />
            <div className="bg-white p-4 shadow sm:rounded-lg sm:p-8">
                <h2 className="text-center text-2xl font-bold">Documents</h2>
                <div className="flex justify-between items-center">
                    <div>
                        Show
                        <select
                            name=""
                            id=""
                            className='py-1 mx-1'
                            value={documents.per_page}
                            onChange={(e) => router.get('/documents', { per_page: e.target.value })}
                        >
                            <option value="5">5</option>
                            <option value="10">10</option>
                            <option value="20">20</option>
                        </select>
                        entries
                    </div>
                    {hasPermission('create_document') &&
                        <div className="text-end">
                            <Link className='rounded-md border border-transparent bg-gray-800 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-white transition duration-150 ease-in-out hover:bg-gray-700' href='/documents/create'>+ Add Document</Link>
                        </div>
                    }
                </div>

                {flash?.success && (
                    <Alert type='success' message={flash.success} />
                )}
                {flash?.error && (
                    <Alert type='error' message={flash.error} />
                )}

                <table className='w-full mt-4 text-center'>
                    <thead>
                        <tr className='bg-gray-600 text-white'>
                            <th className='p-2'>S.N.</th>
                            <th className='p-2'>Title</th>
                            <th className='p-2'>Description</th>
                            <th className='p-2'>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {
                            documents.data.length === 0 ?
                                <tr><td colSpan={5} className='p-2'>No Documents Found</td></tr>
                                :
                                documents?.data.map((document, index) => (
                                    <tr key={document.id} className={index % 2 === 1 ? 'bg-gray-100' : ''}>
                                        <td className='p-2'>{index + 1}</td>
                                        <td className='p-2'>{document.title}</td>
                                        <td className='p-2'>{document.description || 'N/A'}</td>
                                        <td className='p-2'>
                                            {hasPermission('edit_document') &&
                                                <Link
                                                    href={`/documents/${document.id}/edit`}
                                                    className='rounded-md border border-transparent bg-blue-800 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-white transition duration-150 ease-in-out hover:bg-blue-700 me-2'
                                                >
                                                    Edit
                                                </Link>
                                            }
                                            {hasPermission('delete_document') &&
                                                <button
                                                    onClick={() => confirmDelete(document.id)}
                                                    className='rounded-md border border-transparent bg-red-600 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-white transition duration-150 ease-in-out hover:bg-red-700'
                                                >
                                                    Delete
                                                </button>
                                            }
                                        </td>
                                    </tr>
                                ))}
                    </tbody>
                </table>
                <Pagination links={documents.links} per_page={documents.per_page} />
            </div>
        </AuthenticatedLayout>
    );
}

export default Documents;
