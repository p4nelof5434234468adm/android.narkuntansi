import React from 'react';
import { Info, BookOpen, Scale, Building2 } from 'lucide-react';

// ---------------------------------------------------------------------------
// Halaman referensi/materi belajar: perbedaan PSAK (SAK Umum) vs SAK EP.
// Konten ini murni informatif, tidak melibatkan input data transaksi.
// ---------------------------------------------------------------------------

const comparisonRows: { aspek: string; psak: string; sakEp: string }[] = [
  {
    aspek: 'Target entitas',
    psak: 'Entitas dengan akuntabilitas publik signifikan (emiten, perbankan, BUMN, perusahaan terbuka)',
    sakEp: 'Entitas privat tanpa akuntabilitas publik signifikan (UMKM menengah ke atas, badan usaha tertutup)',
  },
  {
    aspek: 'Acuan dasar',
    psak: 'Mengadopsi sebagian besar IFRS (International Financial Reporting Standards)',
    sakEp: 'Disederhanakan dari PSAK, menggantikan SAK ETAP sejak 2025',
  },
  {
    aspek: 'Instrumen keuangan',
    psak: 'Klasifikasi kompleks (FVTPL, FVOCI, amortized cost) sesuai PSAK 71',
    sakEp: 'Pengukuran disederhanakan, umumnya biaya perolehan atau nilai wajar sederhana',
  },
  {
    aspek: 'Aset tetap',
    psak: 'Boleh model biaya atau model revaluasi (PSAK 16)',
    sakEp: 'Umumnya model biaya, ketentuan revaluasi lebih terbatas',
  },
  {
    aspek: 'Sewa (leasing)',
    psak: 'Hampir semua sewa diakui sebagai aset & liabilitas di pembukuan penyewa (PSAK 73)',
    sakEp: 'Perlakuan lebih sederhana, beberapa sewa operasi masih dicatat sebagai beban',
  },
  {
    aspek: 'Pengungkapan (disclosure)',
    psak: 'Sangat ekstensif, catatan atas laporan keuangan tebal dan rinci',
    sakEp: 'Pengungkapan lebih ringkas dan ringan',
  },
  {
    aspek: 'Laporan keuangan wajib',
    psak: 'Posisi keuangan, laba rugi & penghasilan komprehensif lain, perubahan ekuitas, arus kas, catatan atas laporan keuangan',
    sakEp: 'Pada dasarnya sama, namun format dan kedalaman catatan lebih sederhana',
  },
];

export default function PSAKReferensi() {
  return (
    <div className="space-y-5">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
        <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-3">
          <Info className="w-4 h-4 text-indigo-500" /> Apa itu PSAK?
        </h3>
        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          PSAK (Pernyataan Standar Akuntansi Keuangan) adalah standar akuntansi keuangan yang berlaku
          umum di Indonesia dan diterbitkan oleh Dewan Standar Akuntansi Keuangan (DSAK) Ikatan Akuntan
          Indonesia (IAI). PSAK ditujukan terutama bagi entitas dengan akuntabilitas publik signifikan,
          seperti perusahaan terbuka (Tbk), perbankan, dan BUMN, karena PSAK mengadopsi sebagian besar
          prinsip IFRS yang berlaku secara internasional.
        </p>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
        <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-3">
          <Building2 className="w-4 h-4 text-indigo-500" /> Apa itu SAK EP?
        </h3>
        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          SAK EP (Standar Akuntansi Keuangan Entitas Privat) adalah standar yang disusun khusus untuk
          entitas privat yang tidak memiliki akuntabilitas publik signifikan. SAK EP berlaku efektif
          sejak 1 Januari 2025 dan menggantikan SAK ETAP, dengan tujuan memberikan standar yang lebih
          relevan namun tetap lebih ringan dibanding PSAK penuh.
        </p>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
        <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
          <Scale className="w-4 h-4 text-indigo-500" /> Tabel Perbandingan PSAK vs SAK EP
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 uppercase text-[10px]">
                <th className="text-left py-2 pr-3">Aspek</th>
                <th className="text-left py-2 pr-3">PSAK / SAK Umum</th>
                <th className="text-left py-2">SAK EP</th>
              </tr>
            </thead>
            <tbody>
              {comparisonRows.map((row, i) => (
                <tr key={i} className="border-b border-slate-100 dark:border-slate-800/50 align-top">
                  <td className="py-3 pr-3 font-bold text-slate-700 dark:text-slate-200 whitespace-nowrap">{row.aspek}</td>
                  <td className="py-3 pr-3 text-slate-600 dark:text-slate-300">{row.psak}</td>
                  <td className="py-3 text-slate-600 dark:text-slate-300">{row.sakEp}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-2xl p-5">
        <h4 className="font-bold text-amber-900 dark:text-amber-300 flex items-center gap-2 text-sm mb-2">
          <BookOpen className="w-4 h-4" /> Catatan untuk Pembelajaran
        </h4>
        <p className="text-xs text-amber-800/90 dark:text-amber-300/80 leading-relaxed">
          Untuk siklus akuntansi dasar (jurnal, buku besar, neraca saldo, hingga laporan keuangan inti),
          prinsip pembukuan berpasangan (debit = kredit) berlaku sama pada PSAK maupun SAK EP. Perbedaan
          paling signifikan baru terasa pada topik lanjutan: instrumen keuangan, sewa, kombinasi bisnis,
          dan kedalaman pengungkapan. Materi ini disusun sebagai ringkasan pengantar dan bukan pengganti
          buku ajar atau Pernyataan Standar Akuntansi Keuangan resmi dari IAI.
        </p>
      </div>
    </div>
  );
}
