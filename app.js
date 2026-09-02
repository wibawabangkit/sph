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

function getActiveCompanyId() {
    const userStr = localStorage.getItem('erp_user');
    if (userStr) {
        try {
            const u = JSON.parse(userStr);
            if (u) {
                if (u.role === 'SUPER_ADMIN') {
                    const savedCompId = localStorage.getItem('superadmin_active_company_id');
                    return savedCompId ? Number(savedCompId) : 1;
                }
                return u.company_id || 1;
            }
        } catch(e) {}
    }
    return 1;
}

function getStorageKey() {
    const companyId = getActiveCompanyId();
    return `heksa_quotation_state_company_${companyId}`;
}

window.switchSuperAdminCompanyContext = function(companyId) {
    localStorage.setItem('superadmin_active_company_id', companyId);
    loadState();
    if (typeof renderAll === 'function') renderAll();
    const compName = companyId == 2 ? 'PT WITACA BANGKIT UTAMA' : 'PT. HEKSA UTAMA';
    alert(`🌐 [SUPER ADMIN] Context Perusahaan dialihkan ke: ${compName} (ID: ${companyId})`);
};

// Load state from LocalStorage or fallback to Default Template
function loadState() {
    const storageKey = getStorageKey();
    const saved = localStorage.getItem(storageKey);
    let userCompany = null;
    let userStr = localStorage.getItem('erp_user');
    if (userStr) {
        try { userCompany = JSON.parse(userStr); } catch(e) {}
    }
    const activeCompanyId = getActiveCompanyId();

    if (saved) {
        try {
            appState = JSON.parse(saved);
        } catch (e) {
            console.error("Failed to parse saved state, resetting...", e);
            appState = JSON.parse(JSON.stringify(DEFAULT_DATA));
        }
    } else {
        appState = JSON.parse(JSON.stringify(DEFAULT_DATA)); // Deep clone
        const targetCompId = (userCompany && userCompany.role === 'SUPER_ADMIN') ? activeCompanyId : (userCompany ? userCompany.company_id : 1);
        const compName = targetCompId === 2 ? 'PT WITACA BANGKIT UTAMA' : 'PT. HEKSA UTAMA';
        const prefix = targetCompId === 2 ? 'WITACA' : 'HEKSA';
        
        appState.companyName = compName;
        appState.footerCompanyName = compName;
        appState.noSurat = `01/SPH-${prefix}/${new Date().getFullYear()}`;
    }

    // Dynamic Tenant Enforcement if empty or default mismatched
    if (userCompany && userCompany.company_name && !saved) {
        appState.companyName = userCompany.company_name;
        appState.footerCompanyName = userCompany.company_name;
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
    const storageKey = getStorageKey();
    localStorage.setItem(storageKey, JSON.stringify(appState));
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

    // Print PDF Action & Auto Save to Riwayat SPH
    document.getElementById('btn-print').addEventListener('click', () => {
        try {
            const sphNo = document.getElementById('input-nomor-sph') ? document.getElementById('input-nomor-sph').value : '01/SPH/2026';
            const custName = document.getElementById('input-klien-nama') ? document.getElementById('input-klien-nama').value : 'Customer';
            const dateVal = document.getElementById('input-tanggal') ? document.getElementById('input-tanggal').value : new Date().toISOString().split('T')[0];
            
            let totalVal = 0;
            if (appState && appState.data && appState.data.items) {
                appState.data.items.forEach(i => {
                    totalVal += (Number(i.qty) || 0) * (Number(i.hargaSatuan) || 0);
                });
            }
            
            const newSph = {
                id: Date.now(),
                quotation_no: sphNo,
                date: dateVal,
                customer_name: custName,
                total_amount: totalVal,
                items_count: (appState && appState.data && appState.data.items) ? appState.data.items.length : 1,
                status: 'Draft'
            };

            fetch('/api/quotations', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + (localStorage.getItem('erp_token') || '')
                },
                body: JSON.stringify({
                    sph_no: sphNo,
                    sph_date: dateVal,
                    customer_name: custName,
                    customer_address: document.getElementById('input-klien-alamat')?.value || '',
                    project_title: document.getElementById('input-perihal')?.value || 'Penawaran Harga',
                    subtotal: totalVal,
                    grand_total: totalVal,
                    items_data: appState
                })
            }).catch(() => {});
            
            if (!window.moduleStore) window.moduleStore = {};
            if (!window.moduleStore.quotation_history) window.moduleStore.quotation_history = getMockModuleData('quotation_history') || [];
            
            const existingIdx = window.moduleStore.quotation_history.findIndex(x => x.quotation_no === sphNo);
            if (existingIdx >= 0) {
                window.moduleStore.quotation_history[existingIdx] = newSph;
            } else {
                window.moduleStore.quotation_history.unshift(newSph);
            }
        } catch(e) {}

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

    let currentUserRole = 'COMPANY_ADMIN';
    try {
        const userObj = JSON.parse(localStorage.getItem('erp_user') || '{}');
        if (userObj && userObj.role) currentUserRole = userObj.role;
    } catch(e) {}

    if (moduleKey === 'users' && currentUserRole !== 'SUPER_ADMIN') {
        workspaceView.innerHTML = `
            <div style="background: #0f172a; border-radius: 16px; border: 1px solid #334155; padding: 48px 24px; text-align: center; color: #fff; max-width: 600px; margin: 40px auto; box-shadow: 0 20px 40px rgba(0,0,0,0.5);">
                <div style="font-size: 56px; margin-bottom: 16px;">🔒</div>
                <h2 style="font-size: 22px; font-weight: 800; color: #f87171; margin-bottom: 12px; tracking: -0.5px;">AKSES DITOLAK (403 FORBIDDEN)</h2>
                <p style="color: #94a3b8; margin: 0 auto 24px auto; font-size: 14px; line-height: 1.6;">
                    Modul <strong>User Mgmt (Super Admin)</strong> dan fitur Tata Kelola Akun Perusahaan hanya dapat diakses oleh akun dengan Role <strong>SUPER_ADMIN</strong>.
                </p>
                <div style="background: #1e293b; border-radius: 8px; padding: 12px 16px; display: inline-block; font-size: 13px; color: #cbd5e1;">
                    Role Anda saat ini: <strong style="color: #38bdf8;">${currentUserRole}</strong>
                </div>
            </div>
        `;
        return;
    }
    let userCompany = '';
    try {
        const userObj = JSON.parse(localStorage.getItem('erp_user') || '{}');
        if (userObj && userObj.company_name && userObj.company_name !== 'System Global') {
            userCompany = userObj.company_name;
        }
    } catch(e) {}

    const activeCompany = userCompany || (window.currentUser && window.currentUser.company_name && window.currentUser.company_name !== 'System Global' ? window.currentUser.company_name : ((appState && appState.impersonateTargetName) ? appState.impersonateTargetName : ''));

    const companyTag = activeCompany ? ` &bull; <span style="color:#38bdf8; font-weight:700;">${activeCompany.toUpperCase()}</span>` : '';

    workspaceView.innerHTML = `
        <div style="background: var(--bg-card); border-radius: 12px; border: 1px solid var(--border-color); padding: 24px; box-shadow: 0 10px 30px rgba(0,0,0,0.3);">
            <!-- BREADCRUMB & HEADER -->
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border-color); padding-bottom: 16px; margin-bottom: 24px; flex-wrap: wrap; gap: 12px;">
                <div>
                    <div style="font-size: 12px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">
                        Enterprise ERP Platform${companyTag}
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
            // Fallback store
            data = (window.moduleStore && window.moduleStore[moduleKey]) || getMockModuleData(moduleKey);
        }

        if (!data) {
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
            { id: 1, username: 'superadmin', full_name: 'System Super Admin', email: 'admin@system.local', role: 'SUPER_ADMIN', company_name: 'System Global', status: 'active' },
            { id: 2, username: 'admin_demo', full_name: 'Admin Perusahaan Demo', email: 'admin@company.local', role: 'COMPANY_ADMIN', company_name: 'PT. PERUSAHAAN DEMO', status: 'active' }
        ];
    }
    return [];
}

function getAvailableCompaniesList(userData) {
    const set = new Set();
    const usersList = (userData && userData.length > 0) ? userData : ((window.moduleStore && window.moduleStore.users) || getMockModuleData('users') || []);
    usersList.forEach(u => {
        if (u.company_name && u.company_name !== 'System Global') {
            set.add(u.company_name);
        }
    });
    if (set.size === 0) set.add('PT. PERUSAHAAN DEMO');
    return Array.from(set).sort();
}

function renderModuleUI(moduleKey, data, container) {
    let html = '';
    
    if (moduleKey === 'users') {
        if (!window.moduleStore) window.moduleStore = {};
        if (!window.moduleStore.users || window.moduleStore.users.length === 0) {
            window.moduleStore.users = data;
        }
        const userListData = window.moduleStore.users;

        const availableCompanies = getAvailableCompaniesList(userListData);
        const companyOptions = availableCompanies.map(c => `<option value="${c}">${c}</option>`).join('');

        html += '<div style="background: rgba(239, 68, 68, 0.08); border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 12px; padding: 18px; margin-bottom: 24px;">' +
            '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 12px;">' +
            '<h4 style="margin:0; color:#ef4444; font-size: 15px; font-weight: 800;">👑 SUPER ADMIN GOVERNANCE & PURGE DATA PERUSAHAAN</h4>' +
            '<span style="background:#ef4444; color:#fff; font-size:10px; font-weight:800; padding:2px 8px; border-radius:4px; text-transform:uppercase;">Hak Akses Tertinggi</span>' +
            '</div>' +
            '<p style="margin:0 0 14px 0; font-size: 12.5px; color: #cbd5e1; line-height: 1.5;">Sebagai Super Admin, Anda berhak menghapus <strong>seluruh data dalam perusahaan terpilih</strong> (Master Customer, Vendor, SPH, DO, Invoice, BAST, Kwitansi) atau mengelola akun pengguna per perusahaan.</p>' +
            '<div style="display:flex; gap: 12px; flex-wrap: wrap; align-items: center; background: #0f172a; padding: 12px; border-radius: 8px; border: 1px solid #334155;">' +
            '<label style="color:#94a3b8; font-size:12px; font-weight:700;">Pilih Perusahaan Target Purge:</label>' +
            '<select id="superadmin-purge-company" class="form-control" style="background:#1e293b; color:#fff; border:1px solid #475569; padding:6px 12px; border-radius:6px; font-size:13px; max-width:280px;">' +
            companyOptions +
            '</select>' +
            '<button type="button" class="btn" style="background:#ef4444; color:#fff; font-weight:700; border:none; padding:8px 16px; border-radius:6px; font-size:12.5px; cursor:pointer;" onclick="window.purgeCompanyData()">🗑️ Purge Semua Data Perusahaan</button>' +
            '</div>' +
            '</div>';

        html += '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 20px; flex-wrap:wrap; gap: 14px;">' +
            '<p style="margin:0; font-size: 13px; color: #94a3b8; flex:1; min-width: 220px;">Kelola akun pengguna per perusahaan, tambah user baru & atur impersonasi Super Admin.</p>' +
            '<button class="btn btn-primary" style="width:auto; flex-shrink:0; white-space:nowrap; padding: 8px 16px; font-weight:700; background:#0284c7; border:none; border-radius:6px;" onclick="openUserCreateModal()">+ Buat User Baru</button>' +
            '</div>';
        
        html += '<table class="erp-data-table">' +
            '<thead><tr><th>ID</th><th>Username</th><th>Nama Lengkap</th><th>Email</th><th>Role</th><th>Perusahaan</th><th>Status</th><th>Aksi Kelola Akun</th></tr></thead>' +
            '<tbody>';
        userListData.forEach(item => {
            const isSuper = item.role === 'SUPER_ADMIN';
            const isInactive = item.status === 'inactive';
            html += '<tr>' +
                '<td>' + item.id + '</td>' +
                '<td><strong>' + item.username + '</strong></td>' +
                '<td>' + item.full_name + '</td>' +
                '<td>' + (item.email || '-') + '</td>' +
                '<td><span style="background:rgba(59,130,246,0.2); color:#60a5fa; padding:2px 6px; border-radius:4px; font-size:11px;">' + item.role + '</span></td>' +
                '<td>' + (item.company_name || '-') + '</td>' +
                '<td><span style="color:' + (isInactive ? '#f87171' : '#34d399') + ';">' + (item.status || 'active') + '</span></td>' +
                '<td style="white-space:nowrap;">' +
                (!isSuper ? '<button class="btn-action-sm" onclick="triggerImpersonate(' + item.id + ', \'' + item.full_name.replace(/'/g, "\\'") + '\', \'' + (item.company_name || '').replace(/'/g, "\\'") + '\')">🔑 Impersonate</button> ' : '<span style="font-size:11px; color:#64748b;">(Super Admin)</span> ') +
                '<button class="btn-action-sm" style="border-color:#38bdf8; color:#38bdf8;" onclick="openUserEditModal(' + item.id + ')">✏️ Edit / Pass</button> ' +
                '<button class="btn-action-sm" style="border-color:#eab308; color:#eab308;" onclick="toggleUserStatus(' + item.id + ', \'' + (item.status || 'active') + '\')">🔄 Status</button> ' +
                (!isSuper ? '<button class="btn-action-sm" style="border-color:#ef4444; color:#ef4444;" onclick="deleteUserSuperAdmin(' + item.id + ', \'' + item.username.replace(/'/g, "\\'") + '\')">🗑️ Hapus</button>' : '') +
                '</td>' +
                '</tr>';
        });
        html += '</tbody></table>';
    } else if (moduleKey === 'po') {
        html += '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 20px; flex-wrap:wrap; gap: 14px;">' +
            '<p style="margin:0; font-size: 13px; color: #94a3b8; flex:1; min-width: 220px;">Manajemen Purchase Order (PO) ke Pemasok / Vendor.</p>' +
            '<button class="btn btn-primary" style="width:auto; flex-shrink:0; white-space:nowrap; padding: 8px 16px; font-weight:700; background:#0284c7; border:none; border-radius:6px;" onclick="openPOCreateModal()">+ Buat PO Baru</button>' +
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
                '<td>' +
                '<button class="btn-action-sm" onclick="openPrintPreviewModal(\'po\', ' + item.id + ')">🖨️ Cetak PO</button> ' +
                '<button class="btn-action-sm" style="border-color:#ef4444; color:#ef4444;" onclick="deleteTransactionSuperAdmin(\'po\', ' + item.id + ', \'' + item.po_no + '\')">🗑️ Hapus</button>' +
                '</td>' +
                '</tr>';
        });
        html += '</tbody></table>';
    } else if (moduleKey === 'do') {
        if (!window.moduleStore) window.moduleStore = {};
        if (!window.moduleStore.do || window.moduleStore.do.length === 0) {
            window.moduleStore.do = data;
        }
        const listData = window.moduleStore.do;

        html += '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 20px; flex-wrap:wrap; gap: 14px;">' +
            '<p style="margin:0; font-size: 13px; color: #94a3b8; flex:1; min-width: 220px;">Delivery Order (DO) / Surat Jalan Logistik pengiriman barang.</p>' +
            '<button class="btn btn-primary" style="width:auto; flex-shrink:0; white-space:nowrap; padding: 8px 16px; font-weight:700; background:#0284c7; border:none; border-radius:6px;" onclick="openDOCreateModal()">+ Buat DO Baru</button>' +
            '</div>';
        
        html += '<table class="erp-data-table">' +
            '<thead><tr><th>No. DO</th><th>Tanggal</th><th>Customer</th><th>Driver</th><th>Vehicle No</th><th>Status Pengiriman</th><th>Aksi</th></tr></thead>' +
            '<tbody>';
        listData.forEach(item => {
            html += '<tr>' +
                '<td><strong>' + item.do_no + '</strong></td>' +
                '<td>' + item.do_date + '</td>' +
                '<td>' + item.customer_name + '</td>' +
                '<td>' + (item.driver_name || '-') + '</td>' +
                '<td>' + (item.vehicle_no || '-') + '</td>' +
                '<td>' + getDOStatusBadgeHTML(item.id, item.status) + '</td>' +
                '<td>' +
                '<button class="btn-action-sm" onclick="openPrintPreviewModal(\'do\', ' + item.id + ')">🖨️ Cetak DO</button> ' +
                '<button class="btn-action-sm" style="border-color:#ef4444; color:#ef4444;" onclick="deleteTransactionSuperAdmin(\'do\', ' + item.id + ', \'' + item.do_no + '\')">🗑️ Hapus</button>' +
                '</td>' +
                '</tr>';
        });
        html += '</tbody></table>';
    } else if (moduleKey === 'ttb') {
        html += '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 20px; flex-wrap:wrap; gap: 14px;">' +
            '<p style="margin:0; font-size: 13px; color: #94a3b8; flex:1; min-width: 220px;">Berita Acara & Pencatatan Penerimaan Fisik Barang (TTB).</p>' +
            '<button class="btn btn-primary" style="width:auto; flex-shrink:0; white-space:nowrap; padding: 8px 16px; font-weight:700; background:#0284c7; border:none; border-radius:6px;" onclick="openTTBCreateModal()">+ Buat TTB Baru</button>' +
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
                '<td>' +
                '<button class="btn-action-sm" onclick="openPrintPreviewModal(\'ttb\', ' + item.id + ')">🖨️ Cetak TTB</button> ' +
                '<button class="btn-action-sm" style="border-color:#ef4444; color:#ef4444;" onclick="deleteTransactionSuperAdmin(\'ttb\', ' + item.id + ', \'' + item.ttb_no + '\')">🗑️ Hapus</button>' +
                '</td>' +
                '</tr>';
        });
        html += '</tbody></table>';
    } else if (moduleKey === 'bast') {
        html += '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 20px; flex-wrap:wrap; gap: 14px;">' +
            '<p style="margin:0; font-size: 13px; color: #94a3b8; flex:1; min-width: 220px;">Berita Acara Serah Terima Pekerjaan 100% (BAST).</p>' +
            '<button class="btn btn-primary" style="width:auto; flex-shrink:0; white-space:nowrap; padding: 8px 16px; font-weight:700; background:#0284c7; border:none; border-radius:6px;" onclick="openBASTCreateModal()">+ Buat BAST Baru</button>' +
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
                '<td>' +
                '<button class="btn-action-sm" onclick="openPrintPreviewModal(\'bast\', ' + item.id + ')">🖨️ Cetak BAST</button> ' +
                '<button class="btn-action-sm" style="border-color:#ef4444; color:#ef4444;" onclick="deleteTransactionSuperAdmin(\'bast\', ' + item.id + ', \'' + item.bast_no + '\')">🗑️ Hapus</button>' +
                '</td>' +
                '</tr>';
        });
        html += '</tbody></table>';
    } else if (moduleKey === 'invoice') {
        html += '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 20px; flex-wrap:wrap; gap: 14px;">' +
            '<p style="margin:0; font-size: 13px; color: #94a3b8; flex:1; min-width: 220px;">Faktur Penagihan Resmi & PPN Dinamis.</p>' +
            '<button class="btn btn-primary" style="width:auto; flex-shrink:0; white-space:nowrap; padding: 8px 16px; font-weight:700; background:#0284c7; border:none; border-radius:6px;" onclick="openInvoiceCreateModal()">+ Buat Invoice Penagihan</button>' +
            '</div>';
        
        html += '<table class="erp-data-table">' +
            '<thead><tr><th>No. Invoice</th><th>Tanggal</th><th>Customer</th><th>Subtotal</th><th>PPN (%)</th><th>Total Tagihan</th><th>Status</th><th>Aksi</th></tr></thead>' +
            '<tbody>';
        data.forEach(item => {
            html += '<tr>' +
                '<td><strong>' + item.invoice_no + '</strong></td>' +
                '<td>' + item.invoice_date + '</td>' +
                '<td>' + item.customer_name + '</td>' +
                '<td>Rp ' + Number(item.subtotal).toLocaleString('id-ID') + '</td>' +
                '<td><strong style="color:#38bdf8;">' + (item.tax_rate_percent || 11) + '%</strong></td>' +
                '<td><strong>Rp ' + Number(item.grand_total).toLocaleString('id-ID') + '</strong></td>' +
                '<td><span style="background:rgba(239,68,68,0.2); color:#f87171; padding:2px 6px; border-radius:4px; font-size:11px;">' + item.status + '</span></td>' +
                '<td>' +
                '<button class="btn-action-sm" onclick="openPrintPreviewModal(\'invoice\', ' + item.id + ')">🖨️ Cetak Invoice</button> ' +
                '<button class="btn-action-sm" style="border-color:#ef4444; color:#ef4444;" onclick="deleteTransactionSuperAdmin(\'invoice\', ' + item.id + ', \'' + item.invoice_no + '\')">🗑️ Hapus</button>' +
                '</td>' +
                '</tr>';
        });
        html += '</tbody></table>';
    } else if (moduleKey === 'receipt') {
        html += '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 20px; flex-wrap:wrap; gap: 14px;">' +
            '<p style="margin:0; font-size: 13px; color: #94a3b8; flex:1; min-width: 220px;">Bukti Pelunasan Pembayaran (Auto Terbilang Kalimat Bahasa Indonesia).</p>' +
            '<button class="btn btn-primary" style="width:auto; flex-shrink:0; white-space:nowrap; padding: 8px 16px; font-weight:700; background:#0284c7; border:none; border-radius:6px;" onclick="openReceiptCreateModal()">+ Buat Kwitansi Baru</button>' +
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
                '<td>' +
                '<button class="btn-action-sm" onclick="openPrintPreviewModal(\'receipt\', ' + item.id + ')">🖨️ Cetak Kwitansi</button> ' +
                '<button class="btn-action-sm" style="border-color:#ef4444; color:#ef4444;" onclick="deleteTransactionSuperAdmin(\'receipt\', ' + item.id + ', \'' + item.receipt_no + '\')">🗑️ Hapus</button>' +
                '</td>' +
                '</tr>';
        });
        html += '</tbody></table>';
    } else if (moduleKey === 'quotation_history') {
        html += '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 20px; flex-wrap:wrap; gap: 14px;">' +
            '<p style="margin:0; font-size: 13px; color: #94a3b8; flex:1; min-width: 220px;">📜 Riwayat Dokumen SPH Penawaran Harga yang Pernah Dibuat.</p>' +
            '<button class="btn btn-primary" style="width:auto; flex-shrink:0; white-space:nowrap; padding: 8px 16px; font-weight:700; background:#0284c7; border:none; border-radius:6px;" onclick="switchToQuotationGenerator()">+ Buat SPH Baru</button>' +
            '</div>';
        
        html += '<table class="erp-data-table">' +
            '<thead><tr><th>No. SPH</th><th>Tanggal</th><th>Customer / Klien</th><th>Item Barang</th><th>Total Nilai SPH</th><th>Status</th><th>Aksi</th></tr></thead>' +
            '<tbody>';
        data.forEach(item => {
            html += '<tr>' +
                '<td><strong>' + item.quotation_no + '</strong></td>' +
                '<td>' + item.date + '</td>' +
                '<td>' + item.customer_name + '</td>' +
                '<td>' + (item.items_count || 1) + ' Barang</td>' +
                '<td><strong>Rp ' + Number(item.total_amount || 0).toLocaleString('id-ID') + '</strong></td>' +
                '<td><span style="background:rgba(56,189,248,0.2); color:#38bdf8; padding:2px 6px; border-radius:4px; font-size:11px;">' + (item.status || 'Aktif') + '</span></td>' +
                '<td>' +
                '<button class="btn-action-sm" onclick="switchToQuotationGenerator()">📝 Edit SPH</button> ' +
                '<button class="btn-action-sm" style="border-color:#ef4444; color:#ef4444;" onclick="deleteTransactionSuperAdmin(\'quotation_history\', ' + item.id + ', \'' + item.quotation_no + '\')">🗑️ Hapus</button>' +
                '</td>' +
                '</tr>';
        });
        html += '</tbody></table>';
    } else if (moduleKey === 'customers') {
        if (!window.moduleStore) window.moduleStore = {};
        window.moduleStore.customers = data || [];
        
        html += '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 16px;">' +
            '<p style="margin:0; font-size: 13px; color: #94a3b8;">🏢 Master Data Pelanggan / Customer Perusahaan.</p>' +
            '<button class="btn btn-primary" onclick="openCustomerCreateModal()">+ Tambah Customer Baru</button>' +
            '</div>';
        
        html += '<table class="erp-data-table">' +
            '<thead><tr><th>Kode</th><th>Nama Customer / Klien</th><th>Kontak / PIC</th><th>Alamat Lengkap</th><th>Aksi</th></tr></thead>' +
            '<tbody>';
        (data || []).forEach(item => {
            const name = item.company_name || item.name || '-';
            const pic = item.contact_person || item.pic || '-';
            const phone = item.phone || '';
            const address = item.address || '-';
            const code = item.code || 'CUST-' + item.id;
            html += '<tr>' +
                '<td><strong>' + code + '</strong></td>' +
                '<td>' + name + '</td>' +
                '<td>' + pic + (phone ? ' (' + phone + ')' : '') + '</td>' +
                '<td>' + address + '</td>' +
                '<td>' +
                '<button class="btn-action-sm" onclick="openCustomerEditModal(' + item.id + ')">✏️ Edit</button> ' +
                '<button class="btn-action-sm" style="border-color:#ef4444; color:#ef4444;" onclick="deleteTransactionSuperAdmin(\'customers\', ' + item.id + ', \'' + name.replace(/'/g, "\\'") + '\')">🗑️ Hapus</button>' +
                '</td>' +
                '</tr>';
        });
        html += '</tbody></table>';
    } else if (moduleKey === 'vendors') {
        if (!window.moduleStore) window.moduleStore = {};
        window.moduleStore.vendors = data || [];

        html += '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 16px;">' +
            '<p style="margin:0; font-size: 13px; color: #94a3b8;">🏭 Master Data Vendor / Pemasok Material & Barang.</p>' +
            '<button class="btn btn-primary" onclick="openVendorCreateModal()">+ Tambah Vendor Baru</button>' +
            '</div>';
        
        html += '<table class="erp-data-table">' +
            '<thead><tr><th>Kode</th><th>Nama Vendor / Supplier</th><th>Kontak / PIC</th><th>Alamat Lengkap</th><th>Aksi</th></tr></thead>' +
            '<tbody>';
        (data || []).forEach(item => {
            const name = item.vendor_name || item.name || '-';
            const pic = item.contact_person || item.pic || '-';
            const phone = item.phone || '';
            const address = item.address || '-';
            const code = item.code || 'VND-' + item.id;
            html += '<tr>' +
                '<td><strong>' + code + '</strong></td>' +
                '<td>' + name + '</td>' +
                '<td>' + pic + (phone ? ' (' + phone + ')' : '') + '</td>' +
                '<td>' + address + '</td>' +
                '<td>' +
                '<button class="btn-action-sm" onclick="openVendorEditModal(' + item.id + ')">✏️ Edit</button> ' +
                '<button class="btn-action-sm" style="border-color:#ef4444; color:#ef4444;" onclick="deleteTransactionSuperAdmin(\'vendors\', ' + item.id + ', \'' + name.replace(/'/g, "\\'") + '\')">🗑️ Hapus</button>' +
                '</td>' +
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

window.checkAuthGatekeeper = function() {
    const loginModal = document.getElementById('login-modal');
    const appContainer = document.querySelector('.app-container');
    const storedUserStr = localStorage.getItem('erp_user');
    const storedToken = localStorage.getItem('erp_token');
    
    let user = null;
    if (storedUserStr && storedToken) {
        try {
            user = JSON.parse(storedUserStr);
        } catch (e) {
            user = null;
        }
    }

    if (user && user.username) {
        // Authenticated State -> Unlock Application Access
        if (loginModal) loginModal.style.display = 'none';
        if (appContainer) {
            appContainer.style.filter = 'none';
            appContainer.style.pointerEvents = 'auto';
            appContainer.style.opacity = '1';
            appContainer.style.userSelect = 'auto';
        }
        updateNavUserBadge(user);

        // Re-sync SPH Generator draft state per logged user company
        if (typeof loadState === 'function' && typeof renderAll === 'function') {
            loadState();
            renderAll();
        }

        // Security Auto-Redirect: Non-SuperAdmin users cannot view User Mgmt workspace
        if (user.role !== 'SUPER_ADMIN') {
            const workspaceView = document.getElementById('module-workspace-view');
            if (workspaceView && workspaceView.style.display !== 'none' && workspaceView.innerHTML.includes('User Mgmt')) {
                window.renderFullPageModuleWorkspace('quotation', '1. 📝 SPH Penawaran');
            }
        }
    } else {
        // Unauthenticated State -> Lock Entire Application & Force Login Modal
        if (loginModal) loginModal.style.display = 'flex';
        const loginUsernameInput = document.getElementById('login-username');
        const loginPasswordInput = document.getElementById('login-password');
        if (loginUsernameInput) loginUsernameInput.value = '';
        if (loginPasswordInput) loginPasswordInput.value = '';
        const formLogin = document.getElementById('form-login');
        if (formLogin) formLogin.reset();

        if (appContainer) {
            appContainer.style.filter = 'blur(12px)';
            appContainer.style.pointerEvents = 'none';
            appContainer.style.opacity = '0.3';
            appContainer.style.userSelect = 'none';
        }
        updateNavUserBadge(null);
    }
};

window.openLoginModal = function() {
    const loginModal = document.getElementById('login-modal');
    if (loginModal) loginModal.style.display = 'flex';
    window.checkAuthGatekeeper();
};

window.handleLoginSubmit = async function(e) {
    if (e && e.preventDefault) e.preventDefault();
    const username = document.getElementById('login-username')?.value?.trim();
    const password = document.getElementById('login-password')?.value;
    const btnSubmit = document.getElementById('btn-submit-login') || document.getElementById('btn-login-submit');

    if (!username || !password) {
        alert('Harap masukkan Username dan Password!');
        return;
    }

    if (btnSubmit) {
        btnSubmit.disabled = true;
        btnSubmit.innerHTML = '⏳ Memverifikasi Akun...';
    }

    try {
        const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        const data = await res.json();

        if (data.success) {
            window.moduleStore = {}; // Reset in-memory store for new session
            localStorage.setItem('erp_token', data.token);
            localStorage.setItem('erp_user', JSON.stringify(data.user));
            window.checkAuthGatekeeper();
            if (data.user.role === 'SUPER_ADMIN') {
                window.renderFullPageModuleWorkspace('users', '👑 User Mgmt (Super Admin)');
            } else {
                window.renderFullPageModuleWorkspace('quotation', '1. 📝 SPH Penawaran');
            }
            alert(`🎉 Login Berhasil!\nSelamat Datang, ${data.user.full_name} (${data.user.role})`);
        } else {
            alert('❌ Gagal Login: ' + (data.message || 'Username/Password salah'));
        }
    } catch (err) {
        alert('❌ Gagal terhubung ke Server MySQL: ' + err.message);
    } finally {
        if (btnSubmit) {
            btnSubmit.disabled = false;
            btnSubmit.innerHTML = '🔐 Masuk Ke System ERP';
        }
    }
};

window.logoutUser = function() {
    if (confirm('Apakah Anda yakin ingin logout / keluar dari akun?')) {
        localStorage.removeItem('erp_token');
        localStorage.removeItem('erp_user');
        window.moduleStore = {}; // Reset client-side memory store

        // Clear login input fields completely
        const loginUsernameInput = document.getElementById('login-username');
        const loginPasswordInput = document.getElementById('login-password');
        if (loginUsernameInput) loginUsernameInput.value = '';
        if (loginPasswordInput) loginPasswordInput.value = '';
        const formLogin = document.getElementById('form-login');
        if (formLogin) formLogin.reset();

        const workspaceView = document.getElementById('module-workspace-view');
        if (workspaceView) {
            workspaceView.style.display = 'none';
            workspaceView.innerHTML = '';
        }
        const appContainer = document.querySelector('.app-container');
        if (appContainer) appContainer.style.display = 'flex';
        window.checkAuthGatekeeper();
        alert('Anda telah logout dari aplikasi. Akses sistem terkunci kembali.');
    }
};

function updateNavUserBadge(user) {
    const btn = document.getElementById('btn-nav-login');
    const superAdminBtn = document.querySelector('.nav-module-btn[data-module="users"]');
    const saWidgetContainer = document.getElementById('superadmin-tenant-widget');

    if (superAdminBtn) {
        if (user && user.role === 'SUPER_ADMIN') {
            superAdminBtn.style.display = 'inline-block';
        } else {
            superAdminBtn.style.display = 'none';
        }
    }

    if (saWidgetContainer) {
        if (user && user.role === 'SUPER_ADMIN') {
            const activeCompId = typeof getActiveCompanyId === 'function' ? getActiveCompanyId() : 1;
            saWidgetContainer.style.display = 'inline-flex';
            saWidgetContainer.innerHTML = `
                <div style="display: inline-flex; align-items: center; gap: 8px; background: rgba(15, 23, 42, 0.85); border: 1px solid rgba(245, 158, 11, 0.4); border-radius: 8px; padding: 4px 10px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);">
                    <span style="font-size: 11px; font-weight: 800; color: #f59e0b; text-transform: uppercase; letter-spacing: 0.5px; display: flex; align-items: center; gap: 4px;">
                        <span style="font-size: 13px;">🏢</span> Context Tenant:
                    </span>
                    <select onchange="switchSuperAdminCompanyContext(this.value)" style="background: #1e293b; color: #fef08a; border: 1px solid #475569; border-radius: 6px; padding: 4px 10px; font-size: 12px; font-weight: 700; outline: none; cursor: pointer; transition: all 0.2s ease;">
                        <option value="1" ${activeCompId == 1 ? 'selected' : ''}>PT. HEKSA UTAMA (ID 1)</option>
                        <option value="2" ${activeCompId == 2 ? 'selected' : ''}>PT WITACA BANGKIT UTAMA (ID 2)</option>
                    </select>
                </div>
            `;
        } else {
            saWidgetContainer.style.display = 'none';
            saWidgetContainer.innerHTML = '';
        }
    }

    if (!btn) return;
    
    if (user && user.username) {
        btn.style.background = 'rgba(16, 185, 129, 0.2)';
        btn.style.color = '#34d399';
        btn.style.borderColor = 'rgba(16, 185, 129, 0.4)';
        btn.style.marginLeft = (saWidgetContainer && user.role === 'SUPER_ADMIN') ? '0' : 'auto';
        btn.innerHTML = `👤 ${user.username} (${user.role}) <span onclick="event.stopPropagation(); logoutUser();" style="margin-left: 6px; text-decoration: underline; color: #f87171;" title="Logout">Logout</span>`;
    } else {
        btn.style.background = 'rgba(14, 165, 233, 0.2)';
        btn.style.color = '#38bdf8';
        btn.style.borderColor = 'rgba(56, 189, 248, 0.4)';
        btn.style.marginLeft = 'auto';
        btn.innerHTML = '🔐 Login Akun';
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        window.checkAuthGatekeeper();
    });
} else {
    window.checkAuthGatekeeper();
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

window.purgeCompanyData = function(companyName) {
    if (!companyName) {
        const selectEl = document.getElementById('superadmin-purge-company');
        if (selectEl) companyName = selectEl.value;
    }
    if (!companyName) {
        alert('Mohon pilih Perusahaan yang ingin dihapus datanya.');
        return;
    }

    const confirm1 = confirm(`⚠️ PERINGATAN HAK AKSES SUPER ADMIN!\n\nApakah Anda yakin ingin menghapus SELURUH DATA PERUSAHAAN:\n"${companyName}"?\n\nTindakan ini akan menghapus semua Master Data Customer/Vendor, SPH, PO, DO, BAST, Invoice, dan Kwitansi dari perusahaan ini.`);
    if (!confirm1) return;

    if (!window.moduleStore) window.moduleStore = {};
    const keys = ['do', 'invoice', 'receipt', 'bast', 'po', 'ttb', 'quotation_history', 'customers', 'vendors', 'users'];
    keys.forEach(k => {
        if (Array.isArray(window.moduleStore[k])) {
            window.moduleStore[k] = window.moduleStore[k].filter(item => {
                const comp = item.company_name || item.customer_name || item.vendor_name || item.name || '';
                return !comp.toLowerCase().includes(companyName.toLowerCase());
            });
        }
    });

    alert(`✅ BERHASIL PURGE DATA!\nSeluruh data transaksi & master milik "${companyName}" telah dihapus secara permanen dari sistem ERP.`);
    openModuleView('users');
};

window.deleteTransactionSuperAdmin = function(moduleKey, id, label) {
    if (!confirm(`🗑️ HAK AKSES SUPER ADMIN:\n\nApakah Anda yakin ingin menghapus data ${moduleKey.toUpperCase()} #${id} (${label || ''})?\n\nData yang dihapus tidak dapat dikembalikan.`)) {
        return;
    }

    if (window.moduleStore && Array.isArray(window.moduleStore[moduleKey])) {
        window.moduleStore[moduleKey] = window.moduleStore[moduleKey].filter(x => x.id != id);
    }

    try {
        let endpoint = '/api/' + (moduleKey === 'users' ? 'users' : (moduleKey === 'ttb' ? 'ttb' : (moduleKey === 'invoice' ? 'invoices' : (moduleKey === 'receipt' ? 'receipts' : (moduleKey === 'po' ? 'po' : (moduleKey === 'do' ? 'do' : moduleKey))))));
        fetch(`${endpoint}/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': 'Bearer ' + (localStorage.getItem('erp_token') || '') }
        });
    } catch (e) {}

    alert(`✅ Data ${moduleKey.toUpperCase()} #${id} berhasil dihapus!`);
    window.renderFullPageModuleWorkspace(moduleKey, moduleKey === 'customers' ? '🏢 Master Customer' : (moduleKey === 'vendors' ? '🏭 Master Vendor' : moduleKey.toUpperCase()));
};

window.togglePasswordVisibility = function(inputId, btnEl) {
    const input = document.getElementById(inputId);
    if (!input) return;
    if (input.type === 'password') {
        input.type = 'text';
        if (btnEl) btnEl.innerHTML = '👁️‍🗨️';
    } else {
        input.type = 'password';
        if (btnEl) btnEl.innerHTML = '👁️';
    }
};

window.openUserCreateModal = function() {
    const modal = document.getElementById('module-dialog-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalBody = document.getElementById('modal-body');
    if (!modal || !modalBody) return;

    modalTitle.textContent = '➕ TAMBAH USER PENGGUNA BARU (SUPER ADMIN)';
    modalBody.innerHTML = `
        <div style="padding: 10px 0;">
            <p style="margin-top: 0; font-size: 13px; color: #94a3b8;">Buat akun pengguna baru per perusahaan dengan alokasi Role dan Hak Akses resmi.</p>
            <form id="form-create-user" onsubmit="event.preventDefault(); window.handleSaveUser();">
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;">
                    <div>
                        <label style="display: block; font-size: 12px; font-weight: 700; color: #cbd5e1; margin-bottom: 6px;">Nama Lengkap Pengguna <span style="color:#ef4444;">*</span></label>
                        <input type="text" id="usr-fullname" class="form-control" placeholder="Contoh: Ahmad Subagja, S.E." required style="background:#0f172a; color:#fff; border:1px solid #334155; padding:8px 12px; border-radius:6px; width:100%;">
                    </div>
                    <div>
                        <label style="display: block; font-size: 12px; font-weight: 700; color: #cbd5e1; margin-bottom: 6px;">Username Akun <span style="color:#ef4444;">*</span></label>
                        <input type="text" id="usr-username" class="form-control" placeholder="Contoh: ahmad_admin" required style="background:#0f172a; color:#fff; border:1px solid #334155; padding:8px 12px; border-radius:6px; width:100%;">
                    </div>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;">
                    <div>
                        <label style="display: block; font-size: 12px; font-weight: 700; color: #cbd5e1; margin-bottom: 6px;">Alamat Email <span style="color:#ef4444;">*</span></label>
                        <input type="email" id="usr-email" class="form-control" placeholder="admin@perusahaan.co.id" required style="background:#0f172a; color:#fff; border:1px solid #334155; padding:8px 12px; border-radius:6px; width:100%;">
                    </div>
                    <div>
                        <label style="display: block; font-size: 12px; font-weight: 700; color: #cbd5e1; margin-bottom: 6px;">Password Akun <span style="color:#ef4444;">*</span></label>
                        <div style="position: relative; width: 100%;">
                            <input type="password" id="usr-password" class="form-control" placeholder="Masukkan password..." required style="background:#0f172a; color:#fff; border:1px solid #334155; padding:8px 38px 8px 12px; border-radius:6px; width:100%;">
                            <button type="button" onclick="window.togglePasswordVisibility('usr-password', this)" style="position: absolute; right: 8px; top: 50%; transform: translateY(-50%); background: none; border: none; color: #94a3b8; cursor: pointer; font-size: 15px; padding: 0;" title="Tampilkan/Sembunyikan Password">👁️</button>
                        </div>
                    </div>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px;">
                    <div>
                        <label style="display: block; font-size: 12px; font-weight: 700; color: #cbd5e1; margin-bottom: 6px;">Role Hak Akses <span style="color:#ef4444;">*</span></label>
                        <select id="usr-role" class="form-control" required style="background:#0f172a; color:#fff; border:1px solid #334155; padding:8px 12px; border-radius:6px; width:100%;">
                            <option value="COMPANY_ADMIN">COMPANY_ADMIN (Admin Utama Perusahaan)</option>
                            <option value="COMPANY_STAFF">COMPANY_STAFF (Staf Operasional)</option>
                            <option value="SUPER_ADMIN">SUPER_ADMIN (Global System Admin)</option>
                        </select>
                    </div>
                    <div>
                        <label style="display: block; font-size: 12px; font-weight: 700; color: #cbd5e1; margin-bottom: 6px;">Nama Perusahaan / Tenant</label>
                        <input type="text" id="usr-company" class="form-control" placeholder="Nama PT / CV Perusahaan" style="background:#0f172a; color:#fff; border:1px solid #334155; padding:8px 12px; border-radius:6px; width:100%;">
                    </div>
                </div>

                <div style="display: flex; justify-content: flex-end; gap: 12px; margin-top: 24px; border-top: 1px solid #334155; padding-top: 16px;">
                    <button type="button" class="btn btn-secondary" onclick="document.getElementById('module-dialog-modal').style.display='none';" style="background:rgba(255,255,255,0.05); color:#cbd5e1; padding:8px 16px;">Batal</button>
                    <button type="submit" class="btn btn-primary" style="background:#0284c7; color:#fff; font-weight:700; padding:8px 20px;">💾 Simpan User Baru</button>
                </div>
            </form>
        </div>
    `;
    modal.style.display = 'flex';
};

window.handleSaveUser = async function() {
    const fullName = document.getElementById('usr-fullname')?.value;
    const username = document.getElementById('usr-username')?.value;
    const email = document.getElementById('usr-email')?.value;
    const password = document.getElementById('usr-password')?.value;
    const role = document.getElementById('usr-role')?.value;
    const company = document.getElementById('usr-company')?.value || 'PT. PERUSAHAAN DEMO';

    if (!fullName || !username || !email || !password) {
        alert('Harap isi semua bidang wajib (*)');
        return;
    }

    const newUser = {
        id: Date.now(),
        username,
        full_name: fullName,
        email,
        role: role || 'COMPANY_ADMIN',
        company_name: company,
        status: 'active'
    };

    try {
        await fetch('/api/users', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + (localStorage.getItem('erp_token') || '')
            },
            body: JSON.stringify({
                full_name: fullName,
                username,
                email,
                password,
                role,
                company_name: company,
                status: 'active'
            })
        });
    } catch (e) {}

    if (!window.moduleStore) window.moduleStore = {};
    if (!window.moduleStore.users) window.moduleStore.users = [];
    window.moduleStore.users.unshift(newUser);

    document.getElementById('module-dialog-modal').style.display = 'none';
    alert(`🎉 User Pengguna Berhasil Dibuat!\n\nUsername: ${username}\nNama: ${fullName}\nRole: ${role}`);
    window.renderFullPageModuleWorkspace('users', '👑 User Mgmt (Super Admin)');
};

window.openUserEditModal = function(id) {
    const list = (window.moduleStore && window.moduleStore.users) ? window.moduleStore.users : getMockModuleData('users');
    const user = list.find(x => x.id == id);
    if (!user) {
        alert('User tidak ditemukan.');
        return;
    }

    const modal = document.getElementById('module-dialog-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalBody = document.getElementById('modal-body');
    if (!modal || !modalBody) return;

    modalTitle.textContent = `✏️ EDIT USER #${user.id}: ${user.username.toUpperCase()}`;
    modalBody.innerHTML = `
        <div style="padding: 10px 0;">
            <p style="margin-top: 0; font-size: 13px; color: #94a3b8;">Perbarui informasi akun atau <strong>reset password</strong> pengguna.</p>
            <form id="form-edit-user" onsubmit="event.preventDefault(); window.handleUpdateUser(${user.id});">
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;">
                    <div>
                        <label style="display: block; font-size: 12px; font-weight: 700; color: #cbd5e1; margin-bottom: 6px;">Nama Lengkap Pengguna <span style="color:#ef4444;">*</span></label>
                        <input type="text" id="usr-edit-fullname" class="form-control" value="${user.full_name || ''}" required style="background:#0f172a; color:#fff; border:1px solid #334155; padding:8px 12px; border-radius:6px; width:100%;">
                    </div>
                    <div>
                        <label style="display: block; font-size: 12px; font-weight: 700; color: #cbd5e1; margin-bottom: 6px;">Username (Tidak Dapat Diubah)</label>
                        <input type="text" id="usr-edit-username" class="form-control" value="${user.username || ''}" disabled style="background:#1e293b; color:#94a3b8; border:1px solid #334155; padding:8px 12px; border-radius:6px; width:100%;">
                    </div>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;">
                    <div>
                        <label style="display: block; font-size: 12px; font-weight: 700; color: #cbd5e1; margin-bottom: 6px;">Alamat Email <span style="color:#ef4444;">*</span></label>
                        <input type="email" id="usr-edit-email" class="form-control" value="${user.email || ''}" required style="background:#0f172a; color:#fff; border:1px solid #334155; padding:8px 12px; border-radius:6px; width:100%;">
                    </div>
                    <div>
                        <label style="display: block; font-size: 12px; font-weight: 700; color: #facc15; margin-bottom: 6px;">🔑 Reset Password Baru (Opsional)</label>
                        <div style="position: relative; width: 100%;">
                            <input type="password" id="usr-edit-password" class="form-control" placeholder="Kosongkan jika tidak ubah password..." style="background:#0f172a; color:#fff; border:1px solid #334155; padding:8px 38px 8px 12px; border-radius:6px; width:100%;">
                            <button type="button" onclick="window.togglePasswordVisibility('usr-edit-password', this)" style="position: absolute; right: 8px; top: 50%; transform: translateY(-50%); background: none; border: none; color: #94a3b8; cursor: pointer; font-size: 15px; padding: 0;" title="Tampilkan/Sembunyikan Password">👁️</button>
                        </div>
                    </div>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px;">
                    <div>
                        <label style="display: block; font-size: 12px; font-weight: 700; color: #cbd5e1; margin-bottom: 6px;">Role Hak Akses <span style="color:#ef4444;">*</span></label>
                        <select id="usr-edit-role" class="form-control" required style="background:#0f172a; color:#fff; border:1px solid #334155; padding:8px 12px; border-radius:6px; width:100%;">
                            <option value="COMPANY_ADMIN" ${user.role === 'COMPANY_ADMIN' ? 'selected' : ''}>COMPANY_ADMIN (Admin Utama Perusahaan)</option>
                            <option value="COMPANY_STAFF" ${user.role === 'COMPANY_STAFF' ? 'selected' : ''}>COMPANY_STAFF (Staf Operasional)</option>
                            <option value="SUPER_ADMIN" ${user.role === 'SUPER_ADMIN' ? 'selected' : ''}>SUPER_ADMIN (Global System Admin)</option>
                        </select>
                    </div>
                    <div>
                        <label style="display: block; font-size: 12px; font-weight: 700; color: #cbd5e1; margin-bottom: 6px;">Nama Perusahaan / Tenant</label>
                        <input type="text" id="usr-edit-company" class="form-control" value="${user.company_name || ''}" style="background:#0f172a; color:#fff; border:1px solid #334155; padding:8px 12px; border-radius:6px; width:100%;">
                    </div>
                </div>

                <div style="display: flex; justify-content: flex-end; gap: 12px; margin-top: 24px; border-top: 1px solid #334155; padding-top: 16px;">
                    <button type="button" class="btn btn-secondary" onclick="document.getElementById('module-dialog-modal').style.display='none';" style="background:rgba(255,255,255,0.05); color:#cbd5e1; padding:8px 16px;">Batal</button>
                    <button type="submit" class="btn btn-primary" style="background:#0284c7; color:#fff; font-weight:700; padding:8px 20px;">💾 Perbarui Data User</button>
                </div>
            </form>
        </div>
    `;
    modal.style.display = 'flex';
};

window.handleUpdateUser = async function(id) {
    const fullName = document.getElementById('usr-edit-fullname')?.value;
    const email = document.getElementById('usr-edit-email')?.value;
    const password = document.getElementById('usr-edit-password')?.value;
    const role = document.getElementById('usr-edit-role')?.value;
    const company = document.getElementById('usr-edit-company')?.value;

    if (!fullName || !email) {
        alert('Nama Lengkap dan Email wajib diisi.');
        return;
    }

    try {
        await fetch('/api/users/' + id, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + (localStorage.getItem('erp_token') || '')
            },
            body: JSON.stringify({
                full_name: fullName,
                email,
                password,
                role,
                company_name: company
            })
        });
    } catch (e) {}

    if (window.moduleStore && Array.isArray(window.moduleStore.users)) {
        const u = window.moduleStore.users.find(x => x.id == id);
        if (u) {
            u.full_name = fullName;
            u.email = email;
            u.role = role;
            if (company) u.company_name = company;
        }
    }

    document.getElementById('module-dialog-modal').style.display = 'none';
    alert(`✅ Data user #${id} & password berhasil diperbarui!`);
    window.renderFullPageModuleWorkspace('users', '👑 User Mgmt (Super Admin)');
};

