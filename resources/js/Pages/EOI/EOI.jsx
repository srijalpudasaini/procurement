import Alert from '@/Components/ui/Alert'
import Breadcrumb from '@/Components/ui/Breadcrumb'
import Modal from '@/Components/ui/Modal'
import Pagination from '@/Components/ui/Pagination'
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import { Link, usePage, router } from '@inertiajs/react'
import React, { useState } from 'react'
import DataTable from 'react-data-table-component'

const EOI = ({ eois }) => {
  const { flash, auth } = usePage().props;
  const [showModal, setShowModal] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [modalType, setModalType] = useState(null);
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
      title: 'EOIs',
    }
  ]


  const closeDetail = () => {
    setShowModal(false)
  }

  const [status, setStatus] = useState("all")

  const [filteredEOIs, setFilteredEOIs] = useState(eois.data);

  const handleStatusFilter = (selectedStatus) => {
    setStatus(selectedStatus);

    if (selectedStatus === "all") {
      setFilteredEOIs(eois.data);
    } else {
      const filtered = eois.data.filter(eoi => eoi.status === selectedStatus);
      setFilteredEOIs(filtered);
    }
  };
  const columns = [
    { name: "Title", selector: row => row.title, sortable: true },
    { name: "Published Date", selector: row => row.published_date, sortable: true },
    { name: "Deadline Date", selector: row => row.deadline_date, sortable: true },
    {
      name: "Status", cell: row => (
        <span
          className={`rounded-sm text-white font-medium px-2 py-1 capitalize text-xs
            ${row.status == 'published' ? 'bg-green-600' : 'bg-red-600'}
            `}
        >
          {row.status}
        </span>
      )
    },
    {
      name: "Action",
      cell: row => (
        <div className="flex gap-2">
          {/* {hasPermission('edit_document') && (
            <Link
              href={`/documents/${row.id}/edit`}
              className="rounded-md border border-transparent bg-blue-800 px-3 py-2 text-xs font-semibold uppercase text-white transition duration-150 ease-in-out hover:bg-blue-700 me-2"
            >
              Edit
            </Link>
          )}

          {hasPermission('delete_document') && (
            <button
              onClick={() => confirmDelete(row.id)}
              className="rounded-md border border-transparent bg-red-600 px-3 py-2 text-xs font-semibold uppercase tracking-widest text-white transition duration-150 ease-in-out hover:bg-red-700"
            >
              Delete
            </button>
          )} */}
          {row.status == 'closed' &&
            <Link
              className='rounded-md border border-transparent bg-green-800 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-white transition duration-150 ease-in-out hover:bg-green-700 me-2'
              href={`eois/submissions/${row.id}`}
            >
              View
            </Link>
          }
        </div>
      ),
      ignoreRowClick: true,
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
      {/* } */}

      <Breadcrumb items={breadCrumbItems} />
      <div className="bg-white p-4 shadow sm:rounded-lg sm:p-8">
        <h2 className="text-center text-2xl font-bold">EOIs</h2>
        <div className="my-3">
          Filter
          <select value={status} onChange={(e) => handleStatusFilter(e.target.value)} className='py-1 ms-2'>
            <option value="all">Select status</option>
            <option value="published">Published</option>
            <option value="closed">Closed</option>
          </select>
        </div>
        <div className="flex justify-between items-center">
          <div>
            Show
            <select
              name=""
              id=""
              className='py-1 mx-1'
              value={eois.per_page}
              onChange={(e) => router.get('/eois', { per_page: e.target.value })}
            >
              <option value="5">5</option>
              <option value="10">10</option>
              <option value="20">20</option>
            </select>
            entries
          </div>
          {!!hasPermission('create_request') &&
            <Link className='rounded-md border border-transparent bg-gray-800 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-white transition duration-150 ease-in-out hover:bg-gray-700' href='/eois/create'>+ Create EOI</Link>
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
            data={filteredEOIs}
            pagination
            paginationServer
            paginationTotalRows={eois.total}
            paginationPerPage={eois.per_page}
            onChangePage={(page) => {
              router.get('/eois', {
                page,
                per_page: eois.per_page
              }, { preserveState: true, replace: true });
            }}
            onChangeRowsPerPage={(perPage) => {
              router.get('/eois', {
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

export default EOI;
