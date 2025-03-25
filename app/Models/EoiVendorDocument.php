<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class EoiVendorDocument extends Model
{
    public function eoi(){
        return $this->belongsTo(Eoi::class);
    }

    public function document(){
        return $this->belongsTo(Document::class);
    }
}
