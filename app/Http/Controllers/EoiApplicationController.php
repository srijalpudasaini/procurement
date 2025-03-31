<?php

namespace App\Http\Controllers;

use App\Http\Requests\VendorApplicationRequest;
use App\Models\Eoi;
use App\Models\EoiVendorApplication;
use App\Models\EoiVendorDocument;
use App\Models\EoiVendorProposal;
use App\Repositories\EoiApplicationRepository;
use App\Repositories\EoiVendorProposalRepository;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class EoiApplicationController extends Controller
{

    protected $eoiApplicationRepository;
    protected $eoiVendorProposalRepository;

    public function __construct(EoiApplicationRepository $eoiApplicationRepository,EoiVendorProposalRepository $eoiVendorProposalRepository)
    {
        $this->eoiApplicationRepository = $eoiApplicationRepository;
        $this->eoiVendorProposalRepository = $eoiVendorProposalRepository;
    }

    public function submitApplication(VendorApplicationRequest $request)
    {
        DB::beginTransaction();
        try {
            $eoi = Eoi::findOrFail(id: $request->eoi_id);
            if ($eoi->status != 'published') {
                return abort(404);
            }
            $application = EoiVendorApplication::where('eoi_id', $request->eoi_id)->where('vendor_id', $request->user()->id)->get();
    
            if (count($application) >= 1) {
                return redirect()->route('vendor.eoi')->with('error', 'You cannot apply an more than once');
            }
            $eoi_application = $this->eoiApplicationRepository->store(array_merge($request->validated(), ['vendor_id' => $request->user()->id, 'application_date' => Carbon::now()]));
    
            foreach ($request->products as $product) {
                $this->eoiVendorProposalRepository->store(array_merge($product,['eoi_vendor_application_id'=>$eoi_application->id]));
            }
    
            foreach ($request->documents as $document) {
                if (!empty($document['file'])) {
                    $vendor_document = new EoiVendorDocument();
                    $vendor_document->eoi_vendor_application_id = $eoi_application->id;
                    $vendor_document->document_id = $document['id'];
                    $path = $document['file']->store('documents', 'public');
                    $vendor_document->name = $path;
                    $vendor_document->save();
                }
            }
            DB::commit();
            return redirect()->route('vendor.eoi')->with('success', 'Application successfully submitted!');
        } catch (\Exception $e) {
            return redirect()->route('vendor.eoi')->with('error', $e->getMessage());
            
        }
    }
}
