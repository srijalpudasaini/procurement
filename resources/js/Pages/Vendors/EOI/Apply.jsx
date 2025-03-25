import PrimaryButton from "@/Components/Buttons/PrimaryButton"
import InputError from "@/Components/Form/InputError"
import TextInput from "@/Components/Form/TextInput"
import Breadcrumb from "@/Components/ui/Breadcrumb"
import VendorLayout from "@/Layouts/VendorLayout"
import { useForm } from "@inertiajs/react"

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
    const openInput = (target) => {
        document.getElementById(target).click()
    }
    const { data, setData, post, processing, errors, reset } = useForm({
        eoi_id: eoi.id,
        products: eoi.purchase_request.purchase_request_items.map((p) => ({ id: p.id, price: 0 })),
        documents: eoi.eoi_documents.map(doc => ({ id: doc.document.id, file: null, required: doc.required }))
    });

    const handleChange = (e, id) => {
        const checked = e.target.checked
        if (!checked) {
            setData('products', data.products.filter((p) => p.id != id))
        }
        else {
            if (!data.products.some(p => p.id == id)) {
                setData('products',
                    [...data.products, eoi.purchase_request.purchase_request_items.find((p) => p.product.id == id)?.product]
                )
            }
        }
    }

    const handlePriceChange = (e, id) => {
        const { value } = e.target
        setData('products', data.products.map(product =>
            product.id === id ? { ...product, price: value } : product
        ));
    }
    const handleFileChange = (e, id) => {
        const f = e.target.files[0];
        if (f) {
            setData("documents",
                data.documents.map(doc =>
                    doc.id === id ? { ...doc, file: f } : doc
                )
            );
        }
    };

    const handleFileRemove = (e, id) => {
        e.stopPropagation()
        setData("documents",
            data.documents.map(doc =>
                doc.id === id ? { ...doc, file: null } : doc
            )
        );
    }

    const handleSubmit = (e) => {
        e.preventDefault();

        post('/vendor/eoi/submit');
        // console.log(data)
    }

    // console.log(errors)

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
                <form onSubmit={handleSubmit}>
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
                                        <input type="checkbox" defaultChecked onChange={(e) => handleChange(e, pro.id)} />
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
                                        <TextInput
                                            type="number"
                                            className="py-1"
                                            onChange={(e) => handlePriceChange(e, pro.id)}
                                            value={data.products.find((q) => q.id == pro.id)?.price || ''}
                                            disabled={!data.products.some(p => p.id == pro.id)}
                                        />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <InputError message={errors.generalProducts} />
                    <h3 className="text-xl font-semibold mb-1 mt-6 pt-3 border-t border-dotted border-gray-400">Required Documents</h3>
                    {eoi.eoi_documents.map((eoi_document) => (
                        <div key={eoi_document.id} className="mb-3">
                            <h5 className="font-semibold">{eoi_document.document.title} {eoi_document.required ? '*' : ''}</h5>
                            <div className="border border-dashed border-gray-500 rounded-md p-4 cursor-pointer"
                                onClick={() => openInput(`${eoi_document.document.name}_${eoi_document.document.id}`)}>
                                <input type="file" hidden={true} id={`${eoi_document.document.name}_${eoi_document.document.id}`} onChange={(e) => handleFileChange(e, eoi_document.document.id)} />
                                {data.documents.find(d => d.id === eoi_document.document.id).file ?
                                    <div className="flex gap-4 items-center">
                                        <span>
                                            {data.documents.find(d => d.id === eoi_document.document.id).file.name}
                                        </span>
                                        <i className="fa fa-times" onClick={(e) => handleFileRemove(e, eoi_document.document.id)}></i>
                                    </div>
                                    :
                                    <p className="text-gray-500">Choose file from your device</p>
                                }
                            </div>
                        </div>
                    ))}
                    <InputError message={errors.generalDocuments} />
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
                    <div className="text-end">
                        <PrimaryButton className="rounded-md bg-gray-800 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-white transition duration-150 ease-in-out hover:bg-gray-700 focus:bg-gray-700 focus:outline-none active:bg-gray-900">
                            Apply
                        </PrimaryButton>
                    </div>
                </form>

            </div>
        </VendorLayout>
    )
}

export default Apply