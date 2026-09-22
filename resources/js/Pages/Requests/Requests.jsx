import InputLabel from '@/Components/Form/InputLabel'
import Alert from '@/Components/ui/Alert'
import Breadcrumb from '@/Components/ui/Breadcrumb'
import Modal from '@/Components/ui/Modal'
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import { Link, usePage, router } from '@inertiajs/react'
import React, { useState } from 'react'
import DataTable from 'react-data-table-component'

const PurchaseRequests = ({
  requests,
  viewType = 'standard',
  canViewAll = false,
  canApprove = false,
  pendingApprovalsCount = 0,
  currentRoleId = null
}) => {
  const { flash, auth } = usePage().props;
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [requestModal, setRequestModal] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [modalType, setModalType] = useState(null);
  const [selectedRequests, setSelectedRequests] = useState([]);
  const userPermissions = auth?.user?.permissions || [];
  const [requestStatus, setRequestStatus] = useState({ status: '', remarks: '' });

  const hasPermission = (permission) =>
    userPermissions.includes(permission) || !!auth?.user?.is_superadmin;

  const canUserApproveRequest = (request) => {
    if (!hasPermission('approve_request')) return false;
    if (!request || request.status !== 'pending') return false;
    if (auth.user?.is_superadmin) return true;
    if (!request.approvals || request.approvals.length === 0) return false;

    // Find the first pending step in workflow sequence
    const sortedApprovals = [...request.approvals].sort((a, b) => {
      const stepA = a.step?.step_number ?? a.id;
      const stepB = b.step?.step_number ?? b.id;
      return stepA - stepB;
    });

    const activePendingStep = sortedApprovals.find((app) => app.status === 'pending');
    if (!activePendingStep) return false;

    return !!(currentRoleId && activePendingStep.step?.role_id === currentRoleId);
  };

  const normalizedData = viewType === 'approval'
    ? (requests?.data || []).map(approval => ({
        ...approval,
        purchase_request: {
          ...approval.purchase_request,
          approval_id: approval.id,
          approvals: approval.purchase_request?.approvals || []
        }
      }))
    : (requests?.data || []);

  const confirmDelete = (id, type) => {
    setModalType(type);
    setRequestStatus({ status: type, remarks: '' });
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
  ];

  const viewDetail = (req) => {
    setRequestModal(req);
    setShowViewModal(true);
  };

  const closeDetail = () => {
    setShowModal(false);
    setShowViewModal(false);
    setRequestModal(null);
  };

  const handleChange = (e, request) => {
    const { checked } = e.target;
    const reqObj = request.purchase_request ? request.purchase_request : request;
    if (reqObj.status !== 'approved') {
      return;
    }
    if (checked) {
      setSelectedRequests(prev => [...prev, reqObj.id]);
    } else {
      setSelectedRequests(prev => prev.filter(id => id !== reqObj.id));
    }
  };

  const approvalColumns = [
    ...(hasPermission('create_eoi') ?
      [{
        name: "",
        cell: row => (
          <input
            type="checkbox"
            disabled={row.purchase_request?.status !== 'approved'}
            onChange={(e) => handleChange(e, row)}
            checked={selectedRequests.includes(row.purchase_request?.id)}
            className={`mx-auto inline-block ${row.purchase_request?.status !== 'approved' ? 'cursor-not-allowed' : 'cursor-pointer'}`}
          />
        ),
        grow: 0,
      }] : []),
    {
      name: "Requested By",
      selector: row => row.purchase_request?.user?.name || 'Unknown',
      sortable: true
    },
    {
      name: "Total",
      selector: row => `$${Number(row.purchase_request?.total || 0).toLocaleString()}`,
      sortable: true
    },
    {
      name: "Status",
      cell: row => (
        <span
          className={`rounded-sm text-white font-medium px-2 py-0.5 capitalize text-xs ${
            row.status === 'approved' ? 'bg-green-600' :
            row.status === 'rejected' ? 'bg-red-600' :
            'bg-yellow-600'
          }`}
        >
          {row.status}
        </span>
      ),
    },
    {
      name: "Action",
      cell: row => (
        <div className="flex gap-1.5 flex-1 flex-nowrap justify-center">
          <button
            className='min-w-fit rounded-md border border-transparent bg-gray-700 px-3 py-1.5 text-xs font-semibold uppercase tracking-widest text-white transition duration-150 ease-in-out hover:bg-gray-600'
            onClick={() => viewDetail(row.purchase_request)}
          >
            View
          </button>
          {hasPermission('approve_request') && row.status === 'pending' && (
            <>
              <button
                className='min-w-fit rounded-md border border-transparent bg-emerald-600 px-3 py-1.5 text-xs font-semibold uppercase tracking-widest text-white transition duration-150 ease-in-out hover:bg-emerald-700'
                onClick={() => confirmDelete(row.id, 'approved')}
              >
                Approve
              </button>
              <button
                onClick={() => confirmDelete(row.id, 'rejected')}
                className='min-w-fit rounded-md border border-transparent bg-red-600 px-3 py-1.5 text-xs font-semibold uppercase tracking-widest text-white transition duration-150 ease-in-out hover:bg-red-700'
              >
                Reject
              </button>
            </>
          )}
        </div>
      ),
      ignoreRowClick: true,
    }
  ];

  const requestColumns = [
    ...(hasPermission('create_eoi') ?
      [{
        name: "",
        cell: row => (
          <input
            type="checkbox"
            disabled={row.status !== 'approved'}
            onChange={(e) => handleChange(e, row)}
            checked={selectedRequests.includes(row.id)}
            className={`${row.status !== 'approved' ? 'cursor-not-allowed' : 'cursor-pointer'}`}
          />
        ),
        grow: 0,
      }] : []),
    {
      name: "Requested By",
      selector: row => row.user?.name || 'Unknown',
      sortable: true
    },
    {
      name: "Total",
      selector: row => `$${Number(row.total || 0).toLocaleString()}`,
      sortable: true
    },
    {
      name: "Status",
      cell: row => (
        <span
          className={`rounded-sm text-white font-medium px-2 py-0.5 capitalize text-xs ${
            row.status === 'published' ? 'bg-blue-600' :
            row.status === 'approved' ? 'bg-green-600' :
            row.status === 'rejected' ? 'bg-red-600' :
            'bg-yellow-600'
          }`}
        >
          {row.status}
        </span>
      ),
    },
    {
      name: "Action",
      cell: row => (
        <div className="flex gap-1.5 flex-1 flex-nowrap justify-center">
          <button
            className='min-w-fit rounded-md border border-transparent bg-gray-700 px-3 py-1.5 text-xs font-semibold uppercase tracking-widest text-white transition duration-150 ease-in-out hover:bg-gray-600'
            onClick={() => viewDetail(row)}
          >
            View
          </button>
          {canUserApproveRequest(row) && (
            <>
              <button
                className='min-w-fit rounded-md border border-transparent bg-emerald-600 px-3 py-1.5 text-xs font-semibold uppercase tracking-widest text-white transition duration-150 ease-in-out hover:bg-emerald-700'
                onClick={() => confirmDelete(row.id, 'approved')}
              >
                Approve
              </button>
              <button
                onClick={() => confirmDelete(row.id, 'rejected')}
                className='min-w-fit rounded-md border border-transparent bg-red-600 px-3 py-1.5 text-xs font-semibold uppercase tracking-widest text-white transition duration-150 ease-in-out hover:bg-red-700'
              >
                Reject
              </button>
            </>
          )}
        </div>
      ),
      ignoreRowClick: true,
    }
  ];

  const getPageTitle = () => {
    if (viewType === 'approval') return 'Purchase Requests Pending Approval';
    if (canViewAll) return 'All Organization Purchase Requests';
    return 'My Purchase Requests';
  };

  return (
    <AuthenticatedLayout>
      {/* Approve / Reject Modal */}
      <Modal show={showModal} onClose={closeDetail}>
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-800">
            Are you sure you want to {modalType === 'approved' ? 'approve' : 'reject'} this request?
          </h2>
          <div className="mt-3">
            <InputLabel htmlFor="remark" value="Remarks (Optional)" />
            <textarea
              id="remark"
              value={requestStatus.remarks}
              onChange={(e) => setRequestStatus({ ...requestStatus, remarks: e.target.value })}
              rows='3'
              placeholder="Enter remarks or justification..."
              className='w-full rounded-md border border-gray-300 mt-1 p-2 text-sm focus:border-emerald-500 focus:ring-emerald-500'
            ></textarea>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <button
              onClick={() => setShowModal(false)}
              className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              className={`px-4 py-2 text-xs font-semibold uppercase tracking-wider text-white rounded-md transition ${
                modalType === 'rejected' ? 'bg-red-600 hover:bg-red-700' : 'bg-emerald-600 hover:bg-emerald-700'
              }`}
            >
              Confirm {modalType === 'approved' ? 'Approval' : 'Rejection'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Details Modal */}
      <Modal show={showViewModal} onClose={closeDetail} maxWidth="2xl">
        <div className="p-6">
          <div className="flex justify-between items-center pb-3 border-b border-gray-200">
            <h2 className="text-lg font-bold text-gray-800">
              Purchase Request #{requestModal?.id} Details
            </h2>
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-bold uppercase ${
                requestModal?.status === 'approved' ? 'bg-emerald-100 text-emerald-800' :
                requestModal?.status === 'rejected' ? 'bg-red-100 text-red-800' :
                requestModal?.status === 'published' ? 'bg-blue-100 text-blue-800' :
                'bg-amber-100 text-amber-800'
              }`}
            >
              {requestModal?.status}
            </span>
          </div>

          <div className="modal-content mt-4 space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm bg-gray-50 p-3.5 rounded-lg border border-gray-100">
              <div>
                <span className="text-gray-500 text-xs block">Requested By</span>
                <span className="font-semibold text-gray-800">{requestModal?.user?.name || 'N/A'}</span>
              </div>
              <div>
                <span className="text-gray-500 text-xs block">Total Amount</span>
                <span className="font-semibold text-emerald-700 font-mono">
                  ${Number(requestModal?.total || 0).toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-gray-500 text-xs block">Requested Date</span>
                <span className="font-semibold text-gray-800">
                  {requestModal?.created_at ? new Date(requestModal.created_at).toLocaleDateString() : 'N/A'}
                </span>
              </div>
              <div>
                <span className="text-gray-500 text-xs block">Items Count</span>
                <span className="font-semibold text-gray-800">
                  {requestModal?.purchase_request_items?.length || 0} item(s)
                </span>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-bold text-gray-800 mb-2">Requested Items</h3>
              <table className="requisition-form w-full table border-collapse overflow-x-auto text-xs text-center border border-gray-200 rounded">
                <thead>
                  <tr className="bg-gray-100 text-gray-700 font-semibold">
                    <th className="p-2 border">Product</th>
                    <th className="p-2 border">Quantity</th>
                    <th className="p-2 border">Unit Price</th>
                    <th className="p-2 border">Total</th>
                    <th className="p-2 border">Specification</th>
                  </tr>
                </thead>
                <tbody>
                  {requestModal?.purchase_request_items?.map((pro, index) => (
                    <tr key={index} className="border-b hover:bg-gray-50">
                      <td className="p-2 border font-medium text-left">
                        {pro.product?.name || 'Item'}
                      </td>
                      <td className="p-2 border">
                        {pro.quantity}
                      </td>
                      <td className="p-2 border font-mono">
                        ${Number(pro.price).toLocaleString()}
                      </td>
                      <td className="p-2 border font-mono font-semibold">
                        ${Number(pro.price * pro.quantity).toLocaleString()}
                      </td>
                      <td className="p-2 border text-gray-600 text-left">
                        {pro.specifications || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Approvals Audit Steps */}
            {(auth.user.is_superadmin || hasPermission('view_all_request') || hasPermission('approve_request')) &&
              requestModal?.approvals && requestModal.approvals.length > 0 && (
                <div className="mt-4 pt-3 border-t border-gray-200">
                  <h3 className="text-sm font-bold text-gray-800 mb-2">
                    Approval Workflow Steps
                  </h3>
                  <table className='w-full table border-collapse overflow-x-auto text-xs border border-gray-200 rounded'>
                    <thead>
                      <tr className="bg-gray-100 text-gray-700">
                        <th className='p-2 border text-center w-12'>Step</th>
                        <th className='p-2 border text-left'>Role</th>
                        <th className='p-2 border text-left'>Approver</th>
                        <th className='p-2 border text-center'>Status</th>
                        <th className='p-2 border text-left'>Remarks</th>
                      </tr>
                    </thead>
                    <tbody>
                      {requestModal.approvals.map((approval, index) => (
                        <tr key={index} className="border-b hover:bg-gray-50">
                          <td className='p-2 border text-center font-medium'>
                            {approval.step?.step_number || (index + 1)}
                          </td>
                          <td className='p-2 border font-medium text-gray-700'>
                            {approval.step?.role?.name ? approval.step.role.name.replace(/_/g, ' ') : '-'}
                          </td>
                          <td className='p-2 border text-gray-700'>
                            {approval.approver?.name || '-'}
                          </td>
                          <td className='p-2 border text-center'>
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                approval.status === 'approved' ? 'bg-green-600 text-white' :
                                approval.status === 'rejected' ? 'bg-red-600 text-white' :
                                'bg-yellow-600 text-white'
                              }`}
                            >
                              {approval.status}
                            </span>
                          </td>
                          <td className='p-2 border text-gray-600'>
                            {approval.remark || '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            }
          </div>

          <div className="mt-6 pt-3 border-t border-gray-200 flex justify-end items-center gap-2">
            <button
              onClick={closeDetail}
              className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition"
            >
              Close
            </button>
            {(canUserApproveRequest(requestModal) || (viewType === 'approval' && requestModal?.status === 'pending')) && (
              <>
                <button
                  className='rounded-md border border-transparent bg-emerald-600 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-white transition duration-150 ease-in-out hover:bg-emerald-700'
                  onClick={() => confirmDelete(requestModal?.approval_id || requestModal?.id, 'approved')}
                >
                  Approve
                </button>
                <button
                  onClick={() => confirmDelete(requestModal?.approval_id || requestModal?.id, 'rejected')}
                  className='rounded-md border border-transparent bg-red-600 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-white transition duration-150 ease-in-out hover:bg-red-700'
                >
                  Reject
                </button>
              </>
            )}
          </div>
        </div>
      </Modal>

      <Breadcrumb items={breadCrumbItems} />

      <div className="bg-white p-4 shadow-sm sm:rounded-xl sm:p-6 border border-gray-200">
        {/* View Switcher Tabs (For Approvers with View All permission) */}
        {canViewAll && canApprove && (
          <div className="flex border-b border-gray-200 mb-5 gap-4">
            <button
              onClick={() => router.get('/requests', { view: 'all' }, { preserveState: false })}
              className={`pb-3 px-2 text-sm font-bold border-b-2 transition flex items-center gap-2 ${
                viewType !== 'approval'
                  ? 'border-[#00AB66] text-[#00AB66]'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <i className="fa fa-list"></i>
              <span>All Organization Requests</span>
            </button>
            <button
              onClick={() => router.get('/requests', { view: 'pending' }, { preserveState: false })}
              className={`pb-3 px-2 text-sm font-bold border-b-2 transition flex items-center gap-2 ${
                viewType === 'approval'
                  ? 'border-[#00AB66] text-[#00AB66]'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <i className="fa fa-clock-o"></i>
              <span>Pending My Approval</span>
              {pendingApprovalsCount > 0 && (
                <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-amber-100 text-amber-800">
                  {pendingApprovalsCount}
                </span>
              )}
            </button>
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-4 border-b border-gray-100 gap-3">
          <div>
            <h1 className="text-xl font-bold text-gray-900">{getPageTitle()}</h1>
            <p className="text-xs text-gray-500 mt-0.5">
              {viewType === 'approval'
                ? 'Review and take action on purchase requests waiting for your approval.'
                : canViewAll
                ? 'Overview of all requisitions across all departments in the organization.'
                : 'Manage and track your submitted purchase requisitions.'}
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {hasPermission('create_request') && (
              <Link
                className='rounded-lg bg-[#00AB66] hover:bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition flex items-center gap-1.5'
                href='/requests/create'
              >
                <i className="fa fa-plus text-xs"></i>
                <span>Create Request</span>
              </Link>
            )}
          </div>
        </div>

        {/* Action toolbar: Entries selector & Create EOI */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
          <div className="text-xs text-gray-600 flex items-center">
            Show
            <select
              className='py-1 px-2 mx-1.5 text-xs rounded border-gray-300 focus:ring-emerald-500 focus:border-emerald-500'
              value={requests?.per_page || 10}
              onChange={(e) => router.get('/requests', {
                per_page: e.target.value,
                view: viewType === 'approval' ? 'pending' : (canViewAll ? 'all' : undefined)
              }, { preserveState: true })}
            >
              <option value="5">5</option>
              <option value="10">10</option>
              <option value="20">20</option>
              <option value="50">50</option>
            </select>
            entries
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/eois/create"
              className="rounded-lg px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-xs transition"
            >
              Auto-Bundle with BFD
            </Link>

            {hasPermission('create_eoi') && (
              <div>
                {selectedRequests.length < 1 ? (
                  <button
                    type="button"
                    disabled
                    className='rounded-lg px-3.5 py-2 text-xs font-semibold text-gray-400 bg-gray-100 cursor-not-allowed transition'
                  >
                    Create EOI ({selectedRequests.length} selected)
                  </button>
                ) : (
                  <Link
                    className='rounded-lg px-3.5 py-2 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 shadow-sm transition'
                    href={`/eois/publish?requests=${selectedRequests.join(',')}`}
                  >
                    Create EOI ({selectedRequests.length} selected)
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>

        {flash?.success && (
          <div className="mb-4">
            <Alert type='success' message={flash.success} />
          </div>
        )}
        {flash?.error && (
          <div className="mb-4">
            <Alert type='error' message={flash.error} />
          </div>
        )}

        <div className="rounded-lg border border-gray-200 overflow-hidden">
          <DataTable
            columns={viewType === 'approval' ? approvalColumns : requestColumns}
            data={normalizedData}
            pagination
            paginationServer
            paginationTotalRows={requests?.total || 0}
            paginationPerPage={requests?.per_page || 10}
            onChangePage={(page) => {
              router.get('/requests', {
                page,
                view: viewType === 'approval' ? 'pending' : (canViewAll ? 'all' : undefined),
                per_page: requests?.per_page || 10
              }, { preserveState: true, replace: true });
            }}
            onChangeRowsPerPage={(perPage) => {
              router.get('/requests', {
                per_page: perPage,
                page: 1,
                view: viewType === 'approval' ? 'pending' : (canViewAll ? 'all' : undefined)
              }, { preserveState: true, replace: true });
            }}
            paginationComponentOptions={{ noRowsPerPage: true }}
            noDataComponent={
              <div className="p-8 text-center text-gray-400 text-sm">
                <i className="fa fa-folder-open-o text-2xl mb-2 block"></i>
                No purchase requests found.
              </div>
            }
          />
        </div>
      </div>
    </AuthenticatedLayout>
  );
};

export default PurchaseRequests;
