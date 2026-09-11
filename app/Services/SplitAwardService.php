<?php

namespace App\Services;

use App\Models\Eoi;

class SplitAwardService
{
    /**
     * Compute the optimal multi-vendor split award for a given EOI.
     * Compares Best Single-Vendor Award (K=1) vs Optimal 2-Vendor Split Award (K=2).
     *
     * @param Eoi $eoi
     * @return array Analysis results with single award, 2-vendor split, savings, and item allocation
     */
    public function calculateOptimalSplit(Eoi $eoi): array
    {
        $items = $eoi->purchase_request_items;
        $applications = $eoi->eoi_vendor_applications()->with(['vendor', 'proposals'])->get();

        if ($items->isEmpty() || $applications->isEmpty()) {
            return [
                'has_proposals' => false,
                'message' => 'No items or vendor proposals found for this EOI.',
            ];
        }

        // 1. Map items
        $requiredItems = [];
        foreach ($items as $item) {
            $requiredItems[$item->id] = [
                'item_id' => $item->id,
                'product_id' => $item->product_id,
                'product_name' => $item->product->name ?? 'Product #' . $item->product_id,
                'unit' => $item->product->unit ?? 'unit',
                'quantity' => (int) $item->quantity,
            ];
        }
        $totalItemsCount = count($requiredItems);

        // 2. Build vendor price matrix: $prices[vendor_id][item_id] = unit_price
        $prices = [];
        $vendors = [];

        foreach ($applications as $app) {
            $vendorId = $app->vendor_id;
            $vendorName = $app->vendor->name ?? 'Vendor #' . $vendorId;

            $vendors[$vendorId] = [
                'id' => $vendorId,
                'name' => $vendorName,
                'rating' => (float) ($app->vendor->rating ?? 0),
                'application_id' => $app->id,
                'delivery_date' => $app->delivery_date,
            ];

            foreach ($app->proposals as $proposal) {
                if (isset($requiredItems[$proposal->purchase_request_item_id])) {
                    $prices[$vendorId][$proposal->purchase_request_item_id] = (float) $proposal->price;
                }
            }
        }

        $vendorIds = array_keys($vendors);

        // 3. Find Best Single Vendor (K=1)
        $singleVendorOptions = [];
        foreach ($vendorIds as $vId) {
            $cost = 0;
            $coveredCount = 0;
            $allocations = [];

            foreach ($requiredItems as $itemId => $item) {
                if (isset($prices[$vId][$itemId])) {
                    $unitPrice = $prices[$vId][$itemId];
                    $subtotal = $unitPrice * $item['quantity'];
                    $cost += $subtotal;
                    $coveredCount++;

                    $allocations[] = [
                        'item_id' => $itemId,
                        'product_name' => $item['product_name'],
                        'quantity' => $item['quantity'],
                        'unit' => $item['unit'],
                        'unit_price' => $unitPrice,
                        'subtotal' => $subtotal,
                        'vendor_id' => $vId,
                        'vendor_name' => $vendors[$vId]['name'],
                    ];
                }
            }

            if ($coveredCount > 0) {
                $singleVendorOptions[] = [
                    'vendor_id' => $vId,
                    'vendor_name' => $vendors[$vId]['name'],
                    'vendor_rating' => $vendors[$vId]['rating'],
                    'total_cost' => $cost,
                    'covered_count' => $coveredCount,
                    'is_full_coverage' => ($coveredCount === $totalItemsCount),
                    'allocations' => $allocations,
                ];
            }
        }

        // Sort single vendors: full coverage first, then lowest cost
        usort($singleVendorOptions, function ($a, $b) {
            if ($a['is_full_coverage'] !== $b['is_full_coverage']) {
                return $b['is_full_coverage'] <=> $a['is_full_coverage'];
            }
            return $a['total_cost'] <=> $b['total_cost'];
        });

        $bestSingle = !empty($singleVendorOptions) ? $singleVendorOptions[0] : null;

        // 4. Find Optimal 2-Vendor Split (K=2)
        $bestSplit = null;

        if (count($vendorIds) >= 2 && $totalItemsCount >= 2) {
            $pairOptions = [];

            for ($i = 0; $i < count($vendorIds); $i++) {
                for ($j = $i + 1; $j < count($vendorIds); $j++) {
                    $v1 = $vendorIds[$i];
                    $v2 = $vendorIds[$j];

                    $combinedCost = 0;
                    $coveredCount = 0;
                    $allocations = [];
                    $vendorSplitTotals = [$v1 => 0, $v2 => 0];
                    $vendorSplitCounts = [$v1 => 0, $v2 => 0];

                    foreach ($requiredItems as $itemId => $item) {
                        $p1 = $prices[$v1][$itemId] ?? null;
                        $p2 = $prices[$v2][$itemId] ?? null;

                        if ($p1 !== null && $p2 !== null) {
                            $chosenVendor = ($p1 <= $p2) ? $v1 : $v2;
                            $chosenPrice = min($p1, $p2);
                        } elseif ($p1 !== null) {
                            $chosenVendor = $v1;
                            $chosenPrice = $p1;
                        } elseif ($p2 !== null) {
                            $chosenVendor = $v2;
                            $chosenPrice = $p2;
                        } else {
                            continue; // Neither vendor quoted this item
                        }

                        $subtotal = $chosenPrice * $item['quantity'];
                        $combinedCost += $subtotal;
                        $coveredCount++;

                        $vendorSplitTotals[$chosenVendor] += $subtotal;
                        $vendorSplitCounts[$chosenVendor]++;

                        $allocations[] = [
                            'item_id' => $itemId,
                            'product_name' => $item['product_name'],
                            'quantity' => $item['quantity'],
                            'unit' => $item['unit'],
                            'unit_price' => $chosenPrice,
                            'subtotal' => $subtotal,
                            'vendor_id' => $chosenVendor,
                            'vendor_name' => $vendors[$chosenVendor]['name'],
                        ];
                    }

                    // Only consider if both vendors actually win at least 1 item
                    if ($vendorSplitCounts[$v1] > 0 && $vendorSplitCounts[$v2] > 0) {
                        $pairOptions[] = [
                            'vendor_1' => [
                                'id' => $v1,
                                'name' => $vendors[$v1]['name'],
                                'items_count' => $vendorSplitCounts[$v1],
                                'subtotal' => $vendorSplitTotals[$v1],
                            ],
                            'vendor_2' => [
                                'id' => $v2,
                                'name' => $vendors[$v2]['name'],
                                'items_count' => $vendorSplitCounts[$v2],
                                'subtotal' => $vendorSplitTotals[$v2],
                            ],
                            'total_cost' => $combinedCost,
                            'covered_count' => $coveredCount,
                            'is_full_coverage' => ($coveredCount === $totalItemsCount),
                            'allocations' => $allocations,
                        ];
                    }
                }
            }

            if (!empty($pairOptions)) {
                // Sort pairs: full coverage first, then lowest cost
                usort($pairOptions, function ($a, $b) {
                    if ($a['is_full_coverage'] !== $b['is_full_coverage']) {
                        return $b['is_full_coverage'] <=> $a['is_full_coverage'];
                    }
                    return $a['total_cost'] <=> $b['total_cost'];
                });

                $bestSplit = $pairOptions[0];
            }
        }

        // 5. Calculate Savings & Comparison
        $savingsAmount = 0;
        $savingsPercent = 0;
        $hasSavings = false;

        if ($bestSingle && $bestSplit && $bestSplit['is_full_coverage']) {
            if ($bestSplit['total_cost'] < $bestSingle['total_cost']) {
                $savingsAmount = round($bestSingle['total_cost'] - $bestSplit['total_cost'], 2);
                $savingsPercent = $bestSingle['total_cost'] > 0
                    ? round(($savingsAmount / $bestSingle['total_cost']) * 100, 1)
                    : 0;
                $hasSavings = ($savingsAmount > 0);
            }
        }

        return [
            'has_proposals' => true,
            'total_items_count' => $totalItemsCount,
            'best_single_award' => $bestSingle,
            'best_split_award' => $bestSplit,
            'has_savings' => $hasSavings,
            'savings_amount' => $savingsAmount,
            'savings_percentage' => $savingsPercent,
        ];
    }
}
