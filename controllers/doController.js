const pool = require('../config/db');

async function getDOs(req, res) {
    const companyId = req.tenantCompanyId || 1;
    try {
        const [rows] = await pool.query(`SELECT * FROM delivery_orders WHERE company_id = ? ORDER BY id DESC`, [companyId]);
        return res.json({ success: true, data: rows });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
}

async function createDO(req, res) {
    const companyId = req.tenantCompanyId || 1;
    const { do_no, do_date, quotation_id, customer_name, delivery_address, driver_name, vehicle_no, items, status } = req.body;
    if (!do_no || !customer_name) {
        return res.status(400).json({ success: false, message: 'Nomor DO dan Nama Customer wajib diisi.' });
    }

    try {
        const itemsJson = JSON.stringify(items || []);
        const [result] = await pool.query(
            `INSERT INTO delivery_orders (company_id, do_no, do_date, quotation_id, customer_name, delivery_address, driver_name, vehicle_no, items, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [companyId, do_no, do_date || new Date().toISOString().split('T')[0], quotation_id || null, customer_name, delivery_address, driver_name, vehicle_no, itemsJson, status || 'Pengiriman']
        );
        return res.json({ success: true, message: 'Surat Jalan (DO) berhasil dibuat ke MySQL.', id: result.insertId });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
}

module.exports = {
    getDOs,
    createDO
};
