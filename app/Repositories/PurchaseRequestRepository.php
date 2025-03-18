<?php

namespace App\Repositories;

use App\Interfaces\PurchaseRequestInterface;
use App\Models\PurchaseRequest;

class PurchaseRequestRepository extends BaseRepository
{
    /**
     * Create a new class instance.
     */
    public function __construct(PurchaseRequest $purchaseRequest)
    {   
        parent::__construct($purchaseRequest);
    }
}
