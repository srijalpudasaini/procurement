<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules;
class UserRequest extends FormRequest
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
            'name' => 'required|string|max:255',
            'contact'=>'required|numeric|unique:users,contact,'.$this->id,
            'email' => 'required|string|lowercase|email|max:255|unique:users,email,'.$this->id,
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
            'role' =>'required|exists:roles,name'
        ];
    }
}
