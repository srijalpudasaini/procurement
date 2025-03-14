import InputError from "@/Components/Form/InputError";
import InputLabel from "@/Components/Form/InputLabel";
import PrimaryButton from "@/Components/Buttons/PrimaryButton";
import TextInput from "@/Components/Form/TextInput";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout"
import { useForm } from "@inertiajs/react";
import Breadcrumb from "@/Components/ui/Breadcrumb";

const EditUser = ({ user, roles, userRole }) => {
    const { data, setData, put, processing, errors, reset } = useForm({
        name: user.name,
        email: user.email,
        password: user.password,
        contact: user.contact,
        role: userRole,
        id: user.id
    });
    const submit = (e) => {
        e.preventDefault();
        put(route('users.update', user.id));
    };
    const breadCrumbItems = [
        {
            title: 'Dashboard',
            href: '/dashboard'
        },
        {
            title: 'Users',
            href: '/users'
        },
        {
            title: 'Edit User',
        },
    ]

    return (
        <AuthenticatedLayout>
            <Breadcrumb items={breadCrumbItems} />
            <div className="bg-white p-4 shadow sm:rounded-lg sm:p-8">
                <h2 className="text-center text-2xl font-bold">Edit User</h2>
                <form onSubmit={submit} className="mx-auto w-1/3">
                    <div>
                        <InputLabel htmlFor="name" value="Name" />

                        <TextInput
                            id="name"
                            name="name"
                            value={data.name}
                            className="mt-1 block w-full"
                            autoComplete="name"
                            onChange={(e) => setData('name', e.target.value)}

                        />

                        <InputError message={errors.name} className="mt-2" />
                    </div>

                    <div className="mt-4">
                        <InputLabel htmlFor="email" value="Email" />

                        <TextInput
                            id="email"
                            type="email"
                            name="email"
                            value={data.email}
                            className="mt-1 block w-full"
                            autoComplete="username"
                            onChange={(e) => setData('email', e.target.value)}

                        />

                        <InputError message={errors.email} className="mt-2" />
                    </div>
                    <div className="mt-4">
                        <InputLabel htmlFor="contact" value="Contact" />

                        <TextInput
                            id="contact"
                            type="number"
                            name="contact"
                            value={data.contact}
                            className="mt-1 block w-full"
                            onChange={(e) => setData('contact', e.target.value)}

                        />

                        <InputError message={errors.contact} className="mt-2" />
                    </div>

                    <div className="mt-4">
                        <InputLabel htmlFor="password" value="Password" />

                        <TextInput
                            id="password"
                            type="password"
                            name="password"
                            value={data.password}
                            className="mt-1 block w-full"
                            autoComplete="new-password"
                            onChange={(e) => setData('password', e.target.value)}

                        />

                        <InputError message={errors.password} className="mt-2" />
                    </div>

                    <div className="mt-4">
                        <InputLabel
                            htmlFor="password_confirmation"
                            value="Confirm Password"
                        />

                        <TextInput
                            id="password_confirmation"
                            type="password"
                            name="password_confirmation"
                            value={data.password_confirmation}
                            className="mt-1 block w-full"
                            autoComplete="new-password"
                            onChange={(e) =>
                                setData('password_confirmation', e.target.value)
                            }

                        />

                        <InputError
                            message={errors.password_confirmation}
                            className="mt-2"
                        />
                    </div>
                    <div className="mt-4">
                        <InputLabel
                            htmlFor="role"
                            value="Role"
                        />

                        <select
                            id="role"
                            name="role"
                            value={data.role}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                            onChange={(e) =>
                                setData('role', e.target.value)
                            }
                        >
                            <option value="">Select a role</option>
                            {roles.map((role,index) => (
                                <option value={role.name} key={index}>{role.name}</option>
                            ))}
                        </select>

                        <InputError
                            message={errors.role}
                            className="mt-2"
                        />
                    </div>

                    <div className="mt-4 text-center">
                        <PrimaryButton className="ms-4" disabled={processing}>
                            Update User
                        </PrimaryButton>
                    </div>
                </form>
            </div>
        </AuthenticatedLayout>
    )
}

export default EditUser