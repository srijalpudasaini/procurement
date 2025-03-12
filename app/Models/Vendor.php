<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Spatie\Permission\Traits\HasRoles;

class Vendor extends Model
{
    use HasRoles;

    protected $guard_name = 'web';

    protected $fillable = [
        'name',
        'email',
        'contact',
        'address',
        'registration_number',
        'pan_number',
        'registration_date',
        'password'
    ];
}
