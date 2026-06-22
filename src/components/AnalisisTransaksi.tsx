import React, { useState, useMemo } from 'react';
import { Account, JournalTransaction } from '../types';
import { generateLedger, generateTrialBalance, formatRupiah } from '../accountingEngine';
import { AlertTriangle, BarChart3, PieChartIcon, ShieldCheck, CheckCircle2, FileSpreadsheet, Eye } from 'lucide-react';

interface AnalisisTransaksiProps {
  transactions: JournalTransaction[];
  accounts: Account[];
  onOpenTxDetail?: (txRef: string) => void;
}

export default function AnalisisTransaksi({ transactions, accounts, onOpenTxDetail }: AnalisisTransaksiProps) {
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('Semua');

  // Generate Ledger summaries and Trial Balance
  const ledgers = useMemo(() => generateLedger(transactions, accounts), [transactions, accounts]);
  const trialBalance = useMemo(() => generateTrialBalance(transactions, accounts), [transactions, accounts]);

  // 1. STATS: Ringkasan Transaksi
  const stats = useMemo(() => {
    let totalDebitSum = 0;
    let totalKreditSum = 0;
    const activeAccountsSet = new Set<string>();

    transactions.forEach(t => {
      t.entries.forEach(e => {
        activeAccountsSet.add(e.accountCode);
        if (e.posisi === 'debit') {
          totalDebitSum += e.nominal;
        } else {
          totalKreditSum += e.nominal;
        }
      });
    });

    return {
      totalTxs: transactions.length,
      totalDebit: totalDebitSum,
      totalKredit: totalKreditSum,
      activeAccountsCount: activeAccountsSet.size
    };
  }, [transactions]);

  // 2. CHART A: Top 10 Accounts with Largest Absolute Turnover (Debit + Credit)
  const topAccountsChartData = useMemo(() => {
    const list = accounts.map(acc => {
      const summary = ledgers[acc.code];
      let turnover = 0;
      if (summary) {
        summary.rows.forEach(r => {
          turnover += r.debit + r.kredit;
        });
      }
      return {
        code: acc.code,
        name: acc.name,
        turnover
      };
    })
    .filter(item => item.turnover > 0)
    .sort((a, b) => b.turnover - a.turnover)
    .slice(0, 10);

    const maxTurnover = list[0]?.turnover || 1;
    return list.map(item => ({
      ...item,
      percentage: (item.turnover / maxTurnover) * 100
    }));
  }, [accounts, ledgers]);

  // 3. CHART B: Percentage of Transactions Value sum across Categories (Aset, Liabilitas, Ekuitas, Pendapatan, Beban)
  const categoryChartData = useMemo(() => {
    const breakdown: Record<string, number> = {
      'Aset': 0,
      'Liabilitas': 0,
      'Ekuitas': 0,
      'Pendapatan': 0,
      'Beban': 0
    };

    let totalCumulative = 0;
    transactions.forEach(t => {
      t.entries.forEach(e => {
        const acc = accounts.find(a => a.code === e.accountCode);
        if (acc && breakdown[acc.category] !== undefined) {
          breakdown[acc.category] += e.nominal;
          totalCumulative += e.nominal;
        }
      });
    });

    return Object.keys(breakdown).map(cat => {
      const val = breakdown[cat];
      return {
        category: cat,
        value: val,
        percentage: totalCumulative > 0 ? (val / totalCumulative) * 100 : 0
      };
    });
  }, [transactions, accounts]);

  // 4. TABEL ANALISIS: Detailed table per account
  const accountAnalysisList = useMemo(() => {
    return accounts.map(acc => {
      const ledgerSummary = ledgers[acc.code];
      let totalDebit = 0;
      let totalKredit = 0;
      const closingBalance = ledgerSummary?.closingBalance || 0;

      if (ledgerSummary) {
        ledgerSummary.rows.forEach(r => {
          totalDebit += r.debit;
          totalKredit += r.kredit;
        });
      }

      // Check for Normal Balance Anomaly:
      // Normal balance checks standard: Cash, Receivables and Expenses normal is Debit.
      // Payables, Equity and Revenue is Credit.
      // If of abnormal balance (e.g. < 0, or standard is violated). 
      // Also check if any debit-normal account ends with more kredit than debit and vice versa.
      let isAnomalous = false;
      let explanation = "";

      if (closingBalance < 0) {
        isAnomalous = true;
        explanation = "Saldo bernilai negatif (< 0).";
      } else if (acc.code === '101' || acc.code === '102' || acc.code === '103') {
        // Cash accounts: should never have a negative balance or Credit-dominant ledger row set
        if (closingBalance < 0 || (totalKredit > totalDebit + (acc.code === '101' ? Number(localStorage.getItem('saldoAwalKas') || '0') : 0))) {
          isAnomalous = true;
          explanation = "Kas defisit (pengeluaran melampaui penerimaan).";
        }
      } else if (acc.normalBalance === 'D' && totalKredit > totalDebit && closingBalance > 0) {
        // Normally debit-dominant accounts shouldn't have higher credits unless designed otherwise (like accumulation accounts)
        if (!acc.isContra) {
          isAnomalous = true;
          explanation = `Saldo berada di posisi Kredit padahal akun normal Debit.`;
        }
      } else if (acc.normalBalance === 'K' && totalDebit > totalKredit && closingBalance > 0) {
        if (!acc.isContra) {
          isAnomalous = true;
          explanation = `Saldo berada di posisi Debit padahal akun normal Kredit.`;
        }
      }

      return {
        account: acc,
        totalDebit,
        totalKredit,
        closingBalance,
        isAnomalous,
        explanation
      };
    })
    .filter(item => {
      if (selectedCategoryFilter === 'Semua') return true;
      return item.account.category === selectedCategoryFilter;
    })
    .sort((a, b) => a.account.code.localeCompare(b.account.code));
  }, [accounts, ledgers, selectedCategoryFilter]);

  // 5. DETEKSI ANOMALI JURNAL OTOMATIS (Warnings list)
  const anomalies = useMemo(() => {
    const list: string[] = [];

    // Check 1: General Journal transaction double entry balances
    const unbalancedTxs = transactions.filter(t => {
      let d = 0;
      let k = 0;
      t.entries.forEach(e => {
        if (e.posisi === 'debit') d += e.nominal;
        else k += e.nominal;
      });
      return Math.abs(d - k) > 0.01;
    });

    if (unbalancedTxs.length > 0) {
      unbalancedTxs.forEach(t => {
        list.push(`Transaksi "${t.description}" (Ref: ${t.refNo}) tidak seimbang antara Debit dan Kredit.`);
      });
    }

    // Check 2: Unbalanced Trial Balance
    if (!trialBalance.isBalanced) {
      list.push(`Neraca Saldo tidak seimbang! Total Debit Rp ${formatRupiah(trialBalance.totalDebit)} dan Kredit Rp ${formatRupiah(trialBalance.totalKredit)} (Selisih: Rp ${formatRupiah(trialBalance.difference)}).`);
    }

    // Check 3: Check cash deficit
    ['101', '102', '103'].forEach(code => {
      const ledg = ledgers[code];
      if (ledg && ledg.closingBalance < 0) {
        const accInfo = accounts.find(a => a.code === code);
        list.push(`Defisit Saldo Kas: Akun [${code}] ${accInfo?.name} bersaldo negatif sebesar (Rp ${formatRupiah(Math.abs(ledg.closingBalance))}).`);
      }
    });

    // Check 4: Check standard asset accounts with abnormally high credit
    accounts.forEach(acc => {
      if (acc.category === 'Aset' && !acc.isContra) {
        const sumVal = ledgers[acc.code];
        if (sumVal && sumVal.closingBalance < 0) {
          list.push(`Akun Aset [${acc.code}] ${acc.name} memiliki saldo negatif (${formatRupiah(sumVal.closingBalance)}).`);
        }
      }
    });

    return list;
  }, [transactions, trialBalance, ledgers, accounts]);

  return (
    <div id="analisis_view" className="space-y-8">
      
      {/* SECTION: ANOMALY ALERT BANNER */}
      {anomalies.length > 0 ? (
        <div id="anomaly_banner" className="bg-amber-50 dark:bg-amber-950/40 text-amber-805 dark:text-amber-200 border-2 border-amber-300 dark:border-amber-900 rounded-2xl p-5 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="p-2.5 bg-amber-100 dark:bg-amber-900/60 rounded-xl text-amber-600 dark:text-amber-400">
              <AlertTriangle className="w-6 h-6 animate-pulse" />
            </div>
            <div className="flex-1 space-y-1">
              <h3 className="text-sm font-bold tracking-tight text-amber-900 dark:text-amber-300">
                Peringatan Anomali & Kesalahan SAK Terdeteksi ({anomalies.length})
              </h3>
              <p className="text-xs text-amber-700/90 dark:text-amber-400/80 leading-relaxed font-sans mb-3">
                Sistem NarKuntansi mendeteksi ketidaksesuaian akuntansi otomatis yang melanggar dasar pembukuan berpasangan atau SAK EP 2025:
              </p>
              <ul className="space-y-1.5 pl-5 list-disc text-xs font-mono">
                {anomalies.map((msg, idx) => (
                  <li key={idx} className="leading-relaxed text-amber-900 dark:text-amber-300">{msg}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      ) : (
        <div id="anomaly_all_good" className="bg-emerald-50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900 rounded-2xl p-4 flex items-center gap-3.5 shadow-sm">
          <div className="p-2 bg-emerald-100 dark:bg-emerald-900/40 rounded-xl text-emerald-600 dark:text-emerald-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-emerald-900 dark:text-emerald-300">Sertifikat SAK Seimbang & Bersih</h4>
            <p className="text-[11px] text-emerald-700/90 dark:text-emerald-400/80 mt-0.5">Semua jurnal seimbang, saldo kas memadai, dan tidak ditemukan anomali jurnal.</p>
          </div>
        </div>
      )}

      {/* METRIC SUMMARIES */}
      <section id="metric-cards" className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <span className="text-[10px] uppercase tracking-wider text-slate-400 dark:text-slate-500 font-extrabold font-mono">Total Transaksi</span>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white mt-1 font-mono">{stats.totalTxs}</h2>
          <p className="text-[10px] text-slate-400 mt-2">Jurnal umum &amp; penyesuaian</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <span className="text-[10px] uppercase tracking-wider text-slate-400 dark:text-slate-500 font-extrabold font-mono">Nominal Debit</span>
          <h2 className="text-xl md:text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1.5 font-mono">
            {formatRupiah(stats.totalDebit)}
          </h2>
          <p className="text-[10px] text-slate-400 mt-2">Akumulasi mutasi debit</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <span className="text-[10px] uppercase tracking-wider text-slate-400 dark:text-slate-500 font-extrabold font-mono">Nominal Kredit</span>
          <h2 className="text-xl md:text-2xl font-black text-blue-600 dark:text-blue-400 mt-1.5 font-mono">
            {formatRupiah(stats.totalKredit)}
          </h2>
          <p className="text-[10px] text-slate-400 mt-2">Akumulasi mutasi kredit</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <span className="text-[10px] uppercase tracking-wider text-slate-400 dark:text-slate-500 font-extrabold font-mono">Akun Digunakan</span>
          <h2 className="text-3xl font-black text-purple-600 dark:text-purple-400 mt-1 font-mono">{stats.activeAccountsCount}</h2>
          <p className="text-[10px] text-slate-400 mt-2">Dari total 45 akun SAK</p>
        </div>
      </section>

      {/* VISUAL CHARTS BENTO BLOCK */}
      <section id="charts-block" className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* CHART A: HORIZONTAL BAR TURN-OVER CHART */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-2 mb-4 border-b border-slate-100 dark:border-slate-800 pb-3">
            <BarChart3 className="w-5 h-5 text-indigo-500" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Top 10 Keaktifan Akun (Mutasi Terbesar)</h3>
          </div>
          
          {topAccountsChartData.length === 0 ? (
            <p className="text-xs text-slate-400 dark:text-slate-500 py-10 text-center">Belum ada aktivitas transaksi mutasi akun.</p>
          ) : (
            <div className="space-y-4">
              {topAccountsChartData.map((item, idx) => (
                <div key={item.code} className="space-y-1.5">
                  <div className="flex justify-between text-xs font-sans">
                    <span className="font-semibold text-slate-705 dark:text-slate-300">
                      [{item.code}] {item.name}
                    </span>
                    <span className="font-mono text-slate-500 font-semibold">
                      Rp {formatRupiah(item.turnover)}
                    </span>
                  </div>
                  {/* PURE CSS BAR */}
                  <div className="h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-indigo-500 dark:bg-indigo-400 rounded-full transition-all duration-500"
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* CHART B: CATEGORY DONUT BAR CHART REPRESENTATION */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col">
          <div className="flex items-center gap-2 mb-4 border-b border-slate-100 dark:border-slate-800 pb-3">
            <PieChartIcon className="w-5 h-5 text-emerald-500" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Penyebaran Transaksi Berdasarkan Kategori SAK</h3>
          </div>

          <div className="flex-1 flex flex-col justify-center space-y-6">
            
            {/* Visual Custom Donut / Ring element representation using SVG */}
            <div className="flex justify-center py-4">
              <svg className="w-36 h-36 transform -rotate-90" viewBox="0 0 42 42">
                <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="#f1f5f9" strokeWidth="4" />
                {/* Layered circles showing stacked categorical components */}
                {(() => {
                  let accumulatedPercent = 0;
                  const colors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6'];
                  return categoryChartData.map((item, idx) => {
                    const strokeDash = `${item.percentage} ${100 - item.percentage}`;
                    const strokeOffset = 100 - accumulatedPercent;
                    accumulatedPercent += item.percentage;
                    return (
                      <circle
                        key={item.category}
                        cx="21"
                        cy="21"
                        r="15.915"
                        fill="transparent"
                        stroke={colors[idx % colors.length]}
                        strokeWidth="4.2"
                        strokeDasharray={strokeDash}
                        strokeDashoffset={strokeOffset}
                      />
                    );
                  });
                })()}
              </svg>
            </div>

            {/* Legend Indicators */}
            <div className="grid grid-cols-2 gap-4">
              {categoryChartData.map((item, idx) => {
                const colors = ['bg-blue-500', 'bg-red-500', 'bg-emerald-500', 'bg-amber-500', 'bg-purple-500'];
                return (
                  <div key={item.category} className="flex items-center gap-2 text-xs">
                    <span className={`w-3 h-3 rounded-full ${colors[idx % colors.length]}`} />
                    <div className="flex-1">
                      <p className="font-semibold text-slate-700 dark:text-slate-300">{item.category}</p>
                      <p className="font-mono text-[10px] text-slate-400 mt-0.5">
                        {item.percentage.toFixed(1)}% &bull; Rp {formatRupiah(item.value)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

          </div>
        </div>

      </section>

      {/* TABLE: DETAILED ACCOUNT ANALYSIS & BALANCE CHECK */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-150 dark:border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Analisis Saldo Akhir &amp; Akurasi Posisi Akun</h3>
            <p className="text-xs text-slate-400 mt-1">Mengidentifikasi anomali saldo jika berlawanan dengan saldo normal atau bersaldo negatif.</p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-400 font-bold font-mono">Filter SAK:</span>
            <select
              value={selectedCategoryFilter}
              onChange={(e) => setSelectedCategoryFilter(e.target.value)}
              className="px-3 py-1.5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs rounded-lg font-semibold text-slate-700 dark:text-slate-300 outline-none"
            >
              <option value="Semua">Semua Kategori</option>
              <option value="Aset">Aset</option>
              <option value="Liabilitas">Liabilitas</option>
              <option value="Ekuitas">Ekuitas</option>
              <option value="Pendapatan">Pendapatan</option>
              <option value="Beban">Beban</option>
            </select>
          </div>
        </div>

        {/* ACCOUNT ANALYSIS LIST TABLE WITH SCROLLING SUPPORT */}
        <div className="overflow-x-auto min-w-full">
          <table className="min-w-[700px] w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800 font-mono text-[10px] text-slate-450 dark:text-slate-400 uppercase tracking-wider">
                <th className="px-5 py-3">Kode</th>
                <th className="px-5 py-3">Nama Akun</th>
                <th className="px-5 py-3">Kategori</th>
                <th className="px-5 py-3">Debit (D)</th>
                <th className="px-5 py-3">Kredit (K)</th>
                <th className="px-5 py-3">Saldo Akhir</th>
                <th className="px-5 py-3">Pos Normal</th>
                <th className="px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {accountAnalysisList.map(item => {
                const acc = item.account;
                return (
                  <tr 
                    key={acc.code} 
                    className={`transition-colors ${
                      item.isAnomalous 
                        ? 'bg-rose-50/70 hover:bg-rose-55/80 dark:bg-rose-950/20 dark:hover:bg-rose-950/30' 
                        : 'hover:bg-slate-50 dark:hover:bg-slate-850'
                    }`}
                  >
                    <td className="px-5 py-3.5 font-mono font-bold text-slate-900 dark:text-white">{acc.code}</td>
                    <td className="px-5 py-3.5 font-sans font-semibold text-slate-700 dark:text-slate-300">{acc.name}</td>
                    <td className="px-5 py-3.5 text-slate-400 font-semibold">{acc.category}</td>
                    <td className="px-5 py-3.5 font-mono text-slate-500">
                      {item.totalDebit > 0 ? formatRupiah(item.totalDebit) : '-'}
                    </td>
                    <td className="px-5 py-3.5 font-mono text-slate-500">
                      {item.totalKredit > 0 ? formatRupiah(item.totalKredit) : '-'}
                    </td>
                    <td className="px-5 py-3.5 font-mono font-bold text-slate-900 dark:text-white">
                      {formatRupiah(item.closingBalance)}
                    </td>
                    <td className="px-5 py-3.5 font-mono font-bold text-slate-500">
                      {acc.normalBalance === 'D' ? 'Debit (D)' : 'Kredit (K)'}
                    </td>
                    <td className="px-5 py-3.5">
                      {item.isAnomalous ? (
                        <div className="flex items-center gap-1.5 text-rose-600 dark:text-rose-450 font-bold" title={item.explanation}>
                          <AlertTriangle className="w-4 h-4 shrink-0 animate-bounce" />
                          <span className="text-[10px] uppercase font-mono tracking-wider">Abnormal</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold">
                          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
                          <span className="text-[10px] uppercase font-mono tracking-wider">Benar</span>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

      </div>

    </div>
  );
}
