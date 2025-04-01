<?php

namespace App\Http\Controllers;

use App\Http\Requests\EoiRequest;
use App\Models\Document;
use App\Models\Eoi;
use App\Models\EoiFile;
use App\Models\Product;
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

        if(!$purchaseRequests->contains('status','approved')){
            return redirect()->back()->with('error','Could not publish EOI for the given request');
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
                $this->purchaseRequestItemRepository->store(array_merge($item,['selected'=>true,'eoi_id'=>$eoi->id]));
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

    public function submissions($id)
    {
        $eoi = $this->eoiRepository->find($id, ['eoi_vendor_applications.vendor', 'eoi_vendor_applications.documents.document', 'eoi_vendor_applications.proposals.purchase_request_item.product']);
        if($eoi->status!='closed'){
            abort(404);
        }
        return Inertia::render('EOI/SubmissionsEOI', compact( 'eoi'));
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
