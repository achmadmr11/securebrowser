# Secure Exam Browser (ExamEdu) - macOS Edition

Aplikasi peramban ujian aman (**Secure Exam Browser / CBT Kiosk**) untuk sistem operasi macOS. Dirancang untuk mencegah kecurangan ujian dengan mengunci layar penuh (Kiosk Mode), memblokir shortcut keyboard sistem macOS, menonaktifkan screenshot/screen recording, serta mengamankan navigasi ujian.

---

## Fitur Utama

- 🔒 **Kiosk Mode Penuh (Lockdown)**: Aplikasi berjalan pada mode layar penuh terproteksi, tidak dapat di-minimize atau disembunyikan.
- 🛡️ **Proteksi Tangkapan Layar (macOS Anti-Screenshot)**: Memanfaatkan API `setContentProtection` bawaan macOS untuk memblokir screenshot, screen recording, dan screen share.
- 🚫 **Pemblokiran Shortcut Sistem macOS**:
  - `Cmd + Q` (Quit)
  - `Cmd + W` (Close Window)
  - `Cmd + M` (Minimize)
  - `Cmd + H` (Hide)
  - `Cmd + Alt + I` / `F12` (Developer Tools)
  - `Cmd + R` / `F5` (Reload)
  - Klik Kanan (Context Menu) dinonaktifkan.
- ⚙️ **Pengaturan Admin Terproteksi**:
  - Ubah URL Portal Ujian CBT (Default: `https://cbtportal.smapluspgri.sch.id/`)
  - Ubah Judul Aplikasi
  - Akses: Tombol Admin di beranda / Klik tahan logo 1.5 detik / Shortcut `Cmd + Shift + A`
  - **Password Admin**: `admin123`
- 🚪 **Proteksi Keluar Ujian**:
  - Siswa tidak dapat keluar tanpa memasukkan password pengawas/proctor.
  - Akses: Tombol "Keluar Ujian" / Shortcut `Cmd + Shift + X` / Ketuk cepat 6 kali.
  - **Password Keluar**: `keluar123`
- 📦 **Mendukung Semua Chip Mac**: Kompatibel dengan Apple Silicon (**M1 / M2 / M3 / M4**) dan **Intel Mac**.

---

## Cara Menjalankan & Membangun Installer macOS

### 1. Menjalankan di Mode Pengembangan (Development)
```bash
# Pastikan dependensi telah terinstal
npm install

# Jalankan aplikasi
npm start
```

### 2. Membangun Installer macOS (.dmg & .zip) di Mac
Jalankan perintah berikut di komputer Mac (macOS):
```bash
npm run build:mac
```
Hasil installer `.dmg` dan file aplikasi `.app` akan tersimpan di folder `dist/`:
- `dist/Secure Exam Browser-1.0.0.dmg`
- `dist/Secure Exam Browser-1.0.0-mac.zip`

### 3. Pembangunan Otomatis via GitHub Actions (CI/CD)
Proyek ini sudah dilengkapi dengan alur kerja GitHub Actions di `.github/workflows/build-macos.yml`.
- Saat Anda push kode ke GitHub, GitHub Actions di runner macOS Apple akan otomatis membangun file `.dmg` dan menyediakannya di tab **Artifacts / Releases** untuk langsung di-download dan di-install.

---

## Cara Instalasi di macOS

1. Buka file `Secure Exam Browser-1.0.0.dmg`.
2. Geser / Drag ikon **Secure Exam Browser** ke folder **Applications**.
3. Buka aplikasi dari Launchpad atau folder Applications.
4. Jika muncul peringatan keamanan macOS Gatekeeper saat pertama kali dibuka:
   - Buka **System Settings** (Pengaturan Sistem) > **Privacy & Security** (Privasi & Keamanan).
   - Klik **Open Anyway** (Buka Saja) pada Secure Exam Browser.
