<?php

namespace App\Models;

use App\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Customer extends Model
{
    use HasFactory, BelongsToTenant;

    protected $table = 'master_customers';

    protected $fillable = [
        'company_id', 'code', 'company_name', 'contact_person', 'address', 'phone', 'email', 'npwp'
    ];

    public function company()
    {
        return $this->belongsTo(Company::class, 'company_id');
    }
}
