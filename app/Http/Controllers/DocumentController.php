<?php

namespace App\Http\Controllers;

use App\Http\Requests\DocumentRequest;
use App\Repositories\DocumentRepository;
use Illuminate\Http\Request;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;
use Inertia\Inertia;

class DocumentController extends Controller implements HasMiddleware
{
    protected $documentRepository;

    public function __construct(DocumentRepository $documentRepository)
    {
        $this->documentRepository = $documentRepository;
    }

    public static function middleware(): array
    {
        return [
            new Middleware('permission:view_document', only: ['index']),
            new Middleware('permission:create_document', only: ['create','store']),
            new Middleware('permission:edit_document', only: ['edit','update']),
            new Middleware('permission:delete_document', only: ['destroy']),
        ];
    } 
    public function index(Request $request)
    {
        $documents = $this->documentRepository->all($request->input('per_page',10));
        return Inertia::render('Documents/Documents',compact('documents'));
    }

    public function create()
    {   
        return Inertia::render('Documents/AddDocument');
    }

    public function store(DocumentRequest $request)
    {
        $this->documentRepository->store($request->validated());
        return redirect()->route('documents.index')->with('success','Document added successfully');
    }
    
    public function edit(string $id)
    {
        $document = $this->documentRepository->find($id);
        return Inertia::render('Documents/EditDocument',compact('document')); 
    }
    
    public function update(DocumentRequest $request, string $id)
    {
        $this->documentRepository->update($id,$request->validated());
        return redirect()->route('documents.index')->with('success','Document updated successfully');  
    }
    
    public function destroy(string $id)
    {
        $this->documentRepository->delete($id);
        return redirect()->route('documents.index')->with('success','Document deleted successfully');  
    }
}
