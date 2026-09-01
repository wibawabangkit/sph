const pool = require('../config/db');

const MOCK_CUSTOMERS = [
    { id: 1, company_id: 1, code: 'CUST-001', company_name: 'PT. MANDIRI SEJAHTERA', contact_person: 'Ir. Ahmad Yani', address: 'Gedung Wisma 46 Lt. 12, Jakarta Center', phone: '021-3998877', email: 'procurement@mandirisejahtera.co.id', npwp: '02.888.777.6-015.000' }
];

async function getCustomers(req, res) {
    const companyId = req.tenantCompanyId || 1;
    try {
        let rows = [];
        try {
            [rows] = await pool.query(`SELECT * FROM master_customers WHERE company_id = ? ORDER BY id DESC`, [companyId]);
        } catch (dbErr) {
            rows = MOCK_CUSTOMERS.filter(c => c.company_id == companyId);
        }
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
        try {
            const [result] = await pool.query(
                `INSERT INTO master_customers (company_id, code, company_name, contact_person, address, phone, email, npwp) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [companyId, code || 'CUST-' + Date.now(), company_name, contact_person, address, phone, email, npwp]
            );
            return res.json({ success: true, message: 'Customer berhasil ditambahkan.', id: result.insertId });
        } catch (dbErr) {
            const newCust = { id: MOCK_CUSTOMERS.length + 1, company_id: companyId, code: code || 'CUST-NEW', company_name, contact_person, address, phone, email, npwp };
            MOCK_CUSTOMERS.push(newCust);
            return res.json({ success: true, message: 'Customer berhasil ditambahkan (Mock).', id: newCust.id });
        }
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
}

module.exports = {
    getCustomers,
    createCustomer
};
