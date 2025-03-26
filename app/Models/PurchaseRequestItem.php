<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PurchaseRequestItem extends Model
{
    protected $fillable = [
        'purchase_request_id',
        'product_id',
        'price',
        'quantity',
        'specifications'
    ];
    public function purchase_request(){
        return $this->belongsTo(PurchaseRequest::class);
    }

    public function product(){
        return $this->belongsTo(Product::class);
    }

    public function proposals(){
        return $this->hasMany(EoiVendorProposal::class);
    }
}
