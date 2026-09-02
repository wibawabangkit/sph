const pool = require('../config/db');

async function getCustomers(req, res) {
    const companyId = req.tenantCompanyId || 1;
    try {
        const [rows] = await pool.query(
            `SELECT * FROM master_customers WHERE company_id = ? ORDER BY id DESC`, 
            [companyId]
        );
        return res.json({ success: true, data: rows });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
}

async function createCustomer(req, res) {
    const companyId = req.tenantCompanyId || 1;
    const { code, company_name, contact_person, address, phone, email, npwp } = req.body;
    if (!company_name) return res.status(400).json({ success: false, message: 'Nama customer wajib diisi.' });

    try {
        const [result] = await pool.query(
            `INSERT INTO master_customers (company_id, code, company_name, contact_person, address, phone, email, npwp) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [companyId, code || ('CUST-' + Date.now()), company_name, contact_person || '', address || '', phone || '', email || '', npwp || '']
        );
        return res.json({ success: true, message: 'Customer berhasil ditambahkan ke database MySQL.', id: result.insertId });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
}

async function updateCustomer(req, res) {
    const companyId = req.tenantCompanyId || 1;
    const { id } = req.params;
    const { code, company_name, contact_person, address, phone, email, npwp } = req.body;
    try {
        await pool.query(
            `UPDATE master_customers SET code = ?, company_name = ?, contact_person = ?, address = ?, phone = ?, email = ?, npwp = ? WHERE id = ? AND company_id = ?`,
            [code, company_name, contact_person, address, phone, email, npwp, id, companyId]
        );
        return res.json({ success: true, message: 'Customer berhasil diperbarui di database MySQL.' });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
}

async function deleteCustomer(req, res) {
    const companyId = req.tenantCompanyId || 1;
    const { id } = req.params;
    try {
        await pool.query(`DELETE FROM master_customers WHERE id = ? AND company_id = ?`, [id, companyId]);
        return res.json({ success: true, message: 'Customer berhasil dihapus dari database MySQL.' });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
}

module.exports = {
    getCustomers,
    createCustomer,
    updateCustomer,
    deleteCustomer
};
