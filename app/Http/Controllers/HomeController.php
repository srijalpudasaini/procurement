<?php

namespace App\Http\Controllers;

use App\Models\Eoi;
use Inertia\Inertia;

class HomeController extends Controller
{
   public function index()
   {
      $eois = Eoi::where('status','published')->paginate(20);
      return Inertia::render('EOI',compact('eois'));
   }

   public function showEoi($id){
      $eoi = Eoi::with('purchase_request.purchase_request_items.product','eoi_documents.document','files')->findOrFail($id);
      
      return Inertia::render('ViewEOI',compact('eoi'));
   }
}
