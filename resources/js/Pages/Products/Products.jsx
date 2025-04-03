import Alert from '@/Components/ui/Alert'
import Breadcrumb from '@/Components/ui/Breadcrumb'
import Modal from '@/Components/ui/Modal'
import Pagination from '@/Components/ui/Pagination'
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import { Link, usePage, router } from '@inertiajs/react'
import React, { useState } from 'react'
import DataTable from 'react-data-table-component'

const Products = ({ products }) => {
    const { flash, auth } = usePage().props;
    const [showModal, setShowModal] = useState(false);
    const [deleteId, setDeleteId] = useState(null);
    const userPermissions = auth?.user?.permissions || [];

    const hasPermission = (permission) => (userPermissions.includes(permission) || auth.user.is_superadmin)

    const confirmDelete = (id) => {
        setDeleteId(id);
        setShowModal(true);
    };

    const handleDelete = () => {
        router.delete(`/products/${deleteId}`, {
            onSuccess: () => setShowModal(false),
        });
    };

    const breadCrumbItems = [
        {
            title: 'Dashboard',
            href: '/dashboard'
        },
        {
            title: 'Products',
        }
    ]

    const columns = [
        { name: "Name", selector: row => row.name, sortable: true },
        { name: "Description", selector: row => row.description, sortable: true },
        { name: "Category", selector: row => row.category.name },
        {
            name: "Action",
            cell: row => (
                <div className="flex gap-2">
                    {!!hasPermission('edit_product') && (
                        <Link
                            href={`/products/${row.id}/edit`}
                            className="rounded-md border border-transparent bg-blue-800 px-3 py-2 text-xs font-semibold uppercase text-white transition duration-150 ease-in-out hover:bg-blue-700 me-2"
                        >
                            Edit
                        </Link>
                    )}

                    {!!hasPermission('delete_product') && (
                        <button
                            onClick={() => confirmDelete(row.id)}
                            className="rounded-md border border-transparent bg-red-600 px-3 py-2 text-xs font-semibold uppercase tracking-widest text-white transition duration-150 ease-in-out hover:bg-red-700"
                        >
                            Delete
                        </button>
                    )}
                </div>
            ),
            ignoreRowClick: true,
        }
    ];


    return (
        <AuthenticatedLayout>
            {!!hasPermission('delete_product') &&
                <Modal show={showModal} onClose={() => setShowModal(false)}>
                    <div className="p-6">
                        <h2 className="text-lg font-semibold text-gray-800">
                            Are you sure you want to delete this product?
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
                <h2 className="text-center text-2xl font-bold">Products</h2>
                <div className="flex justify-between items-center">
                    <div>
                        Show
                        <select
                            name=""
                            id=""
                            className='py-1 mx-1'
                            value={products.per_page}
                            onChange={(e) => router.get('/products', { per_page: e.target.value })}
                        >
                            <option value="5">5</option>
                            <option value="10">10</option>
                            <option value="20">20</option>
                        </select>
                        entries
                    </div>
                    {!!hasPermission('create_product') &&
                        <Link className='rounded-md border border-transparent bg-gray-800 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-white transition duration-150 ease-in-out hover:bg-gray-700' href='/products/create'>+ Add Product</Link>
                    }
                </div>

                {flash?.success && (
                    <Alert type='success' message={flash.success} />
                )}
                {flash?.error && (
                    <Alert type='error' message={flash.error} />
                )}

                <div className="my-4">
                    <DataTable
                        columns={columns}
                        data={products.data}
                        pagination
                        paginationServer
                        paginationTotalRows={products.total}
                        paginationPerPage={products.per_page}
                        onChangePage={(page) => {
                            router.get('/products', {
                                page,
                                per_page: products.per_page
                            }, { preserveState: true, replace: true });
                        }}
                        onChangeRowsPerPage={(perPage) => {
                            router.get('/products', {
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

export default Products;
