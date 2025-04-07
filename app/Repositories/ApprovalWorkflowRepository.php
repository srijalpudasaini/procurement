<?php 
namespace App\Repositories;

use App\Models\ApprovalWorkflow;

class ApprovalWorkflowRepository extends BaseRepository
{

    public function __construct(ApprovalWorkflow $approvalWork){
        parent::__construct($approvalWork);
    }
}
