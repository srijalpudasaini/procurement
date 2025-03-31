<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class EoiRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'title' => 'required',
            'description' => 'required',
            'published_date' => 'required|date|after_or_equal:today',
            'deadline_date' => 'required|date|after:published_date',
            'purchase_request_ids.*' => 'required|exists:purchase_requests,id',
            'documents' => 'nullable|array',
            'documents.*.id' => 'exists:documents,id',
            'documents.*.compulsory' => 'boolean',
            'files1'=>'nullable|array',
            'files1.*.name' => 'required|string',
            'files1.*.file' => 'required|file|mimes:jpeg,png,pdf,gif|max:4096',
            'products'=>'array|min:1',
            'products.*.*'=>'required',
            'products.*.product_id'=>'exists:products,id',
            'products.*.quantity'=>'integer|gt:0',
            'products.*.price'=>'integer|gt:0',
            'newProducts'=>'array|nullable',
            'newProducts.*.*'=>'required',
            'newProducts.*.product_id'=>'exists:products,id',
            'newProducts.*.quantity'=>'integer|gt:0',
            'newProducts.*.price'=>'integer|gt:0',
        ];
    }
}
