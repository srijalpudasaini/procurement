<?php

namespace App\Http\Controllers;

use App\Models\Eoi;
use App\Models\EoiVendorApplication;
use App\Repositories\VendorRepository;
use Illuminate\Http\Request;
use Inertia\Inertia;

class VendorController extends Controller
{
    protected $vendorRepository;

    public function __construct(VendorRepository $vendorRepository){
        $this->vendorRepository = $vendorRepository;
    }
    public function index(){
        return Inertia::render('Vendors/Dashboard');
    }
    public function eoi(Request $request)
    {
        $applications = EoiVendorApplication::where('vendor_id',$request->user()->id)->with(['eoi','proposals.purchase_request_item'])->paginate(10);
        $total = 0;
        return Inertia::render('Vendors/EOI/Applications',compact('applications'));
    }

    public function apply(Request $request,$id)
    {
        $application = EoiVendorApplication::where('vendor_id',$request->user()->id)->where('eoi_id',$id)->get();
        $hasApplied = false;
        if($application){
            $hasApplied = true;
        }
        $eoi = Eoi::with('purchase_request_items.product', 'eoi_documents.document', 'files')->findOrFail($id);
        if($eoi->status != 'published'){
            return abort(404);
        }
        return Inertia::render('Vendors/EOI/Apply', compact('eoi','hasApplied'));
    }
}
