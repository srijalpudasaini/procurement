<?php

namespace App\Services;

use Carbon\Carbon;

class TopsisService
{
    /**
     * Default criteria configuration and weights.
     * Weights sum to 1.0.
     * 'type' is either 'cost' (lower is better) or 'benefit' (higher is better).
     */
    protected array $criteria = [
        'price' => [
            'label' => 'Total Quoted Price',
            'weight' => 0.35,
            'type' => 'cost',
            'unit' => 'NPR',
        ],
        'delivery_days' => [
            'label' => 'Delivery Lead Time',
            'weight' => 0.20,
            'type' => 'cost',
            'unit' => 'Days',
        ],
        'rating' => [
            'label' => 'Vendor Reputation / Rating',
            'weight' => 0.20,
            'type' => 'benefit',
            'unit' => 'Stars (1-5)',
        ],
        'doc_compliance' => [
            'label' => 'Document Compliance',
            'weight' => 0.15,
            'type' => 'benefit',
            'unit' => 'Ratio (0-1)',
        ],
        'product_coverage' => [
            'label' => 'Product Coverage',
            'weight' => 0.10,
            'type' => 'benefit',
            'unit' => 'Ratio (0-1)',
        ],
    ];

    /**
     * Evaluate applications and return just the rankings array (for backward compatibility).
     */
    public function evaluate($applications, int $totalEoiProducts = 0, int $totalRequiredDocs = 0, array $customWeights = []): array
    {
        $detailed = $this->evaluateDetailed($applications, $totalEoiProducts, $totalRequiredDocs, $customWeights);
        return $detailed['rankings'] ?? [];
    }

