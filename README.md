# 🚀 Scraper EPrints AMIKOM - Fakultas Teknik Komputer

Web scraper untuk mengekstrak data artikel penelitian dari repositori EPrints AMIKOM Yogyakarta, khususnya dari Fakultas Ilmu Komputer > Teknik Komputer.

## 📋 Gambaran Umum

Scraper ini dapat mengekstrak data dari **379 artikel** yang tersedia di EPrints AMIKOM. Tool ini memiliki 2 mode operasi:

1. **Mode Testing** - Scrape beberapa artikel saja (untuk testing)
2. **Mode Production** - Scrape SEMUA artikel (379 artikel)

### ✨ Fitur Utama

- ✅ **Scraping Multi-Level**: Halaman utama → Halaman tahun → Detail artikel
- ✅ **Ekstraksi Data Lengkap**: Title, URL, tahun, kategori, dokumen, abstrak
- ✅ **Output CSV Terstruktur**: Format yang mudah dianalisis
- ✅ **Kategorisasi Otomatis**: Berdasarkan kata kunci dalam judul
- ✅ **Backup Otomatis**: Untuk scraping dalam jumlah besar
- ✅ **Error Handling**: Robust dengan retry mechanism
- ✅ **Progress Monitoring**: Real-time progress dan statistik

## 🛠 Instalasi

### Prasyarat

