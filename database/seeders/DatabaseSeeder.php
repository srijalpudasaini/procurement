<?php

namespace Database\Seeders;

use App\Models\User;
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

        User::create([
            'name' => 'Super Admin',
            'email' => 'superadmin@example.com',
            'contact' => '9810008988',
            'password' => Hash::make('admin123'),
            'is_superadmin' => true,
        ]);
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
            'view_report'
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate(['name' => $permission]);
        }

        $adminRole = Role::firstOrCreate(['name' => 'admin']);
        $employeeRole = Role::firstOrCreate(['name' => 'employee']);

        $adminRole->givePermissionTo($permissions); 

        $employee->assignRole($employeeRole);
        $admin->assignRole($adminRole);

        $employeeRole->givePermissionTo([
            'create_request',
            'view_product',
            'view_category',
            'view_request',
        ]);
    }
}
