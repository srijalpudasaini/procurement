<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\Vendor;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;
use Illuminate\Validation\Rules;

class VendorAuthController extends Controller
{
    public function index()
    {
        return Inertia::render('Auth/VendorRegister');
    }

    public function register(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'contact' => 'required|numeric|unique:vendors,contact',
            'address' => 'required|',
            'email' => 'required|string|lowercase|email|max:255|unique:' . Vendor::class,
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
            'registration_number' => 'required|numeric',
            'pan_number' => 'required|numeric|digits:9',
            'registration_date' => 'required|date|before:today'
        ]);

        $vendor = Vendor::create([
            'name' => $request->name,
            'email' => $request->email,
            'contact' => $request->contact,
            'address' => $request->address,
            'registration_number' => $request->registration_number,
            'pan_number' => $request->pan_number,
            'registration_date' => $request->registration_date,
            'password' => Hash::make($request->password),
        ]);
        $vendor->assignRole('vendor');

        return redirect(route('login'));
    }

    public function login(Request $request)
    {
        $credentials = $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        if (Auth::guard('vendor')->attempt($credentials)) {
            $request->session()->regenerate();
            return redirect()->intended(route('dashboard', absolute: false));
        }
    }
}
