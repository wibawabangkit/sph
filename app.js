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
    sigWidth: 170,
    sigLeft: 10,
    customStamp: null, // Base64 data of custom stamp
    customStampName: "", // File name
    customSig: null,   // Base64 data of custom signature
    customSigName: "",   // File name
    companyAddress: "Jl. Alamat Dummy No. 123, Kota Fiktif, Provinsi - 12345",
    customLogo: null,    // Base64 data of custom logo
    customLogoName: "",  // File name
    themeColor: "#00A2E2", // Default brand color
    items: [
        { deskripsi: "", harga: 0, qty: 1 }
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
    document.getElementById('input-company-address').value = appState.companyAddress;
    document.getElementById('input-narasi-pembuka').value = appState.narasiPembuka;
    document.getElementById('input-narasi-body').value = appState.narasiBody;
    document.getElementById('input-narasi-penutup').value = appState.narasiPenutup;
    document.getElementById('input-signer-name').value = appState.signerName;
    document.getElementById('input-signer-role').value = appState.signerRole;
    document.getElementById('input-theme-color').value = appState.themeColor || "#00A2E2";
    
    applyThemeColor(appState.themeColor || "#00A2E2");

    document.getElementById('chk-show-stamp').checked = appState.showStamp;
    document.getElementById('chk-show-sig').checked = appState.showSig;
    document.getElementById('chk-show-grand-total').checked = appState.showGrandTotal !== false;

    // Sync signature size and position inputs
    const currentSigWidth = appState.sigWidth || 170;
    document.getElementById('input-sig-width').value = currentSigWidth;
    document.getElementById('sig-width-val').textContent = currentSigWidth;

    const currentSigLeft = appState.sigLeft !== undefined ? appState.sigLeft : 10;
    document.getElementById('input-sig-left').value = currentSigLeft;
    document.getElementById('sig-left-val').textContent = currentSigLeft;

    // 2. Preview Layout Sync
    document.getElementById('view-no').textContent = appState.noSurat;
    document.getElementById('view-tanggal').textContent = appState.tanggal;
    document.getElementById('view-perihal').textContent = appState.perihal;
    document.getElementById('view-lampiran').textContent = appState.lampiran;
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

    // Overall visibility triggers
    document.getElementById('view-stamp').style.visibility = appState.showStamp ? 'visible' : 'hidden';
    document.getElementById('view-stamp-2').style.visibility = appState.showStamp ? 'visible' : 'hidden';
    document.getElementById('view-sig').style.visibility = appState.showSig ? 'visible' : 'hidden';
    document.getElementById('view-sig-2').style.visibility = appState.showSig ? 'visible' : 'hidden';

    // Apply dynamic signature sizing proportionally (aspect ratio 2:1) and positioning
    const currentSigHeight = currentSigWidth / 2;
    document.getElementById('view-sig').style.width = currentSigWidth + 'px';
    document.getElementById('view-sig').style.height = currentSigHeight + 'px';
    document.getElementById('view-sig').style.left = currentSigLeft + 'px';
    
    document.getElementById('view-sig-2').style.width = currentSigWidth + 'px';
    document.getElementById('view-sig-2').style.height = currentSigHeight + 'px';
    document.getElementById('view-sig-2').style.left = currentSigLeft + 'px';

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
}

