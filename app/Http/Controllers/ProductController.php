<?php
namespace App\Http\Controllers;

use App\Http\Requests\ProductRequest;
use App\Interfaces\ProductInterface;
use App\Models\Category;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ProductController extends Controller implements HasMiddleware
{
    protected $productInterface;

    public function __construct(ProductInterface $productInterface)
    {
        $this->productInterface = $productInterface;
    }

    public static function middleware(): array
    {
        return [
            'auth',
            new Middleware('permission:view_product', only: ['index']),
            new Middleware('permission:create_product', only: ['create','store']),
            new Middleware('permission:edit_product', only: ['edit','update']),
            new Middleware('permission:delete_product', only: ['destroy']),
        ];
    }

    public function index(Request $request)
    {
        $products = $this->productInterface->all($request->input('per_page',10));
        return Inertia::render('Products/Products', compact('products'));
    }

    public function create()
    {
        $categories = Category::all();
        return Inertia::render('Products/AddProduct', compact('categories'));
    }

    public function store(ProductRequest $request)
    {
        $this->productInterface->store($request->validated());
        return redirect()->route('products.index')->with('success', 'Product added successfully!');
    }

    public function edit($id)
    {
        $product = $this->productInterface->find($id);
        $categories = Category::all();
        return Inertia::render('Products/EditProduct', compact('product', 'categories'));
    }

    public function update(ProductRequest $request, $id)
    {
        $this->productInterface->update($id, $request->validated());
        return redirect()->route('products.index')->with('success', 'Product updated successfully!');
    }

    public function destroy($id)
    {
        $this->productInterface->delete($id);
        return redirect()->route('products.index')->with('success', 'Product deleted successfully!');
    }
}