window.toggleUserStatus = async function(id, currentStatus) {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    if (!confirm(`Apakah Anda yakin ingin mengubah status user ID #${id} menjadi "${newStatus.toUpperCase()}"?`)) return;

    try {
        await fetch('/api/users/' + id + '/status', {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + (localStorage.getItem('erp_token') || '')
            },
            body: JSON.stringify({ status: newStatus })
        });
    } catch (e) {}

    if (window.moduleStore && Array.isArray(window.moduleStore.users)) {
        const u = window.moduleStore.users.find(x => x.id == id);
        if (u) u.status = newStatus;
    }

    alert(`✅ Status user ID #${id} diperbarui menjadi "${newStatus}".`);
    window.renderFullPageModuleWorkspace('users', '👑 User Mgmt (Super Admin)');
};

window.deleteUserSuperAdmin = async function(id, username) {
    if (!confirm(`🗑️ HAPUS USER (SUPER ADMIN):\n\nApakah Anda yakin ingin menghapus akun pengguna "${username}" (ID: #${id})?\n\nTindakan ini tidak dapat dibatalkan.`)) return;

    try {
        await fetch('/api/users/' + id, {
            method: 'DELETE',
            headers: {
                'Authorization': 'Bearer ' + (localStorage.getItem('erp_token') || '')
            }
        });
    } catch (e) {}

    if (window.moduleStore && Array.isArray(window.moduleStore.users)) {
        window.moduleStore.users = window.moduleStore.users.filter(x => x.id != id);
    }

    alert(`✅ Akun user "${username}" telah dihapus.`);
    window.renderFullPageModuleWorkspace('users', '👑 User Mgmt (Super Admin)');
};
window.handleInvoiceCustomerSelect = function(val) {
    const custInput = document.getElementById('inv-customer');
    const addrInput = document.getElementById('inv-address');
    const upInput = document.getElementById('inv-up');
    if (!custInput) return;

    if (val && window.moduleStore && window.moduleStore.customers) {
        const cust = window.moduleStore.customers.find(c => c.id == val || c.code == val);
        if (cust) {
            custInput.value = cust.name || cust.company_name;
            if (addrInput) addrInput.value = cust.address || '';
            if (upInput) upInput.value = cust.contact_person || 'Bagian Keuangan';
        }
    }
};

