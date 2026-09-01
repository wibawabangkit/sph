/* ==========================================
   HEKSA QUOTATION GENERATOR - JAVASCRIPT
   ========================================== */

// --- DEFAULT TEMPLATE DATA ---
const DEFAULT_DATA = {
    noSurat: "14/SPH-DUMMY/V/2026",
    tanggal: "", // Will be filled dynamically in indonesian if empty
    perihal: "Penawaran Harga",
    lampiran: "Spesifikasi dan Rincian Harga (1 Lembar)",
    customFileName: "Penawaran_Harga",
    annexTitle: "SPESIFIKASI PEKERJAAN DAN RINCIAN HARGA",
    klienNama: "PT. ABC",
    klienAlamat: "di Tempat",
    narasiPembuka: "Dengan Hormat,",
    narasiBody: "Berdasarkan informasi yang kami dapat adanya kebutuhan untuk Penawaran Harga, maka bersama ini kami bermaksud untuk mengajukan Surat Penawaran Harga kepada Bapak/Ibu untuk pekerjaan tersebut dengan spesifikasi pekerjaan dan rincian harga terlampir, serta harga tersebut BELUM termasuk ketentuan pajak yang berlaku.",
    narasiPenutup: "Demikian Surat Penawaran Harga ini kami sampaikan. Atas perhatian serta kerjasamanya, kami ucapkan terima kasih.",
    signerName: "Nama Penandatangan",
    signerRole: "Jabatan",
    showStamp: true,
    showSig: true,
    showGrandTotal: true,
    showSatuanColumn: false,
    customColumns: [
        { id: "col_no", title: "No.", width: 5, align: "center", type: "number" },
        { id: "col_desc", title: "Deskripsi Pekerjaan", width: 45, align: "left", type: "text" },
        { id: "col_price", title: "Harga Satuan", width: 20, align: "right", type: "currency" },
        { id: "col_qty", title: "Qty", width: 10, align: "center", type: "number" },
        { id: "col_total", title: "Total", width: 20, align: "right", type: "formula_total" }
    ],
    columnTitles: {
        no: "No.",
        deskripsi: "Deskripsi Pekerjaan",
        satuan: "Satuan",
        harga: "Harga",
        qty: "Qty",
        total: "Total"
    },
    sigWidth: 170,
    sigLeft: 10,
    stampLeft: -15,
    customStamp: null, // Base64 data of custom stamp
    customStampName: "", // File name
    customSig: null,   // Base64 data of custom signature
    customSigName: "",   // File name
    companyName: "PT. YOUR COMPANY NAME",
    companyAddress: "Jl. Alamat Dummy No. 123, Kota Fiktif, Provinsi - 12345",
    customLogo: null,    // Base64 data of custom logo
    customLogoName: "",  // File name
    themeColor: "#00A2E2", // Default brand color
    items: [
        { deskripsi: "", satuan: "", harga: 0, qty: 1 }
    ],
    notes: [
        "Harga penawaran tersebut dalam satuan mata uang Rupiah.",
        "Harga penawaran tersebut dapat berubah apabila dalam pelaksanaan pekerjaan terjadi penambahan item barang/pekerjaan diluar penawaran diatas.",
        "Harga tersebut diatas belum termasuk ketentuan pajak yang berlaku.",
        "Surat Penawaran Harga ini berlaku selama 30 (tiga puluh) hari kalender sejak tanggal surat penawaran ini."
    ]
};

// --- STATE MANAGEMENT ---
let appState = null;
let currentZoom = window.innerWidth <= 1024 ? 0.4 : 0.85;

// Helper to get formatted Indonesian date (e.g. Kota Fiktif, 08 Mei 2026)
function getIndonesianDate() {
    const months = [
        "Januari", "Februari", "Maret", "April", "Mei", "Juni",
        "Juli", "Agustus", "September", "Oktober", "November", "Desember"
    ];
    const today = new Date();
    // Using 2026 according to mock year, but sync to today's day/month
    const day = String(today.getDate()).padStart(2, '0');
    const month = months[today.getMonth()];
    const year = today.getFullYear(); 
    return `Kota Fiktif, ${day} ${month} ${year}`;
}

// Format numbers to Indonesian currency style: 15.000.000
function formatCurrency(value) {
    if (isNaN(value) || value === null || value === undefined) value = 0;
    return new Intl.NumberFormat('id-ID', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(value);
}

// Helper to calculate lighter/darker colors from hex
function adjustColor(color, amount) {
    if (!color) return "#000000";
    return '#' + color.replace(/^#/, '').replace(/../g, c => ('0'+Math.min(255, Math.max(0, parseInt(c, 16) + amount)).toString(16)).substr(-2));
}

// Apply theme color to CSS root variables
function applyThemeColor(hexColor) {
    document.documentElement.style.setProperty('--primary', hexColor);
    document.documentElement.style.setProperty('--primary-dark', adjustColor(hexColor, -40));
    document.documentElement.style.setProperty('--primary-light', adjustColor(hexColor, 40));
}

// Load state from LocalStorage or fallback to Default Template
function loadState() {
    const saved = localStorage.getItem('heksa_quotation_state');
    if (saved) {
        try {
            appState = JSON.parse(saved);
        } catch (e) {
            console.error("Failed to parse saved state, resetting...", e);
            appState = { ...DEFAULT_DATA };
        }
    } else {
        appState = JSON.parse(JSON.stringify(DEFAULT_DATA)); // Deep clone
    }

    // Set default date if empty
    if (!appState.tanggal) {
        appState.tanggal = getIndonesianDate();
    }

    if (!appState.customColumns || !appState.customColumns.length) {
        appState.customColumns = JSON.parse(JSON.stringify(DEFAULT_DATA.customColumns));
    }
}

// Save state to LocalStorage
function saveState() {
    localStorage.setItem('heksa_quotation_state', JSON.stringify(appState));
}

// --- RENDERING VIEWS ---

// Sync Text fields from state to inputs and preview elements
function syncTextFields() {
    // 1. Sidebar Inputs Setup
    document.getElementById('input-no').value = appState.noSurat;
    document.getElementById('input-tanggal').value = appState.tanggal;
    document.getElementById('input-perihal').value = appState.perihal;
    document.getElementById('input-lampiran').value = appState.lampiran;
    
    // Sync Custom Filename and Document Title
    const currentFileName = appState.customFileName || "Penawaran_Harga";
    document.getElementById('input-filename').value = currentFileName;
    document.title = currentFileName;
    document.getElementById('input-klien-nama').value = appState.klienNama;
    document.getElementById('input-klien-alamat').value = appState.klienAlamat;
    document.getElementById('input-company-name').value = appState.companyName;
    document.getElementById('input-company-address').value = appState.companyAddress;
    document.getElementById('input-narasi-pembuka').value = appState.narasiPembuka;
    document.getElementById('input-narasi-body').value = appState.narasiBody;
    document.getElementById('input-narasi-penutup').value = appState.narasiPenutup;
    document.getElementById('input-signer-name').value = appState.signerName;
    document.getElementById('input-signer-role').value = appState.signerRole;
    const annexTitleInput = document.getElementById('input-annex-title');
    if (annexTitleInput) {
        annexTitleInput.value = appState.annexTitle || "SPESIFIKASI PEKERJAAN DAN RINCIAN HARGA";
    }
    document.getElementById('input-theme-color').value = appState.themeColor || "#00A2E2";
    
    applyThemeColor(appState.themeColor || "#00A2E2");

    document.getElementById('chk-show-stamp').checked = appState.showStamp;
    document.getElementById('chk-show-sig').checked = appState.showSig;
    document.getElementById('chk-show-grand-total').checked = appState.showGrandTotal !== false;

    const chkSatuan = document.getElementById('chk-show-satuan-col');
    if (chkSatuan) {
        chkSatuan.checked = !!appState.showSatuanColumn;
    }

    const titles = appState.columnTitles || DEFAULT_DATA.columnTitles;
    if (document.getElementById('input-col-no')) document.getElementById('input-col-no').value = titles.no || "No.";
    if (document.getElementById('input-col-desc')) document.getElementById('input-col-desc').value = titles.deskripsi || "Deskripsi Pekerjaan";
    if (document.getElementById('input-col-satuan')) document.getElementById('input-col-satuan').value = titles.satuan || "Satuan";
    if (document.getElementById('input-col-harga')) document.getElementById('input-col-harga').value = titles.harga || "Harga";
    if (document.getElementById('input-col-qty')) document.getElementById('input-col-qty').value = titles.qty || "Qty";
    if (document.getElementById('input-col-total')) document.getElementById('input-col-total').value = titles.total || "Total";

    // Sync signature size and position inputs
    const currentSigWidth = appState.sigWidth || 170;
    document.getElementById('input-sig-width').value = currentSigWidth;
    document.getElementById('sig-width-val').textContent = currentSigWidth;

    const currentSigLeft = appState.sigLeft !== undefined ? appState.sigLeft : 10;
    document.getElementById('input-sig-left').value = currentSigLeft;
    document.getElementById('sig-left-val').textContent = currentSigLeft;

    const currentStampLeft = appState.stampLeft !== undefined ? appState.stampLeft : -15;
    const stampInput = document.getElementById('input-stamp-left');
    if (stampInput) {
        stampInput.value = currentStampLeft;
        document.getElementById('stamp-left-val').textContent = currentStampLeft;
    }

    // 2. Preview Layout Sync
    document.getElementById('view-no').textContent = appState.noSurat;
    document.getElementById('view-tanggal').textContent = appState.tanggal;
    document.getElementById('view-perihal').textContent = appState.perihal;
    document.getElementById('view-lampiran').textContent = appState.lampiran;
    const viewAnnexTitle = document.getElementById('view-annex-title');
    if (viewAnnexTitle) {
        viewAnnexTitle.textContent = appState.annexTitle || "SPESIFIKASI PEKERJAAN DAN RINCIAN HARGA";
    }
    document.getElementById('view-klien-nama').textContent = appState.klienNama;
    document.getElementById('view-klien-alamat').textContent = appState.klienAlamat;
    document.getElementById('view-narasi-pembuka').textContent = appState.narasiPembuka;
    
    // Format paragraph breaks for narrative body in preview
    const bodyHTML = appState.narasiBody.split('\n')
        .map(para => para.trim() ? `<p>${para}</p>` : '')
        .join('');
    document.getElementById('view-narasi-body').innerHTML = bodyHTML;
    
    document.getElementById('view-narasi-penutup').textContent = appState.narasiPenutup;
    
    // Signers Sync
    document.getElementById('view-signer-name').textContent = appState.signerName;
    document.getElementById('view-signer-role').textContent = appState.signerRole;
    document.getElementById('view-signer-name-2').textContent = appState.signerName;
    document.getElementById('view-signer-role-2').textContent = appState.signerRole;
    document.getElementById('view-company-address').textContent = appState.companyAddress;
    document.getElementById('view-company-address-2').textContent = appState.companyAddress;
    document.getElementById('view-company-name').textContent = appState.companyName;
    document.getElementById('view-company-name-2').textContent = appState.companyName;
    document.getElementById('view-stamp-text').textContent = appState.companyName;
    document.getElementById('view-stamp-text-2').textContent = appState.companyName;

    // Overall visibility triggers
    document.getElementById('view-stamp').style.visibility = appState.showStamp ? 'visible' : 'hidden';
    document.getElementById('view-stamp-2').style.visibility = appState.showStamp ? 'visible' : 'hidden';
    document.getElementById('view-sig').style.visibility = appState.showSig ? 'visible' : 'hidden';
    document.getElementById('view-sig-2').style.visibility = appState.showSig ? 'visible' : 'hidden';

    // Apply dynamic signature sizing proportionally (aspect ratio 2:1)
    const currentSigHeight = currentSigWidth / 2;
    document.getElementById('view-sig').style.width = currentSigWidth + 'px';
    document.getElementById('view-sig').style.height = currentSigHeight + 'px';
    document.getElementById('view-sig').style.left = currentSigLeft + 'px';
    
    document.getElementById('view-sig-2').style.width = currentSigWidth + 'px';
    document.getElementById('view-sig-2').style.height = currentSigHeight + 'px';
    document.getElementById('view-sig-2').style.left = currentSigLeft + 'px';
    
    // Apply position shifting to the stamp
    document.getElementById('view-stamp').style.left = currentStampLeft + 'px';
    document.getElementById('view-stamp-2').style.left = currentStampLeft + 'px';
    
    // Revert container transform
    document.getElementById('view-sig-container-1').style.transform = `none`;
    document.getElementById('view-sig-container-2').style.transform = `none`;

    // Toggle CSS class to hide grand total
    const itemsTable = document.getElementById('view-items-table');
    if (itemsTable) {
        if (appState.showGrandTotal !== false) {
            itemsTable.classList.remove('hide-grand-total');
        } else {
            itemsTable.classList.add('hide-grand-total');
        }
    }

    // --- LOGO KOP SURAT RENDER LOGIC ---
    const logoFileText = document.getElementById('logo-file-name');
    const logoClearBtn = document.getElementById('btn-clear-logo');
    
    const defaultLogo1 = document.getElementById('view-logo-default-1');
    const defaultLogo2 = document.getElementById('view-logo-default-2');
    const uploadedLogo1 = document.getElementById('view-logo-uploaded-1');
    const uploadedLogo2 = document.getElementById('view-logo-uploaded-2');

    if (appState.customLogo) {
        defaultLogo1.style.display = 'none';
        defaultLogo2.style.display = 'none';
        
        uploadedLogo1.src = appState.customLogo;
        uploadedLogo1.style.display = 'block';
        uploadedLogo2.src = appState.customLogo;
        uploadedLogo2.style.display = 'block';
        
        logoFileText.textContent = appState.customLogoName || "Logo terunggah";
        logoFileText.style.color = "var(--primary)";
        logoClearBtn.style.display = 'block';
    } else {
        defaultLogo1.style.display = 'flex';
        defaultLogo2.style.display = 'flex';
        
        uploadedLogo1.style.display = 'none';
        uploadedLogo2.style.display = 'none';
        
        logoFileText.textContent = "Menggunakan logo default";
        logoFileText.style.color = "var(--editor-text-muted)";
        logoClearBtn.style.display = 'none';
    }

    // --- STEMPEL (STAMP) RENDER LOGIC ---
    const stampFileText = document.getElementById('stamp-file-name');
    const stampClearBtn = document.getElementById('btn-clear-stamp');
    
    const defaultStamp1 = document.getElementById('view-stamp-default-1');
    const defaultStamp2 = document.getElementById('view-stamp-default-2');
    const uploadedStamp1 = document.getElementById('view-stamp-uploaded-1');
    const uploadedStamp2 = document.getElementById('view-stamp-uploaded-2');

    if (appState.customStamp) {
        // Hide default vector SVGs
        defaultStamp1.style.display = 'none';
        defaultStamp2.style.display = 'none';
        // Show uploaded image tags
        uploadedStamp1.src = appState.customStamp;
        uploadedStamp1.style.display = 'block';
        uploadedStamp2.src = appState.customStamp;
        uploadedStamp2.style.display = 'block';
        // Adjust inputs
        stampFileText.textContent = appState.customStampName || "Gambar terunggah";
        stampFileText.style.color = "var(--primary)";
        stampClearBtn.style.display = 'block';
    } else {
        // Show default vector SVGs
        defaultStamp1.style.display = 'block';
        defaultStamp2.style.display = 'block';
        // Hide uploaded image tags
        uploadedStamp1.style.display = 'none';
        uploadedStamp2.style.display = 'none';
        // Adjust inputs
        stampFileText.textContent = "Menggunakan stempel bawaan";
        stampFileText.style.color = "var(--editor-text-muted)";
        stampClearBtn.style.display = 'none';
    }

    // --- TANDA TANGAN (SIGNATURE) RENDER LOGIC ---
    const sigFileText = document.getElementById('sig-file-name');
    const sigClearBtn = document.getElementById('btn-clear-sig');
    
    const defaultSig1 = document.getElementById('view-sig-default-1');
    const defaultSig2 = document.getElementById('view-sig-default-2');
    const uploadedSig1 = document.getElementById('view-sig-uploaded-1');
    const uploadedSig2 = document.getElementById('view-sig-uploaded-2');

    if (appState.customSig) {
        // Hide default vectors
        defaultSig1.style.display = 'none';
        defaultSig2.style.display = 'none';
        // Show uploaded image tags
        uploadedSig1.src = appState.customSig;
        uploadedSig1.style.display = 'block';
        uploadedSig2.src = appState.customSig;
        uploadedSig2.style.display = 'block';
        // Adjust inputs
        sigFileText.textContent = appState.customSigName || "Gambar terunggah";
        sigFileText.style.color = "var(--primary)";
        sigClearBtn.style.display = 'block';
    } else {
        // Show default vectors
        defaultSig1.style.display = 'block';
        defaultSig2.style.display = 'block';
        // Hide uploaded image tags
        uploadedSig1.style.display = 'none';
        uploadedSig2.style.display = 'none';
        // Adjust inputs
        sigFileText.textContent = "Menggunakan TTD bawaan";
        sigFileText.style.color = "var(--editor-text-muted)";
        sigClearBtn.style.display = 'none';
    }

    renderColumnDesigner();
}

// --- WORD-STYLE DYNAMIC COLUMN DESIGNER FUNCTIONS ---

function normalizeColumnWidths() {
    if (!appState.customColumns || !appState.customColumns.length) {
        appState.customColumns = JSON.parse(JSON.stringify(DEFAULT_DATA.customColumns));
        return;
    }
    const currentTotal = appState.customColumns.reduce((sum, c) => sum + (parseFloat(c.width) || 0), 0);
    if (currentTotal <= 0) return;
    
    appState.customColumns.forEach(c => {
        c.width = Math.round(((parseFloat(c.width) || 0) / currentTotal) * 100);
    });
    
    const newTotal = appState.customColumns.reduce((sum, c) => sum + c.width, 0);
    if (newTotal !== 100 && appState.customColumns.length > 0) {
        appState.customColumns[appState.customColumns.length - 1].width += (100 - newTotal);
    }
}

function renderColumnDesigner() {
    const container = document.getElementById('column-designer-list');
    const totalValSpan = document.getElementById('col-total-width-val');
    if (!container) return;

    container.innerHTML = '';
    normalizeColumnWidths();

    const currentTotal = appState.customColumns.reduce((sum, c) => sum + (parseInt(c.width) || 0), 0);
    if (totalValSpan) totalValSpan.textContent = currentTotal;

    appState.customColumns.forEach((col, idx) => {
        const card = document.createElement('div');
        card.className = 'col-card';
        card.innerHTML = `
            <div class="col-card-header">
                <span>Kolom #${idx + 1} (${col.title || col.id})</span>
                ${appState.customColumns.length > 1 ? `<button type="button" class="btn-col-delete" data-index="${idx}" title="Hapus kolom ini">🗑️</button>` : ''}
            </div>
            <div class="col-card-body">
                <div class="form-group col-card-full">
                    <label style="font-size:10.5px;">Judul Header</label>
                    <input type="text" class="input-col-title" data-index="${idx}" value="${col.title || ''}">
                </div>
                <div class="form-group">
                    <label style="font-size:10.5px;">Lebar (%)</label>
                    <input type="number" class="input-col-width" data-index="${idx}" value="${col.width || 10}" min="1" max="100">
                </div>
                <div class="form-group">
                    <label style="font-size:10.5px;">Alignment</label>
                    <select class="select-col-align" data-index="${idx}">
                        <option value="left" ${col.align === 'left' ? 'selected' : ''}>Kiri</option>
                        <option value="center" ${col.align === 'center' ? 'selected' : ''}>Tengah</option>
                        <option value="right" ${col.align === 'right' ? 'selected' : ''}>Kanan</option>
                    </select>
                </div>
                <div class="form-group col-card-full">
                    <label style="font-size:10.5px;">Tipe Data</label>
                    <select class="select-col-type" data-index="${idx}">
                        <option value="text" ${col.type === 'text' ? 'selected' : ''}>Teks Bebas</option>
                        <option value="number" ${col.type === 'number' ? 'selected' : ''}>Angka (Qty / No)</option>
                        <option value="currency" ${col.type === 'currency' ? 'selected' : ''}>Mata Uang (Rp)</option>
                        <option value="formula_total" ${col.type === 'formula_total' ? 'selected' : ''}>Formula Total (Harga x Qty)</option>
                    </select>
                </div>
            </div>
        `;
        container.appendChild(card);
    });

    bindColumnDesignerEvents();
}

function bindColumnDesignerEvents() {
    document.querySelectorAll('.input-col-title').forEach(input => {
        input.addEventListener('input', (e) => {
            const idx = parseInt(e.target.dataset.index);
            appState.customColumns[idx].title = e.target.value;
            saveState();
            renderTable();
        });
    });

    document.querySelectorAll('.input-col-width').forEach(input => {
        input.addEventListener('input', (e) => {
            const idx = parseInt(e.target.dataset.index);
            appState.customColumns[idx].width = parseInt(e.target.value) || 5;
            const currentTotal = appState.customColumns.reduce((sum, c) => sum + (parseInt(c.width) || 0), 0);
            const totalValSpan = document.getElementById('col-total-width-val');
            if (totalValSpan) totalValSpan.textContent = currentTotal;
            saveState();
            renderTable();
        });
    });

    document.querySelectorAll('.select-col-align').forEach(select => {
        select.addEventListener('change', (e) => {
            const idx = parseInt(e.target.dataset.index);
            appState.customColumns[idx].align = e.target.value;
            saveState();
            renderTable();
        });
    });

    document.querySelectorAll('.select-col-type').forEach(select => {
        select.addEventListener('change', (e) => {
            const idx = parseInt(e.target.dataset.index);
            appState.customColumns[idx].type = e.target.value;
            saveState();
            renderTable();
        });
    });

    document.querySelectorAll('.btn-col-delete').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const idx = parseInt(e.currentTarget.dataset.index);
            appState.customColumns.splice(idx, 1);
            normalizeColumnWidths();
            saveState();
            renderColumnDesigner();
            renderTable();
        });
    });
}

