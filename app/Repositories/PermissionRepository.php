<?php

namespace App\Repositories;

use Spatie\Permission\Models\Permission;

class PermissionRepository
{
    /**
     * Create a new class instance.
     */
    public function __construct()
    {
        //
    }
    public function all()
    {
        return Permission::all();
    }

    public function find($id)
    {
        return Permission::findOrFail($id);
    }

    public function store(array $data)
    {
        return Permission::create($data);
    }

    public function update($id, array $data)
    {
        $permission = Permission::findOrFail($id);
        $permission->update($data);
        return $permission;
    }

    public function delete($id)
    {
        $permission = Permission::findOrFail($id);
        $permission->delete();
    }
}