window.openInvoiceCreateModal = function() {
    const modal = document.getElementById('module-dialog-modal');
    const modalBody = document.getElementById('modal-body');
    const modalTitle = document.getElementById('modal-title');
    if (!modalBody) return;
    if (modal) modal.style.display = 'flex';
    
    modalTitle.textContent = '💳 Buat Invoice Penagihan (Invoice Form)';
    
    modalBody.innerHTML = `
        <div style="background: #0f172a; padding: 24px; border-radius: 12px; border: 1px solid #334155; max-width: 820px; margin: 0 auto; box-sizing: border-box;">
            
            <!-- SECTION 1: AUTO-FILL SELECTORS -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px;">
                <div style="background: rgba(14,165,233,0.08); padding: 14px; border-radius: 10px; border: 1px dashed #0284c7;">
                    <div style="color: #38bdf8; font-weight: 700; font-size: 12px; margin-bottom: 8px; text-transform: uppercase;">🏢 Pilih Master Customer (Auto-fill)</div>
                    <select class="form-control" style="background: #1e293b; color: #38bdf8; border: 1px solid #0284c7; font-weight: 600; font-size: 13px; padding: 8px 12px; height: 40px; width: 100%; border-radius: 6px;" onchange="handleInvoiceCustomerSelect(this.value)">
                        <option value="">-- Mode Input Manual --</option>
                    </select>
                </div>
                <div style="background: rgba(56,189,248,0.08); padding: 14px; border-radius: 10px; border: 1px dashed #38bdf8;">
                    <div style="color: #38bdf8; font-weight: 700; font-size: 12px; margin-bottom: 8px; text-transform: uppercase;">🔗 Import Data dari SPH Penawaran</div>
                    <select id="inv-import-sph" class="form-control" style="background: #1e293b; color: #ffffff; border: 1px solid #38bdf8; font-size: 13px; padding: 8px 12px; height: 40px; width: 100%; border-radius: 6px;" onchange="handleSPHImportSelect(this.value)">
                        <option value="">-- Pilih SPH untuk Auto Pre-fill --</option>
                    </select>
                </div>
            </div>

            <!-- SECTION 2: TEMPLATE PICKER -->
            <div style="margin-bottom: 28px; padding-bottom: 20px; border-bottom: 1px solid #1e293b;">
                <div style="font-weight: 700; font-size: 13px; color: #f8fafc; margin-bottom: 12px;">🎨 Desain Template Invoice:</div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                    <div style="background: rgba(14,165,233,0.12); border: 2px solid #0284c7; padding: 14px; border-radius: 10px; cursor: pointer;" onclick="document.getElementById('tpl-std').click()">
                        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 6px;">
                            <input type="radio" id="tpl-std" name="inv_template_type" value="TEMPLATE_STANDARD" checked style="width: 18px; height: 18px; cursor: pointer;">
                            <strong style="color: #38bdf8; font-size: 14px;">Template Commercial Standard</strong>
                        </div>
                        <div style="font-size: 11.5px; color: #cbd5e1; padding-left: 28px; line-height: 1.4;">Metadata SPK/PO, Subtotal, Pajak PPN & Total Invoice.</div>
                    </div>
                    <div style="background: rgba(168,85,247,0.12); border: 2px solid #a855f7; padding: 14px; border-radius: 10px; cursor: pointer;" onclick="document.getElementById('tpl-prof').click()">
                        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 6px;">
                            <input type="radio" id="tpl-prof" name="inv_template_type" value="TEMPLATE_PROFORMA" style="width: 18px; height: 18px; cursor: pointer;">
                            <strong style="color: #c084fc; font-size: 14px;">Template Proforma & Term</strong>
                        </div>
                        <div style="font-size: 11.5px; color: #cbd5e1; padding-left: 28px; line-height: 1.4;">Metadata Jatuh Tempo (Due Date) & Syarat Pembayaran.</div>
                    </div>
                </div>
            </div>

            <!-- SECTION 3: FORM INPUTS GRID -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; row-gap: 20px;">
                <div style="display: flex; flex-direction: column; gap: 6px;">
                    <div style="font-weight: 600; color: #cbd5e1; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Nomor Invoice</div>
                    <input type="text" id="inv-no" class="form-control" style="background: #1e293b; color: #fff; border: 1px solid #334155; padding: 10px 14px; border-radius: 8px; font-size: 13.5px;" placeholder="Contoh: INV/2026/09/001" value="">
                </div>

                <div style="display: flex; flex-direction: column; gap: 6px;">
                    <div style="font-weight: 600; color: #cbd5e1; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Nama Customer / Pembayar</div>
                    <input type="text" id="inv-customer" class="form-control" style="background: #1e293b; color: #fff; border: 1px solid #334155; padding: 10px 14px; border-radius: 8px; font-size: 13.5px;" placeholder="Masukkan Nama Customer / Perusahaan Klien" value="">
                </div>

                <div style="display: flex; flex-direction: column; gap: 6px;">
                    <div style="font-weight: 600; color: #cbd5e1; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Up. Yth. / Attn (PIC Keuangan)</div>
                    <input type="text" id="inv-up" class="form-control" style="background: #1e293b; color: #fff; border: 1px solid #334155; padding: 10px 14px; border-radius: 8px; font-size: 13.5px;" placeholder="Contoh: Bagian Keuangan / Finance" value="">
                </div>

                <div style="display: flex; flex-direction: column; gap: 6px;">
                    <div style="font-weight: 600; color: #cbd5e1; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">No. SPK / PO Customer (Ref)</div>
                    <input type="text" id="inv-po-ref" class="form-control" style="background: #1e293b; color: #fff; border: 1px solid #334155; padding: 10px 14px; border-radius: 8px; font-size: 13.5px;" placeholder="Contoh: PO-2026/SPK-091" value="">
                </div>

                <div style="grid-column: span 2; display: flex; flex-direction: column; gap: 6px;">
                    <div style="font-weight: 600; color: #cbd5e1; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Alamat Lengkap Klien</div>
                    <input type="text" id="inv-address" class="form-control" style="background: #1e293b; color: #fff; border: 1px solid #334155; padding: 10px 14px; border-radius: 8px; font-size: 13.5px;" placeholder="Alamat penagihan customer" value="">
                </div>

                <div style="grid-column: span 2; display: flex; flex-direction: column; gap: 6px;">
                    <div style="font-weight: 600; color: #cbd5e1; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Nama Barang / Deskripsi Pekerjaan (Multi-Baris)</div>
                    <textarea id="inv-desc" class="form-control" rows="3" style="background: #1e293b; color: #fff; border: 1px solid #334155; padding: 10px 14px; border-radius: 8px; font-family: inherit; line-height: 1.5; font-size: 13.5px;" placeholder="Rincian barang/pekerjaan (Bisa beberapa baris)"></textarea>
                </div>

                <div style="display: flex; flex-direction: column; gap: 6px;">
                    <div style="font-weight: 600; color: #cbd5e1; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Tanggal Invoice</div>
                    <input type="date" id="inv-date" class="form-control" style="background: #1e293b; color: #fff; border: 1px solid #334155; padding: 10px 14px; border-radius: 8px; font-size: 13.5px;" value="${new Date().toISOString().split('T')[0]}">
                </div>

                <div style="display: flex; flex-direction: column; gap: 6px;">
                    <div style="font-weight: 600; color: #cbd5e1; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Jatuh Tempo (Due Date)</div>
                    <input type="date" id="inv-due-date" class="form-control" style="background: #1e293b; color: #fff; border: 1px solid #334155; padding: 10px 14px; border-radius: 8px; font-size: 13.5px;">
                </div>

                <div style="display: flex; flex-direction: column; gap: 6px;">
                    <div style="font-weight: 600; color: #cbd5e1; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Subtotal (Rp)</div>
                    <input type="number" id="inv-subtotal" class="form-control" style="background: #1e293b; color: #fff; border: 1px solid #334155; padding: 10px 14px; border-radius: 8px; font-size: 13.5px;" value="0">
                </div>

                <div style="display: flex; flex-direction: column; gap: 6px;">
                    <div style="font-weight: 600; color: #cbd5e1; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">PPN (%) Dinamis</div>
                    <input type="number" id="inv-tax-rate" class="form-control" style="background: #1e293b; color: #fff; border: 1px solid #334155; padding: 10px 14px; border-radius: 8px; font-size: 13.5px;" value="11">
                </div>

                <div style="grid-column: span 2; display: flex; flex-direction: column; gap: 6px;">
                    <div style="font-weight: 600; color: #cbd5e1; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Catatan Pembayaran & Transfer Bank (Multi-Baris)</div>
                    <textarea id="inv-notes" class="form-control" rows="3" style="background: #1e293b; color: #fff; border: 1px solid #334155; padding: 10px 14px; border-radius: 8px; font-family: inherit; line-height: 1.5; font-size: 13.5px;" placeholder="Daftar catatan pembayaran (Bisa beberapa baris)"></textarea>
                </div>
            </div>

            <div style="margin-top: 28px; text-align: right; display: flex; justify-content: flex-end; gap: 12px; padding-top: 16px; border-top: 1px solid #1e293b;">
                <button type="button" class="btn btn-secondary" style="padding: 10px 22px; font-weight: 600; border-radius: 8px;" onclick="document.getElementById('module-dialog-modal').style.display='none'">Batal</button>
                <button type="button" class="btn btn-primary" style="padding: 10px 24px; font-weight: 700; background: #0284c7; border-radius: 8px;" onclick="submitCreateInvoice()">Simpan & Buat Invoice</button>
            </div>
        </div>
    `;
};

