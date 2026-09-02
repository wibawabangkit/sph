<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Quotation;
use Illuminate\Http\Request;

class QuotationController extends Controller
{
    public function index()
    {
        $quotations = Quotation::orderBy('id', 'desc')->get()->map(function ($q) {
            $items = is_array($q->items_data) ? ($q->items_data['items'] ?? $q->items_data) : [];
            return [
                'id' => $q->id,
                'quotation_no' => $q->sph_no,
                'sph_no' => $q->sph_no,
                'date' => $q->sph_date ? $q->sph_date->format('Y-m-d') : '',
                'sph_date' => $q->sph_date ? $q->sph_date->format('Y-m-d') : '',
                'customer_name' => $q->customer_name,
                'customer_address' => $q->customer_address,
                'project_title' => $q->project_title,
                'template_type' => $q->template_type,
                'items_count' => is_array($items) ? count($items) : 1,
                'items_data' => $q->items_data,
                'total_amount' => (float)$q->grand_total,
                'subtotal' => (float)$q->subtotal,
                'grand_total' => (float)$q->grand_total,
                'status' => $q->status ?? 'Aktif',
                'created_at' => $q->created_at
            ];
        });

        return response()->json([
            'success' => true,
            'data' => $quotations
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'sph_no' => 'required|string',
            'customer_name' => 'required|string',
        ]);

        $quotation = Quotation::create([
            'sph_no' => $request->sph_no,
            'sph_date' => $request->sph_date ?? now()->toDateString(),
            'customer_name' => $request->customer_name,
            'customer_address' => $request->customer_address ?? '',
            'project_title' => $request->project_title ?? 'Penawaran Harga',
            'template_type' => $request->template_type ?? 'TEMPLATE_1_HEKSA',
            'items_data' => $request->items_data ?? [],
            'subtotal' => $request->subtotal ?? 0,
            'dp_amount' => $request->dp_amount ?? 0,
            'discount_amount' => $request->discount_amount ?? 0,
            'tax_rate_percent' => $request->tax_rate_percent ?? 11,
            'tax_amount' => $request->tax_amount ?? 0,
            'grand_total' => $request->grand_total ?? 0,
            'status' => $request->status ?? 'draft',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Dokumen SPH Penawaran berhasil disimpan ke database MySQL.',
            'id' => $quotation->id,
            'data' => $quotation
        ]);
    }

    public function show($id)
    {
        $quotation = Quotation::find($id);

        if (!$quotation) {
            return response()->json([
                'success' => false,
                'message' => 'Dokumen SPH tidak ditemukan atau Anda tidak memiliki akses.'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $quotation
        ]);
    }

    public function update(Request $request, $id)
    {
        $quotation = Quotation::find($id);

        if (!$quotation) {
            return response()->json([
                'success' => false,
                'message' => 'Dokumen SPH tidak ditemukan atau Anda tidak memiliki akses.'
            ], 404);
        }

        $quotation->update($request->only([
            'sph_no', 'sph_date', 'customer_name', 'customer_address', 'project_title',
            'template_type', 'items_data', 'subtotal', 'dp_amount', 'discount_amount',
            'tax_rate_percent', 'tax_amount', 'grand_total', 'status'
        ]));

        return response()->json([
            'success' => true,
            'message' => 'Dokumen SPH berhasil diperbarui di database MySQL.',
            'data' => $quotation
        ]);
    }

    public function destroy($id)
    {
        $quotation = Quotation::find($id);

        if (!$quotation) {
            return response()->json([
                'success' => false,
                'message' => 'Dokumen SPH tidak ditemukan atau Anda tidak memiliki akses.'
            ], 404);
        }

        $quotation->delete();

        return response()->json([
            'success' => true,
            'message' => 'Dokumen SPH berhasil dihapus dari database MySQL.'
        ]);
    }
}
