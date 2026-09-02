<?php

namespace App\Models;

use App\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Quotation extends Model
{
    use HasFactory, BelongsToTenant;

    protected $table = 'quotations';

    protected $fillable = [
        'company_id',
        'sph_no',
        'sph_date',
        'customer_name',
        'customer_address',
        'project_title',
        'template_type',
        'items_data',
        'subtotal',
        'dp_amount',
        'discount_amount',
        'tax_rate_percent',
        'tax_amount',
        'grand_total',
        'status',
    ];

    protected $casts = [
        'items_data' => 'array',
        'sph_date' => 'date',
        'subtotal' => 'decimal:2',
        'grand_total' => 'decimal:2',
    ];

    public function company()
    {
        return $this->belongsTo(Company::class, 'company_id');
    }
}
