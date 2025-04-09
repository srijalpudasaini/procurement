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
            // new Middleware('permission:view_workflow', only: ['index']),
            // new Middleware('permission:create_workflow', only: ['create','store']),
            // new Middleware('permission:edit_workflow', only: ['edit','update']),
            // new Middleware('permission:delete_workflow', only: ['destroy']),
        ];
    }
    public function index(Request $request)
    {
        $approval_workflows = $this->approvalWorkflowRepository->all($request->input('per_page', 10));

        return Inertia::render('ApprovalWorkflows/ApprovalWorkflows', compact('approval_workflows'));
    }
    public function create()
    {
        $roles = Role::permission('approve_request')->get();
        return Inertia::render('ApprovalWorkflows/AddApprovalWorkflow', compact('roles'));
    }

    public function store(ApprovalWorkflowRequest $request)
    {
        DB::beginTransaction();
        try {
            $approval = $this->approvalWorkflowRepository->store($request->validated());

            $previousStepId = null;
            $steps = collect($request->steps)->sortBy('step');

            foreach ($steps as $step) {
                $createdStep = ApprovalStep::create([
                    'approval_workflow_id' => $approval->id,
                    'step_number' => $step['step'],
                    'role_id' => $step['role_id'],
                    'previous_step_id' => $previousStepId
                ]);

                $previousStepId = $createdStep->id;
            }

            DB::commit();
            return redirect()->route('approval-workflows.index')->with('success', 'Workflow created successfully!');
        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->route('approval-workflows.index')->with('error', $e->getMessage());
        }
    }

    public function edit($id)
    {
        $approval_workflow = $this->approvalWorkflowRepository->find($id, 'steps');
        $roles = Role::permission('approve_request')->get();
        return Inertia::render('ApprovalWorkflows/EditApprovalWorkflow', compact('approval_workflow', 'roles'));
    }
    public function update(ApprovalWorkflowRequest $request, $id)
    {
        DB::beginTransaction();
        try {
            $approval = $this->approvalWorkflowRepository->update($id, $request->validated());

            // Get current steps and sort by step number
            $currentSteps = ApprovalStep::where('approval_workflow_id', $id)
                ->orderBy('step_number')
                ->get()
                ->keyBy('step_number');

            $previousStepId = null;
            $sortedSteps = collect($request->steps)->sortBy('step');

            foreach ($sortedSteps as $stepData) {
                if (isset($currentSteps[$stepData['step']])) {
                    // Update existing step
                    $currentSteps[$stepData['step']]->update([
                        'role_id' => $stepData['role_id'],
                        'previous_step_id' => $previousStepId
                    ]);
                    $previousStepId = $currentSteps[$stepData['step']]->id;
                } else {
                    // Create new step
                    $createdStep = ApprovalStep::create([
                        'approval_workflow_id' => $id,
                        'step_number' => $stepData['step'],
                        'role_id' => $stepData['role_id'],
                        'previous_step_id' => $previousStepId
                    ]);
                    $previousStepId = $createdStep->id;
                }
            }

            // Delete steps not in the submitted list
            $submittedStepNumbers = $sortedSteps->pluck('step')->toArray();
            ApprovalStep::where('approval_workflow_id', $id)
                ->whereNotIn('step_number', $submittedStepNumbers)
                ->delete();

            // Rebuild previous_step_id chain in case steps were deleted
            $this->rebuildStepChain($id);

            DB::commit();
            return redirect()->route('approval-workflows.index')->with('success', 'Workflow updated successfully!');
        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->route('approval-workflows.index')->with('error', $e->getMessage());
        }
    }

    protected function rebuildStepChain($workflowId)
    {
        $steps = ApprovalStep::where('approval_workflow_id', $workflowId)
            ->orderBy('step_number')
            ->get();

        $previousStepId = null;
        foreach ($steps as $step) {
            $step->update(['previous_step_id' => $previousStepId]);
            $previousStepId = $step->id;
        }
    }

    public function destroy($id)
    {
        try {
            $this->approvalWorkflowRepository->delete($id);
            return redirect()->route('approval-workflows.index')->with('success', 'Workflow deleted successfully!');
        } catch (\Exception $e) {
            return redirect()->route('approval-workflows.index')->with('error', $e->getMessage());
        }
    }
}
