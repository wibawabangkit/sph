-- =========================================================
-- DATABASE SCHEMA DDL: MULTI-TENANT ENTERPRISE ERP SYSTEM
-- DATABASE: enterprise_db
-- =========================================================

CREATE DATABASE IF NOT EXISTS enterprise_db;
USE enterprise_db;

-- 1. TABEL PROFIL PERUSAHAAN (TENANT MASTER)
CREATE TABLE IF NOT EXISTS master_companies (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company_code VARCHAR(30) UNIQUE NOT NULL,
    company_name VARCHAR(150) NOT NULL,
    legal_name VARCHAR(150),
    address TEXT,
    phone VARCHAR(30),
    email VARCHAR(100),
    npwp VARCHAR(50),
    logo_data LONGTEXT,
    stamp_data LONGTEXT,
    default_signer_name VARCHAR(100),
    default_signer_role VARCHAR(100),
    bank_name VARCHAR(50),
    bank_account_no VARCHAR(50),
    bank_account_name VARCHAR(100),
    doc_prefix VARCHAR(20) DEFAULT 'SPH',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 2. TABEL PENGGUNA & AKUN (USER MANAGEMENT & ROLES)
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company_id INT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    role ENUM('SUPER_ADMIN', 'COMPANY_ADMIN', 'COMPANY_STAFF') NOT NULL DEFAULT 'COMPANY_ADMIN',
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES master_companies(id) ON DELETE CASCADE
);

-- 3. TABEL MASTER CUSTOMER (TENANT SCOPE)
CREATE TABLE IF NOT EXISTS master_customers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company_id INT NOT NULL,
    code VARCHAR(30) NOT NULL,
    company_name VARCHAR(150) NOT NULL,
    contact_person VARCHAR(100),
    address TEXT,
    phone VARCHAR(30),
    email VARCHAR(100),
    npwp VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES master_companies(id) ON DELETE CASCADE
);

-- 4. TABEL MASTER VENDOR (TENANT SCOPE)
CREATE TABLE IF NOT EXISTS master_vendors (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company_id INT NOT NULL,
    code VARCHAR(30) NOT NULL,
    vendor_name VARCHAR(150) NOT NULL,
    contact_person VARCHAR(100),
    category VARCHAR(80),
    address TEXT,
    phone VARCHAR(30),
    email VARCHAR(100),
    bank_name VARCHAR(50),
    bank_account VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES master_companies(id) ON DELETE CASCADE
);

-- 5. TABEL QUOTATIONS / SURAT PENAWARAN HARGA (WORD-STYLE DYNAMIC COLUMNS)
CREATE TABLE IF NOT EXISTS quotations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company_id INT NOT NULL,
    quotation_no VARCHAR(50) UNIQUE NOT NULL,
    quotation_date DATE NOT NULL,
    customer_id INT,
    customer_name VARCHAR(150) NOT NULL,
    customer_address TEXT,
    annex_title VARCHAR(255) DEFAULT 'SPESIFIKASI PEKERJAAN DAN RINCIAN HARGA',
    status ENUM('inisiasi', 'nego', 'closing') DEFAULT 'inisiasi',
    show_grand_total TINYINT(1) DEFAULT 1,
    custom_columns JSON NOT NULL,
    items JSON NOT NULL,
    notes JSON,
    signer_name VARCHAR(100),
    signer_role VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES master_companies(id) ON DELETE CASCADE,
    FOREIGN KEY (customer_id) REFERENCES master_customers(id) ON DELETE SET NULL
);

-- 6. TABEL PURCHASE ORDERS (PO)
CREATE TABLE IF NOT EXISTS purchase_orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company_id INT NOT NULL,
    po_no VARCHAR(50) UNIQUE NOT NULL,
    po_date DATE NOT NULL,
    quotation_id INT,
    vendor_id INT,
    vendor_name VARCHAR(150) NOT NULL,
    delivery_date DATE,
    terms_of_payment VARCHAR(100),
    items JSON NOT NULL,
    total_amount DECIMAL(15,2) DEFAULT 0,
    status VARCHAR(30) DEFAULT 'Draft',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES master_companies(id) ON DELETE CASCADE,
    FOREIGN KEY (quotation_id) REFERENCES quotations(id) ON DELETE SET NULL,
    FOREIGN KEY (vendor_id) REFERENCES master_vendors(id) ON DELETE SET NULL
);

-- 7. TABEL DELIVERY ORDERS (DO / SURAT JALAN)
CREATE TABLE IF NOT EXISTS delivery_orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company_id INT NOT NULL,
    do_no VARCHAR(50) UNIQUE NOT NULL,
    do_date DATE NOT NULL,
    quotation_id INT,
    customer_name VARCHAR(150) NOT NULL,
    delivery_address TEXT,
    driver_name VARCHAR(100),
    vehicle_no VARCHAR(30),
    items JSON NOT NULL,
    status VARCHAR(30) DEFAULT 'Pengiriman',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES master_companies(id) ON DELETE CASCADE,
    FOREIGN KEY (quotation_id) REFERENCES quotations(id) ON DELETE SET NULL
);

