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
            ->select([
                'eois.id as eoi_id',
                'eois.title as eoi_title',
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
                'totals.total_amount'
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

            if (!isset($grouped[$eoiId])) {
                $grouped[$eoiId] = [
                    'eoi_id' => $eoiId,
                    'eoi_title' => $row->eoi_title,
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
            foreach ($eoi['products'] as &$product) {
                $priorityBonus = match ($product['priority']) {
                    'high' => 10,
                    'medium' => 5,
                    'low' => 1,
                    default => 0,
                };

                // Calculate score for each vendor based on factors excluding proposed price
                foreach ($product['vendor_submissions'] as &$submission) {
                    $daysToDelivery = Carbon::parse($submission['delivery_date'])->diffInDays(now());

                    $submission['score'] =
                        $priorityBonus +
                        ($submission['document_count'] * 2) +
                        ($submission['rating'] * 5) +
                        max(0, 30 - $daysToDelivery);
                }

                // Sort vendors by score first
                usort($product['vendor_submissions'], fn($a, $b) => $b['score'] <=> $a['score']);

                // After sorting by score, we now sort top vendors by total proposed amount (sum of proposed prices)
                $topVendors = array_slice($product['vendor_submissions'], 0, 3);

                // Sort top 3 vendors based on their total proposed price (descending order)
                usort($topVendors, function ($a, $b) {
                    return $a['proposed_price'] <=> $b['proposed_price'];
                });

                // Update the vendor submissions with the top vendors sorted by total amount
                $product['vendor_submissions'] = $topVendors;
            }
        }


        $results = array_values(array_map(function ($eoi) {
            $eoi['products'] = array_values($eoi['products']);
            return $eoi;
        }, $grouped));
        $products = Product::all();

        return Inertia::render('Reports/EOI', compact('results', 'products'));
    }
}
