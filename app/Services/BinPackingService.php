<?php

namespace App\Services;

class BinPackingService
{
    /**
     * Pack purchase requests into minimum number of legal tender packages
     * using the Best-Fit Decreasing (BFD) algorithm.
     *
     * @param iterable $requests Collection or array of PurchaseRequest models
     * @param float $binCapacity Maximum budget threshold per package in NPR
     * @return array
     */
    public function packRequests(iterable $requests, float $binCapacity): array
    {
        $startTime = microtime(true);

        if ($binCapacity <= 0) {
            return [
                'success' => false,
                'message' => 'Tender package capacity threshold must be greater than zero.',
                'packages' => [],
                'summary' => [],
            ];
        }

        // 1. Sanitize and prepare items
        $items = [];
        $totalValue = 0;

        foreach ($requests as $request) {
            $val = (float)($request->total ?? 0);
            
            // If request has 0 total, recalculate from items if available
            if ($val <= 0 && !empty($request->purchase_request_items)) {
                foreach ($request->purchase_request_items as $item) {
                    $val += ((float)$item->price * (float)$item->quantity);
                }
            }

            $userName = $request->user->name ?? ('User #' . ($request->user_id ?? '?'));
            $itemsCount = !empty($request->purchase_request_items) ? count($request->purchase_request_items) : 1;

            $createdAt = null;
            if (!empty($request->created_at)) {
                $createdAt = ($request->created_at instanceof \DateTimeInterface)
                    ? $request->created_at->format('Y-m-d')
                    : (string)$request->created_at;
            }

            $items[] = [
                'id' => $request->id,
                'requested_by' => $userName,
                'total' => $val,
                'items_count' => $itemsCount,
                'created_at' => $createdAt,
                'status' => $request->status ?? 'approved',
            ];

            $totalValue += $val;
        }

        if (empty($items)) {
            return [
                'success' => true,
                'message' => 'No approved purchase requests available for bundling.',
                'packages' => [],
                'summary' => [
                    'total_requests' => 0,
                    'total_value' => 0,
                    'bins_count' => 0,
                    'bin_capacity' => $binCapacity,
                    'theoretical_min_bins' => 0,
                    'packing_efficiency' => 0,
                    'algorithm' => 'Best-Fit Decreasing (BFD)',
                    'execution_time_ms' => round((microtime(true) - $startTime) * 1000, 2),
                ],
            ];
        }

        // 2. Sort items descending by total value (BFD step 1)
        usort($items, function ($a, $b) {
            if ($b['total'] == $a['total']) {
                return $a['id'] <=> $b['id'];
            }
            return $b['total'] <=> $a['total'];
        });

        // 3. Best-Fit Decreasing Allocation (BFD step 2 & 3)
        $bins = [];

        foreach ($items as $item) {
            $itemValue = $item['total'];

            // Handle oversized items exceeding binCapacity
            if ($itemValue > $binCapacity) {
                // Allocate a dedicated oversized package
                $bins[] = [
                    'capacity' => $itemValue,
                    'is_oversized' => true,
                    'current_load' => $itemValue,
                    'requests' => [$item],
                ];
                continue;
            }

            // Find bin with best fit (minimum remaining space after placement)
            $bestBinIndex = -1;
            $minRemainingSpace = PHP_FLOAT_MAX;

            foreach ($bins as $idx => $bin) {
                if ($bin['is_oversized']) {
                    continue; // Skip dedicated oversized bins
                }

                $remaining = $bin['capacity'] - $bin['current_load'];
                if ($remaining >= $itemValue) {
                    $spaceAfterPlacement = $remaining - $itemValue;
                    if ($spaceAfterPlacement < $minRemainingSpace) {
                        $minRemainingSpace = $spaceAfterPlacement;
                        $bestBinIndex = $idx;
                    }
                }
            }

            if ($bestBinIndex !== -1) {
                // Place into best existing bin
                $bins[$bestBinIndex]['current_load'] += $itemValue;
                $bins[$bestBinIndex]['requests'][] = $item;
            } else {
                // Open a new bin
                $bins[] = [
                    'capacity' => $binCapacity,
                    'is_oversized' => false,
                    'current_load' => $itemValue,
                    'requests' => [$item],
                ];
            }
        }

        // 4. Format packages output and calculate per-package metrics
        $packages = [];
        $totalAllocatedCapacity = 0;
        $totalUtilized = 0;

        foreach ($bins as $idx => $bin) {
            $pkgNum = $idx + 1;
            $utilizationPercent = $bin['capacity'] > 0 
                ? round(($bin['current_load'] / $bin['capacity']) * 100, 1) 
                : 100.0;

            $remainingCapacity = max(0, $bin['capacity'] - $bin['current_load']);
            $totalAllocatedCapacity += $bin['capacity'];
            $totalUtilized += $bin['current_load'];

            $status = 'optimal';
            if ($bin['is_oversized']) {
                $status = 'oversized';
            } elseif ($utilizationPercent < 50.0) {
                $status = 'low';
            } elseif ($utilizationPercent < 80.0) {
                $status = 'moderate';
            }

            $packages[] = [
                'package_id' => $pkgNum,
                'package_name' => "Tender Package #{$pkgNum}",
                'total_amount' => round($bin['current_load'], 2),
                'capacity' => round($bin['capacity'], 2),
                'remaining_capacity' => round($remainingCapacity, 2),
                'utilization_percent' => $utilizationPercent,
                'is_oversized' => $bin['is_oversized'],
                'status' => $status,
                'requests_count' => count($bin['requests']),
                'request_ids' => array_column($bin['requests'], 'id'),
                'requests' => $bin['requests'],
            ];
        }

        // 5. Global Summary Statistics & Bounds
        $theoreticalMinBins = (int)ceil($totalValue / $binCapacity);
        $overallEfficiency = $totalAllocatedCapacity > 0 
            ? round(($totalUtilized / $totalAllocatedCapacity) * 100, 1) 
            : 100.0;

        $executionTime = round((microtime(true) - $startTime) * 1000, 2);

        return [
            'success' => true,
            'summary' => [
                'total_requests' => count($items),
                'total_value' => round($totalValue, 2),
                'bin_capacity' => round($binCapacity, 2),
                'bins_count' => count($packages),
                'theoretical_min_bins' => $theoreticalMinBins,
                'packing_efficiency' => $overallEfficiency,
                'algorithm' => 'Best-Fit Decreasing (BFD) - O(N log N)',
                'execution_time_ms' => $executionTime,
            ],
            'packages' => $packages,
        ];
    }
}