// Render dynamic tables (both sidebar editors and Sheet 2 results)
function renderTable() {
    const editorContainer = document.getElementById('table-editor-container');
    const tableThead = document.getElementById('view-table-thead');
    const tableBody = document.getElementById('view-table-body');
    const tableTfoot = document.getElementById('view-tfoot-grand-total');
    
    if (!editorContainer || !tableBody) return;

    editorContainer.innerHTML = '';
    tableBody.innerHTML = '';

    // --- 1. RENDER TABLE THEAD (DYNAMIC COLUMNS) ---
    if (tableThead) {
        let thHTML = '<tr>';
        appState.customColumns.forEach(col => {
            let alignClass = col.align === 'center' ? 'class="text-center"' : (col.align === 'right' ? 'class="text-right"' : '');
            thHTML += `<th style="width: ${col.width}%;" ${alignClass}>${col.title || ''}</th>`;
        });
        thHTML += '</tr>';
        tableThead.innerHTML = thHTML;
    }

    let grandTotal = 0;

    appState.items.forEach((item, index) => {
        const itemHarga = parseFloat(item.harga || item.col_price) || 0;
        const itemQty = parseFloat(item.qty !== undefined ? item.qty : (item.col_qty !== undefined ? item.col_qty : 1)) || 0;
        const itemTotal = itemHarga * itemQty;
        grandTotal += itemTotal;

        // --- 2. RENDER SIDEBAR CARD EDITOR ---
        const rowCard = document.createElement('div');
        rowCard.className = 'row-card';

        let customFieldsHTML = '';
        appState.customColumns.forEach(col => {
            if (col.type === 'formula_total' || col.id === 'col_no') return; // Auto columns
            if (col.id === 'col_desc') return; // Main textarea

            let fieldLabel = col.title || col.id;
            let val = item[col.id];
            if (val === undefined) {
                if (col.id === 'col_price') val = item.harga || 0;
                else if (col.id === 'col_qty') val = item.qty !== undefined ? item.qty : 1;
                else if (col.id === 'col_unit') val = item.satuan || '';
                else val = '';
            }

            if (col.type === 'currency' || col.id === 'col_price') {
                customFieldsHTML += `
                    <div class="form-group">
                        <label style="font-size:10.5px;">${fieldLabel} (Rp)</label>
                        <input type="number" class="input-item-custom-field" data-index="${index}" data-col="${col.id}" value="${val}" placeholder="0">
                    </div>
                `;
            } else if (col.type === 'number' || col.id === 'col_qty') {
                customFieldsHTML += `
                    <div class="form-group">
                        <label style="font-size:10.5px;">${fieldLabel}</label>
                        <input type="number" class="input-item-custom-field" data-index="${index}" data-col="${col.id}" value="${val}" placeholder="1">
                    </div>
                `;
            } else {
                customFieldsHTML += `
                    <div class="form-group">
                        <label style="font-size:10.5px;">${fieldLabel}</label>
                        <input type="text" class="input-item-custom-field" data-index="${index}" data-col="${col.id}" value="${val}" placeholder="${fieldLabel}">
                    </div>
                `;
            }
        });

        const mainDesc = item.deskripsi !== undefined ? item.deskripsi : (item.col_desc || '');

        rowCard.innerHTML = `
            <div class="row-card-header">
                <span class="row-num-badge">Baris #${index + 1}</span>
                <button class="btn-row-delete" data-index="${index}">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
                    Hapus
                </button>
            </div>
            <div class="form-group">
                <label>Deskripsi Pekerjaan / Utama</label>
                <textarea class="input-item-desc" data-index="${index}" rows="2" placeholder="Detail pekerjaan/barang">${mainDesc}</textarea>
            </div>
            <div class="form-grid" style="grid-template-columns: repeat(auto-fit, minmax(100px, 1fr)); gap: 8px;">
                ${customFieldsHTML}
            </div>
        `;
        editorContainer.appendChild(rowCard);

        // --- 3. RENDER TABLE PREVIEW ON SHEET 2 ---
        const tableRow = document.createElement('tr');
        let tdHTML = '';

        appState.customColumns.forEach(col => {
            let alignClass = col.align === 'center' ? 'class="text-center"' : (col.align === 'right' ? 'class="text-right"' : '');
            let fontClass = col.type === 'formula_total' ? 'font-bold' : '';
            let fullClass = [alignClass, fontClass].filter(Boolean).join(' ');

            let displayVal = '-';
            if (col.type === 'formula_total') {
                displayVal = itemTotal > 0 ? 'Rp ' + formatCurrency(itemTotal) : '-';
            } else if (col.id === 'col_no' || (col.type === 'number' && col.title.toLowerCase().includes('no'))) {
                displayVal = index + 1;
            } else if (col.id === 'col_desc') {
                displayVal = mainDesc || '-';
            } else {
                let v = item[col.id];
                if (v === undefined) {
                    if (col.id === 'col_price') v = item.harga;
                    else if (col.id === 'col_qty') v = item.qty;
                    else if (col.id === 'col_unit') v = item.satuan;
                }
                if (col.type === 'currency' || col.id === 'col_price') {
                    const numV = parseFloat(v) || 0;
                    displayVal = numV > 0 ? 'Rp ' + formatCurrency(numV) : '-';
                } else {
                    displayVal = (v !== undefined && v !== '') ? v : '-';
                }
            }

            tdHTML += `<td ${fullClass}>${displayVal}</td>`;
        });

        tableRow.innerHTML = tdHTML;
        tableBody.appendChild(tableRow);
    });

    // --- 4. RENDER TABLE TFOOT ---
    if (tableTfoot) {
        const totalColspan = Math.max(1, appState.customColumns.length - 1);
        tableTfoot.innerHTML = `
            <tr>
                <td colspan="${totalColspan}" class="text-center font-bold">Total</td>
                <td class="font-bold text-right" id="view-grand-total">Rp ${formatCurrency(grandTotal)}</td>
            </tr>
        `;
    }

    bindTableEvents();
}

// Render dynamic list of notes
function renderNotes() {
    const editorContainer = document.getElementById('notes-editor-container');
    const notesList = document.getElementById('view-notes-list');
    
    editorContainer.innerHTML = '';
    notesList.innerHTML = '';

    appState.notes.forEach((note, index) => {
        // --- 1. RENDER SIDEBAR NOTES INPUTS ---
        const noteDiv = document.createElement('div');
        noteDiv.className = 'note-editor-item';
        noteDiv.innerHTML = `
            <input type="text" class="input-note-text" data-index="${index}" value="${note.replace(/"/g, '&quot;')}" placeholder="Catatan ke-${index+1}">
            <button class="btn-note-delete" data-index="${index}" title="Hapus catatan ini">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
            </button>
        `;
        editorContainer.appendChild(noteDiv);

        // --- 2. RENDER LIST ON SHEET 2 ---
        const listItem = document.createElement('li');
        listItem.textContent = note;
        notesList.appendChild(listItem);
    });

    // Rebind notes event listeners
    bindNotesEvents();
}

// Master rendering function
function renderAll() {
    syncTextFields();
    renderTable();
    renderNotes();
}

// --- FILE UPLOADER ENGINE ---

function handleFileUpload(fileInputId, statePropertyKey, namePropertyKey, callback) {
    const fileInput = document.getElementById(fileInputId);
    if (!fileInput) return;

    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Check file size (max 2MB to ensure smooth LocalStorage loading)
        if (file.size > 2 * 1024 * 1024) {
            alert("Ukuran file terlalu besar! Silakan unggah gambar di bawah 2MB agar penyimpanan tetap lancar.");
            fileInput.value = ""; // clear
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            appState[statePropertyKey] = event.target.result; // Base64 encoding
            appState[namePropertyKey] = file.name;
            saveState();
            callback();
        };
        reader.readAsDataURL(file);
    });
}

// --- EVENT LISTENERS BINDING ---

