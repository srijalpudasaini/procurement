<?php

namespace App\Http\Middleware;

use App\Models\User;
use App\Models\Vendor;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that is loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determine the current asset version.
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
{
    $user = Auth::guard('web')->id() ? User::find(Auth::guard('web')->id()) : null;
    $vendor = Auth::guard('vendor')->user();

    return array_merge(parent::share($request), [
        'auth' => [
            'user' => $user ? [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'roles' => $user->roles->pluck('name')->toArray(), // Get user roles
                'permissions' => $user->getPermissionsViaRoles()->pluck('name')->toArray(), // Get user permissions
            ] : null,

            'vendor' => $vendor ? [
                'id' => $vendor->id,
                'name' => $vendor->name,
                'email' => $vendor->email,
            ] : null,
        ],
        'flash' => [
            'success' => session('success'),
            'error' => session('error'),
        ],
    ]);
}
}
