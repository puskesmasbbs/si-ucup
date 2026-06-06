/* ============================================
   Si UCuP — script.js
   Form Logic, Validation, API, WhatsApp
   ============================================ */
'use strict';
// -----------------------------------------------
// KONFIGURASI — GANTI SESUAI KEBUTUHAN
// -----------------------------------------------
const CONFIG = {
  // URL Google Apps Script Web App Anda
  // Setelah deploy Apps Script, copy URL-nya ke sini
  APPS_SCRIPT_URL: 'https://script.google.com/macros/s/AKfycby914TdnME8Uzd0OPAcc_z6gXjhqVjm96gSZT1rOYCTg8uaNWDpPl6OrZ1iOdU_y2GFLw/exec',
  // Nomor WhatsApp (format: 62xxxxxxxxxxx)
  WA_PENGELOLA: '6285251686868',  // Pengelola Absen
  WA_KEPALA_TU: '6281251033993', // Kepala Tata Usaha
  // Nama penerima (untuk pesan WA)
  NAMA_PENGELOLA: 'Pengelola Absen',
  NAMA_KEPALA_TU: 'Kepala Tata Usaha',
  // Batas upload file (dalam byte) — default 10 MB
  MAX_FILE_SIZE: 10 * 1024 * 1024,
};
// -----------------------------------------------
// State global
let selectedFile = null;
let submissionData = null;
// -----------------------------------------------
// INISIALISASI
// -----------------------------------------------
document.addEventListener('DOMContentLoaded', function () {
  initTanggal();
  initJenisIzin();
  initUpload();
  initKeterangan();
});
// -----------------------------------------------
// TANGGAL — Set min date & auto-hitung durasi
// -----------------------------------------------
function initTanggal() {
  const today = new Date().toISOString().split('T')[0];
  const tglMulai = document.getElementById('tglMulai');
  const tglAkhir = document.getElementById('tglAkhir');
  // Default tanggal hari ini
  tglMulai.value = today;
  tglAkhir.value = today;
  tglMulai.min = today;
  tglMulai.addEventListener('change', hitungDurasi);
  tglAkhir.addEventListener('change', hitungDurasi);
  hitungDurasi();
}
function hitungDurasi() {
  const tglMulai = document.getElementById('tglMulai').value;
  const tglAkhir = document.getElementById('tglAkhir').value;
  const badge    = document.getElementById('durasiBadge');
  const errTgl   = document.getElementById('err-tanggal');
  clearError('err-tanggal');
  if (!tglMulai || !tglAkhir) {
    badge.classList.remove('show');
    return;
  }
  const start = new Date(tglMulai);
  const end   = new Date(tglAkhir);
  const diff  = Math.floor((end - start) / (1000 * 60 * 60 * 24)) + 1;
  if (diff < 1) {
    showError('err-tanggal');
    badge.classList.remove('show');
    document.getElementById('tglAkhir').value = tglMulai;
    hitungDurasi();
    return;
  }
  badge.classList.add('show');
  document.getElementById('daysCount').textContent = diff;
  document.getElementById('daysLabel').textContent = diff === 1 ? ' hari izin' : ' hari izin';
  document.getElementById('daysRange').textContent =
    formatTanggal(tglMulai) + (diff > 1 ? ' — ' + formatTanggal(tglAkhir) : '');
  // Cek peringatan surat sakit jika sakit > 1 hari
  checkSakitWarning(diff);
}
// -----------------------------------------------
// JENIS IZIN — Radio logic & conditional fields
// -----------------------------------------------
function initJenisIzin() {
  const radios = document.querySelectorAll('input[name="jenisIzin"]');
  radios.forEach(r => r.addEventListener('change', onJenisIzinChange));
}
function onJenisIzinChange() {
  const val = getSelectedIzin();
  const lainnyaField = document.getElementById('izinLainnyaField');
  const sakitWarning = document.getElementById('sakitWarning');
  const uploadHint   = document.getElementById('uploadHintLabel');
  const uploadReq    = document.getElementById('uploadRequired');
  clearError('err-jenisIzin');
  clearError('err-keteranganIzin');
  // Toggle field izin lainnya
  lainnyaField.classList.toggle('show', val === 'Izin Lainnya');
  // Toggle peringatan sakit
  sakitWarning.classList.toggle('show', val === 'Izin Sakit');
  // Update upload hint
  if (val === 'Izin Sakit') {
    uploadHint.textContent = '(wajib jika >1 hari)';
    uploadReq.classList.add('show');
  } else if (val === 'Izin Melahirkan') {
    uploadHint.textContent = '(disarankan sertakan surat keterangan)';
    uploadReq.classList.remove('show');
  } else {
    uploadHint.textContent = '(opsional)';
    uploadReq.classList.remove('show');
  }
  // Recalculate warning
  const diff = getHariIzin();
  checkSakitWarning(diff);
}
function checkSakitWarning(jumlahHari) {
  const val       = getSelectedIzin();
  const uploadReq = document.getElementById('uploadRequired');
  if (val === 'Izin Sakit' && jumlahHari > 1) {
    uploadReq.classList.add('show');
  } else if (val !== 'Izin Sakit') {
    uploadReq.classList.remove('show');
  }
}
function getSelectedIzin() {
  const checked = document.querySelector('input[name="jenisIzin"]:checked');
  return checked ? checked.value : null;
}
function getHariIzin() {
  const tglMulai = document.getElementById('tglMulai').value;
  const tglAkhir = document.getElementById('tglAkhir').value;
  if (!tglMulai || !tglAkhir) return 0;
  const start = new Date(tglMulai);
  const end   = new Date(tglAkhir);
  return Math.max(1, Math.floor((end - start) / (1000 * 60 * 60 * 24)) + 1);
}
// -----------------------------------------------
// UPLOAD FILE — Drag & Drop + Input
// -----------------------------------------------
function initUpload() {
  const uploadArea   = document.getElementById('uploadArea');
  const fileInput    = document.getElementById('fileInput');
  const fileRemove   = document.getElementById('fileRemoveBtn');
  // Drag & drop
  uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.classList.add('drag-over');
  });
  uploadArea.addEventListener('dragleave', () => {
    uploadArea.classList.remove('drag-over');
  });
  uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.classList.remove('drag-over');
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  });
  // File input change
  fileInput.addEventListener('change', () => {
    if (fileInput.files[0]) handleFileSelect(fileInput.files[0]);
  });
  // Remove file
  fileRemove.addEventListener('click', (e) => {
    e.stopPropagation();
    removeFile();
  });
}
function handleFileSelect(file) {
  clearError('err-upload');
  // Validasi ukuran
  if (file.size > CONFIG.MAX_FILE_SIZE) {
    alert('❌ Ukuran file terlalu besar. Maksimal 10 MB.');
    return;
  }
  // Validasi tipe
  const allowed = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp',
                   'application/pdf', 'application/msword',
                   'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
  if (!allowed.includes(file.type) && !file.name.match(/\.(jpg|jpeg|png|pdf|doc|docx|webp)$/i)) {
    alert('❌ Format file tidak didukung. Gunakan JPG, PNG, PDF, atau DOC.');
    return;
  }
  selectedFile = file;
  // Update UI
  const uploadArea  = document.getElementById('uploadArea');
  const filePreview = document.getElementById('filePreview');
  const icon        = getFileIcon(file);
  document.getElementById('filePreviewIcon').textContent = icon;
  document.getElementById('filePreviewName').textContent = file.name;
  document.getElementById('filePreviewSize').textContent = formatFileSize(file.size);
  uploadArea.classList.add('has-file');
  document.getElementById('uploadIcon').textContent = '✅';
  document.getElementById('uploadTitle').textContent = 'File siap diunggah';
  document.getElementById('uploadSub').innerHTML = `<span style="color:var(--success)">Klik untuk ganti file</span>`;
  filePreview.classList.add('show');
}
function removeFile() {
  selectedFile = null;
  document.getElementById('fileInput').value = '';
  document.getElementById('filePreview').classList.remove('show');
  document.getElementById('uploadArea').classList.remove('has-file');
  document.getElementById('uploadIcon').textContent = '📂';
  document.getElementById('uploadTitle').textContent = 'Klik atau seret file ke sini';
  document.getElementById('uploadSub').innerHTML =
    'Format: JPG, PNG, PDF, DOC &nbsp;|&nbsp; Maks. <strong>10 MB</strong>';
}
function getFileIcon(file) {
  if (file.type.startsWith('image/')) return '🖼️';
  if (file.type === 'application/pdf') return '📕';
  if (file.type.includes('word')) return '📝';
  return '📄';
}
function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}
// -----------------------------------------------
// KETERANGAN — Character counter
// -----------------------------------------------
function initKeterangan() {
  const textarea = document.getElementById('keterangan');
  const counter  = document.getElementById('keteranganCount');
  textarea.addEventListener('input', () => {
    counter.textContent = textarea.value.length;
  });
}
// -----------------------------------------------
// VALIDASI FORM
// -----------------------------------------------
function validateForm() {
  let valid = true;
  // Reset semua error
  clearAllErrors();
  // Nama
  if (!getValue('nama')) { showError('err-nama'); markError('nama'); valid = false; }
  // NRTK
  if (!getValue('nrtk')) { showError('err-nrtk'); markError('nrtk'); valid = false; }
  // Jabatan
  if (!getValue('jabatan')) { showError('err-jabatan'); markError('jabatan'); valid = false; }
  // Jenis Izin
  const jenisIzin = getSelectedIzin();
  if (!jenisIzin) { showError('err-jenisIzin'); valid = false; }
  // Keterangan Izin Lainnya
  if (jenisIzin === 'Izin Lainnya' && !getValue('keteranganIzin')) {
    showError('err-keteranganIzin');
    markError('keteranganIzin');
    valid = false;
  }
  // Tanggal
  if (!getValue('tglMulai')) { showError('err-tglMulai'); markError('tglMulai'); valid = false; }
  if (!getValue('tglAkhir')) { showError('err-tglAkhir'); markError('tglAkhir'); valid = false; }
  // Upload wajib untuk sakit > 1 hari
  if (jenisIzin === 'Izin Sakit' && getHariIzin() > 1 && !selectedFile) {
    showError('err-upload'); valid = false;
  }
  return valid;
}
// -----------------------------------------------
// SUBMIT FORM
// -----------------------------------------------
async function submitForm() {
  if (!validateForm()) {
    // Scroll ke error pertama
    const firstError = document.querySelector('.error-msg.show');
    if (firstError) {
      firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    return;
  }
  // Kumpulkan data
  const jenisIzin       = getSelectedIzin();
  const keteranganIzin  = jenisIzin === 'Izin Lainnya' ? getValue('keteranganIzin') : '';
  const jumlahHari      = getHariIzin();
  const formData = {
    nama:           getValue('nama'),
    nrtk:           getValue('nrtk'),
    jabatan:        getValue('jabatan'),
    jenisIzin:      jenisIzin,
    keteranganIzin: keteranganIzin,
    tglMulai:       getValue('tglMulai'),
    tglAkhir:       getValue('tglAkhir'),
    jumlahHari:     jumlahHari,
    keterangan:     getValue('keterangan'),
    timestamp:      new Date().toLocaleString('id-ID'),
  };
  // Tampilkan loading
  showLoading(true);
  document.getElementById('submitBtn').disabled = true;
  try {
    let fileUrl = '';
    // ---- Jika ada file, encode base64 ----
    if (selectedFile) {
      const base64 = await fileToBase64(selectedFile);
      formData.file     = base64;
      formData.fileName = selectedFile.name;
      formData.fileType = selectedFile.type;
    }
    // ---- Kirim ke Google Apps Script ----
    if (CONFIG.APPS_SCRIPT_URL.includes('PASTE_URL')) {
      // Mode demo — tanpa Apps Script (untuk testing tampilan)
      console.warn('[Si UCuP] Apps Script URL belum dikonfigurasi. Berjalan dalam mode demo.');
      fileUrl = '';
      await sleep(1500); // simulasi loading
    } else {
      // Kirim dengan text/plain untuk menghindari CORS preflight
      const response = await fetch(CONFIG.APPS_SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify(formData),
        redirect: 'follow',
      });
      // Apps Script selalu return 200, cek konten responsenya
      const text = await response.text();
      let result;
      try {
        result = JSON.parse(text);
      } catch(_) {
        // Jika tidak bisa parse JSON tapi response ada = tetap sukses
        result = { success: true, fileUrl: '' };
      }
      if (result.success === false) throw new Error(result.error || 'Terjadi kesalahan');
      fileUrl = result.fileUrl || '';
    }
    // ---- Sukses — simpan data & tampilkan halaman sukses ----
    submissionData = { ...formData, fileUrl };
    showSuccessPage(submissionData);
  } catch (err) {
    console.error('[Si UCuP] Error:', err);
    alert('❌ Gagal mengirim data.\n\nError: ' + err.message + '\n\nPastikan koneksi internet Anda stabil dan coba lagi.');
    document.getElementById('submitBtn').disabled = false;
  } finally {
    showLoading(false);
  }
}
// -----------------------------------------------
// HALAMAN SUKSES
// -----------------------------------------------
function showSuccessPage(data) {
  // Sembunyikan form, tampilkan sukses
  document.getElementById('page-form').style.display = 'none';
  const successPage = document.getElementById('page-success');
  successPage.classList.add('show');
  successPage.scrollIntoView({ behavior: 'smooth', block: 'start' });
  // Render ringkasan
  renderSummary(data);
  // Build pesan WhatsApp
  const pesanPengelola = buildWaMessage(data, CONFIG.NAMA_PENGELOLA);
  const pesanKepalaTU  = buildWaMessage(data, CONFIG.NAMA_KEPALA_TU);
  document.getElementById('waBtn1').href =
    'https://wa.me/' + CONFIG.WA_PENGELOLA + '?text=' + encodeURIComponent(pesanPengelola);
  document.getElementById('waBtn2').href =
    'https://wa.me/' + CONFIG.WA_KEPALA_TU + '?text=' + encodeURIComponent(pesanKepalaTU);
}
function renderSummary(data) {
  const badgeClass = {
    'Izin Keperluan': 'keperluan',
    'Izin Sakit':     'sakit',
    'Izin Melahirkan':'melahirkan',
    'Izin Lainnya':   'lainnya',
  }[data.jenisIzin] || 'lainnya';
  const jenisDisplay = data.jenisIzin === 'Izin Lainnya' && data.keteranganIzin
    ? 'Izin Lainnya: ' + data.keteranganIzin
    : data.jenisIzin;
  const fileRow = data.fileUrl
    ? `<div class="summary-row">
        <span class="sr-label">📎 Surat</span>
        <span class="sr-value"><a href="${data.fileUrl}" target="_blank" style="color:var(--primary-mid);text-decoration:underline;">Lihat dokumen →</a></span>
       </div>`
    : (data.file ? `<div class="summary-row">
        <span class="sr-label">📎 Surat</span>
        <span class="sr-value" style="color:var(--text-muted);">File tersimpan di Google Drive</span>
       </div>` : '');
  document.getElementById('summaryBody').innerHTML = `
    <div class="summary-row">
      <span class="sr-label">👤 Nama</span>
      <span class="sr-value">${escHtml(data.nama)}</span>
    </div>
    <div class="summary-row">
      <span class="sr-label">🪪 NRTK</span>
      <span class="sr-value">${escHtml(data.nrtk)}</span>
    </div>
    <div class="summary-row">
      <span class="sr-label">💼 Jabatan</span>
      <span class="sr-value">${escHtml(data.jabatan)}</span>
    </div>
    <div class="summary-row">
      <span class="sr-label">📋 Jenis Izin</span>
      <span class="sr-value"><span class="jenis-badge ${badgeClass}">${escHtml(jenisDisplay)}</span></span>
    </div>
    <div class="summary-row">
      <span class="sr-label">📅 Tanggal</span>
      <span class="sr-value">${formatTanggal(data.tglMulai)} ${data.jumlahHari > 1 ? ' — ' + formatTanggal(data.tglAkhir) : ''} <strong>(${data.jumlahHari} hari)</strong></span>
    </div>
    ${data.keterangan ? `<div class="summary-row">
      <span class="sr-label">📝 Keterangan</span>
      <span class="sr-value">${escHtml(data.keterangan)}</span>
    </div>` : ''}
    ${fileRow}
    <div class="summary-row">
      <span class="sr-label">🕐 Waktu</span>
      <span class="sr-value" style="font-size:12px;color:var(--text-muted);">${data.timestamp}</span>
    </div>
  `;
}
// -----------------------------------------------
// PESAN WHATSAPP
// -----------------------------------------------
function buildWaMessage(data, namaPenerima) {
  const jenisDisplay = data.jenisIzin === 'Izin Lainnya' && data.keteranganIzin
    ? `Izin Lainnya (${data.keteranganIzin})`
    : data.jenisIzin;
  const tglInfo = data.jumlahHari > 1
    ? `${formatTanggal(data.tglMulai)} s.d. ${formatTanggal(data.tglAkhir)} (${data.jumlahHari} hari)`
    : `${formatTanggal(data.tglMulai)} (1 hari)`;
  const keteranganLine = data.keterangan
    ? `\nKeterangan   : ${data.keterangan}`
    : '';
  const fileLine = data.fileUrl
    ? `\n\n📎 *Bukti/Surat:*\n${data.fileUrl}`
    : '';
  return (
    `Assalamu'alaikum Wr. Wb.\n\n` +
    `Yth. Bapak/Ibu *${namaPenerima}*,\n\n` +
    `Dengan hormat, saya mengajukan permohonan izin/cuti:\n\n` +
    `*Nama*     : ${data.nama}\n` +
    `*NRTK*     : ${data.nrtk}\n` +
    `*Jabatan*  : ${data.jabatan}\n\n` +
    `*Jenis Izin* : ${jenisDisplay}\n` +
    `*Tanggal*    : ${tglInfo}` +
    `${keteranganLine}` +
    `${fileLine}\n\n` +
    `Demikian permohonan ini saya sampaikan. ` +
    `Mohon kiranya dapat dipertimbangkan dan disetujui.\n\n` +
    `Wassalamu'alaikum Wr. Wb.\n\n` +
    `_${data.nama}_\n` +
    `_Pegawai Non ASN_\n` +
    `_Puskesmas Banjarbaru Selatan_`
  );
}
// -----------------------------------------------
// RESET FORM
// -----------------------------------------------
function resetForm() {
  // Reset semua input
  document.getElementById('nama').value = '';
  document.getElementById('nrtk').value = '';
  document.getElementById('jabatan').value = '';
  document.querySelectorAll('input[name="jenisIzin"]').forEach(r => (r.checked = false));
  document.getElementById('keteranganIzin').value = '';
  document.getElementById('keterangan').value = '';
  document.getElementById('keteranganCount').textContent = '0';
  // Reset tanggal
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('tglMulai').value = today;
  document.getElementById('tglAkhir').value = today;
  // Reset file
  removeFile();
  clearAllErrors();
  // Reset conditional UI
  document.getElementById('izinLainnyaField').classList.remove('show');
  document.getElementById('sakitWarning').classList.remove('show');
  document.getElementById('uploadRequired').classList.remove('show');
  document.getElementById('uploadHintLabel').textContent = '(opsional)';
  hitungDurasi();
  // Reset submit button
  document.getElementById('submitBtn').disabled = false;
  submissionData = null;
  // Tampilkan kembali form
  document.getElementById('page-form').style.display = 'block';
  document.getElementById('page-success').classList.remove('show');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
// -----------------------------------------------
// HELPERS
// -----------------------------------------------
function getValue(id) {
  return (document.getElementById(id)?.value || '').trim();
}
function showError(id) {
  const el = document.getElementById(id);
  if (el) el.classList.add('show');
}
function clearError(id) {
  const el = document.getElementById(id);
  if (el) el.classList.remove('show');
}
function markError(id) {
  const el = document.getElementById(id);
  if (el) el.classList.add('error');
  el?.addEventListener('input', function onInput() {
    el.classList.remove('error');
    el.removeEventListener('input', onInput);
  }, { once: true });
}
function clearAllErrors() {
  document.querySelectorAll('.error-msg').forEach(e => e.classList.remove('show'));
  document.querySelectorAll('.form-control.error').forEach(e => e.classList.remove('error'));
}
function showLoading(show) {
  const overlay = document.getElementById('loadingOverlay');
  if (show) overlay.classList.add('show');
  else overlay.classList.remove('show');
}
function formatTanggal(dateStr) {
  if (!dateStr) return '-';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('id-ID', {
    day: 'numeric', month: 'long', year: 'numeric'
  });
}
function escHtml(str) {
  const div = document.createElement('div');
  div.textContent = str || '';
  return div.innerHTML;
}
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}
