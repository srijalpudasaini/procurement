<?php

namespace App\Http\Controllers;

use App\Http\Requests\PurchaseRequest;
use App\Repositories\PurchaseRequestRepository;
use App\Models\Product;
use App\Models\PurchaseRequestItem;
use Illuminate\Http\Request;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;
use Inertia\Inertia;

class PurchaseRequestController extends Controller implements HasMiddleware
{

    protected $purchaseRequestRepository;

    public function __construct(PurchaseRequestRepository $purchaseRequestRepository)
    {
        $this->purchaseRequestRepository = $purchaseRequestRepository;
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
        $purchaseRequests = $this->purchaseRequestRepository->all($request->input('per_page', 10),['user','purchase_request_items.product']);
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
            $purchaseItem = new PurchaseRequestItem();
            $purchaseItem->purchase_request_id = $request->id;
            $purchaseItem->product_id = $product['product_id'];
            $purchaseItem->price = $product['price'];
            $purchaseItem->quantity = $product['quantity'];
            $purchaseItem->specifications = $product['specifications'];
            $purchaseItem->save();
        }

        return redirect()->route('requests.index')->with('success', 'Request successfully created');
    }

    public function edit() {}

    public function destroy() {}
    
    public function updateStatus($id, Request $request) {
        $request->validate([
            'status'=>'required|in:approved,rejected',
        ]);
        $purchaseRequest = $this->purchaseRequestRepository->find($id);
        $purchaseRequest->status = $request->status;
        $purchaseRequest->save();
        return redirect()->route('requests.index')->with('success', 'Request successfully '.$request->status);
    }
}
