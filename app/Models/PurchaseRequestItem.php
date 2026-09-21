<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PurchaseRequestItem extends Model
{
    protected $fillable = [
        'purchase_request_id',
        'product_id',
        'eoi_id',
        'selected',
        'price',
        'quantity',
        'specifications',
        'priority',
        'awarded_vendor_proposal_id',
    ];
    public function purchase_request(){
        return $this->belongsTo(PurchaseRequest::class);
    }
    public function eoi()
    {
        return $this->belongsTo(Eoi::class);
    }

    public function product(){
        return $this->belongsTo(Product::class);
    }

    public function proposals(){
        return $this->hasMany(EoiVendorProposal::class);
    }

    public function awarded_proposal(){
        return $this->belongsTo(EoiVendorProposal::class, 'awarded_vendor_proposal_id');
    }
}
