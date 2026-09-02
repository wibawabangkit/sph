<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Company extends Model
{
    use HasFactory;

    protected $table = 'master_companies';

    protected $fillable = [
        'company_code', 'company_name', 'legal_name', 'address', 'phone', 'email', 
        'npwp', 'logo_data', 'stamp_data', 'default_signer_name', 'default_signer_role', 
        'bank_name', 'bank_account_no', 'bank_account_name', 'doc_prefix'
    ];

    public function users()
    {
        return $this->hasMany(User::class, 'company_id');
    }

    public function customers()
    {
        return $this->hasMany(Customer::class, 'company_id');
    }

    public function vendors()
    {
        return $this->hasMany(Vendor::class, 'company_id');
    }
}
