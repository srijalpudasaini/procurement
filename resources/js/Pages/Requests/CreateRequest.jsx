import InputError from "@/Components/Form/InputError";
import InputLabel from "@/Components/Form/InputLabel";
import PrimaryButton from "@/Components/Buttons/PrimaryButton";
import TextInput from "@/Components/Form/TextInput";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout"
import { useForm } from "@inertiajs/react";
import Breadcrumb from "@/Components/ui/Breadcrumb";
import { Button } from "@headlessui/react";
import { useState } from "react";

const CreateRequest = ({ products }) => {
    const { data, setData, post, processing, errors, reset } = useForm({
        request_products: [],
        description: '',
    });

    const breadCrumbItems = [
        {
            title: 'Dashboard',
            href: '/dashboard'
        },
        {
            title: 'Requests',
            href: '/requests'
        },
        {
            title: 'Create Request',
        },
    ]

    const submit = (e) => {
        e.preventDefault();
        // post(route('requests.store'));
        console.log(productList)
    };

    const [productList, setProductList] = useState([{ product_id: "", quantity: "", specifications: "" }]);

    const handleProductAdd = () => {
        setProductList([...productList, { product_id: "", quantity: "", specifications: "" }])
    }

    const handleProductRemove = (index) => {
        const list = [...productList]
        list.splice(index, 1)
        setProductList(list);
    }

    const handleChange = (e, i) => {
        let newValues = [...productList];
        newValues[i][e.target.name] = e.target.value
        setProductList(newValues)
    }
    return (
        <AuthenticatedLayout>
            <Breadcrumb items={breadCrumbItems} />
            <div className="bg-white p-4 shadow sm:rounded-lg sm:p-8">
                <h2 className="text-center text-2xl font-bold">Create Request</h2>
                <form onSubmit={submit} className="mx-auto w-11/12">
                    <div className="requisition-form">
                        {productList.map((pro, index) => (
                            <div className="flex gap-3" key={index}>
                                <div className="flex-grow">
                                    <InputLabel htmlFor="product_id" value="Product *"/>
                                    <select
                                        name="product_id"
                                        className="py-1 w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                        value={pro.id}
                                        onChange={(e) => handleChange(e, index)}
                                    >
                                        <option value="">Select a product</option>
                                        {products.map((product, index) => (
                                            <option value={product.id} key={index}>{product.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="">
                                    <InputLabel htmlFor="quantity" value="Quantity *"/>
                                    <TextInput
                                        type="number"
                                        name="quantity"
                                        className='py-1 w-full'
                                        value={pro.quantity || ""}
                                        onChange={(e) => handleChange(e, index)}
                                    />
                                </div>
                                <div className="flex-grow">
                                    <InputLabel htmlFor="specifications" value="Specifications *"/>
                                    <textarea
                                        name="specifications"
                                        id=""
                                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 resize-none"
                                        value={pro.specifications || ""}
                                        onChange={(e) => handleChange(e, index)}></textarea>
                                </div>
                                {index ?
                                    <div className="self-center">
                                        <Button type="button" className='rounded-md border border-transparent bg-red-600 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-white transition duration-150 ease-in-out hover:bg-red-700' onClick={() => handleProductRemove(index)}>
                                            Remove
                                        </Button>
                                    </div>
                                    : ''
                                }
                            </div>
                        ))}
                        <div className="text-center mt-4">
                            {productList.length >= 1 &&
                                <Button type="button" className='rounded-md border border-transparent bg-green-600 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-white transition duration-150 ease-in-out hover:bg-green-700' onClick={handleProductAdd}>
                                    + Add Other Products
                                </Button>
                            }
                        </div>
                    </div>
                    <div className="mt-4 text-center">
                        <PrimaryButton className="ms-4" disabled={processing}>
                            Create Request
                        </PrimaryButton>
                    </div>
                </form>
            </div>
        </AuthenticatedLayout>
    )
}

export default CreateRequest