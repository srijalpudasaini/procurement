import InputError from "@/Components/Form/InputError";
import InputLabel from "@/Components/Form/InputLabel";
import PrimaryButton from "@/Components/Buttons/PrimaryButton";
import TextInput from "@/Components/Form/TextInput";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { useForm } from "@inertiajs/react";
import Breadcrumb from "@/Components/ui/Breadcrumb";
import { Button } from "@headlessui/react";
import { useEffect, useState } from "react";

const AddRequest = ({ products }) => {
    const [productList, setProductList] = useState([{ product_id: "", quantity: "", price: "", priority: "", specifications: "", }]);
    const { data, setData, post, processing, errors, reset } = useForm({ products: [] });

    const breadCrumbItems = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Requests', href: '/requests' },
        { title: 'Create Request' }
    ];

    useEffect(() => {
        setData('products', productList);
    }, [productList]);

    const submit = (e) => {
        e.preventDefault();
        post(route('requests.store'));
    };

    const handleProductAdd = () => {
        setProductList([...productList, { product_id: "", quantity: "", price: "", priority: "", specifications: "" }]);
    };

    const handleProductRemove = (index) => {
        const list = [...productList];
        list.splice(index, 1);
        setProductList(list);
    };

    const handleChange = (e, i) => {
        let newValues = [...productList];
        newValues[i][e.target.name] = e.target.value;
        setProductList(newValues);
    };

    return (
        <AuthenticatedLayout>
            <Breadcrumb items={breadCrumbItems} />
            <div className="bg-white p-4 shadow sm:rounded-lg sm:p-8">
                <h2 className="text-center text-2xl font-bold">Create Request</h2>
                <form onSubmit={submit} className="mx-auto">
                    <table className="requisition-form w-full my-4 table border-collapse overflow-x-auto">
                        <thead>
                            <tr>
                                <th className="p-2 border">Product</th>
                                <th className="p-2 border">Quantity</th>
                                <th className="p-2 border">Price</th>
                                <th className="p-2 border">Priority</th>
                                <th className="p-2 border">Specification</th>
                                <th className="p-2 border">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {productList.map((pro, index) => (
                                <tr key={index} className="border">
                                    <td className="p-2 border">
                                        <select
                                            name="product_id"
                                            className="py-1 w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                            value={pro.product_id}
                                            onChange={(e) => handleChange(e, index)}
                                        >
                                            <option value="">Select a product</option>
                                            {products
                                                .filter(product => {
                                                    const isSelected = productList.some(item => item.product_id == product.id);
                                                    return !isSelected || pro.product_id == product.id;
                                                }).map(product => (
                                                    <option key={product.id} value={product.id}>
                                                        {product.name}
                                                    </option>
                                                ))}
                                        </select>
                                        <InputError message={errors[`products.${index}.product_id`]} />
                                    </td>
                                    <td className="p-2 border">
                                        <TextInput
                                            type="number"
                                            name="quantity"
                                            className="py-1 w-full"
                                            value={pro.quantity || ""}
                                            onChange={(e) => handleChange(e, index)}
                                        />
                                        <InputError message={errors[`products.${index}.quantity`]} />
                                    </td>
                                    <td className="p-2 border">
                                        <TextInput
                                            type="number"
                                            name="price"
                                            className="py-1 w-full"
                                            value={pro.price || ""}
                                            onChange={(e) => handleChange(e, index)}
                                        />
                                        <InputError message={errors[`products.${index}.price`]} />
                                    </td>
                                    <td className="p-2 border">
                                        <select name="priority" id=""
                                            value={pro.priority}
                                            onChange={(e) => handleChange(e, index)}
                                            className="py-1 w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                        >
                                            <option value="">Select priority</option>
                                            <option value="high">High</option>
                                            <option value="medium">Medium</option>
                                            <option value="low">Low</option>
                                        </select>
                                        <InputError message={errors[`products.${index}.priority`]} />
                                    </td>
                                    <td className="p-2 border">
                                        <textarea
                                            name="specifications"
                                            className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 resize-none"
                                            value={pro.specifications || ""}
                                            onChange={(e) => handleChange(e, index)}
                                        ></textarea>
                                        <InputError message={errors[`products.${index}.specifications`]} />
                                    </td>
                                    {index > 0 && (
                                        <td className="p-2 border">
                                            <Button type="button" className='rounded-md bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-700' onClick={() => handleProductRemove(index)}>
                                                Remove
                                            </Button>
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>

                    </table>
                    <div className="text-end mt-4">
                        <Button type="button" className='rounded-md bg-green-600 px-4 py-2 text-xs font-semibold text-white hover:bg-green-700' onClick={handleProductAdd}>
                            + Add Another Product
                        </Button>
                    </div>

                    <div className="mt-4 text-center">
                        <PrimaryButton disabled={processing}>
                            Create Request
                        </PrimaryButton>
                    </div>
                </form>
            </div>
        </AuthenticatedLayout>
    );
}

export default AddRequest;