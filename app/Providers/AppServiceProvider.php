<?php

namespace App\Providers;

use App\Interfaces\CategoryInterface;
use App\Interfaces\Interfaces\PermissionInterface;
use App\Interfaces\ProductInterface;
use App\Interfaces\RoleInterface;
use App\Interfaces\UserInterface;
use App\Repositories\CategoryRepository;
use App\Repositories\PermissionRepository;
use App\Repositories\ProductRepository;
use App\Repositories\RoleRepository;
use App\Repositories\UserRepository;
use Illuminate\Support\Facades\Vite;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->bind(CategoryInterface::class,CategoryRepository::class);
        $this->app->bind(ProductInterface::class,ProductRepository::class);
        $this->app->bind(RoleInterface::class,RoleRepository::class);
        $this->app->bind(UserInterface::class,UserRepository::class);
        $this->app->bind(PermissionInterface::class,PermissionRepository::class);
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Vite::prefetch(concurrency: 3);
    }
}
