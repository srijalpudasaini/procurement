import InputError from '@/Components/Form/InputError';
import InputLabel from '@/Components/Form/InputLabel';
import PrimaryButton from '@/Components/Buttons/PrimaryButton';
import TextInput from '@/Components/Form/TextInput';
import Layout from '@/Layouts/Layout';
import { Head, useForm } from '@inertiajs/react';

export default function ConfirmPassword() {
    const { data, setData, post, processing, errors, reset } = useForm({
        password: '',
    });

    const submit = (e) => {
        e.preventDefault();

        post(route('password.confirm'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <Layout>
            <Head title="Confirm Password" />
            <div className="flex min-h-screen flex-col items-center bg-gray-100 pt-6 sm:justify-center sm:pt-0">
                <div className="mt-6 w-full overflow-hidden bg-white px-6 py-4 shadow-md sm:max-w-md sm:rounded-lg">

                    <div className="mb-4 text-sm text-gray-600">
                        This is a secure area of the application. Please confirm your
                        password before continuing.
                    </div>

                    <form onSubmit={submit}>
                        <div className="mt-4">
                            <InputLabel htmlFor="password" value="Password" />

                            <TextInput
                                id="password"
                                type="password"
                                name="password"
                                value={data.password}
                                className="mt-1 block w-full"
                                isFocused={true}
                                onChange={(e) => setData('password', e.target.value)}
                            />

                            <InputError message={errors.password} className="mt-2" />
                        </div>

                        <div className="mt-4 flex items-center justify-end">
                            <PrimaryButton className="ms-4" disabled={processing}>
                                Confirm
                            </PrimaryButton>
                        </div>
                    </form>
                </div>
            </div>
        </Layout>
    );
}
