<?php 
namespace App\Http\Controllers;

use App\Http\Requests\CategoryRequest;
use App\Interfaces\CategoryInterface;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;
use Inertia\Inertia;

class CategoryController extends Controller implements HasMiddleware
{
    protected $categoryInterface;

    public function __construct(CategoryInterface $categoryInterface)
    {
        $this->categoryInterface = $categoryInterface;
    }

    public static function middleware(): array
    {
        return [
            'auth',
            new Middleware('permission:view_category', only: ['index']),
            new Middleware('permission:create_category', only: ['create','store']),
            new Middleware('permission:edit_category', only: ['edit','update']),
            new Middleware('permission:delete_category', only: ['destroy']),
        ];
    }
    public function index()
    {
        $categories = $this->categoryInterface->all();
        return Inertia::render('Categories/Categories', compact('categories'));
    }
    public function create()
    {
        $categories = $this->categoryInterface->all();
        return Inertia::render('Categories/AddCategory', compact('categories'));
    }

    public function store(CategoryRequest $request)
    {
        $this->categoryInterface->store($request->validated());
        return redirect()->route('categories.index')->with('success', 'Category created successfully!');
    }

    public function edit($id)
    {
        $category = $this->categoryInterface->find($id);
        $categories = $this->categoryInterface->all();
        return Inertia::render('Categories/EditCategory', compact('category', 'categories'));
    }
    public function update(CategoryRequest $request, $id)
    {
        $this->categoryInterface->update($id, $request->validated());
        return redirect()->route('categories.index')->with('success', 'Category updated successfully!');
    }

    public function destroy($id)
    {
        $this->categoryInterface->delete($id);
        return redirect()->route('categories.index')->with('success', 'Category deleted successfully!');
    }
}
