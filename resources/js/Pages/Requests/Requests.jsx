import InputLabel from '@/Components/Form/InputLabel'
import Alert from '@/Components/ui/Alert'
import Breadcrumb from '@/Components/ui/Breadcrumb'
import Modal from '@/Components/ui/Modal'
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import { Link, usePage, router } from '@inertiajs/react'
import React, { useState } from 'react'
import DataTable from 'react-data-table-component'

const PurchaseRequests = ({ requests, viewType }) => {
  const { flash, auth } = usePage().props;
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [requestModal, setRequestModal] = useState(null)
  const [deleteId, setDeleteId] = useState(null);
  const [modalType, setModalType] = useState(null);
  const [selectedRequests, setSelectedRequests] = useState([])
  const userPermissions = auth?.user?.permissions || [];
  const [requestStatus, setRequestStatus] = useState({ status: '', remarks: '' })

  const hasPermission = (permission) => (userPermissions.includes(permission) || auth.user.is_superadmin)

  const normalizedData = viewType === 'approval'
    ? requests.data.map(approval => ({
      ...approval,
      purchase_request: {
        ...approval.purchase_request,
        approval_id: approval.id // Attach approval ID for action handling
      }
    }))
    : requests.data;
  const confirmDelete = (id, type) => {
    setModalType(type)
    setRequestStatus({ ...requestStatus, status: type })
    setDeleteId(id);
    setShowModal(true);
  };


  const handleDelete = () => {
    router.put(`/requests/updateStatus/${deleteId}`, requestStatus, {
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

  const approvalColumns = [
    ...hasPermission('create_eoi') ?
      [{
        name: "", cell: row => (
          <input type="checkbox"
            disabled={row.purchase_request.status != 'approved'}
            onChange={(e) => handleChange(e, row)}
            checked={selectedRequests.includes(row.purchase_request.id)}
            className={`mx-auto inline-block ${row.status != 'approved' ? 'cursor-not-allowed' : 'cursor-pointer'}`}
          />
        ),
        grow: 0,

      }] : [],
    { name: "Requested By", selector: row => row.purchase_request.user?.name, sortable: true },
    { name: "Total", selector: row => row.purchase_request.total, sortable: true },
    {
      name: "Status", cell: row => (
        <span
          className={`rounded-sm text-white font-medium px-2 py-1 capitalize text-xs
            ${row.status == 'approved' ? 'bg-green-600' :
              row.status == 'rejected' ? 'bg-red-600' :
                'bg-yellow-600'
            }
            `}
        >
          {row.status}
        </span>
      ),

    },
    {
      name: "Action",
      cell: row => (
        <div className="flex gap-1 flex-1 flex-nowrap justify-center">
          <button
            className='min-w-fit rounded-md border border-transparent bg-green-800 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-white transition duration-150 ease-in-out hover:bg-green-700'
            onClick={() => viewDetail(row.purchase_request)}
          >
            View
          </button>
          {!!hasPermission('approve_request') && row.status === 'pending' &&
            <button
              className='min-w-fit rounded-md border border-transparent bg-blue-800 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-white transition duration-150 ease-in-out hover:bg-blue-700'
              onClick={() => confirmDelete(row.id, 'approved')}
            >
              Approve
            </button>
          }
          {!!hasPermission('delete_request') && row.status === 'pending' &&
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

    }
  ];

  const requestColumns = [
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
      }] : [],
    { name: "Requested By", selector: row => row.user.name, sortable: true },
    { name: "Total", selector: row => row.total, sortable: true },
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
          {!!hasPermission('approve_request') && row.status === 'pending' &&
            <button
              className='min-w-fit rounded-md border border-transparent bg-blue-800 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-white transition duration-150 ease-in-out hover:bg-blue-700'
              onClick={() => confirmDelete(row.id, 'approved')}
            >
              Approve
            </button>
          }
          {!!hasPermission('delete_request') && row.status === 'pending' &&
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

    }
  ]


  return (
    <AuthenticatedLayout>
      {/* {hasPermission('edit_request') && */}
      <Modal show={showModal} onClose={closeDetail}>
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-800">
            Are you sure you want to {modalType == 'approved' ? 'approve' : 'reject'} this request?
          </h2>
          <div className="mt-2">
            <InputLabel htmlFor="remark" value="Enter your remark" />
            <textarea id="remark" value={requestStatus.remarks} onChange={(e) => setRequestStatus({ ...requestStatus, remarks: e.target.value })} rows='3' className='w-full rounded-sm border border-gray-400 mt-1'></textarea>
          </div>
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
            <h3 className="text-md font-semibold text-gray-800 mt-4">
                    Products
                  </h3>
            <table className="requisition-form w-full mb-4 mt-3 table border-collapse overflow-x-auto text-center">
              <thead>
                <tr>
                  <th className="p-2 border">Product</th>
                  <th className="p-2 border">Quantity</th>
                  <th className="p-2 border">Price</th>
                  <th className="p-2 border">Specification</th>
                  <th className="p-2 border">Priority</th>
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
                    <td className="p-2 border">
                      {pro.priority}
                    </td>
                  </tr>
                ))}
              </tbody>

            </table>
            {auth.user.is_superadmin &&
              (
                <>
                  <h3 className="text-md font-semibold text-gray-800">
                    Approvals
                  </h3>
                  <table className='w-full mt-3 table border-collapse overflow-x-auto text-center'>
                    <tr>
                      <th className='p-2 border'>S.N</th>
                      <th className='p-2 border'>Approved By</th>
                      <th className='p-2 border'>Step</th>
                      <th className='p-2 border'>Status</th>
                      <th className='p-2 border'>Remarks</th>
                    </tr>
                    {requestModal?.approvals.map((approval,index)=>(
                    <tr key={index}>
                      <td className='p-2 border'>{index + 1}</td>
                      <td className='p-2 border'>{approval.approver?.name}</td>
                      <td className='p-2 border'>{approval.step.step_number}</td>
                      <td className='p-2 border'>{approval.status}</td>
                      <td className='p-2 border'>{approval.remark}</td>
                    </tr>
                    ))}
                  </table>
                </>
              )
            }
          </div>
          <div className="mt-4 flex justify-end">
            <button
              onClick={() => setShowViewModal(false)}
              className="px-4 py-2 text-gray-700 bg-gray-200 rounded mr-2 hover:bg-gray-300"
            >
              Close
            </button>
            {!!hasPermission('approve_request') && requestModal?.status === 'pending' &&
              <button
                className='rounded-md border border-transparent bg-blue-800 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-white transition duration-150 ease-in-out hover:bg-blue-700'
                onClick={() => confirmDelete(requestModal?.id, 'approved')}
              >
                Approve
              </button>
            }
            {!!hasPermission('delete_request') && requestModal?.status === 'pending' &&
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
              value={requests.per_page}
              onChange={(e) => router.get('/requests', { per_page: e.target.value })}
            >
              <option value="5">5</option>
              <option value="10">10</option>
              <option value="20">20</option>
            </select>
            entries
          </div>
          {!!hasPermission('create_request') &&
            <Link className='rounded-md border border-transparent bg-gray-800 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-white transition duration-150 ease-in-out hover:bg-gray-700' href='/requests/create'>+ Create Request</Link>
          }
        </div>

        {!!hasPermission('create_eoi') &&
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
            columns={viewType == 'approval' ? approvalColumns : requestColumns}
            data={normalizedData}
            pagination
            paginationServer
            paginationTotalRows={requests.total}
            paginationPerPage={requests.per_page}
            onChangePage={(page) => {
              router.get('/requests', {
                page,
                per_page: requests.per_page
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
