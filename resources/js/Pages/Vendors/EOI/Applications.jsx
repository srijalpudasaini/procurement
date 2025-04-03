import Alert from "@/Components/ui/Alert"
import Breadcrumb from "@/Components/ui/Breadcrumb"
import Modal from "@/Components/ui/Modal"
import VendorLayout from "@/Layouts/VendorLayout"
import { Link, router, usePage } from "@inertiajs/react"
import { useState } from "react"
import DataTable from "react-data-table-component"

const Applications = ({ applications }) => {
  const breadCrumbItems = [
    {
      title: 'Dashboard',
      href: '/vendor/dashboard'
    },
    {
      title: 'EOI Applications',
    }
  ];
  const { flash, auth } = usePage().props;
  const [showModal, setShowModal] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  const confirmDelete = (id) => {
    setDeleteId(id);
    setShowModal(true);
  };

  const handleDelete = () => {
    router.delete(`/products/${deleteId}`, {
      onSuccess: () => setShowModal(false),
    });
  };
  const [showViewModal, setShowViewModal] = useState(false);
  const [requestModal, setRequestModal] = useState(null)
  const viewDetail = (req) => {
    setRequestModal(req)
    setShowViewModal(true)
  }

  const columns = [
    {
      name: "Eoi", cell: row => (
        <Link href={`/eoi/${row.eoi.id}`} className="text-blue-600 underline">
          {row.eoi.title}
        </Link>
      ), sortable: true, grow: 3
    },
    { name: "Submitted Date", selector: row => row.application_date, sortable: true },
    {
      name: "Total Amount", selector: row => row.proposals?.reduce((total, proposal) =>
        total + proposal.price * proposal.purchase_request_item.quantity, 0
      ), sortable: true,
    },
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
            onClick={() => viewDetail(row)}
          >
            View
          </button>
        </div>
      ),
      ignoreRowClick: true,
    }
  ];

  return (
    <VendorLayout>
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
      <Modal show={showViewModal} onClose={() => setShowViewModal(false)}>
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-800">
            Request Details
          </h2>
          <div className="modal-content mt-3">
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
                {requestModal?.proposals?.map((pro, index) => (
                  <tr key={index} className="border">
                    <td className="p-2 border">
                      {pro.purchase_request_item.product.name}
                    </td>
                    <td className="p-2 border">
                      {pro.purchase_request_item.quantity}
                    </td>
                    <td className="p-2 border">
                      {pro.price}
                    </td>
                    <td className="p-2 border">
                      {pro.purchase_request_item.specifications}
                    </td>
                  </tr>
                ))}
              </tbody>

            </table>

            <h2 className='mb-2 text-lg font-semibold text-gray-800'>Documents uploaded</h2>
            <ul className='ms-6 list-disc'>
              {requestModal?.documents.map((doc, index) => (
                <li key={index}>
                  <a href={`/storage/${doc.name}`} className='text-blue-600 font-bold' target='blank'>
                    {doc.document.title}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div className="mt-4 flex justify-end">
            <button
              onClick={() => setShowViewModal(false)}
              className="px-4 py-2 text-gray-700 bg-gray-200 rounded mr-2 hover:bg-gray-300"
            >
              Close
            </button>
          </div>
        </div>
      </Modal>
      <Breadcrumb items={breadCrumbItems} />
      <div className="bg-white p-4 shadow sm:rounded-lg sm:p-8">
        <h2 className="text-center text-2xl font-bold">Applications</h2>
        <div className="flex justify-between items-center">
          <div>
            Show
            <select
              name=""
              id=""
              className='py-1 mx-1'
              value={applications.per_page}
              onChange={(e) => router.get('/vendor/eois', { per_page: e.target.value })}
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

        <div className="my-4">
          <DataTable
            columns={columns}
            data={applications.data}
            pagination
            paginationServer
            paginationTotalRows={applications.total}
            paginationPerPage={applications.per_page}
            onChangePage={(page) => {
              router.get('/vendor/eois', {
                page,
                per_page: applications.per_page
              }, { preserveState: true, replace: true });
            }}
            onChangeRowsPerPage={(perPage) => {
              router.get('/vendor/eois', {
                per_page: perPage,
                page: 1
              }, { preserveState: true, replace: true });
            }}
            paginationComponentOptions={{ noRowsPerPage: true }}
          />
        </div>
      </div>
    </VendorLayout>
  )
}

export default Applications