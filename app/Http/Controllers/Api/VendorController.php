<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Vendor;
use Illuminate\Http\Request;

class VendorController extends Controller
{
    public function index()
    {
        $vendors = Vendor::orderBy('id', 'desc')->get();
        return response()->json([
            'success' => true,
            'data' => $vendors
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'vendor_name' => 'required|string|max:255',
        ]);

        $vendor = Vendor::create([
            'code' => $request->code ?? ('VND-' . time()),
            'vendor_name' => $request->vendor_name,
            'contact_person' => $request->contact_person ?? '',
            'address' => $request->address ?? '',
            'phone' => $request->phone ?? '',
            'email' => $request->email ?? '',
            'npwp' => $request->npwp ?? '',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Vendor berhasil ditambahkan via Laravel Eloquent.',
            'id' => $vendor->id,
            'data' => $vendor
        ]);
    }

    public function update(Request $request, $id)
    {
        $vendor = Vendor::find($id);

        if (!$vendor) {
            return response()->json([
                'success' => false,
                'message' => 'Vendor tidak ditemukan atau Anda tidak memiliki akses.'
            ], 404);
        }

        $vendor->update($request->only([
            'code', 'vendor_name', 'contact_person', 'address', 'phone', 'email', 'npwp'
        ]));

        return response()->json([
            'success' => true,
            'message' => 'Vendor berhasil diperbarui via Laravel Eloquent.',
            'data' => $vendor
        ]);
    }

    public function destroy($id)
    {
        $vendor = Vendor::find($id);

        if (!$vendor) {
            return response()->json([
                'success' => false,
                'message' => 'Vendor tidak ditemukan atau Anda tidak memiliki akses.'
            ], 404);
        }

        $vendor->delete();

        return response()->json([
            'success' => true,
            'message' => 'Vendor berhasil dihapus via Laravel Eloquent.'
        ]);
    }
}
