const pool = require('../config/db');

async function getInvoices(req, res) {
    const companyId = req.tenantCompanyId || 1;
    try {
        const [rows] = await pool.query(`SELECT * FROM invoices WHERE company_id = ? ORDER BY id DESC`, [companyId]);
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
        const [result] = await pool.query(
            `INSERT INTO invoices (company_id, invoice_no, invoice_date, due_date, quotation_id, template_type, customer_name, subtotal, dp_amount, discount_amount, tax_rate_percent, tax_amount, grand_total, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [companyId, invoice_no, invoice_date || new Date().toISOString().split('T')[0], due_date || null, quotation_id || null, tType, customer_name, sub, dp, disc, taxRate, taxAmount, grandTotal, status || 'unpaid']
        );
        return res.json({ success: true, message: 'Faktur Penagihan (Invoice) berhasil dibuat ke MySQL.', id: result.insertId });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
}

module.exports = {
    getInvoices,
    createInvoice
};
