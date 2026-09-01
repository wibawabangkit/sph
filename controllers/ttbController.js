const pool = require('../config/db');

const MOCK_TTBS = [
    {
        id: 1,
        company_id: 1,
        ttb_no: 'TTB/2026/09/001',
        ttb_date: '2026-09-01',
        ref_no: 'PO/2026/08/012',
        sender_name: 'CV. BAJA PERKASA',
        receiver_name: 'Gudang Utama PT. Heksa',
        warehouse_location: 'Gudang Kawasan Industri Pulogadung',
        items: [
            { item_name: 'Baja WF 200 x 100 x 5.5 x 8', qty_ordered: 50, qty_received: 50, unit: 'Batang', condition_status: 'Baik', notes: 'Penerimaan utuh' }
        ],
        notes: 'Pemeriksaan fisik sesuai spec PO',
        receiver_signer_name: 'Bambang Irawan',
        sender_signer_name: 'Supriyadi (Driver)'
    }
];

async function getTTBs(req, res) {
    const companyId = req.tenantCompanyId || 1;
    try {
        let rows = [];
        try {
            [rows] = await pool.query(`SELECT * FROM goods_receipts WHERE company_id = ? ORDER BY id DESC`, [companyId]);
        } catch (dbErr) {
            rows = MOCK_TTBS.filter(t => t.company_id == companyId);
        }
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
        try {
            const [result] = await pool.query(
                `INSERT INTO goods_receipts (company_id, ttb_no, ttb_date, ref_no, sender_name, receiver_name, warehouse_location, items, notes, receiver_signer_name, sender_signer_name) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [companyId, ttb_no, ttb_date || new Date().toISOString().split('T')[0], ref_no || '', sender_name, receiver_name, warehouse_location || 'Gudang Utama', itemsJson, notes || '', receiver_signer_name || '', sender_signer_name || '']
            );
            return res.json({ success: true, message: 'Dokumen Tanda Terima Barang (TTB) berhasil dibuat.', id: result.insertId });
        } catch (dbErr) {
            const mock = { id: MOCK_TTBS.length + 1, company_id: companyId, ttb_no, ttb_date, ref_no, sender_name, receiver_name, warehouse_location, items: items || [], notes, receiver_signer_name, sender_signer_name };
            MOCK_TTBS.push(mock);
            return res.json({ success: true, message: 'Dokumen Tanda Terima Barang (TTB) berhasil dibuat (Mock).', id: mock.id });
        }
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
}

module.exports = {
    getTTBs,
    createTTB
};
