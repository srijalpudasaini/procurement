<?php

namespace App\Services;

use App\Models\PurchaseRequestItem;
use App\Models\EoiVendorProposal;

class KnapsackProcurementService
{
    /**
     * Solve the 0/1 Multiple-Choice Knapsack Problem (MCKP) for procurement items.
     *
     * @param iterable $items Collection of PurchaseRequestItem models with relationships
     * @param float $budget Total budget ceiling in NPR
     * @param string $strategy Optimization strategy ('standard', 'cost_priority', 'value_priority')
     * @return array
     */
    public function solve($items, float $budget, string $strategy = 'standard'): array
    {
        $startTime = microtime(true);

        // 1. Prepare item groups and choices
        $itemGroups = [];
        $totalEstimatedBudget = 0;
        $minPossibleTotal = 0;

        foreach ($items as $item) {
            $qty = (float)($item->quantity ?? 1);
            $estUnitPrice = (float)($item->price ?? 0);
            $estItemTotal = $estUnitPrice > 0 ? ($estUnitPrice * $qty) : 0;
            $totalEstimatedBudget += $estItemTotal;

            $priority = strtolower($item->priority ?? 'medium');
            $priorityMultiplier = match ($priority) {
                'high' => 1.5,
                'urgent' => 2.0,
                'low' => 0.8,
                default => 1.0,
            };

            // Gather proposals for this item
            $proposals = $item->proposals ?? [];
            if ($proposals instanceof \Illuminate\Support\Collection) {
                $proposals = $proposals->all();
            }

            $choices = [];
            $itemMinCost = PHP_FLOAT_MAX;
            $itemMaxCost = 0;

            foreach ($proposals as $p) {
                $unitPrice = (float)($p->price ?? 0);
                $totalCost = $unitPrice * $qty;
                if ($totalCost < $itemMinCost) {
                    $itemMinCost = $totalCost;
                }
                if ($totalCost > $itemMaxCost) {
                    $itemMaxCost = $totalCost;
                }
            }

            if ($itemMinCost === PHP_FLOAT_MAX) {
                $itemMinCost = 0;
            }

            $minPossibleTotal += $itemMinCost;

            foreach ($proposals as $p) {
                $unitPrice = (float)($p->price ?? 0);
                $totalCost = $unitPrice * $qty;

                // Base value of fulfilling this item
                $baseValue = $estItemTotal > 0 ? $estItemTotal : ($itemMinCost > 0 ? $itemMinCost : 1000);
                $baseValue *= $priorityMultiplier;

                // Surplus savings bonus: lower cost relative to highest proposal awards bonus value
                $savings = max(0, $itemMaxCost - $totalCost);

                // Calculate objective value
                if ($strategy === 'cost_priority') {
                    // Heavily penalizes cost, rewards savings
                    $value = $baseValue + ($savings * 2.0);
                } elseif ($strategy === 'value_priority') {
                    // Maximizes priority item fulfillment
                    $value = ($baseValue * 2.0) + $savings;
                } else {
                    // Standard balanced: priority fulfillment + savings
                    $value = $baseValue + $savings;
                }

                // Small tie-breaker for vendor rating if available
                $vendorRating = (float)($p->eoi_vendor_application?->vendor?->rating ?? 5.0);
                $value += ($vendorRating * 0.05);

                $choices[] = [
                    'proposal_id' => $p->id,
                    'vendor_id' => $p->eoi_vendor_application?->vendor_id,
                    'vendor_name' => $p->eoi_vendor_application?->vendor?->name ?? 'Vendor',
                    'unit_price' => $unitPrice,
                    'cost' => $totalCost,
                    'value' => $value,
                ];
            }

            if (!empty($choices)) {
                $itemGroups[] = [
                    'item_id' => $item->id,
                    'product_name' => $item->product?->name ?? "Item #{$item->id}",
                    'quantity' => $qty,
                    'priority' => $priority,
                    'choices' => $choices,
                ];
            }
        }

        $M = count($itemGroups);

        if ($M === 0 || $budget <= 0) {
            return [
                'selections' => [],
                'total_cost' => 0,
                'budget' => $budget,
                'remaining_budget' => $budget,
                'utilization_pct' => 0,
                'fulfilled_count' => 0,
                'total_items_count' => $M,
                'is_fully_covered' => false,
                'min_possible_total' => $minPossibleTotal,
                'estimated_total' => $totalEstimatedBudget,
                'excluded_items' => [],
                'execution_time_ms' => round((microtime(true) - $startTime) * 1000, 2),
            ];
        }

        // 2. Discretization scale factor for DP table performance
        $scale = 1;
        if ($budget > 500000) {
            $scale = 100;
        } elseif ($budget > 50000) {
            $scale = 10;
        }

        $W = (int)ceil($budget / $scale);

        // DP state: $dp[w] = max value for capacity w
        // $parent[i][w] = [choice_index, prev_w]
        $dp = array_fill(0, $W + 1, 0.0);
        $parent = []; // Will store choices made at each item step

        for ($i = 0; $i < $M; $i++) {
            $choices = $itemGroups[$i]['choices'];
            $newDp = $dp; // Option to skip this item
            $parent[$i] = [];

            for ($w = 0; $w <= $W; $w++) {
                // Initialize with skipping option
                $bestVal = $dp[$w];
                $bestChoice = -1; // -1 means skipped

                foreach ($choices as $cIdx => $choice) {
                    $cWeight = (int)ceil($choice['cost'] / $scale);
                    if ($w >= $cWeight) {
                        $candidateVal = $dp[$w - $cWeight] + $choice['value'];
                        if ($candidateVal > $bestVal) {
                            $bestVal = $candidateVal;
                            $bestChoice = $cIdx;
                        }
                    }
                }

                $newDp[$w] = $bestVal;
                $parent[$i][$w] = $bestChoice;
            }

            $dp = $newDp;
        }

        // 3. Backtrack from capacity W to find optimal choices
        $selections = [];
        $selectedDetails = [];
        $currW = $W;
        $totalCost = 0.0;
        $totalValue = 0.0;
        $excludedItems = [];

        for ($i = $M - 1; $i >= 0; $i--) {
            $choiceIdx = $parent[$i][$currW] ?? -1;
            $group = $itemGroups[$i];

            if ($choiceIdx >= 0) {
                $chosen = $group['choices'][$choiceIdx];
                $selections[$group['item_id']] = $chosen['proposal_id'];
                $selectedDetails[$group['item_id']] = [
                    'item_id' => $group['item_id'],
                    'product_name' => $group['product_name'],
                    'proposal_id' => $chosen['proposal_id'],
                    'vendor_name' => $chosen['vendor_name'],
                    'cost' => $chosen['cost'],
                ];
                $totalCost += $chosen['cost'];
                $totalValue += $chosen['value'];

                $cWeight = (int)ceil($chosen['cost'] / $scale);
                $currW = max(0, $currW - $cWeight);
            } else {
                $excludedItems[] = [
                    'item_id' => $group['item_id'],
                    'product_name' => $group['product_name'],
                    'reason' => 'Budget limit exceeded to accommodate this item',
                ];
            }
        }

        $remainingBudget = max(0, $budget - $totalCost);
        $utilizationPct = $budget > 0 ? round(($totalCost / $budget) * 100, 1) : 0;
        $fulfilledCount = count($selections);

        return [
            'selections' => $selections,
            'selected_details' => $selectedDetails,
            'total_cost' => round($totalCost, 2),
            'budget' => $budget,
            'remaining_budget' => round($remainingBudget, 2),
            'utilization_pct' => $utilizationPct,
            'fulfilled_count' => $fulfilledCount,
            'total_items_count' => $M,
            'is_fully_covered' => $fulfilledCount === $M,
            'min_possible_total' => round($minPossibleTotal, 2),
            'estimated_total' => round($totalEstimatedBudget, 2),
            'excluded_items' => $excludedItems,
            'execution_time_ms' => round((microtime(true) - $startTime) * 1000, 2),
        ];
    }
}
