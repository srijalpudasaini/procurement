<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class VendorApplicationRequest extends FormRequest
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
            'eoi_id' => 'required|exists:eois,id',
            'products' => 'array|min:1',
            'products.*.id' => 'required',
            'products.*.price' => 'required|numeric|min:1',
            'documents' => 'array|nullable',
            'documents.*.id' => 'required|exists:documents,id',
            'documents.*.file' => 'nullable|file|mimes:jpeg,png,pdf,gif|max:2048'
        ];
    }

    public function messages(){
        return [
            'products.min'=>'At least 1 product must be checked'
        ];
    }


    public function withValidator($validator)
    {
        $validator->after(function ($validator) {
            $products = request()->input('products', []);

            $invalidProducts = collect($products)->contains(fn($product) => empty($product['price']) || $product['price'] < 1);

            $missingDocuments = collect(request()->input('documents', []))
                ->contains(fn($doc, $index) => !empty($doc['required']) && empty($this->file("documents.$index.file")));

            if ($invalidProducts) {
                $validator->errors()->add('generalProducts', 'Selected products must have a price');
            }
            if ($missingDocuments) {
                $validator->errors()->add('generalDocuments', 'All required documents must be uploaded');
            }
        });
    }
}
