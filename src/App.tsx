import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar,
  DollarSign,
  Settings,
  RefreshCw,
  FileText,
  Calculator,
  Book,
  Grid,
  Trash2,
  Plus,
  Moon,
  Sun,
  Download,
  Sparkles,
  CheckCircle,
  TrendingUp,
  Printer,
  ChevronRight,
  Eye,
  EyeOff,
  Briefcase,
  Layers,
  Award,
  BookOpen,
  PieChart,
  HelpCircle,
  FileCheck,
  Building,
  ToggleLeft,
  ArrowRightLeft,
  CheckCircle2,
  X,
  ListFilter,
  FileSpreadsheet,
  Menu,
  MoreHorizontal,
  AlertTriangle,
  Scale,
} from 'lucide-react';

import PSAKModule from './components/PSAKModule';

import {
  Account,
  JournalTransaction,
  JournalEntryItem,
  SystemSettings
} from './types';

import {
  DEFAULT_ACCOUNTS,
  generateLedger,
  generateTrialBalance,
  generateIncomeStatement,
  generateEquityStatement,
  generateBalanceSheet,
  generateDirectCashFlow,
  generateIndirectCashFlow,
  formatRupiah,
  formatNumberOnly,
  isCashAccount
} from './accountingEngine';

import { GeminiParser } from './components/GeminiParser';
import { COAManager } from './components/COAManager';
import { AccountingCalculators } from './components/AccountingCalculators';

// Import New SAK Advanced Modules
import AnalisisTransaksi from './components/AnalisisTransaksi';
import KertasKerja from './components/KertasKerja';
import JurnalPenutup from './components/JurnalPenutup';
import { loadSheetJS, exportAllReportsToExcel } from './utils/excelExporter';

// SEED TRANSACTIONS
const INITIAL_TRANSACTIONS: JournalTransaction[] = [
  {
    id: 'tx_seed_1',
    date: '2026-06-01',
    refNo: 'JR-101',
    description: 'Setoran modal pertama oleh pemilik berupa uang tunai',
    entries: [
      { id: 'tx_seed_1_e1', accountCode: '101', posisi: 'debit', nominal: 100000000 },
      { id: 'tx_seed_1_e2', accountCode: '301', posisi: 'kredit', nominal: 100000000 }
    ]
  },
  {
    id: 'tx_seed_2',
    date: '2026-06-02',
    refNo: 'JR-102',
    description: 'Membayar sewa ruko tahunan untuk tempat usaha',
    entries: [
      { id: 'tx_seed_2_e1', accountCode: '106', posisi: 'debit', nominal: 12000000 },
      { id: 'tx_seed_2_e2', accountCode: '101', posisi: 'kredit', nominal: 12000000 }
    ]
  },
  {
    id: 'tx_seed_3',
    date: '2026-06-05',
    refNo: 'JR-103',
    description: 'Membeli peralatan reparasi teknologi komputer',
    entries: [
      { id: 'tx_seed_3_e1', accountCode: '151', posisi: 'debit', nominal: 25000000 },
      { id: 'tx_seed_3_e2', accountCode: '101', posisi: 'kredit', nominal: 25000000 }
    ]
  },
  {
    id: 'tx_seed_4',
    date: '2026-06-07',
    refNo: 'JR-104',
    description: 'Membeli perlengkapan toko secara kredit dari Toko Abadi',
    entries: [
      { id: 'tx_seed_4_e1', accountCode: '104', posisi: 'debit', nominal: 5000000 },
      { id: 'tx_seed_4_e2', accountCode: '201', posisi: 'kredit', nominal: 5000000 }
    ]
  },
  {
    id: 'tx_seed_5',
    date: '2026-06-12',
    refNo: 'JR-105',
    description: 'Menerima tunai pendapatan jasa perawatan server web retail',
    entries: [
      { id: 'tx_seed_5_e1', accountCode: '101', posisi: 'debit', nominal: 18500000 },
      { id: 'tx_seed_5_e2', accountCode: '401', posisi: 'kredit', nominal: 18500000 }
    ]
  },
  {
    id: 'tx_seed_6',
    date: '2026-06-15',
    refNo: 'JR-106',
    description: 'Menyelesaikan konsultasi jaringan ruko, tagihan dikirim ke klien',
    entries: [
      { id: 'tx_seed_6_e1', accountCode: '103', posisi: 'debit', nominal: 9000000 },
      { id: 'tx_seed_6_e2', accountCode: '401', posisi: 'kredit', nominal: 9000000 }
    ]
  },
  {
    id: 'tx_seed_7',
    date: '2026-06-20',
    refNo: 'JR-107',
    description: 'Membayar lunas utang pembelian perlengkapan ke Toko Abadi',
    entries: [
      { id: 'tx_seed_7_e1', accountCode: '201', posisi: 'debit', nominal: 5000000 },
      { id: 'tx_seed_7_e2', accountCode: '101', posisi: 'kredit', nominal: 5000000 }
    ]
  },
  {
    id: 'tx_seed_8',
    date: '2026-06-22',
    refNo: 'JR-108',
    description: 'Penarikan dana tunai (prive) untuk kebutuhan darurat keluarga',
    entries: [
      { id: 'tx_seed_8_e1', accountCode: '302', posisi: 'debit', nominal: 3500000 },
      { id: 'tx_seed_8_e2', accountCode: '101', posisi: 'kredit', nominal: 3500000 }
    ]
  },
  {
    id: 'tx_seed_9',
    date: '2026-06-28',
    refNo: 'JR-109',
    description: 'Membayar beban utilitas bulanan (listrik dan akses internet)',
    entries: [
      { id: 'tx_seed_9_e1', accountCode: '506', posisi: 'debit', nominal: 1800000 },
      { id: 'tx_seed_9_e2', accountCode: '101', posisi: 'kredit', nominal: 1800000 }
    ]
  },
  {
    id: 'tx_seed_10',
    date: '2026-06-30',
    refNo: 'JR-110',
    description: 'Membayar gaji pokok dua karyawan admin dan teknisi lapangan',
    entries: [
      { id: 'tx_seed_10_e1', accountCode: '501', posisi: 'debit', nominal: 7000000 },
      { id: 'tx_seed_10_e2', accountCode: '101', posisi: 'kredit', nominal: 7000000 }
    ]
  },
  {
    id: 'tx_seed_11',
    date: '2026-06-30',
    refNo: 'JR-111',
    description: 'Penyesuaian: perlengkapan yang dipakai selama sebulan berjalan',
    entries: [
      { id: 'tx_seed_11_e1', accountCode: '503', posisi: 'debit', nominal: 1500000 },
      { id: 'tx_seed_11_e2', accountCode: '104', posisi: 'kredit', nominal: 1500000 }
    ]
  },
  {
    id: 'tx_seed_12',
    date: '2026-06-30',
    refNo: 'JR-112',
    description: 'Penyesuaian: biaya penyusutan bulanan untuk peralatan komputer',
    entries: [
      { id: 'tx_seed_12_e1', accountCode: '504', posisi: 'debit', nominal: 400000 },
      { id: 'tx_seed_12_e2', accountCode: '152', posisi: 'kredit', nominal: 400000 }
    ]
  }
];

