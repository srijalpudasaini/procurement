<?php

namespace App\Http\Controllers;

use App\Models\Eoi;
use Illuminate\Http\Request;
use Inertia\Inertia;

class VendorController extends Controller
{
    public function index(){
        return Inertia::render('Vendors/Dashboard');
    }
    public function eoi()
    {
        return Inertia::render('Vendors/EOI/Applications');
    }

    public function apply($id)
    {
        $eoi = Eoi::with('purchase_request.purchase_request_items.product', 'eoi_documents.document', 'files')->findOrFail($id);
        if($eoi->status != 'published'){
            return abort(404);
        }
        return Inertia::render('Vendors/EOI/Apply', compact('eoi'));
    }
}
