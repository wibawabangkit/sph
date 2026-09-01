const pool = require('../config/db');

const MOCK_RECEIPTS = [];

function numberToTerbilang(angka) {
    const bil = ["", "Satu", "Dua", "Tiga", "Empat", "Lima", "Enam", "Tujuh", "Delapan", "Sembilan", "Sepuluh", "Sebelas"];
    let n = Math.abs(Math.floor(angka));
    if (n < 12) return bil[n];
    if (n < 20) return numberToTerbilang(n - 10) + " Belas";
    if (n < 100) return numberToTerbilang(Math.floor(n / 10)) + " Puluh " + numberToTerbilang(n % 10);
    if (n < 200) return "Seratus " + numberToTerbilang(n - 100);
    if (n < 1000) return numberToTerbilang(Math.floor(n / 100)) + " Ratus " + numberToTerbilang(n % 100);
    if (n < 2000) return "Seribu " + numberToTerbilang(n - 1000);
    if (n < 1000000) return numberToTerbilang(Math.floor(n / 1000)) + " Ribu " + numberToTerbilang(n % 1000);
    if (n < 1000000000) return numberToTerbilang(Math.floor(n / 1000000)) + " Juta " + numberToTerbilang(n % 1000000);
    if (n < 1000000000000) return numberToTerbilang(Math.floor(n / 1000000000)) + " Milyar " + numberToTerbilang(n % 1000000000);
    return "Angka Terlalu Besar";
}

function getTerbilangRupiah(nominal) {
    const text = numberToTerbilang(nominal).replace(/\s+/g, ' ').trim();
    return text ? text + " Rupiah" : "Nol Rupiah";
}

async function getReceipts(req, res) {
    const companyId = req.tenantCompanyId || 1;
    try {
        let rows = [];
        try {
            [rows] = await pool.query(`SELECT * FROM receipts WHERE company_id = ? ORDER BY id DESC`, [companyId]);
        } catch (dbErr) {
            rows = MOCK_RECEIPTS.filter(r => r.company_id == companyId);
        }
        return res.json({ success: true, data: rows });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
}

async function createReceipt(req, res) {
    const companyId = req.tenantCompanyId || 1;
    const { receipt_no, receipt_date, invoice_id, received_from, amount, payment_for, payment_method } = req.body;
    if (!receipt_no || !received_from || !amount) {
        return res.status(400).json({ success: false, message: 'Nomor Kwitansi, Pembayar, dan Jumlah Nominal wajib diisi.' });
    }

    const numAmount = parseFloat(amount) || 0;
    const amountSpelled = getTerbilangRupiah(numAmount);

    try {
        try {
            const [result] = await pool.query(
                `INSERT INTO receipts (company_id, receipt_no, receipt_date, invoice_id, received_from, amount, amount_spelled, payment_for, payment_method) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [companyId, receipt_no, receipt_date || new Date().toISOString().split('T')[0], invoice_id || null, received_from, numAmount, amountSpelled, payment_for || '', payment_method || 'Transfer Bank']
            );
            return res.json({ success: true, message: 'Kwitansi Pembayaran berhasil dibuat.', id: result.insertId, amount_spelled: amountSpelled });
        } catch (dbErr) {
            const mock = { id: MOCK_RECEIPTS.length + 1, company_id: companyId, receipt_no, receipt_date, received_from, amount: numAmount, amount_spelled: amountSpelled, payment_for, payment_method: payment_method || 'Transfer Bank' };
            MOCK_RECEIPTS.push(mock);
            return res.json({ success: true, message: 'Kwitansi Pembayaran berhasil dibuat (Mock).', id: mock.id, amount_spelled: amountSpelled });
        }
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
}

module.exports = {
    getReceipts,
    createReceipt,
    getTerbilangRupiah
};