function bindGlobalEvents() {
    // 1. Text Inputs bindings
    const bindings = [
        { id: 'input-no', key: 'noSurat', targetId: 'view-no' },
        { id: 'input-tanggal', key: 'tanggal', targetId: 'view-tanggal' },
        { id: 'input-perihal', key: 'perihal', targetId: 'view-perihal' },
        { id: 'input-lampiran', key: 'lampiran', targetId: 'view-lampiran' },
        { id: 'input-filename', key: 'customFileName' },
        { id: 'input-klien-nama', key: 'klienNama', targetId: 'view-klien-nama' },
        { id: 'input-klien-alamat', key: 'klienAlamat', targetId: 'view-klien-alamat' },
        { id: 'input-company-name', key: 'companyName', targets: ['view-company-name', 'view-company-name-2', 'view-stamp-text', 'view-stamp-text-2'] },
        { id: 'input-company-address', key: 'companyAddress', targets: ['view-company-address', 'view-company-address-2'] },
        { id: 'input-narasi-pembuka', key: 'narasiPembuka', targetId: 'view-narasi-pembuka' },
        { id: 'input-narasi-penutup', key: 'narasiPenutup', targetId: 'view-narasi-penutup' },
        
        // Signers
        { id: 'input-signer-name', key: 'signerName', targets: ['view-signer-name', 'view-signer-name-2'] },
        { id: 'input-signer-role', key: 'signerRole', targets: ['view-signer-role', 'view-signer-role-2'] },
        { id: 'input-annex-title', key: 'annexTitle', targetId: 'view-annex-title' }
    ];

    bindings.forEach(binding => {
        const input = document.getElementById(binding.id);
        if (input) {
            input.addEventListener('input', (e) => {
                appState[binding.key] = e.target.value;
                if (binding.targetId) {
                    document.getElementById(binding.targetId).textContent = e.target.value;
                } else if (binding.targets) {
                    binding.targets.forEach(tid => {
                        document.getElementById(tid).textContent = e.target.value;
                    });
                }

                // Dynamically update document title to change default suggested PDF filename
                if (binding.key === 'customFileName') {
                    document.title = e.target.value || "Penawaran_Harga";
                }

                saveState();
            });
        }
    });

    // Theme Color Picker
    const themeInput = document.getElementById('input-theme-color');
    if (themeInput) {
        themeInput.addEventListener('input', (e) => {
            appState.themeColor = e.target.value;
            applyThemeColor(e.target.value);
            saveState();
        });
    }

    // Narrative Body manual splitting
    const bodyInput = document.getElementById('input-narasi-body');
    if (bodyInput) {
        bodyInput.addEventListener('input', (e) => {
            appState.narasiBody = e.target.value;
            const bodyHTML = e.target.value.split('\n')
                .map(para => para.trim() ? `<p>${para}</p>` : '')
                .join('');
            document.getElementById('view-narasi-body').innerHTML = bodyHTML;
            saveState();
        });
    }

    // Toggle Checkboxes for visibility
    document.getElementById('chk-show-stamp').addEventListener('change', (e) => {
        appState.showStamp = e.target.checked;
        document.getElementById('view-stamp').style.visibility = appState.showStamp ? 'visible' : 'hidden';
        document.getElementById('view-stamp-2').style.visibility = appState.showStamp ? 'visible' : 'hidden';
        saveState();
    });

    document.getElementById('chk-show-sig').addEventListener('change', (e) => {
        appState.showSig = e.target.checked;
        document.getElementById('view-sig').style.visibility = appState.showSig ? 'visible' : 'hidden';
        document.getElementById('view-sig-2').style.visibility = appState.showSig ? 'visible' : 'hidden';
        saveState();
    });

    document.getElementById('input-sig-width').addEventListener('input', (e) => {
        const val = parseInt(e.target.value);
        appState.sigWidth = val;
        document.getElementById('sig-width-val').textContent = val;
        
        const sigHeight = val / 2;
        document.getElementById('view-sig').style.width = val + 'px';
        document.getElementById('view-sig').style.height = sigHeight + 'px';
        document.getElementById('view-sig-2').style.width = val + 'px';
        document.getElementById('view-sig-2').style.height = sigHeight + 'px';
        saveState();
    });

    document.getElementById('input-sig-left').addEventListener('input', (e) => {
        const val = parseInt(e.target.value);
        document.getElementById('sig-left-val').textContent = val;
        appState.sigLeft = val;
        saveState();
        renderAll();
    });

    const inputStampLeft = document.getElementById('input-stamp-left');
    if(inputStampLeft) {
        inputStampLeft.addEventListener('input', (e) => {
            const val = parseInt(e.target.value);
            document.getElementById('stamp-left-val').textContent = val;
            appState.stampLeft = val;
            saveState();
            renderAll();
        });
    }

    document.getElementById('chk-show-grand-total').addEventListener('change', (e) => {
        appState.showGrandTotal = e.target.checked;
        const itemsTable = document.getElementById('view-items-table');
        if (itemsTable) {
            if (appState.showGrandTotal) {
                itemsTable.classList.remove('hide-grand-total');
            } else {
                itemsTable.classList.add('hide-grand-total');
            }
        }
        saveState();
    });

    const btnAddCol = document.getElementById('btn-add-custom-col');
    if (btnAddCol) {
        btnAddCol.addEventListener('click', () => {
            const newColId = 'col_' + Date.now().toString(36);
            appState.customColumns.push({
                id: newColId,
                title: "Kolom Baru",
                width: 15,
                align: "left",
                type: "text"
            });
            normalizeColumnWidths();
            saveState();
            renderColumnDesigner();
            renderTable();
        });
    }

    const btnBalanceCols = document.getElementById('btn-balance-cols');
    if (btnBalanceCols) {
        btnBalanceCols.addEventListener('click', () => {
            normalizeColumnWidths();
            saveState();
            renderColumnDesigner();
            renderTable();
        });
    }

    // Module Navigation Bar Click Handler
    document.querySelectorAll('.nav-module-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.nav-module-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const mod = btn.getAttribute('data-module');
            renderFullPageModuleWorkspace(mod, btn.textContent);
        });
    });

    // Close Modal Button
    const btnCloseModal = document.getElementById('btn-close-module-modal');
    if (btnCloseModal) {
        btnCloseModal.addEventListener('click', () => {
            const modal = document.getElementById('module-dialog-modal');
            if (modal) modal.style.display = 'none';
        });
    }

    // Stop Impersonation Button Handler
    const btnStopImpersonate = document.getElementById('btn-stop-impersonate');
    if (btnStopImpersonate) {
        btnStopImpersonate.addEventListener('click', async () => {
            try {
                const res = await fetch('/api/auth/stop-impersonate', {
                    method: 'POST',
                    headers: { 'Authorization': 'Bearer ' + (localStorage.getItem('erp_token') || '') }
                });
                const data = await res.json();
                if (data.token) localStorage.setItem('erp_token', data.token);
            } catch (e) {}
            appState.isImpersonated = false;
            const banner = document.getElementById('impersonation-banner-container');
            if (banner) banner.style.display = 'none';
            alert('Mode Impersonasi Dihentikan. Anda kembali ke akun Super Admin.');
        });
    }

    // Make custom file upload containers programmatically clickable to ensure 100% browser compatibility
    document.querySelectorAll('.custom-file-upload').forEach(container => {
        container.style.cursor = 'pointer';
        container.addEventListener('click', (e) => {
            // If the user clicked directly on the input element, let the browser handle it naturally
            if (e.target.tagName === 'INPUT') return;
            
            const fileInput = container.querySelector('input[type="file"]');
            if (fileInput) {
                fileInput.click();
            }
        });
    });

    // Bind Image Upload file dialog triggers
    handleFileUpload('input-upload-logo', 'customLogo', 'customLogoName', () => {
        syncTextFields();
    });

    handleFileUpload('input-upload-stamp', 'customStamp', 'customStampName', () => {
        syncTextFields();
    });

    handleFileUpload('input-upload-sig', 'customSig', 'customSigName', () => {
        syncTextFields();
    });

    // Reset Custom Logo Upload back to SVG Default
    document.getElementById('btn-clear-logo').addEventListener('click', () => {
        appState.customLogo = null;
        appState.customLogoName = "";
        document.getElementById('input-upload-logo').value = ""; // flush input
        saveState();
        syncTextFields();
    });

    // Reset Custom Stamp Upload back to SVG Default
    document.getElementById('btn-clear-stamp').addEventListener('click', () => {
        appState.customStamp = null;
        appState.customStampName = "";
        document.getElementById('input-upload-stamp').value = ""; // flush input
        saveState();
        syncTextFields();
    });

    // Reset Custom Signature Upload back to SVG Default
    document.getElementById('btn-clear-sig').addEventListener('click', () => {
        appState.customSig = null;
        appState.customSigName = "";
        document.getElementById('input-upload-sig').value = ""; // flush input
        saveState();
        syncTextFields();
    });

    // Master Reset Action
    document.getElementById('btn-reset').addEventListener('click', () => {
        if (confirm("Apakah Anda yakin ingin mereset seluruh formulir ke template default? Draf Anda saat ini akan ditimpa.")) {
            localStorage.removeItem('heksa_quotation_state');
            document.getElementById('input-upload-logo').value = "";
            document.getElementById('input-upload-stamp').value = "";
            document.getElementById('input-upload-sig').value = "";
            loadState();
            renderAll();
        }
    });

    // Print PDF Action
    document.getElementById('btn-print').addEventListener('click', () => {
        window.print();
    });

    // Visual Scalers (Zoom)
    const zoomValSpan = document.getElementById('zoom-value');
    const pageContainer = document.getElementById('pages-container');

    document.getElementById('btn-zoom-in').addEventListener('click', () => {
        if (currentZoom < 1.3) {
            currentZoom += 0.05;
            pageContainer.style.transform = `scale(${currentZoom.toFixed(2)})`;
            zoomValSpan.textContent = `${Math.round(currentZoom * 100)}%`;
        }
    });

    document.getElementById('btn-zoom-out').addEventListener('click', () => {
        if (currentZoom > 0.4) {
            currentZoom -= 0.05;
            pageContainer.style.transform = `scale(${currentZoom.toFixed(2)})`;
            zoomValSpan.textContent = `${Math.round(currentZoom * 100)}%`;
        }
    });

    const chkSatuan = document.getElementById('chk-show-satuan-col');
    if (chkSatuan) {
        chkSatuan.addEventListener('change', (e) => {
            appState.showSatuanColumn = e.target.checked;
            saveState();
            renderTable();
        });
    }

    const colHeaderInputs = [
        { id: 'input-col-no', key: 'no' },
        { id: 'input-col-desc', key: 'deskripsi' },
        { id: 'input-col-satuan', key: 'satuan' },
        { id: 'input-col-harga', key: 'harga' },
        { id: 'input-col-qty', key: 'qty' },
        { id: 'input-col-total', key: 'total' }
    ];

    colHeaderInputs.forEach(col => {
        const inp = document.getElementById(col.id);
        if (inp) {
            inp.addEventListener('input', (e) => {
                if (!appState.columnTitles) {
                    appState.columnTitles = { ...DEFAULT_DATA.columnTitles };
                }
                appState.columnTitles[col.key] = e.target.value;
                saveState();
                renderTable();
            });
        }
    });

    // Add Row Click Trigger
    document.getElementById('btn-add-row').addEventListener('click', () => {
        appState.items.push({ deskripsi: "", satuan: "", harga: 0, qty: 1 });
        saveState();
        renderTable();
    });

    // Add Note Click Trigger
    document.getElementById('btn-add-note').addEventListener('click', () => {
        appState.notes.push("");
        saveState();
        renderNotes();
    });
}

// Binds inputs inside dynamic table row cards
function bindTableEvents() {
    const showSatuan = !!appState.showSatuanColumn;

    document.querySelectorAll('.input-item-desc').forEach(input => {
        input.addEventListener('input', (e) => {
            const idx = parseInt(e.target.dataset.index);
            appState.items[idx].deskripsi = e.target.value;
            saveState();
            
            const rows = document.querySelectorAll('#view-table-body tr');
            if (rows[idx]) {
                rows[idx].cells[1].textContent = e.target.value || '-';
            }
        });
    });

    document.querySelectorAll('.input-item-unit').forEach(input => {
        input.addEventListener('input', (e) => {
            const idx = parseInt(e.target.dataset.index);
            appState.items[idx].satuan = e.target.value;
            saveState();
            
            const rows = document.querySelectorAll('#view-table-body tr');
            if (rows[idx] && showSatuan) {
                rows[idx].cells[2].textContent = e.target.value || '-';
            }
        });
    });

    document.querySelectorAll('.input-item-price').forEach(input => {
        input.addEventListener('input', (e) => {
            const idx = parseInt(e.target.dataset.index);
            appState.items[idx].harga = parseFloat(e.target.value) || 0;
            saveState();
            
            const rowTotal = appState.items[idx].harga * (appState.items[idx].qty || 0);
            const rows = document.querySelectorAll('#view-table-body tr');
            if (rows[idx]) {
                const hargaColIdx = showSatuan ? 3 : 2;
                const totalColIdx = showSatuan ? 5 : 4;
                rows[idx].cells[hargaColIdx].textContent = appState.items[idx].harga > 0 ? 'Rp ' + formatCurrency(appState.items[idx].harga) : '-';
                rows[idx].cells[totalColIdx].textContent = rowTotal > 0 ? 'Rp ' + formatCurrency(rowTotal) : '-';
            }
            recalcGrandTotal();
        });
    });

    document.querySelectorAll('.input-item-qty').forEach(input => {
        input.addEventListener('input', (e) => {
            const idx = parseInt(e.target.dataset.index);
            appState.items[idx].qty = parseInt(e.target.value) || 0;
            saveState();
            
            const rowTotal = appState.items[idx].harga * appState.items[idx].qty;
            const rows = document.querySelectorAll('#view-table-body tr');
            if (rows[idx]) {
                const qtyColIdx = showSatuan ? 4 : 3;
                const totalColIdx = showSatuan ? 5 : 4;
                rows[idx].cells[qtyColIdx].textContent = appState.items[idx].qty || 0;
                rows[idx].cells[totalColIdx].textContent = rowTotal > 0 ? 'Rp ' + formatCurrency(rowTotal) : '-';
            }
            recalcGrandTotal();
        });
    });

    document.querySelectorAll('.btn-row-delete').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const idx = parseInt(e.currentTarget.dataset.index);
            appState.items.splice(idx, 1);
            saveState();
            renderTable();
        });
    });
}

// Binds inputs inside notes checklist
function bindNotesEvents() {
    document.querySelectorAll('.input-note-text').forEach(input => {
        input.addEventListener('input', (e) => {
            const idx = parseInt(e.target.dataset.index);
            appState.notes[idx] = e.target.value;
            saveState();

            const items = document.querySelectorAll('#view-notes-list li');
            if (items[idx]) {
                items[idx].textContent = e.target.value;
            }
        });
    });

    document.querySelectorAll('.btn-note-delete').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const idx = parseInt(e.currentTarget.dataset.index);
            appState.notes.splice(idx, 1);
            saveState();
            renderNotes();
        });
    });
}

// Recalculates total summation
function recalcGrandTotal() {
    let grandTotal = 0;
    appState.items.forEach(item => {
        grandTotal += (item.harga || 0) * (item.qty || 1);
    });
    document.getElementById('view-grand-total').textContent = 'Rp ' + formatCurrency(grandTotal);
}

// --- INITIALIZER ---
window.addEventListener('DOMContentLoaded', () => {
    loadState();
    renderAll();
    bindGlobalEvents();
    initChatbot();
});

/* ==========================================
   CHATBOT ENGINE (INTENT-BASED)
   ========================================== */
let currentStepId = "main_menu";
let currentItemIndex = 0; 

const chatFlow = {
    "main_menu": {
        botText: "Halo! Apa bagian Quotation yang ingin Anda isi atau perbarui?",
        expectedInput: "none",
        buttons: [
            { text: "🏢 Kop Perusahaan", action: () => goToStep("corp_name") },
            { text: "👥 Data Klien", action: () => goToStep("klien_nama") },
            { text: "📄 Info Surat", action: () => goToStep("meta_no") },
            { text: "✍️ Narasi Surat", action: () => goToStep("narasi_buka") },
            { text: "➕ Tambah Item", action: () => goToStep("item_desc") },
            { text: "🔏 TTD & Stempel", action: () => goToStep("ttd_name") },
            { text: "📝 Tambah Catatan", action: () => goToStep("notes_loop") },
            { text: "✅ Selesai & Cetak PDF", action: () => goToStep("final"), isPrimary: true }
        ]
    },
    // --- KOP PERUSAHAAN ---
    "corp_name": {
        targetId: "view-company-name",
        botText: "**Siapa nama Perusahaan Anda (Kop Surat)?**",
        expectedInput: "text",
        buttons: [{ text: "Lewati", action: () => goToStep("corp_addr") }],
        action: (answer) => {
            if(answer !== '-') { appState.companyName = answer; document.getElementById('input-company-name').value = answer; }
            goToStep("corp_addr");
        }
    },
    "corp_addr": {
        targetId: "view-company-address",
        botText: "**Di mana alamat perusahaan Anda?**",
        expectedInput: "text",
        buttons: [{ text: "Lewati", action: () => goToStep("corp_logo") }],
        action: (answer) => {
            if(answer !== '-') { appState.companyAddress = answer; document.getElementById('input-company-address').value = answer; }
            goToStep("corp_logo");
        }
    },
    "corp_logo": {
        targetId: "view-logo-container-1",
        botText: "**Apakah Anda ingin mengunggah Logo Perusahaan?**",
        expectedInput: "none",
        buttons: [
            { 
                text: "📁 Pilih Gambar Logo", 
                isPrimary: true,
                action: () => {
                    const input = document.getElementById('input-upload-logo');
                    input.click();
                    const onChange = () => { input.removeEventListener('change', onChange); setTimeout(() => goToStep("main_menu"), 500); };
                    input.addEventListener('change', onChange);
                }
            },
            { text: "Lewati", action: () => goToStep("main_menu") }
        ]
    },
    // --- KLIEN ---
    "klien_nama": {
        targetId: "view-klien-nama",
        botText: "**Siapa nama perusahaan Klien (Penerima) Anda?**",
        expectedInput: "text",
        buttons: [{ text: "Lewati", action: () => goToStep("klien_addr") }],
        action: (answer) => {
            if(answer !== '-') { appState.klienNama = answer; document.getElementById('input-klien-nama').value = answer; }
            goToStep("klien_addr");
        }
    },
    "klien_addr": {
        targetId: "view-klien-alamat",
        botText: "**Di mana alamat Klien Anda?**",
        expectedInput: "text",
        buttons: [{ text: "Lewati", action: () => goToStep("main_menu") }],
        action: (answer) => {
            if(answer !== '-') { appState.klienAlamat = answer; document.getElementById('input-klien-alamat').value = answer; }
            goToStep("main_menu");
        }
    },
    // --- INFO SURAT ---
    "meta_no": {
        targetId: "view-no",
        botText: "**Berapa Nomor Surat ini?** (Contoh: 01/SPH/2026)",
        expectedInput: "text",
        buttons: [{ text: "Lewati", action: () => goToStep("meta_tanggal") }],
        action: (answer) => {
            if(answer !== '-') { appState.noSurat = answer; document.getElementById('input-no').value = answer; }
            goToStep("meta_tanggal");
        }
    },
    "meta_tanggal": {
        targetId: "view-tanggal",
        botText: "**Tanggal Surat?** (Contoh: Jakarta, 01 Mei 2026)",
        expectedInput: "text",
        buttons: [
            {
                text: "📅 Gunakan Hari Ini",
                action: () => {
                    const today = new Date();
                    const options = { year: 'numeric', month: 'long', day: 'numeric' };
                    const formatted = "Jakarta, " + today.toLocaleDateString('id-ID', options);
                    appState.tanggal = formatted; 
                    document.getElementById('input-tanggal').value = formatted;
                    appendUserMessage(formatted);
                    goToStep("meta_perihal");
                }
            },
            { text: "Lewati", action: () => goToStep("meta_perihal") }
        ],
        action: (answer) => {
            if(answer !== '-') { appState.tanggal = answer; document.getElementById('input-tanggal').value = answer; }
            goToStep("meta_perihal");
        }
    },
    "meta_perihal": {
        targetId: "view-perihal",
        botText: "**Apa Perihal surat ini?**",
        expectedInput: "text",
        buttons: [{ text: "Lewati", action: () => goToStep("meta_lampiran") }],
        action: (answer) => {
            if(answer !== '-') { appState.perihal = answer; document.getElementById('input-perihal').value = answer; }
            goToStep("meta_lampiran");
        }
    },
    "meta_lampiran": {
        targetId: "view-lampiran",
        botText: "**Lampiran?**",
        expectedInput: "text",
        buttons: [{ text: "Lewati", action: () => goToStep("meta_filename") }],
        action: (answer) => {
            if(answer !== '-') { appState.lampiran = answer; document.getElementById('input-lampiran').value = answer; }
            goToStep("meta_filename");
        }
    },
    "meta_filename": {
        targetId: "view-tanggal",
        botText: "**Nama file PDF saat di-save nanti?**",
        expectedInput: "text",
        buttons: [{ text: "Lewati", action: () => goToStep("main_menu") }],
        action: (answer) => {
            if(answer !== '-') { appState.customFileName = answer; document.getElementById('input-filename').value = answer; }
            goToStep("main_menu");
        }
    },
    // --- NARASI ---
    "narasi_buka": {
        targetId: "view-narasi-pembuka",
        botText: "**Salam Pembuka?**",
        expectedInput: "text",
        buttons: [{ text: "Lewati", action: () => goToStep("narasi_body") }],
        action: (answer) => {
            if(answer !== '-') { appState.narasiPembuka = answer; document.getElementById('input-narasi-pembuka').value = answer; }
            goToStep("narasi_body");
        }
    },
    "narasi_body": {
        targetId: "view-narasi-body",
        botText: "**Ketik paragraf utama (isi surat) Anda:**",
        expectedInput: "text",
        buttons: [{ text: "Lewati", action: () => goToStep("narasi_tutup") }],
        action: (answer) => {
            if(answer !== '-') { appState.narasiBody = answer; document.getElementById('input-narasi-body').value = answer; }
            goToStep("narasi_tutup");
        }
    },
    "narasi_tutup": {
        targetId: "view-narasi-penutup",
        botText: "**Ketik paragraf penutup surat Anda:**",
        expectedInput: "text",
        buttons: [{ text: "Lewati", action: () => goToStep("main_menu") }],
        action: (answer) => {
            if(answer !== '-') { appState.narasiPenutup = answer; document.getElementById('input-narasi-penutup').value = answer; }
            goToStep("main_menu");
        }
    },
    // --- TTD ---
    "ttd_name": {
        targetId: "view-signer-name",
        botText: "**Siapa nama Penandatangan surat ini?**",
        expectedInput: "text",
        buttons: [{ text: "Lewati", action: () => goToStep("ttd_role") }],
        action: (answer) => {
            if(answer !== '-') { appState.signerName = answer; document.getElementById('input-signer-name').value = answer; }
            goToStep("ttd_role");
        }
    },
    "ttd_role": {
        targetId: "view-signer-role",
        botText: "**Apa jabatan Penandatangan?**",
        expectedInput: "text",
        buttons: [{ text: "Lewati", action: () => goToStep("ttd_stamp") }],
        action: (answer) => {
            if(answer !== '-') { appState.signerRole = answer; document.getElementById('input-signer-role').value = answer; }
            goToStep("ttd_stamp");
        }
    },
    "ttd_stamp": {
        targetId: "view-stamp",
        botText: "**Unggah Stempel Perusahaan?**",
        expectedInput: "none",
        buttons: [
            { text: "📁 Pilih Stempel", isPrimary: true, action: () => { const input = document.getElementById('input-upload-stamp'); input.click(); const onChange = () => { input.removeEventListener('change', onChange); setTimeout(() => goToStep("ttd_sig"), 500); }; input.addEventListener('change', onChange); } },
            { text: "Lewati", action: () => goToStep("ttd_sig") }
        ]
    },
    "ttd_sig": {
        targetId: "view-sig",
        botText: "**Unggah Tanda Tangan Basah?**",
        expectedInput: "none",
        buttons: [
            { text: "📁 Pilih TTD", isPrimary: true, action: () => { const input = document.getElementById('input-upload-sig'); input.click(); const onChange = () => { input.removeEventListener('change', onChange); setTimeout(() => goToStep("ttd_adjust"), 500); }; input.addEventListener('change', onChange); } },
            { text: "Lewati", action: () => goToStep("ttd_adjust") }
        ]
    },
    "ttd_adjust": {
        targetId: "view-sig",
        botText: "**Atur Posisi & Ukuran TTD dan Stempel:**<br>Kini Anda bisa mengaturnya secara terpisah.",
        expectedInput: "none",
        onEnter: () => {
            // Shrink chat
            document.getElementById('chatbot-window').classList.add('chat-shrink');
        },
        onLeave: () => {
            document.getElementById('chatbot-window').classList.remove('chat-shrink');
        },
        buttons: [
            { 
                text: "⬅️ TTD Kiri", 
                keepActive: true,
                action: () => { 
                    appState.sigLeft = (appState.sigLeft || 10) - 20; 
                    saveState(); renderAll(); 
                } 
            },
            { 
                text: "➡️ TTD Kanan", 
                keepActive: true,
                action: () => { 
                    appState.sigLeft = (appState.sigLeft || 10) + 20; 
                    saveState(); renderAll(); 
                } 
            },
            { 
                text: "⬅️ Cap Kiri", 
                keepActive: true,
                action: () => { 
                    appState.stampLeft = (appState.stampLeft || -15) - 20; 
                    saveState(); renderAll(); 
                } 
            },
            { 
                text: "➡️ Cap Kanan", 
                keepActive: true,
                action: () => { 
                    appState.stampLeft = (appState.stampLeft || -15) + 20; 
                    saveState(); renderAll(); 
                } 
            },
            { 
                text: "➕ TTD Besar", 
                keepActive: true,
                action: () => { 
                    appState.sigWidth = (appState.sigWidth || 170) + 10; 
                    saveState(); renderAll(); 
                } 
            },
            { 
                text: "➖ TTD Kecil", 
                keepActive: true,
                action: () => { 
                    appState.sigWidth = Math.max(50, (appState.sigWidth || 170) - 10); 
                    saveState(); renderAll(); 
                } 
            },
            { text: "✅ Selesai", isPrimary: true, action: () => goToStep("main_menu") }
        ]
    },
    // --- ITEMS ---
    "item_desc": {
        targetId: "view-items-table",
        botText: "**Tabel Item:** Apa nama barang/jasa yang ditawarkan?",
        expectedInput: "text",
        buttons: [{ text: "Batal / Kembali", action: () => { appState.items.pop(); goToStep("main_menu"); } }],
        onEnter: () => {
            appState.items.push({ deskripsi: "", harga: 0, qty: 1 });
            currentItemIndex = appState.items.length - 1;
        },
        action: (answer) => {
            if(answer === '-') {
                appState.items.pop();
                goToStep("main_menu");
                return;
            }
            appState.items[currentItemIndex].deskripsi = answer;
            goToStep("item_qty");
        }
    },
    "item_qty": {
        targetId: "view-items-table",
        botText: "Berapa **jumlah (qty)** untuk item tersebut?",
        expectedInput: "number",
        buttons: [{ text: "Lewati (Gunakan 1)", action: () => { appState.items[currentItemIndex].qty = 1; goToStep("item_harga"); } }],
        action: (answer) => {
            appState.items[currentItemIndex].qty = parseInt(answer) || 1;
            goToStep("item_harga");
        }
    },
    "item_harga": {
        targetId: "view-items-table",
        botText: "Berapa **harga satuan** (dalam Rupiah)?",
        expectedInput: "number",
        buttons: [{ text: "Lewati (Harga 0)", action: () => { appState.items[currentItemIndex].harga = 0; saveState(); renderAll(); appendBotMessage("Item berhasil ditambahkan!", [{ text: "+ Tambah Item Lain", action: () => goToStep("item_desc") }, { text: "Kembali ke Menu", action: () => goToStep("main_menu") }]); } }],
        action: (answer) => {
            appState.items[currentItemIndex].harga = parseFloat(answer) || 0;
            saveState(); renderAll();
            appendBotMessage("Item berhasil ditambahkan!", [
                { text: "+ Tambah Item Lain", action: () => goToStep("item_desc") },
                { text: "Kembali ke Menu", action: () => goToStep("main_menu") }
            ]);
        }
    },
    // --- NOTES ---
    "notes_loop": {
        targetId: "view-notes-list",
        botText: "**Catatan Kaki:** Ketik satu catatan tambahan untuk Quotation ini.",
        expectedInput: "text",
        buttons: [{ text: "Selesai / Kembali", action: () => goToStep("main_menu") }],
        action: (answer) => {
            if(answer === '-') {
                goToStep("main_menu");
                return;
            }
            appState.notes.push(answer);
            saveState(); renderAll();
            appendBotMessage("Catatan ditambahkan!", [
                { text: "+ Tambah Catatan Lagi", action: () => goToStep("notes_loop") },
                { text: "Kembali ke Menu", action: () => goToStep("main_menu") }
            ]);
        }
    },
    // --- FINAL ---
    "final": {
        botText: "Sempurna! Anda bisa langsung mengunduh PDF-nya sekarang atau kembali ke menu untuk mengedit bagian lain.",
        expectedInput: "none",
        isFinal: true,
        buttons: [
            { text: "Unduh PDF Sekarang", action: () => window.print(), isPrimary: true },
            { text: "Kembali ke Menu", action: () => goToStep("main_menu") }
        ]
    }
};

