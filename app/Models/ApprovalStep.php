<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Spatie\Permission\Models\Role;

class ApprovalStep extends Model
{
    protected $fillable = ['role_id','approval_workflow_id','step_number'];
    public function role(){
        return $this->belongsTo(Role::class);
    }
    public function workflow(){
        return $this->belongsTo(ApprovalWorkflow::class);
    }
}
