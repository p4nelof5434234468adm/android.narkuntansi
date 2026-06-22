import React, { useState, useEffect, useMemo } from 'react';
import { Account, JournalTransaction, JournalEntryItem } from '../types';
import {
  DEFAULT_ACCOUNTS,
  generateLedger,
  generateTrialBalance,
  generateIncomeStatement,
  generateEquityStatement,
  generateBalanceSheet,
  generateDirectCashFlow,
  formatRupiah
} from '../accountingEngine';
import {
  BookOpen,
  Plus,
  Trash2,
  FileText,
  Grid,
  Layers,
  Percent,
  Info,
  CheckCircle2,
  AlertTriangle,
  X
} from 'lucide-react';
import PSAKReferensi from './PSAKReferensi';
import PSAKRasioKeuangan from './PSAKRasioKeuangan';

// ---------------------------------------------------------------------------
// PSAK / SAK UMUM MODULE
// Modul ini SENGAJA dibuat terpisah penuh dari modul SAK EP (App.tsx utama).
// Data (Chart of Accounts, Jurnal, Settings) disimpan dengan key localStorage
// yang berbeda sehingga kedua standar tidak saling bercampur.
// Engine kalkulasi (accountingEngine.ts) tetap dipakai bersama karena logika
// dasar pembukuan berpasangan (debit-kredit) identik di kedua standar; yang
// berbeda hanyalah istilah penyajian & konteks pembelajaran.
// ---------------------------------------------------------------------------

const LS_KEY_COA = 'psak_chartOfAccounts';
const LS_KEY_TX = 'psak_jurnalUmum';
const LS_KEY_SETTINGS = 'psak_settings';

interface PSAKSettings {
  companyName: string;
  period: string;
  tanggalAwal: string;
  tanggalAkhir: string;
}

const DEFAULT_PSAK_SETTINGS: PSAKSettings = {
  companyName: 'PT Cahaya Nusantara Tbk',
  period: 'Januari 2026',
  tanggalAwal: '2026-01-01',
  tanggalAkhir: '2026-01-31',
};

type PSAKSubTab = 'jurnal' | 'bukubesar' | 'neracasaldo' | 'laporan' | 'rasio' | 'referensi';

