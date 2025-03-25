<?php

namespace App\Http\Controllers;

use App\Http\Requests\EoiRequest;
use App\Models\Document;
use App\Models\EoiDocument;
use App\Models\EoiFile;
use App\Models\PurchaseRequest;
use App\Repositories\EoiRepository;
use App\Repositories\PurchaseRequestRepository;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

use function PHPUnit\Framework\isEmpty;

class EoiController extends Controller implements HasMiddleware
{
    protected $eoiRepository;
    protected $purchaseRequestRepository;

    public function __construct(EoiRepository $eoiRepository,PurchaseRequestRepository $purchaseRequestRepository)
    {
        $this->eoiRepository = $eoiRepository;
        $this->purchaseRequestRepository = $purchaseRequestRepository;
    }

    public static function middleware(): array
    {
        return [
            new Middleware('permission:view_eoi', only: ['index']),
            new Middleware('permission:create_eoi', only: ['create','store']),
            new Middleware('permission:edit_eoi', only: ['edit','update']),
            new Middleware('permission:delete_eoi', only: ['destroy']),
        ];
    }
    public function index(Request $request)
    {
        $eois = $this->eoiRepository->all($request->input('per_page',10));
        return Inertia::render('EOI/EOI', compact('eois'));
    }
    public function create(Request $request)
    {
        $purchaseRequests = $this->purchaseRequestRepository->all(
            $request->input('per_page', 10),
            ['user', 'purchase_request_items.product'],
            ['status'=>'approved']
        );
        return Inertia::render('EOI/AddEOI', compact('purchaseRequests'));
    }

    public function publish($id){
        $documents = Document::all(); 
        $purchaseRequest = $this->purchaseRequestRepository->find($id,['purchase_request_items.product']);
        if($purchaseRequest->status != 'approved'){
            return redirect()->back()->with('error','Could not publish EOI for the given request');
        }
        return Inertia::render('EOI/PublishEOI',compact('purchaseRequest','documents'));
    }
    
    public function store(EoiRequest $request)
    {
        // dd($request);
        DB::beginTransaction();
        try{
            $purchaseRequest = $this->purchaseRequestRepository->find($request->purchase_request_id);
            if($purchaseRequest->status !=   'approved'){
                return redirect()->back()->with('error','Could not publish EOI for the given request');
            }
            $purchaseRequest->status='published';
            $purchaseRequest->save();
            $eoi = $this->eoiRepository->store($request->validated());
            
            if (isset($request->documents)) {
                foreach ($request->documents as $doc) {
                    $eoi->documents()->attach($doc['id'], ['required' => $doc['compulsory']]);
                }
            }
    
            foreach($request->files1 as $file){
                $eoi_file = new EoiFile();
                $eoi_file->eoi_id = $eoi->id;
                $path = $file['file']->store('files', 'public');
                $eoi_file->file_path=$path;
                $eoi_file->file_name = $file['name'];
                $eoi_file->save();
            }
            DB::commit();
        }
        catch(Exception $e){
            DB::rollBack();
            return redirect()->route('eois.index')->with('error', $e->getMessage());
        }
    

        return redirect()->route('eois.index')->with('success', 'Eoi created successfully!');
    }

    public function edit($id)
    {
        $eoi = $this->eoiRepository->find($id);
        return Inertia::render('EOI/EditEOI', compact('eoi', 'eois'));
    }
    public function update(EoiRequest $request, $id)
    {
        $this->eoiRepository->update($id, $request->validated());
        return redirect()->route('eois.index')->with('success', 'Eoi updated successfully!');
    }

    public function destroy($id)
    {
        $this->eoiRepository->delete($id);
        return redirect()->route('eois.index')->with('success', 'Eoi deleted successfully!');
    }
}
