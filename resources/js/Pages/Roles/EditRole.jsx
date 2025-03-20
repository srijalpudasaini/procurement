import InputError from "@/Components/Form/InputError";
import InputLabel from "@/Components/Form/InputLabel";
import PrimaryButton from "@/Components/Buttons/PrimaryButton";
import TextInput from "@/Components/Form/TextInput";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout"
import { useForm } from "@inertiajs/react";
import Breadcrumb from "@/Components/ui/Breadcrumb";
import { useState } from "react";

const EditRole = ({ role, groupPermissionsArray, rolePermissions }) => {
    const { data, setData, put, processing, errors, reset } = useForm({
        name: role.name,
        permissions: [...rolePermissions],
        id: role.id
    });

    const hasPermission = (permisson) => (data.permissions.includes(permisson))

    const [viewPermissions, setViewPermissions] = useState({});
    

    const handleChange = (e) => {
        const { value, checked } = e.target;

        const [action, ...groupArr] = value.split("_");
        const group = groupArr.join("_");

        if (checked) {
            setData('permissions', [...data.permissions, value]);

            if (action === "view") {
                setViewPermissions(prev => ({ ...prev, [group]: true }));
            }
        } else {
            let updatedPermissions = data.permissions.filter((p) => p !== value);

            if (action === "view") {
                setViewPermissions(prev => ({ ...prev, [group]: false }));
                updatedPermissions = updatedPermissions.filter((p) => !p.endsWith(`_${group}`));
            }

            setData('permissions', updatedPermissions);
        }
    };
    const submit = (e) => {
        e.preventDefault();
        put(route('roles.update', role.id));
    };

    const breadCrumbItems = [
        {
            title: 'Dashboard',
            href: '/dashboard'
        },
        {
            title: 'Roles',
            href: '/roles'
        },
        {
            title: 'Edit Role',
        },
    ]
    return (
        <AuthenticatedLayout>
            <Breadcrumb items={breadCrumbItems} />
            <div className="bg-white p-4 shadow sm:rounded-lg sm:p-8">
                <h2 className="text-center text-2xl font-bold">Edit Role</h2>
                <form onSubmit={submit} className="mx-auto w-2/3">
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
                        <InputLabel htmlFor="permissions" value="Select Permissions" />
                        {groupPermissionsArray.map((groupPermission, index) => (
                            <div className="permission-group mb-3" key={index}>
                                <h2 className="capitalize font-bold">{groupPermission.group}</h2>
                                <table className="w-full border border-collapse text-center">
                                    <tr>
                                        {groupPermission.permissions.map((permisson, index) => (
                                            <th key={index} className="border capitalize p-1">{permisson}</th>
                                        ))}
                                    </tr>
                                    <tr>
                                    {groupPermission.permissions.map((permission, index) => {
                                        const fullPermission = `${permission}_${groupPermission.group}`;
                                        const isViewPermission = permission === "view";
                                        const hasViewPermission = data.permissions.includes(`view_${groupPermission.group}`);
                                        const isDisabled = !isViewPermission && !hasViewPermission;

                                        return (
                                            <td key={index} className="border p-1">
                                                <input
                                                    type="checkbox"
                                                    className="ring-0 focus:ring-0 rounded-sm border-black disabled:border-gray-400"
                                                    value={fullPermission}
                                                    onChange={handleChange}
                                                    disabled={isDisabled}
                                                    checked={hasPermission(fullPermission)}
                                                />
                                            </td>
                                        );
                                    })}
                                    </tr>
                                </table>
                            </div>
                        ))}
                    </div>
                    <div className="text-center mt-4">
                        <PrimaryButton disabled={processing}>
                            Update Role
                        </PrimaryButton>
                    </div>
                </form>
            </div>
        </AuthenticatedLayout>
    )
}

export default EditRole