<?php

namespace App\Repositories;

use App\Models\EoiVendorProposal;

class EoiVendorProposalRepository extends BaseRepository
{
    /**
     * Create a new class instance.
     */
    public function __construct(EoiVendorProposal $eoiProposal)
    {
        parent::__construct($eoiProposal);
    }
    
}