window.handleMasterCustomerSelect = function(val) {
    const namaInput = document.getElementById('input-klien-nama');
    const alamatInput = document.getElementById('input-klien-alamat');
    if (!namaInput || !alamatInput) return;

    if (val && window.moduleStore && window.moduleStore.customers) {
        const cust = window.moduleStore.customers.find(c => c.id == val || c.code == val);
        if (cust) {
            namaInput.value = cust.name || cust.company_name;
            alamatInput.value = cust.address || '';
        }
    }
    
    namaInput.dispatchEvent(new Event('input'));
    alamatInput.dispatchEvent(new Event('input'));
};

window.handleSPHImportSelect = function(val) {
    // Dynamic import handling from moduleStore
};

window.submitCreateInvoice = async function() {
    const invNo = document.getElementById('inv-no').value;
    const customer = document.getElementById('inv-customer').value;
    const invUp = document.getElementById('inv-up') ? document.getElementById('inv-up').value : 'Bagian Keuangan';
    const invPoRef = document.getElementById('inv-po-ref') ? document.getElementById('inv-po-ref').value : '-';
    const invAddress = document.getElementById('inv-address') ? document.getElementById('inv-address').value : 'di Tempat';
    const invDesc = document.getElementById('inv-desc') ? document.getElementById('inv-desc').value : 'Tagihan Pekerjaan & Pengadaan Barang';
    const invNotes = document.getElementById('inv-notes') ? document.getElementById('inv-notes').value : '';
    const invDate = document.getElementById('inv-date').value;
    const dueDate = document.getElementById('inv-due-date').value;
    const subtotal = document.getElementById('inv-subtotal').value;
    const taxRate = document.getElementById('inv-tax-rate').value;
    const tTypeChecked = document.querySelector('input[name="inv_template_type"]:checked');
    const tType = tTypeChecked ? tTypeChecked.value : 'TEMPLATE_STANDARD';

    if (!invNo || !customer) {
        alert('Mohon isi Nomor Invoice dan Nama Customer.');
        return;
    }

    const newInv = {
        id: Date.now(),
        invoice_no: invNo,
        invoice_date: invDate,
        due_date: dueDate,
        template_type: tType,
        customer_name: customer,
        up_person: invUp,
        po_reference: invPoRef,
        customer_address: invAddress,
        description: invDesc,
        payment_notes: invNotes,
        subtotal: Number(subtotal),
        tax_rate_percent: Number(taxRate),
        status: 'Unpaid'
    };

    if (window.moduleStore) {
        if (!window.moduleStore.invoice) window.moduleStore.invoice = [];
        window.moduleStore.invoice.unshift(newInv);
    }

    try {
        await fetch('/api/invoices', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + (localStorage.getItem('erp_token') || '')
            },
            body: JSON.stringify(newInv)
        });
    } catch (e) {
        // Fallback store update
    }

    alert('✅ Invoice ' + invNo + ' berhasil dibuat!');
    document.getElementById('module-dialog-modal').style.display = 'none';
    renderFullPageModuleWorkspace('invoice', '6. 💳 Invoice Penagihan');
};

window.getDOStatusBadgeHTML = function(id, currentStatus) {
    const status = currentStatus || 'Pengiriman';
    let bgColor = 'rgba(56, 189, 248, 0.25)';
    let color = '#38bdf8';
    let borderColor = '#0284c7';

    if (status === 'Transit' || status === 'Dalam Transit') {
        bgColor = 'rgba(245, 158, 11, 0.25)';
        color = '#fbbf24';
        borderColor = '#d97706';
    } else if (status === 'Diterima' || status === 'Selesai' || status === 'Diterima / Selesai') {
        bgColor = 'rgba(16, 185, 129, 0.25)';
        color = '#34d399';
        borderColor = '#059669';
    } else if (status === 'Batal' || status === 'Dibatalkan') {
        bgColor = 'rgba(239, 68, 68, 0.25)';
        color = '#f87171';
        borderColor = '#dc2626';
    }

    return `
        <select onchange="updateDOStatus(${id}, this.value)" style="background: ${bgColor}; color: ${color}; border: 1px solid ${borderColor}; padding: 6px 10px; border-radius: 6px; font-size: 11px; font-weight: 700; cursor: pointer; outline: none;">
            <option value="Pengiriman" ${status === 'Pengiriman' ? 'selected' : ''} style="background:#0f172a; color:#38bdf8;">🚚 Dalam Pengiriman</option>
            <option value="Transit" ${status === 'Transit' || status === 'Dalam Transit' ? 'selected' : ''} style="background:#0f172a; color:#fbbf24;">📦 Dalam Transit</option>
            <option value="Diterima / Selesai" ${status === 'Diterima' || status === 'Selesai' || status === 'Diterima / Selesai' ? 'selected' : ''} style="background:#0f172a; color:#34d399;">✅ Diterima / Selesai</option>
            <option value="Dibatalkan" ${status === 'Batal' || status === 'Dibatalkan' ? 'selected' : ''} style="background:#0f172a; color:#f87171;">❌ Dibatalkan</option>
        </select>
    `;
};

window.updateDOStatus = function(id, newStatus) {
    if (!window.moduleStore) window.moduleStore = {};
    if (!window.moduleStore.do) return;
    const item = window.moduleStore.do.find(x => x.id == id);
    if (item) {
        item.status = newStatus;
        renderFullPageModuleWorkspace('do', '3. 🚚 Delivery Order (DO)');
    }
};

