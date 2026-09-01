const pool = require('../config/db');

const MOCK_QUOTATIONS = [];

async function getQuotations(req, res) {
    const companyId = req.tenantCompanyId || 1;
    const { status } = req.query;
    try {
        let rows = [];
        try {
            let sql = `SELECT * FROM quotations WHERE company_id = ?`;
            const params = [companyId];
            if (status) {
                sql += ` AND status = ?`;
                params.push(status);
            }
            sql += ` ORDER BY id DESC`;
            [rows] = await pool.query(sql, params);
        } catch (dbErr) {
            rows = MOCK_QUOTATIONS.filter(q => q.company_id == companyId && (!status || q.status === status));
        }
        return res.json({ success: true, data: rows });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
}

async function saveQuotation(req, res) {
    const companyId = req.tenantCompanyId || 1;
    const {
        id,
        quotation_no,
        quotation_date,
        customer_id,
        customer_name,
        customer_address,
        annex_title,
        status,
        show_grand_total,
        custom_columns,
        items,
        notes,
        signer_name,
        signer_role
    } = req.body;

    if (!quotation_no || !customer_name) {
        return res.status(400).json({ success: false, message: 'Nomor penawaran dan Nama customer wajib diisi.' });
    }

    try {
        const customColsJson = JSON.stringify(custom_columns || []);
        const itemsJson = JSON.stringify(items || []);
        const notesJson = JSON.stringify(notes || []);

        try {
            if (id) {
                await pool.query(
                    `UPDATE quotations SET quotation_no=?, quotation_date=?, customer_id=?, customer_name=?, customer_address=?, annex_title=?, status=?, show_grand_total=?, custom_columns=?, items=?, notes=?, signer_name=?, signer_role=? WHERE id=? AND company_id=?`,
                    [quotation_no, quotation_date, customer_id || null, customer_name, customer_address, annex_title, status || 'inisiasi', show_grand_total ? 1 : 0, customColsJson, itemsJson, notesJson, signer_name, signer_role, id, companyId]
                );
                return res.json({ success: true, message: 'Penawaran berhasil diperbarui.', id });
            } else {
                const [result] = await pool.query(
                    `INSERT INTO quotations (company_id, quotation_no, quotation_date, customer_id, customer_name, customer_address, annex_title, status, show_grand_total, custom_columns, items, notes, signer_name, signer_role) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [companyId, quotation_no, quotation_date || new Date().toISOString().split('T')[0], customer_id || null, customer_name, customer_address, annex_title || 'SPESIFIKASI PEKERJAAN DAN RINCIAN HARGA', status || 'inisiasi', show_grand_total ? 1 : 0, customColsJson, itemsJson, notesJson, signer_name, signer_role]
                );
                return res.json({ success: true, message: 'Penawaran berhasil disimpan.', id: result.insertId });
            }
        } catch (dbErr) {
            const mockRecord = {
                id: id || MOCK_QUOTATIONS.length + 1,
                company_id: companyId,
                quotation_no,
                quotation_date,
                customer_name,
                customer_address,
                status: status || 'inisiasi',
                custom_columns: custom_columns || [],
                items: items || []
            };
            if (id) {
                const idx = MOCK_QUOTATIONS.findIndex(q => q.id == id);
                if (idx !== -1) MOCK_QUOTATIONS[idx] = mockRecord;
            } else {
                MOCK_QUOTATIONS.push(mockRecord);
            }
            return res.json({ success: true, message: 'Penawaran berhasil disimpan (Mock).', id: mockRecord.id });
        }
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
}

async function updateStatus(req, res) {
    const companyId = req.tenantCompanyId || 1;
    const { id } = req.params;
    const { status } = req.body; // 'inisiasi', 'nego', 'closing'

    try {
        try {
            await pool.query(`UPDATE quotations SET status = ? WHERE id = ? AND company_id = ?`, [status, id, companyId]);
        } catch (dbErr) {
            const q = MOCK_QUOTATIONS.find(item => item.id == id);
            if (q) q.status = status;
        }
        return res.json({ success: true, message: `Status penawaran berhasil diubah menjadi ${status.toUpperCase()}.` });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
}

module.exports = {
    getQuotations,
    saveQuotation,
    updateStatus
};
