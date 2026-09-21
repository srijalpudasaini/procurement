import InputError from "@/Components/Form/InputError";
import InputLabel from "@/Components/Form/InputLabel";
import PrimaryButton from "@/Components/Buttons/PrimaryButton";
import TextInput from "@/Components/Form/TextInput";
import Alert from "@/Components/ui/Alert";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { useForm, usePage } from "@inertiajs/react";
import Breadcrumb from "@/Components/ui/Breadcrumb";
import React from "react";

const AddRole = ({ groupPermissionsArray }) => {
    const { flash } = usePage().props;
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        permissions: []
    });

    const handleChange = (e) => {
        const { value, checked } = e.target;

        if (checked) {
            setData('permissions', [...data.permissions, value]);
        } else {
            let updatedPermissions = data.permissions.filter((p) => p !== value);

            const parts = value.split('_');
            const group = parts[parts.length - 1];
            if (value === `view_${group}`) {
                const stillHasViewAll = updatedPermissions.includes(`view_all_${group}`);
                if (!stillHasViewAll) {
                    updatedPermissions = updatedPermissions.filter(p => !p.endsWith(`_${group}`) || p === `view_${group}`);
                }
            }

            setData('permissions', updatedPermissions);
        }
    };

    const submit = (e) => {
        e.preventDefault();
        post(route('roles.store'));
    };

    const breadCrumbItems = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Roles', href: '/roles' },
        { title: 'Add Role' },
    ];

    return (
        <AuthenticatedLayout>
            <Breadcrumb items={breadCrumbItems} />

            <div className="bg-white p-4 shadow-sm sm:rounded-lg sm:p-8 max-w-4xl mx-auto">
                <div className="pb-4 border-b border-gray-200 mb-6">
                    <h1 className="text-xl font-bold text-gray-900">Create New Role</h1>
                    <p className="text-xs text-gray-500 mt-1">
                        Define a new role and grant specific capabilities across modules.
                    </p>
                </div>

                {flash?.error && (
                    <div className="mb-4">
                        <Alert type="error" message={flash.error} />
                    </div>
                )}
                {errors.permissions && (
                    <div className="mb-4">
                        <Alert type="error" message={errors.permissions} />
                    </div>
                )}

                <form onSubmit={submit} className="space-y-6">
                    <div>
                        <InputLabel htmlFor="name" value="Role Name *" />
                        <TextInput
                            id="name"
                            name="name"
                            value={data.name}
                            className="mt-1 w-full"
                            autoComplete="name"
                            placeholder="e.g. auditor, finance_manager"
                            onChange={(e) => setData('name', e.target.value)}
                        />
                        <InputError message={errors.name} className="mt-2" />
                    </div>

                    <div className="mt-6 space-y-4">
                        <div className="border-b pb-2">
                            <h2 className="text-sm font-bold text-gray-900">Assign Permissions</h2>
                            <p className="text-xs text-gray-500">Enable or disable capabilities for this role by resource module.</p>
                        </div>

                        {groupPermissionsArray?.map((groupPermission, gIdx) => {
                            const group = groupPermission.group;
                            const hasGroupView = data.permissions.includes(`view_${group}`) || data.permissions.includes(`view_all_${group}`);
                            const activeCount = groupPermission.permissions.filter(p => data.permissions.includes(p.name)).length;

                            return (
                                <div key={gIdx} className="border border-gray-200 rounded-lg p-3.5 bg-gray-50/50">
                                    <div className="flex items-center justify-between mb-2">
                                        <h3 className="font-bold text-gray-800 text-xs sm:text-sm">
                                            {groupPermission.group_label || group}
                                        </h3>
                                        <span className="text-[11px] text-gray-500 font-mono">
                                            {activeCount} / {groupPermission.permissions.length} enabled
                                        </span>
                                    </div>

                                    <div className="overflow-x-auto">
                                        <table className="w-full border border-gray-200 border-collapse text-center text-xs bg-white rounded">
                                            <thead>
                                                <tr className="bg-gray-100 text-gray-700 font-semibold border-b">
                                                    {groupPermission.permissions.map((perm, pIdx) => (
                                                        <th key={pIdx} className="border p-2 font-medium">
                                                            {perm.action_label}
                                                        </th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                <tr>
                                                    {groupPermission.permissions.map((perm, pIdx) => {
                                                        const isViewAction = perm.action_code === 'view' || perm.action_code === 'view_all';
                                                        const isDisabled = !isViewAction && !hasGroupView;

                                                        return (
                                                            <td key={pIdx} className="border p-2">
                                                                <input
                                                                    type="checkbox"
                                                                    className="rounded border-gray-300 text-[#00AB66] focus:ring-[#00AB66] cursor-pointer disabled:cursor-not-allowed disabled:bg-gray-100"
                                                                    value={perm.name}
                                                                    onChange={handleChange}
                                                                    disabled={isDisabled}
                                                                    checked={data.permissions.includes(perm.name)}
                                                                />
                                                            </td>
                                                        );
                                                    })}
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="pt-4 border-t border-gray-200 flex items-center justify-end gap-3">
                        <PrimaryButton disabled={processing}>
                            {processing ? 'Creating...' : 'Create Role'}
                        </PrimaryButton>
                    </div>
                </form>
            </div>
        </AuthenticatedLayout>
    );
};

export default AddRole;