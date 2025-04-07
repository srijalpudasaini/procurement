<?php

namespace App\Http\Controllers;

use App\Http\Requests\ApprovalWorkflowRequest;
use App\Models\ApprovalStep;
use App\Repositories\ApprovalWorkflowRepository;
use Illuminate\Http\Request;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Spatie\Permission\Models\Role;

class ApprovalWorkflowController extends Controller implements HasMiddleware
{
    protected $approvalWorkflowRepository;

    public function __construct(ApprovalWorkflowRepository $approvalWorkflowRepository)
    {
        $this->approvalWorkflowRepository = $approvalWorkflowRepository;
    }

    public static function middleware(): array
    {
        return [
            // new Middleware('permission:view_category', only: ['index']),
            // new Middleware('permission:create_category', only: ['create','store']),
            // new Middleware('permission:edit_category', only: ['edit','update']),
            // new Middleware('permission:delete_category', only: ['destroy']),
        ];
    }
    public function index(Request $request)
    {
        $approval_workflows = $this->approvalWorkflowRepository->all($request->input('per_page', 10));

        return Inertia::render('ApprovalWorkflows/ApprovalWorkflows', compact('approval_workflows'));
    }
    public function create()
    {
        $roles = Role::all();
        return Inertia::render('ApprovalWorkflows/AddApprovalWorkflow', compact('roles'));
    }

    public function store(ApprovalWorkflowRequest $request)
    {

        DB::beginTransaction();
        try {
            $approval = $this->approvalWorkflowRepository->store($request->validated());

            foreach ($request->steps as $step) {
                ApprovalStep::create(array_merge(['approval_workflow_id' => $approval->id, 'step_number' => $step['step'], 'role_id' => $step['role_id'],]));
            }
            DB::commit();
            return redirect()->route('approval_workflows.index')->with('success', 'Workflow created successfully!');
        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->route('approval_workflows.index')->with('error', $e->getMessage());
        }
    }

    public function edit($id)
    {
        $approval_workflow = $this->approvalWorkflowRepository->find($id, 'steps');
        $roles = Role::all();
        return Inertia::render('ApprovalWorkflows/EditApprovalWorkflow', compact('approval_workflow', 'roles'));
    }
    public function update(ApprovalWorkflowRequest $request, $id)
    {
        try {
            $approval = $this->approvalWorkflowRepository->update($id, $request->validated());
            $currentSteps = ApprovalStep::where('approval_workflow_id', $id)
                ->get()
                ->keyBy('step_number');

            foreach ($request->steps as $step) {
                if (isset($currentSteps[$step['step']])) {
                    $currentSteps[$step['step']]->update([
                        'role_id' => $step['role_id']
                    ]);
                } else {
                    ApprovalStep::create([
                        'approval_workflow_id' => $id,
                        'step_number' => $step['step'],
                        'role_id' => $step['role_id']
                    ]);
                }
            }

            $submittedStepNumbers = collect($request->steps)->pluck('step')->toArray();
            ApprovalStep::where('approval_workflow_id', $id)
                ->whereNotIn('step_number', $submittedStepNumbers)
                ->delete();
            return redirect()->route('approval_workflows.index')->with('success', 'Workflow updated successfully!');
        } catch (\Exception $e) {
            return redirect()->route('approval_workflows.index')->with('error', $e->getMessage());
        }
    }

    public function destroy($id)
    {
        try {
            $this->approvalWorkflowRepository->delete($id);
            return redirect()->route('approval_workflows.index')->with('success', 'Workflow deleted successfully!');
        } catch (\Exception $e) {
            return redirect()->route('approval_workflows.index')->with('error', $e->getMessage());
        }
    }
}
