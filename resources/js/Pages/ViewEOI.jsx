import Layout from "@/Layouts/Layout"
import { Link, usePage } from "@inertiajs/react"

const ViewEoi = ({ eoi }) => {
    const { auth } = usePage().props;
    console.log(eoi)
    return (
        <>
            <Layout>
                <div className="container">
                    <div className="w-2/3 mx-auto border border-gray-200 m-2 p-6">
                        <h2 className="text-2xl text-center font-semibold mb-4">{eoi.title}</h2>
                        <table className="mb-3">
                            <tr>
                                <th className="p-1 text-gray-700 text-start">EOI Number:</th>
                                <td className="p-1 text-gray-700">{eoi.eoi_number}</td>
                            </tr>
                            <tr>
                                <th className="p-1 text-gray-700 text-start">Published on:</th>
                                <td className="p-1 text-gray-700">{eoi.published_date}</td>
                            </tr>
                            <tr>
                                <th className="p-1 text-gray-700 text-start">Deadline:</th>
                                <td className="p-1 text-gray-700">{eoi.deadline_date}</td>
                            </tr>
                        </table>
                        <h3 className="text-xl font-semibold mb-1">Details</h3>
                        <p className="text-gray-700">{eoi.description}</p>
                        <h3 className="text-xl font-semibold mb-1 mt-6 pt-3 border-t border-dotted border-gray-400">Required Items</h3>
                        <table className="requisition-form w-full mx-auto mt-3 table border-collapse overflow-x-auto">
                            <thead>
                                <tr className="text-white bg-[#00AB66]">
                                    <th className="p-2 border">Product</th>
                                    <th className="p-2 border">Unit</th>
                                    <th className="p-2 border">Quantity</th>
                                    <th className="p-2 border">Specification</th>
                                </tr>
                            </thead>
                            <tbody>
                                {eoi.purchase_request_items?.map((pro, index) => (
                                    <tr key={index} className="border">
                                        <td className="p-2 border">
                                            {pro.product.name}
                                        </td>
                                        <td className="p-2 border">
                                            {pro.product.unit}
                                        </td>
                                        <td className="p-2 border">
                                            {pro.quantity}
                                        </td>
                                        <td className="p-2 border">
                                            {pro.specifications}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>

                        </table>
                        <h3 className="text-xl font-semibold mb-1 mt-6 pt-3 border-t border-dotted border-gray-400">Required Documents</h3>
                        {eoi.eoi_documents.map((eoi_document) => (
                            <div key={eoi_document.id} className="mb-3">
                                <h5 className="font-semibold">{eoi_document.document.title} {eoi_document.required ? '*' : ''}</h5>
                            </div>
                        ))}
                        {eoi.files.length > 0 &&
                            <>
                                <h3 className="text-xl font-semibold mb-1 mt-6 pt-3 border-t border-dotted border-gray-400">For Additional Details</h3>
                                <ul className="mb-3 ps-3">
                                    {eoi?.files?.map((file, index) => (
                                        <li className="font-semibold underline text-blue-600 mb-1" key={index}>
                                            <a href={`/storage/${file.file_path}`} target="_blank">
                                                {file.file_name}
                                            </a>
                                        </li>
                                    ))}
                                </ul>
                            </>
                        }
                        {auth.vendor && eoi.status === 'published' ?
                            <div className="text-end">
                                <Link href={`/vendor/eoi/apply/${eoi.id}`} className="rounded-md bg-gray-800 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-white transition duration-150 ease-in-out hover:bg-gray-700 focus:bg-gray-700 focus:outline-none active:bg-gray-900">
                                    Apply
                                </Link>
                            </div>
                            :
                            eoi.status !== 'published' ?
                                <p className="text-center">
                                    No longer accepting applications.
                                </p>
                                :
                                <p className="text-center">
                                    Please <Link className="text-blue-600 underline" href="/login">login</Link> to apply
                                </p>
                        }
                    </div>
                </div>
            </Layout>
        </>
    )
}

export default ViewEoi