-- 8. TABEL GOODS RECEIPTS (TANDA TERIMA BARANG - TTB)
CREATE TABLE IF NOT EXISTS goods_receipts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company_id INT NOT NULL,
    ttb_no VARCHAR(50) UNIQUE NOT NULL,
    ttb_date DATE NOT NULL,
    ref_no VARCHAR(50),
    sender_name VARCHAR(150) NOT NULL,
    receiver_name VARCHAR(150) NOT NULL,
    warehouse_location VARCHAR(150),
    items JSON NOT NULL,
    notes TEXT,
    receiver_signer_name VARCHAR(100),
    sender_signer_name VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES master_companies(id) ON DELETE CASCADE
);

-- 9. TABEL BAST (BERITA ACARA SERAH TERIMA)
CREATE TABLE IF NOT EXISTS bast_documents (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company_id INT NOT NULL,
    bast_no VARCHAR(50) UNIQUE NOT NULL,
    bast_date DATE NOT NULL,
    quotation_id INT,
    customer_name VARCHAR(150) NOT NULL,
    project_name VARCHAR(200) NOT NULL,
    location TEXT,
    work_scope TEXT,
    status VARCHAR(30) DEFAULT 'Selesai',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES master_companies(id) ON DELETE CASCADE,
    FOREIGN KEY (quotation_id) REFERENCES quotations(id) ON DELETE SET NULL
);

-- 10. TABEL INVOICES (FAKTUR PENAGIHAN PPN KUSTOM & DUAL TEMPLATE)
CREATE TABLE IF NOT EXISTS invoices (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company_id INT NOT NULL,
    invoice_no VARCHAR(50) UNIQUE NOT NULL,
    invoice_date DATE NOT NULL,
    due_date DATE,
    quotation_id INT,
    template_type ENUM('TEMPLATE_1_HEKSA', 'TEMPLATE_2_MTU') DEFAULT 'TEMPLATE_1_HEKSA',
    customer_name VARCHAR(150) NOT NULL,
    customer_address TEXT,
    terms_of_payment VARCHAR(100),
    items JSON,
    subtotal DECIMAL(15,2) DEFAULT 0,
    dp_amount DECIMAL(15,2) DEFAULT 0,
    discount_amount DECIMAL(15,2) DEFAULT 0,
    tax_rate_percent DECIMAL(5,2) DEFAULT 11.00,
    tax_amount DECIMAL(15,2) DEFAULT 0,
    grand_total DECIMAL(15,2) DEFAULT 0,
    status ENUM('unpaid', 'partially_paid', 'paid', 'cancelled') DEFAULT 'unpaid',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES master_companies(id) ON DELETE CASCADE,
    FOREIGN KEY (quotation_id) REFERENCES quotations(id) ON DELETE SET NULL
);

-- 11. TABEL RECEIPTS (KWITANSI PEMBAYARAN TERBILANG RP)
CREATE TABLE IF NOT EXISTS receipts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company_id INT NOT NULL,
    receipt_no VARCHAR(50) UNIQUE NOT NULL,
    receipt_date DATE NOT NULL,
    invoice_id INT,
    received_from VARCHAR(150) NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    amount_spelled TEXT NOT NULL,
    payment_for TEXT NOT NULL,
    payment_method VARCHAR(50) DEFAULT 'Transfer Bank',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES master_companies(id) ON DELETE CASCADE,
    FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE SET NULL
);

-- SEED DATA DEFAULT
INSERT INTO master_companies (id, company_code, company_name, legal_name, address, phone, email, npwp, default_signer_name, default_signer_role, bank_name, bank_account_no, bank_account_name, doc_prefix)
VALUES (1, 'HEKSA', 'PT. HEKSA UTAMA', 'PT. HEKSA UTAMA KREASI', 'Jl. Merdeka Selatan No. 88, Jakarta Selatan', '021-5551234', 'info@heksa.co.id', '01.234.567.8-012.000', 'Budi Santoso, S.T.', 'Direktur Utama', 'Bank Mandiri', '123-00-998877-1', 'PT HEKSA UTAMA KREASI', 'SPH')
ON DUPLICATE KEY UPDATE company_name=VALUES(company_name);

-- Default Users (Password: Admin123!)
-- Hash for 'Admin123!' using bcrypt: $2a$10$e7m/aC.L.O4tW6/tXzN... (will be handled by db init script)
INSERT INTO users (id, company_id, username, email, password_hash, full_name, role, status)
VALUES 
(1, NULL, 'superadmin', 'admin@system.local', '$2a$10$wE9K2j0h1X1.4iO84f4pUu2xJbK9bC2r5v9L8N.3z0n1O2p3Q4r5s', 'System Super Admin', 'SUPER_ADMIN', 'active'),
(2, 1, 'admin_heksa', 'admin@heksa.co.id', '$2a$10$wE9K2j0h1X1.4iO84f4pUu2xJbK9bC2r5v9L8N.3z0n1O2p3Q4r5s', 'Admin PT. Heksa', 'COMPANY_ADMIN', 'active')
ON DUPLICATE KEY UPDATE full_name=VALUES(full_name);
