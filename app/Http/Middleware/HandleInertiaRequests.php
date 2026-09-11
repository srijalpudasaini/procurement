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
        $user = $request->user('web');
        $vendor = $request->user('vendor');

        $userData = null;
        if ($user) {
            $user->loadMissing('roles.permissions');
            $roles = $user->roles->pluck('name')->toArray();
            $permissions = $user->roles->flatMap->permissions->pluck('name')->unique()->values()->toArray();

            $userData = [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'is_superadmin' => (bool) $user->is_superadmin,
                'roles' => $roles,
                'permissions' => $permissions,
            ];
        }

        return array_merge(parent::share($request), [
            'auth' => [
                'user' => $userData,
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
