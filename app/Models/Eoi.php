<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Eoi extends Model
{
    protected $fillable = [
        'purchase_request_id',
        'title',
        'description',
        'eoi_number',
        'published_date',
        'deadline_date',
        'status',
    ];
    public function purchase_requests(){
        return $this->hasMany(PurchaseRequest::class);
    }

    public function purchase_request_items(){
        return $this->hasMany(PurchaseRequestItem::class,'eoi_id');
    }

    public function eoi_documents(){
        return $this->hasMany(EoiDocument::class);
    }

    public function documents(){
        return $this->belongsToMany(Document::class,'eoi_documents');
    }
    public function files(){
        return $this->hasMany(EoiFile::class);
    }

    public function eoi_vendor_applications(){
        return $this->hasMany(EoiVendorApplication::class);
    }
}
