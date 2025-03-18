<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PurchaseRequest extends Model
{
    protected $fillable=[
        'user_id',
        'total',
        'status',
    ];
    public function user(){
        return $this->belongsTo(User::class);
    }

    public function purchase_request_items(){
        return $this->hasMany(PurchaseRequestItem::class);
    }
}