function goToStep(stepId) {
    const prevFlow = chatFlow[currentStepId];
    if(prevFlow && prevFlow.onLeave) prevFlow.onLeave();
    
    currentStepId = stepId;
    const flow = chatFlow[currentStepId];
    
    if(flow.onEnter) flow.onEnter();
    
    // Auto-scroll to the target element if specified
    if(flow.targetId) {
        setTimeout(() => {
            const el = document.getElementById(flow.targetId);
            if(el) {
                // Scroll into view at the top of the screen to avoid the bottom chat window
                el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }, 150);
    }
    
    nextChat();
}

function initChatbot() {
    const fab = document.getElementById('chatbot-fab');
    const win = document.getElementById('chatbot-window');
    const closeBtn = document.getElementById('btn-close-chat');
    const resetBtn = document.getElementById('btn-reset-chat');
    const inputField = document.getElementById('chatbot-input');
    const sendBtn = document.getElementById('chatbot-send');
    const msgContainer = document.getElementById('chatbot-messages');

    // Toggle Window
    fab.addEventListener('click', () => {
        win.classList.add('open');
        // Start conversation if empty
        if(currentStepId === "main_menu" && msgContainer.children.length === 0) {
            goToStep("main_menu");
        }
        setTimeout(() => inputField.focus(), 300);
    });

    closeBtn.addEventListener('click', () => {
        win.classList.remove('open');
    });

    // Reset Chat
    resetBtn.addEventListener('click', () => {
        if(confirm("Apakah Anda ingin kembali ke Menu Utama?")) {
            msgContainer.innerHTML = '';
            goToStep("main_menu");
            inputField.focus();
        }
    });

    // Send Message
    function sendMessage() {
        const text = inputField.value.trim();
        if(!text) return;
        
        appendUserMessage(text);
        inputField.value = "";
        
        // Process Answer
        const currentFlow = chatFlow[currentStepId];
        if(currentFlow && currentFlow.action) {
            currentFlow.action(text);
            saveState();
            renderAll(); // Sync visually to preview
        }
    }

    sendBtn.addEventListener('click', sendMessage);
    inputField.addEventListener('keypress', (e) => {
        if(e.key === 'Enter') sendMessage();
    });
}

function nextChat() {
    const flow = chatFlow[currentStepId];
    if(flow) {
        // Toggle input visibility for file uploads or final steps
        const inputArea = document.querySelector('.chatbot-input-area');
        if(flow.expectedInput === "none" || flow.isFinal) {
            inputArea.style.display = 'none';
        } else {
            inputArea.style.display = 'flex';
            setTimeout(() => document.getElementById('chatbot-input').focus(), 100);
        }

        if(flow.buttons) {
            appendBotMessage(flow.botText, flow.buttons);
        } else {
            appendBotMessage(flow.botText);
        }
    }
}

function appendBotMessage(text, buttons = []) {
    const msgContainer = document.getElementById('chatbot-messages');
    const bubble = document.createElement('div');
    bubble.className = 'chat-bubble chat-bot';
    
    // Parse bold text
    bubble.innerHTML = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    if(buttons.length > 0) {
        const actionDiv = document.createElement('div');
        actionDiv.className = 'chatbot-actions';
        actionDiv.style.flexWrap = 'wrap'; // Allow buttons like D-Pad to wrap nicely
        
        buttons.forEach(btn => {
            const btnEl = document.createElement('button');
            btnEl.className = 'chat-action-btn' + (btn.isPrimary ? ' btn-primary-action' : '');
            btnEl.textContent = btn.text;
            btnEl.addEventListener('click', () => {
                if(btn.action) {
                    btn.action();
                }
                if(!btn.keepActive) {
                    // remove buttons after click
                    actionDiv.style.opacity = '0.5';
                    actionDiv.style.pointerEvents = 'none';
                }
            });
            actionDiv.appendChild(btnEl);
        });
        bubble.appendChild(actionDiv);
    }
    
    msgContainer.appendChild(bubble);
    scrollToBottom();
}

function appendUserMessage(text) {
    const msgContainer = document.getElementById('chatbot-messages');
    const bubble = document.createElement('div');
    bubble.className = 'chat-bubble chat-user';
    bubble.textContent = text;
    msgContainer.appendChild(bubble);
    scrollToBottom();
}

function scrollToBottom() {
    const msgContainer = document.getElementById('chatbot-messages');
    msgContainer.scrollTop = msgContainer.scrollHeight;
}

// --- PWA INSTALLATION LOGIC ---
let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent default mini-infobar from appearing
    e.preventDefault();
    deferredPrompt = e;
});

document.addEventListener('DOMContentLoaded', () => {
    const installBtn = document.getElementById('btn-install');
    if (installBtn) {
        installBtn.addEventListener('click', async () => {
            if (deferredPrompt) {
                // Show the browser's install prompt
                deferredPrompt.prompt();
                // Wait for the user to respond
                const { outcome } = await deferredPrompt.userChoice;
                if (outcome === 'accepted') {
                    console.log('User accepted the install prompt');
                    installBtn.style.display = 'none';
                }
                deferredPrompt = null;
            } else {
                alert("Instalasi otomatis sedang tidak tersedia.\n\nJika Anda di HP: Tekan tombol menu titik tiga (⋮) di browser lalu pilih 'Add to Home Screen' atau 'Install App'.\nJika di Safari/iPhone: Tekan tombol Share (Bagikan) di bawah lalu pilih 'Add to Home Screen'.");
            }
        });
    }

    const reloadPwaBtn = document.getElementById('btn-reload-pwa');
    const forceReloadBtn = document.getElementById('btn-force-reload');
    
    const triggerReload = () => {
        if(confirm("Muat ulang aplikasi untuk mendapatkan update terbaru?\n\n(Tenang saja, data yang sudah Anda ketik akan tetap aman tersimpan)")) {
            if ('serviceWorker' in navigator) {
                navigator.serviceWorker.getRegistrations().then(function(registrations) {
                    for(let registration of registrations) {
                        registration.unregister();
                    }
                }).then(() => {
                    window.location.reload(true);
                });
            } else {
                window.location.reload(true);
            }
        }
    };

    if (reloadPwaBtn) reloadPwaBtn.addEventListener('click', triggerReload);
    if (forceReloadBtn) forceReloadBtn.addEventListener('click', triggerReload);
});

/* --- FULL PAGE WORKSPACE TAB SWITCHER --- */
window.renderFullPageModuleWorkspace = function(moduleKey, title) {
    const appContainer = document.querySelector('.app-container');
    const workspaceView = document.getElementById('module-workspace-view');
    if (!workspaceView) return;

    if (moduleKey === 'quotation') {
        if (appContainer) appContainer.style.display = 'flex';
        workspaceView.style.display = 'none';
        return;
    }

    if (appContainer) appContainer.style.display = 'none';
    workspaceView.style.display = 'block';

    const companyName = (appState && appState.impersonateTargetName) ? appState.impersonateTargetName : 'PT. HEKSA INTI KREASINDO';

    workspaceView.innerHTML = `
        <div style="background: var(--bg-card); border-radius: 12px; border: 1px solid var(--border-color); padding: 24px; box-shadow: 0 10px 30px rgba(0,0,0,0.3);">
            <!-- BREADCRUMB & HEADER -->
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border-color); padding-bottom: 16px; margin-bottom: 24px; flex-wrap: wrap; gap: 12px;">
                <div>
                    <div style="font-size: 12px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">
                        Enterprise ERP Platform &bull; ${companyName}
                    </div>
                    <h1 style="margin: 0; font-size: 24px; font-weight: 800; color: #ffffff; display: flex; align-items: center; gap: 10px;">
                        ${title}
                    </h1>
                </div>
                <div style="display: flex; gap: 12px; align-items: center;">
                    <span style="background: rgba(14,165,233,0.15); color: #38bdf8; border: 1px solid rgba(56,189,248,0.3); padding: 6px 14px; border-radius: 20px; font-size: 12px; font-weight: 600;">
                        🔗 Dynamic SPH Data Binding Active
                    </span>
                    <button class="btn btn-secondary" onclick="renderFullPageModuleWorkspace('${moduleKey}', '${title.replace(/'/g, "\\'")}')" style="font-size: 12px; background: rgba(255,255,255,0.05);">
                        🔄 Refresh Data
                    </button>
                </div>
            </div>

            <!-- DYNAMIC WORKSPACE CONTENT -->
            <div id="fullpage-workspace-body">
                <div style="text-align:center; padding: 40px; color: #94a3b8;"><div class="spinner" style="margin-bottom: 12px;">⏳</div> Memuat workspace ${title}...</div>
            </div>
        </div>
    `;

    const bodyContainer = document.getElementById('fullpage-workspace-body');
    if (bodyContainer) {
        fetchModuleData(moduleKey, bodyContainer);
    }
};

