<?php

namespace Database\Seeders;

use App\Models\User;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // User::factory(10)->create();

        $admin = User::create([
            'name' => 'Admin',
            'email' => 'admin@example.com',
            'contact' => '9810008986',
            'password' => Hash::make('admin123'),
        ]);
        $employee = User::create([
            'name' => 'Employee',
            'email' => 'employee@example.com',
            'contact' => '9810008987',
            'password' => Hash::make('employee123'),
        ]);

        $permissions = [
            'view_request',
            'create_request',
            'approve_request',
            'create_user',
            'view_user',
            'edit_user',
            'delete_user',
            'view_eoi',
            'create_eoi',
            'edit_eoi',
            'delete_eoi',
            'view_product',
            'edit_product',
            'delete_product',
            'create_product',
            'view_category',
            'edit_category',
            'create_category',
            'delete_category',
            'apply_eoi',
            'view_aoi',
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate(['name' => $permission]);
        }

        $adminRole = Role::firstOrCreate(['name' => 'admin']);
        $employeeRole = Role::firstOrCreate(['name' => 'employee']);
        $vendorRole = Role::firstOrCreate(['name' => 'vendor']);

        $adminRole->givePermissionTo($permissions); 

        $admin->assignRole($adminRole);
        $employee->assignRole($employeeRole);

        $employeeRole->givePermissionTo([
            'create_request',
            'view_request',
            'view_product',
            'view_category',
        ]);

        $vendorRole->givePermissionTo([
            'apply_eoi'
        ]);
    }
}
