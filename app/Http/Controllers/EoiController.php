<?php

namespace App\Http\Controllers;

use App\Http\Requests\EoiRequest;
use App\Models\Document;
use App\Models\EoiDocument;
use App\Models\EoiFile;
use App\Models\PurchaseRequest;
use App\Repositories\EoiRepository;
use App\Repositories\PurchaseRequestRepository;
use Illuminate\Http\Request;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;
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
        return Inertia::render('EOI/PublishEOI',compact('purchaseRequest','documents'));
    }

    public function store(EoiRequest $request)
    {
        $eoi = $this->eoiRepository->store($request->validated());
        
        if (isset($request->documents)) {
            foreach ($request->documents as $doc) {
                $eoi->documents()->attach($doc['id'], ['required' => $doc['compulsory']]);
            }
        }
    
        // if ($request->hasFile('files')) {
        //     foreach ($request->file('files') as $fileData) {
        //         $path = $fileData['file']->store('uploads/eoi_files', 'public');
        //         $eoi->files()->create([
        //             'file_name' => $fileData['name'],
        //             'file_path' => $path,
        //         ]);
        //     }
        // }
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
