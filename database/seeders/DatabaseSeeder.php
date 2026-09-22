<?php

namespace Database\Seeders;

use App\Models\ApprovalStep;
use App\Models\ApprovalWorkflow;
use App\Models\Category;
use App\Models\Document;
use App\Models\Eoi;
use App\Models\EoiDocument;
use App\Models\EoiVendorApplication;
use App\Models\EoiVendorDocument;
use App\Models\EoiVendorProposal;
use App\Models\Product;
use App\Models\PurchaseRequest;
use App\Models\PurchaseRequestItem;
use App\Models\RequestApprovals;
use App\Models\User;
use App\Models\Vendor;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database with rich, realistic enterprise procurement data.
     */
    public function run(): void
    {
        // 1. Permissions & Roles
        $permissions = [
            'view_request',
            'view_all_request',
            'approve_request',
            'create_request',
            'delete_request',
            'create_user',
            'view_user',
            'edit_user',
            'delete_user',
            'view_eoi',
            'create_eoi',
            'edit_eoi',
            'delete_eoi',
            'apply_eoi',
            'view_submissions_eoi',
            'view_product',
            'edit_product',
            'delete_product',
            'create_product',
            'view_category',
            'edit_category',
            'create_category',
            'delete_category',
            'create_role',
            'delete_role',
            'edit_role',
            'view_role',
            'view_document',
            'create_document',
            'edit_document',
            'delete_document',
            'view_workflow',
            'create_workflow',
            'edit_workflow',
            'delete_workflow',
            'view_report',
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate(['name' => $permission]);
        }

        $adminRole = Role::firstOrCreate(['name' => 'admin']);
        $approverRole = Role::firstOrCreate(['name' => 'approver']);
        $officerRole = Role::firstOrCreate(['name' => 'procurement_officer']);
        $employeeRole = Role::firstOrCreate(['name' => 'employee']);

        $adminRole->givePermissionTo($permissions);

        $approverRole->givePermissionTo([
            'view_request',
            'approve_request',
            'view_report',
            'view_workflow',
            'view_product',
            'view_category',
            'view_eoi',
        ]);

        $officerRole->givePermissionTo([
            'view_request',
            'view_all_request',
            'view_eoi',
            'create_eoi',
            'edit_eoi',
            'view_submissions_eoi',
            'view_product',
            'create_product',
            'view_category',
            'view_document',
            'create_document',
            'view_report',
            'view_workflow',
        ]);

        $employeeRole->givePermissionTo([
            'create_request',
            'view_request',
            'view_product',
            'view_category',
            'view_eoi',
        ]);

        // 2. User Accounts
        $superAdmin = User::create([
            'name' => 'Super Administrator',
            'email' => 'superadmin@example.com',
            'contact' => '9800000001',
            'password' => Hash::make('admin123'),
            'is_superadmin' => true,
        ]);

        $admin = User::create([
            'name' => 'General Administrator',
            'email' => 'admin@example.com',
            'contact' => '9800000002',
            'password' => Hash::make('admin123'),
            'is_superadmin' => false,
        ]);
        $admin->assignRole($adminRole);

        $approver = User::create([
            'name' => 'Department Director (Approver)',
            'email' => 'approver@example.com',
            'contact' => '9800000003',
            'password' => Hash::make('approver123'),
            'is_superadmin' => false,
        ]);
        $approver->assignRole($approverRole);

        $officer = User::create([
            'name' => 'Senior Procurement Officer',
            'email' => 'officer@example.com',
            'contact' => '9800000004',
            'password' => Hash::make('officer123'),
            'is_superadmin' => false,
        ]);
        $officer->assignRole($officerRole);

        $employee = User::create([
            'name' => 'Staff Requester',
            'email' => 'employee@example.com',
            'contact' => '9800000005',
            'password' => Hash::make('employee123'),
            'is_superadmin' => false,
        ]);
        $employee->assignRole($employeeRole);

        // 3. Product Categories
        $catIT = Category::create([
            'name' => 'IT Equipment & Hardware',
            'description' => 'Computing systems, high-end workstations, displays, and peripheral hardware.',
        ]);
        $catFurniture = Category::create([
            'name' => 'Office Furniture & Fixtures',
            'description' => 'Ergonomic chairs, executive desks, conference tables, and filing cabinets.',
        ]);
        $catNetworking = Category::create([
            'name' => 'Networking & Telecommunications',
            'description' => 'Enterprise switches, access points, fiber patch panels, and server racks.',
        ]);
        $catStationery = Category::create([
            'name' => 'Printing & Office Supplies',
            'description' => 'A4 multi-purpose paper reams, laser cartridges, markers, and desk accessories.',
        ]);
        $catSafety = Category::create([
            'name' => 'Safety & Facility Equipment',
            'description' => 'Fire extinguishers, CCTV surveillance, access control, and emergency gear.',
        ]);

        // 4. Products Catalog
        $prodLaptop = Product::create([
            'name' => 'Dell Latitude 5440 Core i7',
            'unit' => 'Pcs',
            'description' => 'Intel Core i7 13th Gen, 16GB DDR5 RAM, 512GB NVMe SSD, 14" FHD Anti-Glare, Backlit Keyboard, 3-Yr Warranty',
            'category_id' => $catIT->id,
        ]);

        $prodMonitor = Product::create([
            'name' => 'Dell UltraSharp 27" 4K Monitor',
            'unit' => 'Pcs',
            'description' => '27-inch 4K UHD (3840x2160), IPS Black, 90W USB-C PD, HDMI 2.1, DisplayPort, Height Adjustable Stand',
            'category_id' => $catIT->id,
        ]);

        $prodChair = Product::create([
            'name' => 'Ergonomic High-Back Mesh Chair',
            'unit' => 'Pcs',
            'description' => 'Breathable Korean mesh, adaptive lumbar support, 3D adjustable armrests, Class-4 gas lift, 135-deg tilt',
            'category_id' => $catFurniture->id,
        ]);

        $prodSwitch = Product::create([
            'name' => 'Cisco Catalyst 24-Port Managed Switch',
            'unit' => 'Pcs',
            'description' => '24-Port Gigabit 10/100/1000 PoE+ (370W), 4x 10G SFP+ Uplinks, Layer 3 Routing, Stacking Support',
            'category_id' => $catNetworking->id,
        ]);

        $prodPaper = Product::create([
            'name' => 'A4 Copy Paper Carton (80 GSM)',
            'unit' => 'Carton',
            'description' => 'Premium 80 GSM High-Brightness Paper, 500 Sheets per Ream, 5 Reams per Heavy-Duty Carton Box',
            'category_id' => $catStationery->id,
        ]);

        $prodPrinter = Product::create([
            'name' => 'HP Enterprise LaserJet Multifunction Printer',
            'unit' => 'Pcs',
            'description' => 'Up to 42 ppm, automatic two-sided printing, 50-sheet ADF scanner, Gigabit Ethernet, AirPrint support',
            'category_id' => $catIT->id,
        ]);

        // 5. Compliance Document Requirements
        $docReg = Document::create([
            'title' => 'Company Registration Certificate',
            'description' => 'Official certificate of company incorporation issued by Office of the Company Registrar.',
        ]);
        $docTax = Document::create([
            'title' => 'Tax Clearance Certificate (FY 2081/82)',
            'description' => 'Valid and certified tax clearance certificate issued by the Inland Revenue Department.',
        ]);
        $docPan = Document::create([
            'title' => 'VAT / PAN Registration Certificate',
            'description' => 'Permanent Account Number (PAN) and Value Added Tax (VAT) registration certificate.',
        ]);
        $docAudit = Document::create([
            'title' => 'Audited Financial Statements (Last 2 Years)',
            'description' => 'Balance sheet, P&L statement, and independent auditor report for preceding 2 fiscal years.',
        ]);
        $docIso = Document::create([
            'title' => 'ISO 9001 / Quality Assurance Certificate',
            'description' => 'Valid ISO or relevant international quality management standard certificate.',
        ]);

        // 6. Multi-Tier Approval Workflows
        // Workflow 1: Micro Requisitions (0 - 50,000)
        $wfTier1 = ApprovalWorkflow::create([
            'name' => 'Tier 1: Routine Minor Purchases',
            'min_amount' => 0,
            'max_amount' => 50000,
        ]);
        ApprovalStep::create([
            'approval_workflow_id' => $wfTier1->id,
            'role_id' => $approverRole->id,
            'step_number' => 1,
            'previous_step_id' => null,
        ]);

        // Workflow 2: Department Procurement (50,001 - 500,000)
        $wfTier2 = ApprovalWorkflow::create([
            'name' => 'Tier 2: Standard Department Procurement',
            'min_amount' => 50001,
            'max_amount' => 500000,
        ]);
        $step2_1 = ApprovalStep::create([
            'approval_workflow_id' => $wfTier2->id,
            'role_id' => $approverRole->id,
            'step_number' => 1,
            'previous_step_id' => null,
        ]);
        $step2_2 = ApprovalStep::create([
            'approval_workflow_id' => $wfTier2->id,
            'role_id' => $adminRole->id,
            'step_number' => 2,
            'previous_step_id' => $step2_1->id,
        ]);

        // Workflow 3: Capital / Enterprise Tenders (500,001 - 5,000,000)
        $wfTier3 = ApprovalWorkflow::create([
            'name' => 'Tier 3: Capital Assets & EOI Tenders',
            'min_amount' => 500001,
            'max_amount' => 5000000,
        ]);
        $step3_1 = ApprovalStep::create([
            'approval_workflow_id' => $wfTier3->id,
            'role_id' => $approverRole->id,
            'step_number' => 1,
            'previous_step_id' => null,
        ]);
        $step3_2 = ApprovalStep::create([
            'approval_workflow_id' => $wfTier3->id,
            'role_id' => $adminRole->id,
            'step_number' => 2,
            'previous_step_id' => $step3_1->id,
        ]);

        // Workflow 4: Major Strategic Outlay (5,000,001 - 999,999,999)
        $wfTier4 = ApprovalWorkflow::create([
            'name' => 'Tier 4: Strategic Global Procurement',
            'min_amount' => 5000001,
            'max_amount' => 999999999,
        ]);
        $step4_1 = ApprovalStep::create([
            'approval_workflow_id' => $wfTier4->id,
            'role_id' => $approverRole->id,
            'step_number' => 1,
            'previous_step_id' => null,
        ]);
        ApprovalStep::create([
            'approval_workflow_id' => $wfTier4->id,
            'role_id' => $adminRole->id,
            'step_number' => 2,
            'previous_step_id' => $step4_1->id,
        ]);

        // 7. Registered Vendors
        $vendor1 = Vendor::create([
            'name' => 'TechNova Solutions Pvt Ltd',
            'email' => 'vendor1@example.com',
            'contact' => '9851012345',
            'address' => 'New Baneshwor, Kathmandu',
            'registration_number' => 'REG-104928',
            'pan_number' => '601294821',
            'registration_date' => '2020-04-12',
            'password' => Hash::make('vendor123'),
            'rating' => 4.8,
            'rating_count' => 28,
        ]);

        $vendor2 = Vendor::create([
            'name' => 'Apex IT Supplies & Hardware',
            'email' => 'vendor2@example.com',
            'contact' => '9851023456',
            'address' => 'Putalisadak, Kathmandu',
            'registration_number' => 'REG-204918',
            'pan_number' => '602381940',
            'registration_date' => '2021-06-18',
            'password' => Hash::make('vendor123'),
            'rating' => 4.2,
            'rating_count' => 19,
        ]);

        $vendor3 = Vendor::create([
            'name' => 'Everest Digital Systems',
            'email' => 'vendor3@example.com',
            'contact' => '9851034567',
            'address' => 'Jawalakhel, Lalitpur',
            'registration_number' => 'REG-304819',
            'pan_number' => '603472918',
            'registration_date' => '2022-01-10',
            'password' => Hash::make('vendor123'),
            'rating' => 3.9,
            'rating_count' => 12,
        ]);

        $vendor4 = Vendor::create([
            'name' => 'Prime Global Logistics & Equipment',
            'email' => 'vendor4@example.com',
            'contact' => '9851045678',
            'address' => 'Biratnagar, Morang',
            'registration_number' => 'REG-405928',
            'pan_number' => '604581927',
            'registration_date' => '2019-11-25',
            'password' => Hash::make('vendor123'),
            'rating' => 4.6,
            'rating_count' => 35,
        ]);

        $vendor5 = Vendor::create([
            'name' => 'Himalayan Office Technologies',
            'email' => 'vendor5@example.com',
            'contact' => '9851056789',
            'address' => 'Chipledhunga, Pokhara',
            'registration_number' => 'REG-506928',
            'pan_number' => '605692018',
            'registration_date' => '2021-09-14',
            'password' => Hash::make('vendor123'),
            'rating' => 4.4,
            'rating_count' => 22,
        ]);

        // 8. Purchase Requests
        // PR 1: 10 Laptops & 10 Monitors -> Total Rs. 1,620,000 (Approved & converted to EOI #1)
        $pr1 = PurchaseRequest::create([
            'user_id' => $employee->id,
            'total' => 1620000,
            'status' => 'published',
        ]);
        $prItem1_1 = PurchaseRequestItem::create([
            'purchase_request_id' => $pr1->id,
            'product_id' => $prodLaptop->id,
            'quantity' => 10,
            'price' => 120000,
            'specifications' => 'Dell Latitude 5440 i7 / 16GB / 512GB SSD',
            'priority' => 'high',
            'selected' => true,
        ]);
        $prItem1_2 = PurchaseRequestItem::create([
            'purchase_request_id' => $pr1->id,
            'product_id' => $prodMonitor->id,
            'quantity' => 10,
            'price' => 42000,
            'specifications' => 'Dell UltraSharp 27" 4K USB-C Displays',
            'priority' => 'high',
            'selected' => true,
        ]);

        // Attach approval steps to PR 1 (Tier 3: Approver then Admin)
        RequestApprovals::create([
            'purchase_request_id' => $pr1->id,
            'approval_step_id' => $step3_1->id,
            'approver_id' => $approver->id,
            'status' => 'approved',
            'remark' => 'Technical specifications and pricing approved.',
        ]);
        RequestApprovals::create([
            'purchase_request_id' => $pr1->id,
            'approval_step_id' => $step3_2->id,
            'approver_id' => $admin->id,
            'status' => 'approved',
            'remark' => 'Final procurement clearance granted.',
        ]);

        // PR 2: 6 Managed Network Switches -> Total Rs. 570,000 (Approved & converted to EOI #2)
        $pr2 = PurchaseRequest::create([
            'user_id' => $employee->id,
            'total' => 570000,
            'status' => 'published',
        ]);
        $prItem2_1 = PurchaseRequestItem::create([
            'purchase_request_id' => $pr2->id,
            'product_id' => $prodSwitch->id,
            'quantity' => 6,
            'price' => 95000,
            'specifications' => 'Cisco Catalyst 24-Port Gigabit PoE+ Managed Switch',
            'priority' => 'high',
            'selected' => true,
        ]);
        // Attach approval steps to PR 2 (Tier 3: Approver then Admin)
        RequestApprovals::create([
            'purchase_request_id' => $pr2->id,
            'approval_step_id' => $step3_1->id,
            'approver_id' => $approver->id,
            'status' => 'approved',
            'remark' => 'Approved by Department Director.',
        ]);
        RequestApprovals::create([
            'purchase_request_id' => $pr2->id,
            'approval_step_id' => $step3_2->id,
            'approver_id' => $admin->id,
            'status' => 'approved',
            'remark' => 'Approved for tender publication.',
        ]);

        // PR 3: Pending Approval Request for Chairs and Paper -> Total Rs. 140,500
        $pr3 = PurchaseRequest::create([
            'user_id' => $employee->id,
            'total' => 140500,
            'status' => 'pending',
        ]);
        PurchaseRequestItem::create([
            'purchase_request_id' => $pr3->id,
            'product_id' => $prodChair->id,
            'quantity' => 6,
            'price' => 18500,
            'specifications' => 'Ergonomic high-back mesh chairs for finance unit',
            'priority' => 'medium',
            'selected' => false,
        ]);
        PurchaseRequestItem::create([
            'purchase_request_id' => $pr3->id,
            'product_id' => $prodPaper->id,
            'quantity' => 9,
            'price' => 3200,
            'specifications' => 'A4 80 GSM copy paper reams',
            'priority' => 'low',
            'selected' => false,
        ]);
        // Attach approval steps to PR 3 (Tier 2: Step 1 approver pending, Step 2 admin pending)
        RequestApprovals::create([
            'purchase_request_id' => $pr3->id,
            'approval_step_id' => $step2_1->id,
            'status' => 'pending',
            'remark' => null,
        ]);
        RequestApprovals::create([
            'purchase_request_id' => $pr3->id,
            'approval_step_id' => $step2_2->id,
            'status' => 'pending',
            'remark' => null,
        ]);

        // Approved Requisitions for Smart Tender Packaging (Bin Packing BFD)
        // PR 4: IT Dept - 8 Laptops (Rs. 960,000)
        $pr4 = PurchaseRequest::create([
            'user_id' => $employee->id,
            'total' => 960000,
            'status' => 'approved',
        ]);
        PurchaseRequestItem::create([
            'purchase_request_id' => $pr4->id,
            'product_id' => $prodLaptop->id,
            'quantity' => 8,
            'price' => 120000,
            'specifications' => 'Dell Latitude 5440 i7 for Engineering team',
            'priority' => 'high',
            'selected' => false,
        ]);
        RequestApprovals::create([
            'purchase_request_id' => $pr4->id,
            'approval_step_id' => $step3_1->id,
            'approver_id' => $approver->id,
            'status' => 'approved',
            'remark' => 'Approved budget allocation.',
        ]);

        // PR 5: Network Dept - 5 Managed Cisco Switches (Rs. 475,000)
        $pr5 = PurchaseRequest::create([
            'user_id' => $employee->id,
            'total' => 475000,
            'status' => 'approved',
        ]);
        PurchaseRequestItem::create([
            'purchase_request_id' => $pr5->id,
            'product_id' => $prodSwitch->id,
            'quantity' => 5,
            'price' => 95000,
            'specifications' => 'Cisco Catalyst 24-Port Switches for Branch Office',
            'priority' => 'high',
            'selected' => false,
        ]);
        RequestApprovals::create([
            'purchase_request_id' => $pr5->id,
            'approval_step_id' => $step2_1->id,
            'approver_id' => $approver->id,
            'status' => 'approved',
            'remark' => 'Network capacity expansion approved.',
        ]);

        // PR 6: Administration - 20 Ergonomic Mesh Chairs (Rs. 370,000)
        $pr6 = PurchaseRequest::create([
            'user_id' => $employee->id,
            'total' => 370000,
            'status' => 'approved',
        ]);
        PurchaseRequestItem::create([
            'purchase_request_id' => $pr6->id,
            'product_id' => $prodChair->id,
            'quantity' => 20,
            'price' => 18500,
            'specifications' => 'Ergonomic high-back chairs for new floor workstations',
            'priority' => 'medium',
            'selected' => false,
        ]);
        RequestApprovals::create([
            'purchase_request_id' => $pr6->id,
            'approval_step_id' => $step2_1->id,
            'approver_id' => $approver->id,
            'status' => 'approved',
            'remark' => 'Admin facility setup cleared.',
        ]);

        // PR 7: Printing Unit - 4 Enterprise Multifunction Printers (Rs. 360,000)
        $pr7 = PurchaseRequest::create([
            'user_id' => $employee->id,
            'total' => 360000,
            'status' => 'approved',
        ]);
        PurchaseRequestItem::create([
            'purchase_request_id' => $pr7->id,
            'product_id' => $prodPrinter->id,
            'quantity' => 4,
            'price' => 90000,
            'specifications' => 'HP Enterprise LaserJet Multifunction Printers',
            'priority' => 'medium',
            'selected' => false,
        ]);
        RequestApprovals::create([
            'purchase_request_id' => $pr7->id,
            'approval_step_id' => $step2_1->id,
            'approver_id' => $approver->id,
            'status' => 'approved',
            'remark' => 'Documentation printing upgrade approved.',
        ]);

        // PR 8: Design Dept - 5 UltraSharp 4K Displays (Rs. 210,000)
        $pr8 = PurchaseRequest::create([
            'user_id' => $employee->id,
            'total' => 210000,
            'status' => 'approved',
        ]);
        PurchaseRequestItem::create([
            'purchase_request_id' => $pr8->id,
            'product_id' => $prodMonitor->id,
            'quantity' => 5,
            'price' => 42000,
            'specifications' => 'Dell UltraSharp 27" 4K UHD Monitors',
            'priority' => 'high',
            'selected' => false,
        ]);
        RequestApprovals::create([
            'purchase_request_id' => $pr8->id,
            'approval_step_id' => $step2_1->id,
            'approver_id' => $approver->id,
            'status' => 'approved',
            'remark' => 'CAD / Design display approval.',
        ]);

        // PR 9: Communications & Security - Safety Equipment (Rs. 550,000)
        $pr9 = PurchaseRequest::create([
            'user_id' => $employee->id,
            'total' => 550000,
            'status' => 'approved',
        ]);
        PurchaseRequestItem::create([
            'purchase_request_id' => $pr9->id,
            'product_id' => $prodSwitch->id,
            'quantity' => 4,
            'price' => 95000,
            'specifications' => 'Cisco switches for Security CCTV monitoring',
            'priority' => 'high',
            'selected' => false,
        ]);
        PurchaseRequestItem::create([
            'purchase_request_id' => $pr9->id,
            'product_id' => $prodMonitor->id,
            'quantity' => 4,
            'price' => 42500,
            'specifications' => 'Surveillance console displays',
            'priority' => 'medium',
            'selected' => false,
        ]);
        RequestApprovals::create([
            'purchase_request_id' => $pr9->id,
            'approval_step_id' => $step3_1->id,
            'approver_id' => $approver->id,
            'status' => 'approved',
            'remark' => 'Campus security modernization.',
        ]);

        // PR 10: Office Logistics - 45 Cartons A4 Copy Paper (Rs. 144,000)
        $pr10 = PurchaseRequest::create([
            'user_id' => $employee->id,
            'total' => 144000,
            'status' => 'approved',
        ]);
        PurchaseRequestItem::create([
            'purchase_request_id' => $pr10->id,
            'product_id' => $prodPaper->id,
            'quantity' => 45,
            'price' => 3200,
            'specifications' => 'A4 80 GSM heavy duty copy paper cartons',
            'priority' => 'low',
            'selected' => false,
        ]);
        RequestApprovals::create([
            'purchase_request_id' => $pr10->id,
            'approval_step_id' => $step2_1->id,
            'approver_id' => $approver->id,
            'status' => 'approved',
            'remark' => 'Quarterly office supplies.',
        ]);

        // PR 11: Enterprise Data Center - Core Backbone Switch (Rs. 1,250,000)
        $pr11 = PurchaseRequest::create([
            'user_id' => $employee->id,
            'total' => 1250000,
            'status' => 'approved',
        ]);
        PurchaseRequestItem::create([
            'purchase_request_id' => $pr11->id,
            'product_id' => $prodSwitch->id,
            'quantity' => 10,
            'price' => 125000,
            'specifications' => 'High-Density 48-Port 10G/40G Modular Core Switch',
            'priority' => 'high',
            'selected' => false,
        ]);
        RequestApprovals::create([
            'purchase_request_id' => $pr11->id,
            'approval_step_id' => $step3_1->id,
            'approver_id' => $approver->id,
            'status' => 'approved',
            'remark' => 'Approved by Director and Admin for Data Center upgrade.',
        ]);

        // 9. Expressions of Interest (EOIs)

        // EOI #1: Closed for Evaluation (4 competing bids to showcase TOPSIS Decision Science)
        $eoi1 = Eoi::create([
            'title' => 'Procurement of High-Performance Laptops and 4K Displays for Engineering Department',
            'eoi_number' => 'EOI-2026-001',
            'description' => 'Competitive bidding for supply, delivery, and warranty support of enterprise laptops and high-resolution monitors.',
            'published_date' => Carbon::now()->subDays(25)->toDateString(),
            'deadline_date' => Carbon::now()->subDays(3)->toDateString(),
            'status' => 'closed',
        ]);
        $pr1->eoi_id = $eoi1->id;
        $pr1->save();
        $prItem1_1->eoi_id = $eoi1->id;
        $prItem1_1->save();
        $prItem1_2->eoi_id = $eoi1->id;
        $prItem1_2->save();

        // Attach required compliance documents to EOI #1
        EoiDocument::create(['eoi_id' => $eoi1->id, 'document_id' => $docReg->id, 'required' => true]);
        EoiDocument::create(['eoi_id' => $eoi1->id, 'document_id' => $docTax->id, 'required' => true]);
        EoiDocument::create(['eoi_id' => $eoi1->id, 'document_id' => $docPan->id, 'required' => true]);
        EoiDocument::create(['eoi_id' => $eoi1->id, 'document_id' => $docIso->id, 'required' => false]);

        // 4 Competing Vendor Applications on EOI #1:
        // Application 1: TechNova Solutions (Strong Balanced Contender: 4.8 Rating, 13 Days, Rs. 1,580,000)
        $app1 = EoiVendorApplication::create([
            'eoi_id' => $eoi1->id,
            'vendor_id' => $vendor1->id,
            'status' => 'pending',
            'application_date' => Carbon::now()->subDays(10)->toDateString(),
            'delivery_date' => Carbon::now()->addDays(13)->toDateString(),
        ]);
        EoiVendorProposal::create([
            'eoi_vendor_application_id' => $app1->id,
            'purchase_request_item_id' => $prItem1_1->id,
            'price' => 118000, // 10 * 118000 = 1,180,000
        ]);
        EoiVendorProposal::create([
            'eoi_vendor_application_id' => $app1->id,
            'purchase_request_item_id' => $prItem1_2->id,
            'price' => 40000, // 10 * 40000 = 400,000 => Total Rs. 1,580,000
        ]);
        EoiVendorDocument::create(['eoi_vendor_application_id' => $app1->id, 'document_id' => $docReg->id, 'name' => 'seed_technova_reg.pdf']);
        EoiVendorDocument::create(['eoi_vendor_application_id' => $app1->id, 'document_id' => $docTax->id, 'name' => 'seed_technova_tax.pdf']);
        EoiVendorDocument::create(['eoi_vendor_application_id' => $app1->id, 'document_id' => $docPan->id, 'name' => 'seed_technova_pan.pdf']);
        EoiVendorDocument::create(['eoi_vendor_application_id' => $app1->id, 'document_id' => $docIso->id, 'name' => 'seed_technova_iso.pdf']);

        // Application 2: Apex IT Supplies (Price Leader: Lowest Price Rs. 1,480,000, 30 Days delivery, 4.2 Rating)
        $app2 = EoiVendorApplication::create([
            'eoi_id' => $eoi1->id,
            'vendor_id' => $vendor2->id,
            'status' => 'pending',
            'application_date' => Carbon::now()->subDays(8)->toDateString(),
            'delivery_date' => Carbon::now()->addDays(30)->toDateString(),
        ]);
        EoiVendorProposal::create([
            'eoi_vendor_application_id' => $app2->id,
            'purchase_request_item_id' => $prItem1_1->id,
            'price' => 110000, // 10 * 110000 = 1,100,000
        ]);
        EoiVendorProposal::create([
            'eoi_vendor_application_id' => $app2->id,
            'purchase_request_item_id' => $prItem1_2->id,
            'price' => 38000, // 10 * 38000 = 380,000 => Total Rs. 1,480,000 (Lowest!)
        ]);
        EoiVendorDocument::create(['eoi_vendor_application_id' => $app2->id, 'document_id' => $docReg->id, 'name' => 'seed_apex_reg.pdf']);
        EoiVendorDocument::create(['eoi_vendor_application_id' => $app2->id, 'document_id' => $docTax->id, 'name' => 'seed_apex_tax.pdf']);
        EoiVendorDocument::create(['eoi_vendor_application_id' => $app2->id, 'document_id' => $docPan->id, 'name' => 'seed_apex_pan.pdf']);

        // Application 3: Everest Digital Systems (Speed Leader: 7 Days Delivery, Rs. 1,690,000, 3.9 Rating)
        $app3 = EoiVendorApplication::create([
            'eoi_id' => $eoi1->id,
            'vendor_id' => $vendor3->id,
            'status' => 'pending',
            'application_date' => Carbon::now()->subDays(7)->toDateString(),
            'delivery_date' => Carbon::now()->addDays(7)->toDateString(),
        ]);
        EoiVendorProposal::create([
            'eoi_vendor_application_id' => $app3->id,
            'purchase_request_item_id' => $prItem1_1->id,
            'price' => 125000, // 10 * 125000 = 1,250,000
        ]);
        EoiVendorProposal::create([
            'eoi_vendor_application_id' => $app3->id,
            'purchase_request_item_id' => $prItem1_2->id,
            'price' => 44000, // 10 * 44000 = 440,000 => Total Rs. 1,690,000
        ]);
        EoiVendorDocument::create(['eoi_vendor_application_id' => $app3->id, 'document_id' => $docReg->id, 'name' => 'seed_everest_reg.pdf']);
        EoiVendorDocument::create(['eoi_vendor_application_id' => $app3->id, 'document_id' => $docTax->id, 'name' => 'seed_everest_tax.pdf']);
        EoiVendorDocument::create(['eoi_vendor_application_id' => $app3->id, 'document_id' => $docPan->id, 'name' => 'seed_everest_pan.pdf']);
        EoiVendorDocument::create(['eoi_vendor_application_id' => $app3->id, 'document_id' => $docIso->id, 'name' => 'seed_everest_iso.pdf']);

        // Application 4: Prime Global (High Quality & Reliability: 4.6 Rating, 15 Days, Rs. 1,535,000)
        $app4 = EoiVendorApplication::create([
            'eoi_id' => $eoi1->id,
            'vendor_id' => $vendor4->id,
            'status' => 'pending',
            'application_date' => Carbon::now()->subDays(5)->toDateString(),
            'delivery_date' => Carbon::now()->addDays(15)->toDateString(),
        ]);
        EoiVendorProposal::create([
            'eoi_vendor_application_id' => $app4->id,
            'purchase_request_item_id' => $prItem1_1->id,
            'price' => 114000, // 1,140,000
        ]);
        EoiVendorProposal::create([
            'eoi_vendor_application_id' => $app4->id,
            'purchase_request_item_id' => $prItem1_2->id,
            'price' => 39500, // 395,000 => Total Rs. 1,535,000
        ]);
        EoiVendorDocument::create(['eoi_vendor_application_id' => $app4->id, 'document_id' => $docReg->id, 'name' => 'seed_prime_reg.pdf']);
        EoiVendorDocument::create(['eoi_vendor_application_id' => $app4->id, 'document_id' => $docTax->id, 'name' => 'seed_prime_tax.pdf']);
        EoiVendorDocument::create(['eoi_vendor_application_id' => $app4->id, 'document_id' => $docPan->id, 'name' => 'seed_prime_pan.pdf']);
        EoiVendorDocument::create(['eoi_vendor_application_id' => $app4->id, 'document_id' => $docIso->id, 'name' => 'seed_prime_iso.pdf']);

        // EOI #2: Published / Active Open Tender (Accepting bids)
        $eoi2 = Eoi::create([
            'title' => 'Supply & Installation of Core Managed Network Switches and Infrastructure',
            'eoi_number' => 'EOI-2026-002',
            'description' => 'Procurement of Layer-3 PoE+ managed switches and server room fiber patch infrastructure.',
            'published_date' => Carbon::now()->subDays(5)->toDateString(),
            'deadline_date' => Carbon::now()->addDays(20)->toDateString(),
            'status' => 'published',
        ]);
        $pr2->eoi_id = $eoi2->id;
        $pr2->save();
        $prItem2_1->eoi_id = $eoi2->id;
        $prItem2_1->save();

        EoiDocument::create(['eoi_id' => $eoi2->id, 'document_id' => $docReg->id, 'required' => true]);
        EoiDocument::create(['eoi_id' => $eoi2->id, 'document_id' => $docTax->id, 'required' => true]);
        EoiDocument::create(['eoi_id' => $eoi2->id, 'document_id' => $docPan->id, 'required' => true]);

        // 1 vendor has already bid on EOI #2
        $appEoi2 = EoiVendorApplication::create([
            'eoi_id' => $eoi2->id,
            'vendor_id' => $vendor1->id,
            'status' => 'pending',
            'application_date' => Carbon::now()->subDays(2)->toDateString(),
            'delivery_date' => Carbon::now()->addDays(14)->toDateString(),
        ]);
        EoiVendorProposal::create([
            'eoi_vendor_application_id' => $appEoi2->id,
            'purchase_request_item_id' => $prItem2_1->id,
            'price' => 92000,
        ]);
        EoiVendorDocument::create(['eoi_vendor_application_id' => $appEoi2->id, 'document_id' => $docReg->id, 'name' => 'seed_switch_reg.pdf']);
        EoiVendorDocument::create(['eoi_vendor_application_id' => $appEoi2->id, 'document_id' => $docTax->id, 'name' => 'seed_switch_tax.pdf']);
        EoiVendorDocument::create(['eoi_vendor_application_id' => $appEoi2->id, 'document_id' => $docPan->id, 'name' => 'seed_switch_pan.pdf']);

        // EOI #3: Published / Active Open Tender
        $eoi3 = Eoi::create([
            'title' => 'Annual Supply of Ergonomic Workplace Seating & Furniture',
            'eoi_number' => 'EOI-2026-003',
            'description' => 'Annual rate contract for high-back breathable mesh ergonomic office chairs with lumbar support.',
            'published_date' => Carbon::now()->subDays(2)->toDateString(),
            'deadline_date' => Carbon::now()->addDays(28)->toDateString(),
            'status' => 'published',
        ]);
        EoiDocument::create(['eoi_id' => $eoi3->id, 'document_id' => $docReg->id, 'required' => true]);
        EoiDocument::create(['eoi_id' => $eoi3->id, 'document_id' => $docTax->id, 'required' => true]);
    }
}
