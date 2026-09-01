# Rencana Implementasi: Multi-Tenant Enterprise ERP Platform

## Overview (Gambaran Umum)
Mengembangkan **Multi-Tenant Enterprise ERP Platform** terisolasi penuh dengan autentikasi per perusahaan, role Super Admin & User Impersonation, serta siklus lengkap 12 modul dokumen bisnis (Penawaran Word-Style, PO, DO, TTB, BAST, Invoice PPN Kustom, & Kwitansi) berbasis MySQL database (`enterprise_db`).

## Architecture Decisions (Keputusan Arsitektur)
- **Tenant Isolation:** Seluruh tabel transaksi dan master tenant mewajibkan kolom `company_id` dengan enforce `tenantMiddleware`.
- **User Impersonation:** Super Admin dapat masuk ke konteks perusahaan mana pun menggunakan JWT token temporary ber-flag `impersonated_by`.
- **Word-Style Dynamic Columns:** Penyimpanan metadata kolom dinamis menggunakan tipe data `JSON` pada field `custom_columns` di tabel `quotations`.
- **Penomoran Dokumen:** Manual/bebas diisi oleh user tanpa batasan kaku.
- **Mata Uang & PPN:** 100% Rupiah (Rp) dengan input persentase PPN kustom di Invoice (`tax_rate_percent`).

---

## Task List (Daftar Tugas)

### Fase 1: Setup Backend Server Express & Database MySQL
- [ ] **Tugas 1: Inisialisasi Server Express.js & Connection MySQL Pool**
- [ ] **Tugas 2: Eksekusi DDL `schema.sql` (11 Tabel Database `enterprise_db`)**

### Fase 2: Autentikasi JWT, Tenant Isolation & Impersonasi Engine
- [ ] **Tugas 3: Implementasi Controller Auth & JWT Token Handler**
- [ ] **Tugas 4: Implementasi Middleware Isolasi Tenant (`tenantMiddleware`)**
- [ ] **Tugas 5: Implementasi API Impersonasi (`/api/auth/impersonate`) & Banner Status Header**

### Fase 3: REST API Controllers 12 Modul
- [ ] **Tugas 6: REST API Master Company, User Management, Customer, & Vendor**
- [ ] **Tugas 7: REST API Quotations (Word-Style Columns) & Pipeline Status**
- [ ] **Tugas 8: REST API Purchase Order (PO), Delivery Order (DO), & Tanda Terima Barang (TTB)**
- [ ] **Tugas 9: REST API BAST, Invoice (PPN Kustom), & Kwitansi (Terbilang Rp)**

### Fase 4: Frontend SPA Architecture & UI Impersonation
- [ ] **Tugas 10: Client-Side Router 12 Modul Navigation Sidebar**
- [ ] **Tugas 11: Modul UI User Management Super Admin (Tombol Impersonate) & Header Banner**

### Fase 5: Form Editors & Integration Document Preview
- [ ] **Tugas 12: Form Editors & Cetak A4 PO, DO, TTB, BAST, Invoice, & Kwitansi**

### Fase 6: Testing & End-to-End Verification
- [ ] **Tugas 13: Verifikasi Isolasi Data Tenant & Testing Alur Penawaran ➔ TTB ➔ Invoice ➔ Kwitansi**

---

## Risks and Mitigations (Risiko & Mitigasi)
- **Risiko Tenant Leak:** Mitigasi dengan penegakan otomatis `tenantMiddleware` pada setiap endpoint tenant.
- **Risiko Overflow Tabel A4:** Mitigasi dengan CSS safety bounds (`table-layout: fixed`, `word-break: break-word`, `overflow: hidden`).
