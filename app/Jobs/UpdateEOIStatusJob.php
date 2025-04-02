<?php

namespace App\Jobs;

use App\Models\Eoi;
use Carbon\Carbon;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

class UpdateEOIStatusJob implements ShouldQueue
{
    use Queueable;

    /**
     * Create a new job instance.
     */
    public function __construct()
    {
        //
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        Eoi::where('deadline', '<', Carbon::now())
            ->where('status', '!=', 'closed')
            ->update(['status' => 'closed']);
    }
}
