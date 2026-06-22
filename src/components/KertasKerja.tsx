import React, { useState, useMemo } from 'react';
import { Account, JournalTransaction, JournalEntryItem } from '../types';
import { generateLedger, formatRupiah } from '../accountingEngine';
import { Plus, HelpCircle, CheckCircle2, AlertTriangle, FileSpreadsheet, X } from 'lucide-react';

interface KertasKerjaProps {
  transactions: JournalTransaction[];
  accounts: Account[];
  onAddTransaction: (tx: JournalTransaction) => void;
}

export default function KertasKerja({ transactions, accounts, onAddTransaction }: KertasKerjaProps) {
  const [showModal, setShowModal] = useState(false);
  
  // State for Adjustment Modal
  const [adjDate, setAdjDate] = useState('2025-01-31');
  const [adjDesc, setAdjDesc] = useState('Penyesuaian: ');
  const [entries, setEntries] = useState<Array<{ accountCode: string; posisi: 'debit' | 'kredit'; nominal: number }>>([
    { accountCode: '504', posisi: 'debit', nominal: 0 },
    { accountCode: '114', posisi: 'kredit', nominal: 0 }
  ]);

  // Standard transactions (excludes adjustments JA- and closing JP-)
  const standardTransactions = useMemo(() => {
    return transactions.filter(t => !t.refNo.startsWith('JA-') && !t.refNo.startsWith('JP-'));
  }, [transactions]);

  // Jurnal Penyesuaian transactions (starts with JA-)
  const adjustmentTransactions = useMemo(() => {
    return transactions.filter(t => t.refNo.startsWith('JA-'));
  }, [transactions]);

  // Raw calculated ledger summarizes
  const stdLedgers = useMemo(() => generateLedger(standardTransactions, accounts), [standardTransactions, accounts]);
  const adjLedgers = useMemo(() => generateLedger(adjustmentTransactions, accounts), [adjustmentTransactions, accounts]);

  // Generate 10-column rows
  const worksheetRows = useMemo(() => {
    let sumNS_D = 0, sumNS_K = 0;
    let sumAdj_D = 0, sumAdj_K = 0;
    let sumNSD_D = 0, sumNSD_K = 0;
    let sumLR_D = 0, sumLR_K = 0;
    let sumN_D = 0, sumN_K = 0;

    const dataRows = accounts.map(acc => {
      // 1. Neraca Saldo
      const stdSum = stdLedgers[acc.code];
      const stdBal = stdSum?.closingBalance || 0;
      let nsD = 0, nsK = 0;
      if (stdBal > 0) {
        if (acc.normalBalance === 'D') nsD = stdBal;
        else nsK = stdBal;
      }

      // 2. Jurnal Penyesuaian (JA- entries)
      let adjD = 0, adjK = 0;
      const adjSum = adjLedgers[acc.code];
      if (adjSum) {
        adjSum.rows.forEach(r => {
          adjD += r.debit;
          adjK += r.kredit;
        });
      }

      // 3. NSD (NSD = NS + Adjustments)
      let nsdD = 0, nsdK = 0;
      let netRunning = 0;
      if (acc.normalBalance === 'D') {
        netRunning = (nsD - nsK) + (adjD - adjK);
        if (netRunning > 0) nsdD = netRunning;
        else if (netRunning < 0) nsdK = Math.abs(netRunning);
      } else {
        netRunning = (nsK - nsD) + (adjK - adjD);
        if (netRunning > 0) nsdK = netRunning;
        else if (netRunning < 0) nsdD = Math.abs(netRunning);
      }

      // 4. Laba Rugi (Nominal Accounts 4xx and 5xx)
      let lrD = 0, lrK = 0;
      // 5. Neraca Keuangan (Real Accounts 1xx, 2xx, and 3xx)
      let nD = 0, nK = 0;

      const codeNum = parseInt(acc.code);
      if (codeNum >= 400) {
        lrD = nsdD;
        lrK = nsdK;
      } else {
        nD = nsdD;
        nK = nsdK;
      }

      // Check if rows should be printed
      const hasActivity = (nsD > 0 || nsK > 0 || adjD > 0 || adjK > 0 || nsdD > 0 || nsdK > 0);

      return {
        account: acc,
        hasActivity,
        nsD, nsK,
        adjD, adjK,
        nsdD, nsdK,
        lrD, lrK,
        nD, nK
      };
    });

    const activeRows = dataRows.filter(r => r.hasActivity);

    // Summing intermediate columns
    activeRows.forEach(r => {
      sumNS_D += r.nsD; sumNS_K += r.nsK;
      sumAdj_D += r.adjD; sumAdj_K += r.adjK;
      sumNSD_D += r.nsdD; sumNSD_K += r.nsdK;
      sumLR_D += r.lrD; sumLR_K += r.lrK;
      sumN_D += r.nD; sumN_K += r.nK;
    });

    // Net Profit/Loss calculations
    const netIncome = sumLR_K - sumLR_D;
    const isLoss = netIncome < 0;
    const absNet = Math.abs(netIncome);

    let netLR_D = 0, netLR_K = 0;
    let netN_D = 0, netN_K = 0;

    if (!isLoss) {
      netLR_D = absNet; // post to Debit to balance LR
      netN_K = absNet;  // post to Credit to balance Neraca
    } else {
      netLR_K = absNet; // post to Credit to balance LR
      netN_D = absNet;  // post to Debit to balance Neraca
    }

    return {
      rows: activeRows,
      sumNS_D, sumNS_K,
      sumAdj_D, sumAdj_K,
      sumNSD_D, sumNSD_K,
      sumLR_D, sumLR_K,
      sumN_D, sumN_K,
      netIncome,
      isLoss,
      absNet,
      netLR_D, netLR_K,
      netN_D, netN_K,
      grandNS_D: sumNS_D, grandNS_K: sumNS_K,
      grandAdj_D: sumAdj_D, grandAdj_K: sumAdj_K,
      grandNSD_D: sumNSD_D, grandNSD_K: sumNSD_K,
      grandLR_D: sumLR_D + netLR_D, grandLR_K: sumLR_K + netLR_K,
      grandN_D: sumN_D + netN_D, grandN_K: sumN_K + netN_K,
    };
  }, [accounts, stdLedgers, adjLedgers]);

  // Modal Handlers
  const handleAddModalEntry = () => {
    setEntries([...entries, { accountCode: '501', posisi: 'debit', nominal: 0 }]);
  };

  const handleRemoveModalEntry = (index: number) => {
    setEntries(entries.filter((_, i) => i !== index));
  };

  const handleModalEntryChange = (index: number, key: string, value: any) => {
    const updated = [...entries];
    updated[index] = { ...updated[index], [key]: value };
    setEntries(updated);
  };

  const handleSaveAdjustment = (e: React.FormEvent) => {
    e.preventDefault();

    // Validations
    let totalD = 0;
    let totalK = 0;
    const items: JournalEntryItem[] = [];

    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];
      if (entry.nominal <= 0) {
        alert("Nominal penyesuaian harus lebih besar dari Rp 0.");
        return;
      }
      if (entry.posisi === 'debit') totalD += entry.nominal;
      else totalK += entry.nominal;

      items.push({
        id: `adj_${Date.now()}_${i}`,
        accountCode: entry.accountCode,
        posisi: entry.posisi,
        nominal: entry.nominal
      });
    }

    if (Math.abs(totalD - totalK) > 0.01) {
      alert(`Jurnal Penyesuaian tidak seimbang! Total Debit: Rp ${formatRupiah(totalD)} | Kredit: Rp ${formatRupiah(totalK)}.`);
      return;
    }

    // Auto calculate incremental Jurnal Penyesuaian reference JA-
    const jaTxs = transactions.filter(t => t.refNo.startsWith('JA-'));
    const serial = jaTxs.length + 1;
    const yearStr = adjDate.substring(0, 4) || '2025';
    const refNo = `JA-${yearStr}-${String(serial).padStart(3, '0')}`;

    const newTx: JournalTransaction = {
      id: `tx_adj_${Date.now()}`,
      date: adjDate,
      refNo,
      description: adjDesc,
      entries: items
    };

    onAddTransaction(newTx);
    setShowModal(false);
    
    // Reset inputs
    setAdjDesc('Penyesuaian: ');
    setEntries([
      { accountCode: '504', posisi: 'debit', nominal: 0 },
      { accountCode: '114', posisi: 'kredit', nominal: 0 }
    ]);
  };

  return (
    <div id="kertas_kerja_view" className="space-y-6">
      
      {/* HEADER CONTROLS */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-205 dark:border-slate-800 shadow-sm">
        <div>
          <h3 className="text-sm font-bold text-slate-905 dark:text-white">Lembaran Kertas Kerja SAK EP 2025</h3>
          <p className="text-xs text-slate-450 mt-1">Mengintegrasikan Neraca Saldo dan Jurnal Penyesuaian (JA-) untuk menyusun pos laba rugi dan neraca keuangan.</p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold font-sans rounded-xl inline-flex items-center gap-1.5 shadow-sm transition-all animate-pulse"
        >
          <Plus className="w-4 h-4" />
          Isi Jurnal Penyesuaian
        </button>
      </div>

      {/* DETAILED 10-COLUMN TABLE WITH SCROLLBAR */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto min-w-full">
          <table className="min-w-[1200px] w-full text-left border-collapse font-sans">
            <thead>
              {/* TOP HEADER LABELS */}
              <tr className="bg-slate-55 dark:bg-slate-850 text-[10px] font-mono tracking-wider text-slate-450 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 text-center uppercase font-bold">
                <th colSpan={3} className="px-4 py-3 text-left">Deskripsi Akun</th>
                <th colSpan={2} className="border-l border-r border-slate-200 dark:border-slate-800 px-2 py-3 bg-blue-50/20 dark:bg-blue-950/10">1 &amp; 2. Neraca Saldo</th>
                <th colSpan={2} className="border-r border-slate-200 dark:border-slate-800 px-2 py-3 bg-amber-50/20 dark:bg-amber-950/10">3 &amp; 4. Penyesuaian</th>
                <th colSpan={2} className="border-r border-slate-200 dark:border-slate-800 px-2 py-3 bg-emerald-50/20 dark:bg-emerald-950/10">5 &amp; 6. NSD</th>
                <th colSpan={2} className="border-r border-slate-200 dark:border-slate-800 px-2 py-3 bg-rose-50/20 dark:bg-rose-950/10">7 &amp; 8. Laba Rugi</th>
                <th colSpan={2} className="px-2 py-3 bg-violet-50/20 dark:bg-violet-950/10">9 &amp; 10. Neraca Keuangan</th>
              </tr>
              {/* DEBIT / CREDIT ROW */}
              <tr className="bg-slate-50 dark:bg-slate-800/50 text-[10px] font-mono text-slate-500 border-b border-slate-200 dark:border-slate-800 text-center">
                <th className="px-3 py-2 text-left w-12">No</th>
                <th className="px-3 py-2 text-left w-16">Kode</th>
                <th className="px-3 py-2 text-left w-52">Nama Rekening Akun</th>
                <th className="border-l border-slate-200 dark:border-slate-800 px-3 py-2 text-right">Debit</th>
                <th className="px-3 py-2 text-right">Kredit</th>
                <th className="border-l border-slate-200 dark:border-slate-800 px-3 py-2 text-right">Debit</th>
                <th className="px-3 py-2 text-right">Kredit</th>
                <th className="border-l border-slate-200 dark:border-slate-800 px-3 py-2 text-right">Debit</th>
                <th className="px-3 py-2 text-right">Kredit</th>
                <th className="border-l border-slate-200 dark:border-slate-800 px-3 py-2 text-right">Debit</th>
                <th className="px-3 py-2 text-right">Kredit</th>
                <th className="border-l border-slate-200 dark:border-slate-800 px-3 py-2 text-right">Debit</th>
                <th className="px-3 py-2 text-right">Kredit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs font-mono">
              
              {worksheetRows.rows.map((row, idx) => (
                <tr key={row.account.code} className="hover:bg-slate-50 dark:hover:bg-slate-850">
                  <td className="px-3 py-2.5 text-slate-400 font-sans text-center">{idx + 1}</td>
                  <td className="px-3 py-2.5 text-slate-900 dark:text-white font-bold">{row.account.code}</td>
                  <td className="px-3 py-2.5 text-slate-700 dark:text-slate-300 font-sans font-semibold text-left">
                    {row.account.name}
                  </td>

                  {/* Neraca Saldo */}
                  <td className="border-l border-slate-100 dark:border-slate-800 px-3 py-2.5 text-right text-slate-500">
                    {row.nsD > 0 ? formatRupiah(row.nsD) : '-'}
                  </td>
                  <td className="px-3 py-2.5 text-right text-slate-500">
                    {row.nsK > 0 ? formatRupiah(row.nsK) : '-'}
                  </td>

                  {/* Penyesuaian */}
                  <td className="border-l border-slate-200 dark:border-slate-800 px-3 py-2.5 text-right text-amber-600 dark:text-amber-450">
                    {row.adjD > 0 ? formatRupiah(row.adjD) : '-'}
                  </td>
                  <td className="px-3 py-2.5 text-right text-amber-600 dark:text-amber-450">
                    {row.adjK > 0 ? formatRupiah(row.adjK) : '-'}
                  </td>

                  {/* NSD */}
                  <td className="border-l border-slate-200 dark:border-slate-800 px-3 py-2.5 text-right text-emerald-600 dark:text-emerald-400 font-semibold">
                    {row.nsdD > 0 ? formatRupiah(row.nsdD) : '-'}
                  </td>
                  <td className="px-3 py-2.5 text-right text-emerald-600 dark:text-emerald-400 font-semibold">
                    {row.nsdK > 0 ? formatRupiah(row.nsdK) : '-'}
                  </td>

                  {/* Laba Rugi */}
                  <td className="border-l border-slate-200 dark:border-slate-800 px-3 py-2.5 text-right text-rose-500">
                    {row.lrD > 0 ? formatRupiah(row.lrD) : '-'}
                  </td>
                  <td className="px-3 py-2.5 text-right text-rose-500">
                    {row.lrK > 0 ? formatRupiah(row.lrK) : '-'}
                  </td>

                  {/* Neraca */}
                  <td className="border-l border-slate-200 dark:border-slate-800 px-3 py-2.5 text-right text-slate-800 dark:text-slate-200">
                    {row.nD > 0 ? formatRupiah(row.nD) : '-'}
                  </td>
                  <td className="px-3 py-2.5 text-right text-slate-800 dark:text-slate-200">
                    {row.nK > 0 ? formatRupiah(row.nK) : '-'}
                  </td>
                </tr>
              ))}

              {/* ROW SUMMARY: COLUMN TOTALS */}
              <tr className="bg-slate-50 dark:bg-slate-800 font-bold border-t-2 border-b border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white">
                <td colSpan={3} className="px-3 py-3 text-left font-sans">TOTAL JURNAL TERJAWAB</td>
                
                <td className="border-l border-slate-200 dark:border-slate-350 px-3 py-3 text-right">
                  {formatRupiah(worksheetRows.sumNS_D)}
                </td>
                <td className="px-3 py-3 text-right">
                  {formatRupiah(worksheetRows.sumNS_K)}
                </td>

                <td className="border-l border-slate-205 dark:border-slate-350 px-3 py-3 text-right text-amber-600 dark:text-amber-400">
                  {formatRupiah(worksheetRows.sumAdj_D)}
                </td>
                <td className="px-3 py-3 text-right text-amber-600 dark:text-amber-400">
                  {formatRupiah(worksheetRows.sumAdj_K)}
                </td>

                <td className="border-l border-slate-205 dark:border-slate-350 px-3 py-3 text-right text-emerald-600 dark:text-emerald-400">
                  {formatRupiah(worksheetRows.sumNSD_D)}
                </td>
                <td className="px-3 py-3 text-right text-emerald-600 dark:text-emerald-400">
                  {formatRupiah(worksheetRows.sumNSD_K)}
                </td>

                <td className="border-l border-slate-210 dark:border-slate-350 px-3 py-3 text-right text-rose-500">
                  {formatRupiah(worksheetRows.sumLR_D)}
                </td>
                <td className="px-3 py-3 text-right text-rose-500">
                  {formatRupiah(worksheetRows.sumLR_K)}
                </td>

                <td className="border-l border-slate-210 dark:border-slate-350 px-3 py-3 text-right text-slate-850 dark:text-slate-100">
                  {formatRupiah(worksheetRows.sumN_D)}
                </td>
                <td className="px-3 py-3 text-right text-slate-850 dark:text-slate-100">
                  {formatRupiah(worksheetRows.sumN_K)}
                </td>
              </tr>

              {/* ROW NET LOSS / PROFIT */}
              <tr className="bg-indigo-50/30 dark:bg-indigo-950/10 font-bold border-b border-slate-200 dark:border-slate-800 text-indigo-700 dark:text-indigo-400">
                <td colSpan={3} className="px-3 py-3 text-left font-sans text-xs italic">
                  {worksheetRows.isLoss ? 'RUGI BERSIH PERIODE BERJALAN' : 'LABA BERSIH PERIODE BERJALAN'}
                </td>
                
                {/* NS & Adj are blank */}
                <td className="border-l border-slate-100 dark:border-slate-805"></td>
                <td></td>
                <td className="border-l border-slate-100 dark:border-slate-805"></td>
                <td></td>
                <td className="border-l border-slate-100 dark:border-slate-805"></td>
                <td></td>

                {/* LR Profit matching */}
                <td className="border-l border-slate-200 dark:border-slate-800 px-3 py-3 text-right">
                  {worksheetRows.netLR_D > 0 ? formatRupiah(worksheetRows.netLR_D) : '-'}
                </td>
                <td className="px-3 py-3 text-right">
                  {worksheetRows.netLR_K > 0 ? formatRupiah(worksheetRows.netLR_K) : '-'}
                </td>

                {/* Neraca Profit matching */}
                <td className="border-l border-slate-200 dark:border-slate-800 px-3 py-3 text-right">
                  {worksheetRows.netN_D > 0 ? formatRupiah(worksheetRows.netN_D) : '-'}
                </td>
                <td className="px-3 py-3 text-right">
                  {worksheetRows.netN_K > 0 ? formatRupiah(worksheetRows.netN_K) : '-'}
                </td>
              </tr>

              {/* GRAND ROW: EQUALIZED TOTALS */}
              <tr className="bg-[#1e3a5f]/10 dark:bg-slate-900/80 font-black border-b-4 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white">
                <td colSpan={3} className="px-3 py-3.5 text-left font-sans">GRAND BALANCED SUM</td>
                
                <td className="border-l border-slate-201 px-3 py-3.5 text-right">
                  {formatRupiah(worksheetRows.grandNS_D)}
                </td>
                <td className="px-3 py-3.5 text-right">
                  {formatRupiah(worksheetRows.grandNS_K)}
                </td>

                <td className="border-l border-slate-201 px-3 py-3.5 text-right text-amber-600 dark:text-amber-400">
                  {formatRupiah(worksheetRows.grandAdj_D)}
                </td>
                <td className="px-3 py-3.5 text-right text-amber-600 dark:text-amber-400">
                  {formatRupiah(worksheetRows.grandAdj_K)}
                </td>

                <td className="border-l border-slate-201 px-3 py-3.5 text-right text-emerald-600 dark:text-emerald-400">
                  {formatRupiah(worksheetRows.grandNSD_D)}
                </td>
                <td className="px-3 py-3.5 text-right text-emerald-600 dark:text-emerald-400">
                  {formatRupiah(worksheetRows.grandNSD_K)}
                </td>

                <td className="border-l border-slate-201 px-3 py-3.5 text-right text-rose-600">
                  {formatRupiah(worksheetRows.grandLR_D)}
                </td>
                <td className="px-3 py-3.5 text-right text-rose-600">
                  {formatRupiah(worksheetRows.grandLR_K)}
                </td>

                <td className="border-l border-slate-201 px-3 py-3.5 text-right text-indigo-700 dark:text-indigo-350">
                  {formatRupiah(worksheetRows.grandN_D)}
                </td>
                <td className="px-3 py-3.5 text-right text-indigo-700 dark:text-indigo-350">
                  {formatRupiah(worksheetRows.grandN_K)}
                </td>
              </tr>

            </tbody>
          </table>
        </div>
      </div>

      {/* ADJUSTMENT ENTRY DIALOGUE MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex justify-center items-center z-50 p-4 font-sans pattern-mobile">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="px-6 py-4 bg-emerald-650 text-white flex justify-between items-center bg-[#1e3a5f]">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-sm">Masukan Jurnal Penyesuaian Baru</h3>
              </div>
              <button 
                onClick={() => setShowModal(false)}
                className="p-1 hover:bg-white/10 rounded-lg text-slate-300 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveAdjustment} className="p-6 overflow-y-auto space-y-4 flex-1">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5 col-width-100">
                  <label className="text-[11px] font-bold text-slate-500 uppercase">Tanggal Jurnal</label>
                  <input
                    type="date"
                    required
                    value={adjDate}
                    onChange={(e) => setAdjDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 dark:bg-slate-950 dark:text-white rounded-xl text-xs outline-none"
                  />
                </div>
                <div className="space-y-1.5 col-width-100">
                  <label className="text-[11px] font-bold text-slate-500 uppercase">Keterangan Penyesuaian</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Penyesuaian Perlengkapan"
                    value={adjDesc}
                    onChange={(e) => setAdjDesc(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 dark:bg-slate-950 dark:text-white rounded-xl text-xs outline-none"
                  />
                </div>
              </div>

              {/* Transactions Entries Rows */}
              <div className="space-y-3 pt-2">
                <div className="flex justify-between items-center">
                  <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">Arus Jurnal Akuntansi (Berpasangan)</span>
                  <button
                    type="button"
                    onClick={handleAddModalEntry}
                    className="text-xs text-indigo-500 font-bold hover:underline"
                  >
                    + Tambah Akun Jurnal
                  </button>
                </div>

                <div className="space-y-3.5 divide-y divide-slate-100 dark:divide-slate-800/50">
                  {entries.map((entry, idx) => (
                    <div key={idx} className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-3.5 items-end">
                      
                      {/* Account selection */}
                      <div className="md:col-span-6 space-y-1.5 col-width-100">
                        <label className="text-[10px] text-slate-400 font-bold uppercase">Akun Rekening</label>
                        <select
                          value={entry.accountCode}
                          onChange={(e) => handleModalEntryChange(idx, 'accountCode', e.target.value)}
                          className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 dark:bg-slate-950 dark:text-white rounded-xl text-xs outline-none"
                        >
                          {accounts.map(acc => (
                            <option key={acc.code} value={acc.code}>
                              [{acc.code}] {acc.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Position (Debit or Credit) */}
                      <div className="md:col-span-3 space-y-1.5 col-width-100">
                        <label className="text-[10px] text-slate-400 font-bold uppercase">Posisi</label>
                        <select
                          value={entry.posisi}
                          onChange={(e) => handleModalEntryChange(idx, 'posisi', e.target.value)}
                          className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 dark:bg-slate-950 dark:text-white rounded-xl text-xs outline-none"
                        >
                          <option value="debit">DEBIT</option>
                          <option value="kredit">KREDIT</option>
                        </select>
                      </div>

                      {/* Nominal Amount */}
                      <div className="md:col-span-2 space-y-1.5 col-width-100">
                        <label className="text-[10px] text-slate-400 font-bold uppercase">Nominal</label>
                        <input
                          type="number"
                          inputMode="numeric"
                          placeholder="Rp"
                          required
                          value={entry.nominal || ''}
                          onChange={(e) => handleModalEntryChange(idx, 'nominal', Number(e.target.value))}
                          className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 dark:bg-slate-950 dark:text-white rounded-xl text-xs font-mono outline-none"
                        />
                      </div>

                      {/* Remove */}
                      <div className="md:col-span-1 pb-1.5 text-center col-width-100">
                        <button
                          type="button"
                          disabled={entries.length <= 2}
                          onClick={() => handleRemoveModalEntry(idx)}
                          className="p-1.5 border border-rose-250 hover:bg-rose-50 text-rose-500 rounded-lg disabled:opacity-30"
                          title="Hapus baris ini"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                    </div>
                  ))}
                </div>
              </div>

              {/* Footer action buttons */}
              <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3.5">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-800 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-850 rounded-xl text-xs font-bold font-sans"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold font-sans shadow-sm"
                >
                  Simpan Penyesuaian SAK
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
