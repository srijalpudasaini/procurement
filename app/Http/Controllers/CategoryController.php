<?php 
namespace App\Http\Controllers;

use App\Http\Requests\CategoryRequest;
use App\Models\Category;
use App\Repositories\CategoryRepository;
use Illuminate\Http\Request;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;
use Inertia\Inertia;

class CategoryController extends Controller implements HasMiddleware
{
    protected $categoryRepository;

    public function __construct(CategoryRepository $categoryRepository)
    {
        $this->categoryRepository = $categoryRepository;
    }

    public static function middleware(): array
    {
        return [
            new Middleware('permission:view_category', only: ['index']),
            new Middleware('permission:create_category', only: ['create','store']),
            new Middleware('permission:edit_category', only: ['edit','update']),
            new Middleware('permission:delete_category', only: ['destroy']),
        ];
    }
    public function index(Request $request)
    {
        $categories = $this->categoryRepository->all($request->input('per_page',10),'parent');
        return Inertia::render('Categories/Categories', compact('categories'));
    }
    public function create()
    {
        $categories = $this->categoryRepository->all();
        return Inertia::render('Categories/AddCategory', compact('categories'));
    }

    public function store(CategoryRequest $request)
    {
        try {
            $this->categoryRepository->store($request->validated());
            return redirect()->route('categories.index')->with('success', 'Category created successfully!');
        } catch (\Exception $e) {
            return redirect()->route('categories.index')->with('error', $e->getMessage());
        }
    }

    public function edit($id)
    {
        $category = $this->categoryRepository->find($id,'children');
    
        $childrenIds = $category->children->pluck('id')->toArray();
        $childrenIds[] = $category->id; 
    
        $categories = Category::whereNotIn('id', $childrenIds)->get();
        return Inertia::render('Categories/EditCategory', compact('category', 'categories'));
    }
    public function update(CategoryRequest $request, $id)
    {
        try {
            $this->categoryRepository->update($id, $request->validated());
            return redirect()->route('categories.index')->with('success', 'Category updated successfully!');
        } catch (\Exception $e) {
            return redirect()->route('categories.index')->with('error', $e->getMessage());
        }
    }

    public function destroy($id)
    {
        try {
            $this->categoryRepository->delete($id);
            return redirect()->route('categories.index')->with('success', 'Category deleted successfully!');
        } catch (\Exception $e) {
            return redirect()->route('categories.index')->with('error', $e->getMessage());
        }
    }
}
