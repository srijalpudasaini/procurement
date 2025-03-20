<?php

namespace App\Repositories;

use App\Models\Product;

class ProductRepository extends BaseRepository
{
    /**
     * Create a new class instance.
     */
    public function __construct(Product $product)
    {
        parent::__construct($product);
    }

    

    
}
