<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class RequestApprovals extends Model
{
    protected $fillable = [
        'approvable_type',
        'approvable_id',
        'approver_id',
        'approval_step_id',
        'status',
        'remark',
    ];
    public function approvable()
    {
        return $this->morphTo();
    }

    public function step(){
        return $this->belongsTo(ApprovalStep::class,'approval_step_id');
    }

    public function approver() {
        return $this->belongsTo(User::class,'approver_id');
    }
}
