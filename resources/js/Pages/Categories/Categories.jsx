import Alert from '@/Components/ui/Alert'
import Breadcrumb from '@/Components/ui/Breadcrumb'
import Modal from '@/Components/ui/Modal'
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import { Link, usePage, router } from '@inertiajs/react'
import React, { useState } from 'react'

const Categories = ({ categories }) => {
    const { flash, auth } = usePage().props;
    const [showModal, setShowModal] = useState(false);
    const [deleteId, setDeleteId] = useState(null);
    const userPermissions = auth?.permissions || [];

    const hasPermission = (permission) => (userPermissions.includes(permission))

    const confirmDelete = (id) => {
        setDeleteId(id);
        setShowModal(true);
    };

    const handleDelete = () => {
        router.delete(`/categories/${deleteId}`, {
            onSuccess: () => setShowModal(false),
        });
    };

    const breadCrumbItems = [
        {
            title: 'Dashboard',
            href: '/dashboard'
        },
        {
            title: 'Categories',
        }
    ]

    return (
        <AuthenticatedLayout>
            {hasPermission('delete_category') &&
                <Modal show={showModal} onClose={() => setShowModal(false)}>
                    <div className="p-6">
                        <h2 className="text-lg font-semibold text-gray-800">
                            Are you sure you want to delete this category?
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
                <h2 className="text-center text-2xl font-bold">Categories</h2>
                {hasPermission('create_category') &&
                    <div className="text-end">
                        <Link className='rounded-md border border-transparent bg-gray-800 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-white transition duration-150 ease-in-out hover:bg-gray-700' href='/categories/create'>+ Add Category</Link>
                    </div>
                }

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
                            <th className='p-2'>Name</th>
                            <th className='p-2'>Description</th>
                            <th className='p-2'>Parent</th>
                            <th className='p-2'>Action</th>
                        </tr>
                    </thead>
                    <tbody>

                        {
                            categories.length === 0 ?
                                <tr><td colSpan={5}>No Categories Found</td></tr>
                                :
                                categories?.map((category, index) => (
                                    <tr key={category.id} className={index % 2 === 1 ? 'bg-gray-100' : ''}>
                                        <td className='p-2'>{index + 1}</td>
                                        <td className='p-2'>{category.name}</td>
                                        <td className='p-2'>{category.description || 'N/A'}</td>
                                        <td className='p-2'>{category.parent ? category.parent.name : 'N/A'}</td>
                                        <td className='p-2'>
                                            {hasPermission('edit_category') &&
                                                <Link
                                                    href={`/categories/${category.id}/edit`}
                                                    className='rounded-md border border-transparent bg-blue-800 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-white transition duration-150 ease-in-out hover:bg-blue-700 me-2'
                                                >
                                                    Edit
                                                </Link>
                                            }
                                            {hasPermission('delete_category') &&
                                                <button
                                                    onClick={() => confirmDelete(category.id)}
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
            </div>
        </AuthenticatedLayout>
    );
}

export default Categories;
