const pool = require('../config/db');

async function getCompanies(req, res) {
    try {
        const [rows] = await pool.query(`SELECT * FROM master_companies ORDER BY id DESC`);
        return res.json({ success: true, data: rows });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
}

async function getCompanyById(req, res) {
    const { id } = req.params;
    try {
        const [rows] = await pool.query(`SELECT * FROM master_companies WHERE id = ?`, [id]);
        if (rows.length === 0) return res.status(404).json({ success: false, message: 'Perusahaan tidak ditemukan.' });
        return res.json({ success: true, data: rows[0] });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
}

async function createCompany(req, res) {
    const { company_code, company_name, legal_name, address, phone, email, npwp, bank_name, bank_account_no, bank_account_name, doc_prefix } = req.body;
    if (!company_name) return res.status(400).json({ success: false, message: 'Nama perusahaan wajib diisi.' });

    try {
        const [result] = await pool.query(
            `INSERT INTO master_companies (company_code, company_name, legal_name, address, phone, email, npwp, bank_name, bank_account_no, bank_account_name, doc_prefix)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [company_code || 'COMP-' + Date.now(), company_name, legal_name || company_name, address, phone, email, npwp, bank_name, bank_account_no, bank_account_name, doc_prefix || 'SPH']
        );
        return res.json({ success: true, message: 'Perusahaan berhasil ditambahkan ke MySQL.', id: result.insertId });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
}

async function updateCompany(req, res) {
    const { id } = req.params;
    const { company_name, legal_name, address, phone, email, npwp, bank_name, bank_account_no, bank_account_name, default_signer_name, default_signer_role, doc_prefix } = req.body;

    try {
        await pool.query(
            `UPDATE master_companies SET company_name=?, legal_name=?, address=?, phone=?, email=?, npwp=?, bank_name=?, bank_account_no=?, bank_account_name=?, default_signer_name=?, default_signer_role=?, doc_prefix=? WHERE id=?`,
            [company_name, legal_name, address, phone, email, npwp, bank_name, bank_account_no, bank_account_name, default_signer_name, default_signer_role, doc_prefix, id]
        );
        return res.json({ success: true, message: 'Profil Perusahaan berhasil diperbarui di MySQL.' });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
}

module.exports = {
    getCompanies,
    getCompanyById,
    createCompany,
    updateCompany
};
