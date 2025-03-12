import InputError from '@/Components/Form/InputError';
import InputLabel from '@/Components/Form/InputLabel';
import PrimaryButton from '@/Components/Buttons/PrimaryButton';
import TextInput from '@/Components/Form/TextInput';
import Layout from '@/Layouts/Layout';
import { Head, Link, useForm } from '@inertiajs/react';

export default function VendorRegister() {
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        email: '',
        contact: '',
        address: '',
        password: '',
        password_confirmation: '',
        registration_number: '',
        pan_number: '',
        registration_date: '',
    });
    const submit = (e) => {
        e.preventDefault();

        post(route('vendor.store'), {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };
    return (
        <Layout>
            <Head title="Register" />
            <div className="flex min-h-screen flex-col items-center bg-gray-100 pt-6 sm:justify-center sm:pt-0">
                <div className="mt-6 w-full overflow-hidden bg-white px-6 py-4 shadow-md sm:max-w-md sm:rounded-lg">
                    <h2 className="text-center text-2xl font-bold">Register</h2>
                    <form onSubmit={submit}>
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <InputLabel htmlFor="name" value="Name" />

                                <TextInput
                                    id="name"
                                    name="name"
                                    value={data.name}
                                    className="mt-1 block w-full"
                                    autoComplete="name"
                                    onChange={(e) => setData('name', e.target.value)}
                                    required
                                />

                                <InputError message={errors.name} className="mt-2" />
                            </div>

                            <div>
                                <InputLabel htmlFor="email" value="Email" />

                                <TextInput
                                    id="email"
                                    type="email"
                                    name="email"
                                    value={data.email}
                                    className="mt-1 block w-full"
                                    autoComplete="username"
                                    onChange={(e) => setData('email', e.target.value)}
                                    required
                                />

                                <InputError message={errors.email} className="mt-2" />
                            </div>

                            <div>
                                <InputLabel htmlFor="password" value="Password" />

                                <TextInput
                                    id="password"
                                    type="password"
                                    name="password"
                                    value={data.password}
                                    className="mt-1 block w-full"
                                    autoComplete="new-password"
                                    onChange={(e) => setData('password', e.target.value)}
                                    required
                                />

                                <InputError message={errors.password} className="mt-2" />
                            </div>

                            <div>
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
                                    required
                                />

                                <InputError
                                    message={errors.password_confirmation}
                                    className="mt-2"
                                />
                            </div>
                            <div>
                                <InputLabel
                                    htmlFor="contact"
                                    value="Contact"
                                />

                                <TextInput
                                    id="contact"
                                    type="number"
                                    name="contact"
                                    value={data.contact}
                                    className="mt-1 block w-full"
                                    onChange={(e) =>
                                        setData('contact', e.target.value)
                                    }
                                    required
                                />

                                <InputError
                                    message={errors.registration_number}
                                    className="mt-2"
                                />
                            </div>
                            <div>
                                <InputLabel
                                    htmlFor="address"
                                    value="Address"
                                />

                                <TextInput
                                    id="address"
                                    type="text"
                                    name="address"
                                    value={data.address}
                                    className="mt-1 block w-full"
                                    onChange={(e) =>
                                        setData('address', e.target.value)
                                    }
                                    required
                                />

                                <InputError
                                    message={errors.registration_number}
                                    className="mt-2"
                                />
                            </div>
                            <div>
                                <InputLabel
                                    htmlFor="registration_number"
                                    value="Registration Number"
                                />

                                <TextInput
                                    id="registration_number"
                                    type="number"
                                    name="registration_number"
                                    value={data.registration_number}
                                    className="mt-1 block w-full"
                                    onChange={(e) =>
                                        setData('registration_number', e.target.value)
                                    }
                                    required
                                />

                                <InputError
                                    message={errors.registration_number}
                                    className="mt-2"
                                />
                            </div>
                            <div>
                                <InputLabel
                                    htmlFor="pan_number"
                                    value="Pan number"
                                />

                                <TextInput
                                    id="pan_number"
                                    type="number"
                                    name="pan_number"
                                    value={data.pan_number}
                                    className="mt-1 block w-full"
                                    onChange={(e) =>
                                        setData('pan_number', e.target.value)
                                    }
                                    required
                                />

                                <InputError
                                    message={errors.pan_number}
                                    className="mt-2"
                                />
                            </div>
                            <div>
                                <InputLabel
                                    htmlFor="registration_date"
                                    value="Registration Date"
                                />

                                <TextInput
                                    id="registration_date"
                                    type="date"
                                    name="registration_date"
                                    value={data.registration_date}
                                    className="mt-1 block w-full"
                                    onChange={(e) =>
                                        setData('registration_date', e.target.value)
                                    }
                                    required
                                />

                                <InputError
                                    message={errors.registration_date}
                                    className="mt-2"
                                />
                            </div>
                        </div>

                        <div className="mt-4 flex items-center justify-end">
                            <Link
                                href={route('login')}
                                className="rounded-md text-sm text-gray-600 underline hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                            >
                                Already registered? Login Here
                            </Link>

                        </div>
                        <div className="text-center">
                            <PrimaryButton className="ms-4" disabled={processing}>

                                Register
                            </PrimaryButton>
                        </div>
                    </form>
                </div>
            </div>
        </Layout>
    )
}