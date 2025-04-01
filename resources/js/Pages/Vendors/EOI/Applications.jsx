import Alert from "@/Components/ui/Alert"
import Breadcrumb from "@/Components/ui/Breadcrumb"
import Modal from "@/Components/ui/Modal"
import VendorLayout from "@/Layouts/VendorLayout"
import { Link, router, usePage } from "@inertiajs/react"
import { useState } from "react"

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
  const userPermissions = auth?.user?.permissions || [];

  const hasPermission = (permission) => (userPermissions.includes(permission))
  console.log(applications)

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
      <Breadcrumb items={breadCrumbItems} />
      <div className="bg-white p-4 shadow sm:rounded-lg sm:p-8">
        <h2 className="text-center text-2xl font-bold">Applications</h2>
        <div className="flex justify-between items-center">
          {/* <div>
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
          </div> */}
          {/* {hasPermission('create_product') && */}
          {/* <Link className='rounded-md border border-transparent bg-gray-800 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-white transition duration-150 ease-in-out hover:bg-gray-700' href='/products/create'>+ Add Product</Link> */}
          {/* } */}
        </div>

        {flash?.success && (
          <Alert type='success' message={flash.success} />
        )}
        {flash?.error && (
          <Alert type='error' message={flash.error} />
        )}

        <table className='w-full mt-4 text-center overflow-x-auto'>
          <thead>
            <tr className='bg-gray-600 text-white'>
              <th className='p-2'>S.N.</th>
              <th className='p-2'>Eoi</th>
              <th className='p-2'>Submitted date</th>
              <th className='p-2'>Total amount</th>
              <th className='p-2'>Status</th>
              <th className='p-2'>Action</th>
            </tr>
          </thead>
          <tbody>
            {applications.data.length === 0 ?
              <tr><td colSpan={5} className='p-2'>No applications Found</td></tr>
              :
              applications?.data.map((application, index) => (
                <tr key={application.id} className={index % 2 === 1 ? 'bg-gray-100' : ''}>
                  <td className='p-2'>{index + 1}</td>
                  <td className='p-2'>
                    <Link href={`/eoi/${application.eoi.id}`} className="text-blue-600 underline">
                      {application.eoi.title}
                    </Link>
                  </td>
                  <td className='p-2'>{application.application_date || '-'}</td>
                  <td className='p-2'>
                    {application.proposals?.reduce((total, proposal) =>
                      total + proposal.price * proposal.purchase_request_item.quantity, 0
                    )}
                  </td>
                  <td className='p-2'>
                    <span className={application.status == 'pending' ?
                      'bg-yellow-200 border border-yellow-800 text-yellow-800 p-1 rounded-sm text-xs capitalize' :
                      application.status == 'approved' ?
                        'bg-green-200 border border-green-800 text-green-800 p-1 rounded-sm text-xs capitalize' :
                        'bg-red-200 border border-red-800 text-red-800 p-1 rounded-sm text-xs capitalize'
                    }>
                      {application.status}
                    </span>
                  </td>
                  <td className='p-2'>
                    <Link
                      className='rounded-md border border-transparent bg-green-800 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-white transition duration-150 ease-in-out hover:bg-green-700 me-2'
                      onClick={() => viewDetail(application)}
                    >
                      View
                    </Link>

                    {hasPermission('edit_product') &&
                      <Link
                        href={`/applications/${application.id}/edit`}
                        className='rounded-md border border-transparent bg-blue-800 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-white transition duration-150 ease-in-out hover:bg-blue-700 me-2'
                      >
                        Edit
                      </Link>
                    }
                    {hasPermission('delete_application') &&
                      <button
                        onClick={() => confirmDelete(application.id)}
                        className='rounded-md border border-transparent bg-red-600 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-white transition duration-150 ease-in-out hover:bg-red-700'
                      >
                        Delete
                      </button>
                    }
                  </td>
                </tr>
              ))
            }
          </tbody>
        </table>
        {/* <Pagination links={products.links} per_page={products.per_page} /> */}
      </div>
    </VendorLayout>
  )
}

export default Applications