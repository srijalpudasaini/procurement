<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class RequestApprovals extends Model
{
    public function purchase_request(){
        return $this->belongsTo(PurchaseRequest::class);
    }

    public function step(){
        return $this->belongsTo(ApprovalStep::class);
    }

    public function approver() {
        return $this->belongsTo(User::class,'approver_id');
    }
}
