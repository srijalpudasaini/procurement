<?php
namespace App\Http\Controllers;

use App\Http\Requests\ProductRequest;
use App\Models\Category;
use App\Repositories\ProductRepository;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ProductController extends Controller implements HasMiddleware
{
    protected $productRepository;

    public function __construct(ProductRepository $productRepository)
    {
        $this->productRepository = $productRepository;
    }

    public static function middleware(): array
    {
        return [
            new Middleware('permission:view_product', only: ['index']),
            new Middleware('permission:create_product', only: ['create','store']),
            new Middleware('permission:edit_product', only: ['edit','update']),
            new Middleware('permission:delete_product', only: ['destroy']),
        ];
    }

    public function index(Request $request)
    {
        $products = $this->productRepository->all($request->input('per_page',10),['category']);
        return Inertia::render('Products/Products', compact('products'));
    }

    public function create()
    {
        $categories = Category::all();
        return Inertia::render('Products/AddProduct', compact('categories'));
    }

    public function store(ProductRequest $request)
    {
        $this->productRepository->store($request->validated());
        return redirect()->route('products.index')->with('success', 'Product added successfully!');
    }

    public function edit($id)
    {
        $product = $this->productRepository->find($id);
        $categories = Category::all();
        return Inertia::render('Products/EditProduct', compact('product', 'categories'));
    }

    public function update(ProductRequest $request, $id)
    {
        $this->productRepository->update($id, $request->validated());
        return redirect()->route('products.index')->with('success', 'Product updated successfully!');
    }

    public function destroy($id)
    {
        $this->productRepository->delete($id);
        return redirect()->route('products.index')->with('success', 'Product deleted successfully!');
    }
}
