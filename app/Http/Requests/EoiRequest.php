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
            'eoi_number' => 'required|unique:eois,eoi_number,' . $this->id,
            'description' => 'required',
            'published_date' => 'required|date|after_or_equal:today',
            'deadline_date' => 'required|date|after:published_date',
            'purchase_request_id' => 'required|exists:purchase_requests,id',
            'documents' => 'nullable|array',
            'documents.*.id' => 'exists:documents,id',
            'documents.*.compulsory' => 'boolean',
            'files1'=>'nullable|array',
            'files1.*.name' => 'required|string',
            'files1.*.file' => 'required|file|mimes:jpeg,png,pdf,gif|max:4096'
        ];
    }
}
