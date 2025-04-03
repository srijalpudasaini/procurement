import Alert from '@/Components/ui/Alert'
import Breadcrumb from '@/Components/ui/Breadcrumb'
import Modal from '@/Components/ui/Modal'
import Pagination from '@/Components/ui/Pagination'
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
// import { compact } from '@headlessui/react/dist/utils/render'
import { Link, usePage, router } from '@inertiajs/react'
import React, { useState } from 'react'
import DataTable from 'react-data-table-component'

const PurchaseRequests = ({ purchaseRequests }) => {
  const { flash, auth } = usePage().props;
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [requestModal, setRequestModal] = useState(null)
  const [deleteId, setDeleteId] = useState(null);
  const [modalType, setModalType] = useState(null);
  const [selectedRequests, setSelectedRequests] = useState([])
  const userPermissions = auth?.user?.permissions || [];

  const hasPermission = (permission) => (userPermissions.includes(permission) || auth.user.is_superadmin)

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
    setShowModal(false)
    setShowViewModal(false)
    setRequestModal(null)
  }

  const handleChange = (e, request) => {
    const { checked } = e.target;
    if (request.status != 'approved') {
      return;
    }
    if (checked) {
      setSelectedRequests([...selectedRequests, request.id])
    }
    else {
      setSelectedRequests(selectedRequests.filter(req => req != request.id))
    }
  }

  const columns = [
    ...hasPermission('create_eoi') ?
      [{
        name: "", cell: row => (
          <input type="checkbox"
            disabled={row.status != 'approved'}
            onChange={(e) => handleChange(e, row)}
            checked={selectedRequests.includes(row.id)}
            className={`${row.status != 'approved' ? 'cursor-not-allowed' : 'cursor-pointer'}`}
          />
        ),
        grow: 0,
        minWidth: 'fit-content',
        maxWidth: 'fit-content',
        center: true
      }] : [],
    { name: "Requested By", selector: row => row.user.name, sortable: true,center:true },
    { name: "Total", selector: row => row.total, sortable: true,center:true },
    {
      name: "Status", cell: row => (
        <span
          className={`rounded-sm text-white font-medium px-2 py-1 capitalize text-xs
            ${row.status == 'published' ? 'bg-blue-600' :
              row.status == 'approved' ? 'bg-green-600' :
                row.status == 'rejected' ? 'bg-red-600' :
                  'bg-yellow-600'
            }
            `}
        >
          {row.status}
        </span>
      ),
      center:true
    },
    {
      name: "Action",
      cell: row => (
        <div className="flex gap-1 flex-1 flex-nowrap justify-center">
          <button
            className='min-w-fit rounded-md border border-transparent bg-green-800 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-white transition duration-150 ease-in-out hover:bg-green-700'
            onClick={() => viewDetail(row)}
          >
            View
          </button>
          {hasPermission('approve_request') && row.status === 'pending' &&
            <button
              className='min-w-fit rounded-md border border-transparent bg-blue-800 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-white transition duration-150 ease-in-out hover:bg-blue-700'
              onClick={() => confirmDelete(row.id, 'approved')}
            >
              Approve
            </button>
          }
          {hasPermission('delete_request') && row.status === 'pending' &&
            <button
              onClick={() => confirmDelete(row.id, 'rejected')}
              className='min-w-fit rounded-md border border-transparent bg-red-600 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-white transition duration-150 ease-in-out hover:bg-red-700'
            >
              Reject
            </button>
          }
        </div>
      ),
      ignoreRowClick: true,
      center:true
    }
  ];
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
                  <th className="p-2 border">Specification</th>
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
                className='rounded-md border border-transparent bg-blue-800 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-white transition duration-150 ease-in-out hover:bg-blue-700'
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

        {hasPermission('create_eoi') &&
          <div className="my-3">
            {selectedRequests.length < 1 ?
              <Link
                className='rounded-md border border-transparent px-4 py-2 text-xs font-semibold uppercase tracking-widest text-white transition duration-150 ease-in-out me-2 bg-gray-500 cursor-not-allowed'
                onClick={(e) => e.preventDefault()}
              >
                ({selectedRequests.length} selected)
                Create EOI
              </Link> :
              <Link className='rounded-md border border-transparent px-4 py-2 text-xs font-semibold uppercase tracking-widest text-white transition duration-150 ease-in-out me-2 bg-blue-800 hover:bg-blue-700 cursor-pointer'
                href={`/eois/publish?requests=${selectedRequests}`}
              >
                ({selectedRequests.length} selected)
                Create EOI
              </Link>
            }
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
            data={purchaseRequests.data}
            pagination
            paginationServer
            paginationTotalRows={purchaseRequests.total}
            paginationPerPage={purchaseRequests.per_page}
            onChangePage={(page) => {
              router.get('/requests', {
                page,
                per_page: purchaseRequests.per_page
              }, { preserveState: true, replace: true });
            }}
            onChangeRowsPerPage={(perPage) => {
              router.get('/requests', {
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

export default PurchaseRequests;
