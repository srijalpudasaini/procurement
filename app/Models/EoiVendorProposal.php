<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class EoiVendorProposal extends Model
{
    public function application(){
        return $this->belongsTo(EoiVendorApplication::class);
    }
    public function purchase_request_item(){
        return $this->belongsTo(PurchaseRequestItem::class);
    }
}
