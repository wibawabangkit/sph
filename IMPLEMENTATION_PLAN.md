# 📝 RENCANA IMPLEMENTASI (/plan)
## WORD-STYLE DYNAMIC TABLE BUILDER

> **Target Dokumen Spesifikasi:** [DYNAMIC_TABLE_WORD_SPEC.md](file:///home/wibawabangkit/.gemini/antigravity/scratch/heksa-quotation-generator/DYNAMIC_TABLE_WORD_SPEC.md)  
> **Status:** Menunggu Persetujuan Rencana (Pending Approval)  

---

## 🛠️ RENCANA TAHAPAN EKSEKUSI (STEP-BY-STEP PLAN)

### 📌 Tahap 1: Refactoring State & Logika Lebar Kolom (`app.js`)
- **Tujuan:** Menyiapkan struktur data `customColumns` pada state aplikasi dan fungsi penyeimbang lebar otomatis (*Auto Normalization*).
- **Langkah-Langkah:**
  1. Perbarui `DEFAULT_DATA` di `app.js` dengan array `customColumns`:
     ```javascript
     customColumns: [
         { id: "col_no", title: "No.", width: 5, align: "center", type: "number" },
         { id: "col_desc", title: "Deskripsi Pekerjaan", width: 50, align: "left", type: "text" },
         { id: "col_price", title: "Harga", width: 20, align: "right", type: "currency" },
         { id: "col_qty", title: "Qty", width: 8, align: "center", type: "number" },
         { id: "col_total", title: "Total", width: 17, align: "right", type: "formula_total" }
     ]
     ```
  2. Buat fungsi helper `normalizeColumnWidths()`:
     Mengalkulasi persentase lebar seluruh kolom agar totalnya selalu tepat **100%**.

---

### 📌 Tahap 2: Antarmuka Desainer Kolom di Sidebar (`index.html`)
- **Tujuan:** Membangun kontrol visual di sidebar agar pengguna bisa menambah, merubah judul, menggeser lebar, merubah alignment, dan menghapus kolom.
- **Langkah-Langkah:**
  1. Tambahkan panel UI di bagian Section 4 `index.html`:
     - Tombol `[ + Tambah Kolom ]` & `[ ⚖️ Auto Balance 100% ]`.
     - Container `#column-designer-list` untuk menampilkan daftar kartu pengaturan setiap kolom.
  2. Buat fungsi `renderColumnDesigner()` di `app.js` untuk merender kartu kontrol kolom.

---

### 📌 Tahap 3: Dynamic Rendering Engine (`app.js`)
- **Tujuan:** Merender `<thead>`, `<tbody>`, dan `<tfoot>` secara 100% dinamis berdasarkan `customColumns`.
- **Langkah-Langkah:**
  1. **Render Header (`<thead>`):**
     Menghasilkan sel `<th>` dengan `style="width: X%; text-align: align;"` untuk setiap kolom di `customColumns`.
  2. **Render Body (`<tbody>`):**
     Menghasilkan baris item penawaran. Untuk sel berjenis `formula_total`, hitung otomatis subtotal tanpa perlu di-input manual.
  3. **Render Footer (`<tfoot>`):**
     Menyesuaikan `colspan` baris Grand Total secara otomatis (`colspan = customColumns.length - 1`).

---

### 📌 Tahap 4: Proteksi CSS & Layout Safety (`style.css`)
- **Tujuan:** Memastikan tabel tidak pernah melar keluar dari batas margin kertas A4.
- **Langkah-Langkah:**
  1. Kunci tabel dengan `table-layout: fixed; width: 100%;`.
  2. Pastikan sel memiliki `word-break: break-word; overflow-wrap: break-word; box-sizing: border-box;`.

---

### 📌 Tahap 5: Pengujian & Validasi
- **Tujuan:** Memastikan seluruh fungsi berjalan 100% lancar dan tersimpan ke LocalStorage.
- **Langkah-Langkah:**
  1. Tes penambahan & penghapusan kolom.
  2. Tes penyesuaian lebar kolom (5% s/d 80%).
  3. Tes cetak PDF untuk memastikan tidak ada kolom yang terpotong.

---

## ❓ VERIFIKASI RENCANA EKSEKUSI

File rencana implementasi telah dibuat di:  
📄 **[IMPLEMENTATION_PLAN.md](file:///home/wibawabangkit/.gemini/antigravity/scratch/heksa-quotation-generator/IMPLEMENTATION_PLAN.md)**

Silakan periksa rencana tahapan pengerjaan di atas. **Apakah rencana ini sudah disetujui untuk mulai dieksekusi ke dalam kode?**
