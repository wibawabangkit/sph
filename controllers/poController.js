const pool = require('../config/db');

async function getPOs(req, res) {
    const companyId = req.tenantCompanyId || 1;
    try {
        const [rows] = await pool.query(`SELECT * FROM purchase_orders WHERE company_id = ? ORDER BY id DESC`, [companyId]);
        return res.json({ success: true, data: rows });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
}

async function createPO(req, res) {
    const companyId = req.tenantCompanyId || 1;
    const { po_no, po_date, quotation_id, vendor_id, vendor_name, delivery_date, terms_of_payment, items, total_amount, status } = req.body;
    if (!po_no || !vendor_name) {
        return res.status(400).json({ success: false, message: 'Nomor PO dan Nama Vendor wajib diisi.' });
    }

    try {
        const itemsJson = JSON.stringify(items || []);
        const [result] = await pool.query(
            `INSERT INTO purchase_orders (company_id, po_no, po_date, quotation_id, vendor_id, vendor_name, delivery_date, terms_of_payment, items, total_amount, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [companyId, po_no, po_date || new Date().toISOString().split('T')[0], quotation_id || null, vendor_id || null, vendor_name, delivery_date || null, terms_of_payment || '30 Hari', itemsJson, total_amount || 0, status || 'Draft']
        );
        return res.json({ success: true, message: 'Purchase Order berhasil dibuat ke MySQL.', id: result.insertId });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
}

module.exports = {
    getPOs,
    createPO
};
