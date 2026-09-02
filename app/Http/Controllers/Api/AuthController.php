<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $request->validate([
            'username' => 'required|string',
            'password' => 'required|string',
        ]);

        $user = User::with('company')->where('username', $request->username)
            ->orWhere('email', $request->username)
            ->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json([
                'success' => false,
                'message' => 'Username atau password salah.'
            ], 401);
        }

        if ($user->status !== 'active') {
            return response()->json([
                'success' => false,
                'message' => 'Akun Anda sedang dinonaktifkan.'
            ], 403);
        }

        $token = $user->createToken('erp_auth_token')->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'Login berhasil via Laravel Sanctum.',
            'token' => $token,
            'user' => [
                'id' => $user->id,
                'company_id' => $user->company_id,
                'username' => $user->username,
                'full_name' => $user->full_name,
                'email' => $user->email,
                'role' => $user->role,
                'company_name' => $user->company ? $user->company->company_name : 'System Global',
                'is_impersonated' => false
            ]
        ]);
    }

    public function logout(Request $request)
    {
        if ($request->user()) {
            $request->user()->currentAccessToken()->delete();
        }

        return response()->json([
            'success' => true,
            'message' => 'Logout berhasil.'
        ]);
    }

    public function me(Request $request)
    {
        $user = $request->user()->load('company');
        return response()->json([
            'success' => true,
            'user' => [
                'id' => $user->id,
                'company_id' => $user->company_id,
                'username' => $user->username,
                'full_name' => $user->full_name,
                'email' => $user->email,
                'role' => $user->role,
                'company_name' => $user->company ? $user->company->company_name : 'System Global'
            ]
        ]);
    }
}
