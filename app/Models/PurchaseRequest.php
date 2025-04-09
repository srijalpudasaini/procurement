<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PurchaseRequest extends Model
{
    protected $fillable = [
        'user_id',
        'total',
        'status',
    ];
    public function user()
    {
        return $this->belongsTo(User::class);
    }
    public function eoi()
    {
        return $this->belongsTo(Eoi::class);
    }

    public function purchase_request_items()
    {
        return $this->hasMany(PurchaseRequestItem::class);
    }

    public function approvals()
    {
        return $this->hasMany(RequestApprovals::class);
    }

    public function steps()
    {
        return $this->hasManyThrough(
            ApprovalStep::class,
            RequestApprovals::class,
            'purchase_request_id', // Foreign key on RequestApprovals table
            'id', // Foreign key on ApprovalStep table
            'id', // Local key on PurchaseRequest table
            'approval_step_id' // Local key on RequestApprovals table
        );
    }
}
