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

    public function create()
    {
        $permissions = Permission::pluck('name');
        $groupPermissions = [];

        foreach ($permissions as $permission) {
            $parts = explode("_", $permission);

            // Take the last part as the group
            $group = array_pop($parts);

            // The rest is the action (joined with space)
            $action = implode(" ", $parts);

            if (!isset($groupPermissions[$group])) {
                $groupPermissions[$group] = [];
            }

            if (!in_array($action, $groupPermissions[$group])) {
                $groupPermissions[$group][] = $action;
            }
        }

        // Optional: sort actions, e.g., prioritize 'view'
        foreach ($groupPermissions as &$actions) {
            usort($actions, function ($a, $b) {
                return $a === 'view' ? -1 : ($b === 'view' ? 1 : strcmp($a, $b));
            });
        }

        $groupPermissionsArray = array_map(function ($key, $values) {
            return ['group' => $key, 'permissions' => $values];
        }, array_keys($groupPermissions), $groupPermissions);

        return Inertia::render('Roles/AddRole', compact('groupPermissionsArray'));
    }

    public function store(RoleRequest $roleRequest)
    {
        try {
            $role = $this->roleRepository->store($roleRequest->validated());
            if (!empty($roleRequest->validated('permissions'))) {
                $role->syncPermissions($roleRequest->validated('permissions'));
            }
            return redirect()->route('roles.index')->with('success', 'Role added successfully!');
        } catch (\Exception $e) {
            return redirect()->route('roles.index')->with('error', $e->getMessage());
        }
    }

    public function edit($id)
    {
        $role = $this->roleRepository->find($id);
        $rolePermissions = $role->permissions->pluck('name');
        $permissions = Permission::pluck('name');
        $groupPermissions = [];

        foreach ($permissions as $permission) {
            $parts = explode("_", $permission);

            $group = array_pop($parts);

            $action = implode(" ", $parts);

            if (!isset($groupPermissions[$group])) {
                $groupPermissions[$group] = [];
            }

            if (!in_array($action, $groupPermissions[$group])) {
                $groupPermissions[$group][] = $action;
            }
        }

        // Optional: sort actions, e.g., prioritize 'view'
        foreach ($groupPermissions as &$actions) {
            usort($actions, function ($a, $b) {
                return $a === 'view' ? -1 : ($b === 'view' ? 1 : strcmp($a, $b));
            });
        }

        $groupPermissionsArray = array_map(function ($key, $values) {
            return ['group' => $key, 'permissions' => $values];
        }, array_keys($groupPermissions), $groupPermissions);

        return Inertia::render('Roles/EditRole', compact('role', 'groupPermissionsArray', 'rolePermissions'));
    }

    public function update(RoleRequest $roleRequest, $id)
    {
        try {
            $role = $this->roleRepository->update($id, $roleRequest->validated());
            if (!empty($roleRequest->validated('permissions'))) {
                $role->syncPermissions($roleRequest->validated('permissions'));
            }
            return redirect()->route('roles.index')->with('success', 'Role updated successfully!');
        } catch (\Exception $e) {
            return redirect()->route('roles.index')->with('error', $e->getMessage());
        }
    }

    public function destroy($id)
    {
        try {
            $this->roleRepository->delete($id);
            return redirect()->route('roles.index')->with('success', 'Role deleted successfully!');
        } catch (\Exception $e) {
            return redirect()->route('roles.index')->with('success', $e->getMessage());
        }
    }
}
