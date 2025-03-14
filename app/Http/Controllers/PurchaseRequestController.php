<?php

namespace App\Http\Controllers;

use App\Models\Product;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PurchaseRequestController extends Controller
{
    public function index(){

    }

    public function create(){
        $products = Product::all();
        return Inertia::render('Requests/CreateRequest',compact('products'));
    }
}
