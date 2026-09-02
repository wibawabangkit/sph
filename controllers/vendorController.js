const pool = require('../config/db');

async function getVendors(req, res) {
    const companyId = req.tenantCompanyId || 1;
    try {
        const [rows] = await pool.query(
            `SELECT * FROM master_vendors WHERE company_id = ? ORDER BY id DESC`, 
            [companyId]
        );
        return res.json({ success: true, data: rows });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
}

async function createVendor(req, res) {
    const companyId = req.tenantCompanyId || 1;
    const { code, vendor_name, contact_person, category, address, phone, email, bank_name, bank_account } = req.body;
    if (!vendor_name) return res.status(400).json({ success: false, message: 'Nama vendor wajib diisi.' });

    try {
        const [result] = await pool.query(
            `INSERT INTO master_vendors (company_id, code, vendor_name, contact_person, category, address, phone, email, bank_name, bank_account) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [companyId, code || ('VEND-' + Date.now()), vendor_name, contact_person || '', category || '', address || '', phone || '', email || '', bank_name || '', bank_account || '']
        );
        return res.json({ success: true, message: 'Vendor berhasil ditambahkan ke database MySQL.', id: result.insertId });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
}

async function updateVendor(req, res) {
    const companyId = req.tenantCompanyId || 1;
    const { id } = req.params;
    const { code, vendor_name, contact_person, category, address, phone, email, bank_name, bank_account } = req.body;
    try {
        await pool.query(
            `UPDATE master_vendors SET code = ?, vendor_name = ?, contact_person = ?, category = ?, address = ?, phone = ?, email = ?, bank_name = ?, bank_account = ? WHERE id = ? AND company_id = ?`,
            [code, vendor_name, contact_person, category, address, phone, email, bank_name, bank_account, id, companyId]
        );
        return res.json({ success: true, message: 'Vendor berhasil diperbarui di database MySQL.' });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
}

async function deleteVendor(req, res) {
    const companyId = req.tenantCompanyId || 1;
    const { id } = req.params;
    try {
        await pool.query(`DELETE FROM master_vendors WHERE id = ? AND company_id = ?`, [id, companyId]);
        return res.json({ success: true, message: 'Vendor berhasil dihapus dari database MySQL.' });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
}

module.exports = {
    getVendors,
    createVendor,
    updateVendor,
    deleteVendor
};
