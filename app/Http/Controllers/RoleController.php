<?php

namespace App\Http\Controllers;

use App\Http\Requests\RoleRequest;
use App\Repositories\RoleRepository;
use Illuminate\Http\Request;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;
use Inertia\Inertia;
use Spatie\Permission\Models\Permission;

class RoleController extends Controller implements HasMiddleware
{
    protected $roleRepository;

    public static function middleware()
    {
        return [
            new Middleware('permission:view_role', ['index']),
            new Middleware('permission:create_role', ['create', 'store']),
            new Middleware('permission:edit_role', ['edit', 'update']),
            new Middleware('permission:delete_role', ['destroy']),
        ];
    }

    public function __construct(RoleRepository $roleRepository)
    {
        $this->roleRepository = $roleRepository;
    }

    public function index(Request $request)
    {
        $roles = $this->roleRepository->all($request->input('per_page', 10));
        return Inertia::render('Roles/Roles', compact('roles'));
    }

    private function getGroupedPermissions()
    {
        $permissions = Permission::all();
        $groupPermissions = [];

        foreach ($permissions as $permission) {
            $parts = explode('_', $permission->name);
            $group = array_pop($parts);
            $actionCode = implode('_', $parts);
            $actionLabel = ucwords(str_replace('_', ' ', $actionCode));

            if (!isset($groupPermissions[$group])) {
                $groupPermissions[$group] = [];
            }

            $groupPermissions[$group][] = [
                'name' => $permission->name,
                'action_code' => $actionCode,
                'action_label' => $actionLabel,
            ];
        }

        // Sort actions: view first, view_all second, then alphabetical
        foreach ($groupPermissions as &$items) {
            usort($items, function ($a, $b) {
                if ($a['action_code'] === 'view') return -1;
                if ($b['action_code'] === 'view') return 1;
                if ($a['action_code'] === 'view_all') return -1;
                if ($b['action_code'] === 'view_all') return 1;
                return strcmp($a['action_code'], $b['action_code']);
            });
        }

        return array_map(function ($key, $values) {
            return [
                'group' => $key,
                'group_label' => ucwords(str_replace('_', ' ', $key)),
                'permissions' => $values,
            ];
        }, array_keys($groupPermissions), $groupPermissions);
    }

    public function create()
    {
        $groupPermissionsArray = $this->getGroupedPermissions();
        return Inertia::render('Roles/AddRole', compact('groupPermissionsArray'));
    }

    public function store(RoleRequest $roleRequest)
    {
        try {
            $role = $this->roleRepository->store(['name' => $roleRequest->validated('name')]);
            $permissions = $roleRequest->validated('permissions') ?? [];
            $role->syncPermissions($permissions);
            app(\Spatie\Permission\PermissionRegistrar::class)->forgetCachedPermissions();

            return redirect()->route('roles.index')->with('success', 'Role added successfully!');
        } catch (\Exception $e) {
            return redirect()->back()->with('error', $e->getMessage());
        }
    }

    public function edit($id)
    {
        $role = $this->roleRepository->find($id);
        $rolePermissions = $role->permissions->pluck('name');
        $groupPermissionsArray = $this->getGroupedPermissions();

        return Inertia::render('Roles/EditRole', compact('role', 'groupPermissionsArray', 'rolePermissions'));
    }

    public function update(RoleRequest $roleRequest, $id)
    {
        try {
            $role = $this->roleRepository->update($id, ['name' => $roleRequest->validated('name')]);
            $permissions = $roleRequest->validated('permissions') ?? [];
            $role->syncPermissions($permissions);
            app(\Spatie\Permission\PermissionRegistrar::class)->forgetCachedPermissions();

            return redirect()->route('roles.index')->with('success', 'Role updated successfully!');
        } catch (\Exception $e) {
            return redirect()->back()->with('error', $e->getMessage());
        }
    }

    public function destroy($id)
    {
        try {
            $this->roleRepository->delete($id);
            app(\Spatie\Permission\PermissionRegistrar::class)->forgetCachedPermissions();
            return redirect()->route('roles.index')->with('success', 'Role deleted successfully!');
        } catch (\Exception $e) {
            return redirect()->route('roles.index')->with('error', $e->getMessage());
        }
    }
}
