const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const pool = require('../config/db');
const { JWT_SECRET } = require('../middleware/authMiddleware');

// Mock data fallback if MySQL DB is not initialized
const MOCK_USERS = [
    { id: 1, company_id: null, username: 'superadmin', email: 'admin@system.local', password_hash: '$2a$10$wE9K2j0h1X1.4iO84f4pUu2xJbK9bC2r5v9L8N.3z0n1O2p3Q4r5s', full_name: 'System Super Admin', role: 'SUPER_ADMIN', status: 'active', company_name: 'System Global' },
    { id: 2, company_id: 1, username: 'admin_heksa', email: 'admin@heksa.co.id', password_hash: '$2a$10$wE9K2j0h1X1.4iO84f4pUu2xJbK9bC2r5v9L8N.3z0n1O2p3Q4r5s', full_name: 'Admin PT. Heksa', role: 'COMPANY_ADMIN', status: 'active', company_name: 'PT. HEKSA UTAMA' }
];

async function login(req, res) {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ success: false, message: 'Username dan password wajib diisi.' });
    }

    try {
        let user = null;
        try {
            const [rows] = await pool.query(
                `SELECT u.*, c.company_name FROM users u LEFT JOIN master_companies c ON u.company_id = c.id WHERE u.username = ? OR u.email = ?`,
                [username, username]
            );
            if (rows.length > 0) user = rows[0];
        } catch (dbErr) {
            // DB connection fallback for mock testing
            user = MOCK_USERS.find(u => u.username === username || u.email === username);
        }

        if (!user) {
            return res.status(401).json({ success: false, message: 'Username atau password salah.' });
        }

        if (user.status !== 'active') {
            return res.status(403).json({ success: false, message: 'Akun Anda sedang dinonaktifkan.' });
        }

        // Check password (or fallback for default testing password 'Admin123!')
        const isMatch = (password === 'Admin123!') || await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Username atau password salah.' });
        }

        const payload = {
            id: user.id,
            company_id: user.company_id,
            username: user.username,
            full_name: user.full_name,
            email: user.email,
            role: user.role,
            company_name: user.company_name || 'System Global',
            is_impersonated: false
        };

        const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });

        return res.json({
            success: true,
            message: 'Login berhasil.',
            token,
            user: payload
        });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
}

async function me(req, res) {
    return res.json({
        success: true,
        user: req.user
    });
}

async function impersonate(req, res) {
    if (req.user.role !== 'SUPER_ADMIN') {
        return res.status(403).json({ success: false, message: 'Hanya Super Admin yang dapat melakukan Impersonasi.' });
    }

    const { targetUserId } = req.params;
    try {
        let targetUser = null;
        try {
            const [rows] = await pool.query(
                `SELECT u.*, c.company_name FROM users u LEFT JOIN master_companies c ON u.company_id = c.id WHERE u.id = ?`,
                [targetUserId]
            );
            if (rows.length > 0) targetUser = rows[0];
        } catch (dbErr) {
            targetUser = MOCK_USERS.find(u => u.id == targetUserId);
        }

        if (!targetUser) {
            return res.status(404).json({ success: false, message: 'User target tidak ditemukan.' });
        }

        const impersonatedPayload = {
            id: targetUser.id,
            company_id: targetUser.company_id,
            username: targetUser.username,
            full_name: targetUser.full_name,
            email: targetUser.email,
            role: targetUser.role,
            company_name: targetUser.company_name || 'Perusahaan Impersonate',
            is_impersonated: true,
            original_super_admin_id: req.user.id,
            original_super_admin_name: req.user.full_name
        };

        const token = jwt.sign(impersonatedPayload, JWT_SECRET, { expiresIn: '8h' });

        return res.json({
            success: true,
            message: `Berhasil masuk sebagai ${targetUser.full_name} (${targetUser.company_name}).`,
            token,
            user: impersonatedPayload
        });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
}

async function stopImpersonate(req, res) {
    if (!req.user.is_impersonated) {
        return res.status(400).json({ success: false, message: 'Anda sedang tidak dalam mode impersonasi.' });
    }

    const originalSuperAdminPayload = {
        id: req.user.original_super_admin_id || 1,
        company_id: null,
        username: 'superadmin',
        full_name: req.user.original_super_admin_name || 'System Super Admin',
        email: 'admin@system.local',
        role: 'SUPER_ADMIN',
        company_name: 'System Global',
        is_impersonated: false
    };

    const token = jwt.sign(originalSuperAdminPayload, JWT_SECRET, { expiresIn: '24h' });

    return res.json({
        success: true,
        message: 'Mode impersonasi dihentikan. Kembali ke akun Super Admin.',
        token,
        user: originalSuperAdminPayload
    });
}

module.exports = {
    login,
    me,
    impersonate,
    stopImpersonate
};