- [Bun](https://bun.sh) v1.2.17 atau lebih baru
- Node.js 18+ (opsional, jika tidak menggunakan Bun)
- Koneksi internet yang stabil

### Langkah Instalasi

1. **Clone atau download project**
2. **Install dependencies:**

```bash
bun install
```

3. **Verifikasi instalasi:**

```bash
bun run scrape.ts --help
```

## ⚙️ Konfigurasi

Edit bagian `CONFIG` di awal file `scrape.ts`:

```typescript
const CONFIG = {
  // Ubah nilai ini untuk mengatur jumlah artikel:
  MAX_ARTICLES_TO_SCRAPE: null, // null = semua artikel, angka = jumlah artikel

  BASE_URL: "https://eprints.amikom.ac.id/view/divisions/tk",
  DELAY_BETWEEN_REQUESTS: 2000, // Delay 2 detik antar request
  BACKUP_INTERVAL: 50, // Backup setiap 50 artikel
};
```

## 🏃‍♂️ Cara Menjalankan

### 1. Testing (10 artikel pertama)

```typescript
// Di scrape.ts, pastikan:
MAX_ARTICLES_TO_SCRAPE: 10,
```

```bash
bun run scrape.ts
```

### 2. Scraping Semua Artikel (379 artikel)

```typescript
// Di scrape.ts, ubah menjadi:
MAX_ARTICLES_TO_SCRAPE: null,
```

```bash
bun run scrape.ts
```

### 3. Scraping Custom (jumlah tertentu)

```typescript
// Di scrape.ts, set angka yang diinginkan:
MAX_ARTICLES_TO_SCRAPE: 100, // untuk 100 artikel pertama
```

```bash
bun run scrape.ts
```

## 📊 Output yang Dihasilkan

Semua file output CSV akan disimpan dalam folder `output-csv/` yang dibuat otomatis.

### 1. Daftar Artikel Utama

**File**: `output-csv/artikel_utama_YYYY-MM-DDTHH-mm-ss.csv`

**Kolom**:

- `Index`: Nomor urut artikel
- `Judul`: Judul lengkap artikel
- `URL`: Link ke halaman detail artikel
- `Tahun`: Tahun publikasi (ekstraksi otomatis)
- `Kategori`: Kategori otomatis (Sistem, IoT, Analisis, dll)

**Contoh**:

```csv
Index,Judul,URL,Tahun,Kategori
1,"SISTEM KUALITAS AIR AKUARIUM UNTUK MEMINIMALKAN RESIKO PENYAKIT...",https://eprints.amikom.ac.id/id/eprint/29710/,2025,Sistem
```

### 2. Detail Artikel

**File**: `output-csv/detail_artikel_YYYY-MM-DDTHH-mm-ss.csv`

**Kolom**:

- `Index`: Nomor urut artikel
- `Article_URL`: URL artikel
- `Title`: Judul dari h1.ep_tm_pagetitle
- `Document_Count`: Jumlah dokumen yang tersedia
- `Document_Details`: JSON berisi semua dokumen (format, filename, link)
- `Abstract`: Abstrak lengkap penelitian

**Data per artikel meliputi**:

- ✅ Title lengkap dari h1.ep_tm_pagetitle
- ✅ Daftar dokumen (PDF, ZIP, dll) dengan format, filename, dan link
- ✅ Abstract lengkap penelitian

### 3. File Backup (Mode Production)

**File**: `output-csv/backup_artikel_X_YYYY-MM-DDTHH-mm-ss.csv`

- **Frekuensi**: Setiap 50 artikel (dapat dikonfigurasi)
- **Tujuan**: Recovery jika proses terhenti

# Mode

- Testing (10 artikel)
- Production (Semua artikel)

## 🔧 Pengaturan Lanjutan

### Mengubah Delay Request

```typescript
DELAY_BETWEEN_REQUESTS: 3000, // 3 detik (lebih aman untuk server)
```

### Mengubah Frekuensi Backup

```typescript
BACKUP_INTERVAL: 25, // Backup setiap 25 artikel
```

### Mengubah URL Target

```typescript
BASE_URL: "https://eprints.amikom.ac.id/view/divisions/tk", // URL lain jika diperlukan
```

## 📈 Monitoring Progress

Scraper akan menampilkan informasi real-time:

- ✅ Progress percentage setiap 10 artikel
- ✅ Statistik success/error
- ✅ Backup otomatis setiap interval yang ditentukan
- ✅ Estimasi waktu penyelesaian

**Contoh output**:

```
📊 Progress: 13.2% (50/379) | ✅ 48 berhasil | ❌ 2 gagal
💾 Menyimpan backup ke: output-csv/backup_artikel_50_2025-07-01T10-30-15.csv
⏱️  Estimasi sisa waktu: ~14 jam
```

## ⚠️ Pertimbangan Penting

### Untuk Scraping Lengkap (379 artikel)

1. **Waktu**: Siapkan waktu ~16 jam (bisa jalan di background)
2. **Koneksi**: Pastikan koneksi internet stabil
3. **Storage**: Siapkan space minimal 50 MB
4. **Rate limiting**: Jangan ubah delay menjadi terlalu kecil (<1000ms)

### Jika Proses Terhenti

1. ✅ Cek file backup terakhir
2. ✅ Resume dari artikel terakhir yang berhasil
3. ✅ Ubah konfigurasi `MAX_ARTICLES_TO_SCRAPE` untuk melanjutkan
4. ✅ Gunakan backup untuk recovery data

## 🎯 Rekomendasi Penggunaan

1. **Pertama kali**: Coba dengan `MAX_ARTICLES_TO_SCRAPE: 10` untuk testing
2. **Pilot project**: Gunakan `MAX_ARTICLES_TO_SCRAPE: 50` untuk sampel
3. **Production**: Set `MAX_ARTICLES_TO_SCRAPE: null` untuk data lengkap

## 📄 Struktur Data Output

### File artikel_utama.csv

```csv
Index,Judul,URL,Tahun,Kategori
1,"SISTEM KUALITAS AIR AKUARIUM UNTUK MEMINIMALKAN RESIKO PENYAKIT PADA BUDIDAYA IKAN KOKI MENGGUNAKAN ESP32.",https://eprints.amikom.ac.id/id/eprint/29710/,2025,Sistem
2,"{JALUR PROFESIONAL LOMBA} NETCOMP 2.0 COMPETITION – 2024.",https://eprints.amikom.ac.id/id/eprint/29171/,2025,Umum
```

### File detail_artikel.csv

```csv
Index,Article_URL,Title,Document_Count,Document_Details,Abstract
1,https://eprints.amikom.ac.id/id/eprint/29710/,"SISTEM KUALITAS AIR AKUARIUM...",18,"[{""title"":""Text (COVER-ABSTRAK)"",""filename"":""COVER.pdf"",""link"":""https://eprints.amikom.ac.id/id/eprint/29710/1/COVER.pdf""}]","Budidaya ikan koki menghadapi tantangan utama dalam menjaga kualitas air..."
```

## 🛠 Teknologi yang Digunakan

- **Runtime**: Bun / Node.js
- **Language**: TypeScript
- **DOM Parsing**: JSDOM
- **XPath**: xpath package
- **HTTP Client**: Fetch API native
- **Output Format**: CSV

## 📁 Struktur Project

```
scrape/
├── scrape.ts                 # File utama scraper
├── package.json              # Dependencies
├── tsconfig.json            # TypeScript config
├── README.md                # Dokumentasi ini
├── bun.lock                 # Lock file dependencies
└── output-csv/              # Folder output CSV (auto-generated)
    ├── artikel_utama_*.csv
    ├── detail_artikel_*.csv
    └── backup_artikel_*.csv
```

## 🐛 Troubleshooting

### Error "Cannot fetch URL"

```bash
# Cek koneksi internet
ping eprints.amikom.ac.id

# Coba dengan delay yang lebih besar
DELAY_BETWEEN_REQUESTS: 5000
```

### Error "Memory limit exceeded"

```bash
# Jalankan dengan limit memory lebih besar
node --max-old-space-size=4096 scrape.ts
# atau dengan Bun
bun --max-old-space-size=4096 run scrape.ts
```

### Process terhenti di tengah jalan

```bash
# Cek backup terakhir
ls -la backup_artikel_*.csv

# Resume dari posisi terakhir dengan mengubah konfigurasi
MAX_ARTICLES_TO_SCRAPE: 200 // jika backup terakhir di 150, lanjutkan dari sini
```

## 🤝 Kontribusi

Jika ingin berkontribusi:

1. Fork repository
2. Buat branch feature baru
3. Commit changes
4. Push ke branch
5. Create Pull Request

## 🆘 Support

ngga ada support-suport an gw ngga di bayar😭
