<?php

namespace App\Http\Controllers;

use App\Http\Requests\UserRequest;
use App\Interfaces\UserInterface;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;
use Inertia\Inertia;
use Spatie\Permission\Models\Role;

class UserController extends Controller implements HasMiddleware
{
    protected $userInterface;

    public function __construct(UserInterface $userInterface){
        $this->userInterface = $userInterface;
    }

    public static function middleware(){
        return [
            'auth',
            new Middleware('permission:view_user',['index']),
            new Middleware('permission:create_user',['create','store']),
            new Middleware('permission:edit_user',['edit','update']),
            new Middleware('permission:delete_user',['destroy']),
        ];
    }
    public function index(){
        $users = $this->userInterface->all();
        return Inertia::render('Users/Users',compact('users'));
    }

    public function create(){
        $roles = Role::all();
        return Inertia::render('Users/AddUser',compact('roles'));
    }
    
    public function store(UserRequest $userRequest){
        $user = $this->userInterface->store($userRequest->validated());
        $user->assignRole($userRequest->validated('role'));
        return redirect()->route('users.index')->with('success','User registered successfully');
    }
    
    public function edit($id){
        $user = $this->userInterface->find($id);
        $roles = Role::all();
        $userRole= $user->getRoleNames()->first();
        return Inertia::render('Users/EditUser',compact('user','roles','userRole'));
    }
    public function update($id, UserRequest $userRequest){
        $user = $this->userInterface->update($id,$userRequest->validated());
        $user->syncRoles($userRequest->validated('role'));

        return redirect()->route('users.index')->with('success','User updated successfully');
    }
    
    public function destroy($id){
        $this->userInterface->delete($id);
        return redirect()->route('users.index')->with('success','User deleted successfully');
    }
}
