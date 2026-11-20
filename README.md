# Garda Suara

Saya mau bikin web mengenai aplikasi relawan untuk pemenangan calon. Dalam 1 web ini nanti bisa dipakai seterusnya, jadi ini bisa dipakai dprd, dpr ri, gubernur, bupati. 

Konsep alur dan fiturnya:
- Administrator platform membuat event kampanye/pemilu (misal Pilkada Sidoarjo 2026), input tanggal pelaksanaan, dan input calon yang mau pakai web ini.
- Calon bisa login, tapi data terisolasi penuh (hanya bisa lihat pemenangan dirinya sendiri).
- Dashboard calon (dioptimalkan untuk desktop layar besar / war room): target suara dan realisasinya berapa dalam tampilan speedometer / gauge, list relawan, total rekrutan relawan untuk pendukung, komposisi laki-laki dan perempuan, total DPT, breakdown detail sampai per TPS, dan target suara detail sampai per TPS.
- Struktur hierarki berjenjang:
  1. Koordinator Dapil / Kecamatan (Koorcam)
  2. Koordinator Desa / Kelurahan (Kordes)
  3. Koordinator Lapangan (Korlap)
  4. Relawan
  5. Pendukung
- Hak akses hierarki:
  - Koorcam bisa menambahkan Kordes, Korlap, maupun Relawan.
  - Kordes bisa menambahkan Korlap dan Relawan.
  - Korlap membawahi dan menambahkan Relawan.
  - Relawan bisa disetting hak aksesnya: hanya input pendukung saja, hanya input suara TPS saja, atau bisa dua-duanya.
- Input data pendukung:
  - Memakai kamera handphone langsung untuk foto KTP.
  - Foto KTP diterjemahkan otomatis ke text (OCR) untuk mengisi NIK, nama, alamat, jenis kelamin, RT/RW.
  - Nomor telepon/WhatsApp diinput sendiri secara manual setelah data KTP terisi.
- Validasi NIK ketat:
  - Waktu input jika ada NIK dobel/duplikat langsung ditolak seketika.
  - Tetap tersimpan history/log audit penolakan (keterangan siapa yang mencoba input, apakah dari inputannya sendiri atau orang/relawan lain).
- Master DPT Excel:
  - DPT bisa di-import dalam bentuk file Excel (per kecamatan/desa/TPS).
  - Dari situ otomatis mencocokkan data pendukung yang diinput: apakah cocok di DPT atau tidak. Jika tidak cocok, beri tanda/flag khusus, dan datanya bisa ditarik laporan/ekspor.
- Target & Real Count TPS:
  - Ada input target suara per kecamatan sampai tingkat TPS.
  - Data live hasil suara diinput saat pemungutan suara di TPS oleh relawan saksi.
- Tampilan dan Keamanan:
  - Dashboard dan laporan lengkap dari hasil rekrutmen dan real count.
  - Tampilan clean, modern, profesional (jangan terlihat seperti template AI generik).
  - Sangat responsif dan ringan di mobile untuk relawan lapangan.
  - Tampilan desktop command center yang gagah untuk layar monitor besar di War Room.
  - Keamanan data NIK dan data pribadi terjaga.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/1f9ae9bf-81b2-460c-a1ea-23daa21c4ab0).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
