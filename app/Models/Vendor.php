<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;

class Vendor extends Authenticatable
{

    protected $guard_name = 'web';

    protected $fillable = [
        'name',
        'email',
        'contact',
        'address',
        'registration_number',
        'pan_number',
        'registration_date',
        'password',
        'rating',
        'rating_count'
    ];

    public function applications(){
        return $this->hasMany(EoiVendorApplication::class);
    }
}
