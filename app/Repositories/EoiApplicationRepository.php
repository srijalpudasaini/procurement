<?php

namespace App\Repositories;

use App\Models\EoiVendorApplication;

class EoiApplicationRepository extends BaseRepository
{
    /**
     * Create a new class instance.
     */
    public function __construct(EoiVendorApplication $eoiApplication)
    {
        parent::__construct($eoiApplication);
    }
    
}
