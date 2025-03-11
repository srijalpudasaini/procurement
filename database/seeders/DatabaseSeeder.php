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
            'create_requests',
            'approve_requests',
            'manage_users',
            'manage_eoi',
            'manage_products',
            'manage_categories',
            'manage_approvals',
            'apply_eoi',
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
            'create_requests',
        ]);

        $vendorRole->givePermissionTo([
            'apply_eoi'
        ]);
    }
}