window.switchToQuotationGenerator = function() {
    const mainWorkspace = document.getElementById('full-page-module-workspace');
    const appContainer = document.querySelector('.app-container');
    if (mainWorkspace) mainWorkspace.style.display = 'none';
    if (appContainer) appContainer.style.display = 'grid';
    
    document.querySelectorAll('.nav-module-btn').forEach(btn => btn.classList.remove('active'));
    const qBtn = document.querySelector('.nav-module-btn[data-module="quotation"]');
    if (qBtn) qBtn.classList.add('active');
};

window.openCustomerCreateModal = function() {
    const modal = document.getElementById('module-dialog-modal');
    const modalBody = document.getElementById('modal-body');
    const modalTitle = document.getElementById('modal-title');
    if (!modalBody) return;
    if (modal) modal.style.display = 'flex';
    modalTitle.textContent = '🏢 Tambah Customer / Klien Baru';
    
    modalBody.innerHTML = `
        <div style="background: #0f172a; padding: 24px; border-radius: 16px; border: 1px solid #334155; color: #f8fafc;">
            <form onsubmit="event.preventDefault(); window.handleSaveCustomer();">
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;">
                    <div>
                        <label style="display:block; font-size:12px; font-weight:700; color:#94a3b8; margin-bottom:6px;">Kode Customer</label>
                        <input type="text" id="cust-code" value="CUST-${Math.floor(100 + Math.random() * 900)}" required style="width:100%; box-sizing:border-box; background:#1e293b; border:1px solid #334155; color:#fff; padding:10px; border-radius:8px;">
                    </div>
                    <div>
                        <label style="display:block; font-size:12px; font-weight:700; color:#94a3b8; margin-bottom:6px;">Nama Customer / Perusahaan <span style="color:#ef4444;">*</span></label>
                        <input type="text" id="cust-name" placeholder="Contoh: PT. SEJAHTERA ABADI" required style="width:100%; box-sizing:border-box; background:#1e293b; border:1px solid #334155; color:#fff; padding:10px; border-radius:8px;">
                    </div>
                    <div>
                        <label style="display:block; font-size:12px; font-weight:700; color:#94a3b8; margin-bottom:6px;">Nama PIC / Kontak</label>
                        <input type="text" id="cust-pic" placeholder="Contoh: Budi Santoso" style="width:100%; box-sizing:border-box; background:#1e293b; border:1px solid #334155; color:#fff; padding:10px; border-radius:8px;">
                    </div>
                    <div>
                        <label style="display:block; font-size:12px; font-weight:700; color:#94a3b8; margin-bottom:6px;">Nomor Telepon / HP</label>
                        <input type="text" id="cust-phone" placeholder="0812-xxxx-xxxx" style="width:100%; box-sizing:border-box; background:#1e293b; border:1px solid #334155; color:#fff; padding:10px; border-radius:8px;">
                    </div>
                </div>
                <div style="margin-bottom: 20px;">
                    <label style="display:block; font-size:12px; font-weight:700; color:#94a3b8; margin-bottom:6px;">Alamat Lengkap Customer</label>
                    <textarea id="cust-address" rows="2" placeholder="Alamat lengkap lokasi customer" style="width:100%; box-sizing:border-box; background:#1e293b; border:1px solid #334155; color:#fff; padding:10px; border-radius:8px;"></textarea>
                </div>
                <div style="text-align:right; display:flex; justify-content:flex-end; gap:12px;">
                    <button type="button" class="btn btn-secondary" onclick="document.getElementById('module-dialog-modal').style.display='none'">Batal</button>
                    <button type="submit" class="btn btn-primary" style="background:#0284c7; border:none; color:#fff; font-weight:700; padding:10px 20px; border-radius:8px;">💾 Simpan Customer</button>
                </div>
            </form>
        </div>
    `;
};

window.handleSaveCustomer = async function() {
    const code = document.getElementById('cust-code')?.value || 'CUST-' + Date.now();
    const name = document.getElementById('cust-name')?.value;
    const pic = document.getElementById('cust-pic')?.value || '-';
    const phone = document.getElementById('cust-phone')?.value || '-';
    const address = document.getElementById('cust-address')?.value || '-';

    if (!name) {
        alert('Harap isi Nama Customer / Perusahaan.');
        return;
    }

    try {
        const res = await fetch('/api/customers', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + (localStorage.getItem('erp_token') || '')
            },
            body: JSON.stringify({
                code,
                company_name: name,
                contact_person: pic,
                phone,
                address
            })
        });
        const data = await res.json();
        if (data.success) {
            document.getElementById('module-dialog-modal').style.display = 'none';
            alert('🎉 Data Customer ' + name + ' Berhasil Disimpan ke MySQL!');
            window.renderFullPageModuleWorkspace('customers', '🏢 Master Customer');
        } else {
            alert('❌ Gagal menyimpan ke MySQL: ' + (data.message || 'Error'));
        }
    } catch (e) {
        alert('❌ Error Koneksi: ' + e.message);
    }
};

window.openCustomerEditModal = function(id) {
    const list = (window.moduleStore && window.moduleStore.customers) ? window.moduleStore.customers : [];
    const cust = list.find(c => c.id == id) || { id, code: 'CUST-'+id, company_name: 'Customer #'+id, contact_person: '', phone: '', address: '' };
    
    const modal = document.getElementById('module-dialog-modal');
    const modalBody = document.getElementById('modal-body');
    const modalTitle = document.getElementById('modal-title');
    if (!modalBody) return;
    if (modal) modal.style.display = 'flex';
    modalTitle.textContent = '✏️ Edit Data Customer #' + cust.id;

    modalBody.innerHTML = `
        <div style="background: #0f172a; padding: 24px; border-radius: 16px; border: 1px solid #334155; color: #f8fafc;">
            <form onsubmit="event.preventDefault(); window.handleUpdateCustomer(${cust.id});">
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;">
                    <div>
                        <label style="display:block; font-size:12px; font-weight:700; color:#94a3b8; margin-bottom:6px;">Kode Customer</label>
                        <input type="text" id="cust-edit-code" value="${cust.code || ''}" required style="width:100%; box-sizing:border-box; background:#1e293b; border:1px solid #334155; color:#fff; padding:10px; border-radius:8px;">
                    </div>
                    <div>
                        <label style="display:block; font-size:12px; font-weight:700; color:#94a3b8; margin-bottom:6px;">Nama Customer / Perusahaan <span style="color:#ef4444;">*</span></label>
                        <input type="text" id="cust-edit-name" value="${cust.company_name || cust.name || ''}" required style="width:100%; box-sizing:border-box; background:#1e293b; border:1px solid #334155; color:#fff; padding:10px; border-radius:8px;">
                    </div>
                    <div>
                        <label style="display:block; font-size:12px; font-weight:700; color:#94a3b8; margin-bottom:6px;">Nama PIC / Kontak</label>
                        <input type="text" id="cust-edit-pic" value="${cust.contact_person || cust.pic || ''}" style="width:100%; box-sizing:border-box; background:#1e293b; border:1px solid #334155; color:#fff; padding:10px; border-radius:8px;">
                    </div>
                    <div>
                        <label style="display:block; font-size:12px; font-weight:700; color:#94a3b8; margin-bottom:6px;">Nomor Telepon / HP</label>
                        <input type="text" id="cust-edit-phone" value="${cust.phone || ''}" style="width:100%; box-sizing:border-box; background:#1e293b; border:1px solid #334155; color:#fff; padding:10px; border-radius:8px;">
                    </div>
                </div>
                <div style="margin-bottom: 20px;">
                    <label style="display:block; font-size:12px; font-weight:700; color:#94a3b8; margin-bottom:6px;">Alamat Lengkap Customer</label>
                    <textarea id="cust-edit-address" rows="2" style="width:100%; box-sizing:border-box; background:#1e293b; border:1px solid #334155; color:#fff; padding:10px; border-radius:8px;">${cust.address || ''}</textarea>
                </div>
                <div style="text-align:right; display:flex; justify-content:flex-end; gap:12px;">
                    <button type="button" class="btn btn-secondary" onclick="document.getElementById('module-dialog-modal').style.display='none'">Batal</button>
                    <button type="submit" class="btn btn-primary" style="background:#0284c7; border:none; color:#fff; font-weight:700; padding:10px 20px; border-radius:8px;">💾 Perbarui Customer</button>
                </div>
            </form>
        </div>
    `;
};

window.handleUpdateCustomer = async function(id) {
    const code = document.getElementById('cust-edit-code')?.value;
    const name = document.getElementById('cust-edit-name')?.value;
    const pic = document.getElementById('cust-edit-pic')?.value;
    const phone = document.getElementById('cust-edit-phone')?.value;
    const address = document.getElementById('cust-edit-address')?.value;

    try {
        const res = await fetch('/api/customers/' + id, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + (localStorage.getItem('erp_token') || '')
            },
            body: JSON.stringify({ code, company_name: name, contact_person: pic, phone, address })
        });
        const data = await res.json();
        if (data.success) {
            document.getElementById('module-dialog-modal').style.display = 'none';
            alert('✅ Data Customer ' + name + ' Berhasil Diperbarui di MySQL!');
            window.renderFullPageModuleWorkspace('customers', '🏢 Master Customer');
        } else {
            alert('❌ Gagal memperbarui di MySQL: ' + (data.message || 'Error'));
        }
    } catch (e) {
        alert('❌ Error Koneksi: ' + e.message);
    }
};

window.openVendorCreateModal = function() {
    const modal = document.getElementById('module-dialog-modal');
    const modalBody = document.getElementById('modal-body');
    const modalTitle = document.getElementById('modal-title');
    if (!modalBody) return;
    if (modal) modal.style.display = 'flex';
    modalTitle.textContent = '🏭 Tambah Vendor / Supplier Baru';
    
    modalBody.innerHTML = `
        <div style="background: #0f172a; padding: 24px; border-radius: 16px; border: 1px solid #334155; color: #f8fafc;">
            <form onsubmit="event.preventDefault(); window.handleSaveVendor();">
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;">
                    <div>
                        <label style="display:block; font-size:12px; font-weight:700; color:#94a3b8; margin-bottom:6px;">Kode Vendor</label>
                        <input type="text" id="vnd-code" value="VND-${Math.floor(100 + Math.random() * 900)}" required style="width:100%; box-sizing:border-box; background:#1e293b; border:1px solid #334155; color:#fff; padding:10px; border-radius:8px;">
                    </div>
                    <div>
                        <label style="display:block; font-size:12px; font-weight:700; color:#94a3b8; margin-bottom:6px;">Nama Vendor / Supplier <span style="color:#ef4444;">*</span></label>
                        <input type="text" id="vnd-name" placeholder="Contoh: PT. BAJA UTAMA SUPPLIER" required style="width:100%; box-sizing:border-box; background:#1e293b; border:1px solid #334155; color:#fff; padding:10px; border-radius:8px;">
                    </div>
                    <div>
                        <label style="display:block; font-size:12px; font-weight:700; color:#94a3b8; margin-bottom:6px;">Nama PIC Vendor</label>
                        <input type="text" id="vnd-pic" placeholder="Contoh: Hendra Kurniawan" style="width:100%; box-sizing:border-box; background:#1e293b; border:1px solid #334155; color:#fff; padding:10px; border-radius:8px;">
                    </div>
                    <div>
                        <label style="display:block; font-size:12px; font-weight:700; color:#94a3b8; margin-bottom:6px;">Nomor Telepon / HP</label>
                        <input type="text" id="vnd-phone" placeholder="0813-xxxx-xxxx" style="width:100%; box-sizing:border-box; background:#1e293b; border:1px solid #334155; color:#fff; padding:10px; border-radius:8px;">
                    </div>
                </div>
                <div style="margin-bottom: 20px;">
                    <label style="display:block; font-size:12px; font-weight:700; color:#94a3b8; margin-bottom:6px;">Alamat Lengkap Vendor</label>
                    <textarea id="vnd-address" rows="2" placeholder="Alamat kantor/gudang vendor" style="width:100%; box-sizing:border-box; background:#1e293b; border:1px solid #334155; color:#fff; padding:10px; border-radius:8px;"></textarea>
                </div>
                <div style="text-align:right; display:flex; justify-content:flex-end; gap:12px;">
                    <button type="button" class="btn btn-secondary" onclick="document.getElementById('module-dialog-modal').style.display='none'">Batal</button>
                    <button type="submit" class="btn btn-primary" style="background:#0284c7; border:none; color:#fff; font-weight:700; padding:10px 20px; border-radius:8px;">💾 Simpan Vendor</button>
                </div>
            </form>
        </div>
    `;
};

window.handleSaveVendor = async function() {
    const code = document.getElementById('vnd-code')?.value || 'VND-' + Date.now();
    const name = document.getElementById('vnd-name')?.value;
    const pic = document.getElementById('vnd-pic')?.value || '-';
    const phone = document.getElementById('vnd-phone')?.value || '-';
    const address = document.getElementById('vnd-address')?.value || '-';

    if (!name) {
        alert('Harap isi Nama Vendor / Supplier.');
        return;
    }

    try {
        const res = await fetch('/api/vendors', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + (localStorage.getItem('erp_token') || '')
            },
            body: JSON.stringify({
                code,
                vendor_name: name,
                contact_person: pic,
                phone,
                address
            })
        });
        const data = await res.json();
        if (data.success) {
            alert('✅ Vendor berhasil disimpan!');
            document.getElementById('module-dialog-modal').style.display = 'none';
            window.renderFullPageModuleWorkspace('vendors', '🏭 Master Vendor');
        } else {
            alert('❌ Gagal menyimpan vendor: ' + data.message);
        }
    } catch (err) {
        alert('❌ Error: ' + err.message);
    }
};

window.openVendorEditModal = function(id) {
    const list = (window.moduleStore && window.moduleStore.vendors) ? window.moduleStore.vendors : [];
    const v = list.find(x => x.id == id) || { id, code: 'VND-'+id, vendor_name: 'Vendor #'+id, contact_person: '', phone: '', address: '' };
    
    const modal = document.getElementById('module-dialog-modal');
    const modalBody = document.getElementById('modal-body');
    const modalTitle = document.getElementById('modal-title');
    if (!modalBody) return;
    if (modal) modal.style.display = 'flex';
    modalTitle.textContent = '✏️ Edit Data Vendor #' + v.id;

    modalBody.innerHTML = `
        <div style="background: #0f172a; padding: 24px; border-radius: 16px; border: 1px solid #334155; color: #f8fafc;">
            <form onsubmit="event.preventDefault(); window.handleUpdateVendor(${v.id});">
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;">
                    <div>
                        <label style="display:block; font-size:12px; font-weight:700; color:#94a3b8; margin-bottom:6px;">Kode Vendor</label>
                        <input type="text" id="vnd-edit-code" value="${v.code || ''}" required style="width:100%; box-sizing:border-box; background:#1e293b; border:1px solid #334155; color:#fff; padding:10px; border-radius:8px;">
                    </div>
                    <div>
                        <label style="display:block; font-size:12px; font-weight:700; color:#94a3b8; margin-bottom:6px;">Nama Vendor / Supplier <span style="color:#ef4444;">*</span></label>
                        <input type="text" id="vnd-edit-name" value="${v.vendor_name || v.name || ''}" required style="width:100%; box-sizing:border-box; background:#1e293b; border:1px solid #334155; color:#fff; padding:10px; border-radius:8px;">
                    </div>
                    <div>
                        <label style="display:block; font-size:12px; font-weight:700; color:#94a3b8; margin-bottom:6px;">Nama PIC Vendor</label>
                        <input type="text" id="vnd-edit-pic" value="${v.contact_person || v.pic || ''}" style="width:100%; box-sizing:border-box; background:#1e293b; border:1px solid #334155; color:#fff; padding:10px; border-radius:8px;">
                    </div>
                    <div>
                        <label style="display:block; font-size:12px; font-weight:700; color:#94a3b8; margin-bottom:6px;">Nomor Telepon / HP</label>
                        <input type="text" id="vnd-edit-phone" value="${v.phone || ''}" style="width:100%; box-sizing:border-box; background:#1e293b; border:1px solid #334155; color:#fff; padding:10px; border-radius:8px;">
                    </div>
                </div>
                <div style="margin-bottom: 20px;">
                    <label style="display:block; font-size:12px; font-weight:700; color:#94a3b8; margin-bottom:6px;">Alamat Lengkap Vendor</label>
                    <textarea id="vnd-edit-address" rows="2" style="width:100%; box-sizing:border-box; background:#1e293b; border:1px solid #334155; color:#fff; padding:10px; border-radius:8px;">${v.address || ''}</textarea>
                </div>
                <div style="text-align:right; display:flex; justify-content:flex-end; gap:12px;">
                    <button type="button" class="btn btn-secondary" onclick="document.getElementById('module-dialog-modal').style.display='none'">Batal</button>
                    <button type="submit" class="btn btn-primary" style="background:#0284c7; border:none; color:#fff; font-weight:700; padding:10px 20px; border-radius:8px;">💾 Perbarui Vendor</button>
                </div>
            </form>
        </div>
    `;
};

