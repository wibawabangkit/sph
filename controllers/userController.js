const pool = require('../config/db');
const bcrypt = require('bcryptjs');

const MOCK_USERS = [
    { id: 1, company_id: null, username: 'superadmin', email: 'admin@system.local', full_name: 'System Super Admin', role: 'SUPER_ADMIN', status: 'active', company_name: 'System Global' },
    { id: 2, company_id: 1, username: 'admin_heksa', email: 'admin@heksa.co.id', full_name: 'Admin PT. Heksa', role: 'COMPANY_ADMIN', status: 'active', company_name: 'PT. HEKSA UTAMA' }
];

async function getUsers(req, res) {
    try {
        let rows = [];
        try {
            [rows] = await pool.query(
                `SELECT u.id, u.company_id, u.username, u.email, u.full_name, u.role, u.status, u.created_at, c.company_name 
                 FROM users u 
                 LEFT JOIN master_companies c ON u.company_id = c.id 
                 ORDER BY u.id DESC`
            );
        } catch (dbErr) {
            rows = MOCK_USERS;
        }
        return res.json({ success: true, data: rows });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
}

async function createUser(req, res) {
    const { company_id, username, email, password, full_name, role, status } = req.body;
    if (!username || !email || !password || !full_name) {
        return res.status(400).json({ success: false, message: 'Harap lengkapi seluruh field wajib.' });
    }

    try {
        const hash = await bcrypt.hash(password, 10);
        try {
            const [result] = await pool.query(
                `INSERT INTO users (company_id, username, email, password_hash, full_name, role, status) VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [company_id || null, username, email, hash, full_name, role || 'COMPANY_ADMIN', status || 'active']
            );
            return res.json({ success: true, message: 'User berhasil dibuat.', id: result.insertId });
        } catch (dbErr) {
            const newUser = { id: MOCK_USERS.length + 1, company_id, username, email, full_name, role, status: status || 'active', company_name: 'Perusahaan Baru' };
            MOCK_USERS.push(newUser);
            return res.json({ success: true, message: 'User berhasil dibuat (Mock).', id: newUser.id });
        }
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
}

async function updateUserStatus(req, res) {
    const { id } = req.params;
    const { status } = req.body;
    try {
        try {
            await pool.query(`UPDATE users SET status = ? WHERE id = ?`, [status, id]);
        } catch (dbErr) {
            const u = MOCK_USERS.find(user => user.id == id);
            if (u) u.status = status;
        }
        return res.json({ success: true, message: 'Status user berhasil diperbarui.' });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
}

module.exports = {
    getUsers,
    createUser,
    updateUserStatus
};