// Render dynamic tables (both sidebar editors and Sheet 2 results)
function renderTable() {
    const editorContainer = document.getElementById('table-editor-container');
    const tableBody = document.getElementById('view-table-body');
    
    editorContainer.innerHTML = '';
    tableBody.innerHTML = '';
    
    let grandTotal = 0;

    appState.items.forEach((item, index) => {
        const itemTotal = (item.harga || 0) * (item.qty || 1);
        grandTotal += itemTotal;

        // --- 1. RENDER SIDEBAR CARD EDITOR ---
        const rowCard = document.createElement('div');
        rowCard.className = 'row-card';
        rowCard.innerHTML = `
            <div class="row-card-header">
                <span class="row-num-badge">Baris #${index + 1}</span>
                <button class="btn-row-delete" data-index="${index}">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                    Hapus
                </button>
            </div>
            <div class="form-group">
                <label>Deskripsi Pekerjaan</label>
                <textarea class="input-item-desc" data-index="${index}" rows="3" placeholder="Detail pekerjaan/barang">${item.deskripsi}</textarea>
            </div>
            <div class="form-grid">
                <div class="form-group">
                    <label>Harga (Rp)</label>
                    <input type="number" class="input-item-price" data-index="${index}" value="${item.harga}" placeholder="0">
                </div>
                <div class="form-group">
                    <label>Kuantitas (Qty)</label>
                    <input type="number" class="input-item-qty" data-index="${index}" value="${item.qty}" placeholder="1">
                </div>
            </div>
        `;
        editorContainer.appendChild(rowCard);

        // --- 2. RENDER TABLE PREVIEW ON SHEET 2 ---
        const tableRow = document.createElement('tr');
        tableRow.innerHTML = `
            <td class="text-center">${index + 1}</td>
            <td>${item.deskripsi || '-'}</td>
            <td class="text-right">${item.harga > 0 ? 'Rp ' + formatCurrency(item.harga) : '-'}</td>
            <td class="text-center">${item.qty || 0}</td>
            <td class="text-right font-bold">${itemTotal > 0 ? 'Rp ' + formatCurrency(itemTotal) : '-'}</td>
        `;
        tableBody.appendChild(tableRow);
    });

    // Update grand total in A4 preview
    document.getElementById('view-grand-total').textContent = 'Rp ' + formatCurrency(grandTotal);

    // Rebind dynamic row event listeners
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
        { id: 'input-company-address', key: 'companyAddress', targets: ['view-company-address', 'view-company-address-2'] },
        { id: 'input-narasi-pembuka', key: 'narasiPembuka', targetId: 'view-narasi-pembuka' },
        { id: 'input-narasi-penutup', key: 'narasiPenutup', targetId: 'view-narasi-penutup' },
        
        // Signers
        { id: 'input-signer-name', key: 'signerName', targets: ['view-signer-name', 'view-signer-name-2'] },
        { id: 'input-signer-role', key: 'signerRole', targets: ['view-signer-role', 'view-signer-role-2'] }
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
        appState.sigLeft = val;
        document.getElementById('sig-left-val').textContent = val;
        document.getElementById('view-sig').style.left = val + 'px';
        document.getElementById('view-sig-2').style.left = val + 'px';
        saveState();
    });

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

    // Add Row Click Trigger
    document.getElementById('btn-add-row').addEventListener('click', () => {
        appState.items.push({ deskripsi: "", harga: 0, qty: 1 });
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
    document.querySelectorAll('.input-item-desc').forEach(input => {
        input.addEventListener('input', (e) => {
            const idx = parseInt(e.target.dataset.index);
            appState.items[idx].deskripsi = e.target.value;
            saveState();
            
            const cells = document.querySelectorAll('#view-table-body tr');
            if (cells[idx]) {
                cells[idx].cells[1].textContent = e.target.value || '-';
            }
        });
    });

    document.querySelectorAll('.input-item-price').forEach(input => {
        input.addEventListener('input', (e) => {
            const idx = parseInt(e.target.dataset.index);
            appState.items[idx].harga = parseFloat(e.target.value) || 0;
            saveState();
            
            const rowTotal = appState.items[idx].harga * appState.items[idx].qty;
            const cells = document.querySelectorAll('#view-table-body tr');
            if (cells[idx]) {
                cells[idx].cells[2].textContent = appState.items[idx].harga > 0 ? 'Rp ' + formatCurrency(appState.items[idx].harga) : '-';
                cells[idx].cells[4].textContent = rowTotal > 0 ? 'Rp ' + formatCurrency(rowTotal) : '-';
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
            const cells = document.querySelectorAll('#view-table-body tr');
            if (cells[idx]) {
                cells[idx].cells[3].textContent = appState.items[idx].qty || 0;
                cells[idx].cells[4].textContent = rowTotal > 0 ? 'Rp ' + formatCurrency(rowTotal) : '-';
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
});
