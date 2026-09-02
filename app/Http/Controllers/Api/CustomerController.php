<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use Illuminate\Http\Request;

class CustomerController extends Controller
{
    public function index()
    {
        $customers = Customer::orderBy('id', 'desc')->get();
        return response()->json([
            'success' => true,
            'data' => $customers
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'company_name' => 'required|string|max:255',
        ]);

        $customer = Customer::create([
            'code' => $request->code ?? ('CUST-' . time()),
            'company_name' => $request->company_name,
            'contact_person' => $request->contact_person ?? '',
            'address' => $request->address ?? '',
            'phone' => $request->phone ?? '',
            'email' => $request->email ?? '',
            'npwp' => $request->npwp ?? '',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Customer berhasil ditambahkan via Laravel Eloquent.',
            'id' => $customer->id,
            'data' => $customer
        ]);
    }

    public function update(Request $request, $id)
    {
        $customer = Customer::find($id);

        if (!$customer) {
            return response()->json([
                'success' => false,
                'message' => 'Customer tidak ditemukan atau Anda tidak memiliki akses.'
            ], 404);
        }

        $customer->update($request->only([
            'code', 'company_name', 'contact_person', 'address', 'phone', 'email', 'npwp'
        ]));

        return response()->json([
            'success' => true,
            'message' => 'Customer berhasil diperbarui via Laravel Eloquent.',
            'data' => $customer
        ]);
    }

    public function destroy($id)
    {
        $customer = Customer::find($id);

        if (!$customer) {
            return response()->json([
                'success' => false,
                'message' => 'Customer tidak ditemukan atau Anda tidak memiliki akses.'
            ], 404);
        }

        $customer->delete();

        return response()->json([
            'success' => true,
            'message' => 'Customer berhasil dihapus via Laravel Eloquent.'
        ]);
    }
}
