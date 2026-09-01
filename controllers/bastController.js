const pool = require('../config/db');

const MOCK_BASTS = [];

async function getBASTs(req, res) {
    const companyId = req.tenantCompanyId || 1;
    try {
        let rows = [];
        try {
            [rows] = await pool.query(`SELECT * FROM bast_documents WHERE company_id = ? ORDER BY id DESC`, [companyId]);
        } catch (dbErr) {
            rows = MOCK_BASTS.filter(b => b.company_id == companyId);
        }
        return res.json({ success: true, data: rows });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
}

async function createBAST(req, res) {
    const companyId = req.tenantCompanyId || 1;
    const { bast_no, bast_date, quotation_id, customer_name, project_name, location, work_scope, status } = req.body;
    if (!bast_no || !customer_name || !project_name) {
        return res.status(400).json({ success: false, message: 'Nomor BAST, Customer, dan Nama Proyek wajib diisi.' });
    }

    try {
        try {
            const [result] = await pool.query(
                `INSERT INTO bast_documents (company_id, bast_no, bast_date, quotation_id, customer_name, project_name, location, work_scope, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [companyId, bast_no, bast_date || new Date().toISOString().split('T')[0], quotation_id || null, customer_name, project_name, location || '', work_scope || '', status || 'Selesai']
            );
            return res.json({ success: true, message: 'Berita Acara Serah Terima (BAST) berhasil dibuat.', id: result.insertId });
        } catch (dbErr) {
            const mock = { id: MOCK_BASTS.length + 1, company_id: companyId, bast_no, bast_date, customer_name, project_name, location, work_scope, status: status || 'Selesai' };
            MOCK_BASTS.push(mock);
            return res.json({ success: true, message: 'BAST berhasil dibuat (Mock).', id: mock.id });
        }
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
}

module.exports = {
    getBASTs,
    createBAST
};
