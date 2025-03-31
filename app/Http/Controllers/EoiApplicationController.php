<?php

namespace App\Http\Controllers;

use App\Http\Requests\VendorApplicationRequest;
use App\Models\Eoi;
use App\Models\EoiVendorApplication;
use App\Models\EoiVendorDocument;
use App\Models\EoiVendorProposal;
use App\Repositories\EoiApplicationRepository;
use Carbon\Carbon;
use Illuminate\Http\Request;

class EoiApplicationController extends Controller
{

    protected $eoiApplicationRepository;

    public function __construct(EoiApplicationRepository $eoiApplicationRepository)
    {
        $this->eoiApplicationRepository = $eoiApplicationRepository;
    }

    public function submitApplication(VendorApplicationRequest $request)
    {
        // if()
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
            $vendor_proposal = new EoiVendorProposal();
            $vendor_proposal->eoi_vendor_application_id = $eoi_application->id;
            $vendor_proposal->purchase_request_item_id = $product['id'];
            $vendor_proposal->price = $product['price'];
            $vendor_proposal->save();
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
        return redirect()->route('vendor.eoi')->with('success', 'Application successfully submitted!');
    }
}
