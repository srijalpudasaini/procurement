import Alert from '@/Components/ui/Alert'
import Breadcrumb from '@/Components/ui/Breadcrumb'
import Modal from '@/Components/ui/Modal'
import Pagination from '@/Components/ui/Pagination'
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import { Link, usePage, router } from '@inertiajs/react'
import React, { useState } from 'react'

const PurchaseRequests = ({ purchaseRequests }) => {
  const { flash, auth } = usePage().props;
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [requestModal, setRequestModal] = useState(null)
  const [deleteId, setDeleteId] = useState(null);
  const [modalType, setModalType] = useState(null);
  const userPermissions = auth?.user?.permissions || [];

  const hasPermission = (permission) => (userPermissions.includes(permission))

  const confirmDelete = (id, type) => {
    setModalType(type)
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
      title: 'Purchase Requests',
    }
  ]

  const viewDetail = (req) => {
    setRequestModal(req)
    setShowViewModal(true)
  }

  const closeDetail = () => {
    setShowViewModal(false)
    setShowModal(false)
    setRequestModal(null)
  }
  return (
    <AuthenticatedLayout>
      {/* {hasPermission('edit_request') && */}
      <Modal show={showModal} onClose={closeDetail}>
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-800">
            Are you sure you want to {modalType == 'approved' ? 'approve' : 'reject'} this request?
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
              className={`px-4 py-2 text-white ${modalType == 'rejected' ? 'bg-red-600 rounded hover:bg-red-700' : 'bg-blue-600 rounded hover:bg-blue-700'} `}
            >
              {modalType == 'approved' ? 'Approve' : 'Reject'}
            </button>
          </div>
        </div>
      </Modal>
      <Modal show={showViewModal} onClose={closeDetail}>
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-800">
            Request Details
          </h2>
          <div className="modal-content mt-3">
            <table>
              <tr className='pb-3'>
                <th className='pe-5'>Requested By:</th>
                <td>{requestModal?.user.name}</td>
              </tr>
              <tr className='pb-3'>
                <th className='pe-5'>Total Amount:</th>
                <td>{requestModal?.total}</td>
              </tr>
              <tr className='pb-3'>
                <th className='pe-5'>Requested On:</th>
                <td>{new Date(requestModal?.created_at).toLocaleDateString('en-CA')}</td>
              </tr>
            </table>
            <table className="requisition-form w-full my-4 table border-collapse overflow-x-auto text-center">
              <thead>
                <tr>
                  <th className="p-2 border">Product</th>
                  <th className="p-2 border">Quantity</th>
                  <th className="p-2 border">Price</th>
                  <th className="p-2 border">Speification</th>
                </tr>
              </thead>
              <tbody>
                {requestModal?.purchase_request_items?.map((pro, index) => (
                  <tr key={index} className="border">
                    <td className="p-2 border">
                      {pro.product.name}
                    </td>
                    <td className="p-2 border">
                      {pro.quantity}
                    </td>
                    <td className="p-2 border">
                      {pro.price}
                    </td>
                    <td className="p-2 border">
                      {pro.specifications}
                    </td>
                  </tr>
                ))}
              </tbody>

            </table>
          </div>
          <div className="mt-4 flex justify-end">
            <button
              onClick={() => setShowViewModal(false)}
              className="px-4 py-2 text-gray-700 bg-gray-200 rounded mr-2 hover:bg-gray-300"
            >
              Close
            </button>
            {hasPermission('approve_request') && requestModal?.status === 'pending' &&
              <button
                className='rounded-md border border-transparent bg-blue-800 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-white transition duration-150 ease-in-out hover:bg-blue-700 me-2'
                onClick={() => confirmDelete(requestModal?.id, 'approved')}
              >
                Approve
              </button>
            }
            {hasPermission('delete_request') && requestModal?.status === 'pending' &&
              <button
                onClick={() => confirmDelete(requestModal?.id, 'rejected')}
                className='rounded-md border border-transparent bg-red-600 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-white transition duration-150 ease-in-out hover:bg-red-700'
              >
                Reject
              </button>
            }
          </div>
        </div>
      </Modal>
      {/* } */}

      <Breadcrumb items={breadCrumbItems} />
      <div className="bg-white p-4 shadow sm:rounded-lg sm:p-8">
        <h2 className="text-center text-2xl font-bold">Purchase Requests</h2>
        <div className="flex justify-between items-center">
          <div>
            Show
            <select
              name=""
              id=""
              className='py-1 mx-1'
              value={purchaseRequests.per_page}
              onChange={(e) => router.get('/requests', { per_page: e.target.value })}
            >
              <option value="5">5</option>
              <option value="10">10</option>
              <option value="20">20</option>
            </select>
            entries
          </div>
          {hasPermission('create_request') &&
            <Link className='rounded-md border border-transparent bg-gray-800 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-white transition duration-150 ease-in-out hover:bg-gray-700' href='/requests/create'>+ Create Request</Link>
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
              <th className='p-2'>Name</th>
              <th className='p-2'>Total</th>
              <th className='p-2'>Status</th>
              <th className='p-2'>Action</th>
            </tr>
          </thead>
          <tbody>
            {purchaseRequests.data.length === 0 ?
              <tr><td colSpan={5} className='p-2'>No Purchase Requests Found</td></tr>
              :
              purchaseRequests?.data.map((request, index) => (
                <tr key={request.id} className={index % 2 === 1 ? 'bg-gray-100' : ''}>
                  <td className='p-2'>{index + 1}</td>
                  <td className='p-2'>{request.user.name}</td>
                  <td className='p-2'>{request.total}</td>
                  <td className='p-2'>{request.status}</td>
                  <td className='p-2'>
                    <button
                      className='rounded-md border border-transparent bg-green-800 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-white transition duration-150 ease-in-out hover:bg-green-700 me-2'
                      onClick={() => viewDetail(request)}
                    >
                      View
                    </button>
                    {hasPermission('approve_request') && request.status === 'pending' &&
                      <button
                        className='rounded-md border border-transparent bg-blue-800 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-white transition duration-150 ease-in-out hover:bg-blue-700 me-2'
                        onClick={() => confirmDelete(request.id, 'approved')}
                      >
                        Approve
                      </button>
                    }
                    {hasPermission('delete_request') && request.status === 'pending' &&
                      <button
                        onClick={() => confirmDelete(request.id, 'rejected')}
                        className='rounded-md border border-transparent bg-red-600 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-white transition duration-150 ease-in-out hover:bg-red-700'
                      >
                        Reject
                      </button>
                    }
                  </td>
                </tr>
              ))
            }
          </tbody>
        </table>
        <Pagination links={purchaseRequests.links} per_page={purchaseRequests.per_page} />
      </div>
    </AuthenticatedLayout>
  );
}

export default PurchaseRequests;
