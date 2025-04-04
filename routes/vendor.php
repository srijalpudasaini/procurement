<?php 

use App\Http\Controllers\Auth\VendorAuthController;
use App\Http\Controllers\EoiApplicationController;
use App\Http\Controllers\VendorController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth:vendor'])->prefix('vendor')->name('vendor.')->group(function () {
    Route::post('/logout',[VendorAuthController::class,'destroy'])->name('logout');
    Route::get('/dashboard',[VendorController::class,'index'])->name('dashboard');
    Route::get('/eois',[VendorController::class,'eoi'])->name('eoi');
    Route::get('/eoi/apply/{id}',[VendorController::class,'apply']);
    Route::post('/eoi/submit',[EoiApplicationController::class,'submitApplication'])->name('submit');
});