# 📋 SPESIFIKASI ARSITEKTUR TEKNIS (/spec)
## DYNAMIC WORD-STYLE TABLE BUILDER (TABEL DINAMIS ALA MICROSOFT WORD)

> **Versi Spesifikasi:** 1.0.0 (Spesifikasi Terpisah Khusus Tabel Dinamis)  
> **Status:** Peninjauan & Persetujuan (Pending User Approval)  
> **Target Modul:** Penawaran & Rincian Harga (Lembar 2)  

---

## 1. 🎯 GAMBARAN UMUM FITUR (WORD-LIKE CUSTOM TABLE)

Fitur ini memungkinkan pengguna untuk **membuat dan mengatur kolom tabel secara bebas layaknya di Microsoft Word**, meliputi:
1. **Jumlah Kolom Bebas (N Kolom):** Pengguna dapat menambah, mengurutkan, atau menghapus kolom secara dinamis (misal: 3 kolom, 6 kolom, 8 kolom).
2. **Pengaturan Lebar Kolom Kustom (Column Width Adjuster):** Pengguna dapat menggeser/mengisi persentase lebar masing-masing kolom (misal: Kolom 1 = 5%, Kolom 2 = 40%, Kolom 3 = 15%, dst.).
3. **Pengaturan Tipe & Aligment Sel:**
   - **Rata Teks (Alignment):** Kiri (`text-left`), Tengah (`text-center`), Kanan (`text-right`).
   - **Tipe Data:** Teks Bebas, Angka, Mata Uang (Rp), atau Formula Subtotal Otomatis (Harga × Qty).
4. **Proteksi Auto 100% Lebar Dokumen (Safety Bounds):** Total persentase lebar seluruh kolom di-normalisasi agar selalu pas **100%** dari kontainer A4, sehingga **tidak akan pernah terpotong atau melebih batas margin**.

---

## 2. 🎨 SKEMA ANTARMUKA EDITOR SIDEBAR (UI DESIGN)

Di sidebar bagian **Rincian Harga**, akan terdapat panel khusus **"🎨 Desainer Kolom Tabel (Word Style)"**:

```
┌─────────────────────────────────────────────────────────────┐
│ ⚙️ DESAINER KOLOM TABEL (WORD STYLE)                        │
├─────────────────────────────────────────────────────────────┤
│  [ + Tambah Kolom Baru ]   [ ⚖️ Auto Balance (100%) ]      │
│                                                             │
│  ▼ Kolom #1: No.                                            │
│    Judul: [ No. ]   Tipe: [ Angka ]   Rata: [ Tengah ]      │
│    Lebar: [====|--------] 5%                                │
│                                                             │
│  ▼ Kolom #2: Deskripsi Pekerjaan                            │
│    Judul: [ Deskripsi Pekerjaan ]  Rata: [ Kiri ]           │
│    Lebar: [============|----] 45%                            │
│                                                             │
│  ▼ Kolom #3: Spesifikasi / Merk                             │
│    Judul: [ Merk / Type ]          Rata: [ Kiri ]           │
│    Lebar: [======|----------] 15%                            │
│                                                             │
│  ▼ Kolom #4: Harga Satuan                                   │
│    Judul: [ Harga Satuan ]  Tipe: [ Mata Uang (Rp) ]       │
│    Lebar: [======|----------] 15%                            │
│                                                             │
│  ▼ Kolom #5: Total                                          │
│    Judul: [ Total ]   Tipe: [ Auto Subtotal = Harga x Qty ] │
│    Lebar: [========|--------] 20%                           │
│                                                             │
│   Total Lebar Saat Ini: 100% (Sempurna / Fit A4)             │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. ⚙️ STRUKTUR DATA STATE (`appState`)

Konfigurasi kolom disimpan dalam bentuk array objek dinamis di `appState`:

```javascript
{
    // Konfigurasi Kolom Dinamis (Word Style)
    customColumns: [
        { id: "col_no", title: "No.", width: 5, align: "center", type: "number", isCalc: false },
        { id: "col_desc", title: "Deskripsi Pekerjaan", width: 40, align: "left", type: "text", isCalc: false },
        { id: "col_spec", title: "Spesifikasi / Merk", width: 15, align: "left", type: "text", isCalc: false },
        { id: "col_unit", title: "Satuan", width: 8, align: "center", type: "text", isCalc: false },
        { id: "col_price", title: "Harga Satuan", width: 15, align: "right", type: "currency", isCalc: false },
        { id: "col_total", title: "Total", width: 17, align: "right", type: "formula_total", isCalc: true }
    ],

    // Data Baris (Mengikuti ID Kolom yang Aktif)
    items: [
        {
            col_no: 1,
            col_desc: "Pekerjaan Instalasi Jaringan",
            col_spec: "Cat6 Mikrotik",
            col_unit: "Ls",
            col_price: 5000000,
            col_qty: 1
        }
    ]
}
```

---

## 4. 📐 LOGIKA KALKULASI & PROTEKSI LAYOUT (SAFETY BOUNDS)

1. **Auto Normalization (Mencegah Overflow):**
   Jika pengguna memasukkan lebar kolom yang totalnya lebih dari 100% (misal total = 120%), sistem secara otomatis menyeimbangkan (*normalize*) persentase setiap kolom secara proporsional agar totalnya kembali **tepat 100%**.
   
   $$\text{Lebar Efektif} = \left( \frac{\text{Lebar Kolom}}{\text{Total Seluruh Lebar}} \right) \times 100\%$$

2. **Aturan CSS Render A4:**
   - `table-layout: fixed; width: 100%;`
   - `word-break: break-word; overflow-wrap: break-word;`
   - Setiap sel `<th>` dan `<td>` akan mengambil persentase `width: X%` secara kaku sesuai konfigurasi yang dibuat pengguna.

---

## 5. 🛠️ RENCANA TAHAPAN IMPLEMENTASI (EXECUTION PLAN)

1. **Tahap 1: Pembaruan State Management (`app.js`)**
   - Menambahkan default `customColumns` dan fungsi auto-normalisasi lebar.
2. **Tahap 2: UI Panel Desainer Kolom Sidebar (`index.html`)**
   - Membuat editor manajemen kolom (tambah, ubah judul, ubah lebar %, ubah alignment, hapus kolom).
3. **Tahap 3: Dynamic Table Generator (Render Head & Body)**
   - Mengubah `renderTable()` agar membaca `customColumns` untuk menghasilkan `<th>` dan `<td>` secara 100% dinamis.
4. **Tahap 4: Pengujian & Validasi Margin A4**
   - Memastikan tabel dengan 3 hingga 10+ kolom tetap rapi dan tidak pernah keluar dari batas kertas A4 saat dicetak/export PDF.

---

## ❓ MOHON PERSETUJUAN DOKUMEN SPESIFIKASI

Spesifikasi terpisah untuk **Word-Style Dynamic Table Builder** telah ditulis ke file:  
📄 **[DYNAMIC_TABLE_WORD_SPEC.md](file:///home/wibawabangkit/.gemini/antigravity/scratch/heksa-quotation-generator/DYNAMIC_TABLE_WORD_SPEC.md)**

Silakan periksa spesifikasi ini. **Apakah rancangan ini sudah sesuai dan disetujui untuk mulai dikerjakan pada kode?**
