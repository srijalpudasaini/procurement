import InputError from "@/Components/Form/InputError";
import InputLabel from "@/Components/Form/InputLabel";
import PrimaryButton from "@/Components/Buttons/PrimaryButton";
import TextInput from "@/Components/Form/TextInput";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout"
import { useForm } from "@inertiajs/react";
import Breadcrumb from "@/Components/ui/Breadcrumb";
import { Button } from "@headlessui/react";

const AddApprovalWorkflow = ({ roles }) => {
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        min_amount: '',
        max_amount: '',
        steps: [{ step: 1, role_id: null }]
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('approval_workflows.store'));
    };

    const breadCrumbItems = [
        {
            title: 'Dashboard',
            href: '/dashboard'
        },
        {
            title: 'Approval Workflows',
            href: '/approval_workflows'
        },
        {
            title: 'Add Workflow',
        },
    ]

    const handleStepAdd = () => {
        setData('steps',
            [...data.steps,
            { step: data.steps.length + 1, role_id: null }
            ]
        )
    }

    const handleStepRemove = (index) => {
        const newSteps = data.steps.filter((_, i) => i !== index);

        const renumberedSteps = newSteps.map((step, i) => ({
            ...step,
            step: i + 1
        }));

        setData('steps', renumberedSteps);
    }

    const handleRoleChange = (index, value) => {
        const updatedSteps = [...data.steps];
        updatedSteps[index] = {
            ...updatedSteps[index],
            role_id: value
        };
        setData('steps', updatedSteps);
    };
    return (
        <AuthenticatedLayout>
            <Breadcrumb items={breadCrumbItems} />
            <div className="bg-white p-4 shadow sm:rounded-lg sm:p-8">
                <h2 className="text-center text-2xl font-bold">Add Workflow</h2>
                <form onSubmit={submit} className="mx-auto w-2/5">
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
                        <InputLabel htmlFor="min_amount" value="Min Amount" />
                        <TextInput
                            id="min_amount"
                            name="min_amount"
                            type="number"
                            value={data.min_amount}
                            className="mt-1 w-full"
                            onChange={(e) => setData('min_amount', e.target.value)}
                        />
                        <InputError message={errors.min_amount} className="mt-2" />
                    </div>
                    <div className="mt-4">
                        <InputLabel htmlFor="max_amount" value="Max Amount" />
                        <TextInput
                            id="max_amount"
                            name="max_amount"
                            type="number"
                            value={data.max_amount}
                            className="mt-1 w-full"
                            onChange={(e) => setData('max_amount', e.target.value)}
                        />
                        <InputError message={errors.max_amount} className="mt-2" />
                    </div>
                    <div className="mt-6">
                        <h3 className="text-xl font-semibold text-center">Create steps</h3>
                        {data.steps.map((step, index) => (
                            <>
                                <div className="border border-gray-400 rounded-md p-3">
                                    <div className="flex justify-between items-center">
                                        <h3 className="text-md font-semibold my-1">Step #{step.step}</h3>
                                        {index > 0 &&
                                            <i className="fa fa-trash-o text-red-500 cursor-pointer" onClick={() => handleStepRemove(index)}></i>
                                        }
                                    </div>
                                    <InputLabel htmlFor="max_amount" value="Approver" />
                                    <select name="" id="" className="py-1 mt-1 w-full" value={step.role_id}
                                        onChange={(e) => handleRoleChange(index, e.target.value)}
                                    >
                                        <option value="">Select Role</option>
                                        {roles.map((role, index) => (
                                            <option value={role.id} key={index}>{role.name}</option>
                                        ))}
                                    </select>
                                </div>
                                {index < data.steps.length - 1 && (
                                    <div className="text-center my-2">
                                        <i className="fa fa-arrow-down"></i>
                                    </div>
                                )}
                            </>
                        ))}
                        <div className="text-center mt-2">
                            <Button type="button" className='rounded-md bg-green-600 px-4 py-2 text-xs font-semibold text-white hover:bg-green-700' onClick={handleStepAdd}>
                                + Add Another Step
                            </Button>
                        </div>
                    </div>
                    <div className="text-center mt-4">
                        <PrimaryButton disabled={processing}>
                            Add Workflow
                        </PrimaryButton>
                    </div>
                </form>
            </div>
        </AuthenticatedLayout>
    )
}

export default AddApprovalWorkflow