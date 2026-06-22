import React from 'react';
import { generateIncomeStatement, generateBalanceSheet, formatRupiah } from '../accountingEngine';
import { Percent, Info } from 'lucide-react';

// ---------------------------------------------------------------------------
// Kalkulator rasio keuangan dasar berbasis hasil laporan posisi keuangan dan
// laba rugi pada modul PSAK. Rasio dihitung otomatis dari data jurnal yang
// sudah diinput pengguna di modul ini.
// ---------------------------------------------------------------------------

interface PSAKRasioKeuanganProps {
  balanceSheet: ReturnType<typeof generateBalanceSheet>;
  incomeStatement: ReturnType<typeof generateIncomeStatement>;
}

function safeDiv(a: number, b: number): number {
  return b === 0 ? 0 : a / b;
}

function formatRatioValue(value: number, divisor: number, naLabel: string): string {
  return divisor === 0 ? naLabel : `${value.toFixed(1)}%`;
}

export default function PSAKRasioKeuangan({ balanceSheet, incomeStatement }: PSAKRasioKeuanganProps) {
  const aset_lancar = balanceSheet.totalAssetsLancar;
  const liabilitas_pendek = balanceSheet.totalLiabilitiesShort;
  const total_liabilitas = balanceSheet.totalLiabilities;
  const total_aset = balanceSheet.totalAssets;
  const total_ekuitas = balanceSheet.totalEquity;
  const laba_bersih = incomeStatement.netProfit;
  const pendapatan = incomeStatement.totalRevenue;

  const currentRatio = safeDiv(aset_lancar, liabilitas_pendek) * 100;
  const debtToAssetRatio = safeDiv(total_liabilitas, total_aset) * 100;
  const debtToEquityRatio = safeDiv(total_liabilitas, total_ekuitas) * 100;
  const netProfitMargin = safeDiv(laba_bersih, pendapatan) * 100;
  const returnOnAssets = safeDiv(laba_bersih, total_aset) * 100;
  const returnOnEquity = safeDiv(laba_bersih, total_ekuitas) * 100;

  const hasShortLiability = liabilitas_pendek > 0;
  const currentRatioDisplay = formatRatioValue(currentRatio, liabilitas_pendek, 'Tidak ada liabilitas jangka pendek');
  const currentRatioInterpretasi = !hasShortLiability
    ? 'Belum ada liabilitas jangka pendek, sehingga rasio ini belum relevan untuk dihitung pada periode ini.'
    : currentRatio >= 100
      ? 'Aset lancar mencukupi untuk menutup liabilitas jangka pendek.'
      : 'Aset lancar belum mencukupi untuk menutup liabilitas jangka pendek.';

  const debtToEquityDisplay = formatRatioValue(debtToEquityRatio, total_ekuitas, 'Tidak dapat dihitung (ekuitas 0)');
  const returnOnEquityDisplay = formatRatioValue(returnOnEquity, total_ekuitas, 'Tidak dapat dihitung (ekuitas 0)');
  const returnOnAssetsDisplay = formatRatioValue(returnOnAssets, total_aset, 'Tidak dapat dihitung (aset 0)');
  const netProfitMarginDisplay = formatRatioValue(netProfitMargin, pendapatan, 'Belum ada pendapatan');
  const debtToAssetDisplay = formatRatioValue(debtToAssetRatio, total_aset, 'Tidak dapat dihitung (aset 0)');

  const ratios = [
    {
      kategori: 'Likuiditas',
      nama: 'Current Ratio (Rasio Lancar)',
      formula: 'Aset Lancar / Liabilitas Jangka Pendek',
      nilai: currentRatioDisplay,
      interpretasi: currentRatioInterpretasi,
    },
    {
      kategori: 'Solvabilitas',
      nama: 'Debt to Asset Ratio',
      formula: 'Total Liabilitas / Total Aset',
      nilai: debtToAssetDisplay,
      interpretasi: 'Menunjukkan proporsi aset yang dibiayai oleh utang.',
    },
    {
      kategori: 'Solvabilitas',
      nama: 'Debt to Equity Ratio',
      formula: 'Total Liabilitas / Total Ekuitas',
      nilai: debtToEquityDisplay,
      interpretasi: 'Menunjukkan perbandingan pendanaan dari utang terhadap modal sendiri.',
    },
    {
      kategori: 'Profitabilitas',
      nama: 'Net Profit Margin',
      formula: 'Laba Bersih / Pendapatan',
      nilai: netProfitMarginDisplay,
      interpretasi: 'Menunjukkan persentase laba bersih dari setiap rupiah pendapatan.',
    },
    {
      kategori: 'Profitabilitas',
      nama: 'Return on Assets (ROA)',
      formula: 'Laba Bersih / Total Aset',
      nilai: returnOnAssetsDisplay,
      interpretasi: 'Menunjukkan efisiensi penggunaan aset untuk menghasilkan laba.',
    },
    {
      kategori: 'Profitabilitas',
      nama: 'Return on Equity (ROE)',
      formula: 'Laba Bersih / Total Ekuitas',
      nilai: returnOnEquityDisplay,
      interpretasi: 'Menunjukkan tingkat pengembalian bagi pemegang modal.',
    },
  ];

  const hasData = total_aset !== 0 || pendapatan !== 0;

  return (
    <div className="space-y-5">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
        <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-1">
          <Percent className="w-4 h-4 text-indigo-500" /> Rasio Keuangan (PSAK)
        </h3>
        <p className="text-xs text-slate-500 mb-5">
          Dihitung otomatis dari data Jurnal Umum, Neraca Saldo, dan Laporan Keuangan pada modul PSAK ini.
        </p>

        {!hasData ? (
          <p className="text-sm text-slate-400 text-center py-8">
            Belum ada data transaksi pada modul PSAK. Tambahkan jurnal terlebih dahulu agar rasio dapat dihitung.
          </p>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {ratios.map((r, i) => (
              <div key={i} className="rounded-xl border border-slate-200 dark:border-slate-800 p-4">
                <div className="flex justify-between items-start mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-wide text-indigo-500">{r.kategori}</span>
                  <span className="text-lg font-extrabold text-slate-900 dark:text-white">{r.nilai}</span>
                </div>
                <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{r.nama}</p>
                <p className="text-[11px] text-slate-400 font-mono mt-0.5">{r.formula}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">{r.interpretasi}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex items-start gap-2.5">
        <Info className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
          Angka rasio di atas adalah hasil perhitungan murni berdasarkan data yang Anda input. Penilaian baik
          atau buruknya suatu rasio bersifat relatif, tergantung jenis industri, rata-rata kompetitor, dan
          kebijakan masing-masing entitas. Gunakan sebagai bahan diskusi dan latihan analisis, bukan sebagai
          kesimpulan final.
        </p>
      </div>
    </div>
  );
}