export default function PSAKModule() {
  const [subTab, setSubTab] = useState<PSAKSubTab>('referensi');
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<JournalTransaction[]>([]);
  const [settings, setSettings] = useState<PSAKSettings>(DEFAULT_PSAK_SETTINGS);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Load from localStorage (separate namespace from SAK EP module)
  useEffect(() => {
    try {
      const localCOA = localStorage.getItem(LS_KEY_COA);
      setAccounts(localCOA ? JSON.parse(localCOA) : DEFAULT_ACCOUNTS);
      if (!localCOA) localStorage.setItem(LS_KEY_COA, JSON.stringify(DEFAULT_ACCOUNTS));
    } catch {
      setAccounts(DEFAULT_ACCOUNTS);
    }

    try {
      const localTx = localStorage.getItem(LS_KEY_TX);
      setTransactions(localTx ? JSON.parse(localTx) : []);
    } catch {
      setTransactions([]);
    }

    try {
      const localSettings = localStorage.getItem(LS_KEY_SETTINGS);
      setSettings(localSettings ? JSON.parse(localSettings) : DEFAULT_PSAK_SETTINGS);
    } catch {
      setSettings(DEFAULT_PSAK_SETTINGS);
    }
  }, []);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const persistTransactions = (next: JournalTransaction[]) => {
    setTransactions(next);
    localStorage.setItem(LS_KEY_TX, JSON.stringify(next));
  };

  const persistSettings = (next: PSAKSettings) => {
    setSettings(next);
    localStorage.setItem(LS_KEY_SETTINGS, JSON.stringify(next));
  };

  const handleAddTransaction = (tx: JournalTransaction) => {
    persistTransactions([...transactions, tx]);
    showToast('Jurnal PSAK berhasil disimpan', 'success');
  };

  const handleDeleteTransaction = (id: string) => {
    persistTransactions(transactions.filter(t => t.id !== id));
    showToast('Jurnal dihapus', 'success');
  };

  // Derived reports (reuses the shared accounting engine)
  const ledgers = useMemo(() => generateLedger(transactions, accounts), [transactions, accounts]);
  const trialBalance = useMemo(() => generateTrialBalance(transactions, accounts), [transactions, accounts]);
  const incomeStatement = useMemo(() => generateIncomeStatement(transactions, accounts), [transactions, accounts]);
  const equityStatement = useMemo(
    () => generateEquityStatement(transactions, accounts, incomeStatement.netProfit),
    [transactions, accounts, incomeStatement.netProfit]
  );
  const balanceSheet = useMemo(
    () => generateBalanceSheet(transactions, accounts, incomeStatement.netProfit),
    [transactions, accounts, incomeStatement.netProfit]
  );
  const cashFlow = useMemo(() => generateDirectCashFlow(transactions, accounts), [transactions, accounts]);

  const subTabs: { key: PSAKSubTab; label: string; icon: React.ReactNode }[] = [
    { key: 'referensi', label: 'Referensi PSAK', icon: <Info className="w-4 h-4" /> },
    { key: 'jurnal', label: 'Jurnal Umum', icon: <BookOpen className="w-4 h-4" /> },
    { key: 'bukubesar', label: 'Buku Besar', icon: <Layers className="w-4 h-4" /> },
    { key: 'neracasaldo', label: 'Neraca Saldo', icon: <Grid className="w-4 h-4" /> },
    { key: 'laporan', label: 'Laporan Keuangan', icon: <FileText className="w-4 h-4" /> },
    { key: 'rasio', label: 'Rasio Keuangan', icon: <Percent className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-5">
      {toast && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg border ${
          toast.type === 'success'
            ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/90 dark:text-emerald-400 dark:border-emerald-900'
            : 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/90 dark:text-rose-400 dark:border-rose-900'
        }`}>
          {toast.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <X className="w-5 h-5" />}
          <span className="text-xs font-bold">{toast.message}</span>
        </div>
      )}

      {/* Module header / disclaimer */}
      <div className="bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900 rounded-2xl p-5">
        <h3 className="font-extrabold text-base text-indigo-900 dark:text-indigo-200 flex items-center gap-2">
          <BookOpen className="w-4 h-4" /> Modul PSAK / SAK Umum
        </h3>
        <p className="text-xs text-indigo-800/80 dark:text-indigo-300/80 mt-1.5 leading-relaxed">
          Modul ini terpisah penuh dari data SAK EP. Gunakan modul ini untuk berlatih siklus akuntansi
          berdasarkan <strong>Pernyataan Standar Akuntansi Keuangan (PSAK)</strong> yang berlaku untuk
          entitas dengan akuntabilitas publik. Data jurnal, buku besar, dan laporan keuangan di sini
          tidak akan tercampur dengan data pada modul SAK EP.
        </p>
      </div>

      {/* Company mini info */}
      <div className="flex flex-wrap gap-3 text-xs">
        <div className="px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
          <span className="font-bold">Entitas:</span> {settings.companyName}
        </div>
        <div className="px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
          <span className="font-bold">Periode:</span> {settings.period}
        </div>
      </div>

      {/* Sub navigation */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {subTabs.map(t => (
          <button
            key={t.key}
            onClick={() => setSubTab(t.key)}
            className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              subTab === t.key
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {subTab === 'referensi' && <PSAKReferensi />}

      {subTab === 'jurnal' && (
        <PSAKJurnal
          transactions={transactions}
          accounts={accounts}
          onAdd={handleAddTransaction}
          onDelete={handleDeleteTransaction}
        />
      )}

      {subTab === 'bukubesar' && <PSAKBukuBesar accounts={accounts} ledgers={ledgers} />}

      {subTab === 'neracasaldo' && <PSAKNeracaSaldo trialBalance={trialBalance} />}

      {subTab === 'laporan' && (
        <PSAKLaporanKeuangan
          incomeStatement={incomeStatement}
          equityStatement={equityStatement}
          balanceSheet={balanceSheet}
          cashFlow={cashFlow}
          settings={settings}
        />
      )}

      {subTab === 'rasio' && <PSAKRasioKeuangan balanceSheet={balanceSheet} incomeStatement={incomeStatement} />}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-component: Jurnal Umum (PSAK)
// ---------------------------------------------------------------------------
function PSAKJurnal({
  transactions,
  accounts,
  onAdd,
  onDelete,
}: {
  transactions: JournalTransaction[];
  accounts: Account[];
  onAdd: (tx: JournalTransaction) => void;
  onDelete: (id: string) => void;
}) {
  const [showModal, setShowModal] = useState(false);
  const [date, setDate] = useState('2026-01-01');
  const [desc, setDesc] = useState('');
  const [entries, setEntries] = useState<JournalEntryItem[]>([
    { id: `psak_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`, accountCode: accounts[0]?.code || '101', posisi: 'debit', nominal: 0 },
    { id: `psak_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`, accountCode: accounts[1]?.code || '301', posisi: 'kredit', nominal: 0 },
  ]);

  const totalDebit = entries.filter(e => e.posisi === 'debit').reduce((s, e) => s + e.nominal, 0);
  const totalKredit = entries.filter(e => e.posisi === 'kredit').reduce((s, e) => s + e.nominal, 0);
  const isBalanced = totalDebit === totalKredit && totalDebit > 0;

  const updateEntry = (id: string, field: keyof JournalEntryItem, value: any) => {
    setEntries(entries.map(e => (e.id === id ? { ...e, [field]: value } : e)));
  };

  const addEntryRow = () => {
    setEntries([...entries, { id: `psak_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`, accountCode: accounts[0]?.code || '101', posisi: 'debit', nominal: 0 }]);
  };

  const removeEntryRow = (id: string) => {
    if (entries.length <= 2) return;
    setEntries(entries.filter(e => e.id !== id));
  };

  const handleSubmit = () => {
    if (!isBalanced) return;
    onAdd({
      id: `psak_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      date,
      refNo: `PSAK-${transactions.length + 1}`,
      description: desc || 'Transaksi PSAK',
      entries,
    });
    setShowModal(false);
    setDesc('');
    setEntries([
      { id: `psak_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`, accountCode: accounts[0]?.code || '101', posisi: 'debit', nominal: 0 },
      { id: `psak_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`, accountCode: accounts[1]?.code || '301', posisi: 'kredit', nominal: 0 },
    ]);
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-slate-900 dark:text-white">Jurnal Umum (PSAK)</h3>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" /> Tambah Jurnal
        </button>
      </div>

      {transactions.length === 0 ? (
        <p className="text-sm text-slate-400 text-center py-10">Belum ada transaksi PSAK. Klik "Tambah Jurnal" untuk mulai.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 uppercase text-[10px]">
                <th className="text-left py-2">Tanggal</th>
                <th className="text-left py-2">Ref</th>
                <th className="text-left py-2">Keterangan</th>
                <th className="text-left py-2">Akun</th>
                <th className="text-right py-2">Debit</th>
                <th className="text-right py-2">Kredit</th>
                <th className="py-2"></th>
              </tr>
            </thead>
            <tbody>
              {transactions.map(tx => (
                <React.Fragment key={tx.id}>
                  {tx.entries.map((e, idx) => {
                    const acc = accounts.find(a => a.code === e.accountCode);
                    return (
                      <tr key={e.id} className="border-b border-slate-100 dark:border-slate-800/50">
                        {idx === 0 && (
                          <>
                            <td className="py-2 text-slate-600 dark:text-slate-300" rowSpan={tx.entries.length}>{tx.date}</td>
                            <td className="py-2 text-slate-400 font-mono" rowSpan={tx.entries.length}>{tx.refNo}</td>
                            <td className="py-2 text-slate-600 dark:text-slate-300" rowSpan={tx.entries.length}>{tx.description}</td>
                          </>
                        )}
                        <td className={`py-2 ${e.posisi === 'kredit' ? 'pl-6' : ''} text-slate-700 dark:text-slate-200`}>
                          {acc ? `${acc.code} - ${acc.name}` : e.accountCode}
                        </td>
                        <td className="py-2 text-right font-mono">{e.posisi === 'debit' ? formatRupiah(e.nominal) : ''}</td>
                        <td className="py-2 text-right font-mono">{e.posisi === 'kredit' ? formatRupiah(e.nominal) : ''}</td>
                        {idx === 0 && (
                          <td rowSpan={tx.entries.length}>
                            <button onClick={() => onDelete(tx.id)} className="text-rose-500 hover:text-rose-700 cursor-pointer">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h4 className="font-bold text-slate-900 dark:text-white">Tambah Jurnal PSAK</h4>
              <button onClick={() => setShowModal(false)} className="cursor-pointer text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase">Tanggal</label>
                <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full mt-1 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 dark:bg-slate-800 text-sm" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase">Keterangan</label>
                <input type="text" value={desc} onChange={e => setDesc(e.target.value)} placeholder="Keterangan transaksi" className="w-full mt-1 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 dark:bg-slate-800 text-sm" />
              </div>
            </div>

            <div className="space-y-2">
              {entries.map(e => (
                <div key={e.id} className="flex gap-2 items-center">
                  <select
                    value={e.accountCode}
                    onChange={ev => updateEntry(e.id, 'accountCode', ev.target.value)}
                    className="flex-1 px-2 py-2 rounded-lg border border-slate-200 dark:border-slate-700 dark:bg-slate-800 text-xs"
                  >
                    {accounts.map(a => (
                      <option key={a.code} value={a.code}>{a.code} - {a.name}</option>
                    ))}
                  </select>
                  <select
                    value={e.posisi}
                    onChange={ev => updateEntry(e.id, 'posisi', ev.target.value as 'debit' | 'kredit')}
                    className="px-2 py-2 rounded-lg border border-slate-200 dark:border-slate-700 dark:bg-slate-800 text-xs"
                  >
                    <option value="debit">Debit</option>
                    <option value="kredit">Kredit</option>
                  </select>
                  <input
                    type="number"
                    value={e.nominal || ''}
                    onChange={ev => updateEntry(e.id, 'nominal', Number(ev.target.value))}
                    placeholder="Nominal"
                    className="w-32 px-2 py-2 rounded-lg border border-slate-200 dark:border-slate-700 dark:bg-slate-800 text-xs text-right"
                  />
                  <button onClick={() => removeEntryRow(e.id)} className="text-rose-500 hover:text-rose-700 cursor-pointer">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            <button onClick={addEntryRow} className="mt-3 text-xs font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer flex items-center gap-1">
              <Plus className="w-3.5 h-3.5" /> Tambah Baris
            </button>

            <div className={`mt-4 p-3 rounded-lg flex justify-between text-xs font-bold ${isBalanced ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400' : 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400'}`}>
              <span>Debit: {formatRupiah(totalDebit)}</span>
              <span>Kredit: {formatRupiah(totalKredit)}</span>
              <span>{isBalanced ? 'Seimbang ✓' : 'Belum Seimbang'}</span>
            </div>

            <button
              onClick={handleSubmit}
              disabled={!isBalanced}
              className="w-full mt-4 py-2.5 rounded-lg bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              Simpan Jurnal
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-component: Buku Besar (PSAK)
// ---------------------------------------------------------------------------
function PSAKBukuBesar({ accounts, ledgers }: { accounts: Account[]; ledgers: ReturnType<typeof generateLedger> }) {
  const [selectedCode, setSelectedCode] = useState(accounts[0]?.code || '');
  const activeAccount = accounts.find(a => a.code === selectedCode);
  const rows = ledgers[selectedCode]?.rows || [];

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
      <h3 className="font-bold text-slate-900 dark:text-white mb-4">Buku Besar (PSAK)</h3>
      <select
        value={selectedCode}
        onChange={e => setSelectedCode(e.target.value)}
        className="w-full md:w-80 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 dark:bg-slate-800 text-sm mb-4"
      >
        {accounts.map(a => (
          <option key={a.code} value={a.code}>{a.code} - {a.name}</option>
        ))}
      </select>

      {activeAccount && (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 uppercase text-[10px]">
                <th className="text-left py-2">Tanggal</th>
                <th className="text-left py-2">Keterangan</th>
                <th className="text-left py-2">Ref</th>
                <th className="text-right py-2">Debit</th>
                <th className="text-right py-2">Kredit</th>
                <th className="text-right py-2">Saldo</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-6 text-slate-400">Belum ada transaksi untuk akun ini.</td></tr>
              ) : rows.map((r, i) => (
                <tr key={i} className="border-b border-slate-100 dark:border-slate-800/50">
                  <td className="py-2">{r.date}</td>
                  <td className="py-2">{r.description}</td>
                  <td className="py-2 font-mono text-slate-400">{r.refNo}</td>
                  <td className="py-2 text-right font-mono">{r.debit ? formatRupiah(r.debit) : ''}</td>
                  <td className="py-2 text-right font-mono">{r.kredit ? formatRupiah(r.kredit) : ''}</td>
                  <td className="py-2 text-right font-mono font-bold">{formatRupiah(r.balance)} {r.balanceType}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-component: Neraca Saldo (PSAK)
// ---------------------------------------------------------------------------
function PSAKNeracaSaldo({ trialBalance }: { trialBalance: ReturnType<typeof generateTrialBalance> }) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
      <h3 className="font-bold text-slate-900 dark:text-white mb-4">Neraca Saldo (PSAK)</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 uppercase text-[10px]">
              <th className="text-left py-2">Kode</th>
              <th className="text-left py-2">Nama Akun</th>
              <th className="text-right py-2">Debit</th>
              <th className="text-right py-2">Kredit</th>
            </tr>
          </thead>
          <tbody>
            {trialBalance.items.filter(i => i.debit !== 0 || i.kredit !== 0).map(item => (
              <tr key={item.account.code} className="border-b border-slate-100 dark:border-slate-800/50">
                <td className="py-2 font-mono text-slate-400">{item.account.code}</td>
                <td className="py-2">{item.account.name}</td>
                <td className="py-2 text-right font-mono">{item.debit ? formatRupiah(item.debit) : ''}</td>
                <td className="py-2 text-right font-mono">{item.kredit ? formatRupiah(item.kredit) : ''}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-slate-300 dark:border-slate-700 font-bold">
              <td colSpan={2} className="py-2">TOTAL</td>
              <td className="py-2 text-right font-mono">{formatRupiah(trialBalance.totalDebit)}</td>
              <td className="py-2 text-right font-mono">{formatRupiah(trialBalance.totalKredit)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
      <div className={`mt-4 p-3 rounded-lg text-xs font-bold flex items-center gap-2 ${trialBalance.isBalanced ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400' : 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400'}`}>
        {trialBalance.isBalanced ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
        {trialBalance.isBalanced ? 'Neraca saldo seimbang' : 'Neraca saldo tidak seimbang, periksa kembali jurnal Anda'}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-component: Laporan Keuangan (PSAK) - 4 laporan utama
// ---------------------------------------------------------------------------
function PSAKLaporanKeuangan({
  incomeStatement,
  equityStatement,
  balanceSheet,
  cashFlow,
  settings,
}: {
  incomeStatement: ReturnType<typeof generateIncomeStatement>;
  equityStatement: ReturnType<typeof generateEquityStatement>;
  balanceSheet: ReturnType<typeof generateBalanceSheet>;
  cashFlow: ReturnType<typeof generateDirectCashFlow>;
  settings: PSAKSettings;
}) {
  const [tab, setTab] = useState<'labarugi' | 'ekuitas' | 'posisikeuangan' | 'aruskas'>('labarugi');

  const tabs = [
    { key: 'labarugi', label: 'Laba Rugi Komprehensif' },
    { key: 'ekuitas', label: 'Perubahan Ekuitas' },
    { key: 'posisikeuangan', label: 'Posisi Keuangan' },
    { key: 'aruskas', label: 'Arus Kas' },
  ] as const;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
      <div className="flex gap-2 mb-5 overflow-x-auto">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap cursor-pointer ${
              tab === t.key ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="text-center mb-5">
        <h3 className="font-extrabold uppercase text-slate-900 dark:text-white">{settings.companyName}</h3>
        <p className="text-xs text-slate-500 mt-1">
          {tab === 'labarugi' && 'Laporan Laba Rugi dan Penghasilan Komprehensif Lain'}
          {tab === 'ekuitas' && 'Laporan Perubahan Ekuitas'}
          {tab === 'posisikeuangan' && 'Laporan Posisi Keuangan (Neraca)'}
          {tab === 'aruskas' && 'Laporan Arus Kas'}
        </p>
        <p className="text-[10px] text-slate-400 mt-0.5">Untuk Periode {settings.period} &bull; Disajikan sesuai PSAK</p>
      </div>

      {tab === 'labarugi' && (
        <div className="max-w-xl mx-auto text-sm space-y-3">
          <div>
            <p className="font-bold text-slate-700 dark:text-slate-200 mb-1">Pendapatan</p>
            {incomeStatement.revenues.map(r => (
              <div key={r.account.code} className="flex justify-between text-slate-600 dark:text-slate-300 pl-3">
                <span>{r.account.name}</span><span className="font-mono">{formatRupiah(r.amount)}</span>
              </div>
            ))}
            <div className="flex justify-between font-bold border-t border-slate-200 dark:border-slate-700 mt-1 pt-1">
              <span>Jumlah Pendapatan</span><span className="font-mono">{formatRupiah(incomeStatement.totalRevenue)}</span>
            </div>
          </div>
          <div>
            <p className="font-bold text-slate-700 dark:text-slate-200 mb-1">Beban</p>
            {incomeStatement.expenses.map(r => (
              <div key={r.account.code} className="flex justify-between text-slate-600 dark:text-slate-300 pl-3">
                <span>{r.account.name}</span><span className="font-mono">{formatRupiah(r.amount)}</span>
              </div>
            ))}
            <div className="flex justify-between font-bold border-t border-slate-200 dark:border-slate-700 mt-1 pt-1">
              <span>Jumlah Beban</span><span className="font-mono">{formatRupiah(incomeStatement.totalExpense)}</span>
            </div>
          </div>
          <div className="flex justify-between font-extrabold text-base border-t-2 border-slate-300 dark:border-slate-600 pt-2">
            <span>Laba Rugi Periode Berjalan</span><span className="font-mono">{formatRupiah(incomeStatement.netProfit)}</span>
          </div>
        </div>
      )}

      {tab === 'ekuitas' && (
        <div className="max-w-xl mx-auto text-sm space-y-2">
          <div className="flex justify-between text-slate-600 dark:text-slate-300">
            <span>Modal Awal</span><span className="font-mono">{formatRupiah(equityStatement.initialCapital)}</span>
          </div>
          <div className="flex justify-between text-slate-600 dark:text-slate-300">
            <span>Laba Periode Berjalan</span><span className="font-mono">{formatRupiah(equityStatement.netProfit)}</span>
          </div>
          <div className="flex justify-between text-slate-600 dark:text-slate-300">
            <span>Prive / Dividen</span><span className="font-mono">({formatRupiah(equityStatement.drawings)})</span>
          </div>
          <div className="flex justify-between font-extrabold text-base border-t-2 border-slate-300 dark:border-slate-600 pt-2">
            <span>Modal Akhir</span><span className="font-mono">{formatRupiah(equityStatement.endingCapital)}</span>
          </div>
        </div>
      )}

      {tab === 'posisikeuangan' && (
        <div className="max-w-2xl mx-auto text-sm grid md:grid-cols-2 gap-6">
          <div>
            <p className="font-bold text-slate-700 dark:text-slate-200 mb-1">Aset</p>
            <p className="text-[10px] text-slate-400 uppercase font-bold mt-2">Aset Lancar</p>
            {balanceSheet.assetsLancar.map(a => (
              <div key={a.account.code} className="flex justify-between text-slate-600 dark:text-slate-300">
                <span>{a.account.name}</span><span className="font-mono">{formatRupiah(a.amount)}</span>
              </div>
            ))}
            <p className="text-[10px] text-slate-400 uppercase font-bold mt-3">Aset Tidak Lancar</p>
            {balanceSheet.assetsTetap.map(a => (
              <div key={a.account.code} className="flex justify-between text-slate-600 dark:text-slate-300">
                <span>{a.account.name}</span><span className="font-mono">{formatRupiah(a.amount)}</span>
              </div>
            ))}
            <div className="flex justify-between font-extrabold border-t-2 border-slate-300 dark:border-slate-600 mt-2 pt-2">
              <span>Total Aset</span><span className="font-mono">{formatRupiah(balanceSheet.totalAssets)}</span>
            </div>
          </div>
          <div>
            <p className="font-bold text-slate-700 dark:text-slate-200 mb-1">Liabilitas dan Ekuitas</p>
            <p className="text-[10px] text-slate-400 uppercase font-bold mt-2">Liabilitas Jangka Pendek</p>
            {balanceSheet.liabilitiesShort.map(l => (
              <div key={l.account.code} className="flex justify-between text-slate-600 dark:text-slate-300">
                <span>{l.account.name}</span><span className="font-mono">{formatRupiah(l.amount)}</span>
              </div>
            ))}
            <p className="text-[10px] text-slate-400 uppercase font-bold mt-3">Liabilitas Jangka Panjang</p>
            {balanceSheet.liabilitiesLong.map(l => (
              <div key={l.account.code} className="flex justify-between text-slate-600 dark:text-slate-300">
                <span>{l.account.name}</span><span className="font-mono">{formatRupiah(l.amount)}</span>
              </div>
            ))}
            <div className="flex justify-between font-bold mt-2">
              <span>Total Liabilitas</span><span className="font-mono">{formatRupiah(balanceSheet.totalLiabilities)}</span>
            </div>
            <div className="flex justify-between text-slate-600 dark:text-slate-300 mt-2">
              <span>Total Ekuitas</span><span className="font-mono">{formatRupiah(balanceSheet.totalEquity)}</span>
            </div>
            <div className="flex justify-between font-extrabold border-t-2 border-slate-300 dark:border-slate-600 mt-2 pt-2">
              <span>Total Liabilitas dan Ekuitas</span>
              <span className="font-mono">{formatRupiah(balanceSheet.totalLiabilities + balanceSheet.totalEquity)}</span>
            </div>
          </div>
          <div className={`md:col-span-2 mt-2 p-3 rounded-lg text-xs font-bold flex items-center gap-2 ${balanceSheet.isBalanced ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400' : 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400'}`}>
            {balanceSheet.isBalanced ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
            {balanceSheet.isBalanced ? 'Laporan posisi keuangan seimbang' : `Selisih ${formatRupiah(balanceSheet.difference)}, periksa kembali data Anda`}
          </div>
        </div>
      )}

      {tab === 'aruskas' && (
        <div className="max-w-xl mx-auto text-sm space-y-4">
          <div>
            <p className="font-bold text-slate-700 dark:text-slate-200 mb-1">Aktivitas Operasi</p>
            {cashFlow.operatingActivities.map((r, i) => (
              <div key={i} className="flex justify-between text-slate-600 dark:text-slate-300 pl-3">
                <span>{r.description}</span><span className="font-mono">{formatRupiah(r.amount)}</span>
              </div>
            ))}
            <div className="flex justify-between font-bold border-t border-slate-200 dark:border-slate-700 mt-1 pt-1">
              <span>Kas Bersih dari Aktivitas Operasi</span><span className="font-mono">{formatRupiah(cashFlow.totalOperating)}</span>
            </div>
          </div>
          <div>
            <p className="font-bold text-slate-700 dark:text-slate-200 mb-1">Aktivitas Investasi</p>
            {cashFlow.investingActivities.map((r, i) => (
              <div key={i} className="flex justify-between text-slate-600 dark:text-slate-300 pl-3">
                <span>{r.description}</span><span className="font-mono">{formatRupiah(r.amount)}</span>
              </div>
            ))}
            <div className="flex justify-between font-bold border-t border-slate-200 dark:border-slate-700 mt-1 pt-1">
              <span>Kas Bersih dari Aktivitas Investasi</span><span className="font-mono">{formatRupiah(cashFlow.totalInvesting)}</span>
            </div>
          </div>
          <div>
            <p className="font-bold text-slate-700 dark:text-slate-200 mb-1">Aktivitas Pendanaan</p>
            {cashFlow.financingActivities.map((r, i) => (
              <div key={i} className="flex justify-between text-slate-600 dark:text-slate-300 pl-3">
                <span>{r.description}</span><span className="font-mono">{formatRupiah(r.amount)}</span>
              </div>
            ))}
            <div className="flex justify-between font-bold border-t border-slate-200 dark:border-slate-700 mt-1 pt-1">
              <span>Kas Bersih dari Aktivitas Pendanaan</span><span className="font-mono">{formatRupiah(cashFlow.totalFinancing)}</span>
            </div>
          </div>
          <div className="flex justify-between font-extrabold text-base border-t-2 border-slate-300 dark:border-slate-600 pt-2">
            <span>Kenaikan (Penurunan) Kas Bersih</span><span className="font-mono">{formatRupiah(cashFlow.netCashFlow)}</span>
          </div>
          <div className="flex justify-between text-slate-600 dark:text-slate-300">
            <span>Kas Awal Periode</span><span className="font-mono">{formatRupiah(cashFlow.initialCash)}</span>
          </div>
          <div className="flex justify-between font-bold">
            <span>Kas Akhir Periode</span><span className="font-mono">{formatRupiah(cashFlow.endingCash)}</span>
          </div>
        </div>
      )}
    </div>
  );
}
