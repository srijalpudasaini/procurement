<?php

namespace App\Http\Controllers;

use App\Http\Requests\RoleRequest;
use App\Interfaces\RoleInterface;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;
use Inertia\Inertia;
use Spatie\Permission\Models\Permission;

class RoleController extends Controller implements HasMiddleware
{
    protected $roleInterface;

    public static function middleware()
    {
        return [
            'auth',
            //  new Middleware('permission:view_role',['index']),
            //  new Middleware('permission:create_role',['create','store']),
            //  new Middleware('permission:edit_role',['edit','update']),
            //  new Middleware('permission:delete_role',['destroy']),
        ];
    }

    public function __construct(RoleInterface $roleInterface){
        $this->roleInterface = $roleInterface;
    }

    public function index(){
        $roles = $this->roleInterface->all();
        return Inertia::render('Roles/Roles',compact('roles'));
    }

    public function create(){
        $permissions = Permission::pluck('name');
        $groupPermissions = array();
        foreach($permissions as $permission){
            $arr = explode("_",$permission);
            $suffix = end($arr);
            if(!array_key_exists($suffix,$groupPermissions)){
                $groupPermissions[$suffix] = array();
                array_push($groupPermissions[$suffix],$arr[0]);
            }
            else{
                array_push($groupPermissions[$suffix],$arr[0]);
            }
        }
        $groupPermissionsArray = array_values(array_map(function ($key, $values) {
            return ['group' => $key, 'permissions' => $values];
        }, array_keys($groupPermissions), $groupPermissions));
        return Inertia::render('Roles/AddRole',compact('groupPermissionsArray'));
    }

    public function store(RoleRequest $roleRequest){
        $role = $this->roleInterface->store($roleRequest->validated());
        if(!empty($roleRequest->validated('permissions'))){
            $role->syncPermissions($roleRequest->validated('permissions'));
        }
        return redirect()->route('roles.index')->with('success','Role added successfully!');
    }

    public function edit($id){
        $role = $this->roleInterface->find($id);
        $permissions = Permission::get()->pluck('name');
        $rolePermissions = $role->permissions->pluck('name');
        $groupPermissions = array();
        foreach($permissions as $permission){
            $arr = explode("_",$permission);
            $suffix = end($arr);
            if(!array_key_exists($suffix,$groupPermissions)){
                $groupPermissions[$suffix] = array();
                array_push($groupPermissions[$suffix],$arr[0]);
            }
            else{
                array_push($groupPermissions[$suffix],$arr[0]);
            }
        }
        $groupPermissionsArray = array_values(array_map(function ($key, $values) {
            return ['group' => $key, 'permissions' => $values];
        }, array_keys($groupPermissions), $groupPermissions));
        return Inertia::render('Roles/EditRole',compact('role','groupPermissionsArray','rolePermissions'));
    }

    public function update(RoleRequest $roleRequest,$id){
        $role = $this->roleInterface->update($id,$roleRequest->validated());
        if(!empty($roleRequest->validated('permissions'))){
            $role->syncPermissions($roleRequest->validated('permissions'));
        }
        return redirect()->route('roles.index')->with('success','Role updated successfully!'); 
    }

    public function destroy($id){
        $this->roleInterface->delete($id);
        return redirect()->route('roles.index')->with('success','Role deleted successfully!');
    }

}
