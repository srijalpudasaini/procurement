<?php
require __DIR__.'/auth.php';
require __DIR__.'/vendor.php';

use App\Http\Controllers\ApprovalWorkflowController;
use App\Http\Controllers\Auth\VendorAuthController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\DocumentController;
use App\Http\Controllers\EoiController;
use App\Http\Controllers\HomeController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\PurchaseRequestController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\RoleController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\VendorController;
use App\Models\ApprovalWorkflow;
use App\Models\Category;
use App\Models\Eoi;
use App\Models\Product;
use App\Models\PurchaseRequest;
use App\Models\Vendor;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    $activeEois = Eoi::where('status', 'published')
        ->withCount('purchase_request_items')
        ->latest('published_date')
        ->take(3)
        ->get();

    $stats = [
        'active_tenders' => Eoi::where('status', 'published')->count(),
        'registered_vendors' => Vendor::count(),
        'total_requests' => PurchaseRequest::count(),
    ];

    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
        'activeEois' => $activeEois,
        'stats' => $stats,
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
        $user = auth()->user();
        $isSuperAdmin = !empty($user->is_superadmin);
        $roleId = $user->roles()->first()?->id;
        $canApprove = !empty($roleId) && ($user->can('approve_request') || $isSuperAdmin);
        $canViewRequest = $user->can('view_request') || $isSuperAdmin;
        $canViewAllRequest = $user->can('view_all_request') || $isSuperAdmin;
        $canViewEoi = $user->can('view_eoi') || $isSuperAdmin;
        $canCreateEoi = $user->can('create_eoi') || $isSuperAdmin;

        $myRequestsCount = PurchaseRequest::where('user_id', $user->id)->count();
        $myPendingCount = PurchaseRequest::where('user_id', $user->id)->where('status', 'pending')->count();
        $myApprovedCount = PurchaseRequest::where('user_id', $user->id)->where('status', 'approved')->count();

        $systemStats = [
            'total_requests' => PurchaseRequest::count(),
            'pending_requests' => PurchaseRequest::where('status', 'pending')->count(),
            'approved_requests' => PurchaseRequest::where('status', 'approved')->count(),
            'rejected_requests' => PurchaseRequest::where('status', 'rejected')->count(),
            'active_eois' => Eoi::where('status', 'published')->count(),
            'closed_eois' => Eoi::where('status', 'closed')->count(),
            'total_eois' => Eoi::count(),
            'total_vendors' => Vendor::count(),
            'total_products' => Product::count(),
            'total_categories' => Category::count(),
            'total_workflows' => ApprovalWorkflow::count(),
            'my_total_requests' => $myRequestsCount,
            'my_pending_requests' => $myPendingCount,
            'my_approved_requests' => $myApprovedCount,
        ];

        $recentRequestsQuery = PurchaseRequest::with('user')->latest();
        if (!$canViewAllRequest) {
            $recentRequestsQuery->where('user_id', $user->id);
        }
        $recentRequests = $recentRequestsQuery->take(5)->get();

        $recentEois = ($canViewEoi || $canCreateEoi)
            ? Eoi::withCount('eoi_vendor_applications')->latest()->take(5)->get()
            : Eoi::where('status', 'published')->latest()->take(3)->get();

        return Inertia::render('Dashboard', [
            'stats' => $systemStats,
            'recentRequests' => $recentRequests,
            'recentEois' => $recentEois,
            'userRole' => [
                'is_superadmin' => $isSuperAdmin,
                'can_approve' => $canApprove,
                'can_view_all_request' => $canViewAllRequest,
                'can_manage_eoi' => $canCreateEoi || $canViewEoi,
            ],
        ]);
    })->name('dashboard');
    Route::get('/eois/publish',[EoiController::class,'publish'])->name('eois.publish');
    Route::resources([
        'categories'=>CategoryController::class,
        'products'=>ProductController::class,
        'roles'=>RoleController::class,
        'users'=>UserController::class,
        'requests'=>PurchaseRequestController::class,
        'eois'=>EoiController::class,
        'documents'=>DocumentController::class,
        'approval-workflows'=>ApprovalWorkflowController::class,
    ]);

    Route::put('requests/updateStatus/{id}',[PurchaseRequestController::class,'updateStatus']);
    Route::get('/eois/submissions/{id}',[EoiController::class,'submissions']);
    Route::post('/eois/{eoi}/items/{item}/award', [EoiController::class, 'awardItemProposal'])->name('eois.items.award');
    Route::post('/eois/{eoi}/items/{item}/revoke', [EoiController::class, 'revokeItemAward'])->name('eois.items.revoke');
    Route::post('/eois/{eoi}/applications/{application}/award', [EoiController::class, 'awardApplication'])->name('eois.applications.award');
    Route::post('/eois/{eoi}/applications/{application}/revoke', [EoiController::class, 'revokeApplication'])->name('eois.applications.revoke');
    Route::post('/eois/{eoi}/awards', [EoiController::class, 'awardSelection'])->name('eois.awards.save');
    Route::post('/eois/{eoi}/awards/revoke-all', [EoiController::class, 'revokeAllAwards'])->name('eois.awards.revokeAll');
    Route::post('/eois/{eoi}/knapsack-recommend', [EoiController::class, 'knapsackRecommend'])->name('eois.knapsack.recommend');
    Route::post('/eois/{eoi}/topsis-recommend', [EoiController::class, 'topsisRecommend'])->name('eois.topsis.recommend');
    Route::post('/eois/auto-bundle', [EoiController::class, 'autoBundleRequests'])->name('eois.autoBundle');
    Route::post('/vendors/{id}/rating', [VendorController::class, 'updateRating'])->name('vendors.rating.update');
    Route::get('/reports',[ReportController::class,'index']);
    // Route::get('/roles', function(){
    //     return 'abc';
    // });
});

Route::post('/vendor-register',[VendorAuthController::class,'register'])->name('vendor.store');
