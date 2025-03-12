<?php

namespace App\Repositories;

use App\Inerfaces\ProductInterface;
use App\Models\Product;

class ProductRepository implements ProductInterface
{
    /**
     * Create a new class instance.
     */
    public function __construct()
    {
        //
    }

    public function all(){
        return Product::with('category')->get();
    }

    public function find($id)
    {
        return Product::findOrFail($id);
    }

    public function store(array $data)
    {
        return Product::create($data);
    }

    public function update($id, array $data)
    {
        $category = Product::findOrFail($id);
        $category->update($data);
        return $category;
    }

    public function delete($id)
    {
        $category = Product::findOrFail($id);
        return $category->delete();
    }
}
