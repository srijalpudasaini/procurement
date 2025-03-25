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
    public function purchase_request(){
        return $this->belongsTo(PurchaseRequest::class);
    }

    public function purchase_request_items(){
        return $this->hasManyThrough(PurchaseRequestItem::class,PurchaseRequest::class);
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

    public function applications(){
        return $this->hasMany(EoiVendorApplication::class);
    }
}
