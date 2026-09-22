import Alert from "@/Components/ui/Alert";
import Breadcrumb from "@/Components/ui/Breadcrumb";
import Modal from "@/Components/ui/Modal";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout"
import { Link, router, usePage } from "@inertiajs/react";
import { useState } from "react";
import DataTable from "react-data-table-component";
import axios from "axios";


const AddEOI = ({ purchaseRequests }) => {
  const { flash, auth } = usePage().props;
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [requestModal, setRequestModal] = useState(null)
  const [deleteId, setDeleteId] = useState(null);
  const [modalType, setModalType] = useState(null);
  const userPermissions = auth?.user?.permissions || [];
  const [selectedRequests, setSelectedRequests] = useState([]);

  // Smart Package Bundler (Bin Packing BFD) State
  const [eoiCreationMode, setEoiCreationMode] = useState('bundler');
  const [bfdCapacity, setBfdCapacity] = useState(2000000);
  const [bfdPreset, setBfdPreset] = useState('2000000');
  const [bfdOnlySelected, setBfdOnlySelected] = useState(false);
  const [bfdLoading, setBfdLoading] = useState(false);
  const [bfdResult, setBfdResult] = useState(null);
  const [bfdError, setBfdError] = useState(null);
  const [isBfdOpen, setIsBfdOpen] = useState(true);

  const handlePresetChange = (presetValue) => {
    setBfdPreset(presetValue);
    if (presetValue !== 'custom') {
      setBfdCapacity(Number(presetValue));
    }
  };

  const runBinPacking = async () => {
    setBfdLoading(true);
    setBfdError(null);
    try {
      const payload = {
        capacity: Number(bfdCapacity),
      };
      if (bfdOnlySelected && selectedRequests.length > 0) {
        payload.request_ids = selectedRequests;
      }
      const response = await axios.post('/eois/auto-bundle', payload);
      if (response.data && response.data.success) {
        setBfdResult(response.data);
      } else {
        setBfdError(response.data?.message || 'Failed to pack requisitions.');
      }
    } catch (err) {
      console.error(err);
      setBfdError(err.response?.data?.message || 'An error occurred while bundling requests.');
    } finally {
      setBfdLoading(false);
    }
  };

  const applyPackage = (pkg) => {
    setSelectedRequests(pkg.request_ids);
  };

  const isPackageSelected = (pkg) => {
    if (!pkg.request_ids || pkg.request_ids.length === 0) return false;
    return pkg.request_ids.length === selectedRequests.length &&
      pkg.request_ids.every(id => selectedRequests.includes(id));
  };

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

  const hasPermission = (permission) => (userPermissions.includes(permission) || auth.user.is_superadmin)

  const viewDetail = (req) => {
    setRequestModal(req)
    setShowViewModal(true)
  }

  const closeDetail = () => {
    setShowViewModal(false)
    setShowModal(false)
    setRequestModal(null)
  }
  const confirmDelete = (id, type) => {
    setModalType(type)
    setDeleteId(id);
    setShowModal(true);
  };

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
      title: 'Create EOI',
    },
  ]


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
            {!!auth.user.is_superadmin &&
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
                    {requestModal?.approvals?.map((approval, index) => (
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
                className='rounded-md border border-transparent bg-blue-800 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-white transition duration-150 ease-in-out hover:bg-blue-700 me-2'
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
        <h2 className="text-center text-2xl font-bold">Add EOI</h2>
        <div className="flex justify-between items-center">
          <div>
            Show
            <select
              name=""
              id=""
              className='py-1 mx-1'
              value={purchaseRequests.per_page}
              onChange={(e) => router.get('/eois/create', { per_page: e.target.value })}
            >
              <option value="5">5</option>
              <option value="10">10</option>
              <option value="20">20</option>
            </select>
            entries
          </div>
        </div>

        {flash?.success && (
          <Alert type='success' message={flash.success} />
        )}
        {flash?.error && (
          <Alert type='error' message={flash.error} />
        )}

        {/* Packaging Method Option Switcher */}
        <div className="my-4 flex items-center justify-between flex-wrap gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-gray-700">Packaging Method:</span>
            <div className="inline-flex rounded-lg bg-gray-200/80 p-0.5 text-xs font-medium">
              <button
                type="button"
                onClick={() => setEoiCreationMode('bundler')}
                className={`rounded-md px-3 py-1.5 transition cursor-pointer ${
                  eoiCreationMode === 'bundler'
                    ? 'bg-white font-bold text-indigo-700 shadow-2xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Auto-Bundle with BFD
              </button>
              <button
                type="button"
                onClick={() => setEoiCreationMode('manual')}
                className={`rounded-md px-3 py-1.5 transition cursor-pointer ${
                  eoiCreationMode === 'manual'
                    ? 'bg-white font-bold text-gray-900 shadow-2xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Manual Selection
              </button>
            </div>
          </div>
          <span className="text-xs text-gray-500">
            {eoiCreationMode === 'bundler'
              ? 'BFD algorithm automatically groups requisitions within statutory limits.'
              : 'Manually select requisitions from the table below.'}
          </span>
        </div>

        {/* Smart Package Bundler (BFD) Panel */}
        {eoiCreationMode === 'bundler' && (
          <div className="my-4 rounded-xl border border-indigo-100 bg-gradient-to-r from-slate-50 to-indigo-50/40 p-5 shadow-xs transition-all">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-indigo-100/60 pb-3">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-xs">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </span>
                <div>
                  <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                    Smart Requisition Bundler
                    <span className="rounded-md bg-indigo-100 px-2 py-0.5 text-[11px] font-semibold text-indigo-800">
                      Best-Fit Decreasing (BFD)
                    </span>
                  </h3>
                  <p className="text-xs text-gray-500">
                    Mathematically bundles approved requisitions into minimal tender envelopes within statutory ceilings.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {bfdResult && (
                  <button
                    type="button"
                    onClick={() => { setBfdResult(null); setBfdError(null); }}
                    className="text-xs font-medium text-gray-500 hover:text-gray-700 px-2 py-1 rounded hover:bg-white cursor-pointer"
                  >
                    Clear Bundles
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsBfdOpen(!isBfdOpen)}
                  className="rounded-md border border-gray-200 bg-white px-2.5 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50 cursor-pointer"
                >
                  {isBfdOpen ? 'Collapse ▲' : 'Expand ▼'}
                </button>
              </div>
            </div>

            {isBfdOpen && (
              <div className="mt-4 space-y-4">
                {/* Controls Bar */}
                <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg bg-white p-3.5 border border-gray-200/80 shadow-2xs">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="text-xs font-semibold text-gray-700">Tender Threshold:</span>
                    <div className="inline-flex rounded-lg bg-gray-100 p-0.5 text-xs font-medium">
                      <button
                        type="button"
                        onClick={() => handlePresetChange('2000000')}
                        className={`rounded-md px-2.5 py-1 transition cursor-pointer ${bfdPreset === '2000000' ? 'bg-white font-semibold text-indigo-700 shadow-2xs' : 'text-gray-600 hover:text-gray-900'}`}
                      >
                        20L (Quotation)
                      </button>
                      <button
                        type="button"
                        onClick={() => handlePresetChange('500000')}
                        className={`rounded-md px-2.5 py-1 transition cursor-pointer ${bfdPreset === '500000' ? 'bg-white font-semibold text-indigo-700 shadow-2xs' : 'text-gray-600 hover:text-gray-900'}`}
                      >
                        5L (Direct)
                      </button>
                      <button
                        type="button"
                        onClick={() => handlePresetChange('5000000')}
                        className={`rounded-md px-2.5 py-1 transition cursor-pointer ${bfdPreset === '5000000' ? 'bg-white font-semibold text-indigo-700 shadow-2xs' : 'text-gray-600 hover:text-gray-900'}`}
                      >
                        50L (Open Tender)
                      </button>
                      <button
                        type="button"
                        onClick={() => handlePresetChange('custom')}
                        className={`rounded-md px-2.5 py-1 transition cursor-pointer ${bfdPreset === 'custom' ? 'bg-white font-semibold text-indigo-700 shadow-2xs' : 'text-gray-600 hover:text-gray-900'}`}
                      >
                        Custom
                      </button>
                    </div>

                    {bfdPreset === 'custom' && (
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-gray-500 font-mono">NPR</span>
                        <input
                          type="number"
                          min="10000"
                          step="10000"
                          value={bfdCapacity}
                          onChange={(e) => setBfdCapacity(e.target.value)}
                          className="w-36 rounded-md border border-gray-300 px-2 py-1 text-xs font-mono focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                          placeholder="e.g. 1500000"
                        />
                      </div>
                    )}

                    {selectedRequests.length > 0 && (
                      <label className="flex items-center gap-1.5 text-xs text-gray-600 cursor-pointer select-none ml-2 border-l border-gray-200 pl-3">
                        <input
                          type="checkbox"
                          checked={bfdOnlySelected}
                          onChange={(e) => setBfdOnlySelected(e.target.checked)}
                          className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 text-xs"
                        />
                        <span>Only bundle selected ({selectedRequests.length})</span>
                      </label>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={bfdLoading || !bfdCapacity || bfdCapacity <= 0}
                      onClick={runBinPacking}
                      className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 disabled:opacity-50 cursor-pointer"
                    >
                      {bfdLoading ? 'Optimizing Packages...' : 'Auto-Bundle with BFD'}
                    </button>
                  </div>
                </div>

                {bfdError && (
                  <div className="rounded-lg bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700">
                    {bfdError}
                  </div>
                )}

                {/* BFD Results Section */}
                {bfdResult && (
                  <div className="space-y-3">
                    {/* Summary Metric Ribbon */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="rounded-lg bg-white p-3 border border-gray-100 shadow-2xs">
                        <span className="text-[11px] font-medium text-gray-500">Tender Packages</span>
                        <div className="text-lg font-bold text-gray-900 mt-0.5 flex items-baseline gap-1.5">
                          <span>{bfdResult.summary.bins_count}</span>
                          <span className="text-[11px] font-normal text-emerald-600">
                            (Min: {bfdResult.summary.theoretical_min_bins})
                          </span>
                        </div>
                      </div>
                      <div className="rounded-lg bg-white p-3 border border-gray-100 shadow-2xs">
                        <span className="text-[11px] font-medium text-gray-500">Total Value Packed</span>
                        <div className="text-lg font-bold text-gray-900 mt-0.5 font-mono">
                          NPR {Number(bfdResult.summary.total_value).toLocaleString()}
                        </div>
                      </div>
                      <div className="rounded-lg bg-white p-3 border border-gray-100 shadow-2xs">
                        <span className="text-[11px] font-medium text-gray-500">Threshold Envelope</span>
                        <div className="text-lg font-bold text-indigo-700 mt-0.5 font-mono">
                          NPR {Number(bfdResult.summary.bin_capacity).toLocaleString()}
                        </div>
                      </div>
                      <div className="rounded-lg bg-white p-3 border border-gray-100 shadow-2xs">
                        <span className="text-[11px] font-medium text-gray-500">Average Utilization</span>
                        <div className="text-lg font-bold text-emerald-600 mt-0.5">
                          {bfdResult.summary.packing_efficiency}%
                        </div>
                      </div>
                    </div>

                    {/* Packages Card Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                      {bfdResult.packages.map((pkg) => {
                        const isSelected = isPackageSelected(pkg);
                        return (
                          <div
                            key={pkg.package_id}
                            className={`flex flex-col justify-between rounded-xl border p-4 bg-white transition shadow-2xs ${
                              isSelected
                                ? 'border-indigo-600 ring-2 ring-indigo-500/20 shadow-md'
                                : 'border-gray-200 hover:border-indigo-300'
                            }`}
                          >
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-bold text-sm text-gray-900 flex items-center gap-1.5">
                                  <span>{pkg.package_name}</span>
                                </span>
                                <span
                                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                                    pkg.is_oversized
                                      ? 'bg-purple-100 text-purple-800'
                                      : pkg.utilization_percent >= 80
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : pkg.utilization_percent >= 50
                                      ? 'bg-blue-100 text-blue-800'
                                      : 'bg-amber-100 text-amber-800'
                                  }`}
                                >
                                  {pkg.is_oversized ? 'Oversized Tender' : `${pkg.utilization_percent}% Fill`}
                                </span>
                              </div>

                              <div className="mb-2">
                                <div className="flex justify-between text-xs mb-1 font-mono">
                                  <span className="font-semibold text-gray-900">
                                    NPR {Number(pkg.total_amount).toLocaleString()}
                                  </span>
                                  <span className="text-gray-400">
                                    / NPR {Number(pkg.capacity).toLocaleString()}
                                  </span>
                                </div>
                                <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
                                  <div
                                    className={`h-full rounded-full transition-all duration-500 ${
                                      pkg.is_oversized
                                        ? 'bg-purple-500'
                                        : pkg.utilization_percent >= 80
                                        ? 'bg-emerald-500'
                                        : 'bg-indigo-500'
                                    }`}
                                    style={{ width: `${Math.min(100, pkg.utilization_percent)}%` }}
                                  />
                                </div>
                              </div>

                              <div className="my-2.5 border-t border-gray-100 pt-2 text-xs">
                                <div className="text-[11px] font-semibold text-gray-500 mb-1.5 flex justify-between">
                                  <span>Assigned Requisitions ({pkg.requests_count})</span>
                                  <span>Remaining: NPR {Number(pkg.remaining_capacity).toLocaleString()}</span>
                                </div>
                                <div className="space-y-1 max-h-28 overflow-y-auto pr-1">
                                  {pkg.requests.map((req) => (
                                    <div
                                      key={req.id}
                                      className="flex items-center justify-between text-[11px] bg-gray-50 rounded px-2 py-1"
                                    >
                                      <span className="font-medium text-gray-800 truncate mr-2">
                                        Req #{req.id} • {req.requested_by}
                                      </span>
                                      <span className="font-mono text-gray-600 shrink-0">
                                        NPR {Number(req.total).toLocaleString()}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>

                            <div className="pt-3 border-t border-gray-100 mt-2">
                              <button
                                type="button"
                                onClick={() => applyPackage(pkg)}
                                className={`w-full py-1.5 px-3 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center justify-center ${
                                  isSelected
                                    ? 'bg-emerald-600 text-white shadow-xs hover:bg-emerald-700'
                                    : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-600 hover:text-white'
                                }`}
                              >
                                {isSelected
                                  ? 'Package Selected'
                                  : `Select Package (${pkg.requests_count} items)`
                                }
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

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

export default AddEOI