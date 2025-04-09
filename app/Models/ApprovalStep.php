<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Spatie\Permission\Models\Role;

class ApprovalStep extends Model
{
    protected $fillable = ['role_id','approval_workflow_id','step_number','previous_step_id'];
    public function role(){
        return $this->belongsTo(Role::class);
    }
    public function workflow(){
        return $this->belongsTo(ApprovalWorkflow::class);
    }
    public function previousStep()
    {
        return $this->belongsTo(ApprovalStep::class,'previous_step_id'); // Find previous step by step_number
    }
    public function approvals()
{
    return $this->hasMany(RequestApprovals::class, 'approval_step_id');
}
}