window.handleUpdateVendor = async function(id) {
    const code = document.getElementById('vnd-edit-code')?.value;
    const name = document.getElementById('vnd-edit-name')?.value;
    const pic = document.getElementById('vnd-edit-pic')?.value;
    const phone = document.getElementById('vnd-edit-phone')?.value;
    const address = document.getElementById('vnd-edit-address')?.value;

    if (window.moduleStore && window.moduleStore.vendors) {
        const item = window.moduleStore.vendors.find(x => x.id == id);
        if (item) {
            item.code = code;
            item.vendor_name = name;
            item.contact_person = pic;
            item.phone = phone;
            item.address = address;
        }
    }

    try {
        await fetch('/api/vendors/' + id, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + (localStorage.getItem('erp_token') || '')
            },
            body: JSON.stringify({ code, vendor_name: name, contact_person: pic, phone, address })
        });
    } catch (e) {}

    document.getElementById('module-dialog-modal').style.display = 'none';
    alert('✅ Data Vendor ' + name + ' Berhasil Diperbarui!');
    window.renderFullPageModuleWorkspace('vendors', '🏭 Master Vendor');
};

window.openDOCreateModal = function() {
    const modal = document.getElementById('module-dialog-modal');
    const modalBody = document.getElementById('modal-body');
    const modalTitle = document.getElementById('modal-title');
    if (!modalBody) return;
    if (modal) modal.style.display = 'flex';
    modalTitle.textContent = '🚚 Buat Delivery Order (DO / Surat Jalan Logistik)';
    
    modalBody.innerHTML = `
        <div style="background: #0f172a; padding: 24px; border-radius: 16px; border: 1px solid #334155; color: #f8fafc; font-family: inherit;">
            <!-- SPH IMPORT BOX -->
            <div style="background: rgba(56, 189, 248, 0.08); padding: 16px 20px; border-radius: 12px; border: 1px dashed #0284c7; margin-bottom: 24px;">
                <label style="color: #38bdf8; font-weight: 700; font-size: 13px; display: block; margin-bottom: 6px;">🔗 OPSI: Import Data dari SPH Penawaran</label>
                <select id="do-import-sph" style="width: 100%; background: #1e293b; color: #ffffff; border: 1px solid #38bdf8; border-radius: 8px; padding: 10px 14px; font-size: 13px; outline: none;" onchange="handleDOImportSPH(this.value)">
                    <option value="">-- Pilih SPH untuk Auto Pre-fill Data & Rincian Barang --</option>
                    <option value="sph_1">14/SPH-DUMMY/V/2026 - PT. ABC (2 Barang)</option>
                    <option value="sph_2">05/SPH-HEKSA/VIII/2026 - PT. MANDIRI SEJAHTERA (3 Barang)</option>
                </select>
            </div>

            <!-- GRID 2 KOLOM FORM DATA -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px 24px; margin-bottom: 20px;">
                <div>
                    <label style="display: block; font-size: 12px; font-weight: 700; color: #94a3b8; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.5px;">Nomor DO / Surat Jalan</label>
                    <input type="text" id="do-no" value="DO/2026/09/001" style="width: 100%; box-sizing: border-box; background: #1e293b; border: 1px solid #334155; color: #fff; padding: 10px 14px; border-radius: 8px; font-size: 13px;">
                </div>
                <div>
                    <label style="display: block; font-size: 12px; font-weight: 700; color: #94a3b8; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.5px;">Tanggal Pengiriman</label>
                    <input type="date" id="do-date" value="${new Date().toISOString().split('T')[0]}" style="width: 100%; box-sizing: border-box; background: #1e293b; border: 1px solid #334155; color: #fff; padding: 10px 14px; border-radius: 8px; font-size: 13px;">
                </div>
                <div>
                    <label style="display: block; font-size: 12px; font-weight: 700; color: #94a3b8; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.5px;">Nama Customer / Penerima</label>
                    <input type="text" id="do-customer" placeholder="Contoh: PT. MANDIRI SEJAHTERA" style="width: 100%; box-sizing: border-box; background: #1e293b; border: 1px solid #334155; color: #fff; padding: 10px 14px; border-radius: 8px; font-size: 13px;">
                </div>
                <div>
                    <label style="display: block; font-size: 12px; font-weight: 700; color: #f43f5e; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.5px;">Jabatan / Role Officer (WAJIB DIISI)*</label>
                    <input type="text" id="do-sales-role" placeholder="Contoh: Sales / Marketing / Logistics / Manager" required style="width: 100%; box-sizing: border-box; background: #1e293b; border: 1.5px solid #f43f5e; color: #fff; padding: 10px 14px; border-radius: 8px; font-size: 13px;">
                </div>
                <div>
                    <label style="display: block; font-size: 12px; font-weight: 700; color: #94a3b8; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.5px;">Nama Petugas / Officer PIC</label>
                    <input type="text" id="do-sales-name" value="" placeholder="Nama Officer PIC" style="width: 100%; box-sizing: border-box; background: #1e293b; border: 1px solid #334155; color: #fff; padding: 10px 14px; border-radius: 8px; font-size: 13px;">
                </div>
                <div>
                    <label style="display: block; font-size: 12px; font-weight: 700; color: #94a3b8; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.5px;">Nama Pengemudi / Driver</label>
                    <input type="text" id="do-driver" value="" placeholder="Nama Pengemudi Driver" style="width: 100%; box-sizing: border-box; background: #1e293b; border: 1px solid #334155; color: #fff; padding: 10px 14px; border-radius: 8px; font-size: 13px;">
                </div>
                <div>
                    <label style="display: block; font-size: 12px; font-weight: 700; color: #94a3b8; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.5px;">Nomor Plat Kendaraan</label>
                    <input type="text" id="do-vehicle" value="" placeholder="Nomor Plat Kendaraan" style="width: 100%; box-sizing: border-box; background: #1e293b; border: 1px solid #334155; color: #fff; padding: 10px 14px; border-radius: 8px; font-size: 13px;">
                </div>
                <div>
                    <label style="display: block; font-size: 12px; font-weight: 700; color: #94a3b8; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.5px;">Lokasi Asal (From Location)</label>
                    <input type="text" id="do-from" value="" placeholder="Lokasi Gudang / Asal Barang" style="width: 100%; box-sizing: border-box; background: #1e293b; border: 1px solid #334155; color: #fff; padding: 10px 14px; border-radius: 8px; font-size: 13px;">
                </div>
            </div>

            <!-- FULL WIDTH ALAMAT FIELDS WITH SPACIOUS MARGINS -->
            <div style="margin-bottom: 20px;">
                <label style="display: block; font-size: 12px; font-weight: 700; color: #94a3b8; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.5px;">Alamat Perusahaan Pengirim (From Address Box)</label>
                <input type="text" id="do-from-address" value="" placeholder="Alamat lengkap pengirim" style="width: 100%; box-sizing: border-box; background: #1e293b; border: 1px solid #334155; color: #fff; padding: 10px 14px; border-radius: 8px; font-size: 13px;">
            </div>

            <div style="margin-bottom: 24px;">
                <label style="display: block; font-size: 12px; font-weight: 700; color: #94a3b8; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.5px;">Alamat Tujuan Pengiriman (Shipped To Box)</label>
                <textarea id="do-address" rows="2" placeholder="Alamat tujuan pengiriman" style="width: 100%; box-sizing: border-box; background: #1e293b; border: 1px solid #334155; color: #fff; padding: 10px 14px; border-radius: 8px; font-size: 13px; line-height: 1.5; resize: vertical;"></textarea>
            </div>

            <!-- ELEGANT DYNAMIC ITEM TABLE BUILDER -->
            <div style="background: #1e293b; padding: 20px; border-radius: 12px; border: 1px solid #334155; margin-bottom: 24px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; padding-bottom: 12px; border-bottom: 1px solid #334155;">
                    <strong style="color: #38bdf8; font-size: 14px; display: flex; align-items: center; gap: 8px;">
                        <span>📦</span> Rincian Barang Logistik (Pengiriman)
                    </strong>
                    <button type="button" onclick="addDOItemRow()" style="background: #0284c7; color: #fff; border: none; padding: 8px 16px; border-radius: 8px; font-size: 12px; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 6px; transition: background 0.2s;">
                        <span>+</span> Tambah Baris Barang
                    </button>
                </div>
                
                <div style="overflow-x: auto;">
                    <table style="width: 100%; border-collapse: separate; border-spacing: 0 8px; font-size: 13px;" id="do-items-table">
                        <thead>
                            <tr style="color: #94a3b8; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; text-align: left;">
                                <th style="padding: 0 10px 8px 10px; width: 25%;">Part Number (Opsional)</th>
                                <th style="padding: 0 10px 8px 10px; width: 45%;">Deskripsi Barang (Wajib)</th>
                                <th style="padding: 0 10px 8px 10px; width: 12%;">Qty</th>
                                <th style="padding: 0 10px 8px 10px; width: 13%;">Satuan</th>
                                <th style="padding: 0 10px 8px 10px; width: 5%; text-align: center;">Aksi</th>
                            </tr>
                        </thead>
                        <tbody id="do-items-tbody">
                            <tr>
                                <td style="padding: 0 6px;"><input type="text" class="form-control item-part" placeholder="Part No (Boleh kosong)" style="width: 100%; box-sizing: border-box; background: #0f172a; border: 1px solid #475569; color: #fff; padding: 8px 12px; border-radius: 6px; font-size: 12px; height: 38px;"></td>
                                <td style="padding: 0 6px;"><input type="text" class="form-control item-desc" value="" placeholder="Nama / Deskripsi barang" style="width: 100%; box-sizing: border-box; background: #0f172a; border: 1px solid #475569; color: #fff; padding: 8px 12px; border-radius: 6px; font-size: 12px; height: 38px;"></td>
                                <td style="padding: 0 6px;"><input type="number" class="form-control item-qty" value="1" style="width: 100%; box-sizing: border-box; background: #0f172a; border: 1px solid #475569; color: #fff; padding: 8px 12px; border-radius: 6px; font-size: 12px; height: 38px;"></td>
                                <td style="padding: 0 6px;"><input type="text" class="form-control item-unit" value="PCS" style="width: 100%; box-sizing: border-box; background: #0f172a; border: 1px solid #475569; color: #fff; padding: 8px 12px; border-radius: 6px; font-size: 12px; height: 38px;"></td>
                                <td style="padding: 0 6px; text-align: center;"><button type="button" onclick="removeDOItemRow(this)" style="width: 32px; height: 32px; border-radius: 6px; background: rgba(239, 68, 68, 0.15); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.3); font-weight: bold; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; font-size: 14px;">✕</button></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- ACTION BUTTONS -->
            <div style="margin-top: 20px; text-align: right; display: flex; justify-content: flex-end; gap: 12px; padding-top: 16px; border-top: 1px solid #334155;">
                <button type="button" class="btn btn-secondary" onclick="document.getElementById('module-dialog-modal').style.display='none'" style="padding: 10px 20px; border-radius: 8px; font-size: 13px; font-weight: 600;">Batal</button>
                <button type="button" class="btn btn-primary" onclick="submitCreateDO()" style="padding: 10px 24px; border-radius: 8px; font-size: 13px; font-weight: 700; background: #0284c7; border: none; color: #fff;">Simpan & Buat DO</button>
            </div>
        </div>
    `;
};

window.addDOItemRow = function(part = '', desc = '', qty = 1, unit = 'PCS') {
    const tbody = document.getElementById('do-items-tbody');
    if (!tbody) return;
    const tr = document.createElement('tr');
    tr.innerHTML = `
        <td style="padding: 0 6px;"><input type="text" class="form-control item-part" value="${part}" placeholder="Part No (Boleh kosong)" style="width: 100%; box-sizing: border-box; background: #0f172a; border: 1px solid #475569; color: #fff; padding: 8px 12px; border-radius: 6px; font-size: 12px; height: 38px;"></td>
        <td style="padding: 0 6px;"><input type="text" class="form-control item-desc" value="${desc}" placeholder="Nama / Deskripsi barang" style="width: 100%; box-sizing: border-box; background: #0f172a; border: 1px solid #475569; color: #fff; padding: 8px 12px; border-radius: 6px; font-size: 12px; height: 38px;"></td>
        <td style="padding: 0 6px;"><input type="number" class="form-control item-qty" value="${qty}" style="width: 100%; box-sizing: border-box; background: #0f172a; border: 1px solid #475569; color: #fff; padding: 8px 12px; border-radius: 6px; font-size: 12px; height: 38px;"></td>
        <td style="padding: 0 6px;"><input type="text" class="form-control item-unit" value="${unit}" style="width: 100%; box-sizing: border-box; background: #0f172a; border: 1px solid #475569; color: #fff; padding: 8px 12px; border-radius: 6px; font-size: 12px; height: 38px;"></td>
        <td style="padding: 0 6px; text-align: center;"><button type="button" onclick="removeDOItemRow(this)" style="width: 32px; height: 32px; border-radius: 6px; background: rgba(239, 68, 68, 0.15); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.3); font-weight: bold; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; font-size: 14px;">✕</button></td>
    `;
    tbody.appendChild(tr);
};

window.removeDOItemRow = function(btn) {
    const tr = btn.closest('tr');
    if (tr) tr.remove();
};

window.handleDOImportSPH = function(val) {
    if (!val) return;
    const customerEl = document.getElementById('do-customer');
    const addressEl = document.getElementById('do-address');
    const tbody = document.getElementById('do-items-tbody');

    if (val === 'sph_1') {
        if (customerEl) customerEl.value = 'PT. ABC';
        if (addressEl) addressEl.value = 'Jl. Industri Raya No. 12, Jakarta Barat';
        if (tbody) {
            tbody.innerHTML = '';
            addDOItemRow('WF-200', 'Baja WF 200 x 100 x 5.5 x 8mm', 10, 'BATANG');
            addDOItemRow('H-BEAM-150', 'H-Beam 150 x 150mm Standard', 5, 'BATANG');
        }
    } else if (val === 'sph_2') {
        if (customerEl) customerEl.value = 'PT. MANDIRI SEJAHTERA';
        if (addressEl) addressEl.value = 'Jl. Industri Raya No. 45, Cikarang Selatan, Jawa Barat';
        if (tbody) {
            tbody.innerHTML = '';
            addDOItemRow('14Y3016133', 'GUARD (LH,RH)', 2, 'PCS');
            addDOItemRow('14X3011362', 'BRACKET LH', 2, 'PCS');
            addDOItemRow('14X3011352', 'BRACKET RH', 2, 'PCS');
        }
    }
};

window.submitCreateDO = function() {
    const salesRoleInput = document.getElementById('do-sales-role');
    const salesRole = salesRoleInput ? salesRoleInput.value.trim() : '';
    if (!salesRole) {
        alert('⚠️ PERHATIAN: Jabatan / Role Officer wajib diisi!');
        if (salesRoleInput) salesRoleInput.focus();
        return;
    }

    const doNo = document.getElementById('do-no') ? document.getElementById('do-no').value : 'DO/2026/09/001';
    const doDate = document.getElementById('do-date') ? document.getElementById('do-date').value : new Date().toISOString().split('T')[0];
    const customer = document.getElementById('do-customer') ? document.getElementById('do-customer').value || 'PT. MANDIRI SEJAHTERA' : 'PT. MANDIRI SEJAHTERA';
    const salesName = document.getElementById('do-sales-name') ? document.getElementById('do-sales-name').value : 'Fevi Aprianti';
    const driver = document.getElementById('do-driver') ? document.getElementById('do-driver').value : 'Supriyadi';
    const vehicle = document.getElementById('do-vehicle') ? document.getElementById('do-vehicle').value : 'B 9128 UXX';
    const fromLoc = document.getElementById('do-from') ? document.getElementById('do-from').value : 'JKT/Stock Gudang Utama';
    const fromAddr = document.getElementById('do-from-address') ? document.getElementById('do-from-address').value : 'Jl. Matahari Raya No. 480, Bekasi';
    const address = document.getElementById('do-address') ? document.getElementById('do-address').value : 'Jl. Industri Raya No. 45, Cikarang';

    // Collect dynamic items
    const items = [];
    const tbody = document.getElementById('do-items-tbody');
    if (tbody) {
        const rows = tbody.querySelectorAll('tr');
        rows.forEach(r => {
            const part = r.querySelector('.item-part') ? r.querySelector('.item-part').value : '';
            const desc = r.querySelector('.item-desc') ? r.querySelector('.item-desc').value : '';
            const qty = r.querySelector('.item-qty') ? r.querySelector('.item-qty').value : '1';
            const unit = r.querySelector('.item-unit') ? r.querySelector('.item-unit').value : 'PCS';
            if (desc.trim()) {
                items.push({ part_no: part, description: desc, qty: qty, unit: unit });
            }
        });
    }

    const newItem = {
        id: Date.now(),
        do_no: doNo,
        do_date: doDate,
        customer_name: customer,
        sales_role: salesRole,
        sales_name: salesName,
        driver_name: driver,
        vehicle_no: vehicle,
        from_location: fromLoc,
        from_address: fromAddr,
        delivery_address: address,
        items: items,
        status: 'Pengiriman'
    };

    if (!window.moduleStore) window.moduleStore = {};
    if (!window.moduleStore.do) window.moduleStore.do = [];
    window.moduleStore.do.unshift(newItem);

    const modal = document.getElementById('module-dialog-modal');
    if (modal) modal.style.display = 'none';

    renderFullPageModuleWorkspace('do', '3. 🚚 Delivery Order (DO)');
};

