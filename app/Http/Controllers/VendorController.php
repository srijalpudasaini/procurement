<?php

namespace App\Http\Controllers;

use App\Models\Eoi;
use App\Models\EoiVendorApplication;
use App\Repositories\VendorRepository;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class VendorController extends Controller
{
    protected $vendorRepository;

    public function __construct(VendorRepository $vendorRepository){
        $this->vendorRepository = $vendorRepository;
    }

    protected function getVendor(Request $request)
    {
        return $request->user('vendor') ?? Auth::guard('vendor')->user() ?? $request->user();
    }

    public function index(Request $request)
    {
        $vendor = $this->getVendor($request);
        if (!$vendor) {
            return redirect()->route('login');
        }

        $totalApplications = EoiVendorApplication::where('vendor_id', $vendor->id)->count();
        $pendingApplications = EoiVendorApplication::where('vendor_id', $vendor->id)->where('status', 'pending')->count();
        $approvedApplications = EoiVendorApplication::where('vendor_id', $vendor->id)->where('status', 'approved')->count();
        $rejectedApplications = EoiVendorApplication::where('vendor_id', $vendor->id)->where('status', 'rejected')->count();

        $today = now()->toDateString();
        $availableTendersCount = Eoi::where('status', 'published')
            ->whereDate('deadline_date', '>=', $today)
            ->count();

        $recentApplications = EoiVendorApplication::where('vendor_id', $vendor->id)
            ->with(['eoi', 'proposals.purchase_request_item.product'])
            ->latest('application_date')
            ->take(5)
            ->get();

        $openEois = Eoi::where('status', 'published')
            ->whereDate('deadline_date', '>=', $today)
            ->withCount('purchase_request_items')
            ->latest('published_date')
            ->take(4)
            ->get();

        $appliedEoiIds = EoiVendorApplication::where('vendor_id', $vendor->id)
            ->pluck('eoi_id')
            ->toArray();

        $stats = [
            'total_applications' => $totalApplications,
            'pending_applications' => $pendingApplications,
            'approved_applications' => $approvedApplications,
            'rejected_applications' => $rejectedApplications,
            'available_tenders' => $availableTendersCount,
        ];

        return Inertia::render('Vendors/Dashboard', [
            'vendor' => $vendor,
            'stats' => $stats,
            'recentApplications' => $recentApplications,
            'openEois' => $openEois,
            'appliedEoiIds' => $appliedEoiIds,
        ]);
    }

    public function eoi(Request $request)
    {
        $vendor = $this->getVendor($request);
        if (!$vendor) {
            return redirect()->route('login');
        }

        $applications = EoiVendorApplication::where('vendor_id', $vendor->id)
            ->with(['eoi', 'proposals.purchase_request_item.product', 'documents.document'])
            ->latest('application_date')
            ->paginate($request->input('per_page', 10));

        return Inertia::render('Vendors/EOI/Applications', compact('applications'));
    }

    public function apply(Request $request, $id)
    {
        $vendor = $this->getVendor($request);
        if (!$vendor) {
            return redirect()->route('login');
        }

        $application = EoiVendorApplication::where('vendor_id', $vendor->id)->where('eoi_id', $id)->get();
        $hasApplied = count($application) >= 1;

        $eoi = Eoi::with('purchase_request_items.product', 'eoi_documents.document', 'files')->findOrFail($id);
        if ($eoi->status != 'published') {
            return abort(404);
        }

        return Inertia::render('Vendors/EOI/Apply', compact('eoi', 'hasApplied'));
    }

    public function updateRating(Request $request, $id){
        $request->validate([
            'rating' => 'required|numeric|min:1|max:5',
        ]);
        $vendor = $this->vendorRepository->find($id);
        if (!$vendor) {
            return redirect()->back()->with('error', 'Vendor not found.');
        }

        $newRating = (float) $request->rating;
        $vendor->rating = round((($vendor->rating * $vendor->rating_count) + $newRating) / ($vendor->rating_count + 1), 2);
        $vendor->rating_count += 1;
        $vendor->save();

        return redirect()->back()->with('success', "Rating for {$vendor->name} updated successfully to {$vendor->rating} ★!");
    }
}
