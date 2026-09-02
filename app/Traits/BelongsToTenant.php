<?php

namespace App\Traits;

use App\Models\Scopes\TenantScope;

trait BelongsToTenant
{
    protected static function bootBelongsToTenant(): void
    {
        static::addGlobalScope(new TenantScope);

        static::creating(function ($model) {
            if (auth()->check() && auth()->user()->role !== 'SUPER_ADMIN') {
                if (empty($model->company_id)) {
                    $model->company_id = auth()->user()->company_id;
                }
            }
        });
    }
}
