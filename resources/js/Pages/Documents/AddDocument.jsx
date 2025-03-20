import InputError from "@/Components/Form/InputError";
import InputLabel from "@/Components/Form/InputLabel";
import PrimaryButton from "@/Components/Buttons/PrimaryButton";
import TextInput from "@/Components/Form/TextInput";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout"
import { useForm } from "@inertiajs/react";
import Breadcrumb from "@/Components/ui/Breadcrumb";

const AddDocument = ({ documents }) => {
    const { data, setData, post, processing, errors, reset } = useForm({
        title: '',
        description: ''
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('documents.store'));
    };

    const breadCrumbItems = [
        {
            title: 'Dashboard',
            href: '/dashboard'
        },
        {
            title: 'Documents',
            href: '/documents'
        },
        {
            title: 'Add Document',
        },
    ]
    return (
        <AuthenticatedLayout>
            <Breadcrumb items={breadCrumbItems} />
            <div className="bg-white p-4 shadow sm:rounded-lg sm:p-8">
                <h2 className="text-center text-2xl font-bold">Add Document</h2>
                <form onSubmit={submit} className="mx-auto w-1/3">
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
                    <div className="text-center mt-4">
                        <PrimaryButton disabled={processing}>
                            Add Document
                        </PrimaryButton>
                    </div>
                </form>
            </div>
        </AuthenticatedLayout>
    )
}

export default AddDocument