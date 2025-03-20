<?php

namespace App\Repositories;

use App\Models\Eoi;

class EoiRepository extends BaseRepository
{
    /**
     * Create a new class instance.
     */
    public function __construct(Eoi $eoi)
    {
        parent::__construct($eoi);
    }
}
