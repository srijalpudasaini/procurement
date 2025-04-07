<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ApprovalWorkflow extends Model
{
    protected $fillable=['name','min_amount','max_amount'];
    public function steps(){
        return $this->hasMany(ApprovalStep::class);
    }
}
