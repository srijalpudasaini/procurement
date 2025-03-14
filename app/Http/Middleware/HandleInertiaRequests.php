<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
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
        $user = $request->user(); // Make sure user is retrieved correctly

        return array_merge(parent::share($request), [
            'auth' => [
                'user' => $user ? $user->only(['id', 'name', 'email']) : null,
                'role' => $user ? $user->getRoleNames()->first() : null, // Get user's first role
                'permissions' => $user ? $user->getAllPermissions()->pluck('name') : [],
            ],
            'flash' => [
                'success' => session('success'),
                'error' => session('error'),
            ],
        ]);
    }
}
