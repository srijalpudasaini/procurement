<?php

namespace App\Http\Controllers;

use App\Http\Requests\EoiRequest;
use App\Models\Document;
use App\Models\Eoi;
use App\Models\EoiFile;
use App\Models\EoiVendorProposal;
use App\Models\Product;
use App\Models\PurchaseRequestItem;
use App\Repositories\EoiRepository;
use App\Repositories\PurchaseRequestRepository;
use App\Repositories\PurchaseRequestItemRepository;
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

    public function __construct(EoiRepository $eoiRepository, PurchaseRequestRepository $purchaseRequestRepository, PurchaseRequestItemRepository $purchaseRequestItemRepository)
    {
        $this->eoiRepository = $eoiRepository;
        $this->purchaseRequestRepository = $purchaseRequestRepository;
        $this->purchaseRequestItemRepository = $purchaseRequestItemRepository;
    }

    public static function middleware(): array
    {
        return [
            new Middleware('permission:view_eoi', ['index']),
            new Middleware('permission:create_eoi', ['create', 'store', 'publish']),
            new Middleware('permission:view_submissions_eoi', ['submissions']),
            new Middleware('permission:edit_eoi', ['edit', 'update']),
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
            ['user', 'purchase_request_items.product'],
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

    public function store(EoiRequest $request)
    {
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
            foreach ($request->newProducts as $item) {
                $this->purchaseRequestItemRepository->store(array_merge($item, ['selected' => true, 'eoi_id' => $eoi->id]));
            }

            if (isset($request->documents)) {
                foreach ($request->documents as $doc) {
                    $eoi->documents()->attach($doc['id'], ['required' => $doc['compulsory']]);
                }
            }

            foreach ($request->files1 as $file) {
                $eoi_file = new EoiFile();
                $eoi_file->eoi_id = $eoi->id;
                $path = $file['file']->store('files', 'public');
                $eoi_file->file_path = $path;
                $eoi_file->file_name = $file['name'];
                $eoi_file->save();
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
        $eoi = $this->eoiRepository->find($id, ['purchase_request_items.product', 'eoi_documents.document']);

        if ($eoi->status !== 'closed') {
            abort(404);
        }

        $query = $eoi->eoi_vendor_applications()
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
            
            $query->where(function($q) use ($requiredProductIds) {
                foreach ($requiredProductIds as $productId) {
                    $q->whereHas('proposals', function($q) use ($productId) {
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

        if(!empty($filters['deliveryTime'])){
            $deadline = new Carbon($eoi->deadline_date);

            $query->where('delivery_date','<=',$deadline->addDays((int)$filters['deliveryTime']));
            
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
                    ->whereHas('purchase_request_item', function($q) use ($productId) {
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

        return Inertia::render('EOI/SubmissionsEOI', [
            'eoi' => $eoi,
            'submissions' => $submissions
        ]);
    }
    public function edit($id)
    {
        $eoi = $this->eoiRepository->find($id);
        return Inertia::render('EOI/EditEOI', compact('eoi', 'eois'));
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
}
