<?php 
namespace App\Repositories;

use App\Interfaces\CategoryInterface;
use App\Models\Category;

class CategoryRepository implements CategoryInterface
{
    public function all()
    {
        return Category::with('parent')->get();
    }

    public function find($id)
    {
        return Category::findOrFail($id);
    }

    public function store(array $data)
    {
        return Category::create($data);
    }

    public function update($id, array $data)
    {
        $category = $this->find($id);
        $category->update($data);
        return $category;
    }

    public function delete($id)
    {
        $category = $this->find($id);
        $category->delete();
    }
}