export default function App() {
  // Navigation Menu active state
  type MainTab = 'dashboard' | 'jurnal' | 'bukubesar' | 'neracasaldo' | 'laporan' | 'analisistransaksi' | 'kertaskerja' | 'jurnalpenutup' | 'coa' | 'calculators' | 'settings' | 'psak';
  const [activeTab, setActiveTab] = useState<MainTab>('dashboard');
  const [showMobileMore, setShowMobileMore] = useState(false);

  // Laporan sub tab
  type LaporanSubTab = 'labarugi' | 'ekuitas' | 'neraca' | 'aruskas';
  const [activeLaporanTab, setActiveLaporanTab] = useState<LaporanSubTab>('labarugi');

  // Arus kas method
  const [cashFlowMethod, setCashFlowMethod] = useState<'langsung' | 'tidak_langsung'>('langsung');

  // Toast System state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
  };

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // System Core state loaded from LocalStorage
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<JournalTransaction[]>([]);
  const [settings, setSettings] = useState<SystemSettings>({
    geminiApiKey: '',
    companyName: 'PT Bintang Sejahtera',
    period: 'Januari 2025',
    namaPemilik: 'Tuan Budi',
    alamatPerusahaan: 'Jl. Jenderal Sudirman No. 12, Jakarta',
    tanggalAwal: '2025-01-01',
    tanggalAkhir: '2025-01-31',
    matauang: 'IDR',
    saldoAwalKas: 0
  });
  const [showApiKey, setShowApiKey] = useState(false);
  const [themeMode, setThemeMode] = useState<'light' | 'dark'>('light');

  // Initialize data
  useEffect(() => {
    // 1. Chart of Accounts
    const localCOA = localStorage.getItem('chartOfAccounts');
    if (localCOA) {
      try {
        setAccounts(JSON.parse(localCOA));
      } catch {
        setAccounts(DEFAULT_ACCOUNTS);
      }
    } else {
      setAccounts(DEFAULT_ACCOUNTS);
      localStorage.setItem('chartOfAccounts', JSON.stringify(DEFAULT_ACCOUNTS));
    }

    // 2. Transactions
    const localTx = localStorage.getItem('jurnalUmum');
    if (localTx) {
      try {
        setTransactions(JSON.parse(localTx));
      } catch {
        setTransactions(INITIAL_TRANSACTIONS);
      }
    } else {
      setTransactions(INITIAL_TRANSACTIONS);
      localStorage.setItem('jurnalUmum', JSON.stringify(INITIAL_TRANSACTIONS));
    }

    // 3. Settings
    const geminiApiKey = localStorage.getItem('geminiApiKey') || '';
    const companyName = localStorage.getItem('namaPerusahaan') || 'PT Bintang Sejahtera';
    const period = localStorage.getItem('periodelaporan') || 'Januari 2025';
    const namaPemilik = localStorage.getItem('namaPemilik') || 'Tuan Budi';
    const alamatPerusahaan = localStorage.getItem('alamatPerusahaan') || 'Jl. Jenderal Sudirman No. 12, Jakarta';
    const tanggalAwal = localStorage.getItem('tanggalAwal') || '2025-01-01';
    const tanggalAkhir = localStorage.getItem('tanggalAkhir') || '2025-01-31';
    const matauang = localStorage.getItem('matauang') || 'IDR';
    const saldoAwalKas = Number(localStorage.getItem('saldoAwalKas') || '0');
    setSettings({ 
      geminiApiKey, 
      companyName, 
      period, 
      namaPemilik, 
      alamatPerusahaan, 
      tanggalAwal, 
      tanggalAkhir, 
      matauang, 
      saldoAwalKas 
    });

    // 4. Dark Theme preference
    const localTheme = localStorage.getItem('themeMode') || 'light';
    setThemeMode(localTheme as 'light' | 'dark');
    if (localTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  // Sync settings when modified
  const saveSettingsToLocal = (newSettings: SystemSettings) => {
    localStorage.setItem('geminiApiKey', newSettings.geminiApiKey || '');
    localStorage.setItem('namaPerusahaan', newSettings.companyName || '');
    localStorage.setItem('periodelaporan', newSettings.period || '');
    localStorage.setItem('namaPemilik', newSettings.namaPemilik || 'Tuan Budi');
    localStorage.setItem('alamatPerusahaan', newSettings.alamatPerusahaan || 'Jl. Jenderal Sudirman No. 12, Jakarta');
    localStorage.setItem('tanggalAwal', newSettings.tanggalAwal || '2025-01-01');
    localStorage.setItem('tanggalAkhir', newSettings.tanggalAkhir || '2025-01-31');
    localStorage.setItem('matauang', newSettings.matauang || 'IDR');
    localStorage.setItem('saldoAwalKas', String(newSettings.saldoAwalKas || 0));
    setSettings(newSettings);
    showToast('Pengaturan agensi berhasil disimpan', 'success');
  };

  // Toggle visual theme
  const toggleTheme = () => {
    const nextTheme = themeMode === 'light' ? 'dark' : 'light';
    setThemeMode(nextTheme);
    localStorage.setItem('themeMode', nextTheme);
    if (nextTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    showToast(`Tema beralih ke Mode ${nextTheme === 'dark' ? 'Gelap' : 'Terang'}`, 'success');
  };

  // Parentheses-based SAK currency formatter
  const formatRupiahParentheses = (val: number, isContra = false) => {
    const symbol = settings.matauang === 'USD' ? '$' : 'Rp';
    if (val < 0) {
      return `(${symbol} ${formatNumberOnly(Math.abs(val))})`;
    }
    if (isContra && val !== 0) {
      return `(${symbol} ${formatNumberOnly(val)})`;
    }
    return `${symbol} ${formatNumberOnly(val)}`;
  };

  // Lazy dynamic SheetJS runner for SAK Excel Exporter
  const handleDownloadExcel = async () => {
    try {
      showToast('Menghubungkan ke server CDN SheetJS...', 'success');
      const XLSX = await loadSheetJS();
      if (!XLSX) {
        showToast('Gagal memuat pustaka SheetJS. Silakan periksa koneksi internet Anda.', 'error');
        return;
      }
      showToast('Menyusun lembaran kerja akuntansi SAK EP...', 'success');
      exportAllReportsToExcel(XLSX, transactions, accounts, settings);
      showToast('File laporan keuangan (.xlsx) berhasil diunduh!', 'success');
    } catch (err: any) {
      console.error(err);
      showToast('Gagal mengekspor berkas Excel: ' + err.message, 'error');
    }
  };

  // State to manage accounts changes
  const handleAccountsChange = (updated: Account[]) => {
    setAccounts(updated);
    localStorage.setItem('chartOfAccounts', JSON.stringify(updated));
  };

  // Reset standard CoA
  const handleResetAccounts = () => {
    if (window.confirm('Apakah Anda ingin memulihkan Chart of Accounts ke daftar standar akuntansi Indonesia? Data akun kustom akan hilang.')) {
      setAccounts(DEFAULT_ACCOUNTS);
      localStorage.setItem('chartOfAccounts', JSON.stringify(DEFAULT_ACCOUNTS));
      showToast('Bagan perkiraan dikembalikan ke standar Indonesia', 'success');
    }
  };

  // Reset completely
  const handleResetAllData = () => {
    if (window.confirm('PERINGATAN: Tindakan ini akan menghapus semua jurnal umum, setelan, kunci API, dan daftar akun dari penyimpanan browser Anda. Lanjutkan?')) {
      localStorage.clear();
      setAccounts(DEFAULT_ACCOUNTS);
      setTransactions([]);
      setSettings({ geminiApiKey: '', companyName: 'Perusahaan Baru', period: 'Periode Berjalan' });
      localStorage.setItem('chartOfAccounts', JSON.stringify(DEFAULT_ACCOUNTS));
      localStorage.setItem('jurnalUmum', JSON.stringify([]));
      showToast('Penyimpanan lokal berhasil dihapus total', 'success');
      setActiveTab('dashboard');
    }
  };

  // ============================================
  // FORM JURNAL STATE
  // ============================================
  const [editingTxId, setEditingTxId] = useState<string | null>(null);
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [formRefNo, setFormRefNo] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formEntries, setFormEntries] = useState<Omit<JournalEntryItem, 'id'>[]>([
    { accountCode: '101', posisi: 'debit', nominal: 0 },
    { accountCode: '301', posisi: 'kredit', nominal: 0 }
  ]);

  // Autofill Ref Jurnal
  useEffect(() => {
    if (!editingTxId && formRefNo === '') {
      const nextNo = `JR-${Math.floor(100 + Math.random() * 900)}`;
      setFormRefNo(nextNo);
    }
  }, [editingTxId, transactions]);

  // Form balance calculations
  const formDebitTotal = formEntries
    .filter(e => e.posisi === 'debit')
    .reduce((sum, e) => sum + e.nominal, 0);

  const formKreditTotal = formEntries
    .filter(e => e.posisi === 'kredit')
    .reduce((sum, e) => sum + e.nominal, 0);

  const isFormBalanced = Math.abs(formDebitTotal - formKreditTotal) < 0.01 && formDebitTotal > 0;

  const handleAddFormRow = () => {
    setFormEntries([...formEntries, { accountCode: '101', posisi: 'debit', nominal: 0 }]);
  };

  const handleRemoveFormRow = (idx: number) => {
    if (formEntries.length <= 2) {
      showToast('Transaksi minimal terdiri dari 2 baris pencatatan (Debit & Kredit)', 'error');
      return;
    }
    setFormEntries(formEntries.filter((_, i) => i !== idx));
  };

  const handleEntryFieldChange = (idx: number, field: keyof Omit<JournalEntryItem, 'id'>, value: any) => {
    const updated = [...formEntries];
    updated[idx] = { ...updated[idx], [field]: value };
    setFormEntries(updated);
  };

  const saveJournalTransaction = (e: React.FormEvent) => {
    e.preventDefault();

    if (!isFormBalanced) {
      showToast(`Formulir tidak seimbang! Total Debit (${formatRupiah(formDebitTotal)}) harus sama dengan Kredit (${formatRupiah(formKreditTotal)})`, 'error');
      return;
    }

    if (formDescription.trim() === '') {
      showToast('Silakan isi keterangan transaksi terlebih dahulu', 'error');
      return;
    }

    const txId = editingTxId || `tx_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    
    const entriesWithId: JournalEntryItem[] = formEntries.map((e, idx) => ({
      ...e,
      id: `${txId}_itm_${idx}`
    }));

    const newTx: JournalTransaction = {
      id: txId,
      date: formDate,
      refNo: formRefNo,
      description: formDescription,
      entries: entriesWithId
    };

    let updatedTxList: JournalTransaction[];
    if (editingTxId) {
      updatedTxList = transactions.map(t => (t.id === editingTxId ? newTx : t));
      showToast('Transaksi jurnal berhasil diperbarui', 'success');
    } else {
      updatedTxList = [...transactions, newTx];
      showToast('Tranksasi baru berhasil dicatat di Jurnal Umum', 'success');
    }

    // Sort by date then save
    updatedTxList.sort((a, b) => a.date.localeCompare(b.date));
    setTransactions(updatedTxList);
    localStorage.setItem('jurnalUmum', JSON.stringify(updatedTxList));

    // Clear form
    setEditingTxId(null);
    setFormDate(new Date().toISOString().split('T')[0]);
    setFormRefNo(`JR-${Math.floor(100 + Math.random() * 900)}`);
    setFormDescription('');
    setFormEntries([
      { accountCode: '101', posisi: 'debit', nominal: 0 },
      { accountCode: '301', posisi: 'kredit', nominal: 0 }
    ]);
  };

  const handleEditTx = (tx: JournalTransaction) => {
    setEditingTxId(tx.id);
    setFormDate(tx.date);
    setFormRefNo(tx.refNo);
    setFormDescription(tx.description);
    setFormEntries(tx.entries.map(({ accountCode, posisi, nominal }) => ({ accountCode, posisi, nominal })));
    // Scroll to form
    const formElement = document.getElementById('manual-journal-form');
    if (formElement) {
      formElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleDeleteTx = (id: string, refNo: string) => {
    if (window.confirm(`Hapus transaksi ${refNo}? Tindakan ini bersifat permanen.`)) {
      const filtered = transactions.filter(t => t.id !== id);
      setTransactions(filtered);
      localStorage.setItem('jurnalUmum', JSON.stringify(filtered));
      showToast(`Transaksi ${refNo} berhasil dihapus`, 'success');
      if (editingTxId === id) {
        setEditingTxId(null);
      }
    }
  };

  const handleDeleteAllTx = () => {
    if (window.confirm('Apakah Anda yakin ingin menghapus seluruh log jurnal transaksi keuangan? Semua perhitungan laporan akan dikosongkan.')) {
      setTransactions([]);
      localStorage.setItem('jurnalUmum', JSON.stringify([]));
      showToast('Seluruh jurnal transaksi berhasil dihapus bersh', 'success');
    }
  };

  // Called when Gemini API parses transactions
  const handleTransactionsParsed = (newTxs: JournalTransaction[]) => {
    const combined = [...transactions, ...newTxs];
    combined.sort((a, b) => a.date.localeCompare(b.date));
    setTransactions(combined);
    localStorage.setItem('jurnalUmum', JSON.stringify(combined));
  };

  // ============================================
  // DERIVED CALCULATIONS & REPORTS
  // ============================================
  const ledgers = useMemo(() => generateLedger(transactions, accounts), [transactions, accounts]);
  
  const trialBalance = useMemo(() => generateTrialBalance(transactions, accounts), [transactions, accounts]);

  const incomeStatement = useMemo(() => generateIncomeStatement(transactions, accounts), [transactions, accounts]);

  const equityStatement = useMemo(() => {
    return generateEquityStatement(transactions, accounts, incomeStatement.netProfit);
  }, [transactions, accounts, incomeStatement.netProfit]);

  const balanceSheet = useMemo(() => {
    return generateBalanceSheet(transactions, accounts, incomeStatement.netProfit);
  }, [transactions, accounts, incomeStatement.netProfit]);

  const cashFlowDirect = useMemo(() => {
    return generateDirectCashFlow(transactions, accounts);
  }, [transactions, accounts]);

  const cashFlowIndirect = useMemo(() => {
    return generateIndirectCashFlow(transactions, accounts, incomeStatement.netProfit);
  }, [transactions, accounts, incomeStatement.netProfit]);

  // Active Buku Besar ledger account
  const [activeLedgerCode, setActiveLedgerCode] = useState('101');
  const ledgersWithActivity = useMemo(() => {
    return (Object.values(ledgers) as any[]).filter(summary => summary.rows.length > 0 || summary.account.code === '101');
  }, [ledgers]);

  // Dashboard Stats
  const statsSummary = useMemo(() => {
    const totalAssets = balanceSheet.totalAssets;
    const totalLiabilities = balanceSheet.totalLiabilities;
    const netProfit = incomeStatement.netProfit;
    const journalCount = transactions.length;

    return {
      totalAssets,
      totalLiabilities,
      netProfit,
      journalCount
    };
  }, [balanceSheet, incomeStatement, transactions]);

  // Trigger browser print
  const handlePrint = () => {
    window.print();
  };

  // Dynamic state class helper for dark/light values
  const textPrimary = 'text-slate-800 dark:text-white';
  const textSecondary = 'text-slate-500 dark:text-slate-400';
  const cardBg = 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80';

  return (
    <div className="min-h-screen bg-[#f0f2f5] dark:bg-slate-950 font-sans text-slate-800 dark:text-slate-100 flex flex-col md:flex-row transition-colors duration-200">
      
      {/* Toast Notification Container */}
      {toast && (
        <div id="toast" className={`fixed top-4 right-4 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg border transition-all animate-bounce ${
          toast.type === 'success'
            ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/90 dark:text-emerald-400 dark:border-emerald-900'
            : 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/90 dark:text-rose-400 dark:border-rose-900'
        }`}>
          {toast.type === 'success' ? <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" /> : <X className="w-5 h-5 text-rose-600 dark:text-rose-400" />}
          <span className="text-xs font-bold font-sans">{toast.message}</span>
        </div>
      )}

      {/* SIDEBAR NAVIGATION - Responsive: hidden on mobile, compact on tablet, full on desktop */}
      <aside className="hidden md:flex md:w-20 lg:w-64 shrink-0 bg-[#1e3a5f] dark:bg-slate-900 text-slate-200 border-r border-white/10 dark:border-slate-800 flex-col print:hidden transition-all duration-300">
        <div className="p-6 border-b border-white/10 dark:border-slate-800 flex items-center justify-between gap-1 lg:gap-2.5">
          <div className="md:hidden lg:block">
            <h1 className="text-xl font-bold tracking-tight uppercase flex items-center gap-2 text-white">
              <img
                src="https://github.com/nadhiframadhan780-dev/appsmanegeri68jakarta/blob/main/NarKuntansi.png?raw=true"
                alt="NarKuntansi Logo"
                className="w-7 h-7 rounded-md object-cover"
              />
              NarKuntansi
            </h1>
            <p className="text-[10px] text-white/50 uppercase tracking-widest mt-1 font-mono">SAK EP Suite 2026</p>
            <p className="text-[9px] text-emerald-300 font-mono mt-1 font-semibold tracking-wider">By Nadhif Aulia R.</p>
          </div>
          
          <div className="hidden md:block lg:hidden text-center mx-auto">
            <img
              src="https://github.com/nadhiframadhan780-dev/appsmanegeri68jakarta/blob/main/NarKuntansi.png?raw=true"
              alt="NarKuntansi Logo"
              className="w-7 h-7 rounded-md object-cover mx-auto"
              title="NarKuntansi"
            />
          </div>

          <button
            onClick={toggleTheme}
            className="p-2 hover:bg-white/10 rounded-lg text-slate-300 hover:text-white transition-colors cursor-pointer md:hidden lg:block"
            title="Sembunyikan / Tampilkan mode gelap"
          >
            {themeMode === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4 text-amber-400" />}
          </button>
        </div>

        {/* Company profile miniature - hidden on tablet rail */}
        <div className="px-6 py-4 bg-black/10 border-b border-white/5 text-xs text-slate-300 md:hidden lg:block">
          <p className="text-white/40 font-bold uppercase tracking-widest text-[9px]">Badan Usaha Aktif</p>
          <p className="text-white font-semibold truncate mt-0.5">{settings.companyName}</p>
          <p className="text-emerald-400/95 font-mono text-[10px] mt-0.5">Periode: {settings.period}</p>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {/* Section: Core Accounting */}
          <div className="text-[10px] text-white/45 dark:text-slate-400 uppercase font-black px-3.5 py-1.5 tracking-wider font-mono md:hidden lg:block">Core Accounting</div>
          
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold tracking-wide text-left transition-all cursor-pointer ${
              activeTab === 'dashboard'
                ? 'bg-white/10 text-white font-bold border-l-2 border-emerald-400'
                : 'text-white/70 hover:bg-white/5 hover:text-white'
            }`}
          >
            <Grid className="w-4 h-4 text-white/60 mx-auto lg:mx-0" />
            <span className="md:hidden lg:inline">Beranda &amp; AI Parser</span>
          </button>

          <button
            onClick={() => setActiveTab('jurnal')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold tracking-wide text-left transition-all cursor-pointer ${
              activeTab === 'jurnal'
                ? 'bg-white/10 text-white font-bold border-l-2 border-emerald-400'
                : 'text-white/70 hover:bg-white/5 hover:text-white'
            }`}
          >
            <Book className="w-4 h-4 text-white/60 mx-auto lg:mx-0" />
            <span className="md:hidden lg:inline">Jurnal Umum</span>
            {transactions.length > 0 && (
              <span className="ml-auto bg-white/15 text-white px-1.5 py-0.5 rounded text-[9px] font-mono md:hidden lg:inline-block">
                {transactions.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('bukubesar')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold tracking-wide text-left transition-all cursor-pointer ${
              activeTab === 'bukubesar'
                ? 'bg-white/10 text-white font-bold border-l-2 border-emerald-400'
                : 'text-white/70 hover:bg-white/5 hover:text-white'
            }`}
          >
            <Layers className="w-4 h-4 text-white/60 mx-auto lg:mx-0" />
            <span className="md:hidden lg:inline">Buku Besar (Ledger)</span>
          </button>

          <button
            onClick={() => setActiveTab('neracasaldo')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold tracking-wide text-left transition-all cursor-pointer ${
              activeTab === 'neracasaldo'
                ? 'bg-white/10 text-white font-bold border-l-2 border-emerald-400'
                : 'text-white/70 hover:bg-white/5 hover:text-white'
            }`}
          >
            <ArrowRightLeft className="w-4 h-4 text-white/60 mx-auto lg:mx-0" />
            <span className="md:hidden lg:inline">Neraca Saldo</span>
            {trialBalance.isBalanced ? (
              <span className="ml-auto w-2 h-2 rounded-full bg-emerald-400 md:hidden lg:block" title="Neraca Berimbang" />
            ) : (
              <span className="ml-auto w-2 h-2 rounded-full bg-rose-400 animate-pulse md:hidden lg:block" title="Neraca Tidak Seimbang" />
            )}
          </button>

          {/* Section: Laporan SAK */}
          <div className="text-[10px] text-white/45 dark:text-slate-400 uppercase font-black px-3.5 py-1.5 mt-4 tracking-wider font-mono md:hidden lg:block">Laporan SAK</div>

          <button
            onClick={() => setActiveTab('laporan')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold tracking-wide text-left transition-all cursor-pointer ${
              activeTab === 'laporan'
                ? 'bg-white/10 text-white font-bold border-l-2 border-emerald-400'
                : 'text-white/70 hover:bg-white/5 hover:text-white'
            }`}
          >
            <FileText className="w-4 h-4 text-white/60 mx-auto lg:mx-0" />
            <span className="md:hidden lg:inline">Laporan Keuangan SAK</span>
          </button>

          {/* Section: Siklus Lanjutan SAK */}
          <div className="text-[10px] text-white/45 dark:text-slate-400 uppercase font-black px-3.5 py-1.5 mt-4 tracking-wider font-mono md:hidden lg:block">Siklus Lanjutan SAK</div>

          <button
            onClick={() => setActiveTab('analisistransaksi')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold tracking-wide text-left transition-all cursor-pointer ${
              activeTab === 'analisistransaksi'
                ? 'bg-white/10 text-white font-bold border-l-2 border-emerald-400'
                : 'text-white/70 hover:bg-white/5 hover:text-white'
            }`}
          >
            <PieChart className="w-4 h-4 text-white/60 mx-auto lg:mx-0" />
            <span className="md:hidden lg:inline">Analisis Transaksi</span>
          </button>

          <button
            onClick={() => setActiveTab('kertaskerja')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold tracking-wide text-left transition-all cursor-pointer ${
              activeTab === 'kertaskerja'
                ? 'bg-white/10 text-white font-bold border-l-2 border-emerald-400'
                : 'text-white/70 hover:bg-white/5 hover:text-white'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4 text-white/60 mx-auto lg:mx-0" />
            <span className="md:hidden lg:inline">Kertas Kerja (Worksheet)</span>
          </button>

          <button
            onClick={() => setActiveTab('jurnalpenutup')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold tracking-wide text-left transition-all cursor-pointer ${
              activeTab === 'jurnalpenutup'
                ? 'bg-white/10 text-white font-bold border-l-2 border-emerald-400'
                : 'text-white/70 hover:bg-white/5 hover:text-white'
            }`}
          >
            <FileCheck className="w-4 h-4 text-white/60 mx-auto lg:mx-0" />
            <span className="md:hidden lg:inline">Jurnal Penutup SAK</span>
          </button>

          {/* Section: Standar Lain */}
          <div className="text-[10px] text-white/45 dark:text-slate-400 uppercase font-black px-3.5 py-1.5 mt-4 tracking-wider font-mono md:hidden lg:block">Standar Lain</div>

          <button
            onClick={() => setActiveTab('psak')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold tracking-wide text-left transition-all cursor-pointer ${
              activeTab === 'psak'
                ? 'bg-white/10 text-white font-bold border-l-2 border-indigo-400'
                : 'text-white/70 hover:bg-white/5 hover:text-white'
            }`}
          >
            <Scale className="w-4 h-4 text-white/60 mx-auto lg:mx-0" />
            <span className="md:hidden lg:inline">PSAK / SAK Umum</span>
          </button>

          {/* Section: Tools & Config */}
          <div className="text-[10px] text-white/45 dark:text-slate-400 uppercase font-black px-3.5 py-1.5 mt-4 tracking-wider font-mono md:hidden lg:block">Tools &amp; Config</div>

          <button
            onClick={() => setActiveTab('coa')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold tracking-wide text-left transition-all cursor-pointer ${
              activeTab === 'coa'
                ? 'bg-white/10 text-white font-bold border-l-2 border-emerald-400'
                : 'text-white/70 hover:bg-white/5 hover:text-white'
            }`}
          >
            <BookOpen className="w-4 h-4 text-white/60 mx-auto lg:mx-0" />
            <span className="md:hidden lg:inline">Daftar Perkiraan (COA)</span>
          </button>

          <button
            onClick={() => setActiveTab('calculators')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold tracking-wide text-left transition-all cursor-pointer ${
              activeTab === 'calculators'
                ? 'bg-white/10 text-white font-bold border-l-2 border-emerald-400'
                : 'text-white/70 hover:bg-white/5 hover:text-white'
            }`}
          >
            <Calculator className="w-4 h-4 text-white/60 mx-auto lg:mx-0" />
            <span className="md:hidden lg:inline">Rumus &amp; Kalkulator</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold tracking-wide text-left transition-all cursor-pointer ${
              activeTab === 'settings'
                ? 'bg-white/10 text-white font-bold border-l-2 border-emerald-400'
                : 'text-white/70 hover:bg-white/5 hover:text-white'
            }`}
          >
            <Settings className="w-4 h-4 text-white/60 mx-auto lg:mx-0" />
            <span className="md:hidden lg:inline">Pengaturan (Settings)</span>
          </button>
        </nav>

        {/* Equation Balance widget at bottom on sidebar */}
        <div className="p-4 bg-black/20 border-t border-white/10 mt-auto md:hidden lg:block">
          <div className="flex items-center justify-between text-[11px] mb-2 font-semibold">
            <span className="text-white/60">Persamaan Dasar</span>
            {trialBalance.isBalanced ? (
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Seimbang
              </span>
            ) : (
              <span className="text-rose-400 font-bold flex items-center gap-1 animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span> Selisih
              </span>
            )}
          </div>
          <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-500 ${trialBalance.isBalanced ? 'bg-emerald-500 w-full' : 'bg-rose-500 w-[70%]'}`} 
            />
          </div>
        </div>
      </aside>

      {/* MAIN VIEWPORT BODY */}
      <main className="flex-1 flex flex-col overflow-y-auto max-w-full">
        {/* TOP COMPONENT PRINT HEADER BAR */}
        <header className="px-8 py-5 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex justify-between items-center print:hidden flex-wrap gap-4 transition-colors">
          <div>
            <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-mono font-bold px-2.5 py-1 rounded-md uppercase tracking-wider">
              {activeTab} PANEL
            </span>
            <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white mt-1.5 capitalize">
              {activeTab === 'dashboard' && 'Dashboard Akuntansi'}
              {activeTab === 'jurnal' && 'Buku Jurnal Umum (General Journal)'}
              {activeTab === 'bukubesar' && 'Buku Besar Akun (Ledger Account)'}
              {activeTab === 'neracasaldo' && 'Neraca Saldo Sebelum Penyesuaian'}
              {activeTab === 'laporan' && `Laporan Keuangan Kelayakan — ${activeLaporanTab}`}
              {activeTab === 'coa' && 'Chart of Accounts'}
              {activeTab === 'calculators' && 'Simulasi Matematika Keuangan'}
              {activeTab === 'settings' && 'Setelan Sistem NarKuntansi'}
              {activeTab === 'psak' && 'Modul PSAK / SAK Umum'}
            </h2>
            <p className="text-xs text-slate-450 dark:text-slate-500 mt-1 uppercase tracking-wider font-semibold">
              {activeTab === 'psak'
                ? 'Data terpisah dari modul SAK EP'
                : <>{settings.companyName} &bull; Periode Laporan: {settings.period}</>}
            </p>
          </div>

          <div className="flex gap-2">
            {activeTab === 'laporan' && (
              <button
                onClick={handlePrint}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold inline-flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                Cetak Laporan
              </button>
            )}

            <button
              onClick={handleDownloadExcel}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold inline-flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
              title="Unduh seluruh laporan keuangan SAK ke dalam satu file Excel (.xlsx)"
            >
              <FileSpreadsheet className="w-4 h-4 text-white" />
              Unduh Excel SAK
            </button>
            
            <button
              onClick={() => {
                if (window.confirm('Muat ulang data dari penyimpanan browser?')) {
                  window.location.reload();
                }
              }}
              className="p-2.5 border border-slate-200 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800 hover:bg-slate-50 text-slate-400 rounded-lg cursor-pointer transition-colors"
              title="Refresh Halaman"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* CONTAINER VIEW FOR SCANNED OR WRITTEN PAGES */}
        <div className="p-6 pb-24 md:p-8 flex-1">
          
          {/* ======================================================
              TAB 1: DASHBOARD & AI PARSER
              ====================================================== */}
          {activeTab === 'dashboard' && (
            <div className="space-y-8 animate-fade-in print:hidden">
              
              {/* STATUS SUMMARY CARDS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className={`p-5 rounded-2xl ${cardBg}`}>
                  <span className="text-[10px] font-black tracking-widest text-slate-400 dark:text-slate-500 uppercase">Total Aset (Harta)</span>
                  <p className="text-xl font-extrabold text-blue-600 dark:text-blue-400 mt-1">{formatRupiah(statsSummary.totalAssets)}</p>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 block mt-1">Sesuai penyusunan Neraca Vertikal</span>
                </div>

                <div className={`p-5 rounded-2xl ${cardBg}`}>
                  <span className="text-[10px] font-black tracking-widest text-slate-400 dark:text-slate-500 uppercase">Total Kewajiban</span>
                  <p className="text-xl font-extrabold text-amber-600 dark:text-amber-400 mt-1">{formatRupiah(statsSummary.totalLiabilities)}</p>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 block mt-1">Utang jangka pendek dan panjang</span>
                </div>

                <div className={`p-5 rounded-2xl ${cardBg}`}>
                  <span className="text-[10px] font-black tracking-widest text-slate-400 dark:text-slate-500 uppercase">Laba (Rugi) Bersih</span>
                  <p className={`text-xl font-extrabold mt-1 ${statsSummary.netProfit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600'}`}>
                    {formatRupiah(statsSummary.netProfit)}
                  </p>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 block mt-1">Revenuenya dikurangi Beban</span>
                </div>

                <div className={`p-5 rounded-2xl ${cardBg}`}>
                  <span className="text-[10px] font-black tracking-widest text-slate-400 dark:text-slate-500 uppercase">Jumlah Jurnal Transaksi</span>
                  <p className="text-xl font-extrabold text-slate-800 dark:text-white mt-1">{statsSummary.journalCount} Baris</p>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 block mt-1">Terdaftar dalam Jurnal Umum</span>
                </div>
              </div>

              {/* AUTOMATIC GEMINI PARSER */}
              <GeminiParser
                onTransactionsParsed={handleTransactionsParsed}
                showToast={showToast}
                geminiApiKey={settings.geminiApiKey}
              />

              {/* WELCOME INSTRUCTION BOX */}
              <div className="bg-gradient-to-br from-blue-900 to-slate-900 border border-slate-800 p-6 rounded-2xl text-white">
                <div className="flex gap-4">
                  <div className="p-3 bg-white/10 rounded-xl self-start">
                    <Award className="w-6 h-6 text-yellow-400" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-base text-slate-100">NarKuntansi SAK EP Standardized</h3>
                    <p className="text-xs text-slate-300 mt-1 leading-relaxed max-w-3xl">
                      Selamat datang di sistem pembukuan akuntansi nirlaba dan komersial berbasis **Standard Akuntansi Keuangan Entitas Privat (SAK EP) 2025** yang menggantikan SAK ETAP. Di dalam sistem terintegrasi ini, semua jurnal Anda diproses secara real-time menjadi buku besar pembantu, neraca saldo berimbang dan 5 jenis laporan keuangan siap cetak.
                    </p>
                    <div className="mt-4 flex gap-2 flex-wrap">
                      <button
                        onClick={() => setActiveTab('jurnal')}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                      >
                        Lihat Jurnal Umum
                      </button>
                      <button
                        onClick={() => setActiveTab('calculators')}
                        className="px-4 py-2 bg-white/10 hover:bg-white/15 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                      >
                        Buka Kalkulator Keuangan
                      </button>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* ======================================================
              TAB 2: JURNAL UMUM
              ====================================================== */}
          {activeTab === 'jurnal' && (
            <div className="space-y-8 animate-fade-in print:hidden">
              
              {/* MANUAL TRANSACTION INPUT */}
              <div id="manual-journal-form" className={`p-6 rounded-2xl ${cardBg}`}>
                <h3 className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-2 mb-1">
                  <Plus className="w-4 h-4 text-blue-600" />
                  {editingTxId ? 'Mode Edit Jurnal Transaksi' : 'Pencatatan Jurnal Umum Manual'}
                </h3>
                <p className="text-xs text-slate-500 mb-5">
                  Masukkan tanggal, referensi jurnal, dan rincian jurnal minimum 2 baris pencatatan berimbang (balanced).
                </p>

                <form onSubmit={saveJournalTransaction} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-500 block mb-1">Tanggal Transaksi</label>
                      <input
                        type="date"
                        value={formDate}
                        onChange={(e) => setFormDate(e.target.value)}
                        className="w-full text-xs p-2.5 border border-slate-200 dark:border-slate-800 dark:bg-slate-950 dark:text-white rounded-lg focus:outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-500 block mb-1">No Jurnal / Ref</label>
                      <input
                        type="text"
                        placeholder="misal: JR-101"
                        value={formRefNo}
                        onChange={(e) => setFormRefNo(e.target.value)}
                        className="w-full text-xs p-2.5 border border-slate-200 dark:border-slate-800 dark:bg-slate-950 dark:text-white rounded-lg focus:outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-500 block mb-1">Keterangan Transaksi</label>
                      <input
                        type="text"
                        placeholder="Menerima setoran kas..."
                        value={formDescription}
                        onChange={(e) => setFormDescription(e.target.value)}
                        className="w-full text-xs p-2.5 border border-slate-200 dark:border-slate-800 dark:bg-slate-950 dark:text-white rounded-lg focus:outline-none"
                        required
                      />
                    </div>
                  </div>

                  {/* Dynamic Entries array */}
                  <div className="space-y-2.5 mt-4">
                    <span className="text-xs font-bold text-slate-500 block">Daftar Baris Jurnal Akun</span>
                    {formEntries.map((entry, idx) => (
                      <div key={idx} className="flex gap-2 items-center flex-wrap md:flex-nowrap bg-slate-50 dark:bg-slate-950/40 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                        
                        {/* Account selecting */}
                        <div className="w-full md:w-1/3">
                          <select
                            value={entry.accountCode}
                            onChange={(e) => handleEntryFieldChange(idx, 'accountCode', e.target.value)}
                            className="w-full text-xs p-2 border border-slate-200 dark:border-slate-800 dark:bg-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                          >
                            {accounts.map(a => (
                              <option key={a.code} value={a.code}>
                                [{a.code}] {a.name} ({a.category})
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Debit Kredit switch */}
                        <div className="w-1/3 md:w-32">
                          <select
                            value={entry.posisi}
                            onChange={(e) => handleEntryFieldChange(idx, 'posisi', e.target.value)}
                            className="w-full text-xs p-2 border border-slate-200 dark:border-slate-800 dark:bg-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                          >
                            <option value="debit">DEBIT</option>
                            <option value="kredit">KREDIT</option>
                          </select>
                        </div>

                        {/* Nominal Input */}
                        <div className="flex-1">
                          <input
                            type="number"
                            placeholder="Nominal Rupiah"
                            value={entry.nominal || ''}
                            onChange={(e) => handleEntryFieldChange(idx, 'nominal', Number(e.target.value))}
                            className="w-full text-xs p-2 border border-slate-200 dark:border-slate-800 dark:bg-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                            required
                          />
                        </div>

                        {/* Remove item line */}
                        <button
                          type="button"
                          onClick={() => handleRemoveFormRow(idx)}
                          className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Form balances status diagnostics */}
                  <div className="flex items-center justify-between gap-4 mt-6 p-4 border border-slate-100 dark:border-slate-800 rounded-xl bg-slate-50/40 dark:bg-slate-950/40 flex-wrap">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleAddFormRow}
                        className="px-3 py-1.5 border border-blue-200 hover:bg-blue-50 dark:border-blue-800 dark:hover:bg-blue-950/30 text-blue-600 dark:text-blue-400 text-xs font-bold rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <Plus className="w-3 h-3" /> Tambah Baris Jurnal
                      </button>
                    </div>

                    <div className="flex gap-4 items-center text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">Total Debit</span>
                        <span className="font-mono font-bold text-slate-800 dark:text-slate-100">{formatRupiah(formDebitTotal)}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">Total Kredit</span>
                        <span className="font-mono font-bold text-slate-800 dark:text-slate-100">{formatRupiah(formKreditTotal)}</span>
                      </div>
                      <div className="border-l border-slate-200 dark:border-slate-800 pl-4">
                        {isFormBalanced ? (
                          <span className="px-2 py-1 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 text-[10px] font-black rounded-lg border border-emerald-100 dark:border-emerald-900/30">
                            BALANCED (SEIMBANG)
                          </span>
                        ) : (
                          <span className="px-2 py-1 bg-rose-50 text-rose-700 dark:bg-rose-950/20 dark:text-rose-400 text-[10px] font-black rounded-lg border border-rose-100 dark:border-rose-900/30">
                            UNBALANCED ({formatRupiah(Math.abs(formDebitTotal - formKreditTotal))})
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Form Submission actions */}
                  <div className="flex gap-3 mt-6 justify-end">
                    <button
                      type="submit"
                      disabled={!isFormBalanced}
                      className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 dark:disabled:bg-blue-900/30 text-white text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer"
                    >
                      {editingTxId ? 'Perbarui Transaksi' : 'Masukkan ke Buku Jurnal'}
                    </button>
                    {editingTxId && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingTxId(null);
                          setFormDate(new Date().toISOString().split('T')[0]);
                          setFormRefNo(`JR-${Math.floor(100 + Math.random() * 900)}`);
                          setFormDescription('');
                          setFormEntries([
                            { accountCode: '101', posisi: 'debit', nominal: 0 },
                            { accountCode: '301', posisi: 'kredit', nominal: 0 }
                          ]);
                        }}
                        className="px-4 py-2.5 border border-slate-200 dark:border-slate-800 text-slate-500 rounded-xl text-xs hover:bg-slate-50 cursor-pointer"
                      >
                        Batal Edit
                      </button>
                    )}
                  </div>
                </form>
              </div>

              {/* REGISTERED JOURNAL ENTRIES IN TABLE */}
              <div className={`p-6 rounded-2xl ${cardBg}`}>
                <div className="flex justify-between items-center mb-4 flex-wrap gap-4">
                  <div>
                    <h3 className="text-base font-bold text-slate-800 dark:text-white">Aliran Entri Jurnal Umum</h3>
                    <p className="text-xs text-slate-500">Histori terurut sesuai tanggal transaksi terkecil.</p>
                  </div>

                  {transactions.length > 0 && (
                    <button
                      onClick={handleDeleteAllTx}
                      className="px-3.5 py-1.5 border border-rose-200 hover:bg-rose-50 text-rose-600 dark:border-rose-900 dark:hover:bg-rose-950/20 text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Kosongkan Jurnal
                    </button>
                  )}
                </div>

                <div className="overflow-x-auto border border-slate-150 dark:border-slate-800 rounded-xl">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-950/50 text-slate-500 dark:text-slate-400 border-b border-slate-150 dark:border-slate-800 font-bold">
                        <th className="p-3">Tanggal</th>
                        <th className="p-3">No Jurnal</th>
                        <th className="p-3">Keterangan Transaksi</th>
                        <th className="p-3">Kode Akun</th>
                        <th className="p-3">Nama Akun</th>
                        <th className="p-3 text-right">Debit (D)</th>
                        <th className="p-3 text-right">Kredit (K)</th>
                        <th className="p-3 text-center">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                      {transactions.map((tx) => {
                        // Display items beautifully inside
                        return (
                          <React.Fragment key={tx.id}>
                            {tx.entries.map((ent, entIdx) => {
                              const targetAcc = accounts.find(a => a.code === ent.accountCode);
                              
                              return (
                                <tr key={ent.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-800/10 transition-colors">
                                  {/* Only show Date, Nom, Desc, on the first row of each transaction */}
                                  {entIdx === 0 ? (
                                    <>
                                      <td className="p-3 font-semibold dark:text-slate-200 align-top border-t border-slate-200 dark:border-slate-800" rowSpan={tx.entries.length}>
                                        {tx.date}
                                      </td>
                                      <td className="p-3 font-mono font-bold text-blue-600 dark:text-blue-400 align-top border-t border-slate-200 dark:border-slate-800" rowSpan={tx.entries.length}>
                                        {tx.refNo}
                                      </td>
                                      <td className="p-3 text-slate-700 dark:text-slate-200 max-w-xs align-top border-t border-slate-200 dark:border-slate-800 leading-relaxed font-semibold italic" rowSpan={tx.entries.length}>
                                        {tx.description}
                                      </td>
                                    </>
                                  ) : null}

                                  {/* Code and name details */}
                                  <td className="p-3 font-mono text-slate-600 dark:text-slate-300">
                                    {ent.accountCode}
                                  </td>
                                  <td className={`p-3 capitalize text-slate-800 dark:text-slate-100 ${ent.posisi === 'kredit' ? 'pl-8 font-semibold text-slate-600' : ''}`}>
                                    {targetAcc?.name || 'Akun tak terdaftar'}
                                  </td>

                                  {/* Debit and credit positions */}
                                  <td className="p-3 text-right font-mono text-slate-800 dark:text-slate-200 font-medium">
                                    {ent.posisi === 'debit' ? formatRupiah(ent.nominal) : '-'}
                                  </td>
                                  <td className="p-3 text-right font-mono text-slate-800 dark:text-slate-200 font-medium">
                                    {ent.posisi === 'kredit' ? formatRupiah(ent.nominal) : '-'}
                                  </td>

                                  {/* Actions display on first line */}
                                  {entIdx === 0 ? (
                                    <td className="p-3 text-center align-top border-t border-slate-200 dark:border-slate-800" rowSpan={tx.entries.length}>
                                      <div className="flex gap-2 justify-center">
                                        <button
                                          onClick={() => handleEditTx(tx)}
                                          className="text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/20 px-2 py-1 rounded text-[10px] font-bold transition-all cursor-pointer"
                                        >
                                          Edit
                                        </button>
                                        <button
                                          onClick={() => handleDeleteTx(tx.id, tx.refNo)}
                                          className="text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 px-2 py-1 rounded text-[10px] font-bold transition-all cursor-pointer"
                                        >
                                          Hapus
                                        </button>
                                      </div>
                                    </td>
                                  ) : null}
                                </tr>
                              );
                            })}
                          </React.Fragment>
                        );
                      })}

                      {transactions.length === 0 && (
                        <tr>
                          <td colSpan={8} className="p-8 text-center text-slate-400 dark:text-slate-500 font-medium">
                            Belum ada entri Jurnal Umum. Tulis minimal satu transaksi di atas atau gunakan Gemini Parser.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* ======================================================
              TAB 3: BUKU BESAR (LEDGER)
              ====================================================== */}
          {activeTab === 'bukubesar' && (
            <div className="space-y-8 animate-fade-in">
              
              {/* SELECT OR PRINT CONTROLS */}
              <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex justify-between items-center print:hidden flex-wrap gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 block">Pilih Akun Buku Besar</label>
                  <select
                    value={activeLedgerCode}
                    onChange={(e) => setActiveLedgerCode(e.target.value)}
                    className="p-2 border border-slate-200 dark:border-slate-800 dark:bg-slate-950 rounded-xl text-xs font-bold dark:text-white"
                  >
                    {ledgersWithActivity.map(su => (
                      <option key={su.account.code} value={su.account.code}>
                        [{su.account.code}] {su.account.name} (Baris: {su.rows.length})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <button
                    onClick={() => {
                      // Trigger whole ledger printable page activation
                      window.print();
                    }}
                    className="px-4 py-2 border border-slate-200 dark:border-slate-850 hover:bg-slate-50 dark:bg-slate-800 text-xs font-bold rounded-xl inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" /> Cetak Buku Besar Lengkap
                  </button>
                </div>
              </div>

              {/* SINGLE LEDGER DETAILS BAR */}
              {ledgers[activeLedgerCode] && (
                <div className={`p-6 rounded-2xl ${cardBg} print:p-0 print:border-none`}>
                  {/* Ledger Header */}
                  <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-4 mb-4 flex-wrap gap-4">
                    <div>
                      <h3 className="text-lg font-extrabold text-slate-800 dark:text-white">
                        [{activeLedgerCode}] {ledgers[activeLedgerCode].account.name}
                      </h3>
                      <p className="text-xs text-slate-500">
                        Klasifikasi: {ledgers[activeLedgerCode].account.category} &bull; Sifat Normal: {ledgers[activeLedgerCode].account.normalBalance === 'D' ? 'DEBIT' : 'KREDIT'}
                      </p>
                    </div>

                    <div className="p-3 bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 rounded-xl text-right">
                      <span className="text-[10px] text-slate-400 uppercase tracking-widest font-black block">Saldo Kunci Akhir</span>
                      <span className="text-base font-black text-blue-600 dark:text-blue-400 font-mono">
                        {formatRupiah(ledgers[activeLedgerCode].closingBalance)}
                      </span>
                    </div>
                  </div>

                  {/* Ledger entries */}
                  <div className="overflow-x-auto border border-slate-150 dark:border-slate-800 rounded-xl">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-50 dark:bg-slate-950/45 text-slate-500 dark:text-slate-400 border-b border-slate-150 dark:border-slate-800 font-bold leading-relaxed">
                          <th className="p-3">Tanggal</th>
                          <th className="p-3">Keterangan Jurnal</th>
                          <th className="p-3">Ref</th>
                          <th className="p-3 text-right">Debit (Rp)</th>
                          <th className="p-3 text-right">Kredit (Rp)</th>
                          <th className="p-3 text-right">Saldo Berjalan ({ledgers[activeLedgerCode].account.normalBalance})</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                        {/* Initial balances (Beginning Balance is 0) */}
                        <tr className="bg-slate-50/30 font-semibold italic text-slate-500">
                          <td className="p-3 font-sans">Awal</td>
                          <td className="p-3 text-left">Saldo Awal Pemulihan Pembukuan</td>
                          <td className="p-3">-</td>
                          <td className="p-3 text-right">-</td>
                          <td className="p-3 text-right">-</td>
                          <td className="p-3 text-right text-slate-700 dark:text-slate-300">{formatRupiah(0)}</td>
                        </tr>

                        {ledgers[activeLedgerCode].rows.map((row, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10">
                            <td className="p-3 font-sans text-slate-700 dark:text-slate-300">{row.date}</td>
                            <td className="p-3 text-left font-sans italic max-w-xs">{row.description}</td>
                            <td className="p-3 text-blue-600 font-bold">{row.refNo}</td>
                            <td className="p-3 text-right text-slate-800 dark:text-slate-200">{row.debit > 0 ? formatRupiah(row.debit) : '-'}</td>
                            <td className="p-3 text-right text-slate-800 dark:text-slate-200">{row.kredit > 0 ? formatRupiah(row.kredit) : '-'}</td>
                            <td className="p-3 text-right font-bold text-slate-800 dark:text-white">{formatRupiah(row.balance)}</td>
                          </tr>
                        ))}

                        {ledgers[activeLedgerCode].rows.length === 0 && (
                          <tr>
                            <td colSpan={6} className="p-4 text-center text-slate-400 font-sans">
                              Belum ada mutasi terdaftar untuk akun ini pada periode berjalan.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* ======================================================
              TAB 4: NERACA SALDO
              ====================================================== */}
          {activeTab === 'neracasaldo' && (
            <div className="space-y-8 animate-fade-in">
              <div className={`p-6 rounded-2xl ${cardBg}`}>
                <div className="flex justify-between items-center pb-4 mb-4 border-b border-slate-100 dark:border-slate-800 flex-wrap gap-4">
                  <div>
                    <h3 className="text-base font-bold text-slate-800 dark:text-white">Neraca Saldo Periode Berjalan</h3>
                    <p className="text-xs text-slate-500">Diringkas otomatis dari saldo akhir masing-masing perkiraan di Buku Besar.</p>
                  </div>

                  <div>
                    {trialBalance.isBalanced ? (
                      <div className="px-4 py-2 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900 rounded-full text-emerald-700 dark:text-emerald-400 text-xs font-black flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        SEIMBANG (BALANCED)
                      </div>
                    ) : (
                      <div className="px-4 py-2 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900 rounded-full text-rose-700 dark:text-rose-400 text-xs font-black flex items-center gap-2 animate-pulse">
                        <span className="w-2.5 h-2.5 bg-rose-500 rounded-full" />
                        TIDAK SEIMBANG (Selisih {formatRupiah(trialBalance.difference)})
                      </div>
                    )}
                  </div>
                </div>

                <div className="overflow-x-auto border border-slate-150 dark:border-slate-800 rounded-xl">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-950/50 text-slate-500 dark:text-slate-400 border-b border-slate-150 dark:border-slate-800 font-bold p-3">
                        <th className="p-3">No. Rekening</th>
                        <th className="p-3">Nama Perkiraan (Akun)</th>
                        <th className="p-3 text-right">Debit (Rp)</th>
                        <th className="p-3 text-right">Kredit (Rp)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                      {trialBalance.items.map((tbItem) => (
                        <tr key={tbItem.account.code} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10">
                          <td className="p-3 font-semibold text-slate-800 dark:text-slate-200">{tbItem.account.code}</td>
                          <td className="p-3 font-semibold text-slate-800 dark:text-white capitalize font-sans">{tbItem.account.name}</td>
                          <td className="p-3 text-right">{tbItem.debit > 0 ? formatRupiah(tbItem.debit) : '-'}</td>
                          <td className="p-3 text-right">{tbItem.kredit > 0 ? formatRupiah(tbItem.kredit) : '-'}</td>
                        </tr>
                      ))}

                      {trialBalance.items.length === 0 && (
                        <tr>
                          <td colSpan={4} className="p-8 text-center text-slate-400 font-sans">
                            Belum ada entri mutasi terdaftar di Buku Transaksi.
                          </td>
                        </tr>
                      )}

                      {/* Cumulative Row at footer */}
                      <tr className="bg-slate-50 dark:bg-slate-950/60 font-sans font-extrabold uppercase border-t-2 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100">
                        <td className="p-3 block" colSpan={2}>TOTAL DEBIT & KREDIT</td>
                        <td className="p-3 text-right font-mono text-base font-black text-blue-600 dark:text-blue-400">
                          {formatRupiah(trialBalance.totalDebit)}
                        </td>
                        <td className="p-3 text-right font-mono text-base font-black text-blue-600 dark:text-blue-400">
                          {formatRupiah(trialBalance.totalKredit)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================
              TAB 5: LAPORAN KEUANGAN
              ====================================================== */}
          {activeTab === 'laporan' && (
            <div className="space-y-8 animate-fade-in">
              
              {/* LAPORAN SUB NAV PANEL */}
              <div className="flex gap-2 border-b border-slate-200 dark:border-slate-800 pb-1.5 flex-wrap print:hidden">
                <button
                  onClick={() => setActiveLaporanTab('labarugi')}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeLaporanTab === 'labarugi'
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950'
                      : 'text-slate-500 hover:bg-slate-150 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Laba Rugi (Accrual)
                </button>
                <button
                  onClick={() => setActiveLaporanTab('ekuitas')}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeLaporanTab === 'ekuitas'
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950'
                      : 'text-slate-500 hover:bg-slate-150 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Perubahan Ekuitas
                </button>
                <button
                  onClick={() => setActiveLaporanTab('neraca')}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeLaporanTab === 'neraca'
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950'
                      : 'text-slate-500 hover:bg-slate-150 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Neraca Vertikal
                </button>
                <button
                  onClick={() => setActiveLaporanTab('aruskas')}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeLaporanTab === 'aruskas'
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950'
                      : 'text-slate-500 hover:bg-slate-150 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Arus Kas (Cash Flow)
                </button>
              </div>

              {/* REPORT PRINT PREVIEW CONTAINER */}
              <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm print:p-0 print:border-none print:shadow-none transition-colors duration-200">
                
                {/* Standard formal print header */}
                <div className="text-center border-b-2 border-double border-slate-300 dark:border-slate-700 pb-5 mb-8">
                  <h1 className="text-xl font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                    {settings.companyName}
                  </h1>
                  <h2 className="text-base font-extrabold uppercase text-slate-700 dark:text-slate-300 tracking-wide mt-1">
                    {activeLaporanTab === 'labarugi' && 'Laporan Laba Rugi'}
                    {activeLaporanTab === 'ekuitas' && 'Laporan Perubahan Ekuitas'}
                    {activeLaporanTab === 'neraca' && 'Laporan Neraca Vertikal'}
                    {activeLaporanTab === 'aruskas' && 'Laporan Arus Kas'}
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Untuk Periode Yang Berakhir Pada: {settings.period}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    (Disajikan sesuai dengan Standar Akuntansi Keuangan Entitas Privat / SAK EP 2025)
                  </p>
                </div>

                {/* SUB TAB LAYOUT 1: LABA RUGI */}
                {activeLaporanTab === 'labarugi' && (
                  <div className="space-y-6">
                    <div>
                      {/* Revenues */}
                      <span className="text-xs font-black text-slate-400 uppercase tracking-widest block mb-2">1. PENDAPATAN JASA UTAMA &amp; USAHA</span>
                      <div className="space-y-2 border-t border-slate-100 dark:border-slate-800 pt-2 font-mono text-xs">
                        {incomeStatement.revenues.map(rev => (
                          <div key={rev.account.code} className="flex justify-between p-1 hover:bg-slate-50/50 dark:hover:bg-slate-850/30">
                            <span className="font-sans font-semibold text-slate-700 dark:text-slate-300">[{rev.account.code}] {rev.account.name}</span>
                            <span>{formatRupiahParentheses(rev.amount)}</span>
                          </div>
                        ))}
                        {incomeStatement.revenues.length === 0 && (
                          <div className="text-slate-400 p-1 font-sans italic">Pendapatan nihil</div>
                        )}
                        <div className="flex justify-between border-t border-slate-200 dark:border-slate-700 font-sans font-extrabold text-xs pt-2">
                          <span>TOTAL PENDAPATAN JASA &amp; OPERASIONAL</span>
                          <span className="font-mono text-slate-800 dark:text-white underline decoration-double">
                            {formatRupiahParentheses(incomeStatement.totalRevenue)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-4">
                      {/* Expenses */}
                      <span className="text-xs font-black text-slate-400 uppercase tracking-widest block mb-2">2. BEBAN-BEBAN OPERASIONAL</span>
                      <div className="space-y-2 border-t border-slate-100 dark:border-slate-800 pt-2 font-mono text-xs">
                        {incomeStatement.expenses.map(exp => (
                          <div key={exp.account.code} className="flex justify-between p-1 hover:bg-slate-50/50 dark:hover:bg-slate-850/30">
                            <span className="font-sans font-semibold text-slate-700 dark:text-slate-300">[{exp.account.code}] {exp.account.name}</span>
                            <span>{formatRupiahParentheses(-exp.amount, true)}</span>
                          </div>
                        ))}
                        {incomeStatement.expenses.length === 0 && (
                          <div className="text-slate-400 p-1 font-sans italic">Beban operasional nihil</div>
                        )}
                        <div className="flex justify-between border-t border-slate-200 dark:border-slate-700 font-sans font-extrabold text-xs pt-2">
                          <span>TOTAL BEBAN OPERASIONAL RESIDUAL</span>
                          <span className="font-mono text-slate-800 dark:text-white underline">
                            {formatRupiahParentheses(-incomeStatement.totalExpense)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Net Income Summary */}
                    <div className="border-t-2 border-slate-400 dark:border-slate-700 pt-4 mt-8 flex justify-between font-sans text-sm font-black uppercase text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-950 p-3.5 rounded-xl">
                      <span>Laba (Rugi) Bersih Periode Berjalan</span>
                      <span className={`font-mono text-lg ${incomeStatement.netProfit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-450'}`}>
                        {formatRupiahParentheses(incomeStatement.netProfit)}
                      </span>
                    </div>
                  </div>
                )}

                {/* SUB TAB LAYOUT 2: PERUBAHAN EKUITAS */}
                {activeLaporanTab === 'ekuitas' && (
                  <div className="space-y-4 font-mono text-xs">
                    <div className="flex justify-between p-1 hover:bg-slate-50 dark:hover:bg-slate-800">
                      <span className="font-sans font-semibold text-slate-700 dark:text-slate-350">Modal Pemilik, {settings.namaPemilik || 'Tuan Budi'} (Awal)</span>
                      <span>{formatRupiahParentheses(equityStatement.initialCapital)}</span>
                    </div>

                    <div className="flex justify-between p-1 hover:bg-slate-50 dark:hover:bg-slate-800">
                      <span className="font-sans font-semibold text-slate-700 dark:text-slate-350">
                        {equityStatement.netProfit >= 0 
                          ? 'Tambah: Laba Bersih Periode Berjalan' 
                          : 'Kurang: Rugi Bersih Periode Berjalan'
                        }
                      </span>
                      <span className={equityStatement.netProfit >= 0 ? "text-emerald-600 font-bold" : "text-rose-600 font-bold"}>
                        {equityStatement.netProfit >= 0 ? '+' : ''}{formatRupiahParentheses(equityStatement.netProfit)}
                      </span>
                    </div>

                    <div className="flex justify-between p-1 hover:bg-slate-50 dark:hover:bg-slate-800">
                      <span className="font-sans font-semibold text-slate-700 dark:text-slate-350">Kurang: Prive, {settings.namaPemilik || 'Tuan Budi'}</span>
                      <span className="text-rose-500 font-bold">{formatRupiahParentheses(-equityStatement.drawings, true)}</span>
                    </div>

                    <div className="border-t-2 border-slate-300 dark:border-slate-700 pt-4 mt-8 flex justify-between font-sans text-sm font-black uppercase text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-950 p-4 rounded-xl">
                      <span>Modal Pemilik, {settings.namaPemilik || 'Tuan Budi'} (Akhir)</span>
                      <span className="font-mono text-base">{formatRupiahParentheses(equityStatement.endingCapital)}</span>
                    </div>
                  </div>
                )}

                {/* SUB TAB LAYOUT 3: NERACA VERTIKAL COMPREHENSIVE */}
                {activeLaporanTab === 'neraca' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Left side column: ASET */}
                    <div className="space-y-6">
                      <h4 className="text-sm font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest border-b pb-1.5 border-slate-100 dark:border-slate-800">A. ASET (HARTA)</h4>
                      
                      <div>
                        {/* Current assets */}
                        <span className="text-[10px] font-black text-slate-400 block mb-1">1. ASET LANCAR (CURRENT ASSETS)</span>
                        <div className="space-y-1.5 font-mono text-xs">
                          {balanceSheet.assetsLancar.map(item => (
                            <div key={item.account.code} className="flex justify-between p-0.5">
                              <span className="font-sans text-slate-700 dark:text-slate-300 capitalize">[{item.account.code}] {item.account.name}</span>
                              <span>{formatRupiahParentheses(item.amount)}</span>
                            </div>
                          ))}
                          <div className="flex justify-between border-t border-slate-100 dark:border-slate-800 font-sans font-bold text-xs pt-1.5">
                            <span>Subtotal Aset Lancar Berjalan</span>
                            <span>{formatRupiahParentheses(balanceSheet.totalAssetsLancar)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="pt-2">
                        {/* Fixed assets */}
                        <span className="text-[10px] font-black text-slate-400 block mb-1">2. ASET TETAP &amp; TIDAK LANCAR</span>
                        <div className="space-y-1.5 font-mono text-xs">
                          {balanceSheet.assetsTetap.map(item => (
                            <div key={item.account.code} className="flex justify-between p-0.5">
                              <span className="font-sans text-slate-700 dark:text-slate-300 capitalize">[{item.account.code}] {item.account.name}</span>
                              <span className={item.account.isContra ? 'text-rose-500 font-bold' : ''}>
                                {formatRupiahParentheses(item.amount, item.account.isContra)}
                              </span>
                            </div>
                          ))}
                          <div className="flex justify-between border-t border-slate-100 dark:border-slate-800 font-sans font-bold text-xs pt-1.5">
                            <span>Subtotal Keadaan Neto Aset Tetap</span>
                            <span>{formatRupiahParentheses(balanceSheet.totalAssetsTetap)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="pt-4 border-t-2 border-slate-300 dark:border-slate-700 flex justify-between font-sans text-sm font-black uppercase text-slate-900 dark:text-white bg-blue-50/50 dark:bg-blue-950/20 p-2.5 rounded-lg">
                        <span>TOTAL SELURUH ASET</span>
                        <span className="font-mono">{formatRupiahParentheses(balanceSheet.totalAssets)}</span>
                      </div>
                    </div>

                    {/* Right side column: LIABILITAS & EKUITAS */}
                    <div className="space-y-6">
                      <h4 className="text-sm font-black text-amber-600 uppercase tracking-widest border-b pb-1.5 border-slate-100 dark:border-slate-800">B. LIABILITAS &amp; EKUITAS</h4>
                      
                      <div>
                        {/* Short term liab */}
                        <span className="text-[10px] font-black text-slate-400 block mb-1">1. LIABILITAS JANGKA PENDEK</span>
                        <div className="space-y-1.5 font-mono text-xs">
                          {balanceSheet.liabilitiesShort.map(item => (
                            <div key={item.account.code} className="flex justify-between p-0.5">
                              <span className="font-sans text-slate-700 dark:text-slate-300 capitalize">[{item.account.code}] {item.account.name}</span>
                              <span>{formatRupiahParentheses(item.amount)}</span>
                            </div>
                          ))}
                          {balanceSheet.liabilitiesShort.length === 0 && (
                            <div className="text-slate-400 font-sans italic p-0.5">Liabilitas jangka pendek nihil</div>
                          )}
                          <div className="flex justify-between border-t border-slate-100 dark:border-slate-800 font-sans font-bold text-xs pt-1.5">
                            <span>Subtotal Jangka Pendek Utama</span>
                            <span>{formatRupiahParentheses(balanceSheet.totalLiabilitiesShort)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="pt-2">
                        {/* Long term liab */}
                        <span className="text-[10px] font-black text-slate-400 block mb-1">2. LIABILITAS JANGKA PANJANG (LONG TERM)</span>
                        <div className="space-y-1.5 font-mono text-xs">
                          {balanceSheet.liabilitiesLong.map(item => (
                            <div key={item.account.code} className="flex justify-between p-0.5">
                              <span className="font-sans text-slate-700 dark:text-slate-300 capitalize">[{item.account.code}] {item.account.name}</span>
                              <span>{formatRupiahParentheses(item.amount)}</span>
                            </div>
                          ))}
                          {balanceSheet.liabilitiesLong.length === 0 && (
                            <div className="text-slate-400 font-sans italic p-0.5">Kewajiban jangka panjang nihil</div>
                          )}
                          <div className="flex justify-between border-t border-slate-100 dark:border-slate-800 font-sans font-bold text-xs pt-1.5">
                            <span>Subtotal Jangka Panjang Neto</span>
                            <span>{formatRupiahParentheses(balanceSheet.totalLiabilitiesLong)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="pt-2">
                        {/* Equity capital */}
                        <span className="text-[10px] font-black text-slate-400 block mb-1">3. EKUITAS ENTITAS</span>
                        <div className="space-y-1.5 font-mono text-xs">
                          <div className="flex justify-between p-0.5 font-bold">
                            <span className="font-sans text-slate-700 dark:text-slate-300 capitalize">Modal Akhir, {settings.namaPemilik || 'Tuan Budi'}</span>
                            <span>{formatRupiahParentheses(balanceSheet.capital)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="pt-4 border-t-2 border-slate-300 dark:border-slate-700 flex justify-between font-sans text-sm font-black uppercase text-slate-900 dark:text-white bg-amber-50/50 dark:bg-amber-950/20 p-2.5 rounded-lg">
                        <span>TOTAL LIABILITAS &amp; EKUITAS</span>
                        <span className="font-mono">{formatRupiahParentheses(balanceSheet.totalLiabilities + balanceSheet.totalEquity)}</span>
                      </div>
                    </div>

                    {/* Footer Balance diagnosis */}
                    <div className="md:col-span-2 pt-6 border-t border-slate-150 dark:border-slate-800/80 flex flex-col items-center justify-center gap-2">
                      {balanceSheet.isBalanced ? (
                        <div className="px-5 py-3.5 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-250 text-emerald-800 dark:text-emerald-400 text-xs font-black rounded-xl flex items-center gap-2 max-w-xl text-center">
                          <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                          <div>
                            <span className="block font-bold">DIAGNOSTIK: NERACA SEIMBANG ✓</span>
                            <span className="block font-normal text-[11px] text-slate-500 mt-0.5">Sempurna! Persamaan akrual aset berimbang kokoh dengan kewajiban dan ekuitas bersih (Selisih: Rp 0).</span>
                          </div>
                        </div>
                      ) : (
                        <div className="px-5 py-3.5 bg-rose-50 dark:bg-rose-950/20 border border-rose-250 text-rose-800 dark:text-rose-400 text-xs font-black rounded-xl flex items-start gap-2 max-w-xl text-left">
                          <X className="w-5 h-5 shrink-0 text-rose-600 dark:text-rose-400 mt-0.5" />
                          <div>
                            <span className="block font-bold">DIAGNOSTIK: NERACA TIDAK SEIMBANG! Selisih {formatRupiahParentheses(balanceSheet.difference)}</span>
                            <span className="block font-normal text-[11px] text-rose-700 dark:text-rose-350 mt-1 leading-relaxed">
                              Nilai total aset tidak sesuai dengan kewajiban ditambah modal pemilik. Silakan periksa entri penyesuaian Anda di tab Kertas Kerja, periksa penyesuaian beban penyusutan, atau pastikan Jurnal Penutup belum mendistorsi saldo berjalan.
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* SUB TAB LAYOUT 4: LAPORAN ARUS KAS (CASH FLOW - TWO METHODS) */}
                {activeLaporanTab === 'aruskas' && (
                  <div className="space-y-6">
                    {/* Method Toggle selector in print header, hidden in actual print */}
                    <div className="p-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-between gap-4 flex-wrap print:hidden">
                      <span className="text-xs font-extrabold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                        <ArrowRightLeft className="w-4 h-4 text-blue-600" /> METODE PENYAJIAN ARUS KAS
                      </span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setCashFlowMethod('langsung')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                            cashFlowMethod === 'langsung' ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-350'
                          }`}
                        >
                          Metode Langsung (Direct)
                        </button>
                        <button
                          onClick={() => setCashFlowMethod('tidak_langsung')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                            cashFlowMethod === 'tidak_langsung' ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-350'
                          }`}
                        >
                          Metode Tidak Langsung (Indirect)
                        </button>
                      </div>
                    </div>

                    <p className="text-xs text-slate-400 italic mb-4">
                      Mengalir berdasarkan metode {cashFlowMethod === 'langsung' ? 'LANGSUNG (Proses mutasi rujukan saku)' : 'TIDAK LANGSUNG (Rekonsiliasi Laba Bersih ke Cash)'}.
                    </p>

                    {/* Direct Method layout */}
                    {cashFlowMethod === 'langsung' && (
                      <div className="space-y-6 font-mono text-xs">
                        
                        {/* 1. Operating */}
                        <div>
                          <span className="text-xs font-black text-slate-400 block mb-2 font-sans">1. ARUS KAS DARI AKTIVITAS OPERASI</span>
                          <div className="space-y-2 border-t pt-2 border-slate-100 dark:border-slate-800">
                            {cashFlowDirect.operatingActivities.map((row, idx) => (
                              <div key={idx} className="flex justify-between">
                                <span className="font-sans text-slate-700 dark:text-slate-300">{row.description}</span>
                                <span className={row.amount >= 0 ? 'text-emerald-600' : 'text-rose-500'}>
                                  {row.amount >= 0 ? `+${formatRupiah(row.amount)}` : `(${formatRupiah(Math.abs(row.amount))})`}
                                </span>
                              </div>
                            ))}
                            {cashFlowDirect.operatingActivities.length === 0 && (
                              <div className="font-sans italic text-slate-400">Tidak ada pengaliran kas operasi</div>
                            )}
                            <div className="flex justify-between border-t border-slate-200 dark:border-slate-700 pt-2 font-sans font-bold">
                              <span>Total Arus Kas Bersih Aktivitas Operasi</span>
                              <span>{formatRupiah(cashFlowDirect.totalOperating)}</span>
                            </div>
                          </div>
                        </div>

                        {/* 2. Investing */}
                        <div className="pt-2">
                          <span className="text-xs font-black text-slate-400 block mb-2 font-sans">2. ARUS KAS DARI AKTIVITAS INVESTASI</span>
                          <div className="space-y-2 border-t pt-2 border-slate-100 dark:border-slate-800">
                            {cashFlowDirect.investingActivities.map((row, idx) => (
                              <div key={idx} className="flex justify-between">
                                <span className="font-sans text-slate-700 dark:text-slate-300">{row.description}</span>
                                <span className={row.amount >= 0 ? 'text-emerald-600' : 'text-rose-500'}>
                                  {row.amount >= 0 ? `+${formatRupiah(row.amount)}` : `(${formatRupiah(Math.abs(row.amount))})`}
                                </span>
                              </div>
                            ))}
                            {cashFlowDirect.investingActivities.length === 0 && (
                              <div className="font-sans italic text-slate-400">Tidak ada pengaliran kas investasi</div>
                            )}
                            <div className="flex justify-between border-t border-slate-200 dark:border-slate-700 pt-2 font-sans font-bold">
                              <span>Total Arus Kas Bersih Aktivitas Investasi</span>
                              <span>{formatRupiah(cashFlowDirect.totalInvesting)}</span>
                            </div>
                          </div>
                        </div>

                        {/* 3. Financing */}
                        <div className="pt-2">
                          <span className="text-xs font-black text-slate-400 block mb-2 font-sans">3. ARUS KAS DARI AKTIVITAS PENDANAAN</span>
                          <div className="space-y-2 border-t pt-2 border-slate-100 dark:border-slate-800">
                            {cashFlowDirect.financingActivities.map((row, idx) => (
                              <div key={idx} className="flex justify-between">
                                <span className="font-sans text-slate-700 dark:text-slate-300">{row.description}</span>
                                <span className={row.amount >= 0 ? 'text-emerald-600' : 'text-rose-500'}>
                                  {row.amount >= 0 ? `+${formatRupiah(row.amount)}` : `(${formatRupiah(Math.abs(row.amount))})`}
                                </span>
                              </div>
                            ))}
                            {cashFlowDirect.financingActivities.length === 0 && (
                              <div className="font-sans italic text-slate-400">Tidak ada pengaliran kas pendanaan</div>
                            )}
                            <div className="flex justify-between border-t border-slate-200 dark:border-slate-700 pt-2 font-sans font-bold">
                              <span>Total Arus Kas Bersih Aktivitas Pendanaan</span>
                              <span>{formatRupiah(cashFlowDirect.totalFinancing)}</span>
                            </div>
                          </div>
                        </div>

                        {/* Closing recap */}
                        <div className="border-t-2 border-slate-400 dark:border-slate-700 pt-4 mt-8 space-y-2 bg-slate-50 dark:bg-slate-950 p-4 rounded-xl font-sans text-slate-800 dark:text-slate-100 font-bold">
                          <div className="flex justify-between font-extrabold pb-2 border-b border-slate-200 dark:border-slate-800 text-xs">
                            <span className="text-xs uppercase">Kenaikan (Penurunan) Kas Bersih</span>
                            <span className="font-mono text-sm">{formatRupiah(cashFlowDirect.netCashFlow)}</span>
                          </div>
                          <div className="flex justify-between text-xs pt-1 font-normal">
                            <span>Saldo Kas Awal Periode</span>
                            <span className="font-mono">{formatRupiah(cashFlowDirect.initialCash)}</span>
                          </div>
                          <div className="flex justify-between font-black text-sm border-t border-slate-200 dark:border-slate-800 pt-2 shrink-0">
                            <span>SALDO KAS & BANK AKHIR PERIODE (NERACA)</span>
                            <span className="font-mono text-blue-600 dark:text-blue-400 underline decoration-double">
                              {formatRupiah(cashFlowDirect.endingCash)}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Indirect Method layout */}
                    {cashFlowMethod === 'tidak_langsung' && (
                      <div className="space-y-6 font-mono text-xs">
                        
                        {/* 1. Operating (Recon) */}
                        <div>
                          <span className="text-xs font-black text-slate-400 block mb-2 font-sans">1. ARUS KAS DARI AKTIVITAS OPERASI (METODE REKONSILIASI)</span>
                          <div className="space-y-2 border-t pt-2 border-slate-100 dark:border-slate-800">
                            {cashFlowIndirect.reconciliation?.map((row, idx) => (
                              <div key={idx} className="flex justify-between p-0.5">
                                <span className="font-sans text-slate-700 dark:text-slate-300">{row.description}</span>
                                <span className={row.amount >= 0 ? 'text-emerald-600' : 'text-rose-500'}>
                                  {row.amount >= 0 ? `+${formatRupiah(row.amount)}` : `(${formatRupiah(Math.abs(row.amount))})`}
                                </span>
                              </div>
                            ))}
                            <div className="flex justify-between border-t border-slate-200 dark:border-slate-700 pt-2 font-sans font-bold">
                              <span>Total Arus Kas Bersih Aktivitas Operasi</span>
                              <span>{formatRupiah(cashFlowIndirect.totalOperating)}</span>
                            </div>
                          </div>
                        </div>

                        {/* 2. Investing */}
                        <div className="pt-2">
                          <span className="text-xs font-black text-slate-400 block mb-2 font-sans">2. ARUS KAS DARI AKTIVITAS INVESTASI</span>
                          <div className="space-y-2 border-t pt-2 border-slate-100 dark:border-slate-800">
                            {cashFlowIndirect.investingActivities.map((row, idx) => (
                              <div key={idx} className="flex justify-between">
                                <span className="font-sans text-slate-700 dark:text-slate-300">{row.description}</span>
                                <span className={row.amount >= 0 ? 'text-emerald-600' : 'text-rose-500'}>
                                  {row.amount >= 0 ? `+${formatRupiah(row.amount)}` : `(${formatRupiah(Math.abs(row.amount))})`}
                                </span>
                              </div>
                            ))}
                            {cashFlowIndirect.investingActivities.length === 0 && (
                              <div className="font-sans italic text-slate-400">Tidak ada pengaliran kas investasi</div>
                            )}
                            <div className="flex justify-between border-t border-slate-200 dark:border-slate-700 pt-2 font-sans font-bold">
                              <span>Total Arus Kas Bersih Aktivitas Investasi</span>
                              <span>{formatRupiah(cashFlowIndirect.totalInvesting)}</span>
                            </div>
                          </div>
                        </div>

                        {/* 3. Financing */}
                        <div className="pt-2">
                          <span className="text-xs font-black text-slate-400 block mb-2 font-sans">3. ARUS KAS DARI AKTIVITAS PENDANAAN</span>
                          <div className="space-y-2 border-t pt-2 border-slate-100 dark:border-slate-800">
                            {cashFlowIndirect.financingActivities.map((row, idx) => (
                              <div key={idx} className="flex justify-between">
                                <span className="font-sans text-slate-700 dark:text-slate-300">{row.description}</span>
                                <span className={row.amount >= 0 ? 'text-emerald-600' : 'text-rose-500'}>
                                  {row.amount >= 0 ? `+${formatRupiah(row.amount)}` : `(${formatRupiah(Math.abs(row.amount))})`}
                                </span>
                              </div>
                            ))}
                            {cashFlowIndirect.financingActivities.length === 0 && (
                              <div className="font-sans italic text-slate-400">Tidak ada pengaliran kas pendanaan</div>
                            )}
                            <div className="flex justify-between border-t border-slate-200 dark:border-slate-700 pt-2 font-sans font-bold">
                              <span>Total Arus Kas Bersih Aktivitas Pendanaan</span>
                              <span>{formatRupiah(cashFlowIndirect.totalFinancing)}</span>
                            </div>
                          </div>
                        </div>

                        {/* Closing recap */}
                        <div className="border-t-2 border-slate-400 dark:border-slate-700 pt-4 mt-8 space-y-2 bg-slate-50 dark:bg-slate-950 p-4 rounded-xl font-sans text-slate-800 dark:text-slate-100 font-bold">
                          <div className="flex justify-between font-extrabold pb-2 border-b border-slate-200 dark:border-slate-800 text-xs">
                            <span className="text-xs uppercase">Kenaikan (Penurunan) Kas Bersih</span>
                            <span className="font-mono text-sm">{formatRupiah(cashFlowIndirect.netCashFlow)}</span>
                          </div>
                          <div className="flex justify-between text-xs pt-1 font-normal">
                            <span>Saldo Kas Awal Pendapatan</span>
                            <span className="font-mono">{formatRupiah(cashFlowIndirect.initialCash)}</span>
                          </div>
                          <div className="flex justify-between font-black text-sm border-t border-slate-200 dark:border-slate-800 pt-2">
                            <span>SALDO KAS & BANK AKHIR REKONSILIASI</span>
                            <span className="font-mono text-blue-600 dark:text-blue-400 underline decoration-double">
                              {formatRupiah(cashFlowIndirect.endingCash)}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ======================================================
              TAB: ANALISIS TRANSAKSI
              ====================================================== */}
          {activeTab === 'analisistransaksi' && (
            <div className="space-y-6 animate-fade-in print:hidden">
              <AnalisisTransaksi
                transactions={transactions}
                accounts={accounts}
              />
            </div>
          )}

          {/* ======================================================
              TAB: KERTAS KERJA (WORKSHEET)
              ====================================================== */}
          {activeTab === 'kertaskerja' && (
            <div className="space-y-6 animate-fade-in print:hidden">
              <KertasKerja
                transactions={transactions}
                accounts={accounts}
                onAddTransaction={(newTx) => {
                  const updated = [...transactions, newTx];
                  setTransactions(updated);
                  localStorage.setItem('journalTransactions', JSON.stringify(updated));
                  showToast(`Jurnal Penyesuaian ${newTx.refNo} berhasil direkam ke sistem.`, 'success');
                }}
              />
            </div>
          )}

          {/* ======================================================
              TAB: JURNAL PENUTUP
              ====================================================== */}
          {activeTab === 'jurnalpenutup' && (
            <div className="space-y-6 animate-fade-in print:hidden">
              <JurnalPenutup
                transactions={transactions}
                accounts={accounts}
                settings={settings}
                onAddTransactionsBulk={(newTxs) => {
                  const updated = [...transactions, ...newTxs];
                  setTransactions(updated);
                  localStorage.setItem('journalTransactions', JSON.stringify(updated));
                  showToast(`${newTxs.length} Jurnal Penutup berhasil diposting ke Buku Umum.`, 'success');
                }}
              />
            </div>
          )}

          {/* ======================================================
              TAB 6: CHART OF ACCOUNTS (COA)
              ====================================================== */}
          {activeTab === 'coa' && (
            <div className="space-y-4 animate-fade-in print:hidden">
              <COAManager
                accounts={accounts}
                onAccountsChange={handleAccountsChange}
                onResetAccounts={handleResetAccounts}
                showToast={showToast}
              />
            </div>
          )}

          {/* ======================================================
              TAB 7: FORMULAS & CALCULATORS
              ====================================================== */}
          {activeTab === 'calculators' && (
            <div className="space-y-4 animate-fade-in print:hidden">
              <AccountingCalculators />
            </div>
          )}

          {/* ======================================================
              TAB: PSAK / SAK UMUM MODULE (terpisah dari SAK EP)
              ====================================================== */}
          {activeTab === 'psak' && (
            <div className="space-y-4 animate-fade-in print:hidden">
              <PSAKModule />
            </div>
          )}

          {/* ======================================================
              TAB 8: SYSTEM SETTINGS
              ====================================================== */}
          {activeTab === 'settings' && (
            <div className="space-y-8 animate-fade-in print:hidden">
              
              <div className={`p-6 rounded-2xl ${cardBg}`}>
                <h3 className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-2 mb-4">
                  <Settings className="w-5 h-5 text-blue-600" /> Pengaturan Data Keuangan & API
                </h3>

                <div className="space-y-5 max-w-2xl">
                  {/* Google Gemini key */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 block">Google Gemini API Key</label>
                    <div className="relative">
                      <input
                        type={showApiKey ? 'text' : 'password'}
                        placeholder="AI Studio API Key"
                        value={settings.geminiApiKey}
                        onChange={(e) => setSettings({ ...settings, geminiApiKey: e.target.value })}
                        className="w-full text-xs p-3 border border-slate-200 dark:border-slate-800 dark:bg-slate-950 dark:text-white rounded-xl pr-10 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowApiKey(!showApiKey)}
                        className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                      >
                        {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <span className="text-[10px] text-slate-400 block pt-1 leading-relaxed">
                      Dapatkan API Key gratis di{' '}
                      <a href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer" className="text-blue-500 hover:underline">
                        aistudio.google.com/apikey
                      </a>
                      . Kunci Anda aman secara lokal di browser Anda.
                    </span>
                  </div>

                  {/* Company name input */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 block">Nama Badan Usaha (Perusahaan / Koperasi)</label>
                    <input
                      type="text"
                      placeholder="misal: Toko Serba Ada Maju"
                      value={settings.companyName}
                      onChange={(e) => setSettings({ ...settings, companyName: e.target.value })}
                      className="w-full text-xs p-3 border border-slate-200 dark:border-slate-800 dark:bg-slate-950 dark:text-white rounded-xl focus:outline-none"
                    />
                  </div>

                  {/* Period name input */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 block">Periode Pelaporan Laporan Keuangan</label>
                    <input
                      type="text"
                      placeholder="misal: Juni 2026 atau Tahun Buku 2026"
                      value={settings.period}
                      onChange={(e) => setSettings({ ...settings, period: e.target.value })}
                      className="w-full text-xs p-3 border border-slate-200 dark:border-slate-800 dark:bg-slate-950 dark:text-white rounded-xl focus:outline-none"
                    />
                  </div>

                  <div className="pt-3 flex gap-3 flex-wrap">
                    <button
                      onClick={() => saveSettingsToLocal(settings)}
                      className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-sm cursor-pointer"
                    >
                      Simpan Pengaturan Utama
                    </button>

                    <button
                      onClick={handleResetAllData}
                      className="px-5 py-2.5 border border-rose-200 hover:bg-rose-50 text-rose-600 dark:border-rose-900 dark:hover:bg-rose-950/20 text-xs font-bold rounded-xl transition-all cursor-pointer"
                    >
                      Reset Semua Data (localStorage)
                    </button>
                  </div>
                </div>
              </div>

              {/* HOW TO RUN DETAILS GUIDE */}
              <div className="p-6 border border-slate-150 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl max-w-3xl">
                <h4 className="text-sm font-black text-slate-800 dark:text-white flex items-center gap-1.5 mb-2">
                  <HelpCircle className="w-4 h-4 text-slate-500" /> Cara Memasang & Menggunakan Gemini API
                </h4>
                <ol className="list-decimal pl-5 text-xs text-slate-500 dark:text-slate-400 space-y-2 leading-relaxed">
                  <li>Buat akun gratis di <strong>Google AI Studio Indonesia</strong> jika belum punya.</li>
                  <li>Buat kunci API kustom gratis baru melalui tombol <strong>Create API Key</strong> di platform tersebut.</li>
                  <li>Copy kunci rahasia yang dimulai dengan huruf <code>AIzaSy...</code></li>
                  <li>Paste ke kolom <strong>Google Gemini API Key</strong> di seksi setelan di atas, lalu tekan <strong>Simpan Pengaturan Utama</strong>.</li>
                  <li>Kembali ke tab <strong>Beranda</strong>, ketik soal cerita akuntansi apa saja, lalu saksikan jurnal berpasangan dibuat seketika!</li>
                </ol>
              </div>

            </div>
          )}

        </div>

        {/* FOOTER / STATUS BAR */}
        <footer className="h-11 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800/80 flex items-center justify-between px-8 shrink-0 print:hidden transition-colors md:mb-0 mb-11">
          <div className="flex gap-4 text-[10px] font-semibold text-slate-400 dark:text-slate-500">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> 
              Sistem Aktif (Luring)
            </span>
            <span className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 font-sans">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span> 
              Gemini AI Connected
            </span>
          </div>
          <div className="text-[10px] text-slate-400 dark:text-slate-500 font-mono flex items-center gap-2">
            <span>&copy; 2026 NarKuntansi &bull; SAK-EP Compliance Engine</span>
            <span className="h-3 w-px bg-slate-300 dark:bg-slate-800"></span>
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold font-sans">Pembuat: Nadhif Aulia R.</span>
          </div>
        </footer>

        {/* MOBILE BOTTOM NAVIGATION BAR */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex justify-around items-center py-2 px-1 print:hidden shadow-[0_-2px_10px_rgba(0,0,0,0.06)] text-slate-600 dark:text-slate-300">
          
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex flex-col items-center justify-center p-1 flex-1 cursor-pointer transition-colors ${activeTab === 'dashboard' ? 'text-blue-600 dark:text-blue-400 font-bold' : 'text-slate-400 dark:text-slate-500'}`}
          >
            <Grid className="w-4.5 h-4.5 mb-1" />
            <span className="text-[10px] font-medium tracking-tight">Beranda</span>
          </button>

          <button
            onClick={() => setActiveTab('jurnal')}
            className={`flex flex-col items-center justify-center p-1 flex-1 cursor-pointer transition-colors ${activeTab === 'jurnal' ? 'text-blue-600 dark:text-blue-400 font-bold' : 'text-slate-400 dark:text-slate-500'}`}
          >
            <Book className="w-4.5 h-4.5 mb-1" />
            <span className="text-[10px] font-medium tracking-tight">Jurnal</span>
          </button>

          <button
            onClick={() => setActiveTab('kertaskerja')}
            className={`flex flex-col items-center justify-center p-1 flex-1 cursor-pointer transition-colors ${activeTab === 'kertaskerja' ? 'text-blue-600 dark:text-blue-400 font-bold' : 'text-slate-400 dark:text-slate-500'}`}
          >
            <FileSpreadsheet className="w-4.5 h-4.5 mb-1" />
            <span className="text-[10px] font-medium tracking-tight">Kerja</span>
          </button>

          <button
            onClick={() => setActiveTab('laporan')}
            className={`flex flex-col items-center justify-center p-1 flex-1 cursor-pointer transition-colors ${activeTab === 'laporan' ? 'text-blue-600 dark:text-blue-400 font-bold' : 'text-slate-400 dark:text-slate-500'}`}
          >
            <FileText className="w-4.5 h-4.5 mb-1" />
            <span className="text-[10px] font-medium tracking-tight">Laporan</span>
          </button>

          <button
            onClick={() => setShowMobileMore(true)}
            className="flex flex-col items-center justify-center p-1 flex-1 text-slate-400 dark:text-slate-500 cursor-pointer hover:text-blue-500 transition-colors"
          >
            <MoreHorizontal className="w-4.5 h-4.5 mb-1" />
            <span className="text-[10px] font-medium tracking-tight">Lainnya</span>
          </button>
        </div>

        {/* MOBILE MORE MENU SHEET DRAWER OVERLAY */}
        {showMobileMore && (
          <div className="fixed inset-0 z-50 flex items-end justify-center md:hidden print:hidden animate-fade-in">
            {/* Backdrop dark shadow with state change on tap */}
            <div 
              onClick={() => setShowMobileMore(false)}
              className="fixed inset-0 bg-black/65 dark:bg-black/85 backdrop-blur-sm" 
            />
            {/* Slide up content drawer container */}
            <div className="relative w-full max-w-md bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 rounded-t-[2.5rem] p-6 z-10 shadow-2xl overflow-y-auto max-h-[80vh] transition-transform duration-300">
              
              {/* Drawer header drag indicator line */}
              <div className="w-12 h-1 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mb-4" onClick={() => setShowMobileMore(false)} />

              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="font-sans font-black text-slate-800 dark:text-white text-sm uppercase tracking-wider">SIKLUS BUKU SAKA</h3>
                  <p className="text-[10px] text-slate-450 dark:text-slate-500 mt-0.5">Pembuat: <span className="font-extrabold text-blue-600">Nadhif Aulia R.</span></p>
                </div>
                <button 
                  onClick={() => setShowMobileMore(false)}
                  className="p-1 text-slate-450 hover:text-slate-650 dark:hover:text-slate-250 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Grid of full routes inside Drawer */}
              <div className="grid grid-cols-2 gap-2 mb-4">
                
                <button
                  onClick={() => { setActiveTab('dashboard'); setShowMobileMore(false); }}
                  className={`flex items-center gap-2 p-3 rounded-xl border text-left cursor-pointer transition-all ${activeTab === 'dashboard' ? 'bg-indigo-500/10 border-indigo-500 text-indigo-600' : 'bg-slate-50 border-slate-150 text-slate-700 dark:bg-slate-950 dark:border-slate-800 dark:text-slate-350'}`}
                >
                  <Grid className="w-4.5 h-4.5 text-indigo-500 shrink-0" />
                  <span className="text-xs font-bold font-sans">Dashboard</span>
                </button>

                <button
                  onClick={() => { setActiveTab('jurnal'); setShowMobileMore(false); }}
                  className={`flex items-center gap-2 p-3 rounded-xl border text-left cursor-pointer transition-all ${activeTab === 'jurnal' ? 'bg-indigo-500/10 border-indigo-500 text-indigo-600' : 'bg-slate-50 border-slate-150 text-slate-700 dark:bg-slate-950 dark:border-slate-800 dark:text-slate-350'}`}
                >
                  <Book className="w-4.5 h-4.5 text-indigo-500 shrink-0" />
                  <span className="text-xs font-bold font-sans">Jurnal Umum</span>
                </button>

                <button
                  onClick={() => { setActiveTab('bukubesar'); setShowMobileMore(false); }}
                  className={`flex items-center gap-2 p-3 rounded-xl border text-left cursor-pointer transition-all ${activeTab === 'bukubesar' ? 'bg-indigo-500/10 border-indigo-500 text-indigo-600' : 'bg-slate-50 border-slate-150 text-slate-700 dark:bg-slate-950 dark:border-slate-800 dark:text-slate-350'}`}
                >
                  <Layers className="w-4.5 h-4.5 text-emerald-500 shrink-0" />
                  <span className="text-xs font-bold font-sans">Buku Besar</span>
                </button>

                <button
                  onClick={() => { setActiveTab('neracasaldo'); setShowMobileMore(false); }}
                  className={`flex items-center gap-2 p-3 rounded-xl border text-left cursor-pointer transition-all ${activeTab === 'neracasaldo' ? 'bg-indigo-500/10 border-indigo-500 text-indigo-600' : 'bg-slate-50 border-slate-150 text-slate-700 dark:bg-slate-950 dark:border-slate-800 dark:text-slate-350'}`}
                >
                  <ArrowRightLeft className="w-4.5 h-4.5 text-violet-500 shrink-0" />
                  <span className="text-xs font-bold font-sans">Neraca Saldo</span>
                </button>

                <button
                  onClick={() => { setActiveTab('laporan'); setShowMobileMore(false); }}
                  className={`flex items-center gap-2 p-3 rounded-xl border text-left cursor-pointer transition-all ${activeTab === 'laporan' ? 'bg-indigo-500/10 border-indigo-500 text-indigo-600' : 'bg-slate-50 border-slate-150 text-slate-700 dark:bg-slate-950 dark:border-slate-800 dark:text-slate-350'}`}
                >
                  <FileText className="w-4.5 h-4.5 text-sky-500 shrink-0" />
                  <span className="text-xs font-bold font-sans">Laporan SAK</span>
                </button>

                <button
                  onClick={() => { setActiveTab('analisistransaksi'); setShowMobileMore(false); }}
                  className={`flex items-center gap-2 p-3 rounded-xl border text-left cursor-pointer transition-all ${activeTab === 'analisistransaksi' ? 'bg-indigo-500/10 border-indigo-500 text-indigo-600' : 'bg-slate-50 border-slate-150 text-slate-700 dark:bg-slate-950 dark:border-slate-800 dark:text-slate-350'}`}
                >
                  <PieChart className="w-4.5 h-4.5 text-orange-500 shrink-0" />
                  <span className="text-xs font-bold font-sans">Analitis</span>
                </button>

                <button
                  onClick={() => { setActiveTab('kertaskerja'); setShowMobileMore(false); }}
                  className={`flex items-center gap-2 p-3 rounded-xl border text-left cursor-pointer transition-all ${activeTab === 'kertaskerja' ? 'bg-indigo-500/10 border-indigo-500 text-indigo-600' : 'bg-slate-50 border-slate-150 text-slate-700 dark:bg-slate-950 dark:border-slate-800 dark:text-slate-350'}`}
                >
                  <FileSpreadsheet className="w-4.5 h-4.5 text-teal-500 shrink-0" />
                  <span className="text-xs font-bold font-sans">Kertas Kerja</span>
                </button>

                <button
                  onClick={() => { setActiveTab('jurnalpenutup'); setShowMobileMore(false); }}
                  className={`flex items-center gap-2 p-3 rounded-xl border text-left cursor-pointer transition-all ${activeTab === 'jurnalpenutup' ? 'bg-indigo-500/10 border-indigo-500 text-indigo-600' : 'bg-slate-50 border-slate-150 text-slate-700 dark:bg-slate-950 dark:border-slate-800 dark:text-slate-350'}`}
                >
                  <FileCheck className="w-4.5 h-4.5 text-amber-500 shrink-0" />
                  <span className="text-xs font-bold font-sans">Penutupan</span>
                </button>

                <button
                  onClick={() => { setActiveTab('coa'); setShowMobileMore(false); }}
                  className={`flex items-center gap-2 p-3 rounded-xl border text-left cursor-pointer transition-all ${activeTab === 'coa' ? 'bg-indigo-500/10 border-indigo-500 text-indigo-600' : 'bg-slate-50 border-slate-150 text-slate-700 dark:bg-slate-950 dark:border-slate-800 dark:text-slate-350'}`}
                >
                  <BookOpen className="w-4.5 h-4.5 text-purple-500 shrink-0" />
                  <span className="text-xs font-bold font-sans">Daftar COA</span>
                </button>

                <button
                  onClick={() => { setActiveTab('settings'); setShowMobileMore(false); }}
                  className={`flex items-center gap-2 p-3 rounded-xl border text-left cursor-pointer transition-all ${activeTab === 'settings' ? 'bg-indigo-500/10 border-indigo-500 text-indigo-600' : 'bg-slate-50 border-slate-150 text-slate-700 dark:bg-slate-950 dark:border-slate-800 dark:text-slate-350'}`}
                >
                  <Settings className="w-4.5 h-4.5 text-slate-500 shrink-0" />
                  <span className="text-xs font-bold font-sans">Setelan</span>
                </button>

              </div>

              {/* Toggle theme inside menu sheet too */}
              <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-950 px-4 py-3 rounded-xl border border-slate-150 dark:border-slate-850">
                <span className="text-xs font-extrabold text-slate-750 dark:text-slate-400 flex items-center gap-1.5 font-sans">
                  {themeMode === 'light' ? <Moon className="w-4.5 h-4.5 text-slate-500" /> : <Sun className="w-4.5 h-4.5 text-amber-500" />} Mode Aplikasi
                </span>
                <button
                  onClick={() => { toggleTheme(); }}
                  className="px-3 py-1 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-lg text-[10px] font-black cursor-pointer"
                >
                  Tukar Tema ({themeMode === 'light' ? 'Gelap' : 'Terang'})
                </button>
              </div>

              {/* Close Button beneath */}
              <button
                onClick={() => setShowMobileMore(false)}
                className="w-full mt-4 py-3 bg-slate-900 text-white dark:bg-slate-800 dark:text-slate-100 rounded-xl text-xs font-black cursor-pointer text-center tracking-wide"
              >
                KEMBALI KE APLIKASI
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
