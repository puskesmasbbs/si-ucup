# 📋 Si UCuP — Panduan Setup Lengkap
## Sistem Usulan Cuti Praktis | Puskesmas Banjarbaru Selatan

---

## 📁 Struktur File Proyek

```
si-ucup/
├── index.html              ← Halaman utama form
├── assets/
│   └── logo-sicuup.png     ← Logo Si UCuP (ganti dengan logo asli Puskesmas)
├── css/
│   └── style.css           ← Tampilan / desain form
├── js/
│   └── script.js           ← Logika form, validasi, WhatsApp
├── backend/
│   └── Code.gs             ← Google Apps Script (backend)
└── README.md               ← Panduan ini
```

---

## 🚀 LANGKAH SETUP (Ikuti urutan ini)

---

### LANGKAH 1 — Buat Google Spreadsheet

1. Buka [Google Sheets](https://sheets.google.com)
2. Klik **+ Spreadsheet kosong** (buat baru)
3. Beri nama: `Si UCuP - Data Izin Pegawai Non ASN`
4. Salin **ID spreadsheet** dari URL:
   ```
   https://docs.google.com/spreadsheets/d/[INI-ADALAH-ID-NYA]/edit
   ```
5. Simpan ID ini, akan dibutuhkan di Langkah 2

---

### LANGKAH 2 — Setup Google Apps Script

1. Buka [Google Apps Script](https://script.google.com)
2. Klik **+ Proyek baru**
3. Beri nama project: `SiUCuP Backend`
4. Hapus semua kode yang ada di editor
5. Copy semua isi file `backend/Code.gs` dan paste ke editor
6. **Ganti nilai ini** di baris paling atas kode:
   ```javascript
   var SPREADSHEET_ID = 'PASTE_SPREADSHEET_ID_ANDA';
   ```
   → Ganti `PASTE_SPREADSHEET_ID_ANDA` dengan ID dari Langkah 1

7. Klik **Simpan** (Ctrl+S)

8. **Test setup terlebih dahulu:**
   - Di dropdown fungsi (kanan atas editor), pilih `testSetup`
   - Klik tombol **▶ Jalankan**
   - Izinkan akses jika diminta
   - Cek di panel **Log Eksekusi** — harus muncul ✅

---

### LANGKAH 3 — Deploy Apps Script sebagai Web App

1. Di Apps Script editor, klik **Deploy** (kanan atas)
2. Pilih **Deployment baru**
3. Klik ikon ⚙️ lalu pilih **Web App**
4. Isi pengaturan:
   - **Deskripsi:** Si UCuP Web App v1
   - **Jalankan sebagai:** Saya (akun Google puskesmas)
   - **Siapa yang memiliki akses:** Siapa saja
5. Klik **Deploy**
6. Izinkan akses yang diminta
7. **Salin URL Web App** yang muncul (mulai dengan `https://script.google.com/macros/s/...`)

---

### LANGKAH 4 — Daftarkan URL ke Form

1. Buka file `js/script.js` dengan text editor (Notepad/VS Code)
2. Cari baris ini (ada di bagian atas file):
   ```javascript
   APPS_SCRIPT_URL: 'https://script.google.com/macros/s/PASTE_URL_ANDA_DI_SINI/exec',
   ```
3. Ganti `PASTE_URL_ANDA_DI_SINI` dengan URL dari Langkah 3
4. Simpan file

---

### LANGKAH 5 — Upload ke GitHub Pages

1. Buka akun GitHub Anda
2. Buat repository baru:
   - Nama: `si-ucup` (atau sesuai keinginan)
   - Visibility: **Public**
   - Jangan centang "Initialize this repository"
3. Upload semua file proyek ke repository:
   - Bisa drag & drop di GitHub web, atau gunakan Git
4. Setelah upload selesai, aktifkan GitHub Pages:
   - Buka tab **Settings** di repository
   - Scroll ke bagian **Pages** di sidebar kiri
   - **Source:** Deploy from a branch
   - **Branch:** `main` / folder: `/ (root)`
   - Klik **Save**
5. Tunggu 2-3 menit
6. GitHub Pages URL akan muncul:
   ```
   https://[username-github].github.io/si-ucup/
   ```
7. **Bagikan URL ini ke semua pegawai Non ASN**! ✅

---

## 🔄 Cara Kerja Sistem

```
Pegawai buka link GitHub Pages
          ↓
     Isi form Si UCuP
          ↓
     Klik "Kirim Permohonan"
          ↓
  Data dikirim ke Apps Script
          ↓
  ┌───────────────────────┐
  │  Apps Script          │
  │  • Simpan ke Sheets   │
  │  • Upload file Drive  │
  └───────────────────────┘
          ↓
  Halaman sukses tampil
          ↓
  Pegawai klik tombol WA
          ↓
  WhatsApp terbuka dengan
  pesan yang sudah terisi
          ↓
  Pegawai tekan Kirim ✅
```

---

## 💬 Contoh Pesan WhatsApp Otomatis

```
Assalamu'alaikum Wr. Wb.

Yth. Bapak/Ibu Pengelola Absen,

Dengan hormat, saya mengajukan permohonan izin/cuti:

Nama     : Siti Rahayu
NRTK     : 12345
Jabatan  : Perawat

Jenis Izin : Izin Sakit
Tanggal    : 6 Juni 2025 s.d. 7 Juni 2025 (2 hari)

📎 Bukti/Surat:
https://drive.google.com/file/d/xxx

Demikian permohonan ini saya sampaikan. Mohon kiranya
dapat dipertimbangkan dan disetujui.

Wassalamu'alaikum Wr. Wb.

Siti Rahayu
Pegawai Non ASN
Puskesmas Banjarbaru Selatan
```

---

## 📊 Tampilan Google Sheets (Rekap Absen)

| No | Timestamp | Nama | NRTK | Jabatan | Jenis Izin | Tgl Mulai | Tgl Akhir | Hari | Link Surat | Keterangan | Status |
|----|-----------|------|------|---------|------------|-----------|-----------|------|------------|------------|--------|
| 1 | 06/06/2025 08:30 | Siti R | 12345 | Perawat | Izin Sakit | 6 Juni 2025 | 7 Juni 2025 | 2 | [link] | - | Diajukan |

---

## 🖼️ Mengganti Logo

1. Siapkan file logo Puskesmas Banjarbaru Selatan
2. Rename menjadi `logo-sicuup.png`
3. Ganti file yang ada di folder `assets/`
4. Upload ulang ke GitHub

---

## ❓ FAQ & Troubleshooting

**Q: Form bisa diisi tapi data tidak masuk ke Spreadsheet?**
→ Pastikan URL Apps Script sudah benar di `js/script.js`
→ Pastikan Apps Script sudah di-deploy ulang setelah ada perubahan

**Q: File surat gagal terupload?**
→ Ukuran file maks 10 MB
→ Format yang didukung: JPG, PNG, PDF, DOC, DOCX

**Q: Pesan WhatsApp tidak otomatis terisi?**
→ Pastikan WhatsApp sudah terinstall di HP
→ Di desktop, gunakan WhatsApp Web

**Q: Bagaimana cara update form (misal tambah jenis izin)?**
→ Edit file `index.html` bagian radio button jenis izin
→ Upload ulang ke GitHub

**Q: Apakah ada biaya?**
→ **TIDAK ADA.** Semua komponen 100% gratis selamanya.

---

## 📞 Informasi Kontak Sistem

| Tujuan | Nomor WhatsApp |
|--------|---------------|
| Pengelola Absen | 0852-5168-6868 |
| Kepala Tata Usaha | 0812-5103-3993 |

---

*Si UCuP v1.0 — Puskesmas Banjarbaru Selatan*
