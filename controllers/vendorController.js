const pool = require('../config/db');

const MOCK_VENDORS = [
    { id: 1, company_id: 1, code: 'VEND-001', vendor_name: 'CV. BAJA PERKASA', contact_person: 'H. Suhanda', category: 'Material Konstruksi', address: 'Kawasan Industri Pulogadung Blok C3, Jakarta', phone: '021-4601122', email: 'sales@bajaperkasa.co.id', bank_name: 'BCA', bank_account: '883-001928-1' }
];

async function getVendors(req, res) {
    const companyId = req.tenantCompanyId || 1;
    try {
        let rows = [];
        try {
            [rows] = await pool.query(`SELECT * FROM master_vendors WHERE company_id = ? ORDER BY id DESC`, [companyId]);
        } catch (dbErr) {
            rows = MOCK_VENDORS.filter(v => v.company_id == companyId);
        }
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
        try {
            const [result] = await pool.query(
                `INSERT INTO master_vendors (company_id, code, vendor_name, contact_person, category, address, phone, email, bank_name, bank_account) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [companyId, code || 'VEND-' + Date.now(), vendor_name, contact_person, category, address, phone, email, bank_name, bank_account]
            );
            return res.json({ success: true, message: 'Vendor berhasil ditambahkan.', id: result.insertId });
        } catch (dbErr) {
            const newVend = { id: MOCK_VENDORS.length + 1, company_id: companyId, code: code || 'VEND-NEW', vendor_name, contact_person, category, address, phone, email, bank_name, bank_account };
            MOCK_VENDORS.push(newVend);
            return res.json({ success: true, message: 'Vendor berhasil ditambahkan (Mock).', id: newVend.id });
        }
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
}

module.exports = {
    getVendors,
    createVendor
};
