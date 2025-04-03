<?php

namespace App\Http\Controllers;

use App\Http\Requests\PurchaseRequest;
use App\Repositories\PurchaseRequestItemRepository;
use App\Repositories\PurchaseRequestRepository;
use App\Models\Product;
use App\Models\PurchaseRequestItem;
use Illuminate\Http\Request;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;
use Inertia\Inertia;

class PurchaseRequestController extends Controller implements HasMiddleware
{

    protected $purchaseRequestRepository,$purchaseRequestItemRepository;

    public function __construct(PurchaseRequestRepository $purchaseRequestRepository, PurchaseRequestItemRepository $purchaseRequestItemRepository)
    {
        $this->purchaseRequestRepository = $purchaseRequestRepository;
        $this->purchaseRequestItemRepository = $purchaseRequestItemRepository;
    }
    public static function middleware()
    {
        return [
            new Middleware('permission:view_request', ['index']),
            new Middleware('permission:create_request', ['create', 'store']),
            new Middleware('permission:delete_request', ['destroy']),
        ];
    }
    public function index(Request $request)
    {
        $user = $request->user();
        if ($user->hasRole('admin') || $user->is_superadmin) {
            $purchaseRequests = $this->purchaseRequestRepository->all(
                $request->input('per_page', 10),
                ['user', 'purchase_request_items.product']
            );
        } else {
            $purchaseRequests = $this->purchaseRequestRepository->all(
                $request->input('per_page', 10),
                ['user', 'purchase_request_items.product'],
                ['user_id' => $user->id]
            );
        }

        return Inertia::render('Requests/Requests', compact('purchaseRequests'));
    }

    public function create()
    {
        $products = Product::all();
        return Inertia::render('Requests/AddRequest', compact('products'));
    }

    public function store(PurchaseRequest $purchaseRequest)
    {
        $userId = $purchaseRequest->user()->id;
        $total = 0;
        foreach ($purchaseRequest->products as $product) {
            $total += $product['price'] * $product['quantity'];
        }

        $request = $this->purchaseRequestRepository->store(['user_id' => $userId, 'total' => $total]);

        foreach ($purchaseRequest->products as $product) {
            $this->purchaseRequestItemRepository->store(array_merge($product,['purchase_request_id'=>$request->id]));
        }

        return redirect()->route('requests.index')->with('success', 'Request successfully created');
    }

    public function edit() {}

    public function destroy() {}

    public function updateStatus($id, Request $request)
    {
        $request->validate([
            'status' => 'required|in:approved,rejected',
        ]);
        $purchaseRequest = $this->purchaseRequestRepository->find($id);
        $purchaseRequest->status = $request->status;
        $purchaseRequest->save();
        return redirect()->route('requests.index')->with('success', 'Request successfully ' . $request->status);
    }
}
