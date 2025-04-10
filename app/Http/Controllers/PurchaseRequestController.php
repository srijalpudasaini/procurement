<?php

namespace App\Http\Controllers;

use App\Http\Requests\PurchaseRequest;
use App\Models\ApprovalStep;
use App\Models\ApprovalWorkflow;
use App\Repositories\PurchaseRequestItemRepository;
use App\Repositories\PurchaseRequestRepository;
use App\Models\Product;
use App\Models\PurchaseRequest as ModelsPurchaseRequest;
use App\Models\PurchaseRequestItem;
use App\Models\RequestApprovals;
use Illuminate\Http\Request;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class PurchaseRequestController extends Controller implements HasMiddleware
{

    protected $purchaseRequestRepository, $purchaseRequestItemRepository;

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

        if ($user->is_superadmin) {
            $data = $this->purchaseRequestRepository->all(
                $request->input('per_page', 10),
                ['user', 'purchase_request_items.product', 'approvals.approver']
            );
        } else {
            $roleId = $user->roles()->first()->id;

            if ($user->can('approve_request')) {
                $data = RequestApprovals::select(
                    'request_approvals.*',
                    'approval_steps.id as app_id',
                    'purchase_requests.id as pr_id'
                )
                    ->join('approval_steps', 'request_approvals.approval_step_id', '=', 'approval_steps.id')
                    ->join('purchase_requests', 'request_approvals.purchase_request_id', '=', 'purchase_requests.id')
                    ->where('request_approvals.status', 'pending')
                    ->where('approval_steps.role_id', $roleId)
                    ->where(function ($query) {
                        $query->whereNull('approval_steps.previous_step_id')
                            ->orWhereExists(function ($query) {
                                $query->select(DB::raw(1))
                                    ->from('request_approvals as prev_approval')
                                    ->join('approval_steps as prev_step', 'prev_approval.approval_step_id', '=', 'prev_step.id')
                                    ->whereColumn('prev_approval.purchase_request_id', 'request_approvals.purchase_request_id')
                                    ->whereRaw('prev_step.id = approval_steps.previous_step_id')
                                    ->where('prev_approval.status', 'approved');
                            });
                    })
                    ->with([
                        'purchase_request.purchase_request_items.product',
                        'purchase_request.user'
                    ])
                    ->paginate(request('per_page', 10));
            } else {
                $data = $this->purchaseRequestRepository->all(
                    $request->input('per_page', 10),
                    ['user', 'purchase_request_items.product'],
                    ['user_id' => $user->id]
                );
            }
        }

        return Inertia::render('Requests/Requests', [
            'requests' => $data,
            'viewType' => $user->can('approve_request') && !$user->is_superadmin ? 'approval' : 'standard'
        ]);
    }

    public function create()
    {
        $products = Product::all();
        return Inertia::render('Requests/AddRequest', compact('products'));
    }

    public function store(PurchaseRequest $purchaseRequest)
    {
        DB::beginTransaction();
        try {
            $userId = $purchaseRequest->user()->id;
            $total = 0;
            foreach ($purchaseRequest->products as $product) {
                $total += $product['price'] * $product['quantity'];
            }

            $approval = ApprovalWorkflow::where('min_amount', '<=', $total)
                ->where('max_amount', '>=', $total)
                ->with('steps')
                ->first();

            // dd($approval);
            $request = $this->purchaseRequestRepository->store(['user_id' => $userId, 'total' => $total]);

            foreach ($purchaseRequest->products as $product) {
                $this->purchaseRequestItemRepository->store(array_merge($product, ['purchase_request_id' => $request->id]));
            }

            foreach ($approval->steps as $step) {
                $approvalRequest = new RequestApprovals();
                $approvalRequest->purchase_request_id = $request->id;
                $approvalRequest->approval_step_id = $step->id;
                $approvalRequest->save();
            }
            DB::commit();
            return redirect()->route('requests.index')->with('success', 'Request successfully created');
        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->route('requests.index')->with('error', $e->getMessage());
        }
    }

    public function edit() {}

    public function destroy() {}

    public function updateStatus($id, Request $request)
    {
        // Validate the request inputs
        $request->validate([
            'status' => 'required|in:approved,rejected',
            'remarks' => 'required'
        ]);

        // Get the role ID of the current user
        // $roleId = $request->user()->roles()->first()->id;

        DB::beginTransaction();

        try {
            // Retrieve the first unapproved request approval for the given purchase request and role
            $requestApproval = RequestApprovals::find($id);

            if (!$requestApproval) {
                throw new \Exception('No pending approval found for this request and role.');
            }

            // Update the request approval with the new status and remark
            $requestApproval->status = $request->status;
            $requestApproval->remark = $request->remarks;
            $requestApproval->approver_id = $request->user()->id;
            $requestApproval->save();

            // Find the purchase request associated with this approval
            $purchaseRequest = $this->purchaseRequestRepository->find($requestApproval->purchase_request_id);

            // If the request is rejected, update the purchase request status to 'rejected'
            if ($request->status === 'rejected') {
                $purchaseRequest->status = 'rejected';
                $purchaseRequest->save();
            } else {
                // Check if all the required approvals are completed
                $remainingApprovals = DB::table('request_approvals')
                    ->where('purchase_request_id', $requestApproval->purchase_request_id)
                    ->where('status', 'pending') // Check for any pending approvals
                    ->count();

                // If there are no pending approvals left, set the purchase request to 'approved'
                if ($remainingApprovals === 0) {
                    $purchaseRequest->status = 'approved';
                    $purchaseRequest->save();
                }
            }

            // Commit the transaction
            DB::commit();

            return redirect()->route('requests.index')->with('success', 'Request successfully ' . $request->status);
        } catch (\Exception $e) {
            // If an error occurs, roll back the transaction
            DB::rollBack();
            return redirect()->route('requests.index')->with('error', $e->getMessage());
        }
    }
}
