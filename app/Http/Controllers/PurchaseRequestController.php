<?php

namespace App\Http\Controllers;

use App\Http\Requests\PurchaseRequest;
use App\Models\ApprovalWorkflow;
use App\Repositories\PurchaseRequestItemRepository;
use App\Repositories\PurchaseRequestRepository;
use App\Models\Product;
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
            new Middleware('permission:view_request|view_all_request|approve_request', ['index']),
            new Middleware('permission:create_request', ['create', 'store']),
            new Middleware('permission:delete_request', ['destroy']),
        ];
    }
    public function index(Request $request)
    {
        $user = $request->user();
        $isSuperAdmin = !empty($user->is_superadmin);
        $canViewAll = $isSuperAdmin || $user->can('view_all_request');
        $canApprove = $isSuperAdmin || $user->can('approve_request');
        $roleId = $user->roles()->first()?->id;

        $requestedView = $request->input('view'); // 'all', 'pending', or null

        if ($canViewAll && $canApprove) {
            $viewType = ($requestedView === 'pending') ? 'approval' : 'all';
        } elseif ($canViewAll) {
            $viewType = 'all';
        } elseif ($canApprove) {
            $viewType = 'approval';
        } else {
            $viewType = 'standard';
        }

        $pendingApprovalsCount = 0;
        if ($canApprove) {
            $pendingQuery = RequestApprovals::join('approval_steps', 'request_approvals.approval_step_id', '=', 'approval_steps.id')
                ->where('request_approvals.status', 'pending');

            if (!$isSuperAdmin && $roleId) {
                $pendingQuery->where('approval_steps.role_id', $roleId);
            }

            $pendingQuery->where(function ($query) {
                $query->whereNull('approval_steps.previous_step_id')
                    ->orWhereExists(function ($subQuery) {
                        $subQuery->select(DB::raw(1))
                            ->from('request_approvals as prev_approval')
                            ->join('approval_steps as prev_step', 'prev_approval.approval_step_id', '=', 'prev_step.id')
                            ->whereColumn('prev_approval.purchase_request_id', 'request_approvals.purchase_request_id')
                            ->whereRaw('prev_step.id = approval_steps.previous_step_id')
                            ->where('prev_approval.status', 'approved');
                    });
            });

            $pendingApprovalsCount = $pendingQuery->count();
        }

        $perPage = (int) $request->input('per_page', 10);

        if ($viewType === 'approval') {
            $approvalQuery = RequestApprovals::select(
                'request_approvals.*',
                'approval_steps.id as app_id',
                'purchase_requests.id as pr_id'
            )
                ->join('approval_steps', 'request_approvals.approval_step_id', '=', 'approval_steps.id')
                ->join('purchase_requests', 'request_approvals.purchase_request_id', '=', 'purchase_requests.id')
                ->where('request_approvals.status', 'pending');

            if (!$isSuperAdmin && $roleId) {
                $approvalQuery->where('approval_steps.role_id', $roleId);
            }

            $approvalQuery->where(function ($query) {
                $query->whereNull('approval_steps.previous_step_id')
                    ->orWhereExists(function ($subQuery) {
                        $subQuery->select(DB::raw(1))
                            ->from('request_approvals as prev_approval')
                            ->join('approval_steps as prev_step', 'prev_approval.approval_step_id', '=', 'prev_step.id')
                            ->whereColumn('prev_approval.purchase_request_id', 'request_approvals.purchase_request_id')
                            ->whereRaw('prev_step.id = approval_steps.previous_step_id')
                            ->where('prev_approval.status', 'approved');
                    });
            })
                ->with([
                    'purchase_request.purchase_request_items.product',
                    'purchase_request.user',
                    'purchase_request.approvals.approver',
                    'purchase_request.approvals.step.role'
                ])
                ->latest('request_approvals.created_at');

            $data = $approvalQuery->paginate($perPage)->withQueryString();
        } elseif ($viewType === 'all') {
            $data = \App\Models\PurchaseRequest::with([
                'user',
                'purchase_request_items.product',
                'approvals.approver',
                'approvals.step.role'
            ])
                ->latest('id')
                ->paginate($perPage)
                ->withQueryString();
        } else {
            $data = \App\Models\PurchaseRequest::with([
                'user',
                'purchase_request_items.product',
                'approvals.approver',
                'approvals.step.role'
            ])
                ->where('user_id', $user->id)
                ->latest('id')
                ->paginate($perPage)
                ->withQueryString();
        }

        return Inertia::render('Requests/Requests', [
            'requests' => $data,
            'viewType' => $viewType,
            'canViewAll' => $canViewAll,
            'canApprove' => $canApprove,
            'pendingApprovalsCount' => $pendingApprovalsCount,
            'currentRoleId' => $roleId
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

            if (!$approval) {
                throw new \Exception('No approval workflow configured for total amount of ' . number_format($total, 2) . '. Please contact an administrator.');
            }

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
            'remarks' => 'nullable|string'
        ]);

        $user = $request->user();
        $roleId = $user->roles()->first()?->id;

        DB::beginTransaction();

        try {
            // First check if $id is an existing RequestApprovals ID
            $requestApproval = RequestApprovals::with('step')->find($id);

            // If not found or not pending or not matching role, try finding by purchase_request_id
            if (!$requestApproval || $requestApproval->status !== 'pending' || (!$user->is_superadmin && $roleId && $requestApproval->step && $requestApproval->step->role_id != $roleId)) {
                $query = RequestApprovals::with('step')
                    ->where('purchase_request_id', $id)
                    ->where('status', 'pending');

                if (!$user->is_superadmin && $roleId) {
                    $query->whereHas('step', function ($q) use ($roleId) {
                        $q->where('role_id', $roleId);
                    });
                }

                // Ensure previous step is approved if applicable
                $query->whereHas('step', function ($q) {
                    $q->where(function ($sub) {
                        $sub->whereNull('previous_step_id')
                            ->orWhereExists(function ($ex) {
                                $ex->select(DB::raw(1))
                                    ->from('request_approvals as prev_app')
                                    ->join('approval_steps as prev_step', 'prev_app.approval_step_id', '=', 'prev_step.id')
                                    ->whereColumn('prev_app.purchase_request_id', 'request_approvals.purchase_request_id')
                                    ->whereRaw('prev_step.id = approval_steps.previous_step_id')
                                    ->where('prev_app.status', 'approved');
                            });
                    });
                });

                $requestApproval = $query->first();
            }

            if (!$requestApproval) {
                throw new \Exception('No pending approval found for this request and your role.');
            }

            if (!$user->is_superadmin && $roleId && $requestApproval->step && $requestApproval->step->role_id != $roleId) {
                return redirect()->back()->with('error', "You are not authorized to update the request's status");
            }

            // Update the request approval with the new status and remark
            $requestApproval->status = $request->status;
            $requestApproval->remark = $request->remarks ?: ucfirst($request->status);
            $requestApproval->approver_id = $user->id;
            $requestApproval->save();

            // Find the purchase request associated with this approval
            $purchaseRequest = $this->purchaseRequestRepository->find($requestApproval->purchase_request_id);

            // If the request is rejected, update the purchase request status to 'rejected'
            if ($request->status === 'rejected') {
                $purchaseRequest->status = 'rejected';
                $purchaseRequest->save();
                $message = 'Request rejected successfully.';
            } else {
                // Check if all the required approvals are completed
                $remainingApprovals = DB::table('request_approvals')
                    ->where('purchase_request_id', $requestApproval->purchase_request_id)
                    ->where('status', 'pending')
                    ->count();

                // If there are no pending approvals left, set the purchase request to 'approved'
                if ($remainingApprovals === 0) {
                    $purchaseRequest->status = 'approved';
                    $purchaseRequest->save();
                    $message = 'Request fully approved!';
                } else {
                    $message = 'Step approved successfully! Request forwarded to the next approver.';
                }
            }

            // Commit the transaction
            DB::commit();

            return redirect()->back()->with('success', $message);
        } catch (\Exception $e) {
            // If an error occurs, roll back the transaction
            DB::rollBack();
            return redirect()->back()->with('error', $e->getMessage());
        }
    }
}
