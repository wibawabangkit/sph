const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8085;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static Frontend Serving
app.use(express.static(path.join(__dirname, './')));

// API Routes Registration (12 Main ERP Modules)
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/companies', require('./routes/companyRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/customers', require('./routes/customerRoutes'));
app.use('/api/vendors', require('./routes/vendorRoutes'));
app.use('/api/quotations', require('./routes/quotationRoutes'));
app.use('/api/po', require('./routes/poRoutes'));
app.use('/api/do', require('./routes/doRoutes'));
app.use('/api/ttb', require('./routes/ttbRoutes'));
app.use('/api/bast', require('./routes/bastRoutes'));
app.use('/api/invoices', require('./routes/invoiceRoutes'));
app.use('/api/receipts', require('./routes/receiptRoutes'));

// Health Check API
app.get('/api/health', (req, res) => {
    res.json({
        status: 'UP',
        system: 'Multi-Tenant Enterprise ERP Platform',
        timestamp: new Date().toISOString()
    });
});

// Fallback SPA Router to index.html
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Global Error Handler
app.use((err, req, res, next) => {
    console.error('SERVER ERROR:', err.stack);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan internal pada server.', error: err.message });
});

if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`🚀 Multi-Tenant Enterprise ERP Server running on http://localhost:${PORT}`);
    });
}

module.exports = app;
