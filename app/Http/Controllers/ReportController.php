<?php

namespace App\Http\Controllers;

use App\Models\Eoi;
use App\Models\Product;
use App\Services\TopsisService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class ReportController extends Controller
{
    protected $topsisService;

    public function __construct(TopsisService $topsisService)
    {
        $this->topsisService = $topsisService;
    }

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

        // Score vendors and keep top 3 per EOI using TOPSIS
        foreach ($grouped as &$eoi) {
            $eoiModel = Eoi::with([
                'purchase_request_items',
                'eoi_documents',
                'eoi_vendor_applications.vendor',
                'eoi_vendor_applications.documents.document',
                'eoi_vendor_applications.proposals.purchase_request_item.product'
            ])->find($eoi['eoi_id']);

            $topVendors = [];
            if ($eoiModel && $eoiModel->eoi_vendor_applications->isNotEmpty()) {
                $totalProducts = $eoiModel->purchase_request_items->count();
                $totalDocs = $eoiModel->eoi_documents->where('required', true)->count();
                $topsisResults = $this->topsisService->evaluate($eoiModel->eoi_vendor_applications, $totalProducts, $totalDocs);

                foreach ($topsisResults as $res) {
                    $topVendors[] = [
                        'vendor_id' => $res['vendor_id'],
                        'vendor_name' => $res['vendor_name'],
                        'total_proposed_amount' => $res['raw_price'],
                        'total_score' => $res['percentage'],
                        'topsis_score' => $res['score'],
                        'rank' => $res['rank'],
                    ];
                }

                usort($topVendors, fn($a, $b) => $a['rank'] <=> $b['rank']);
            }

            $top3 = array_slice($topVendors, 0, 3);
            $top3Ids = array_column($top3, 'vendor_id');

            // Attach top vendor info to the EOI
            $eoi['top_vendors'] = $top3;

            // For each product, keep submissions from top 3 vendors
            foreach ($eoi['products'] as &$product) {
                if (!empty($top3Ids)) {
                    $product['vendor_submissions'] = array_values(array_filter(
                        $product['vendor_submissions'],
                        fn($s) => in_array($s['vendor_id'], $top3Ids)
                    ));
                }
                usort($product['vendor_submissions'], fn($a, $b) => $a['proposed_price'] <=> $b['proposed_price']);
            }
        }



        $results = array_values(array_map(function ($eoi) {
            $eoi['products'] = array_values($eoi['products']);
            return $eoi;
        }, $grouped));

        return Inertia::render('Reports/EOI', compact('results'));
    }
}