window.handlePOVendorSelect = function(val) {
    const vendorInput = document.getElementById('po-vendor');
    if (!vendorInput) return;
    if (val === 'vnd_1') {
        vendorInput.value = 'PT. STEEL INDONESIA';
    } else if (val === 'vnd_2') {
        vendorInput.value = 'PT. TRAKTOR UTAMA SUPPLIER';
    } else if (val && window.moduleStore && window.moduleStore.vendors) {
        const vnd = window.moduleStore.vendors.find(v => v.id == val || v.code == val);
        if (vnd) vendorInput.value = vnd.name;
    }
};

window.openPOCreateModal = function() {
    const modal = document.getElementById('module-dialog-modal');
    const modalBody = document.getElementById('modal-body');
    const modalTitle = document.getElementById('modal-title');
    if (!modalBody) return;
    if (modal) modal.style.display = 'flex';
    modalTitle.textContent = '📄 Buat Purchase Order (PO Supplier / Vendor)';
    
    modalBody.innerHTML = `
        <div style="background: rgba(15,23,42,0.6); padding: 16px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.1);">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px;">
                <div class="form-group mb-2" style="background: rgba(168, 85, 247, 0.1); padding: 10px; border-radius: 8px; border: 1px dashed #c084fc;">
                    <label style="color: #c084fc; font-weight: 700; font-size: 12px;">🏭 Pilih Dari Master Vendor (Auto-fill)</label>
                    <select class="form-control" style="background: #0f172a; color: #c084fc; border: 1px solid #c084fc; margin-top: 4px; font-weight: 600; font-size: 12px;" onchange="handlePOVendorSelect(this.value)">
                        <option value="">-- Mode Input Manual --</option>
                        <option value="vnd_1">PT. STEEL INDONESIA</option>
                        <option value="vnd_2">PT. TRAKTOR UTAMA SUPPLIER</option>
                    </select>
                </div>
                <div class="form-group mb-2" style="background: rgba(56,189,248,0.1); padding: 10px; border-radius: 8px; border: 1px dashed #38bdf8;">
                    <label style="color: #38bdf8; font-weight: 700; font-size: 12px;">🔗 Import Data dari SPH Penawaran</label>
                    <select class="form-control" style="background: #0f172a; color: #ffffff; border: 1px solid #38bdf8; margin-top: 4px; font-size: 12px;" onchange="if(this.value){ document.getElementById('po-vendor').value='PT. STEEL INDONESIA'; document.getElementById('po-amount').value='35000000'; }">
                        <option value="">-- Pilih SPH untuk Auto Pre-fill --</option>
                        <option value="sph_1">14/SPH-DUMMY/V/2026 - PT. ABC</option>
                    </select>
                </div>
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
                    <input type="text" id="po-vendor" class="form-control" value="PT. STEEL INDONESIA">
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
    const modal = document.getElementById('module-dialog-modal');
    const modalBody = document.getElementById('modal-body');
    const modalTitle = document.getElementById('modal-title');
    if (!modalBody) return;
    if (modal) modal.style.display = 'flex';
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
    const modal = document.getElementById('module-dialog-modal');
    const modalBody = document.getElementById('modal-body');
    const modalTitle = document.getElementById('modal-title');
    if (!modalBody) return;
    if (modal) modal.style.display = 'flex';
    modalTitle.textContent = '📑 Buat Berita Acara Serah Terima (BAST 100%)';
    
    modalBody.innerHTML = `
        <div style="background: rgba(15,23,42,0.6); padding: 16px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.1);">
            <div class="form-group mb-3" style="background: rgba(56,189,248,0.1); padding: 12px; border-radius: 8px; border: 1px dashed #38bdf8;">
                <label style="color: #38bdf8; font-weight: 700; font-size: 13px;">🔗 OPSI: Import Data dari SPH Penawaran</label>
                <select class="form-control" style="background: #0f172a; color: #ffffff; border: 1px solid #38bdf8; margin-top: 6px;">
                    <option value="">-- Pilih SPH untuk Auto Pre-fill Data --</option>
                </select>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                <div class="form-group">
                    <label>Nomor BAST</label>
                    <input type="text" id="bast-no" class="form-control" placeholder="Contoh: 01/BAST/2026/001" value="">
                </div>
                <div class="form-group">
                    <label>Tanggal BAST</label>
                    <input type="date" id="bast-date" class="form-control" value="${new Date().toISOString().split('T')[0]}">
                </div>
                <div class="form-group">
                    <label>Nama Customer / Pemberi Tugas</label>
                    <input type="text" id="bast-customer" class="form-control" placeholder="Nama Customer / Perusahaan Klien" value="">
                </div>
                <div class="form-group">
                    <label>Nama Proyek / Pekerjaan</label>
                    <input type="text" id="bast-project" class="form-control" placeholder="Nama Proyek / Pekerjaan" value="">
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
    const modal = document.getElementById('module-dialog-modal');
    const modalBody = document.getElementById('modal-body');
    const modalTitle = document.getElementById('modal-title');
    if (!modalBody) return;
    if (modal) modal.style.display = 'flex';
    modalTitle.textContent = '🧾 Buat Kwitansi Pembayaran (Auto Terbilang Rp)';
    
    modalBody.innerHTML = `
        <div style="background: rgba(15,23,42,0.6); padding: 16px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.1);">
            <div class="form-group mb-3" style="background: rgba(56,189,248,0.1); padding: 12px; border-radius: 8px; border: 1px dashed #38bdf8;">
                <label style="color: #38bdf8; font-weight: 700; font-size: 13px;">🔗 OPSI: Import Data dari SPH Penawaran</label>
                <select class="form-control" style="background: #0f172a; color: #ffffff; border: 1px solid #38bdf8; margin-top: 6px;">
                    <option value="">-- Pilih SPH untuk Auto Pre-fill Data --</option>
                </select>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                <div class="form-group">
                    <label>Nomor Kwitansi</label>
                    <input type="text" id="rec-no" class="form-control" placeholder="Contoh: KWT/2026/09/001" value="">
                </div>
                <div class="form-group">
                    <label>Tanggal Pembayaran</label>
                    <input type="date" id="rec-date" class="form-control" value="${new Date().toISOString().split('T')[0]}">
                </div>
                <div class="form-group">
                    <label>Telah Diterima Dari</label>
                    <input type="text" id="rec-from" class="form-control" placeholder="Masukkan nama pembayar" value="">
                </div>
                <div class="form-group">
                    <label>Nominal Pembayaran (Rp)</label>
                    <input type="number" id="rec-amount" class="form-control" value="" placeholder="0">
                </div>
            </div>

            <div class="form-group mt-2">
                <label>Terbilang Kalimat Bahasa Indonesia</label>
                <input type="text" id="rec-spelled" class="form-control" value="" placeholder="Nominal terbilang otomatis" readonly style="background: rgba(250,204,21,0.1); color: #facc15; border-color: #facc15; font-weight: 700;">
            </div>

            <div style="margin-top: 16px; text-align: right; display: flex; justify-content: flex-end; gap: 8px;">
                <button type="button" class="btn btn-secondary" onclick="document.getElementById('module-dialog-modal').style.display='none'">Batal</button>
                <button type="button" class="btn btn-primary" onclick="document.getElementById('module-dialog-modal').style.display='none'; renderFullPageModuleWorkspace('receipt', '7. 🧾 Kwitansi Pembayaran');">Simpan & Buat Kwitansi</button>
            </div>
        </div>
    `;
};

