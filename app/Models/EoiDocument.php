<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class EoiDocument extends Model
{
    protected $fillable = ['eoi_id','document_id'];

    public function document(){
        return $this->belongsTo(Document::class);
    }
    
    public function eoi(){
        return $this->belongsTo(Eoi::class);
    }
}
