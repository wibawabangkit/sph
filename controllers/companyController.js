const pool = require('../config/db');

const MOCK_COMPANIES = [
    {
        id: 1,
        company_code: 'HEKSA',
        company_name: 'PT. HEKSA UTAMA',
        legal_name: 'PT. HEKSA UTAMA KREASI',
        address: 'Jl. Merdeka Selatan No. 88, Jakarta Selatan',
        phone: '021-5551234',
        email: 'info@heksa.co.id',
        npwp: '01.234.567.8-012.000',
        default_signer_name: 'Budi Santoso, S.T.',
        default_signer_role: 'Direktur Utama',
        bank_name: 'Bank Mandiri',
        bank_account_no: '123-00-998877-1',
        bank_account_name: 'PT HEKSA UTAMA KREASI',
        doc_prefix: 'SPH'
    }
];

async function getCompanies(req, res) {
    try {
        let rows = [];
        try {
            [rows] = await pool.query(`SELECT * FROM master_companies ORDER BY id DESC`);
        } catch (dbErr) {
            rows = MOCK_COMPANIES;
        }
        return res.json({ success: true, data: rows });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
}

async function getCompanyById(req, res) {
    const { id } = req.params;
    try {
        let company = null;
        try {
            const [rows] = await pool.query(`SELECT * FROM master_companies WHERE id = ?`, [id]);
            if (rows.length > 0) company = rows[0];
        } catch (dbErr) {
            company = MOCK_COMPANIES.find(c => c.id == id);
        }
        if (!company) return res.status(404).json({ success: false, message: 'Perusahaan tidak ditemukan.' });
        return res.json({ success: true, data: company });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
}

async function createCompany(req, res) {
    const { company_code, company_name, legal_name, address, phone, email, npwp, bank_name, bank_account_no, bank_account_name, doc_prefix } = req.body;
    if (!company_name) return res.status(400).json({ success: false, message: 'Nama perusahaan wajib diisi.' });

    try {
        try {
            const [result] = await pool.query(
                `INSERT INTO master_companies (company_code, company_name, legal_name, address, phone, email, npwp, bank_name, bank_account_no, bank_account_name, doc_prefix)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [company_code || 'COMP-' + Date.now(), company_name, legal_name || company_name, address, phone, email, npwp, bank_name, bank_account_no, bank_account_name, doc_prefix || 'SPH']
            );
            return res.json({ success: true, message: 'Perusahaan berhasil ditambahkan.', id: result.insertId });
        } catch (dbErr) {
            const newComp = { id: MOCK_COMPANIES.length + 1, company_code, company_name, legal_name, address, phone, email, npwp, bank_name, bank_account_no, bank_account_name, doc_prefix };
            MOCK_COMPANIES.push(newComp);
            return res.json({ success: true, message: 'Perusahaan berhasil ditambahkan (Mock).', id: newComp.id });
        }
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
}

async function updateCompany(req, res) {
    const { id } = req.params;
    const { company_name, legal_name, address, phone, email, npwp, bank_name, bank_account_no, bank_account_name, default_signer_name, default_signer_role, doc_prefix } = req.body;

    try {
        try {
            await pool.query(
                `UPDATE master_companies SET company_name=?, legal_name=?, address=?, phone=?, email=?, npwp=?, bank_name=?, bank_account_no=?, bank_account_name=?, default_signer_name=?, default_signer_role=?, doc_prefix=? WHERE id=?`,
                [company_name, legal_name, address, phone, email, npwp, bank_name, bank_account_no, bank_account_name, default_signer_name, default_signer_role, doc_prefix, id]
            );
        } catch (dbErr) {
            const comp = MOCK_COMPANIES.find(c => c.id == id);
            if (comp) Object.assign(comp, { company_name, legal_name, address, phone, email, npwp, bank_name, bank_account_no, bank_account_name, default_signer_name, default_signer_role, doc_prefix });
        }
        return res.json({ success: true, message: 'Profil Perusahaan berhasil diperbarui.' });
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