window.openPrintPreviewModal = function(moduleKey, id) {
    const modal = document.getElementById('module-dialog-modal');
    const modalBody = document.getElementById('modal-body');
    const modalTitle = document.getElementById('modal-title');
    if (!modalBody) return;
    if (modal) modal.style.display = 'flex';

    const activeCompName = (window.currentUser && window.currentUser.company_name && window.currentUser.company_name !== 'System Global')
        ? window.currentUser.company_name
        : ((appState && appState.impersonateTargetName) ? appState.impersonateTargetName : 'PERUSAHAAN');
    
    const formatRupiah = (val) => 'Rp ' + Number(val || 0).toLocaleString('id-ID');
    
    let htmlContent = '';
    
    if (moduleKey === 'bast') {
        modalTitle.textContent = '📑 CETAK A4: BAST Pekerjaan';
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
                                    <strong style="font-size: 14px; color: #000;">${activeCompName.toUpperCase()}</strong>
                                </div>
                            </div>
                        </td>
                        <td style="width: 50%; padding: 8px;">
                            <div style="font-weight: 700; font-size: 11px; text-transform: uppercase; margin-bottom: 4px;">PEMBERI TUGAS</div>
                            <div style="display: flex; align-items: center; justify-content: center; gap: 8px;">
                                <svg width="32" height="32" viewBox="0 0 100 100" fill="#9333ea"><path d="M20 50 L50 20 L80 50 L50 80 Z"/></svg>
                                <div style="text-align: left; font-family: sans-serif;">
                                    <strong style="font-size: 12px; color: #555;">CLIENT / KLIEN PERUSAHAAN</strong>
                                </div>
                            </div>
                        </td>
                    </tr>
                    <tr style="border-bottom: 1.5px solid #000; font-weight: 700; text-align: center;">
                        <td style="padding: 6px; border-right: 1.5px solid #000; font-style: italic;">${activeCompName}</td>
                        <td style="padding: 6px; font-style: italic;">CLIENT / KLIEN PERUSAHAAN</td>
                    </tr>
                    <tr style="background: #e5e7eb; border-bottom: 1.5px solid #000; text-align: center; font-weight: 700; font-style: italic; font-size: 14px;">
                        <td colspan="2" style="padding: 8px;">BERITA ACARA SERAH TERIMA PEKERJAAN</td>
                    </tr>
                    <tr style="font-style: italic; font-size: 12px;">
                        <td style="padding: 4px 8px; border-right: 1.5px solid #000;">
                            <div>NOMOR : 01/BAST/2026</div>
                            <div>TANGGAL : ${new Date().toLocaleDateString('id-ID')}</div>
                            <div>LAMPIRAN : 1 Set</div>
                        </td>
                        <td style="padding: 4px 8px;">
                            <div>NO. PO/SPMK : -</div>
                            <div>TANGGAL : -</div>
                        </td>
                    </tr>
                </table>

                <!-- BODY TEXT -->
                <p style="text-align: justify; margin-bottom: 16px;">
                    Pada hari ini, telah dilaksanakan Serah Terima Pekerjaan sesuai dengan Surat Perintah Kerja, kami yang bertanda tangan di bawah ini:
                </p>

                <div style="margin-left: 20px; margin-bottom: 16px;">
                    <p style="margin: 0 0 4px 0;">CLIENT / KLIEN PERUSAHAAN, dalam hal ini diwakili oleh</p>
                    <table style="margin-left: 20px; font-size: 13px;">
                        <tr><td style="width: 20px;">I</td><td style="width: 80px;">Nama</td><td>: ( Nama Perwakilan Klien )</td></tr>
                        <tr><td></td><td>Jabatan</td><td>: Perwakilan Klien</td></tr>
                    </table>
                    <p style="margin: 4px 0 0 0; font-weight: 700;">Dalam hal ini mewakili KLIEN selanjutnya disebut sebagai PIHAK PERTAMA</p>
                </div>

                <div style="margin-left: 20px; margin-bottom: 16px;">
                    <p style="margin: 0 0 4px 0;">${activeCompName}, dalam hal ini diwakili oleh</p>
                    <table style="margin-left: 20px; font-size: 13px;">
                        <tr><td style="width: 20px;">II</td><td style="width: 80px;">Nama</td><td>: Penanggung Jawab Proyek</td></tr>
                        <tr><td></td><td>Jabatan</td><td>: Direktur Utama</td></tr>
                    </table>
                    <p style="margin: 4px 0 0 0; font-weight: 700;">Dalam hal ini mewakili ${activeCompName} selanjutnya disebut sebagai PIHAK KEDUA</p>
                </div>

                <p style="margin-bottom: 8px;">Berdasarkan:</p>
                <ol style="margin-top: 0; padding-left: 25px; text-align: justify; line-height: 1.6;">
                    <li style="margin-bottom: 8px;">
                        Surat Perintah Mulai Kerja dari <strong>PIHAK PERTAMA</strong> kepada <strong>PIHAK KEDUA</strong>;
                    </li>
                    <li>
                        Hasil dari Pekerjaan telah sesuai dan diterima dengan baik oleh <strong>PIHAK PERTAMA</strong>.
                    </li>
                </ol>

                <!-- SIGNATURE SECTION -->
                <div style="display: flex; justify-content: space-between; margin-top: 50px; text-align: center;">
                    <div style="width: 45%;">
                        <p style="margin-bottom: 70px;">PIHAK PERTAMA<br><strong>CLIENT / KLIEN PERUSAHAAN</strong></p>
                        <p style="font-weight: 700; text-decoration: underline; margin: 0;">( Nama Perwakilan Klien )</p>
                        <p style="margin: 0; font-size: 11px;">Perwakilan Klien</p>
                    </div>
                    <div style="width: 45%;">
                        <p style="margin-bottom: 70px;">PIHAK KEDUA<br><strong>${activeCompName}</strong></p>
                        <p style="font-weight: 700; text-decoration: underline; margin: 0;">Penanggung Jawab Proyek</p>
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
                                <strong style="font-size: 16px; color: #000; font-weight: 800;">${activeCompName.toUpperCase()}</strong>
                            </div>
                        </div>
                        <div style="text-align: right; font-size: 11px; color: #333;">
                            Alamat Operasional Perusahaan<br>
                            Kontak Perusahaan
                        </div>
                    </div>

                    <div style="text-align: center; margin-bottom: 20px;">
                        <h3 style="margin: 0; text-decoration: underline; font-size: 16px; font-weight: 800; letter-spacing: 1px;">TANDA TERIMA</h3>
                        <p style="margin: 4px 0 0 0; font-size: 13px;">No : TTB/2026/09/005 ...........................................</p>
                    </div>

                    <div style="line-height: 2.2; font-size: 13px; margin-bottom: 20px;">
                        <div>Telah di terima dari : ........................................................................................................................................</div>
                        <div>Berupa : ........................................................................................................................................</div>
                        <div style="border-bottom: 1px dotted #888; height: 25px;"></div>
                        <div style="border-bottom: 1px dotted #888; height: 25px;"></div>
                    </div>

                    <div style="text-align: right; margin-bottom: 20px; font-size: 13px;">
                        Tanggal: ............................................
                    </div>

                    <div style="display: flex; justify-content: space-around; text-align: center; font-size: 13px;">
                        <div>
                            <p style="margin-bottom: 50px;">Pengirim</p>
                            <p>( .................................... )</p>
                        </div>
                        <div>
                            <p style="margin-bottom: 50px;">Penerima</p>
                            <p>( .................................... )</p>
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
                                <strong style="font-size: 16px; color: #000; font-weight: 800;">${activeCompName.toUpperCase()}</strong>
                            </div>
                        </div>
                        <div style="text-align: right; font-size: 11px; color: #333;">
                            Alamat Operasional Perusahaan<br>
                            Kontak Perusahaan
                        </div>
                    </div>

                    <div style="text-align: center; margin-bottom: 20px;">
                        <h3 style="margin: 0; text-decoration: underline; font-size: 16px; font-weight: 800; letter-spacing: 1px;">TANDA TERIMA</h3>
                        <p style="margin: 4px 0 0 0; font-size: 13px;">No : TTB/2026/09/005 ...........................................</p>
                    </div>

                    <div style="line-height: 2.2; font-size: 13px; margin-bottom: 20px;">
                        <div>Telah di terima dari : ........................................................................................................................................</div>
                        <div>Berupa : ........................................................................................................................................</div>
                        <div style="border-bottom: 1px dotted #888; height: 25px;"></div>
                        <div style="border-bottom: 1px dotted #888; height: 25px;"></div>
                    </div>

                    <div style="text-align: right; margin-bottom: 20px; font-size: 13px;">
                        Tanggal: ............................................
                    </div>

                    <div style="display: flex; justify-content: space-around; text-align: center; font-size: 13px;">
                        <div>
                            <p style="margin-bottom: 50px;">Pengirim</p>
                            <p>( .................................... )</p>
                        </div>
                        <div>
                            <p style="margin-bottom: 50px;">Penerima</p>
                            <p>( .................................... )</p>
                        </div>
                    </div>
                </div>

                <div style="margin-top: 30px; text-align: right;" class="no-print">
                    <button type="button" class="btn btn-primary" onclick="window.print()" style="background: #0284c7; border: none; padding: 8px 16px; font-weight: 700;">🖨️ Cetak TTB (2 Rangkap) Ke PDF / Printer A4</button>
                </div>
            </div>
        `;
    } else if (moduleKey === 'do') {
        const item = (window.moduleStore && window.moduleStore.do) ? (window.moduleStore.do.find(x => x.id == id) || window.moduleStore.do[0]) : {};
        const doNo = item.do_no || 'DO/2026/08/099';
        const doDate = item.do_date || new Date().toISOString().split('T')[0];
        const customer = item.customer_name || 'PT. MANDIRI SEJAHTERA';
        const salesRole = item.sales_role || 'Sales';
        const salesName = item.sales_name || 'Fevi Aprianti';
        const driver = item.driver_name || 'Supriyadi';
        const vehicle = item.vehicle_no || 'B 9128 UXX';
        const fromLoc = item.from_location || 'JKT/Stock Gudang Utama';
        const fromAddr = item.from_address || 'Jl. Matahari Raya No. 480, Jakasetia, Bekasi Selatan, Kota Bekasi';
        const address = item.delivery_address || 'Jl. Industri Raya No. 45, Blok B-2, Cikarang Selatan, Jawa Barat';

        const itemRows = (item.items && item.items.length > 0) ? item.items.map((it, idx) => `
            <tr>
                <td style="padding: 8px; text-align: center;">${idx + 1}</td>
                <td style="padding: 8px;">${it.part_no || it.kode || '-'}</td>
                <td style="padding: 8px;">${it.description || it.nama_barang || '-'}</td>
                <td style="padding: 8px; text-align: right;">${it.qty || 1}.00</td>
                <td style="padding: 8px; text-align: center;">${it.unit || it.satuan || 'PCS'}</td>
            </tr>
        `).join('') : `
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
        `;

        modalTitle.textContent = '🚚 CETAK A4: Delivery Order (template DO.pdf)';
        htmlContent = `
            <div style="background: #ffffff; color: #000000; padding: 30px; border-radius: 4px; box-shadow: 0 5px 20px rgba(0,0,0,0.4); font-family: Arial, sans-serif; font-size: 12px; max-width: 850px; margin: 0 auto; border: 1px solid #ccc;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 20px;">
                    <!-- LEFT COLUMN -->
                    <div style="width: 48%;">
                        <h2 style="margin: 0 0 10px 0; font-size: 18px; font-weight: 700; color: #000;">${activeCompName}</h2>
                        <table style="font-size: 12px; line-height: 1.5;">
                            <tr><td style="width: 100px;">From Location</td><td>: <strong>${fromLoc || '-'}</strong></td></tr>
                            <tr><td style="vertical-align: top;">Address</td><td>: ${fromAddr || '-'}</td></tr>
                            <tr><td>Phone & Fax</td><td>: </td></tr>
                            <tr><td>Delivery Date</td><td>: <strong>${doDate}</strong></td></tr>
                            <tr><td>Delivery No</td><td>: <strong>${doNo}</strong></td></tr>
                            <tr><td>Plat Kendaraan</td><td>: <strong>${vehicle || '-'}</strong></td></tr>
                        </table>
                    </div>

                    <!-- RIGHT COLUMN -->
                    <div style="width: 48%;">
                        <h2 style="margin: 0 0 10px 0; font-size: 22px; font-weight: 400; color: #000; text-align: left;">Delivery Order</h2>
                        <table style="font-size: 12px; line-height: 1.5; width: 100%;">
                            <tr><td style="width: 80px;">Customer</td><td>: <strong>${customer || '-'}</strong></td></tr>
                            <tr><td style="vertical-align: top;">Driver Name</td><td>: <strong>${driver || '-'}</strong></td></tr>
                            <tr><td>${salesRole || 'Officer'}</td><td>: <strong>${salesName || '-'}</strong></td></tr>
                        </table>
                        <div style="margin-top: 8px;">
                            <strong>Shipped To :</strong>
                            <div style="border: 1px solid #000; padding: 8px; font-weight: 700; margin-top: 4px; background: #fff;">
                                ${address || '-'}
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
                        ${itemRows}
                    </tbody>
                </table>

                <div style="font-size: 13px; margin-bottom: 20px; border-bottom: 1px solid #000; padding-bottom: 4px;">
                    <strong>Note: Tidak menerima dalam bentuk pembayaran tunai.</strong>
                </div>

                <!-- SIGNATURE SECTION -->
                <div style="display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 30px;">
                    <div style="width: 45%;">
                        <p style="margin: 0 0 4px 0; font-weight: 700;">Delivered By :</p>
                        <p style="margin: 0 0 40px 0; font-weight: 700;">${activeCompName}</p>
                        <div>Officer (${salesRole || 'Officer'}) : ${salesName || '-'}</div>
                        <div>Driver Name : ${driver || '-'} (${vehicle || '-'})</div>
                        <div>Signature : </div>
                    </div>
                    <div style="width: 45%;">
                        <p style="margin: 0 0 4px 0; font-weight: 700;">Received By :</p>
                        <p style="margin: 0 0 40px 0; font-weight: 700;">${customer || '-'}</p>
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
        const item = (window.moduleStore && window.moduleStore.invoice) ? (window.moduleStore.invoice.find(x => x.id == id) || window.moduleStore.invoice[0]) : {};
        const invNo = (item && item.invoice_no) || 'INV/2026/09/001';
        const invDate = (item && item.invoice_date) || new Date().toISOString().split('T')[0];
        const customer = (item && item.customer_name) || '-';
        const upPerson = (item && item.up_person) || 'Bagian Keuangan';
        const custAddress = (item && item.customer_address) || '-';
        const poRef = (item && item.po_reference) || '-';
        const descText = (item && item.description) || '-';
        const notesText = (item && item.payment_notes) || 'Pembayaran transfer ke Rekening Resmi atas nama Perusahaan.';
        const companyName = activeCompName;
        const subtotal = Number((item && item.subtotal) || 0);
        const taxRate = Number((item && item.tax_rate_percent !== undefined) ? item.tax_rate_percent : 11);
        const taxAmount = (subtotal * taxRate) / 100;
        const grandTotal = subtotal + taxAmount;

        const descFormatted = String(descText).replace(/\n/g, '<br>');
        const notesFormatted = String(notesText).replace(/\n/g, '<br>');

        modalTitle.textContent = '💳 CETAK A4: Invoice Penagihan (' + invNo + ')';
        htmlContent = `
            <div style="background: #ffffff; color: #000000; padding: 25px; border-radius: 4px; box-shadow: 0 5px 20px rgba(0,0,0,0.4); font-family: Arial, sans-serif; font-size: 12px; max-width: 850px; margin: 0 auto; border: 1.5px solid #000;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <svg width="36" height="36" viewBox="0 0 100 100" fill="#0284c7"><path d="M20 20 L50 80 L80 20 L60 20 L50 60 L30 20 Z"/></svg>
                        <strong style="font-size: 16px; color: #000; font-weight: 800;">${companyName}</strong>
                    </div>
                </div>

                <table style="width: 100%; border-collapse: collapse; border: 1.5px solid #000; margin-bottom: 0;">
                    <tr style="border-bottom: 1.5px solid #000; background: #fff; text-align: center;">
                        <td style="width: 50%; padding: 8px; border-right: 1.5px solid #000; font-weight: 800; font-size: 18px; text-align: left;">INVOICE PENAGIHAN</td>
                        <td style="width: 50%; padding: 8px; font-weight: 800; font-size: 15px; text-align: right; font-style: italic;">${companyName}</td>
                    </tr>
                    <tr style="border-bottom: 1.5px solid #000; vertical-align: top;">
                        <td style="padding: 8px; border-right: 1.5px solid #000; width: 50%;">
                            <table style="font-size: 11px; line-height: 1.5;">
                                <tr><td style="width: 80px;">Kepada</td><td>: <strong>${customer}</strong></td></tr>
                                <tr><td>Up. Yth.</td><td>: <strong>${upPerson}</strong></td></tr>
                                <tr><td style="vertical-align: top;">Alamat</td><td>: ${custAddress}</td></tr>
                                <tr><td>SPK / PO</td><td>: <strong>${poRef}</strong></td></tr>
                            </table>
                        </td>
                        <td style="padding: 8px; width: 50%;">
                            <table style="font-size: 11px; line-height: 1.5;">
                                <tr><td style="width: 110px;">No. Invoice</td><td>: <strong>${invNo}</strong></td></tr>
                                <tr><td>Tanggal Invoice</td><td>: ${invDate}</td></tr>
                                <tr><td>Mata Uang</td><td>: IDR</td></tr>
                                <tr><td>Metode Pembayaran</td><td>: <strong>Transfer Bank / Tunai</strong></td></tr>
                            </table>
                        </td>
                    </tr>
                </table>

                <!-- TABLE ITEMS WITH VERTICAL LINES -->
                <table style="width: 100%; border-collapse: collapse; border-left: 1.5px solid #000; border-right: 1.5px solid #000; border-bottom: 1.5px solid #000; min-height: 180px;">
                    <thead>
                        <tr style="border-bottom: 1.5px solid #000; font-weight: 700; text-align: center; background: #f8fafc;">
                            <td style="padding: 6px; width: 30px; border-right: 1px solid #000;">No.</td>
                            <td style="padding: 6px; border-right: 1px solid #000;">Nama Barang / Rincian Deskripsi Pekerjaan</td>
                            <td style="padding: 6px; width: 40px; border-right: 1px solid #000;">Vol</td>
                            <td style="padding: 6px; width: 60px; border-right: 1px solid #000;">Satuan</td>
                            <td style="padding: 6px; width: 100px; border-right: 1px solid #000;">Harga (Rp)</td>
                            <td style="padding: 6px; width: 110px;">Sub Total (Rp)</td>
                        </tr>
                    </thead>
                    <tbody style="vertical-align: top;">
                        <tr>
                            <td style="padding: 8px; text-align: center; border-right: 1px solid #000; vertical-align: top;">1</td>
                            <td style="padding: 8px; border-right: 1px solid #000; vertical-align: top; line-height: 1.5;">${descFormatted}</td>
                            <td style="padding: 8px; text-align: center; border-right: 1px solid #000; vertical-align: top;">1</td>
                            <td style="padding: 8px; text-align: center; border-right: 1px solid #000; vertical-align: top;">Paket</td>
                            <td style="padding: 8px; text-align: right; border-right: 1px solid #000; vertical-align: top;">${formatRupiah(subtotal)}</td>
                            <td style="padding: 8px; text-align: right; vertical-align: top;">${formatRupiah(subtotal)}</td>
                        </tr>
                    </tbody>
                </table>

                <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
                    <tr>
                        <td style="vertical-align: top; width: 55%; padding-right: 16px;">
                            <strong style="font-size: 11px;">Catatan & Rekening Pembayaran:</strong>
                            <div style="font-size: 11px; border: 1px solid #94a3b8; padding: 8px; margin-top: 4px; background: #f8fafc; border-radius: 4px; line-height: 1.4;">
                                ${notesFormatted}
                            </div>
                        </td>
                        <td style="vertical-align: top; width: 45%;">
                            <table style="width: 100%; font-size: 11.5px; border-collapse: collapse;">
                                <tr>
                                    <td style="padding: 4px; border: 1px solid #000;">Sub Total</td>
                                    <td style="padding: 4px; border: 1px solid #000; text-align: right;">${formatRupiah(subtotal)}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 4px; border: 1px solid #000;">PPN (${taxRate}%)</td>
                                    <td style="padding: 4px; border: 1px solid #000; text-align: right;">${formatRupiah(taxAmount)}</td>
                                </tr>
                                <tr style="font-weight: 800; background: #e0f2fe;">
                                    <td style="padding: 6px; border: 1.5px solid #000;">GRAND TOTAL</td>
                                    <td style="padding: 6px; border: 1.5px solid #000; text-align: right; font-size: 13px;">${formatRupiah(grandTotal)}</td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>

                <div style="display: flex; justify-content: flex-end; margin-top: 20px;">
                    <div style="text-align: center; width: 220px;">
                        <p style="margin: 0 0 50px 0; font-size: 11px;">Hormat Kami,<br><strong>${companyName}</strong></p>
                        <p style="font-weight: 700; text-decoration: underline; margin: 0;">( Signer Keuangan )</p>
                        <p style="margin: 0; font-size: 10px; color: #555;">Finance / Accounting</p>
                    </div>
                </div>

                <div style="margin-top: 20px; text-align: right;" class="no-print">
                    <button type="button" class="btn btn-primary" onclick="window.print()" style="background: #0284c7; border: none; padding: 8px 16px; font-weight: 700;">🖨️ Cetak Invoice Ke PDF / Printer A4</button>
                </div>
            </div>
        `;
    } else if (moduleKey === 'receipt') {
        const item = (window.moduleStore && window.moduleStore.receipt) ? (window.moduleStore.receipt.find(x => x.id == id) || window.moduleStore.receipt[0]) : {};
        const recNo = (item && item.receipt_no) || 'KWT/2026/09/001';
        const recDate = (item && item.receipt_date) || new Date().toISOString().split('T')[0];
        const recFrom = (item && item.received_from) || '-';
        const recAmount = Number((item && item.amount) || 0);
        const recSpelled = (item && item.amount_spelled) || '-';
        const recFor = (item && item.payment_for) || '-';

        modalTitle.textContent = '🧾 CETAK A4: Kwitansi Pembayaran (Auto Terbilang Rp)';
        htmlContent = `
            <div style="background: #ffffff; color: #000000; padding: 30px; border-radius: 4px; box-shadow: 0 5px 20px rgba(0,0,0,0.4); font-family: Arial, sans-serif; font-size: 13px; max-width: 850px; margin: 0 auto; border: 2px solid #0284c7;">
                <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #0284c7; padding-bottom: 10px; margin-bottom: 20px;">
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <svg width="40" height="40" viewBox="0 0 100 100" fill="#0284c7"><path d="M20 20 L50 80 L80 20 L60 20 L50 60 L30 20 Z"/></svg>
                        <div>
                            <strong style="font-size: 18px; color: #0284c7; font-weight: 800;">${activeCompName}</strong>
                        </div>
                    </div>
                    <div style="text-align: right;">
                        <span style="font-size: 20px; font-weight: 800; letter-spacing: 2px; color: #000;">KWITANSI</span>
                        <p style="margin: 2px 0 0 0; font-weight: 700; font-size: 12px; color: #555;">NO: ${recNo}</p>
                    </div>
                </div>

                <table style="width: 100%; font-size: 13px; line-height: 2.0; margin-bottom: 30px;">
                    <tr>
                        <td style="width: 180px; font-weight: 700;">Telah Diterima Dari</td>
                        <td>: <strong>${recFrom}</strong></td>
                    </tr>
                    <tr>
                        <td style="font-weight: 700; vertical-align: top;">Uang Sejumlah (Terbilang)</td>
                        <td>: <span style="background: #fef08a; padding: 4px 8px; border-radius: 4px; font-weight: 700; font-style: italic;">"${recSpelled}"</span></td>
                    </tr>
                    <tr>
                        <td style="font-weight: 700; vertical-align: top;">Untuk Pembayaran</td>
                        <td>: ${recFor}</td>
                    </tr>
                </table>

                <div style="display: flex; justify-content: space-between; align-items: flex-end;">
                    <div style="border: 2px solid #0284c7; background: #e0f2fe; padding: 12px 24px; font-size: 20px; font-weight: 800; color: #0369a1;">
                        ${formatRupiah(recAmount)}
                    </div>
                    <div style="text-align: center; width: 220px;">
                        <p style="margin: 0 0 50px 0; font-size: 12px;">Tanggal: ${recDate}<br><strong>${activeCompName}</strong></p>
                        <p style="font-weight: 700; text-decoration: underline; margin: 0;">( Otorisasi Keuangan )</p>
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
                        <h2 style="margin: 0; font-size: 18px; font-weight: 800; color: #0284c7;">${activeCompName}</h2>
                        <p style="margin: 4px 0 0 0; font-size: 11px; color: #555;">Alamat Operasional Perusahaan</p>
                    </div>
                    <div style="text-align: right;">
                        <h2 style="margin: 0; font-size: 20px; font-weight: 800; text-transform: uppercase;">PURCHASE ORDER</h2>
                        <p style="margin: 4px 0 0 0; font-weight: 700;">PO NO: PO/2026/09/001</p>
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
                            <td style="padding: 8px;">Material & Barang Logistic Order</td>
                            <td style="padding: 8px; text-align: center;">1</td>
                            <td style="padding: 8px; text-align: center;">Pcs</td>
                            <td style="padding: 8px; text-align: right;">0</td>
                            <td style="padding: 8px; text-align: right;">0</td>
                        </tr>
                    </tbody>
                </table>

                <div style="display: flex; justify-content: space-between; margin-top: 40px; text-align: center;">
                    <div>
                        <p style="margin-bottom: 50px;">Vendor / Supplier</p>
                        <p style="font-weight: 700;">( Vendor Supplier )</p>
                    </div>
                    <div>
                        <p style="margin-bottom: 50px;">${activeCompName}</p>
                        <p style="font-weight: 700; text-decoration: underline;">( Authorized Signer )</p>
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

