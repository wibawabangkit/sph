<?php

namespace App\Models;

use App\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Vendor extends Model
{
    use HasFactory, BelongsToTenant;

    protected $table = 'master_vendors';

    protected $fillable = [
        'company_id', 'code', 'vendor_name', 'contact_person', 'address', 'phone', 'email', 'npwp'
    ];

    public function company()
    {
        return $this->belongsTo(Company::class, 'company_id');
    }
}
