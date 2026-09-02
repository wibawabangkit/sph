const pool = require('../config/db');
const bcrypt = require('bcryptjs');

async function getUsers(req, res) {
    try {
        const [rows] = await pool.query(
            `SELECT u.id, u.company_id, u.username, u.email, u.full_name, u.role, u.status, u.created_at, c.company_name 
             FROM users u 
             LEFT JOIN master_companies c ON u.company_id = c.id 
             ORDER BY u.id DESC`
        );
        return res.json({ success: true, data: rows });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
}

async function createUser(req, res) {
    const { company_id, company_name, username, email, password, full_name, role, status } = req.body;
    if (!username || !email || !password || !full_name) {
        return res.status(400).json({ success: false, message: 'Harap lengkapi seluruh field wajib.' });
    }

    try {
        let targetCompanyId = company_id;
        if (!targetCompanyId && company_name && company_name.trim() !== '') {
            const [cRows] = await pool.query(`SELECT id FROM master_companies WHERE company_name = ?`, [company_name.trim()]);
            if (cRows.length > 0) {
                targetCompanyId = cRows[0].id;
            } else {
                const codeStr = company_name.replace(/[^a-zA-Z0-9]/g, '').substring(0, 10).toUpperCase() || 'COMP';
                const [cRes] = await pool.query(
                    `INSERT INTO master_companies (company_code, company_name, legal_name, doc_prefix) VALUES (?, ?, ?, ?)`,
                    [codeStr, company_name.trim(), company_name.trim(), 'SPH']
                );
                targetCompanyId = cRes.insertId;
            }
        }

        if (!targetCompanyId && role !== 'SUPER_ADMIN') {
            targetCompanyId = 1;
        }

        const hash = await bcrypt.hash(password, 10);
        const [result] = await pool.query(
            `INSERT INTO users (company_id, username, email, password_hash, full_name, role, status) VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [role === 'SUPER_ADMIN' ? null : targetCompanyId, username, email, hash, full_name, role || 'COMPANY_ADMIN', status || 'active']
        );
        return res.json({ success: true, message: 'User berhasil disimpan ke database MySQL.', id: result.insertId });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
}

async function updateUser(req, res) {
    const { id } = req.params;
    const { company_id, company_name, full_name, email, role, status, password } = req.body;
    try {
        let targetCompanyId = company_id;
        if (!targetCompanyId && company_name && company_name.trim() !== '') {
            const [cRows] = await pool.query(`SELECT id FROM master_companies WHERE company_name = ?`, [company_name.trim()]);
            if (cRows.length > 0) {
                targetCompanyId = cRows[0].id;
            } else {
                const codeStr = company_name.replace(/[^a-zA-Z0-9]/g, '').substring(0, 10).toUpperCase() || 'COMP';
                const [cRes] = await pool.query(
                    `INSERT INTO master_companies (company_code, company_name, legal_name, doc_prefix) VALUES (?, ?, ?, ?)`,
                    [codeStr, company_name.trim(), company_name.trim(), 'SPH']
                );
                targetCompanyId = cRes.insertId;
            }
        }

        let hash = null;
        if (password && password.trim() !== '') {
            hash = await bcrypt.hash(password, 10);
        }

        if (hash) {
            await pool.query(`UPDATE users SET company_id = ?, full_name = ?, email = ?, role = ?, status = ?, password_hash = ? WHERE id = ?`, [role === 'SUPER_ADMIN' ? null : targetCompanyId, full_name, email, role, status, hash, id]);
        } else {
            await pool.query(`UPDATE users SET company_id = ?, full_name = ?, email = ?, role = ?, status = ? WHERE id = ?`, [role === 'SUPER_ADMIN' ? null : targetCompanyId, full_name, email, role, status, id]);
        }

        return res.json({ success: true, message: 'User & password berhasil diperbarui di database MySQL.' });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
}

async function updateUserStatus(req, res) {
    const { id } = req.params;
    const { status } = req.body;
    try {
        await pool.query(`UPDATE users SET status = ? WHERE id = ?`, [status, id]);
        return res.json({ success: true, message: 'Status user berhasil diperbarui di database MySQL.' });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
}

async function deleteUser(req, res) {
    const { id } = req.params;
    try {
        await pool.query(`DELETE FROM users WHERE id = ?`, [id]);
        return res.json({ success: true, message: 'User berhasil dihapus dari database MySQL.' });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
}

module.exports = {
    getUsers,
    createUser,
    updateUser,
    updateUserStatus,
    deleteUser
};
