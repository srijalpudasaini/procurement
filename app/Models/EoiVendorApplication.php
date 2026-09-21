<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class EoiVendorApplication extends Model
{
    protected $fillable = ['vendor_id','eoi_id','status','application_date','delivery_date'];
    public function eoi(){
        return $this->belongsTo(Eoi::class);
    }

    public function vendor(){
        return $this->belongsTo(Vendor::class);
    }

    public function proposals(){
        return $this->hasMany(EoiVendorProposal::class);
    }

    public function documents(){
        return $this->hasMany(EoiVendorDocument::class);
    }

    public function syncStatus()
    {
        $hasAwarded = $this->proposals()->where('status', 'awarded')->exists();
        if ($hasAwarded) {
            $this->status = 'approved';
        } else {
            $hasPending = $this->proposals()->where('status', 'pending')->exists();
            $this->status = $hasPending ? 'pending' : 'rejected';
        }
        $this->save();
        return $this->status;
    }
}
