<?php

namespace App\Http\Controllers;

use App\Http\Requests\EoiRequest;
use App\Models\Document;
use App\Models\Eoi;
use App\Models\EoiFile;
use App\Models\EoiVendorApplication;
use App\Models\EoiVendorProposal;
use App\Models\Product;
use App\Models\PurchaseRequest;
use App\Models\PurchaseRequestItem;
use App\Repositories\EoiRepository;
use App\Repositories\PurchaseRequestRepository;
use App\Repositories\PurchaseRequestItemRepository;
use App\Services\TopsisService;
use App\Services\KnapsackProcurementService;
use App\Services\BinPackingService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class EoiController extends Controller implements HasMiddleware
{
    protected $eoiRepository;
    protected $purchaseRequestRepository;
    protected $purchaseRequestItemRepository;
    protected $topsisService;
    protected $knapsackService;
    protected $binPackingService;

    public function __construct(
        EoiRepository $eoiRepository,
        PurchaseRequestRepository $purchaseRequestRepository,
        PurchaseRequestItemRepository $purchaseRequestItemRepository,
        TopsisService $topsisService,
        KnapsackProcurementService $knapsackService,
        BinPackingService $binPackingService
    ) {
        $this->eoiRepository = $eoiRepository;
        $this->purchaseRequestRepository = $purchaseRequestRepository;
        $this->purchaseRequestItemRepository = $purchaseRequestItemRepository;
        $this->topsisService = $topsisService;
        $this->knapsackService = $knapsackService;
        $this->binPackingService = $binPackingService;
    }

    public static function middleware(): array
    {
        return [
            new Middleware('permission:view_eoi', ['index']),
            new Middleware('permission:create_eoi', ['create', 'store', 'publish', 'autoBundleRequests']),
            new Middleware('permission:view_submissions_eoi', ['submissions']),
            new Middleware('permission:edit_eoi', ['edit', 'update', 'awardItemProposal', 'revokeItemAward', 'awardApplication', 'revokeApplication', 'awardSelection', 'revokeAllAwards', 'knapsackRecommend', 'topsisRecommend']),
            new Middleware('permission:delete_eoi', ['destroy']),
        ];
    }
    public function index(Request $request)
    {
        $eois = $this->eoiRepository->all($request->input('per_page', 10));
        return Inertia::render('EOI/EOI', compact('eois'));
    }
    public function create(Request $request)
    {
        $purchaseRequests = $this->purchaseRequestRepository->all(
            $request->input('per_page', 10),
            ['user', 'purchase_request_items.product', 'approvals.approver', 'approvals.step'],
            ['status' => 'approved']
        );
        return Inertia::render('EOI/AddEOI', compact('purchaseRequests'));
    }

    public function publish(Request $request)
    {
        $documents = Document::all();
        $ids = explode(',', $request->input('requests'));

        $products = Product::all();
        $purchaseRequests = $this->purchaseRequestRepository->find($ids, ['purchase_request_items.product']);

        if (!$purchaseRequests->contains('status', 'approved')) {
            return redirect()->back()->with('error', 'Could not publish EOI for the given request');
        }
        return Inertia::render('EOI/PublishEOI', compact('purchaseRequests', 'documents', 'products'));
    }

    public function store(EoiRequest $request){
        DB::beginTransaction();
        try {
            $latestEOI = Eoi::whereDate('created_at', now())->count() + 1;
            $eoi_number = 'EOI-' . Carbon::now()->format('YmdHis') . '-' . str_pad($latestEOI, 5, '0', STR_PAD_LEFT);
            $eoi = $this->eoiRepository->store(array_merge($request->validated(), ['eoi_number' => $eoi_number]));
            $purchaseRequests = $this->purchaseRequestRepository->find($request->purchase_request_ids);
            foreach ($purchaseRequests as $purchaseRequest) {
                $purchaseRequest->status = 'published';
                $purchaseRequest->eoi_id = $eoi->id;
                $purchaseRequest->save();
                foreach ($purchaseRequest->purchase_request_items as $item) {
                    $matchedProduct = collect($request->products)->firstWhere('id', $item->id);
                    if ($matchedProduct) {
                        $item->selected = true;
                        $item->eoi_id = $eoi->id;
                        $item->save();
                    }
                }
            }
            if (!empty($request->newProducts)) {
                foreach ($request->newProducts as $item) {
                    $this->purchaseRequestItemRepository->store(array_merge($item, ['selected' => true, 'eoi_id' => $eoi->id]));
                }
            }
            if (isset($request->documents)) {
                foreach ($request->documents as $doc) {
                    $eoi->documents()->attach($doc['id'], ['required' => $doc['compulsory']]);
                }
            }
            if (isset($request->files1)) {
                foreach ($request->files1 as $index => $fileData) {
                    $uploadedFile = $request->file("files1.$index.file") ?? ($fileData['file'] ?? null);
                    if ($uploadedFile) {
                        $eoi_file = new EoiFile();
                        $eoi_file->eoi_id = $eoi->id;
                        $path = $uploadedFile->store('files', 'public');
                        $eoi_file->file_path = $path;
                        $eoi_file->file_name = $request->input("files1.$index.name") ?? ($fileData['name'] ?? 'document');
                        $eoi_file->save();
                    }
                }
            }
            DB::commit();
            return redirect()->route('eois.index')->with('success', 'Eoi created successfully!');
        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->route('eois.index')->with('error', $e->getMessage());
        }
    }

    public function submissions(Request $request, $id)
    {
        $eoi = $this->eoiRepository->find($id, [
            'purchase_request_items.product',
            'purchase_request_items.awarded_proposal.eoi_vendor_application.vendor',
            'purchase_request_items.proposals.eoi_vendor_application.vendor',
            'eoi_documents.document'
        ]);

        if ($eoi->status !== 'closed') {
            abort(404);
        }

        $query = $eoi->eoi_vendor_applications()
            ->select('eoi_vendor_applications.*')
            ->with([
                'vendor',
                'documents.document',
                'proposals.purchase_request_item.product'
            ]);

        // Apply filters
        $filters = $request->only([
            'all_products',
            'all_documents',
            'min_price',
            'max_price',
            'rating',
            'product_coverage',
            'most_priority',
            'sort_by',
            'sort',
            'mustHave',
            'deliveryTime'
        ]);

        // Must have products filter
        if (!empty($filters['mustHave']) && is_array($filters['mustHave'])) {
            $requiredProductIds = $filters['mustHave'];

            $query->where(function ($q) use ($requiredProductIds) {
                foreach ($requiredProductIds as $productId) {
                    $q->whereHas('proposals', function ($q) use ($productId) {
                        $q->where('purchase_request_item_id', $productId);
                    });
                }
            });
        }

        // All Products filter
        if (!empty($filters['all_products'])) {
            $requiredProductIds = $eoi->purchase_request_items->pluck('product.id');

            $query->where(function ($q) use ($requiredProductIds) {
                foreach ($requiredProductIds as $productId) {
                    $q->whereHas('proposals.purchase_request_item', function ($q) use ($productId) {
                        $q->where('product_id', $productId);
                    });
                }
            });
        }

        // All Documents filter
        if (!empty($filters['all_documents'])) {
            $requiredDocumentIds = $eoi->eoi_documents->pluck('document_id');
            $query->whereHas('documents', function ($q) use ($requiredDocumentIds) {
                $q->whereIn('document_id', $requiredDocumentIds);
            }, '>=', $requiredDocumentIds->count());
        }

        if (!empty($filters['deliveryTime'])) {
            $deadline = new Carbon($eoi->deadline_date);

            $query->where('delivery_date', '<=', $deadline->addDays((int)$filters['deliveryTime']));
        }

        // Price range filter
        if (!empty($filters['min_price']) || !empty($filters['max_price'])) {
            $subQuery = DB::table('eoi_vendor_proposals')
                ->select('eoi_vendor_application_id')
                ->selectRaw('SUM(eoi_vendor_proposals.price * purchase_request_items.quantity) as total_price')
                ->join('purchase_request_items', 'eoi_vendor_proposals.purchase_request_item_id', '=', 'purchase_request_items.id')
                ->groupBy('eoi_vendor_application_id');

            if (!empty($filters['min_price'])) {
                $subQuery->having('total_price', '>=', (float)$filters['min_price']);
            }
            if (!empty($filters['max_price'])) {
                $subQuery->having('total_price', '<=', (float)$filters['max_price']);
            }

            $query->whereIn('id', $subQuery->pluck('eoi_vendor_application_id'));
        }

        // Rating filter
        if (!empty($filters['rating'])) {
            $query->whereHas('vendor', function ($q) use ($filters) {
                $q->where('rating', '>=', $filters['rating']);
            });
        }

        // Sorting
        if (!empty($filters['sort_by'])) {
            $direction = $filters['sort'] === 'asc' ? 'asc' : 'desc';
            $productId = PurchaseRequestItem::find($filters['sort_by'])->product_id;

            $query->addSelect([
                'has_product' => EoiVendorProposal::selectRaw('COUNT(*) > 0')
                    ->whereColumn('eoi_vendor_proposals.eoi_vendor_application_id', 'eoi_vendor_applications.id')
                    ->whereHas('purchase_request_item', function ($q) use ($productId) {
                        $q->where('product_id', $productId);
                    })
            ]);

            $query->addSelect([
                'product_price' => EoiVendorProposal::select('price')
                    ->whereColumn('eoi_vendor_proposals.eoi_vendor_application_id', 'eoi_vendor_applications.id')
                    ->where('purchase_request_item_id', $filters['sort_by'])
                    ->limit(1)
            ]);

            $query->orderBy('has_product', 'desc') // Vendors with product first
                ->orderBy('product_price', $direction); // Then sort by price
        }

        // Product coverage sorting
        if (!empty($filters['product_coverage'])) {
            $query->withCount('proposals')->orderBy('proposals_count', 'desc');
        }

        // Priority sorting
        if (!empty($filters['most_priority'])) {

            $query->addSelect([
                'priority_score' => EoiVendorProposal::selectRaw('SUM(CASE WHEN purchase_request_items.priority = "high" THEN 6 
                WHEN purchase_request_items.priority = "medium" THEN 3 
                WHEN purchase_request_items.priority = "low" THEN 1 
                ELSE 0 END)')
                    ->join('purchase_request_items', 'eoi_vendor_proposals.purchase_request_item_id', '=', 'purchase_request_items.id')
                    ->whereColumn('eoi_vendor_proposals.eoi_vendor_application_id', 'eoi_vendor_applications.id')
                    ->groupBy('eoi_vendor_proposals.eoi_vendor_application_id')
            ])->orderBy('priority_score', 'desc');
        }

        $submissions = $query->paginate($request->input('per_page', 10));

        // 1. Calculate TOPSIS rankings across all submissions for this EOI
        $allApplications = $eoi->eoi_vendor_applications()
            ->with(['vendor', 'documents.document', 'proposals.purchase_request_item.product'])
            ->get();

        $totalProductsCount = $eoi->purchase_request_items->count();
        $totalRequiredDocsCount = $eoi->eoi_documents->where('required', true)->count();
        $topsisDetails = $this->topsisService->evaluateDetailed($allApplications, $totalProductsCount, $totalRequiredDocsCount);
        $topsisRankings = $topsisDetails['rankings'] ?? [];

        // Attach TOPSIS evaluation to each paginated submission item and allApplications
        $submissions->getCollection()->transform(function ($item) use ($topsisRankings) {
            if (isset($topsisRankings[$item->id])) {
                $item->topsis = $topsisRankings[$item->id];
            }
            return $item;
        });

        $allApplications->transform(function ($item) use ($topsisRankings) {
            if (isset($topsisRankings[$item->id])) {
                $item->topsis = $topsisRankings[$item->id];
            }
            return $item;
        });

        // Compute procurement budget benchmarks on backend for Knapsack
        $minPossibleTotal = 0;
        $estimatedTotal = 0;
        foreach ($eoi->purchase_request_items as $item) {
            $qty = (float)($item->quantity ?? 1);
            $estUnitPrice = (float)($item->price ?? 0);
            $estimatedTotal += ($estUnitPrice * $qty);

            $minItemBid = $item->proposals->where('price', '>', 0)->min('price');
            if ($minItemBid !== null) {
                $minPossibleTotal += ($minItemBid * $qty);
            }
        }

        $budgetBenchmarks = [
            'minCost' => round($minPossibleTotal, 2),
            'estTotal' => round($estimatedTotal > 0 ? $estimatedTotal : $minPossibleTotal, 2),
        ];

        return Inertia::render('EOI/SubmissionsEOI', [
            'eoi' => $eoi,
            'submissions' => $submissions,
            'allApplications' => $allApplications,
            'topsisRankings' => $topsisRankings,
            'budgetBenchmarks' => $budgetBenchmarks,
        ]);
    }
    public function edit($id)
    {
        $eoi = $this->eoiRepository->find($id);
        return Inertia::render('EOI/EditEOI', compact('eoi'));
    }
    public function update(EoiRequest $request, $id)
    {
        try {
            $this->eoiRepository->update($id, $request->validated());
            return redirect()->route('eois.index')->with('success', 'Eoi updated successfully!');
        } catch (\Exception $e) {
            return redirect()->route('eois.index')->with('error', $e->getMessage());
        }
    }

    public function destroy($id)
    {
        try {
            $this->eoiRepository->delete($id);
            return redirect()->route('eois.index')->with('success', 'Eoi deleted successfully!');
        } catch (\Exception $e) {
            return redirect()->route('eois.index')->with('error', $e->getMessage());
        }
    }

    public function awardItemProposal(Request $request, $eoiId, $itemId)
    {
        $request->validate([
            'proposal_id' => 'required|exists:eoi_vendor_proposals,id',
        ]);

        $eoi = Eoi::findOrFail($eoiId);
        if ($eoi->status !== 'closed') {
            return redirect()->back()->with('error', 'Vendors can only be selected after the EOI is closed.');
        }

        $item = PurchaseRequestItem::where('eoi_id', $eoi->id)->findOrFail($itemId);
        $proposal = EoiVendorProposal::where('purchase_request_item_id', $item->id)->findOrFail($request->proposal_id);

        DB::beginTransaction();
        try {
            // 1. Mark this proposal as awarded
            $proposal->status = 'awarded';
            $proposal->save();

            // 2. Reject other proposals for this specific item
            EoiVendorProposal::where('purchase_request_item_id', $item->id)
                ->where('id', '!=', $proposal->id)
                ->update(['status' => 'rejected']);

            // 3. Link awarded proposal to the item
            $item->awarded_vendor_proposal_id = $proposal->id;
            $item->save();

            // 4. Sync application status for the winning vendor
            $winningApplication = $proposal->eoi_vendor_application;
            if ($winningApplication) {
                $winningApplication->syncStatus();
            }

            // 5. Sync application statuses for competing vendors who bid on this item
            $competingApplicationIds = EoiVendorProposal::where('purchase_request_item_id', $item->id)
                ->where('id', '!=', $proposal->id)
                ->pluck('eoi_vendor_application_id')
                ->unique();

            foreach ($competingApplicationIds as $appId) {
                $app = EoiVendorApplication::find($appId);
                if ($app) {
                    $app->syncStatus();
                }
            }

            DB::commit();
            return redirect()->back()->with('success', 'Product award assigned successfully!');
        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->back()->with('error', 'Failed to award product: ' . $e->getMessage());
        }
    }

    public function revokeItemAward(Request $request, $eoiId, $itemId)
    {
        $eoi = Eoi::findOrFail($eoiId);
        if ($eoi->status !== 'closed') {
            return redirect()->back()->with('error', 'Actions can only be performed on closed EOIs.');
        }

        $item = PurchaseRequestItem::where('eoi_id', $eoi->id)->findOrFail($itemId);

        DB::beginTransaction();
        try {
            $prevProposalId = $item->awarded_vendor_proposal_id;
            if ($prevProposalId) {
                $proposal = EoiVendorProposal::find($prevProposalId);
                if ($proposal) {
                    $proposal->status = 'pending';
                    $proposal->save();

                    // Revert competing proposals to pending
                    EoiVendorProposal::where('purchase_request_item_id', $item->id)
                        ->where('id', '!=', $proposal->id)
                        ->update(['status' => 'pending']);

                    $item->awarded_vendor_proposal_id = null;
                    $item->save();

                    $winningApplication = $proposal->eoi_vendor_application;
                    if ($winningApplication) {
                        $winningApplication->syncStatus();
                    }
                }
            }

            DB::commit();
            return redirect()->back()->with('success', 'Product award revoked successfully.');
        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->back()->with('error', 'Failed to revoke product award: ' . $e->getMessage());
        }
    }

    public function awardApplication(Request $request, $eoiId, $applicationId)
    {
        $eoi = Eoi::findOrFail($eoiId);
        if ($eoi->status !== 'closed') {
            return redirect()->back()->with('error', 'Vendors can only be selected after the EOI is closed.');
        }

        $application = EoiVendorApplication::where('eoi_id', $eoi->id)->findOrFail($applicationId);

        DB::beginTransaction();
        try {
            foreach ($application->proposals as $proposal) {
                $item = $proposal->purchase_request_item;
                if ($item) {
                    $proposal->status = 'awarded';
                    $proposal->save();

                    EoiVendorProposal::where('purchase_request_item_id', $item->id)
                        ->where('id', '!=', $proposal->id)
                        ->update(['status' => 'rejected']);

                    $item->awarded_vendor_proposal_id = $proposal->id;
                    $item->save();
                }
            }

            $application->syncStatus();

            $otherApplications = EoiVendorApplication::where('eoi_id', $eoi->id)
                ->where('id', '!=', $application->id)
                ->get();

            foreach ($otherApplications as $otherApp) {
                $otherApp->syncStatus();
            }

            DB::commit();
            return redirect()->back()->with('success', "All items offered by {$application->vendor->name} awarded successfully!");
        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->back()->with('error', 'Failed to award vendor application: ' . $e->getMessage());
        }
    }

    public function revokeApplication(Request $request, $eoiId, $applicationId)
    {
        $eoi = Eoi::findOrFail($eoiId);
        if ($eoi->status !== 'closed') {
            return redirect()->back()->with('error', 'Actions can only be performed on closed EOIs.');
        }

        $application = EoiVendorApplication::where('eoi_id', $eoi->id)->findOrFail($applicationId);

        DB::beginTransaction();
        try {
            foreach ($application->proposals as $proposal) {
                if ($proposal->status === 'awarded') {
                    $proposal->status = 'pending';
                    $proposal->save();

                    $item = $proposal->purchase_request_item;
                    if ($item && $item->awarded_vendor_proposal_id == $proposal->id) {
                        $item->awarded_vendor_proposal_id = null;
                        $item->save();

                        EoiVendorProposal::where('purchase_request_item_id', $item->id)
                            ->update(['status' => 'pending']);
                    }
                }
            }

            $application->syncStatus();

            $otherApplications = EoiVendorApplication::where('eoi_id', $eoi->id)
                ->where('id', '!=', $application->id)
                ->get();

            foreach ($otherApplications as $otherApp) {
                $otherApp->syncStatus();
            }

            DB::commit();
            return redirect()->back()->with('success', "Award for {$application->vendor->name} revoked.");
        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->back()->with('error', 'Failed to revoke award: ' . $e->getMessage());
        }
    }

    public function awardSelection(Request $request, $eoiId)
    {
        $request->validate([
            'selections' => 'required|array',
        ]);

        $eoi = Eoi::findOrFail($eoiId);
        if ($eoi->status !== 'closed') {
            return redirect()->back()->with('error', 'Awards can only be assigned after the EOI is closed.');
        }

        DB::beginTransaction();
        try {
            $selections = $request->input('selections', []);
            $items = PurchaseRequestItem::where('eoi_id', $eoi->id)->get();

            foreach ($items as $item) {
                $chosenProposalId = $selections[$item->id] ?? null;

                if ($chosenProposalId) {
                    $proposal = EoiVendorProposal::where('purchase_request_item_id', $item->id)->find($chosenProposalId);
                    if ($proposal) {
                        $proposal->status = 'awarded';
                        $proposal->save();

                        EoiVendorProposal::where('purchase_request_item_id', $item->id)
                            ->where('id', '!=', $proposal->id)
                            ->update(['status' => 'rejected']);

                        $item->awarded_vendor_proposal_id = $proposal->id;
                        $item->save();
                        continue;
                    }
                }

                // If not chosen or cleared for this item
                if ($item->awarded_vendor_proposal_id) {
                    EoiVendorProposal::where('purchase_request_item_id', $item->id)
                        ->update(['status' => 'pending']);
                    $item->awarded_vendor_proposal_id = null;
                    $item->save();
                }
            }

            // Sync all applications for this EOI
            $applications = EoiVendorApplication::where('eoi_id', $eoi->id)->get();
            foreach ($applications as $app) {
                $app->syncStatus();
            }

            DB::commit();
            return redirect()->back()->with('success', 'Awards saved successfully!');
        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->back()->with('error', 'Failed to save awards: ' . $e->getMessage());
        }
    }

    public function revokeAllAwards(Request $request, $eoiId)
    {
        $eoi = Eoi::findOrFail($eoiId);
        if ($eoi->status !== 'closed') {
            return redirect()->back()->with('error', 'Actions can only be performed on closed EOIs.');
        }

        DB::beginTransaction();
        try {
            $items = PurchaseRequestItem::where('eoi_id', $eoi->id)->get();
            foreach ($items as $item) {
                $item->awarded_vendor_proposal_id = null;
                $item->save();
                EoiVendorProposal::where('purchase_request_item_id', $item->id)->update(['status' => 'pending']);
            }

            $applications = EoiVendorApplication::where('eoi_id', $eoi->id)->get();
            foreach ($applications as $app) {
                $app->syncStatus();
            }

            DB::commit();
            return redirect()->back()->with('success', 'All awards revoked successfully.');
        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->back()->with('error', 'Failed to revoke awards: ' . $e->getMessage());
        }
    }

    public function knapsackRecommend(Request $request, $eoiId)
    {
        $request->validate([
            'budget' => 'required|numeric|min:0',
            'strategy' => 'nullable|string|in:standard,cost_priority,value_priority',
        ]);

        $eoi = Eoi::with([
            'purchase_request_items.product',
            'purchase_request_items.proposals.eoi_vendor_application.vendor',
        ])->findOrFail($eoiId);

        $budget = (float) $request->input('budget');
        $strategy = $request->input('strategy', 'standard');

        $result = $this->knapsackService->solve($eoi->purchase_request_items, $budget, $strategy);

        return response()->json($result);
    }

    public function topsisRecommend(Request $request, $eoiId)
    {
        $request->validate([
            'strategy' => 'nullable|string|in:balanced,cost,speed,quality',
        ]);

        $eoi = Eoi::with([
            'purchase_request_items.product',
            'eoi_vendor_applications.vendor',
            'eoi_vendor_applications.documents.document',
            'eoi_vendor_applications.proposals.purchase_request_item.product',
        ])->findOrFail($eoiId);

        $strategy = $request->input('strategy', 'balanced');
        $result = $this->topsisService->recommend(
            $eoi->eoi_vendor_applications,
            $eoi->purchase_request_items,
            $strategy
        );

        return response()->json($result);
    }

    public function autoBundleRequests(Request $request)
    {
        $request->validate([
            'capacity' => 'required|numeric|min:1',
            'request_ids' => 'nullable|array',
            'request_ids.*' => 'integer|exists:purchase_requests,id',
        ]);

        $capacity = (float) $request->input('capacity');
        $requestIds = $request->input('request_ids');

        $query = PurchaseRequest::with(['user', 'purchase_request_items.product'])
            ->where('status', 'approved');

        if (!empty($requestIds)) {
            $query->whereIn('id', $requestIds);
        }

        $requests = $query->get();

        $result = $this->binPackingService->packRequests($requests, $capacity);

        return response()->json($result);
    }
}

