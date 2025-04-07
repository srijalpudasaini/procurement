<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ApprovalWorkflowRequest extends FormRequest
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
            'name' => 'required|unique:approval_workflows,name,' . $this->id,
            'min_amount' => 'required|decimal:0,2',
            'max_amount' => 'required|decimal:0,2|gt:min_amount',
            'steps' => 'required|array|min:1',
            'steps.*.*' => 'required',
            'steps.*.role_id' => 'exists:roles,id',
            'steps.*.step' => 'integer'
        ];
    }
}
