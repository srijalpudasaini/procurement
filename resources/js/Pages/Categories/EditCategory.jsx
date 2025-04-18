import InputError from "@/Components/Form/InputError";
import InputLabel from "@/Components/Form/InputLabel";
import PrimaryButton from "@/Components/Buttons/PrimaryButton";
import TextInput from "@/Components/Form/TextInput";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout"
import { useForm } from "@inertiajs/react";
import Breadcrumb from "@/Components/ui/Breadcrumb";

const EditCategory = ({ category, categories }) => {
    const { data, setData, put, processing, errors, reset } = useForm({
        name: category.name || '',
        description: category.description || '',
        category_id: category.category_id || '',
        id: category.id
    });

    const submit = (e) => {
        e.preventDefault();

        put(route('categories.update', category.id));
    };

    const breadCrumbItems = [
        {
            title: 'Dashboard',
            href: '/dashboard'
        },
        {
            title: 'Categories',
            href: '/categories'
        },
        {
            title: 'Edit Category',
        },
    ]
    return (
        <AuthenticatedLayout>
            <Breadcrumb items={breadCrumbItems} />
            <div className="bg-white p-4 shadow sm:rounded-lg sm:p-8">
                <h2 className="text-center text-2xl font-bold">Edit Category</h2>
                <form onSubmit={submit} className="mx-auto w-1/3">
                    <div className="mt-4">
                        <InputLabel htmlFor="name" value="Name *" />
                        <TextInput
                            id="name"
                            name="name"
                            value={data.name}
                            className="mt-1 w-full"
                            autoComplete="name"
                            onChange={(e) => setData('name', e.target.value)}
                        />

                        <InputError message={errors.name} className="mt-2" />
                    </div>
                    <div className="mt-4">
                        <InputLabel htmlFor="description" value="Description" />
                        <textarea
                            id="description"
                            name="description"
                            value={data.description}
                            className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                            onChange={(e) => setData('description', e.target.value)}
                        >
                        </textarea>

                        <InputError message={errors.description} className="mt-2" />
                    </div>
                    <div className="mt-4">
                        <InputLabel htmlFor="category_id" value="Category" />
                        <select
                            id="category_id"
                            name="category_id"
                            value={data.category_id}
                            className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                            onChange={(e) => setData('category_id', e.target.value)}
                        >
                            <option value="">Select a category</option>
                            {categories.map((category, index) => (
                                <option value={category.id} key={index}>{category.name}</option>
                            ))}

                        </select>
                        <InputError message={errors.category_id} className="mt-2" />
                    </div>
                    <div className="text-center mt-4">
                        <PrimaryButton disabled={processing}>
                            Update Category
                        </PrimaryButton>
                    </div>
                </form>
            </div>
        </AuthenticatedLayout>
    )
}

export default EditCategory