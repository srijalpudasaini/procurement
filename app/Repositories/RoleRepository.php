<?php

namespace App\Repositories;

use App\Interfaces\RoleInterface;
use Spatie\Permission\Models\Role;

class RoleRepository extends BaseRepository
{
    /**
     * Create a new class instance.
     */
    public function __construct(Role $role){
        parent::__construct($role);
    }
    
}
