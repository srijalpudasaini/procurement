<?php

namespace App\Repositories;

use App\Models\PurchaseRequestItem;

class PurchaseRequestItemRepository extends BaseRepository
{
    /**
     * Create a new class instance.
     */
    public function __construct(PurchaseRequestItem $purchaseRequestItem)
    {   
        parent::__construct($purchaseRequestItem);
    }
}
