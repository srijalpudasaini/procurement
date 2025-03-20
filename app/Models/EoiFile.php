<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class EoiFile extends Model
{
    protected $fillable = ['eoi_id','file_name','file_path'];

    public function Eoi(){
        return $this->belongsTo(Eoi::class);
    }
}