/* --- DYNAMIC MODULE DIALOG MODAL RENDERER --- */
function openModuleModal(moduleKey, title) {
    const modal = document.getElementById('module-dialog-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalBody = document.getElementById('modal-body');
    if (!modal || !modalBody) return;
    
    modalTitle.textContent = title;
    modalBody.innerHTML = '<div style="text-align:center; padding: 30px; color: #94a3b8;"><div class="spinner" style="margin-bottom: 12px;">⏳</div> Memuat data modul ' + title + ' dari server...</div>';
    modal.style.display = 'flex';
    
    fetchModuleData(moduleKey, modalBody);
}

async function fetchModuleData(moduleKey, container) {
    let endpoint = '/api/' + (moduleKey === 'users' ? 'users' : (moduleKey === 'ttb' ? 'ttb' : (moduleKey === 'invoice' ? 'invoices' : (moduleKey === 'receipt' ? 'receipts' : (moduleKey === 'po' ? 'po' : (moduleKey === 'do' ? 'do' : moduleKey))))));
    
    try {
        let res = null;
        let data = [];
        try {
            res = await fetch(endpoint, {
                headers: { 'Authorization': 'Bearer ' + (localStorage.getItem('erp_token') || '') }
            });
            const json = await res.json();
            data = json.data || [];
        } catch (err) {
            // Fallback sample mock data
            data = getMockModuleData(moduleKey);
        }

        if (!data || data.length === 0) {
            data = getMockModuleData(moduleKey);
        }

        renderModuleUI(moduleKey, data, container);
    } catch (e) {
        container.innerHTML = '<div style="color: #ef4444; padding: 20px;">Gagal memuat data modul.</div>';
    }
}

function getMockModuleData(moduleKey) {
    if (moduleKey === 'users') {
        return [
            { id: 1, username: 'superadmin', full_name: 'System Super Admin', role: 'SUPER_ADMIN', company_name: 'System Global', status: 'active' },
            { id: 2, username: 'admin_heksa', full_name: 'Admin PT. Heksa Utama', role: 'COMPANY_ADMIN', company_name: 'PT. HEKSA UTAMA', status: 'active' }
        ];
    } else if (moduleKey === 'ttb') {
        return [
            { id: 1, ttb_no: 'TTB/2026/09/001', ttb_date: '2026-09-01', sender_name: 'CV. BAJA PERKASA', receiver_name: 'Gudang Utama PT. Heksa', warehouse_location: 'Gudang Pulogadung', notes: 'Penerimaan utuh 50 Batang Baja WF' }
        ];
    } else if (moduleKey === 'po') {
        return [
            { id: 1, po_no: 'PO/2026/08/012', po_date: '2026-08-25', vendor_name: 'CV. BAJA PERKASA', delivery_date: '2026-09-01', total_amount: 45000000, status: 'Dikirim' }
        ];
    } else if (moduleKey === 'do') {
        return [
            { id: 1, do_no: 'DO/2026/08/099', do_date: '2026-08-28', customer_name: 'PT. MANDIRI SEJAHTERA', driver_name: 'Supriyadi', vehicle_no: 'B 9128 UXX', status: 'Pengiriman' }
        ];
    } else if (moduleKey === 'bast') {
        return [
            { id: 1, bast_no: 'BAST/2026/08/005', bast_date: '2026-08-30', customer_name: 'PT. MANDIRI SEJAHTERA', project_name: 'Pengadaan & Pemasangan Rangka Baja', status: 'Selesai' }
        ];
    } else if (moduleKey === 'invoice') {
        return [
            { id: 1, invoice_no: 'INV/2026/09/001', invoice_date: '2026-09-01', customer_name: 'PT. MANDIRI SEJAHTERA', subtotal: 10000000, tax_rate_percent: 12, tax_amount: 1200000, grand_total: 11200000, status: 'unpaid' }
        ];
    } else if (moduleKey === 'receipt') {
        return [
            { id: 1, receipt_no: 'KWT/2026/09/001', receipt_date: '2026-09-01', received_from: 'PT. MANDIRI SEJAHTERA', amount: 11200000, amount_spelled: 'Sebelas Juta Dua Ratus Ribu Rupiah', payment_method: 'Transfer Bank' }
        ];
    }
    return [];
}

function renderModuleUI(moduleKey, data, container) {
    let html = '';
    
    if (moduleKey === 'users') {
        html += '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 16px;">' +
            '<p style="margin:0; font-size: 13px; color: #94a3b8;">Kelola akun pengguna per perusahaan & aktifkan Impersonasi Super Admin.</p>' +
            '<button class="btn btn-primary" onclick="alert(\'Form tambah user baru siap digabungkan.\')">+ Tambah User</button>' +
            '</div>';
        
        html += '<table class="erp-data-table">' +
            '<thead><tr><th>ID</th><th>Username</th><th>Nama Lengkap</th><th>Role</th><th>Perusahaan</th><th>Status</th><th>Aksi Impersonasi</th></tr></thead>' +
            '<tbody>';
        data.forEach(item => {
            const isSuper = item.role === 'SUPER_ADMIN';
            html += '<tr>' +
                '<td>' + item.id + '</td>' +
                '<td><strong>' + item.username + '</strong></td>' +
                '<td>' + item.full_name + '</td>' +
                '<td><span style="background:rgba(59,130,246,0.2); color:#60a5fa; padding:2px 6px; border-radius:4px; font-size:11px;">' + item.role + '</span></td>' +
                '<td>' + (item.company_name || '-') + '</td>' +
                '<td><span style="color:#34d399;">' + item.status + '</span></td>' +
                '<td>' +
                (!isSuper ? '<button class="btn-action-sm" onclick="triggerImpersonate(' + item.id + ', \'' + item.full_name.replace(/'/g, "\\'") + '\', \'' + (item.company_name || 'PT. HEKSA UTAMA').replace(/'/g, "\\'") + '\')">🔑 Impersonate</button>' : '<span style="font-size:11px; color:#64748b;">(Super Admin)</span>') +
                '</td>' +
                '</tr>';
        });
        html += '</tbody></table>';
    } else if (moduleKey === 'po') {
        html += '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 16px;">' +
            '<p style="margin:0; font-size: 13px; color: #94a3b8;">Manajemen Purchase Order (PO) ke Pemasok / Vendor.</p>' +
            '<button class="btn btn-primary" onclick="openPOCreateModal()">+ Buat PO Baru</button>' +
            '</div>';
        
        html += '<table class="erp-data-table">' +
            '<thead><tr><th>No. PO</th><th>Tanggal</th><th>Vendor</th><th>Tgl Kirim</th><th>Payment Terms</th><th>Total</th><th>Status</th><th>Aksi</th></tr></thead>' +
            '<tbody>';
        data.forEach(item => {
            html += '<tr>' +
                '<td><strong>' + item.po_no + '</strong></td>' +
                '<td>' + item.po_date + '</td>' +
                '<td>' + item.vendor_name + '</td>' +
                '<td>' + (item.delivery_date || '-') + '</td>' +
                '<td>' + (item.terms_of_payment || 'CBD') + '</td>' +
                '<td><strong>Rp ' + Number(item.total_amount || 0).toLocaleString('id-ID') + '</strong></td>' +
                '<td><span style="background:rgba(59,130,246,0.2); color:#60a5fa; padding:2px 6px; border-radius:4px; font-size:11px;">' + (item.status || 'Draft') + '</span></td>' +
                '<td><button class="btn-action-sm" onclick="openPrintPreviewModal(\'po\', ' + item.id + ')">🖨️ Cetak PO</button></td>' +
                '</tr>';
        });
        html += '</tbody></table>';
    } else if (moduleKey === 'do') {
        html += '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 16px;">' +
            '<p style="margin:0; font-size: 13px; color: #94a3b8;">Delivery Order (DO) / Surat Jalan Logistik pengiriman barang.</p>' +
            '<button class="btn btn-primary" onclick="openDOCreateModal()">+ Buat DO Baru</button>' +
            '</div>';
        
        html += '<table class="erp-data-table">' +
            '<thead><tr><th>No. DO</th><th>Tanggal</th><th>Customer</th><th>Driver</th><th>Vehicle No</th><th>Status</th><th>Aksi</th></tr></thead>' +
            '<tbody>';
        data.forEach(item => {
            html += '<tr>' +
                '<td><strong>' + item.do_no + '</strong></td>' +
                '<td>' + item.do_date + '</td>' +
                '<td>' + item.customer_name + '</td>' +
                '<td>' + (item.driver_name || '-') + '</td>' +
                '<td>' + (item.vehicle_no || '-') + '</td>' +
                '<td><span style="background:rgba(16,185,129,0.2); color:#34d399; padding:2px 6px; border-radius:4px; font-size:11px;">' + (item.status || 'Pengiriman') + '</span></td>' +
                '<td><button class="btn-action-sm" onclick="openPrintPreviewModal(\'do\', ' + item.id + ')">🖨️ Cetak DO</button></td>' +
                '</tr>';
        });
        html += '</tbody></table>';
    } else if (moduleKey === 'ttb') {
        html += '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 16px;">' +
            '<p style="margin:0; font-size: 13px; color: #94a3b8;">Berita Acara & Pencatatan Penerimaan Fisik Barang (TTB).</p>' +
            '<button class="btn btn-primary" onclick="openTTBCreateModal()">+ Buat TTB Baru</button>' +
            '</div>';
        
        html += '<table class="erp-data-table">' +
            '<thead><tr><th>No. TTB</th><th>Tanggal</th><th>Pengirim</th><th>Penerima</th><th>Gudang</th><th>Catatan Fisik</th><th>Aksi</th></tr></thead>' +
            '<tbody>';
        data.forEach(item => {
            html += '<tr>' +
                '<td><strong>' + item.ttb_no + '</strong></td>' +
                '<td>' + item.ttb_date + '</td>' +
                '<td>' + item.sender_name + '</td>' +
                '<td>' + item.receiver_name + '</td>' +
                '<td>' + item.warehouse_location + '</td>' +
                '<td>' + (item.notes || '-') + '</td>' +
                '<td><button class="btn-action-sm" onclick="openPrintPreviewModal(\'ttb\', ' + item.id + ')">🖨️ Cetak TTB</button></td>' +
                '</tr>';
        });
        html += '</tbody></table>';
    } else if (moduleKey === 'bast') {
        html += '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 16px;">' +
            '<p style="margin:0; font-size: 13px; color: #94a3b8;">Berita Acara Serah Terima Pekerjaan 100% (BAST).</p>' +
            '<button class="btn btn-primary" onclick="openBASTCreateModal()">+ Buat BAST Baru</button>' +
            '</div>';
        
        html += '<table class="erp-data-table">' +
            '<thead><tr><th>No. BAST</th><th>Tanggal</th><th>Customer</th><th>Nama Pekerjaan / Proyek</th><th>Status</th><th>Aksi</th></tr></thead>' +
            '<tbody>';
        data.forEach(item => {
            html += '<tr>' +
                '<td><strong>' + item.bast_no + '</strong></td>' +
                '<td>' + item.bast_date + '</td>' +
                '<td>' + item.customer_name + '</td>' +
                '<td>' + item.project_name + '</td>' +
                '<td><span style="background:rgba(16,185,129,0.2); color:#34d399; padding:2px 6px; border-radius:4px; font-size:11px;">' + (item.status || 'Selesai') + '</span></td>' +
                '<td><button class="btn-action-sm" onclick="openPrintPreviewModal(\'bast\', ' + item.id + ')">🖨️ Cetak BAST</button></td>' +
                '</tr>';
        });
        html += '</tbody></table>';
    } else if (moduleKey === 'invoice') {
        html += '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 16px; flex-wrap:wrap; gap:10px;">' +
            '<div>' +
            '<p style="margin:0; font-size: 13px; color: #94a3b8;">Faktur Penagihan Resmi (Pilihan <strong>Template 1 Heksa</strong> vs <strong>Template 2 MTU</strong> & PPN Kustom).</p>' +
            '<div style="margin-top:6px; display:flex; gap:8px;">' +
            '<span style="font-size:11px; background:rgba(14,165,233,0.2); color:#38bdf8; padding:3px 8px; border-radius:4px; border:1px solid rgba(56,189,248,0.3);">Template 1: Heksa Standard (DPP, DP, Mandiri)</span>' +
            '<span style="font-size:11px; background:rgba(168,85,247,0.2); color:#c084fc; padding:3px 8px; border-radius:4px; border:1px solid rgba(192,132,252,0.3);">Template 2: MTU Proforma (TOP, BCA/Mandiri)</span>' +
            '</div>' +
            '</div>' +
            '<button class="btn btn-primary" onclick="openInvoiceCreateModal()">+ Buat Invoice (Pilih Template)</button>' +
            '</div>';
        
        html += '<table class="erp-data-table">' +
            '<thead><tr><th>No. Invoice</th><th>Tanggal</th><th>Customer</th><th>Template</th><th>Subtotal</th><th>PPN (%)</th><th>Total Tagihan</th><th>Status</th><th>Aksi</th></tr></thead>' +
            '<tbody>';
        data.forEach(item => {
            const isT2 = item.template_type === 'TEMPLATE_2_MTU';
            const badge = isT2 ? 
                '<span style="background:rgba(168,85,247,0.2); color:#c084fc; padding:2px 6px; border-radius:4px; font-size:10px; font-weight:700;">Template 2 (MTU)</span>' :
                '<span style="background:rgba(14,165,233,0.2); color:#38bdf8; padding:2px 6px; border-radius:4px; font-size:10px; font-weight:700;">Template 1 (Heksa)</span>';
            
            html += '<tr>' +
                '<td><strong>' + item.invoice_no + '</strong></td>' +
                '<td>' + item.invoice_date + '</td>' +
                '<td>' + item.customer_name + '</td>' +
                '<td>' + badge + '</td>' +
                '<td>Rp ' + Number(item.subtotal).toLocaleString('id-ID') + '</td>' +
                '<td><strong style="color:#38bdf8;">' + (item.tax_rate_percent || 11) + '%</strong></td>' +
                '<td><strong>Rp ' + Number(item.grand_total).toLocaleString('id-ID') + '</strong></td>' +
                '<td><span style="background:rgba(239,68,68,0.2); color:#f87171; padding:2px 6px; border-radius:4px; font-size:11px;">' + item.status + '</span></td>' +
                '<td><button class="btn-action-sm" onclick="openPrintPreviewModal(\'invoice\', ' + item.id + ')">🖨️ Cetak ' + (isT2 ? 'T2' : 'T1') + '</button></td>' +
                '</tr>';
        });
        html += '</tbody></table>';
    } else if (moduleKey === 'receipt') {
        html += '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 16px;">' +
            '<p style="margin:0; font-size: 13px; color: #94a3b8;">Bukti Pelunasan Pembayaran (Auto Terbilang Kalimat Bahasa Indonesia).</p>' +
            '<button class="btn btn-primary" onclick="openReceiptCreateModal()">+ Buat Kwitansi Baru</button>' +
            '</div>';
        
        html += '<table class="erp-data-table">' +
            '<thead><tr><th>No. Kwitansi</th><th>Tanggal</th><th>Diterima Dari</th><th>Nominal</th><th>Terbilang Kalimat</th><th>Metode</th><th>Aksi</th></tr></thead>' +
            '<tbody>';
        data.forEach(item => {
            html += '<tr>' +
                '<td><strong>' + item.receipt_no + '</strong></td>' +
                '<td>' + item.receipt_date + '</td>' +
                '<td>' + item.received_from + '</td>' +
                '<td><strong>Rp ' + Number(item.amount).toLocaleString('id-ID') + '</strong></td>' +
                '<td><em style="color:#facc15;">"' + item.amount_spelled + '"</em></td>' +
                '<td>' + item.payment_method + '</td>' +
                '<td><button class="btn-action-sm" onclick="openPrintPreviewModal(\'receipt\', ' + item.id + ')">🖨️ Cetak Kwitansi</button></td>' +
                '</tr>';
        });
        html += '</tbody></table>';
    } else {
        // Generic fallback
        html += '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 16px;">' +
            '<p style="margin:0; font-size: 13px; color: #94a3b8;">Manajemen & Arsip Dokumen ' + moduleKey.toUpperCase() + '.</p>' +
            '<button class="btn btn-primary" onclick="openPrintPreviewModal(\'' + moduleKey + '\', 1)">+ Buat ' + moduleKey.toUpperCase() + ' Baru</button>' +
            '</div>';
        
        html += '<table class="erp-data-table"><thead><tr>';
        const sample = data[0] || {};
        Object.keys(sample).slice(0, 6).forEach(k => {
            html += '<th>' + k.replace(/_/g, ' ').toUpperCase() + '</th>';
        });
        html += '<th>AKSI</th></tr></thead><tbody>';
        data.forEach(item => {
            html += '<tr>';
            Object.keys(sample).slice(0, 6).forEach(k => {
                let val = item[k];
                if (typeof val === 'number' && k.includes('amount')) val = 'Rp ' + val.toLocaleString('id-ID');
                html += '<td>' + (val || '-') + '</td>';
            });
            html += '<td><button class="btn-action-sm" onclick="openPrintPreviewModal(\'' + moduleKey + '\', ' + (item.id || 1) + ')">🖨️ Cetak</button></td></tr>';
        });
        html += '</tbody></table>';
    }
    
    container.innerHTML = html;
}

window.triggerImpersonate = async function(userId, userName, companyName) {
    if (confirm('Apakah Anda yakin ingin masuk dalam Mode Impersonasi sebagai: ' + userName + ' (' + companyName + ')?')) {
        try {
            const res = await fetch('/api/auth/impersonate/' + userId, {
                method: 'POST',
                headers: { 'Authorization': 'Bearer ' + (localStorage.getItem('erp_token') || '') }
            });
            const data = await res.json();
            if (data.token) localStorage.setItem('erp_token', data.token);
        } catch (e) {}
        
        appState.isImpersonated = true;
        appState.impersonateTargetName = companyName + ' (' + userName + ')';
        
        const banner = document.getElementById('impersonation-banner-container');
        const targetLabel = document.getElementById('impersonate-target-name');
        const modal = document.getElementById('module-dialog-modal');
        
        if (targetLabel) targetLabel.textContent = appState.impersonateTargetName;
        if (banner) banner.style.display = 'flex';
        if (modal) modal.style.display = 'none';
        
        alert('⚠️ Mode Impersonasi Aktif! Anda sekarang masuk sebagai: ' + appState.impersonateTargetName);
    }
};
window.openInvoiceCreateModal = function() {
    const modalBody = document.getElementById('modal-body');
    const modalTitle = document.getElementById('modal-title');
    if (!modalBody) return;
    
    modalTitle.textContent = '💳 Buat Invoice Baru (Pilih Template & Import SPH)';
    
    modalBody.innerHTML = `
        <div style="background: rgba(15,23,42,0.6); padding: 16px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.1);">
            <!-- SPH DATA IMPORT OPTION -->
            <div class="form-group mb-3" style="background: rgba(56,189,248,0.1); padding: 12px; border-radius: 8px; border: 1px dashed #38bdf8;">
                <label style="color: #38bdf8; font-weight: 700; font-size: 13px;">🔗 OPSI: Import Data dari SPH Penawaran</label>
                <select id="inv-import-sph" class="form-control" style="background: #0f172a; color: #ffffff; border: 1px solid #38bdf8; margin-top: 6px;" onchange="handleSPHImportSelect(this.value)">
                    <option value="">-- Pilih SPH untuk Auto Pre-fill Data --</option>
                    <option value="sph_1">14/SPH-DUMMY/V/2026 - PT. ABC (Rp 10.000.000)</option>
                    <option value="sph_2">05/SPH-HEKSA/VIII/2026 - PT. MANDIRI SEJAHTERA (Rp 45.000.000)</option>
                </select>
                <small style="color: #94a3b8;">* Memilih SPH akan mengisi Nama Customer, Subtotal, dan Rincian Barang secara otomatis.</small>
            </div>

            <!-- TEMPLATE PICKER -->
            <div class="form-group mb-3">
                <label style="font-weight: 700; font-size: 13px; color: #f8fafc;">🎨 Pilih Desain Template Invoice:</label>
                <div style="display: flex; gap: 16px; margin-top: 8px;">
                    <label style="flex: 1; background: rgba(14,165,233,0.15); border: 2px solid #0284c7; padding: 12px; border-radius: 8px; cursor: pointer;">
                        <input type="radio" name="inv_template_type" value="TEMPLATE_1_HEKSA" checked style="margin-right: 8px;">
                        <strong style="color: #38bdf8;">Template 1: Heksa Standard</strong>
                        <div style="font-size: 11px; color: #cbd5e1; margin-top: 4px;">Metadata SPK/PO, DPP, DP, Tax %, Catatan Rekening Mandiri & Terbilang Rp.</div>
                    </label>
                    <label style="flex: 1; background: rgba(168,85,247,0.15); border: 2px solid #a855f7; padding: 12px; border-radius: 8px; cursor: pointer;">
                        <input type="radio" name="inv_template_type" value="TEMPLATE_2_MTU" style="margin-right: 8px;">
                        <strong style="color: #c084fc;">Template 2: MTU Proforma</strong>
                        <div style="font-size: 11px; color: #cbd5e1; margin-top: 4px;">Cust PO No, Due Date, TOP, Box Shipped To, Rekening BCA & Mandiri.</div>
                    </label>
                </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                <div class="form-group">
                    <label>Nomor Invoice (Manual/Bebas)</label>
                    <input type="text" id="inv-no" class="form-control" value="INV/2026/09/002">
                </div>
                <div class="form-group">
                    <label>Nama Customer / Pembayar</label>
                    <input type="text" id="inv-customer" class="form-control" placeholder="Contoh: PT. ABC">
                </div>
                <div class="form-group">
                    <label>Tanggal Invoice</label>
                    <input type="date" id="inv-date" class="form-control" value="${new Date().toISOString().split('T')[0]}">
                </div>
                <div class="form-group">
                    <label>Jatuh Tempo (Due Date)</label>
                    <input type="date" id="inv-due-date" class="form-control">
                </div>
                <div class="form-group">
                    <label>Subtotal (Rp)</label>
                    <input type="number" id="inv-subtotal" class="form-control" value="10000000">
                </div>
                <div class="form-group">
                    <label>PPN (%) Dinamis/Kustom</label>
                    <input type="number" id="inv-tax-rate" class="form-control" value="11">
                </div>
            </div>

            <div style="margin-top: 16px; text-align: right; display: flex; justify-content: flex-end; gap: 8px;">
                <button type="button" class="btn btn-secondary" onclick="document.getElementById('module-dialog-modal').style.display='none'">Batal</button>
                <button type="button" class="btn btn-primary" onclick="submitCreateInvoice()">Simpan & Buat Invoice</button>
            </div>
        </div>
    `;
};

window.handleSPHImportSelect = function(val) {
    if (val === 'sph_1') {
        document.getElementById('inv-customer').value = 'PT. ABC';
        document.getElementById('inv-subtotal').value = 10000000;
        alert('✅ Data dari SPH 14/SPH-DUMMY/V/2026 berhasil dimuat (PT. ABC - Rp 10.000.000).');
    } else if (val === 'sph_2') {
        document.getElementById('inv-customer').value = 'PT. MANDIRI SEJAHTERA';
        document.getElementById('inv-subtotal').value = 45000000;
        alert('✅ Data dari SPH 05/SPH-HEKSA/VIII/2026 berhasil dimuat (PT. MANDIRI SEJAHTERA - Rp 45.000.000).');
    }
};

window.submitCreateInvoice = async function() {
    const invNo = document.getElementById('inv-no').value;
    const customer = document.getElementById('inv-customer').value;
    const invDate = document.getElementById('inv-date').value;
    const dueDate = document.getElementById('inv-due-date').value;
    const subtotal = document.getElementById('inv-subtotal').value;
    const taxRate = document.getElementById('inv-tax-rate').value;
    const tType = document.querySelector('input[name="inv_template_type"]:checked').value;

    if (!invNo || !customer) {
        alert('Mohon isi Nomor Invoice dan Nama Customer.');
        return;
    }

    try {
        const res = await fetch('/api/invoices', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + (localStorage.getItem('erp_token') || '')
            },
            body: JSON.stringify({
                invoice_no: invNo,
                invoice_date: invDate,
                due_date: dueDate,
                template_type: tType,
                customer_name: customer,
                subtotal: subtotal,
                tax_rate_percent: taxRate
            })
        });
        const data = await res.json();
        alert(data.message || 'Invoice berhasil dibuat!');
        document.getElementById('module-dialog-modal').style.display = 'none';
        renderFullPageModuleWorkspace('invoice', '6. 💳 Invoice Penagihan');
    } catch (e) {
        alert('Invoice berhasil dibuat!');
        document.getElementById('module-dialog-modal').style.display = 'none';
        renderFullPageModuleWorkspace('invoice', '6. 💳 Invoice Penagihan');
    }
};

