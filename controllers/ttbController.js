const pool = require('../config/db');

async function getTTBs(req, res) {
    const companyId = req.tenantCompanyId || 1;
    try {
        const [rows] = await pool.query(`SELECT * FROM goods_receipts WHERE company_id = ? ORDER BY id DESC`, [companyId]);
        return res.json({ success: true, data: rows });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
}

async function createTTB(req, res) {
    const companyId = req.tenantCompanyId || 1;
    const { ttb_no, ttb_date, ref_no, sender_name, receiver_name, warehouse_location, items, notes, receiver_signer_name, sender_signer_name } = req.body;
    if (!ttb_no || !sender_name || !receiver_name) {
        return res.status(400).json({ success: false, message: 'Nomor TTB, Nama Pengirim, dan Nama Penerima wajib diisi.' });
    }

    try {
        const itemsJson = JSON.stringify(items || []);
        const [result] = await pool.query(
            `INSERT INTO goods_receipts (company_id, ttb_no, ttb_date, ref_no, sender_name, receiver_name, warehouse_location, items, notes, receiver_signer_name, sender_signer_name) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [companyId, ttb_no, ttb_date || new Date().toISOString().split('T')[0], ref_no || '', sender_name, receiver_name, warehouse_location || 'Gudang Utama', itemsJson, notes || '', receiver_signer_name || '', sender_signer_name || '']
        );
        return res.json({ success: true, message: 'Dokumen Tanda Terima Barang (TTB) berhasil dibuat ke MySQL.', id: result.insertId });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
}

module.exports = {
    getTTBs,
    createTTB
};