    /**
     * Evaluate vendor applications and return the complete step-by-step mathematical matrices.
     */
    public function evaluateDetailed($applications, int $totalEoiProducts = 0, int $totalRequiredDocs = 0, array $customWeights = []): array
    {
        if (empty($applications) || count($applications) === 0) {
            return [
                'rankings' => [],
                'matrix' => [],
                'normalized' => [],
                'weighted' => [],
                'ideal_best' => [],
                'ideal_worst' => [],
                'distances' => [],
                'criteria' => $this->criteria,
            ];
        }

        // Apply custom weights if provided
        $activeCriteria = $this->criteria;
        if (!empty($customWeights)) {
            $sum = array_sum($customWeights);
            if ($sum > 0) {
                foreach ($customWeights as $k => $w) {
                    if (isset($activeCriteria[$k])) {
                        $activeCriteria[$k]['weight'] = (float) ($w / $sum);
                    }
                }
            }
        }

        $matrix = [];
        $metadata = [];

        // 1. Build Decision Matrix (X)
        foreach ($applications as $app) {
            $appId = $app->id;
            $vendor = $app->vendor;
            $totalPrice = 0;
            if (!empty($app->proposals)) {
                foreach ($app->proposals as $prop) {
                    $qty = $prop->purchase_request_item->quantity ?? 1;
                    $totalPrice += ($prop->price * $qty);
                }
            }

            $deliveryDays = 30;
            if (!empty($app->delivery_date)) {
                $diff = Carbon::now()->diffInDays(Carbon::parse($app->delivery_date), false);
                $deliveryDays = max(1, (int) round($diff));
            }

            $rating = (float) ($vendor->rating ?? 2.5);

            $docCount = !empty($app->documents) ? count($app->documents) : 0;
            $docCompliance = $totalRequiredDocs > 0 ? min(1.0, $docCount / $totalRequiredDocs) : 1.0;

            $quotedCount = !empty($app->proposals) ? count($app->proposals) : 0;
            $productCoverage = $totalEoiProducts > 0 ? min(1.0, $quotedCount / $totalEoiProducts) : 1.0;

            $matrix[$appId] = [
                'price' => max(0.01, (float) $totalPrice),
                'delivery_days' => (float) $deliveryDays,
                'rating' => max(0.1, $rating),
                'doc_compliance' => max(0.05, (float) $docCompliance),
                'product_coverage' => max(0.05, (float) $productCoverage),
            ];

            $metadata[$appId] = [
                'application_id' => $appId,
                'vendor_id' => $vendor->id ?? null,
                'vendor_name' => $vendor->name ?? 'Unknown Vendor',
                'raw_price' => $totalPrice,
                'delivery_days' => $deliveryDays,
                'rating' => $rating,
                'doc_count' => $docCount,
                'product_coverage' => $productCoverage,
            ];
        }

        $appIds = array_keys($matrix);
        $m = count($appIds);

        // Edge case: single applicant
        if ($m === 1) {
            $singleId = $appIds[0];
            $singleResult = [
                $singleId => array_merge($metadata[$singleId], [
                    'score' => 1.0,
                    'percentage' => 100.0,
                    'rank' => 1,
                    'strengths' => ['Sole Applicant'],
                ]),
            ];
            return [
                'rankings' => $singleResult,
                'matrix' => $matrix,
                'normalized' => $matrix,
                'weighted' => $matrix,
                'ideal_best' => $matrix[$singleId],
                'ideal_worst' => $matrix[$singleId],
                'distances' => [$singleId => ['d_plus' => 0, 'd_minus' => 1]],
                'criteria' => $activeCriteria,
            ];
        }

        // 2. Vector Normalization: r_ij = x_ij / sqrt(sum(x_kj^2))
        $normDenom = [];
        foreach ($activeCriteria as $criterion => $config) {
            $sumSquares = 0;
            foreach ($appIds as $id) {
                $sumSquares += pow($matrix[$id][$criterion], 2);
            }
            $normDenom[$criterion] = sqrt($sumSquares) ?: 1.0;
        }

        $normalizedMatrix = [];
        foreach ($appIds as $id) {
            foreach ($activeCriteria as $criterion => $config) {
                $normalizedMatrix[$id][$criterion] = round($matrix[$id][$criterion] / $normDenom[$criterion], 6);
            }
        }

        // 3. Weighted Normalized Matrix: v_ij = w_j * r_ij
        $weightedMatrix = [];
        foreach ($appIds as $id) {
            foreach ($activeCriteria as $criterion => $config) {
                $weightedMatrix[$id][$criterion] = round($normalizedMatrix[$id][$criterion] * $config['weight'], 6);
            }
        }

        // 4. Positive Ideal Solution (A+) and Negative Ideal Solution (A-)
        $idealBest = [];
        $idealWorst = [];

        foreach ($activeCriteria as $criterion => $config) {
            $columnValues = array_column($weightedMatrix, $criterion);
            if ($config['type'] === 'benefit') {
                $idealBest[$criterion] = max($columnValues);
                $idealWorst[$criterion] = min($columnValues);
            } else { // cost criterion
                $idealBest[$criterion] = min($columnValues);
                $idealWorst[$criterion] = max($columnValues);
            }
        }

        // 5. Euclidean Separation Distances (S_i+, S_i-) and Relative Closeness (C_i)
        $distances = [];
        $closeness = [];

        foreach ($appIds as $id) {
            $distBest = 0;
            $distWorst = 0;

            foreach ($activeCriteria as $criterion => $config) {
                $val = $weightedMatrix[$id][$criterion];
                $distBest += pow($val - $idealBest[$criterion], 2);
                $distWorst += pow($val - $idealWorst[$criterion], 2);
            }

            $sPlus = sqrt($distBest);
            $sMinus = sqrt($distWorst);

            $totalDist = $sPlus + $sMinus;
            $c = $totalDist > 0 ? ($sMinus / $totalDist) : 0.5;

            $distances[$id] = [
                'd_plus' => round($sPlus, 5),
                'd_minus' => round($sMinus, 5),
            ];
            $closeness[$id] = $c;
        }

        // 6. Rank descending by Closeness Score
        arsort($closeness);

        // Determine competitive highlights for each vendor
        $minPrice = min(array_column($metadata, 'raw_price'));
        $minDelivery = min(array_column($metadata, 'delivery_days'));
        $maxRating = max(array_column($metadata, 'rating'));

        $results = [];
        $rank = 1;
        foreach ($closeness as $id => $score) {
            $strengths = [];
            if ($metadata[$id]['raw_price'] <= $minPrice) {
                $strengths[] = 'Lowest Price';
            }
            if ($metadata[$id]['delivery_days'] <= $minDelivery) {
                $strengths[] = 'Fastest Delivery';
            }
            if ($metadata[$id]['rating'] >= $maxRating) {
                $strengths[] = 'Highest Rating';
            }
            if ($matrix[$id]['doc_compliance'] >= 1.0) {
                $strengths[] = '100% Compliant';
            }

            $results[$id] = array_merge($metadata[$id], [
                'score' => round($score, 4),
                'percentage' => round($score * 100, 1),
                'rank' => $rank++,
                'd_plus' => $distances[$id]['d_plus'],
                'd_minus' => $distances[$id]['d_minus'],
                'strengths' => $strengths,
            ]);
        }

        return [
            'rankings' => $results,
            'matrix' => $matrix,
            'metadata' => $metadata,
            'normalized' => $normalizedMatrix,
            'weighted' => $weightedMatrix,
            'ideal_best' => $idealBest,
            'ideal_worst' => $idealWorst,
            'distances' => $distances,
            'criteria' => $activeCriteria,
        ];
    }

