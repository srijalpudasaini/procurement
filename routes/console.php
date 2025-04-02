<?php

use App\Jobs\UpdateEOIStatusJob;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Foundation\Bus\DispatchesJobs;


Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');
Artisan::command('eoi:update-status', function () {
    dispatch(new UpdateEOIStatusJob());
})->hourly();
