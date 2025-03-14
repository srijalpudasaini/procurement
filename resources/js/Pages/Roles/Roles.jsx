import Alert from '@/Components/ui/Alert'
import Breadcrumb from '@/Components/ui/Breadcrumb'
import Modal from '@/Components/ui/Modal'
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import { Link, usePage, router } from '@inertiajs/react'
import React, { useState } from 'react'

const Roles = ({ roles }) => {
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
        router.delete(`/roles/${deleteId}`, {
            onSuccess: () => setShowModal(false),
        });
    };

    const breadCrumbItems = [
        {
            title: 'Dashboard',
            href: '/dashboard'
        },
        {
            title: 'Roles',
        }
    ]
    return (
        <AuthenticatedLayout>
            {/* {hasPermission('delete_role') && */}
            <Modal show={showModal} onClose={() => setShowModal(false)}>
                <div className="p-6">
                    <h2 className="text-lg font-semibold text-gray-800">
                        Are you sure you want to delete this role?
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
            {/* } */}

            <Breadcrumb items={breadCrumbItems} />
            <div className="bg-white p-4 shadow sm:rounded-lg sm:p-8">
                <h2 className="text-center text-2xl font-bold">Roles</h2>
                {hasPermission('create_product') &&
                    <div className="text-end">
                        <Link className='rounded-md border border-transparent bg-gray-800 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-white transition duration-150 ease-in-out hover:bg-gray-700' href='/roles/create'>+ Add Role</Link>
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
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {roles.length == 0 ?
                            <tr><td colSpan={3}>No Roles Found</td></tr>
                            :
                            roles?.map((role, index) => (
                                <tr key={role.id} className={index % 2 === 1 ? 'bg-gray-100' : ''}>
                                    <td className='p-2'>{index + 1}</td>
                                    <td className='p-2'>{role.name}</td>
                                    <td className='p-2'>
                                        {/* {hasPermission('edit_role') &&  */}
                                        <Link
                                            href={`/roles/${role.id}/edit`}
                                            className='rounded-md border border-transparent bg-blue-800 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-white transition duration-150 ease-in-out hover:bg-blue-700 me-2'
                                        >
                                            Edit
                                        </Link>
                                        {/* } */}
                                        {/* {hasPermission('delete_role') && */}
                                        <button
                                            onClick={() => confirmDelete(role.id)}
                                            className='rounded-md border border-transparent bg-red-600 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-white transition duration-150 ease-in-out hover:bg-red-700'
                                        >
                                            Delete
                                        </button>
                                        {/* } */}
                                    </td>
                                </tr>
                            ))
                        }
                    </tbody>
                </table>
            </div>
        </AuthenticatedLayout>
    );
}

export default Roles;