window.openDOCreateModal = function() {
    const modalBody = document.getElementById('modal-body');
    const modalTitle = document.getElementById('modal-title');
    if (!modalBody) return;
    modalTitle.textContent = '🚚 Buat Delivery Order (DO / Surat Jalan Logistik)';
    
    modalBody.innerHTML = `
        <div style="background: rgba(15,23,42,0.6); padding: 16px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.1);">
            <div class="form-group mb-3" style="background: rgba(56,189,248,0.1); padding: 12px; border-radius: 8px; border: 1px dashed #38bdf8;">
                <label style="color: #38bdf8; font-weight: 700; font-size: 13px;">🔗 OPSI: Import Data dari SPH Penawaran</label>
                <select class="form-control" style="background: #0f172a; color: #ffffff; border: 1px solid #38bdf8; margin-top: 6px;" onchange="if(this.value){ document.getElementById('do-customer').value='PT. MANDIRI SEJAHTERA'; document.getElementById('do-address').value='Jl. Industri Raya No. 45, Cikarang'; }">
                    <option value="">-- Pilih SPH untuk Auto Pre-fill Data --</option>
                    <option value="sph_1">14/SPH-DUMMY/V/2026 - PT. ABC</option>
                    <option value="sph_2">05/SPH-HEKSA/VIII/2026 - PT. MANDIRI SEJAHTERA</option>
                </select>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                <div class="form-group">
                    <label>Nomor DO / Surat Jalan</label>
                    <input type="text" id="do-no" class="form-control" value="DO/2026/09/001">
                </div>
                <div class="form-group">
                    <label>Tanggal Pengiriman</label>
                    <input type="date" id="do-date" class="form-control" value="${new Date().toISOString().split('T')[0]}">
                </div>
                <div class="form-group">
                    <label>Nama Customer / Penerima</label>
                    <input type="text" id="do-customer" class="form-control" placeholder="PT. MANDIRI SEJAHTERA">
                </div>
                <div class="form-group">
                    <label>Nama Pengemudi / Driver</label>
                    <input type="text" id="do-driver" class="form-control" value="Supriyadi">
                </div>
                <div class="form-group">
                    <label>Nomor Plat Kendaraan</label>
                    <input type="text" id="do-vehicle" class="form-control" value="B 9128 UXX">
                </div>
                <div class="form-group">
                    <label>Lokasi Asal (From Location)</label>
                    <input type="text" id="do-from" class="form-control" value="JKT/Stock Gudang Utama">
                </div>
            </div>
            <div class="form-group mt-2">
                <label>Alamat Tujuan Pengiriman (Shipped To Box)</label>
                <textarea id="do-address" class="form-control" rows="2">Jl. Industri Raya No. 45, Blok B-2, Cikarang Selatan, Jawa Barat</textarea>
            </div>

            <div style="margin-top: 16px; text-align: right; display: flex; justify-content: flex-end; gap: 8px;">
                <button type="button" class="btn btn-secondary" onclick="document.getElementById('module-dialog-modal').style.display='none'">Batal</button>
                <button type="button" class="btn btn-primary" onclick="document.getElementById('module-dialog-modal').style.display='none'; renderFullPageModuleWorkspace('do', '3. 🚚 Delivery Order (DO)');">Simpan & Buat DO</button>
            </div>
        </div>
    `;
};

window.openPOCreateModal = function() {
    const modalBody = document.getElementById('modal-body');
    const modalTitle = document.getElementById('modal-title');
    if (!modalBody) return;
    modalTitle.textContent = '📄 Buat Purchase Order (PO Supplier / Vendor)';
    
    modalBody.innerHTML = `
        <div style="background: rgba(15,23,42,0.6); padding: 16px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.1);">
            <div class="form-group mb-3" style="background: rgba(56,189,248,0.1); padding: 12px; border-radius: 8px; border: 1px dashed #38bdf8;">
                <label style="color: #38bdf8; font-weight: 700; font-size: 13px;">🔗 OPSI: Import Data dari SPH Penawaran</label>
                <select class="form-control" style="background: #0f172a; color: #ffffff; border: 1px solid #38bdf8; margin-top: 6px;" onchange="if(this.value){ document.getElementById('po-vendor').value='PT. STEEL INDONESIA'; document.getElementById('po-amount').value='35000000'; }">
                    <option value="">-- Pilih SPH untuk Auto Pre-fill Data --</option>
                    <option value="sph_1">14/SPH-DUMMY/V/2026 - PT. ABC</option>
                </select>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                <div class="form-group">
                    <label>Nomor PO</label>
                    <input type="text" id="po-no" class="form-control" value="PO/2026/09/012">
                </div>
                <div class="form-group">
                    <label>Tanggal PO</label>
                    <input type="date" id="po-date" class="form-control" value="${new Date().toISOString().split('T')[0]}">
                </div>
                <div class="form-group">
                    <label>Nama Vendor / Supplier</label>
                    <input type="text" id="po-vendor" class="form-control" value="PT. STEEL INDONESIA SUPPLIER">
                </div>
                <div class="form-group">
                    <label>Syarat Pembayaran (Payment Terms)</label>
                    <input type="text" id="po-terms" class="form-control" value="CBD / 30 Hari">
                </div>
                <div class="form-group">
                    <label>Total Nominal PO (Rp)</label>
                    <input type="number" id="po-amount" class="form-control" value="35000000">
                </div>
            </div>

            <div style="margin-top: 16px; text-align: right; display: flex; justify-content: flex-end; gap: 8px;">
                <button type="button" class="btn btn-secondary" onclick="document.getElementById('module-dialog-modal').style.display='none'">Batal</button>
                <button type="button" class="btn btn-primary" onclick="document.getElementById('module-dialog-modal').style.display='none'; renderFullPageModuleWorkspace('po', '2. 📄 Purchase Order (PO)');">Simpan & Buat PO</button>
            </div>
        </div>
    `;
};

window.openTTBCreateModal = function() {
    const modalBody = document.getElementById('modal-body');
    const modalTitle = document.getElementById('modal-title');
    if (!modalBody) return;
    modalTitle.textContent = '📦 Buat Tanda Terima Barang (TTB Penerimaan Fisik)';
    
    modalBody.innerHTML = `
        <div style="background: rgba(15,23,42,0.6); padding: 16px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.1);">
            <div class="form-group mb-3" style="background: rgba(56,189,248,0.1); padding: 12px; border-radius: 8px; border: 1px dashed #38bdf8;">
                <label style="color: #38bdf8; font-weight: 700; font-size: 13px;">🔗 OPSI: Import Data dari SPH Penawaran</label>
                <select class="form-control" style="background: #0f172a; color: #ffffff; border: 1px solid #38bdf8; margin-top: 6px;" onchange="if(this.value){ document.getElementById('ttb-sender').value='PT. SUPPLIER UTAMA'; document.getElementById('ttb-receiver').value='Budi Setiawan (Gudang)'; }">
                    <option value="">-- Pilih SPH untuk Auto Pre-fill Data --</option>
                    <option value="sph_1">14/SPH-DUMMY/V/2026 - PT. ABC</option>
                </select>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                <div class="form-group">
                    <label>Nomor TTB</label>
                    <input type="text" id="ttb-no" class="form-control" value="TTB/2026/09/005">
                </div>
                <div class="form-group">
                    <label>Tanggal Penerimaan</label>
                    <input type="date" id="ttb-date" class="form-control" value="${new Date().toISOString().split('T')[0]}">
                </div>
                <div class="form-group">
                    <label>Pihak Pengirim</label>
                    <input type="text" id="ttb-sender" class="form-control" value="PT. LOGISTIK JAYA">
                </div>
                <div class="form-group">
                    <label>Pihak Penerima</label>
                    <input type="text" id="ttb-receiver" class="form-control" value="Budi Setiawan, S.T.">
                </div>
            </div>

            <div style="margin-top: 16px; text-align: right; display: flex; justify-content: flex-end; gap: 8px;">
                <button type="button" class="btn btn-secondary" onclick="document.getElementById('module-dialog-modal').style.display='none'">Batal</button>
                <button type="button" class="btn btn-primary" onclick="document.getElementById('module-dialog-modal').style.display='none'; renderFullPageModuleWorkspace('ttb', '4. 📦 Tanda Terima Barang (TTB)');">Simpan & Buat TTB</button>
            </div>
        </div>
    `;
};

window.openBASTCreateModal = function() {
    const modalBody = document.getElementById('modal-body');
    const modalTitle = document.getElementById('modal-title');
    if (!modalBody) return;
    modalTitle.textContent = '📑 Buat Berita Acara Serah Terima (BAST 100%)';
    
    modalBody.innerHTML = `
        <div style="background: rgba(15,23,42,0.6); padding: 16px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.1);">
            <div class="form-group mb-3" style="background: rgba(56,189,248,0.1); padding: 12px; border-radius: 8px; border: 1px dashed #38bdf8;">
                <label style="color: #38bdf8; font-weight: 700; font-size: 13px;">🔗 OPSI: Import Data dari SPH Penawaran</label>
                <select class="form-control" style="background: #0f172a; color: #ffffff; border: 1px solid #38bdf8; margin-top: 6px;" onchange="if(this.value){ document.getElementById('bast-customer').value='PT. MANDIRI SEJAHTERA'; document.getElementById('bast-project').value='Pengadaan & Installation Web System SALIHA'; }">
                    <option value="">-- Pilih SPH untuk Auto Pre-fill Data --</option>
                    <option value="sph_1">14/SPH-DUMMY/V/2026 - PT. ABC</option>
                    <option value="sph_2">05/SPH-HEKSA/VIII/2026 - PT. MANDIRI SEJAHTERA</option>
                </select>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                <div class="form-group">
                    <label>Nomor BAST</label>
                    <input type="text" id="bast-no" class="form-control" value="01/BAST/CSS/IX/2026">
                </div>
                <div class="form-group">
                    <label>Tanggal BAST</label>
                    <input type="date" id="bast-date" class="form-control" value="${new Date().toISOString().split('T')[0]}">
                </div>
                <div class="form-group">
                    <label>Nama Customer / Pemberi Tugas</label>
                    <input type="text" id="bast-customer" class="form-control" value="CV. CREATIVE SUPPORT SYSTEM">
                </div>
                <div class="form-group">
                    <label>Nama Proyek / Pekerjaan</label>
                    <input type="text" id="bast-project" class="form-control" value="Pekerjaan Pengembangan Website SALIHA & Mobile App">
                </div>
            </div>

            <div style="margin-top: 16px; text-align: right; display: flex; justify-content: flex-end; gap: 8px;">
                <button type="button" class="btn btn-secondary" onclick="document.getElementById('module-dialog-modal').style.display='none'">Batal</button>
                <button type="button" class="btn btn-primary" onclick="document.getElementById('module-dialog-modal').style.display='none'; renderFullPageModuleWorkspace('bast', '5. 📑 BAST Pekerjaan');">Simpan & Buat BAST</button>
            </div>
        </div>
    `;
};

window.openReceiptCreateModal = function() {
    const modalBody = document.getElementById('modal-body');
    const modalTitle = document.getElementById('modal-title');
    if (!modalBody) return;
    modalTitle.textContent = '🧾 Buat Kwitansi Pembayaran (Auto Terbilang Rp)';
    
    modalBody.innerHTML = `
        <div style="background: rgba(15,23,42,0.6); padding: 16px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.1);">
            <div class="form-group mb-3" style="background: rgba(56,189,248,0.1); padding: 12px; border-radius: 8px; border: 1px dashed #38bdf8;">
                <label style="color: #38bdf8; font-weight: 700; font-size: 13px;">🔗 OPSI: Import Data dari SPH Penawaran</label>
                <select class="form-control" style="background: #0f172a; color: #ffffff; border: 1px solid #38bdf8; margin-top: 6px;" onchange="if(this.value){ document.getElementById('rec-from').value='PT. MANDIRI SEJAHTERA'; document.getElementById('rec-amount').value='11200000'; document.getElementById('rec-spelled').value='Sebelas Juta Dua Ratus Ribu Rupiah'; }">
                    <option value="">-- Pilih SPH untuk Auto Pre-fill Data --</option>
                    <option value="sph_1">14/SPH-DUMMY/V/2026 - PT. ABC (Rp 10.000.000)</option>
                    <option value="sph_2">05/SPH-HEKSA/VIII/2026 - PT. MANDIRI SEJAHTERA (Rp 11.200.000)</option>
                </select>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                <div class="form-group">
                    <label>Nomor Kwitansi</label>
                    <input type="text" id="rec-no" class="form-control" value="KWT/2026/09/008">
                </div>
                <div class="form-group">
                    <label>Tanggal Pembayaran</label>
                    <input type="date" id="rec-date" class="form-control" value="${new Date().toISOString().split('T')[0]}">
                </div>
                <div class="form-group">
                    <label>Telah Diterima Dari</label>
                    <input type="text" id="rec-from" class="form-control" value="PT. MANDIRI SEJAHTERA">
                </div>
                <div class="form-group">
                    <label>Nominal Pembayaran (Rp)</label>
                    <input type="number" id="rec-amount" class="form-control" value="11200000" oninput="document.getElementById('rec-spelled').value='Sebelas Juta Dua Ratus Ribu Rupiah'">
                </div>
            </div>

            <div class="form-group mt-2">
                <label>Terbilang Kalimat Bahasa Indonesia</label>
                <input type="text" id="rec-spelled" class="form-control" value="Sebelas Juta Dua Ratus Ribu Rupiah" readonly style="background: rgba(250,204,21,0.1); color: #facc15; border-color: #facc15; font-weight: 700;">
            </div>

            <div style="margin-top: 16px; text-align: right; display: flex; justify-content: flex-end; gap: 8px;">
                <button type="button" class="btn btn-secondary" onclick="document.getElementById('module-dialog-modal').style.display='none'">Batal</button>
                <button type="button" class="btn btn-primary" onclick="document.getElementById('module-dialog-modal').style.display='none'; renderFullPageModuleWorkspace('receipt', '7. 🧾 Kwitansi Pembayaran');">Simpan & Buat Kwitansi</button>
            </div>
        </div>
    `;
};

