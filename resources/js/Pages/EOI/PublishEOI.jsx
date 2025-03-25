import InputError from "@/Components/Form/InputError";
import InputLabel from "@/Components/Form/InputLabel";
import PrimaryButton from "@/Components/Buttons/PrimaryButton";
import TextInput from "@/Components/Form/TextInput";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { useForm } from "@inertiajs/react";
import Breadcrumb from "@/Components/ui/Breadcrumb";
import { useState } from "react";
import { Button } from "@headlessui/react";
import Modal from "@/Components/ui/Modal";

const PublishEOI = ({ purchaseRequest, documents }) => {

    const { data, setData, post, processing, errors, reset } = useForm({
        purchase_request_id: purchaseRequest.id,
        title: '',
        description: '',
        eoi_number: '',
        published_date: '',
        deadline_date: '',
        documents: [],
        files1: []
    });
    console.log(data.files1)

    const handleFileChange = (e, index) => {
        const f = e.target.files[0];
        if (f) {
            setData("files1",
                data.files1.map((doc,i) =>
                     index === i ? { ...doc, file: f } : doc
                )
            );
        }
    };

    const handleFileNameChange = (e, index) => {
        const updatedFiles = [...data.files1];
        updatedFiles[index].name = e.target.value;
        setData('files1', updatedFiles);
    }

    const addFileField = () => {
        setData('files1', [...data.files1, { name: '', file: null }]);
    };

    const removeFileField = (index) => {
        const updatedFiles = data.files1.filter((_, i) => i !== index);
        setData('files1', updatedFiles);
    };

    const breadCrumbItems = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'EOIs', href: '/eois' },
        { title: 'Publish EOI' }
    ];

    const submit = (e) => {
        e.preventDefault();
        // console.log(data)
        post('/eois');
    };


    const handleCheckboxChange = (e, document) => {
        const { checked } = e.target
        if (checked) {
            setData('documents', [...data.documents, { ...document, compulsory: false }])
        }
        else {
            setData('documents', data.documents.filter((d) => d.id != document.id));
        }
    };

    const handleCompulsoryChange = (document) => {
        if (data.documents.some(d => d.id == document.id)) {
            setData('documents', data.documents.map(d =>
                d.id === document.id ? { ...d, compulsory: !d.compulsory } : d
            ));
        }
    };

    const [modalOpen, setModalOpen] = useState(false);

    return (
        <AuthenticatedLayout>
            <Modal show={modalOpen} onClose={() => setModalOpen(false)} maxWidth="w-full" className="rounded-none h-lvh overflow-y-auto mb-0">
                <div className="text-end me-4 mt-3 cursor-pointer" onClick={() => setModalOpen(false)}>X</div>
                <div className="w-2/3 mx-auto border border-gray-200 m-2 p-6">
                    <h2 className="text-2xl text-center font-semibold mb-4">{data.title}</h2>
                    <p className="text-gray-700 mb-2"><strong>EOI Number:</strong> {data.eoi_number}</p>
                    <p className="text-gray-700 mb-2"><strong>Published on:</strong> {data.published_date}</p>
                    <p className="text-gray-700 mb-2"><strong>Deadline:</strong> {data.deadline_date}</p>
                    <h3 className="text-xl font-semibold mb-1">Details</h3>
                    <p className="text-gray-700 ps-2">{data.description}</p>
                    <h3 className="text-xl font-semibold mb-1 mt-6 pt-3 border-t border-dotted border-gray-400">Required Items</h3>
                    <table className="requisition-form w-full mx-auto mt-6 table border-collapse overflow-x-auto">
                        <thead>
                            <tr className="text-white bg-[#00AB66]">
                                <th className="p-2 border">Product</th>
                                <th className="p-2 border">Quantity</th>
                                <th className="p-2 border">Price</th>
                                <th className="p-2 border">Speification</th>
                            </tr>
                        </thead>
                        <tbody>
                            {purchaseRequest.purchase_request_items.map((pro, index) => (
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
                    <h3 className="text-xl font-semibold mb-1 mt-6 pt-3 border-t border-dotted border-gray-400">Required Documents</h3>
                    {data.documents.map((document) => (
                        <div key={document.id} className="mb-3">
                            <h5 className="font-semibold">{document.title} {document.compulsory ? '*' : ''}</h5>
                            <div className="border border-dashed border-gray-500 rounded-md p-4 cursor-pointer">
                                <input type="file" hidden />
                                <p className="text-gray-500">Choose file from your device</p>
                            </div>
                        </div>
                    ))}
                    <h3 className="text-xl font-semibold mb-1 mt-6 pt-3 border-t border-dotted border-gray-400">For Additional Details</h3>
                    <ul className="mb-3 ps-3">
                        {data.files1.map((file, index) => (
                            file.file && file.name ?
                                <li className="font-semibold underline text-blue-600 mb-1" key={index}>{file.name}</li>
                                : null
                        ))}
                    </ul>
                </div>
            </Modal>
            <Breadcrumb items={breadCrumbItems} />
            <div className="bg-white p-4 shadow sm:rounded-lg sm:p-8">
                <h2 className="text-center text-2xl font-bold">Publish EOI</h2>
                <form onSubmit={submit} className="mx-auto">
                    <div className="mx-auto w-2/3">
                        <div className="border border-gray-400 grid grid-cols-2 gap-x-4 p-4 rounded-md mt-6 mb-10 shadow-md">
                            <div className="mt-4">
                                <InputLabel htmlFor="title" value="Title *" />
                                <TextInput
                                    id="title"
                                    name="title"
                                    value={data.title}
                                    className="mt-1 w-full"
                                    onChange={(e) => setData('title', e.target.value)}
                                />
                                <InputError message={errors.title} className="mt-2" />
                            </div>
                            <div className="mt-4">
                                <InputLabel htmlFor="eoi_number" value="Eoi number *" />
                                <TextInput
                                    id="eoi_number"
                                    name="eoi_number"
                                    value={data.eoi_number}
                                    className="mt-1 w-full"
                                    onChange={(e) => setData('eoi_number', e.target.value)}
                                />

                                <InputError message={errors.eoi_number} className="mt-2" />
                            </div>

                            <div className="mt-4 col-span-2">
                                <InputLabel htmlFor="description" value="Description *" />
                                <textarea
                                    id="description"
                                    name="description"
                                    rows={4}
                                    value={data.description}
                                    className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                    onChange={(e) => setData('description', e.target.value)}
                                >
                                </textarea>
                                <InputError message={errors.description} className="mt-2" />
                            </div>

                            <div className="mt-4">
                                <InputLabel htmlFor="published_date" value="Published Date *" />
                                <TextInput
                                    id="published_date"
                                    name="published_date"
                                    value={data.published_date}
                                    className="mt-1 w-full"
                                    type='date'
                                    onChange={(e) => setData('published_date', e.target.value)}
                                />
                                <InputError message={errors.published_date} className="mt-2" />
                            </div>
                            <div className="mt-4">
                                <InputLabel htmlFor="deadline" value="Deadline *" />
                                <TextInput
                                    id="deadline"
                                    name="deadline"
                                    value={data.deadline_date}
                                    className="mt-1 w-full"
                                    type='date'
                                    onChange={(e) => setData('deadline_date', e.target.value)}
                                />
                                <InputError message={errors.deadline_date} className="mt-2" />
                            </div>
                        </div>
                        <div className="border border-gray-400 rounded-md p-4 mb-10 shadow-md">
                            <div className="mt-4">
                                <InputLabel htmlFor="documents" value="Required Documents *" />
                                <table className="w-full border-collapse text-center mt-1">
                                    <thead>
                                        <tr>
                                            <th className="p-2 py-1 border">Select</th>
                                            <th className="p-2 py-1 border">Title</th>
                                            <th className="p-2 py-1 border">Compulsory</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {documents.map((document) => (
                                            <tr key={document.id}>
                                                <td className="p-2 border">
                                                    <input
                                                        type="checkbox"
                                                        checked={data.documents.some(d => d.id == document.id)}
                                                        onChange={(e) => handleCheckboxChange(e, document)}
                                                    />
                                                </td>
                                                <td className="p-2 border">{document.title}</td>
                                                <td className="p-2 border">
                                                    <label className="relative inline-flex cursor-pointer items-center">
                                                        <input
                                                            type="checkbox"
                                                            className="sr-only"
                                                            disabled={!data.documents.some(d => d.id == document.id)}
                                                            checked={data.documents.some(d => d.id == document.id && d.compulsory == true) || false}
                                                            onChange={() => handleCompulsoryChange(document)}
                                                        />
                                                        <span className={`slider flex h-[26px] w-[50px] items-center rounded-full p-1 transition-all ${data.documents.some(d => d.id == document.id && d.compulsory == true) ? 'bg-[#3758F9]' : 'bg-[#CCCCCE]'}`}>
                                                            <span className={`dot h-[18px] w-[18px] rounded-full bg-white transition-all transform ${data.documents.some(d => d.id == document.id && d.compulsory == true) ? 'translate-x-6' : ''}`}></span>
                                                        </span>
                                                    </label>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                <InputError message={errors.documents} className="mt-2" />
                            </div>
                            <div className="mt-4">
                                <InputLabel htmlFor="eoi_files" value="Upload Files *" />
                                <table className="w-full border-collapse mb-3 mt-1">
                                    <thead>
                                        <tr>
                                            <th className="border p-2">Upload File</th>
                                            <th className="border p-2">File Name</th>
                                            <th className="border p-2">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {data.files1.map((item, index) => (
                                            <tr key={index}>
                                                <td className="p-2 border">
                                                    <TextInput
                                                        type="text"
                                                        placeholder="Enter file name"
                                                        value={item.name}
                                                        onChange={(e) => handleFileNameChange(e, index)}
                                                        className="border p-2 rounded w-full"
                                                    />
                                                </td>
                                                <td className="p-2 border">
                                                    <input
                                                        type="file"
                                                        onChange={(e) => handleFileChange(e,index)}
                                                        className="border p-2 rounded w-full"
                                                    />
                                                </td>
                                                <td className="p-2 border">
                                                    <Button type="button" className='rounded-md bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-700 uppercase' onClick={() => removeFileField(index)}>
                                                        Remove
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                <div className="text-end">
                                    <Button type="button" className='rounded-md bg-green-600 px-4 py-2 text-xs font-semibold text-white hover:bg-green-700 uppercase' onClick={addFileField}>
                                        + Add {data.files1.length > 0 ? 'Another' : ''} File
                                    </Button>
                                </div>
                            </div>
                        </div>

                        <table className="requisition-form w-full mt-8 mb-4 table border-collapse overflow-x-auto">
                            <thead>
                                <tr>
                                    <th className="p-2 border">Product</th>
                                    <th className="p-2 border">Quantity</th>
                                    <th className="p-2 border">Price</th>
                                    <th className="p-2 border">Speification</th>
                                </tr>
                            </thead>
                            <tbody>
                                {purchaseRequest.purchase_request_items.map((pro, index) => (
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
                        <div className="mt-4 flex items-center justify-end gap-3">
                            <Button type="button" className='rounded-md bg-green-600 px-4 py-2 text-xs font-semibold text-white hover:bg-green-700 uppercase' onClick={() => setModalOpen(true)}>
                                View EOI
                            </Button>
                            <PrimaryButton disabled={processing}>
                                Publish EOI
                            </PrimaryButton>
                        </div>
                    </div>
                </form>
            </div>
        </AuthenticatedLayout >
    );
}

export default PublishEOI;