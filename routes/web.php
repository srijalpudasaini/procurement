<?php
require __DIR__.'/auth.php';
require __DIR__.'/vendor.php';

use App\Http\Controllers\Auth\VendorAuthController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\DocumentController;
use App\Http\Controllers\EoiController;
use App\Http\Controllers\HomeController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\PurchaseRequestController;
use App\Http\Controllers\RoleController;
use App\Http\Controllers\UserController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
        'laravelVersion' => Application::VERSION,
        'phpVersion' => PHP_VERSION,
    ]);
});

Route::get('/eoi',[HomeController::class,'index']);
Route::get('/eoi/{id}',[HomeController::class,'showEoi']);


Route::middleware(['auth:web'])->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});



 
Route::middleware(['auth'])->group(function(){
    Route::get('/dashboard', function () {
        return Inertia::render('Dashboard');
    })->name('dashboard');
    Route::resources([
        'categories'=>CategoryController::class,
        'products'=>ProductController::class,
        'roles'=>RoleController::class,
        'users'=>UserController::class,
        'requests'=>PurchaseRequestController::class,
        'eois'=>EoiController::class,
        'documents'=>DocumentController::class,
    ]);

    Route::put('requests/updateStatus/{id}',[PurchaseRequestController::class,'updateStatus']);
    Route::get('eois/publish/{id}',[EoiController::class,'publish']);
    Route::get('eois/submissions/{id}',[EoiController::class,'submissions']);
    // Route::get('/roles', function(){
    //     return 'abc';
    // });
});

Route::post('/vendor-register',[VendorAuthController::class,'register'])->name('vendor.store');
