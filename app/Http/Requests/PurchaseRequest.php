<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class PurchaseRequest extends FormRequest
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
        // dd($this->content);
        return [
            'products'=>'array|min:1',
            'products.*.*'=>'required',
            'products.*.product_id'=>'exists:products,id',
            'products.*.quantity'=>'integer|gt:0',
            'products.*.price'=>'integer|gt:0',
        ];
    }

    public function messages(){
        return [
            'products.*.required'=>'The field :attribute is required'
        ];
    }
    public function attributes()
{
    return [
        'products.*.product_id' => 'product',
        'products.*.quantity' => 'quantity',
        'products.*.price' => 'price',
        'products.*.specifications' => 'specifications',
    ];
}

}