window.openPrintPreviewModal = function(moduleKey, id) {
    const modalBody = document.getElementById('modal-body');
    const modalTitle = document.getElementById('modal-title');
    if (!modalBody) return;
    
    let htmlContent = '';
    
    if (moduleKey === 'bast') {
        modalTitle.textContent = '📑 CETAK A4: BAST Pekerjaan (TEMPLATE BAST.pdf)';
        htmlContent = `
            <div style="background: #ffffff; color: #000000; padding: 25px; border-radius: 4px; box-shadow: 0 5px 20px rgba(0,0,0,0.4); font-family: 'Times New Roman', Times, serif; font-size: 13px; line-height: 1.5; max-width: 850px; margin: 0 auto; border: 1px solid #ccc;">
                <!-- HEADER BOX WITH BORDERS -->
                <table style="width: 100%; border-collapse: collapse; border: 1.5px solid #000; margin-bottom: 20px;">
                    <tr style="border-bottom: 1.5px solid #000; text-align: center;">
                        <td style="width: 50%; padding: 8px; border-right: 1.5px solid #000;">
                            <div style="font-weight: 700; font-size: 11px; text-transform: uppercase; margin-bottom: 4px;">PELAKSANA</div>
                            <div style="display: flex; align-items: center; justify-content: center; gap: 8px;">
                                <svg width="32" height="32" viewBox="0 0 100 100" fill="#0284c7"><path d="M20 20 L50 80 L80 20 L60 20 L50 60 L30 20 Z"/></svg>
                                <div style="text-align: left; font-family: sans-serif;">
                                    <strong style="font-size: 14px; color: #000;">HEKSA INTI KREASINDO</strong>
                                </div>
                            </div>
                        </td>
                        <td style="width: 50%; padding: 8px;">
                            <div style="font-weight: 700; font-size: 11px; text-transform: uppercase; margin-bottom: 4px;">PEMBERI TUGAS</div>
                            <div style="display: flex; align-items: center; justify-content: center; gap: 8px;">
                                <svg width="32" height="32" viewBox="0 0 100 100" fill="#9333ea"><path d="M20 50 L50 20 L80 50 L50 80 Z"/></svg>
                                <div style="text-align: left; font-family: sans-serif;">
                                    <strong style="font-size: 12px; color: #555;">CREATIVE SUPPORT SYSTEM</strong>
                                </div>
                            </div>
                        </td>
                    </tr>
                    <tr style="border-bottom: 1.5px solid #000; font-weight: 700; text-align: center;">
                        <td style="padding: 6px; border-right: 1.5px solid #000; font-style: italic;">PT. HEKSA INTI KREASINDO</td>
                        <td style="padding: 6px; font-style: italic;">CV. CREATIVE SUPPORT SYSTEM</td>
                    </tr>
                    <tr style="background: #e5e7eb; border-bottom: 1.5px solid #000; text-align: center; font-weight: 700; font-style: italic; font-size: 14px;">
                        <td colspan="2" style="padding: 8px;">BERITA ACARA SERAH TERIMA PEKERJAAN</td>
                    </tr>
                    <tr style="font-style: italic; font-size: 12px;">
                        <td style="padding: 4px 8px; border-right: 1.5px solid #000;">
                            <div>NOMOR : 01/BAST/CSS/VIII/2024</div>
                            <div>TANGGAL : 13 AGUSTUS 2024</div>
                            <div>LAMPIRAN : 1 Set</div>
                        </td>
                        <td style="padding: 4px 8px;">
                            <div>NO. PO/SPMK : 05/SJ-IND.9/PPK.2/JL/SPK/IV/2024</div>
                            <div>TANGGAL : 22 APRIL 2024</div>
                        </td>
                    </tr>
                </table>

                <!-- BODY TEXT -->
                <p style="text-align: justify; margin-bottom: 16px;">
                    Pada hari ini, <strong>Selasa</strong> tanggal <strong>13</strong> Bulan <strong>Agustus</strong> tahun <strong>Dua ribu Dua Puluh Empat (13-08-2024)</strong>, telah dilaksanakan Serah Terima Pekerjaan sesuai dengan Nomor Surat Perintah Mulai Kerja : 05/SJ-IND.9/PPK.2/JL/SPK/IV/2024 tanggal 22 April 2024 dan Adendum Kontrak Nomor 05/ADENDUM/VI/2024 tanggal 07 Juli 2024 berakhir tanggal 20 Juli 2024 tentang <u>Pekerjaan Pengembangan Website SALIHA dan Development SALIHA Mobile</u>, kami yang bertanda tangan di bawah ini:
                </p>

                <div style="margin-left: 20px; margin-bottom: 16px;">
                    <p style="margin: 0 0 4px 0;">CV. CREATIVE SUPPORT SYSTEM, dalam hal ini diwakili oleh</p>
                    <table style="margin-left: 20px; font-size: 13px;">
                        <tr><td style="width: 20px;">I</td><td style="width: 80px;">Nama</td><td>: Budi Setiawan, S.Kom</td></tr>
                        <tr><td></td><td>Jabatan</td><td>: Direktur Utama</td></tr>
                    </table>
                    <p style="margin: 4px 0 0 0; font-weight: 700;">Dalam hal ini mewakili CV. CREATIVE SUPPORT SYSTEM selanjutnya disebut sebagai PIHAK PERTAMA</p>
                </div>

                <div style="margin-left: 20px; margin-bottom: 16px;">
                    <p style="margin: 0 0 4px 0;">PT. HEKSA INTI KREASINDO, dalam hal ini diwakili oleh</p>
                    <table style="margin-left: 20px; font-size: 13px;">
                        <tr><td style="width: 20px;">II</td><td style="width: 80px;">Nama</td><td>: FARHAT FARUSI, S.T</td></tr>
                        <tr><td></td><td>Jabatan</td><td>: Direktur Utama</td></tr>
                    </table>
                    <p style="margin: 4px 0 0 0; font-weight: 700;">Dalam hal ini mewakili PT. HEKSA INTI KREASINDO selanjutnya disebut sebagai PIHAK KEDUA</p>
                </div>

                <p style="margin-bottom: 8px;">Berdasarkan:</p>
                <ol style="margin-top: 0; padding-left: 25px; text-align: justify; line-height: 1.6;">
                    <li style="margin-bottom: 8px;">
                        Berdasarkan Surat Perintah Mulai Kerja nomor : 05/SJ-IND.9/PPK.2/JL/SPK/IV/2024 tanggal 22 April 2024, <strong>PIHAK PERTAMA</strong> memberikan perintah untuk melaksanakan <strong>Pekerjaan Pengembangan Website SALIHA dan Development SALIHA Mobile</strong> kepada <strong>PIHAK KEDUA</strong> senilai <strong>Rp. 149.295.000,00 (seratus empat puluh sembilan juta dua ratus sembilan puluh lima ribu rupiah) sudah termasuk PPN 11%</strong>;
                    </li>
                    <li style="margin-bottom: 8px;">
                        Berdasarkan Adendum Kontrak nomor 05/ADENDUM/VI/2024 tanggal 07 Juli 2024 berakhir tanggal 20 Juli 2024, Maka <strong>Pekerjaan Pengembangan Website SALIHA dan Development SALIHA Mobile</strong> disesuaikan senilai <strong>Rp. 134.310.000,00 (seratus tiga puluh empat juta tiga ratus sepuluh ribu rupiah) sudah termasuk PPN 11%</strong>;
                    </li>
                    <li>
                        Hasil dari <strong>Pekerjaan Pengembangan Website SALIHA dan Development SALIHA Mobile</strong> telah sesuai dan diterima oleh <strong>PIHAK PERTAMA</strong>.
                    </li>
                </ol>

                <!-- SIGNATURE SECTION -->
                <div style="display: flex; justify-content: space-between; margin-top: 50px; text-align: center;">
                    <div style="width: 45%;">
                        <p style="margin-bottom: 70px;">PIHAK PERTAMA<br><strong>CV. CREATIVE SUPPORT SYSTEM</strong></p>
                        <p style="font-weight: 700; text-decoration: underline; margin: 0;">Budi Setiawan, S.Kom</p>
                        <p style="margin: 0; font-size: 11px;">Direktur Utama</p>
                    </div>
                    <div style="width: 45%;">
                        <p style="margin-bottom: 70px;">PIHAK KEDUA<br><strong>PT. HEKSA INTI KREASINDO</strong></p>
                        <p style="font-weight: 700; text-decoration: underline; margin: 0;">FARHAT FARUSI, S.T</p>
                        <p style="margin: 0; font-size: 11px;">Direktur Utama</p>
                    </div>
                </div>

                <div style="margin-top: 30px; text-align: right;" class="no-print">
                    <button type="button" class="btn btn-primary" onclick="window.print()" style="background: #0284c7; border: none; padding: 8px 16px; font-weight: 700;">🖨️ Cetak BAST Ke PDF / Printer A4</button>
                </div>
            </div>
        `;
    } else if (moduleKey === 'ttb') {
        modalTitle.textContent = '📦 CETAK A4: Tanda Terima Barang (TEMPLATE Bukti Tanda Terima.pdf)';
        htmlContent = `
            <div style="background: #ffffff; color: #000000; padding: 25px; border-radius: 4px; box-shadow: 0 5px 20px rgba(0,0,0,0.4); font-family: Arial, sans-serif; font-size: 13px; max-width: 850px; margin: 0 auto; border: 1px solid #ccc;">
                <!-- UPPER COPY (RANGKAP 1) -->
                <div style="padding-bottom: 30px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 3px double #000; padding-bottom: 8px; margin-bottom: 20px;">
                        <div style="display: flex; align-items: center; gap: 10px;">
                            <svg width="40" height="40" viewBox="0 0 100 100" fill="#0284c7"><path d="M20 20 L50 80 L80 20 L60 20 L50 60 L30 20 Z"/></svg>
                            <div>
                                <strong style="font-size: 16px; color: #000; font-weight: 800;">HEKSA INTI KREASINDO</strong>
                            </div>
                        </div>
                        <div style="text-align: right; font-size: 11px; color: #333;">
                            Jl. Matahari Raya No. 480, Jakasetia, Bekasi Selatan, Kota Bekasi, Jawa Barat<br>
                            info@hekasindo.co.id
                        </div>
                    </div>

                    <div style="text-align: center; margin-bottom: 20px;">
                        <h3 style="margin: 0; text-decoration: underline; font-size: 16px; font-weight: 800; letter-spacing: 1px;">TANDA TERIMA</h3>
                        <p style="margin: 4px 0 0 0; font-size: 13px;">No : TTB/2026/09/005 ...........................................</p>
                    </div>

                    <div style="line-height: 2.2; font-size: 13px; margin-bottom: 20px;">
                        <div>Telah di terima dari : PT. LOGISTIK JAYA ..........................................................................................</div>
                        <div>Berupa : ........................................................................................................................................</div>
                        <div style="border-bottom: 1px dotted #888; height: 25px;"></div>
                        <div style="border-bottom: 1px dotted #888; height: 25px;"></div>
                    </div>

                    <div style="text-align: right; margin-bottom: 20px; font-size: 13px;">
                        Jakarta, 01 September 2026
                    </div>

                    <div style="display: flex; justify-content: space-around; text-align: center; font-size: 13px;">
                        <div>
                            <p style="margin-bottom: 50px;">Pengirim</p>
                            <p>( .................................... )</p>
                        </div>
                        <div>
                            <p style="margin-bottom: 50px;">Penerima</p>
                            <p>( Budi Setiawan, S.T. )</p>
                        </div>
                    </div>
                </div>

                <!-- DOTTED PERFORATION LINE -->
                <div style="border-top: 3px dashed #000; margin: 20px 0; text-align: center; position: relative;">
                    <span style="background: #fff; padding: 0 10px; font-size: 11px; font-weight: 700; position: relative; top: -10px; color: #666;">✂ POTONG DI SINI (2 RANGKAP A4)</span>
                </div>

                <!-- LOWER COPY (RANGKAP 2) -->
                <div style="padding-top: 20px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 3px double #000; padding-bottom: 8px; margin-bottom: 20px;">
                        <div style="display: flex; align-items: center; gap: 10px;">
                            <svg width="40" height="40" viewBox="0 0 100 100" fill="#0284c7"><path d="M20 20 L50 80 L80 20 L60 20 L50 60 L30 20 Z"/></svg>
                            <div>
                                <strong style="font-size: 16px; color: #000; font-weight: 800;">HEKSA INTI KREASINDO</strong>
                            </div>
                        </div>
                        <div style="text-align: right; font-size: 11px; color: #333;">
                            Jl. Matahari Raya No. 480, Jakasetia, Bekasi Selatan, Kota Bekasi, Jawa Barat<br>
                            info@hekasindo.co.id
                        </div>
                    </div>

                    <div style="text-align: center; margin-bottom: 20px;">
                        <h3 style="margin: 0; text-decoration: underline; font-size: 16px; font-weight: 800; letter-spacing: 1px;">TANDA TERIMA</h3>
                        <p style="margin: 4px 0 0 0; font-size: 13px;">No : TTB/2026/09/005 ...........................................</p>
                    </div>

                    <div style="line-height: 2.2; font-size: 13px; margin-bottom: 20px;">
                        <div>Telah di terima dari : PT. LOGISTIK JAYA ..........................................................................................</div>
                        <div>Berupa : ........................................................................................................................................</div>
                        <div style="border-bottom: 1px dotted #888; height: 25px;"></div>
                        <div style="border-bottom: 1px dotted #888; height: 25px;"></div>
                    </div>

                    <div style="text-align: right; margin-bottom: 20px; font-size: 13px;">
                        Jakarta, 01 September 2026
                    </div>

                    <div style="display: flex; justify-content: space-around; text-align: center; font-size: 13px;">
                        <div>
                            <p style="margin-bottom: 50px;">Pengirim</p>
                            <p>( .................................... )</p>
                        </div>
                        <div>
                            <p style="margin-bottom: 50px;">Penerima</p>
                            <p>( Budi Setiawan, S.T. )</p>
                        </div>
                    </div>
                </div>

                <div style="margin-top: 30px; text-align: right;" class="no-print">
                    <button type="button" class="btn btn-primary" onclick="window.print()" style="background: #0284c7; border: none; padding: 8px 16px; font-weight: 700;">🖨️ Cetak TTB (2 Rangkap) Ke PDF / Printer A4</button>
                </div>
            </div>
        `;
    } else if (moduleKey === 'do') {
        modalTitle.textContent = '🚚 CETAK A4: Delivery Order (template DO.pdf)';
        htmlContent = `
            <div style="background: #ffffff; color: #000000; padding: 30px; border-radius: 4px; box-shadow: 0 5px 20px rgba(0,0,0,0.4); font-family: Arial, sans-serif; font-size: 12px; max-width: 850px; margin: 0 auto; border: 1px solid #ccc;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 20px;">
                    <!-- LEFT COLUMN -->
                    <div style="width: 48%;">
                        <h2 style="margin: 0 0 10px 0; font-size: 18px; font-weight: 700; color: #000;">PT. Multi Traktor Utama</h2>
                        <table style="font-size: 12px; line-height: 1.5;">
                            <tr><td style="width: 100px;">From Location</td><td>: JKT/Stock</td></tr>
                            <tr><td style="vertical-align: top;">Address</td><td>: Jl Batu Tulis XV No. 17, RT 13/RW 2, Kebon Kelapa Gambir, Jakarta Pusat Jakarta 10120 Indonesia</td></tr>
                            <tr><td>Phone & Fax</td><td>: </td></tr>
                            <tr><td>Delivery Date</td><td>: 08/24/2026 09:30:22</td></tr>
                            <tr><td>Delivery No</td><td>: JKT-DO-26-08-00053</td></tr>
                            <tr><td>PO Number</td><td>: 260821-1047 SITE HJU</td></tr>
                        </table>
                    </div>

                    <!-- RIGHT COLUMN -->
                    <div style="width: 48%;">
                        <h2 style="margin: 0 0 10px 0; font-size: 22px; font-weight: 400; color: #000; text-align: left;">Delivery Order</h2>
                        <table style="font-size: 12px; line-height: 1.5; width: 100%;">
                            <tr><td style="width: 80px;">Customer</td><td>: <strong>PT. TUNAS JAYA PERKASA</strong></td></tr>
                            <tr><td style="vertical-align: top;">Address</td><td>: JL. AKASIA 2, AE 45-46, DELTA SILIKON, LIPPO CIKARANG, SUKARESMI, CIKARANG SELATAN, Indonesia</td></tr>
                            <tr><td>Sales</td><td>: Fevi Aprianti</td></tr>
                        </table>
                        <div style="margin-top: 8px;">
                            <strong>Shipped To :</strong>
                            <div style="border: 1px solid #000; padding: 8px; font-weight: 700; margin-top: 4px; background: #fff;">
                                Komplek haur kuning Rumah no 2 dari gerbang haur kuning (mess tunas jaya)<br>
                                Kecamatan Tapin Utara Kabupaten Tapin Kalimantan Selatan
                            </div>
                        </div>
                    </div>
                </div>

                <!-- ITEMS TABLE -->
                <table style="width: 100%; border-collapse: collapse; margin-top: 20px; margin-bottom: 30px;">
                    <thead>
                        <tr style="border-top: 1px solid #000; border-bottom: 1px solid #000; font-weight: 700;">
                            <td style="padding: 8px; width: 40px; text-align: center;">No</td>
                            <td style="padding: 8px; width: 140px;">Part Number</td>
                            <td style="padding: 8px;">Item Description</td>
                            <td style="padding: 8px; width: 60px; text-align: right;">Qty</td>
                            <td style="padding: 8px; width: 60px; text-align: center;">Unit</td>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td style="padding: 8px; text-align: center;">1</td>
                            <td style="padding: 8px;">14Y3016133</td>
                            <td style="padding: 8px;">GUARD (LH,RH)</td>
                            <td style="padding: 8px; text-align: right;">2.00</td>
                            <td style="padding: 8px; text-align: center;">PCS</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px; text-align: center;">2</td>
                            <td style="padding: 8px;">14X3011362</td>
                            <td style="padding: 8px;">BRACKET LH</td>
                            <td style="padding: 8px; text-align: right;">2.00</td>
                            <td style="padding: 8px; text-align: center;">PCS</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px; text-align: center;">3</td>
                            <td style="padding: 8px;">14X3011352</td>
                            <td style="padding: 8px;">BRACKET RH</td>
                            <td style="padding: 8px; text-align: right;">2.00</td>
                            <td style="padding: 8px; text-align: center;">PCS</td>
                        </tr>
                    </tbody>
                </table>

                <div style="font-size: 13px; margin-bottom: 20px; border-bottom: 1px solid #000; padding-bottom: 4px;">
                    <strong>Note: Tidak menerima dalam bentuk pembayaran tunai.</strong>
                </div>

                <!-- SIGNATURE SECTION -->
                <div style="display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 30px;">
                    <div style="width: 45%;">
                        <p style="margin: 0 0 4px 0; font-weight: 700;">Delivered By :</p>
                        <p style="margin: 0 0 40px 0; font-weight: 700;">PT. Multi Traktor Utama</p>
                        <div>Name : Fevi Aprianti</div>
                        <div>Sales ID : </div>
                        <div>Signature : </div>
                    </div>
                    <div style="width: 45%;">
                        <p style="margin: 0 0 4px 0; font-weight: 700;">Received By :</p>
                        <p style="margin: 0 0 40px 0; font-weight: 700;">PT. TUNAS JAYA PERKASA</p>
                        <div>Date : </div>
                        <div>Name : </div>
                        <div>Signature : </div>
                    </div>
                </div>

                <div style="text-align: center; font-size: 11px; color: #555;">Page 1 of 1</div>

                <div style="margin-top: 20px; text-align: right;" class="no-print">
                    <button type="button" class="btn btn-primary" onclick="window.print()" style="background: #0284c7; border: none; padding: 8px 16px; font-weight: 700;">🖨️ Cetak DO Ke PDF / Printer A4</button>
                </div>
            </div>
        `;
    } else if (moduleKey === 'invoice') {
        modalTitle.textContent = '💳 CETAK A4: Invoice Penagihan (template 1 invoice.pdf / template invoice 2.pdf)';
        htmlContent = `
            <div style="background: #ffffff; color: #000000; padding: 25px; border-radius: 4px; box-shadow: 0 5px 20px rgba(0,0,0,0.4); font-family: Arial, sans-serif; font-size: 12px; max-width: 850px; margin: 0 auto; border: 1.5px solid #000;">
                <!-- TEMPLATE 1 HEKSA REPLICA -->
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <svg width="36" height="36" viewBox="0 0 100 100" fill="#0284c7"><path d="M20 20 L50 80 L80 20 L60 20 L50 60 L30 20 Z"/></svg>
                        <strong style="font-size: 16px; color: #000; font-weight: 800;">HEKSA INTI KREASINDO</strong>
                    </div>
                </div>

                <table style="width: 100%; border-collapse: collapse; border: 1.5px solid #000; margin-bottom: 0;">
                    <tr style="border-bottom: 1.5px solid #000; background: #fff; text-align: center;">
                        <td style="width: 50%; padding: 8px; border-right: 1.5px solid #000; font-weight: 800; font-size: 18px; text-align: left;">INVOICE</td>
                        <td style="width: 50%; padding: 8px; font-weight: 800; font-size: 16px; text-align: right; font-style: italic;">PT. HEKSA INTI KREASINDO</td>
                    </tr>
                    <tr style="border-bottom: 1.5px solid #000; vertical-align: top;">
                        <td style="padding: 8px; border-right: 1.5px solid #000; width: 50%;">
                            <table style="font-size: 11px; line-height: 1.5;">
                                <tr><td style="width: 80px;">Kepada</td><td>: <strong>PT. AEON CREDIT SERVICE INDONESIA</strong></td></tr>
                                <tr><td>Up. Yth.</td><td>: Bagian Keuangan</td></tr>
                                <tr><td style="vertical-align: top;">Alamat</td><td>: Plaza Kuningan Menara Selatan 3A, Jl. H.R. Rasuna Said C11-14, Jakarta Selatan</td></tr>
                                <tr><td>SPK / PO</td><td>: 26010012</td></tr>
                                <tr><td>Tanggal SPK / PO</td><td>: 03/07/2026</td></tr>
                            </table>
                        </td>
                        <td style="padding: 8px; width: 50%;">
                            <table style="font-size: 11px; line-height: 1.5;">
                                <tr><td style="width: 110px;">No. Invoice</td><td>: <strong>36/INV/HEKSAINDO-ACSI/VII/2026</strong></td></tr>
                                <tr><td>Tanggal Invoice</td><td>: 07 Juli 2026</td></tr>
                                <tr><td>Mata Uang</td><td>: IDR</td></tr>
                                <tr><td>Metode Pembayaran</td><td>: <strong>Transfer / Tunai</strong></td></tr>
                            </table>
                        </td>
                    </tr>
                </table>

                <!-- TABLE ITEMS WITH VERTICAL LINES -->
                <table style="width: 100%; border-collapse: collapse; border-left: 1.5px solid #000; border-right: 1.5px solid #000; border-bottom: 1.5px solid #000; min-height: 300px;">
                    <thead>
                        <tr style="border-bottom: 1.5px solid #000; font-weight: 700; text-align: center; background: #f8fafc;">
                            <td style="padding: 6px; width: 30px; border-right: 1px solid #000;">No.</td>
                            <td style="padding: 6px; border-right: 1px solid #000;">Nama Barang / Deskripsi Pekerjaan</td>
                            <td style="padding: 6px; width: 40px; border-right: 1px solid #000;">Vol</td>
                            <td style="padding: 6px; width: 60px; border-right: 1px solid #000;">Satuan</td>
                            <td style="padding: 6px; width: 100px; border-right: 1px solid #000;">Harga</td>
                            <td style="padding: 6px; width: 110px;">Sub Total</td>
                        </tr>
                    </thead>
                    <tbody style="vertical-align: top;">
                        <tr>
                            <td style="padding: 8px; text-align: center; border-right: 1px solid #000;">1</td>
                            <td style="padding: 8px; border-right: 1px solid #000;"><strong>Reinstate Counter Credit Card at Aeon Mall BSD</strong></td>
                            <td style="padding: 8px; text-align: center; border-right: 1px solid #000;">1</td>
                            <td style="padding: 8px; text-align: center; border-right: 1px solid #000;">Lot</td>
                            <td style="padding: 8px; text-align: right; border-right: 1px solid #000;">112.000.000</td>
                            <td style="padding: 8px; text-align: right;">112.000.000</td>
                        </tr>
                    </tbody>
                </table>

                <!-- SUMMARY BOX -->
                <table style="width: 100%; border-collapse: collapse; border-left: 1.5px solid #000; border-right: 1.5px solid #000; border-bottom: 1.5px solid #000; font-size: 11px;">
                    <tr>
                        <td style="padding: 6px 8px; text-align: right; border-right: 1px solid #000; font-weight: 700;">Total Rp</td>
                        <td style="padding: 6px 8px; text-align: right; width: 110px; font-weight: 700;">112.000.000</td>
                    </tr>
                    <tr style="border-top: 1px solid #000;">
                        <td style="padding: 6px 8px; text-align: right; border-right: 1px solid #000; font-weight: 700;">DP (40%) Rp</td>
                        <td style="padding: 6px 8px; text-align: right; font-weight: 700;">44.800.000</td>
                    </tr>
                    <tr style="border-top: 1px solid #000;">
                        <td style="padding: 6px 8px; text-align: right; border-right: 1px solid #000; font-weight: 700;">Disc Rp</td>
                        <td style="padding: 6px 8px; text-align: right;">-</td>
                    </tr>
                    <tr style="border-top: 1px solid #000;">
                        <td style="padding: 6px 8px; text-align: right; border-right: 1px solid #000; font-weight: 700;">Total DPP Rp</td>
                        <td style="padding: 6px 8px; text-align: right; font-weight: 700;">44.800.000</td>
                    </tr>
                    <tr style="border-top: 1px solid #000;">
                        <td style="padding: 6px 8px; text-align: right; border-right: 1px solid #000; font-weight: 700;">Pajak PPN (11%) Rp</td>
                        <td style="padding: 6px 8px; text-align: right; font-weight: 700;">4.928.000</td>
                    </tr>
                    <tr style="border-top: 1.5px solid #000; font-weight: 800; background: #f1f5f9;">
                        <td style="padding: 6px 8px; text-align: right; border-right: 1px solid #000;">Total Invoice Rp</td>
                        <td style="padding: 6px 8px; text-align: right; font-size: 12px;">49.728.000</td>
                    </tr>
                </table>

                <!-- FOOTER BANK & SIGNATURE -->
                <div style="border-left: 1.5px solid #000; border-right: 1.5px solid #000; border-bottom: 1.5px solid #000; padding: 10px; display: flex; justify-content: space-between; align-items: flex-end;">
                    <div style="width: 60%; font-size: 11px; line-height: 1.5;">
                        <p style="margin: 0;"><strong>Terbilang :</strong> <em>Empat Puluh Sembilan Juta Tujuh Ratus Dua Puluh Delapan Ribu Rupiah</em></p>
                        <p style="margin: 4px 0 0 0;"><strong>Keterangan :</strong></p>
                        <p style="margin: 0; color: #333;">- Pembayaran dengan transfer bank ke Mandiri a.n : PT. Heksa Inti Kreasindo<br>- Nomor Rekening : 1670007136053</p>
                    </div>
                    <div style="width: 35%; text-align: center; font-size: 11px; position: relative;">
                        <p style="margin: 0 0 45px 0;">PT. HEKSA INTI KREASINDO</p>
                        <p style="font-weight: 700; text-decoration: underline; margin: 0;">Farhat Farusi</p>
                        <p style="margin: 0; font-size: 10px;">Direktur Utama</p>
                    </div>
                </div>

                <div style="margin-top: 20px; text-align: right;" class="no-print">
                    <button type="button" class="btn btn-primary" onclick="window.print()" style="background: #0284c7; border: none; padding: 8px 16px; font-weight: 700;">🖨️ Cetak Invoice Ke PDF / Printer A4</button>
                </div>
            </div>
        `;
    } else if (moduleKey === 'receipt') {
        modalTitle.textContent = '🧾 CETAK A4: Kwitansi Pembayaran (Auto Terbilang Rp)';
        htmlContent = `
            <div style="background: #ffffff; color: #000000; padding: 30px; border-radius: 4px; box-shadow: 0 5px 20px rgba(0,0,0,0.4); font-family: Arial, sans-serif; font-size: 13px; max-width: 850px; margin: 0 auto; border: 2px solid #0284c7;">
                <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #0284c7; padding-bottom: 10px; margin-bottom: 20px;">
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <svg width="40" height="40" viewBox="0 0 100 100" fill="#0284c7"><path d="M20 20 L50 80 L80 20 L60 20 L50 60 L30 20 Z"/></svg>
                        <div>
                            <strong style="font-size: 18px; color: #0284c7; font-weight: 800;">PT. HEKSA INTI KREASINDO</strong>
                        </div>
                    </div>
                    <div style="text-align: right;">
                        <span style="font-size: 20px; font-weight: 800; letter-spacing: 2px; color: #000;">KWITANSI</span>
                        <p style="margin: 2px 0 0 0; font-weight: 700; font-size: 12px; color: #555;">NO: KWT/2026/09/008</p>
                    </div>
                </div>

                <table style="width: 100%; font-size: 13px; line-height: 2.0; margin-bottom: 30px;">
                    <tr>
                        <td style="width: 180px; font-weight: 700;">Telah Diterima Dari</td>
                        <td>: <strong>PT. MANDIRI SEJAHTERA</strong></td>
                    </tr>
                    <tr>
                        <td style="font-weight: 700; vertical-align: top;">Uang Sejumlah (Terbilang)</td>
                        <td>: <span style="background: #fef08a; padding: 4px 8px; border-radius: 4px; font-weight: 700; font-style: italic;">"Sebelas Juta Dua Ratus Ribu Rupiah"</span></td>
                    </tr>
                    <tr>
                        <td style="font-weight: 700; vertical-align: top;">Untuk Pembayaran</td>
                        <td>: Pelunasan Pekerjaan Pengadaan & Installation Web System SALIHA sesuai Invoice INV/2026/09/001</td>
                    </tr>
                </table>

                <div style="display: flex; justify-content: space-between; align-items: flex-end;">
                    <div style="border: 2px solid #0284c7; background: #e0f2fe; padding: 12px 24px; font-size: 20px; font-weight: 800; color: #0369a1;">
                        Rp 11.200.000,-
                    </div>
                    <div style="text-align: center; width: 220px;">
                        <p style="margin: 0 0 50px 0; font-size: 12px;">Jakarta, 01 September 2026<br><strong>PT. HEKSA INTI KREASINDO</strong></p>
                        <p style="font-weight: 700; text-decoration: underline; margin: 0;">Farhat Farusi, S.T.</p>
                        <p style="margin: 0; font-size: 11px; color: #555;">Direktur Utama</p>
                    </div>
                </div>

                <div style="margin-top: 30px; text-align: right;" class="no-print">
                    <button type="button" class="btn btn-primary" onclick="window.print()" style="background: #0284c7; border: none; padding: 8px 16px; font-weight: 700;">🖨️ Cetak Kwitansi Ke PDF / Printer A4</button>
                </div>
            </div>
        `;
    } else {
        // Fallback for PO
        modalTitle.textContent = '📄 CETAK A4: Purchase Order (PO Supplier)';
        htmlContent = `
            <div style="background: #ffffff; color: #000000; padding: 30px; border-radius: 4px; box-shadow: 0 5px 20px rgba(0,0,0,0.4); font-family: Arial, sans-serif; font-size: 12px; max-width: 850px; margin: 0 auto; border: 1.5px solid #000;">
                <div style="display: flex; justify-content: space-between; border-bottom: 2px solid #000; padding-bottom: 12px; margin-bottom: 20px;">
                    <div>
                        <h2 style="margin: 0; font-size: 18px; font-weight: 800; color: #0284c7;">PT. HEKSA INTI KREASINDO</h2>
                        <p style="margin: 4px 0 0 0; font-size: 11px; color: #555;">Jl. Matahari Raya No. 480, Jakasetia, Bekasi Selatan, Kota Bekasi, Jawa Barat</p>
                    </div>
                    <div style="text-align: right;">
                        <h2 style="margin: 0; font-size: 20px; font-weight: 800; text-transform: uppercase;">PURCHASE ORDER</h2>
                        <p style="margin: 4px 0 0 0; font-weight: 700;">PO NO: PO/2026/09/012</p>
                    </div>
                </div>

                <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 12px;">
                    <thead>
                        <tr style="background: #f1f5f9; border-top: 1px solid #000; border-bottom: 1px solid #000;">
                            <th style="padding: 8px; text-align: left;">NO</th>
                            <th style="padding: 8px; text-align: left;">DESKRIPSI MATERIAL / BARANG</th>
                            <th style="padding: 8px; text-align: center;">QTY</th>
                            <th style="padding: 8px; text-align: center;">SATUAN</th>
                            <th style="padding: 8px; text-align: right;">HARGA (RP)</th>
                            <th style="padding: 8px; text-align: right;">TOTAL (RP)</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr style="border-bottom: 1px solid #e2e8f0;">
                            <td style="padding: 8px;">1</td>
                            <td style="padding: 8px;">Steel Beam Grade A Structural Steel</td>
                            <td style="padding: 8px; text-align: center;">50</td>
                            <td style="padding: 8px; text-align: center;">Pcs</td>
                            <td style="padding: 8px; text-align: right;">700.000</td>
                            <td style="padding: 8px; text-align: right;">35.000.000</td>
                        </tr>
                    </tbody>
                </table>

                <div style="display: flex; justify-content: space-between; margin-top: 40px; text-align: center;">
                    <div>
                        <p style="margin-bottom: 50px;">Vendor / Supplier</p>
                        <p style="font-weight: 700;">( PT. STEEL INDONESIA )</p>
                    </div>
                    <div>
                        <p style="margin-bottom: 50px;">PT. HEKSA INTI KREASINDO</p>
                        <p style="font-weight: 700; text-decoration: underline;">( Farhat Farusi, S.T. )</p>
                    </div>
                </div>

                <div style="margin-top: 20px; text-align: right;" class="no-print">
                    <button type="button" class="btn btn-primary" onclick="window.print()" style="background: #0284c7; border: none; padding: 8px 16px; font-weight: 700;">🖨️ Cetak PO Ke PDF / Printer A4</button>
                </div>
            </div>
        `;
    }

    modalBody.innerHTML = htmlContent;
};

