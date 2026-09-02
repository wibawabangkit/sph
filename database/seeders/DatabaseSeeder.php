<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // 1. SEED COMPANIES
        DB::table('master_companies')->insert([
            [
                'id' => 1,
                'company_code' => 'HEKSA',
                'company_name' => 'PT. HEKSA UTAMA',
                'legal_name' => 'PT. HEKSA UTAMA KREASI',
                'address' => 'Jl. Merdeka Selatan No. 88, Jakarta Selatan',
                'phone' => '021-5551234',
                'email' => 'info@heksa.co.id',
                'npwp' => '01.234.567.8-012.000',
                'default_signer_name' => 'Budi Santoso, S.T.',
                'default_signer_role' => 'Direktur Utama',
                'bank_name' => 'Bank Mandiri',
                'bank_account_no' => '123-00-998877-1',
                'bank_account_name' => 'PT HEKSA UTAMA KREASI',
                'doc_prefix' => 'SPH',
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'id' => 2,
                'company_code' => 'WITACA',
                'company_name' => 'PT WITACA BANGKIT UTAMA',
                'legal_name' => 'PT WITACA BANGKIT UTAMA',
                'address' => 'Jl. Sudirman No. 45, Jakarta Pusat',
                'phone' => '021-7778899',
                'email' => 'info@witaca.co.id',
                'npwp' => '02.999.888.7-011.000',
                'default_signer_name' => 'Ahmad Kusuma, M.M.',
                'default_signer_role' => 'Direktur Utama',
                'bank_name' => 'Bank BCA',
                'bank_account_no' => '888-11-223344-9',
                'bank_account_name' => 'PT WITACA BANGKIT UTAMA',
                'doc_prefix' => 'SPH',
                'created_at' => now(),
                'updated_at' => now()
            ]
        ]);

        // 2. SEED USERS
        $passwordHash = Hash::make('Admin123!');

        DB::table('users')->insert([
            [
                'id' => 1,
                'company_id' => null,
                'username' => 'superadmin',
                'email' => 'admin@system.local',
                'password' => $passwordHash,
                'full_name' => 'System Super Admin',
                'role' => 'SUPER_ADMIN',
                'status' => 'active',
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'id' => 2,
                'company_id' => 1,
                'username' => 'irham',
                'email' => 'irham@gmail.com',
                'password' => $passwordHash,
                'full_name' => 'Irham Maulana',
                'role' => 'COMPANY_ADMIN',
                'status' => 'active',
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'id' => 3,
                'company_id' => 2,
                'username' => 'ahm',
                'email' => 'ahm@gmail.com',
                'password' => $passwordHash,
                'full_name' => 'Ahmad Kusuma',
                'role' => 'COMPANY_ADMIN',
                'status' => 'active',
                'created_at' => now(),
                'updated_at' => now()
            ]
        ]);

        // 3. SEED MASTER CUSTOMERS
        DB::table('master_customers')->insert([
            [
                'id' => 1,
                'company_id' => 2, // Owned by PT WITACA BANGKIT UTAMA (ahm)
                'code' => 'ACSI',
                'company_name' => 'PT Aeon Credit Service Indonesia',
                'contact_person' => 'DENI MITA (08123912442)',
                'address' => 'Jl APAPAPA',
                'phone' => '08123912442',
                'email' => 'contact@aeon.co.id',
                'npwp' => '01.888.777.6-000.000',
                'created_at' => now(),
                'updated_at' => now()
            ]
        ]);
    }
}
