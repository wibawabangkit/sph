<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Company;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class UserController extends Controller
{
    public function index()
    {
        $users = User::with('company')->orderBy('id', 'desc')->get()->map(function ($u) {
            return [
                'id' => $u->id,
                'company_id' => $u->company_id,
                'username' => $u->username,
                'email' => $u->email,
                'full_name' => $u->full_name,
                'role' => $u->role,
                'status' => $u->status,
                'created_at' => $u->created_at,
                'company_name' => $u->company ? $u->company->company_name : 'System Global'
            ];
        });

        return response()->json([
            'success' => true,
            'data' => $users
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'username' => 'required|string|unique:users,username',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:4',
            'full_name' => 'required|string',
        ]);

        $companyId = $request->company_id;

        if (!$companyId && $request->filled('company_name')) {
            $companyName = trim($request->company_name);
            $company = Company::where('company_name', $companyName)->first();
            if (!$company) {
                $codeStr = strtoupper(substr(preg_replace('/[^a-zA-Z0-9]/', '', $companyName), 0, 10)) ?: 'COMP';
                $company = Company::create([
                    'company_code' => $codeStr,
                    'company_name' => $companyName,
                    'legal_name' => $companyName,
                    'doc_prefix' => 'SPH'
                ]);
            }
            $companyId = $company->id;
        }

        $user = User::create([
            'company_id' => $request->role === 'SUPER_ADMIN' ? null : ($companyId ?: 1),
            'username' => $request->username,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'full_name' => $request->full_name,
            'role' => $request->role ?? 'COMPANY_ADMIN',
            'status' => $request->status ?? 'active',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'User berhasil ditambahkan ke database MySQL via Laravel.',
            'id' => $user->id,
            'data' => $user
        ]);
    }

    public function update(Request $request, $id)
    {
        $user = User::find($id);

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'User tidak ditemukan.'
            ], 404);
        }

        $data = $request->only(['full_name', 'email', 'role', 'status']);
        if ($request->filled('password')) {
            $data['password'] = Hash::make($request->password);
        }

        $user->update($data);

        return response()->json([
            'success' => true,
            'message' => 'User berhasil diperbarui via Laravel.',
            'data' => $user
        ]);
    }

    public function destroy($id)
    {
        $user = User::find($id);

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'User tidak ditemukan.'
            ], 404);
        }

        $user->delete();

        return response()->json([
            'success' => true,
            'message' => 'User berhasil dihapus via Laravel.'
        ]);
    }
}
