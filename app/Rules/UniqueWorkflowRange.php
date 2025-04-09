<?php

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

use App\Models\ApprovalWorkflow;

class UniqueWorkflowRange implements ValidationRule
{
    public function __construct(
        protected ?int $excludeId = null
    ) {}

    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        $min = (int) $value;
        $max = (int) request()->input('max_amount');

        // First validate that max > min
        if ($min >= $max) {
            $fail('The min amount must be less than max amount.');
            return;
        }

        $overlappingExists = ApprovalWorkflow::where(function ($query) use ($min, $max) {
            $query->where(function ($q) use ($min, $max) {
                // Case 1: New range starts within existing range
                $q->whereBetween('min_amount', [$min, $max])
                    ->orWhereBetween('max_amount', [$min, $max]);
            })
                ->orWhere(function ($q) use ($min, $max) {
                    // Case 2: New range encompasses existing range
                    $q->where('min_amount', '<=', $min)
                        ->where('max_amount', '>=', $max);
                });
        })
            ->when($this->excludeId, fn($q) => $q->where('id', '!=', $this->excludeId))
            ->exists();

        if ($overlappingExists) {
            $fail('This amount range overlaps with an existing workflow.');
        }
    }
}
