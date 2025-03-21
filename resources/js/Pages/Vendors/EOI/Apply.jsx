import PrimaryButton from "@/Components/Buttons/PrimaryButton"
import TextInput from "@/Components/Form/TextInput"
import Breadcrumb from "@/Components/ui/Breadcrumb"
import VendorLayout from "@/Layouts/VendorLayout"

const Apply = ({ eoi }) => {
    const breadCrumbItems = [
        {
            title: 'Dashboard',
            href: '/vendor/dashboard'
        },
        {
            title: 'Apply EOI',
        }
    ]
    return (
        <VendorLayout>
            <Breadcrumb items={breadCrumbItems} />
            <div className="bg-white p-4 shadow sm:rounded-lg sm:p-8">
                <h2 className="text-2xl text-center font-semibold mb-4">{eoi.title}</h2>
                <p className="text-gray-700 mb-2"><strong>EOI Number:</strong> {eoi.eoi_number}</p>
                <p className="text-gray-700 mb-2"><strong>Published on:</strong> {eoi.published_date}</p>
                <p className="text-gray-700 mb-2"><strong>Deadline:</strong> {eoi.deadline_date}</p>
                <h3 className="text-xl font-semibold mb-1">Details</h3>
                <p className="text-gray-700 ps-2">{eoi.description}</p>
                <h3 className="text-xl font-semibold mb-1 mt-6 pt-3 border-t border-dotted border-gray-400">Required Items</h3>
                <p className="my-3 text-gray-500">Tick the items you can provide</p>
                <table className="requisition-form w-full mx-auto text-center table border-collapse overflow-x-auto">
                    <thead>
                        <tr className="text-white bg-[#00AB66]">
                            <th></th>
                            <th className="p-2 border">Item</th>
                            <th className="p-2 border">Unit</th>
                            <th className="p-2 border">Required Quantity</th>
                            <th className="p-2 border">Required  Specification</th>
                            <th>Price Offered</th>
                        </tr>
                    </thead>
                    <tbody>
                        {eoi.purchase_request.purchase_request_items.map((pro, index) => (
                            <tr key={index} className="border">
                                <td className="p-2 border">
                                    <input type="checkbox" defaultChecked/>
                                </td>
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
                                <td className="p-2 border">
                                    <TextInput type="number" className="py-1"/>
                                </td>
                            </tr>
                        ))}
                    </tbody>

                </table>
                <h3 className="text-xl font-semibold mb-1 mt-6 pt-3 border-t border-dotted border-gray-400">Required Documents</h3>
                {eoi.eoi_documents.map((eoi_document) => (
                    <div key={eoi_document.id} className="mb-3">
                        <h5 className="font-semibold">{eoi_document.document.title} {eoi_document.required ? '*' : ''}</h5>
                        <div className="border border-dashed border-gray-500 rounded-md p-4 cursor-pointer">
                            <input type="file" hidden />
                            <p className="text-gray-500">Choose file from your device</p>
                        </div>
                    </div>
                ))}
                {eoi.files.length > 0 &&
                    <>
                        <h3 className="text-xl font-semibold mb-1 mt-6 pt-3 border-t border-dotted border-gray-400">For Additional Details</h3>
                        <ul className="mb-3 ps-3">
                            {eoi?.files?.map((file, index) => (
                                file.file && file.name ?
                                    <li className="font-semibold underline text-blue-600 mb-1" key={index}>{file.name}</li>
                                    : null
                            ))}
                        </ul>
                    </>
                }
                <div className="text-end">
                    <PrimaryButton className="rounded-md bg-gray-800 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-white transition duration-150 ease-in-out hover:bg-gray-700 focus:bg-gray-700 focus:outline-none active:bg-gray-900">
                        Apply
                    </PrimaryButton>
                </div>

            </div>
        </VendorLayout>
    )
}

export default Apply