    /**
     * Predefined weights for strategic TOPSIS evaluations.
     */
    public function getWeightsForStrategy(string $strategy): array
    {
        return match ($strategy) {
            'cost' => [
                'price' => 0.60,
                'delivery_days' => 0.10,
                'rating' => 0.10,
                'doc_compliance' => 0.10,
                'product_coverage' => 0.10,
            ],
            'speed' => [
                'price' => 0.15,
                'delivery_days' => 0.50,
                'rating' => 0.15,
                'doc_compliance' => 0.10,
                'product_coverage' => 0.10,
            ],
            'quality' => [
                'price' => 0.15,
                'delivery_days' => 0.15,
                'rating' => 0.40,
                'doc_compliance' => 0.20,
                'product_coverage' => 0.10,
            ],
            default => [
                'price' => 0.35,
                'delivery_days' => 0.20,
                'rating' => 0.20,
                'doc_compliance' => 0.15,
                'product_coverage' => 0.10,
            ],
        };
    }

    /**
     * Provide an automated award recommendation based on TOPSIS rankings.
     */
    public function recommend($applications, $items, string $strategy = 'balanced'): array
    {
        $weights = $this->getWeightsForStrategy($strategy);
        $totalProducts = count($items);

        $detailed = $this->evaluateDetailed($applications, $totalProducts, 0, $weights);
        $rankings = $detailed['rankings'] ?? [];

        // Sort applications by rank ascending
        $sortedApps = collect($applications)->sortBy(function ($app) use ($rankings) {
            return $rankings[$app->id]['rank'] ?? 999;
        })->values();

        $topApp = $sortedApps->first();
        $selections = [];
        $selectedDetails = [];
        $totalCost = 0;

        foreach ($items as $item) {
            $chosenProposal = null;
            $chosenApp = null;

            foreach ($sortedApps as $app) {
                $prop = $app->proposals->firstWhere('purchase_request_item_id', $item->id);
                if ($prop && $prop->price > 0) {
                    $chosenProposal = $prop;
                    $chosenApp = $app;
                    break;
                }
            }

            if ($chosenProposal) {
                $selections[$item->id] = $chosenProposal->id;
                $cost = (float)($chosenProposal->price * ($item->quantity ?? 1));
                $totalCost += $cost;
                $selectedDetails[$item->id] = [
                    'item_id' => $item->id,
                    'product_name' => $item->product?->name ?? "Item #{$item->id}",
                    'proposal_id' => $chosenProposal->id,
                    'vendor_name' => $chosenApp->vendor?->name ?? 'Vendor',
                    'cost' => $cost,
                ];
            }
        }

        $strategyLabels = [
            'balanced' => 'Balanced Strategy',
            'cost' => 'Lowest Price Strategy',
            'speed' => 'Fast Delivery Strategy',
            'quality' => 'High Reputation Strategy',
        ];

        return [
            'selections' => $selections,
            'selected_details' => $selectedDetails,
            'top_vendor' => $topApp ? [
                'id' => $topApp->vendor_id,
                'application_id' => $topApp->id,
                'name' => $topApp->vendor?->name ?? 'Top Vendor',
                'rank' => $rankings[$topApp->id]['rank'] ?? 1,
                'score' => $rankings[$topApp->id]['score'] ?? 0,
                'percentage' => $rankings[$topApp->id]['percentage'] ?? 0,
            ] : null,
            'strategy' => $strategy,
            'strategy_label' => $strategyLabels[$strategy] ?? 'Balanced Strategy',
            'rankings' => $rankings,
            'total_cost' => round($totalCost, 2),
            'fulfilled_count' => count($selections),
            'total_items_count' => count($items),
        ];
    }
}
