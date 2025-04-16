<?php

namespace App\Http\Controllers;

use App\Models\Product;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class ReportController extends Controller
{
    public function index(Request $request)
    {
        $totalsSubquery = DB::table('purchase_request_items')
            ->select('eoi_id', DB::raw('SUM(price * quantity) as total_amount'))
            ->groupBy('eoi_id');
        $productCountSubquery = DB::table('purchase_request_items')
            ->select('eoi_id', DB::raw('COUNT(*) as product_count'))
            ->groupBy('eoi_id');
        $applicationCountSubquery = DB::table('eoi_vendor_applications')
            ->select('eoi_id', DB::raw('COUNT(*) as application_count'))
            ->groupBy('eoi_id');

        $query = DB::table('eois')
            ->leftJoin('purchase_request_items as pri', 'pri.eoi_id', '=', 'eois.id')
            ->leftJoin('products', 'products.id', '=', 'pri.product_id')
            ->leftJoin('eoi_vendor_applications as eva', 'eva.eoi_id', '=', 'eois.id')
            ->leftJoin('vendors', 'vendors.id', '=', 'eva.vendor_id')
            ->leftJoin('eoi_vendor_proposals as evp', 'evp.eoi_vendor_application_id', '=', 'eva.id')
            ->leftJoin('purchase_request_items as pri2', 'pri2.id', '=', 'evp.purchase_request_item_id')
            ->leftJoin('products as p2', 'p2.id', '=', 'pri2.product_id')
            ->leftJoin(DB::raw('(SELECT eoi_vendor_application_id, COUNT(*) as document_count FROM eoi_vendor_documents GROUP BY eoi_vendor_application_id) as evd'), 'evd.eoi_vendor_application_id', '=', 'eva.id')
            ->leftJoinSub($totalsSubquery, 'totals', function ($join) {
                $join->on('totals.eoi_id', '=', 'eois.id');
            })
            ->leftJoinSub($productCountSubquery, 'product_counts', function ($join) {
                $join->on('product_counts.eoi_id', '=', 'eois.id');
            })
            ->leftJoinSub($applicationCountSubquery, 'application_counts', function ($join) {
                $join->on('application_counts.eoi_id', '=', 'eois.id');
            })
            ->select([
                'eois.id as eoi_id',
                'eois.title as eoi_title',
                'eois.published_date as published_date',
                'eois.deadline_date as deadline_date',
                'pri.id as item_id',
                'pri.priority as item_priority',
                'pri.quantity',
                'pri.price as request_price',
                'products.name as product_name',

                'vendors.id as vendor_id',
                'vendors.name as vendor_name',
                'vendors.rating',
                'evd.document_count',

                'evp.id as proposal_id',
                'evp.price as proposed_price',
                'eva.delivery_date',

                'pri2.id as proposal_item_id',
                'p2.name as proposal_product_name',
                'totals.total_amount',
                'product_counts.product_count',
                'application_counts.application_count',
            ]);
        if ($request->filled('status')) {
            $query->where('eois.status', $request->status);
        }

        if ($request->filled('startDate') && !$request->filled('endDate')) {
            $query->whereDate('eois.published_date', '>=', $request->startDate);
        } else if ($request->filled('endDate') && !$request->filled('startDate')) {
            $query->whereDate('eois.published_date', '<=', $request->endDate);
        } else if ($request->filled('endDate') && $request->filled('startDate')) {
            $query->whereBetween('eois.published_date', [$request->startDate, $request->endDate]);
        }

        if ($request->filled('minTotal') && !$request->filled('maxTotal')) {
            $query->where('totals.total_amount', '>=', $request->minTotal);
        } elseif ($request->filled('maxTotal') && !$request->filled('minTotal')) {
            $query->where('totals.total_amount', '<=', $request->maxTotal);
        } elseif ($request->filled('minTotal') && $request->filled('maxTotal')) {
            $query->whereBetween('totals.total_amount', [$request->minTotal, $request->maxTotal]);
        }

        $rawData = $query->get();

        $grouped = [];

        foreach ($rawData as $row) {
            $eoiId = $row->eoi_id;
            $itemId = $row->item_id;
            $proposedItemId = $row->proposal_item_id;
            $total_amount = $row->total_amount;
            $product_count = $row->product_count;
            $application_count = $row->application_count;

            if (!isset($grouped[$eoiId])) {
                $grouped[$eoiId] = [
                    'eoi_id' => $eoiId,
                    'eoi_title' => $row->eoi_title,
                    'published_date' => $row->published_date,
                    'deadline_date' => $row->deadline_date,
                    'product_count' => $row->product_count,
                    'total_amount' => $row->total_amount,
                    'application_count' => $row->application_count,
                    'products' => [],
                ];
            }

            if (!isset($grouped[$eoiId]['products'][$itemId])) {
                $grouped[$eoiId]['products'][$itemId] = [
                    'item_id' => $itemId,
                    'product_name' => $row->product_name,
                    'quantity' => $row->quantity,
                    'request_price' => $row->request_price,
                    'priority' => $row->item_priority,
                    'vendor_submissions' => [],
                ];
            }

            if ($row->vendor_id && $proposedItemId == $itemId) {
                $grouped[$eoiId]['products'][$itemId]['vendor_submissions'][] = [
                    'vendor_id' => $row->vendor_id,
                    'vendor_name' => $row->vendor_name,
                    'proposal_id' => $row->proposal_id,
                    'proposed_price' => $row->proposed_price,
                    'delivery_date' => $row->delivery_date,
                    'document_count' => $row->document_count ?? 0,
                    'rating' => $row->rating,
                ];
            }
        }

        // Score vendors and keep only top 3 per product
        foreach ($grouped as &$eoi) {
            // Collect total proposed amount per vendor per EOI
            $vendorTotals = [];

            foreach ($eoi['products'] as &$product) {
                $priorityBonus = match ($product['priority']) {
                    'high' => 10,
                    'medium' => 5,
                    'low' => 1,
                    default => 0,
                };

                foreach ($product['vendor_submissions'] as &$submission) {
                    $daysToDelivery = Carbon::parse($submission['delivery_date'])->diffInDays(now());

                    // Score calculation
                    $score =
                        $priorityBonus +
                        ($submission['document_count'] * 2) +
                        ($submission['rating'] * 2) +
                        max(0, 30 - $daysToDelivery);

                    $submission['score'] = $score;

                    // Add to vendor's total proposed price for this EOI
                    $vendorId = $submission['vendor_id'];
                    if (!isset($vendorTotals[$vendorId])) {
                        $vendorTotals[$vendorId] = [
                            'vendor_id' => $vendorId,
                            'vendor_name' => $submission['vendor_name'],
                            'total_proposed_amount' => 0,
                            'total_score' => 0,
                        ];
                    }

                    $vendorTotals[$vendorId]['total_proposed_amount'] += $submission['proposed_price'];
                    $vendorTotals[$vendorId]['total_score'] += $score;
                }

                // We'll do final top-3 selection after looping all products
            }

            // Get top 3 vendors across the whole EOI by score
            usort($vendorTotals, fn($a, $b) => $b['total_score'] <=> $a['total_score']);
            $topVendors = array_values($vendorTotals);
            $topVendors = array_slice($topVendors, 0, 3);

            // Store top 3 vendor ids
            $topVendorIds = array_column($topVendors, 'vendor_id');

            // Now for each product, only keep submissions from top 3 vendors
            foreach ($eoi['products'] as &$product) {
                $product['vendor_submissions'] = array_values(array_filter(
                    $product['vendor_submissions'],
                    fn($s) => in_array($s['vendor_id'], $topVendorIds)
                ));

                // Sort vendors by proposed price for the product
                usort($product['vendor_submissions'], fn($a, $b) => $a['proposed_price'] <=> $b['proposed_price']);
            }

            // Attach top vendor info to the EOI
            $eoi['top_vendors'] = $topVendors;
        }



        $results = array_values(array_map(function ($eoi) {
            $eoi['products'] = array_values($eoi['products']);
            return $eoi;
        }, $grouped));
        $products = Product::all();

        return Inertia::render('Reports/EOI', compact('results', 'products'));
    }
}
