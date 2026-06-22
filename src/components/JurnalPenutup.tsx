import React, { useState, useMemo } from 'react';
import { Account, JournalTransaction, JournalEntryItem } from '../types';
import { generateLedger, formatRupiah, generateTrialBalance } from '../accountingEngine';
import { FileCheck, BookMarked, Printer, Coins, ShieldAlert, CheckSquare } from 'lucide-react';

interface JurnalPenutupProps {
  transactions: JournalTransaction[];
  accounts: Account[];
  onAddTransactionsBulk: (txs: JournalTransaction[]) => void;
  settings: any;
}

export default function JurnalPenutup({ transactions, accounts, onAddTransactionsBulk, settings }: JurnalPenutupProps) {
  // Check if closing entries are already posted in general journal list
  const hasClosingPosted = useMemo(() => {
    return transactions.some(t => t.refNo.startsWith('JP-'));
  }, [transactions]);

  // Generate complete adjusted balances of accounts (JU and JA) to fetch final values before closing
  const finalBalances = useMemo(() => {
    // Only includes standard JU and JA
    const preClosingTxs = transactions.filter(t => !t.refNo.startsWith('JP-'));
    const ledgers = generateLedger(preClosingTxs, accounts);
    
    const results: Record<string, number> = {};
    accounts.forEach(acc => {
      results[acc.code] = ledgers[acc.code]?.closingBalance || 0;
    });
    return results;
  }, [transactions, accounts]);

  // Generate Closing Entries Proposal
  const closingProposal = useMemo(() => {
    const list: Array<{ step: number; title: string; entries: Array<{ accountCode: string; posisi: 'debit' | 'kredit'; nominal: number }> }> = [];
    const dateStr = settings.tanggalAkhir || '2025-01-31';

    // Step 1: Close Revenues (4xx) to 399 (Ikhtisar Laba Rugi)
    const revEntries: Array<{ accountCode: string; positions: 'debit' | 'kredit'; val: number }> = [];
    let totalRevenue = 0;
    accounts.forEach(acc => {
      const codeNum = parseInt(acc.code);
      if (codeNum >= 400 && codeNum < 500) {
        const bal = finalBalances[acc.code] || 0;
        if (bal > 0) {
          totalRevenue += bal;
          revEntries.push({ accountCode: acc.code, positions: 'debit', val: bal });
        }
      }
    });

    if (totalRevenue > 0) {
      const step1Entries: any[] = revEntries.map(e => ({
        accountCode: e.accountCode,
        posisi: 'debit',
        nominal: e.val
      }));
      step1Entries.push({
        accountCode: '399', // Ikhtisar Laba Rugi
        posisi: 'kredit',
        nominal: totalRevenue
      });

      list.push({
        step: 1,
        title: "Menutup Akun Pendapatan (4xx) ke Ikhtisar Laba Rugi",
        entries: step1Entries
      });
    }

    // Step 2: Close Expenses (5xx) to 399 (Ikhtisar Laba Rugi)
    const expEntries: Array<{ accountCode: string; val: number }> = [];
    let totalExpenses = 0;
    accounts.forEach(acc => {
      const codeNum = parseInt(acc.code);
      if (codeNum >= 500) {
        const bal = finalBalances[acc.code] || 0;
        if (bal > 0) {
          totalExpenses += bal;
          expEntries.push({ accountCode: acc.code, val: bal });
        }
      }
    });

    if (totalExpenses > 0) {
      const step2Entries: any[] = [{
        accountCode: '399', // Ikhtisar Laba Rugi
        posisi: 'debit',
        nominal: totalExpenses
      }];

      expEntries.forEach(e => {
        step2Entries.push({
          accountCode: e.accountCode,
          posisi: 'kredit',
          nominal: e.val
        });
      });

      list.push({
        step: 2,
        title: "Menutup Akun Beban-Beban (5xx) ke Ikhtisar Laba Rugi",
        entries: step2Entries
      });
    }

    // Step 3: Close Ikhtisar Laba Rugi (399) to Modal (301)
    const netProfit = totalRevenue - totalExpenses;
    if (netProfit !== 0) {
      const absNP = Math.abs(netProfit);
      const isProfit = netProfit > 0;
      
      const step3Entries: Array<{ accountCode: string; posisi: 'debit' | 'kredit'; nominal: number }> = isProfit ? [
        // Profit: Debit Ikhtisar, Kredit Modal
        { accountCode: '399', posisi: 'debit', nominal: absNP },
        { accountCode: '301', posisi: 'kredit', nominal: absNP }
      ] : [
        // Loss: Debit Modal, Kredit Ikhtisar
        { accountCode: '301', posisi: 'debit', nominal: absNP },
        { accountCode: '399', posisi: 'kredit', nominal: absNP }
      ];

      list.push({
        step: 3,
        title: isProfit 
          ? "Menutup Laba Bersih (399) ke Modal Pemilik (Akun 301)" 
          : "Menutup Rugi Bersih (399) ke Modal Pemilik (Akun 301)",
        entries: step3Entries
      });
    }

    // Step 4: Close Prive (302) to Modal (301)
    const drawingsBal = finalBalances['302'] || 0;
    if (drawingsBal > 0) {
      const step4Entries: Array<{ accountCode: string; posisi: 'debit' | 'kredit'; nominal: number }> = [
        { accountCode: '301', posisi: 'debit', nominal: drawingsBal },
        { accountCode: '302', posisi: 'kredit', nominal: drawingsBal }
      ];

      list.push({
        step: 4,
        title: "Menutup Pengambilan Prive (302) ke Modal Pemilik (301)",
        entries: step4Entries
      });
    }

    return list;
  }, [finalBalances, accounts, settings]);

  // Post closing entries proposal to persistent transaction list
  const handlePostClosingToJurnal = () => {
    if (hasClosingPosted) {
      alert("Jurnal Penutup sudah pernah Anda rekam dan posting ke buku jurnal.");
      return;
    }

    if (closingProposal.length === 0) {
      alert("Belum ada saldo akun nominal yang bisa ditutup.");
      return;
    }

    const yearStr = settings.tanggalAkhir?.substring(0, 4) || '2025';
    const postTransactions: JournalTransaction[] = [];

    closingProposal.forEach((step, idx) => {
      const refNo = `JP-${yearStr}-${String(idx + 1).padStart(3, '0')}`;
      const entries: JournalEntryItem[] = step.entries.map((ent, eIdx) => ({
        id: `close_ent_${Date.now()}_${idx}_${eIdx}`,
        accountCode: ent.accountCode,
        posisi: ent.posisi,
        nominal: ent.nominal
      }));

      postTransactions.push({
        id: `tx_close_${Date.now()}_${idx}`,
        date: settings.tanggalAkhir || '2025-01-31',
        refNo,
        description: step.title,
        entries
      });
    });

    onAddTransactionsBulk(postTransactions);
    alert(`Sukses! ${postTransactions.length} Jurnal Penutup berhasil diposting otomatis ke Jurnal Umum.`);
  };

  // Generate Post Closing Trial Balance (Neraca Saldo Setelah Penutupan)
  // Contains only real accounts, as nominal are wiped
  const postClosingTrialBalance = useMemo(() => {
    // Generate ledger with ALL transactions (JU, JA, and JP)
    const ledgers = generateLedger(transactions, accounts);
    
    let totalD = 0;
    let totalK = 0;

    const items = accounts.map(acc => {
      const clBal = ledgers[acc.code]?.closingBalance || 0;
      let d = 0, k = 0;
      
      if (clBal > 0) {
        if (acc.normalBalance === 'D') d = clBal;
        else k = clBal;
      }

      totalD += d;
      totalK += k;

      return {
        account: acc,
        debit: d,
        kredit: k,
        balance: clBal
      };
    })
    // Only display accounts that have non-zero post-closing balance
    .filter(item => item.balance > 0);

    const isBalanced = Math.abs(totalD - totalK) < 0.01;

    return {
      items,
      totalDebit: totalD,
      totalKredit: totalK,
      isBalanced
    };
  }, [transactions, accounts]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div id="jurnal_penutup_view" className="space-y-8">
      
      {/* INTRO EXPLANATORY BLOCK */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-5">
        <div className="space-y-1">
          <h3 className="text-sm font-bold text-slate-850 dark:text-white uppercase tracking-wider font-mono">Siklus Penutupan Jurnal (Akun Nominal)</h3>
          <p className="text-xs text-slate-500 leading-relaxed max-w-2xl font-sans">
            Sesuai standar SAK EP 2025, akun nominal (Pendapatan &amp; Beban) serta Prive harus ditutup/dinolkan pada akhir periode keuangan. Saldo bersihnya dipindahkan ke Modal Pemilik agar modal mencerminkan keadaan yang sebenarnya.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handlePostClosingToJurnal}
            disabled={hasClosingPosted || closingProposal.length === 0}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold font-sans flex items-center gap-1.5 shadow-sm transition-all ${
              hasClosingPosted
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed dark:bg-slate-800'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer'
            }`}
          >
            <BookMarked className="w-4 h-4" />
            {hasClosingPosted ? 'Sudah Diposting ✓' : 'Posting ke Jurnal Umum'}
          </button>

          <button
            onClick={handlePrint}
            className="px-3.5 py-2.5 border border-slate-200 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-850 rounded-xl text-xs font-bold font-sans flex items-center gap-1"
          >
            <Printer className="w-4 h-4" />
            Cetak
          </button>
        </div>
      </div>

      {/* STEP BY STEP CLOSING PROPOSALS */}
      <div className="bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-850 rounded-3xl p-6 shadow-sm space-y-6">
        <div>
          <h4 className="text-xs font-extrabold uppercase text-slate-400 tracking-wider font-mono">Prosedur Otomatis Jurnal Penutup (SAK-EP)</h4>
          <p className="text-[11px] text-slate-450 mt-1">Berikut rincian jurnal penyesuaian penutup yang draf-nya disimulasikan sistem berdasarkan saldo berjalan Anda:</p>
        </div>

        {closingProposal.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 dark:bg-slate-850 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-slate-400 text-xs">
            Tidak ada transaksi pendapatan atau beban nominal yang butuh pemindahan saldo saat ini.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {closingProposal.map(step => (
              <div key={step.step} className="border border-slate-150 dark:border-slate-800 rounded-2xl p-4 space-y-3 bg-slate-50/45 dark:bg-slate-850/20">
                <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-slate-800 pb-2">
                  <span className="text-[10px] bg-slate-200 dark:bg-slate-800 text-slate-650 dark:text-slate-400 px-2 py-0.5 rounded-md font-mono font-bold uppercase">
                    LANGKAH #{step.step}
                  </span>
                  <Coins className="w-4 h-4 text-slate-400" />
                </div>
                <h5 className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-snug">{step.title}</h5>

                <div className="space-y-1.5 pt-1.5 font-mono text-[10px]">
                  {step.entries.map((ent, idx) => {
                    const accInfo = accounts.find(a => a.code === ent.accountCode);
                    const isDebit = ent.posisi === 'debit';
                    return (
                      <div key={idx} className="flex justify-between items-center bg-white dark:bg-slate-900 px-2.5 py-1.5 rounded-lg border border-slate-100 dark:border-slate-850">
                        <div className="truncate pr-2">
                          <span className="font-bold text-slate-400 mr-1.5">[{ent.accountCode}]</span>
                          <span className={isDebit ? 'text-slate-700 dark:text-slate-350' : 'text-slate-600 dark:text-slate-400 pl-4'}>
                            {accInfo ? accInfo.name : 'Unknown Account'}
                          </span>
                        </div>
                        <div className="shrink-0 text-right">
                          <span className={`font-bold ${isDebit ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                            {isDebit ? 'D' : 'K'} Rp {formatRupiah(ent.nominal)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* POST CLOSING TRIAL BALANCE (NERACA SALDO SETELAH PENUTUPAN) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm space-y-4">
        
        <div className="p-6 border-b border-slate-150 dark:border-slate-805 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-50/50 dark:bg-slate-850/20">
          <div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <CheckSquare className="w-5 h-5 text-emerald-500" />
              Neraca Saldo Setelah Penutupan (Post-Closing Trial Balance)
            </h4>
            <p className="text-xs text-slate-450 mt-1">
              Menampilkan hanya akun Riil (1xx, 2xx, 3xx). Akun nominal telah sepenuhnya beralih menjadi modal bersih.
            </p>
          </div>

          <div className="text-xs">
            {hasClosingPosted ? (
              <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full font-bold">Closed ✓</span>
            ) : (
              <span className="px-2.5 py-1 bg-amber-100 text-amber-800 rounded-full font-bold animate-pulse">Menunggu Posting</span>
            )}
          </div>
        </div>

        <div className="p-4 font-sans">
          {/* Post Closing trial table */}
          <div className="overflow-x-auto min-w-full">
            <table className="min-w-[650px] w-full text-left font-mono">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-[10px] text-slate-400 uppercase font-black tracking-wider bg-slate-50 dark:bg-slate-850">
                  <th className="px-4 py-2.5">No</th>
                  <th className="px-4 py-2.5">Kode Rekening</th>
                  <th className="px-4 py-2.5 text-left">Nama Akun SAK</th>
                  <th className="px-4 py-2.5 text-right">Debit</th>
                  <th className="px-4 py-2.5 text-right">Kredit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {postClosingTrialBalance.items.map((item, idx) => (
                  <tr key={item.account.code} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="px-4 py-2 text-slate-405 font-sans">{idx + 1}</td>
                    <td className="px-4 py-2 text-slate-900 dark:text-white font-bold">{item.account.code}</td>
                    <td className="px-4 py-2 text-slate-750 dark:text-slate-300 font-sans font-semibold">
                      {item.account.name}
                    </td>
                    <td className="px-4 py-2 text-right">
                      {item.debit > 0 ? formatRupiah(item.debit) : '-'}
                    </td>
                    <td className="px-4 py-2 text-right">
                      {item.kredit > 0 ? formatRupiah(item.kredit) : '-'}
                    </td>
                  </tr>
                ))}

                {/* Sub total */}
                <tr className="bg-slate-50 dark:bg-slate-850 font-black border-t-2 border-slate-200 dark:border-slate-805 text-slate-905 dark:text-white text-sm">
                  <td colSpan={3} className="px-4 py-3 font-sans">TOTAL NERACA SETELAH PENUTUPAN</td>
                  <td className="px-4 py-3 text-right">
                    {formatRupiah(postClosingTrialBalance.totalDebit)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {formatRupiah(postClosingTrialBalance.totalKredit)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {!postClosingTrialBalance.isBalanced && (
            <div className="mt-4 p-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900 rounded-xl text-rose-800 dark:text-rose-350 text-xs flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 shrink-0" />
              <span>Format neraca penutupan diatas tidak seimbang! Perbedaan debit kredit: {formatRupiah(Math.abs(postClosingTrialBalance.totalDebit - postClosingTrialBalance.totalKredit))}.</span>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
