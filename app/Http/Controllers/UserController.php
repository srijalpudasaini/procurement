<?php

namespace App\Http\Controllers;

use App\Http\Requests\UserRequest;
use App\Repositories\UserRepository;
use Illuminate\Http\Request;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;
use Inertia\Inertia;
use Spatie\Permission\Models\Role;

class UserController extends Controller implements HasMiddleware
{
    protected $userRepository;

    public function __construct(UserRepository $userRepository){
        $this->userRepository = $userRepository;
    }

    public static function middleware(){
        return [
            new Middleware('permission:view_user',['index']),
            new Middleware('permission:create_user',['create','store']),
            new Middleware('permission:edit_user',['edit','update']),
            new Middleware('permission:delete_user',['destroy']),
        ];
    }
    public function index(Request $request){
        $users = $this->userRepository->all($request->input('per_page',10));
        return Inertia::render('Users/Users',compact('users'));
    }

    public function create(){
        $roles = Role::all();
        return Inertia::render('Users/AddUser',compact('roles'));
    }
    
    public function store(UserRequest $userRequest){
        $user = $this->userRepository->store($userRequest->validated());
        $user->assignRole($userRequest->validated('role'));
        return redirect()->route('users.index')->with('success','User registered successfully');
    }
    
    public function edit($id){
        $user = $this->userRepository->find($id);
        $roles = Role::all();
        $userRole= $user->getRoleNames()->first();
        return Inertia::render('Users/EditUser',compact('user','roles','userRole'));
    }
    public function update($id, UserRequest $userRequest){
        $user = $this->userRepository->update($id,$userRequest->validated());
        $user->syncRoles($userRequest->validated('role'));

        return redirect()->route('users.index')->with('success','User updated successfully');
    }
    
    public function destroy($id){
        $this->userRepository->delete($id);
        return redirect()->route('users.index')->with('success','User deleted successfully');
    }
}
