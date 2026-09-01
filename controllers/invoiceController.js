const pool = require('../config/db');

const MOCK_INVOICES = [
    {
        id: 1,
        company_id: 1,
        invoice_no: 'INV/2026/09/001',
        invoice_date: '2026-09-01',
        due_date: '2026-09-15',
        template_type: 'TEMPLATE_1_HEKSA',
        customer_name: 'PT. MANDIRI SEJAHTERA',
        subtotal: 10000000,
        dp_amount: 0,
        discount_amount: 0,
        tax_rate_percent: 11,
        tax_amount: 1100000,
        grand_total: 11100000,
        status: 'unpaid'
    },
    {
        id: 2,
        company_id: 1,
        invoice_no: 'PI-MTU/INV/2607/00002',
        invoice_date: '2026-09-01',
        due_date: '2026-09-15',
        template_type: 'TEMPLATE_2_MTU',
        customer_name: 'FACTORY DELTA ANUGERAH',
        subtotal: 1000000,
        dp_amount: 0,
        discount_amount: 0,
        tax_rate_percent: 11,
        tax_amount: 110000,
        grand_total: 1110000,
        status: 'unpaid'
    }
];

async function getInvoices(req, res) {
    const companyId = req.tenantCompanyId || 1;
    try {
        let rows = [];
        try {
            [rows] = await pool.query(`SELECT * FROM invoices WHERE company_id = ? ORDER BY id DESC`, [companyId]);
        } catch (dbErr) {
            rows = MOCK_INVOICES.filter(i => i.company_id == companyId);
        }
        return res.json({ success: true, data: rows });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
}

async function createInvoice(req, res) {
    const companyId = req.tenantCompanyId || 1;
    const { invoice_no, invoice_date, due_date, quotation_id, template_type, customer_name, subtotal, dp_amount, discount_amount, tax_rate_percent, status } = req.body;
    if (!invoice_no || !customer_name) {
        return res.status(400).json({ success: false, message: 'Nomor Invoice dan Nama Customer wajib diisi.' });
    }

    const sub = parseFloat(subtotal) || 0;
    const dp = parseFloat(dp_amount) || 0;
    const disc = parseFloat(discount_amount) || 0;
    const dpp = Math.max(0, sub - dp - disc);
    const taxRate = parseFloat(tax_rate_percent) !== undefined ? parseFloat(tax_rate_percent) : 11.0;
    const taxAmount = (dpp * taxRate) / 100;
    const grandTotal = dpp + taxAmount;
    const tType = template_type === 'TEMPLATE_2_MTU' ? 'TEMPLATE_2_MTU' : 'TEMPLATE_1_HEKSA';

    try {
        try {
            const [result] = await pool.query(
                `INSERT INTO invoices (company_id, invoice_no, invoice_date, due_date, quotation_id, template_type, customer_name, subtotal, dp_amount, discount_amount, tax_rate_percent, tax_amount, grand_total, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [companyId, invoice_no, invoice_date || new Date().toISOString().split('T')[0], due_date || null, quotation_id || null, tType, customer_name, sub, dp, disc, taxRate, taxAmount, grandTotal, status || 'unpaid']
            );
            return res.json({ success: true, message: 'Faktur Penagihan (Invoice) berhasil dibuat.', id: result.insertId });
        } catch (dbErr) {
            const mock = { id: MOCK_INVOICES.length + 1, company_id: companyId, invoice_no, invoice_date, due_date, quotation_id, template_type: tType, customer_name, subtotal: sub, dp_amount: dp, discount_amount: disc, tax_rate_percent: taxRate, tax_amount: taxAmount, grand_total: grandTotal, status: status || 'unpaid' };
            MOCK_INVOICES.push(mock);
            return res.json({ success: true, message: 'Faktur Penagihan (Invoice) berhasil dibuat (Mock).', id: mock.id });
        }
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
}

module.exports = {
    getInvoices,
    createInvoice
};
