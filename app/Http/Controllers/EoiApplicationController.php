<?php

namespace App\Http\Controllers;

use App\Http\Requests\VendorApplicationRequest;
use App\Models\EoiVendorApplication;
use App\Models\EoiVendorDocument;
use App\Models\EoiVendorProposal;
use App\Repositories\EoiApplicationRepository;
use Carbon\Carbon;
use Illuminate\Http\Request;

class EoiApplicationController extends Controller
{

    protected $eoiApplicationRepository;

    public function __construct(EoiApplicationRepository $eoiApplicationRepository){
        $this->eoiApplicationRepository = $eoiApplicationRepository;
    }

    public function submitApplication(VendorApplicationRequest $request)
    {
        $eoi_application = $this->eoiApplicationRepository->store(array_merge($request->validated(),['user'=>$request->user()->id,'application_date'=>Carbon::now()])); 

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

        return redirect()->route('vendor.eoi');
    }
}
