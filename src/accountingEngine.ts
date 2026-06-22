import { Account, JournalTransaction, JournalEntryItem } from './types';

// Default Chart of Accounts pre-filled
export const DEFAULT_ACCOUNTS: Account[] = [
  // ASET (1xx)
  { code: '101', name: 'Kas', category: 'Aset', normalBalance: 'D', isContra: false },
  { code: '102', name: 'Kas Kecil (Petty Cash)', category: 'Aset', normalBalance: 'D', isContra: false },
  { code: '103', name: 'Kas di Bank', category: 'Aset', normalBalance: 'D', isContra: false },
  { code: '111', name: 'Piutang Usaha', category: 'Aset', normalBalance: 'D', isContra: false },
  { code: '112', name: 'Piutang Wesel', category: 'Aset', normalBalance: 'D', isContra: false },
  { code: '113', name: 'Piutang Lain-lain', category: 'Aset', normalBalance: 'D', isContra: false },
  { code: '114', name: 'Perlengkapan Kantor', category: 'Aset', normalBalance: 'D', isContra: false },
  { code: '115', name: 'Perlengkapan Toko', category: 'Aset', normalBalance: 'D', isContra: false },
  { code: '116', name: 'Persediaan Barang Dagang', category: 'Aset', normalBalance: 'D', isContra: false },
  { code: '117', name: 'Sewa Dibayar Dimuka', category: 'Aset', normalBalance: 'D', isContra: false },
  { code: '118', name: 'Asuransi Dibayar Dimuka', category: 'Aset', normalBalance: 'D', isContra: false },
  { code: '119', name: 'Iklan Dibayar Dimuka', category: 'Aset', normalBalance: 'D', isContra: false },
  { code: '151', name: 'Tanah', category: 'Aset', normalBalance: 'D', isContra: false },
  { code: '152', name: 'Gedung / Bangunan', category: 'Aset', normalBalance: 'D', isContra: false },
  { code: '153', name: 'Akumulasi Penyusutan Gedung', category: 'Aset', normalBalance: 'K', isContra: true },
  { code: '154', name: 'Peralatan Kantor', category: 'Aset', normalBalance: 'D', isContra: false },
  { code: '155', name: 'Akumulasi Penyusutan Peralatan Kantor', category: 'Aset', normalBalance: 'K', isContra: true },
  { code: '156', name: 'Kendaraan', category: 'Aset', normalBalance: 'D', isContra: false },
  { code: '157', name: 'Akumulasi Penyusutan Kendaraan', category: 'Aset', normalBalance: 'K', isContra: true },
  { code: '158', name: 'Mesin', category: 'Aset', normalBalance: 'D', isContra: false },
  { code: '159', name: 'Akumulasi Penyusutan Mesin', category: 'Aset', normalBalance: 'K', isContra: true },

  // LIABILITAS (2xx)
  { code: '201', name: 'Utang Usaha', category: 'Liabilitas', normalBalance: 'K', isContra: false },
  { code: '202', name: 'Utang Wesel', category: 'Liabilitas', normalBalance: 'K', isContra: false },
  { code: '203', name: 'Utang Gaji', category: 'Liabilitas', normalBalance: 'K', isContra: false },
  { code: '204', name: 'Utang Sewa', category: 'Liabilitas', normalBalance: 'K', isContra: false },
  { code: '205', name: 'Utang Pajak', category: 'Liabilitas', normalBalance: 'K', isContra: false },
  { code: '206', name: 'Pendapatan Diterima Dimuka', category: 'Liabilitas', normalBalance: 'K', isContra: false },
  { code: '211', name: 'Utang Obligasi', category: 'Liabilitas', normalBalance: 'K', isContra: false },
  { code: '212', name: 'Utang Bank Jangka Panjang', category: 'Liabilitas', normalBalance: 'K', isContra: false },
  { code: '213', name: 'Utang Hipotek', category: 'Liabilitas', normalBalance: 'K', isContra: false },

  // EKUITAS (3xx)
  { code: '301', name: 'Modal Pemilik', category: 'Ekuitas', normalBalance: 'K', isContra: false },
  { code: '302', name: 'Prive Pemilik', category: 'Ekuitas', normalBalance: 'D', isContra: false },
  { code: '399', name: 'Ikhtisar Laba Rugi', category: 'Ekuitas', normalBalance: 'K', isContra: false },

  // PENDAPATAN (4xx)
  { code: '401', name: 'Pendapatan Jasa', category: 'Pendapatan', normalBalance: 'K', isContra: false },
  { code: '402', name: 'Pendapatan Usaha', category: 'Pendapatan', normalBalance: 'K', isContra: false },
  { code: '403', name: 'Pendapatan Penjualan', category: 'Pendapatan', normalBalance: 'K', isContra: false },
  { code: '404', name: 'Retur Penjualan (kontra, saldo debit)', category: 'Pendapatan', normalBalance: 'D', isContra: true },
  { code: '405', name: 'Potongan Penjualan (kontra, saldo debit)', category: 'Pendapatan', normalBalance: 'D', isContra: true },
  { code: '406', name: 'Pendapatan Bunga', category: 'Pendapatan', normalBalance: 'K', isContra: false },
  { code: '407', name: 'Pendapatan Sewa', category: 'Pendapatan', normalBalance: 'K', isContra: false },
  { code: '408', name: 'Pendapatan Lain-lain', category: 'Pendapatan', normalBalance: 'K', isContra: false },

  // BEBAN (5xx)
  { code: '501', name: 'Beban Gaji dan Upah', category: 'Beban', normalBalance: 'D', isContra: false },
  { code: '502', name: 'Beban Sewa', category: 'Beban', normalBalance: 'D', isContra: false },
  { code: '503', name: 'Beban Listrik, Air, dan Telepon', category: 'Beban', normalBalance: 'D', isContra: false },
  { code: '504', name: 'Beban Perlengkapan', category: 'Beban', normalBalance: 'D', isContra: false },
  { code: '505', name: 'Beban Iklan', category: 'Beban', normalBalance: 'D', isContra: false },
  { code: '506', name: 'Beban Penyusutan Peralatan Kantor', category: 'Beban', normalBalance: 'D', isContra: false },
  { code: '507', name: 'Beban Penyusutan Gedung', category: 'Beban', normalBalance: 'D', isContra: false },
  { code: '508', name: 'Beban Penyusutan Kendaraan', category: 'Beban', normalBalance: 'D', isContra: false },
  { code: '509', name: 'Beban Asuransi', category: 'Beban', normalBalance: 'D', isContra: false },
  { code: '510', name: 'Beban Bunga', category: 'Beban', normalBalance: 'D', isContra: false },
  { code: '511', name: 'Harga Pokok Penjualan (HPP)', category: 'Beban', normalBalance: 'D', isContra: false },
  { code: '512', name: 'Beban Pembelian', category: 'Beban', normalBalance: 'D', isContra: false },
  { code: '513', name: 'Beban Angkut Pembelian', category: 'Beban', normalBalance: 'D', isContra: false },
  { code: '514', name: 'Beban Pajak', category: 'Beban', normalBalance: 'D', isContra: false },
  { code: '515', name: 'Beban Lain-lain', category: 'Beban', normalBalance: 'D', isContra: false }
];

export interface LedgerRow {
  date: string;
  description: string;
  refNo: string;
  debit: number;
  kredit: number;
  balance: number;
  balanceType: 'D' | 'K';
}

export interface LedgerAccountSummary {
  account: Account;
  rows: LedgerRow[];
  closingBalance: number;
}

// Check if an account is a cash or bank account
export function isCashAccount(code: string): boolean {
  return code === '101' || code === '102' || code === '103';
}

// Generate Ledgers for all Accounts
export function generateLedger(transactions: JournalTransaction[], accounts: Account[]): Record<string, LedgerAccountSummary> {
  const ledgers: Record<string, LedgerAccountSummary> = {};

  // Sort transactions by date
  const sortedTransactions = [...transactions].sort((a, b) => a.date.localeCompare(b.date));

  // Initialize ledger summaries
  accounts.forEach(acc => {
    ledgers[acc.code] = {
      account: acc,
      rows: [],
      closingBalance: 0
    };
  });

  // Populate ledgers
  sortedTransactions.forEach(tx => {
    tx.entries.forEach(entry => {
      const summary = ledgers[entry.accountCode];
      if (!summary) return;

      const acc = summary.account;
      const isDebit = entry.posisi === 'debit';
      const debitVal = isDebit ? entry.nominal : 0;
      const kreditVal = !isDebit ? entry.nominal : 0;

      // Calculate running balance based on account type
      let prevBalance = summary.rows.length > 0 ? summary.rows[summary.rows.length - 1].balance : 0;
      let newBalance = prevBalance;

      if (acc.normalBalance === 'D') {
        newBalance += debitVal - kreditVal;
      } else {
        newBalance += kreditVal - debitVal;
      }

      summary.rows.push({
        date: tx.date,
        description: tx.description,
        refNo: tx.refNo,
        debit: debitVal,
        kredit: kreditVal,
        balance: newBalance,
        balanceType: acc.normalBalance
      });
    });
  });

  // Calculate closing balance
  accounts.forEach(acc => {
    const summary = ledgers[acc.code];
    const rows = summary.rows;
    summary.closingBalance = rows.length > 0 ? rows[rows.length - 1].balance : 0;
  });

  return ledgers;
}

// Trial Balance Item
export interface TrialBalanceItem {
  account: Account;
  debit: number;
  kredit: number;
}

// Generate Trial Balance (Neraca Saldo)
export function generateTrialBalance(transactions: JournalTransaction[], accounts: Account[]): {
  items: TrialBalanceItem[];
  totalDebit: number;
  totalKredit: number;
  isBalanced: boolean;
  difference: number;
} {
  const ledgers = generateLedger(transactions, accounts);
  const items: TrialBalanceItem[] = [];
  let totalDebit = 0;
  let totalKredit = 0;

  accounts.forEach(acc => {
    const summary = ledgers[acc.code];
    const balance = summary.closingBalance;

    if (balance > 0) {
      if (acc.normalBalance === 'D') {
        items.push({
          account: acc,
          debit: balance,
          kredit: 0
        });
        totalDebit += balance;
      } else {
        items.push({
          account: acc,
          debit: 0,
          kredit: balance
        });
        totalKredit += balance;
      }
    }
  });

  const diffStr = Math.abs(totalDebit - totalKredit).toFixed(2);
  const diff = parseFloat(diffStr);
  const isBalanced = diff < 0.01;

  return {
    items,
    totalDebit,
    totalKredit,
    isBalanced,
    difference: diff
  };
}

// Income Statement Item (Laba Rugi)
export interface IncomeStatementResult {
  revenues: { account: Account; amount: number }[];
  totalRevenue: number;
  expenses: { account: Account; amount: number }[];
  totalExpense: number;
  netProfit: number;
}

// Generate Laba Rugi
export function generateIncomeStatement(transactions: JournalTransaction[], accounts: Account[]): IncomeStatementResult {
  const ledgers = generateLedger(transactions, accounts);
  const revenues: { account: Account; amount: number }[] = [];
  const expenses: { account: Account; amount: number }[] = [];
  let totalRevenue = 0;
  let totalExpense = 0;

  accounts.forEach(acc => {
    const summary = ledgers[acc.code];
    const balance = summary.closingBalance;

    if (acc.category === 'Pendapatan' && balance > 0) {
      revenues.push({ account: acc, amount: balance });
      totalRevenue += balance;
    } else if (acc.category === 'Beban' && balance > 0) {
      expenses.push({ account: acc, amount: balance });
      totalExpense += balance;
    }
  });

  return {
    revenues,
    totalRevenue,
    expenses,
    totalExpense,
    netProfit: totalRevenue - totalExpense
  };
}

// Statement of Equity Changes (Perubahan Ekuitas)
export interface EquityStatementResult {
  initialCapital: number;
  netProfit: number;
  drawings: number; // Prive (reducers of capital)
  endingCapital: number;
}

export function generateEquityStatement(transactions: JournalTransaction[], accounts: Account[], netProfit: number): EquityStatementResult {
  const ledgers = generateLedger(transactions, accounts);
  
  // Modal (301)
  const capitalAccount = accounts.find(a => a.code === '301');
  const prevCapital = ledgers['301']?.closingBalance || 0;
  
  // Prive (302)
  const drawingsAccount = accounts.find(a => a.code === '302');
  const drawings = ledgers['302']?.closingBalance || 0;

  const endingCapital = prevCapital + netProfit - drawings;

  return {
    initialCapital: prevCapital,
    netProfit,
    drawings,
    endingCapital
  };
}

// Balance Sheet (Neraca Keuangan)
export interface BalanceSheetResult {
  assetsLancar: { account: Account; amount: number }[];
  totalAssetsLancar: number;
  assetsTetap: { account: Account; amount: number }[];
  totalAssetsTetap: number;
  totalAssets: number;
  
  liabilitiesShort: { account: Account; amount: number }[];
  totalLiabilitiesShort: number;
  liabilitiesLong: { account: Account; amount: number }[];
  totalLiabilitiesLong: number;
  totalLiabilities: number;
  
  capital: number;
  totalEquity: number;
  
  isBalanced: boolean;
  difference: number;
}

export function generateBalanceSheet(transactions: JournalTransaction[], accounts: Account[], netProfit: number): BalanceSheetResult {
  const ledgers = generateLedger(transactions, accounts);
  
  const assetsLancar: { account: Account; amount: number }[] = [];
  let totalAssetsLancar = 0;
  const assetsTetap: { account: Account; amount: number }[] = [];
  let totalAssetsTetap = 0;
  
  const liabilitiesShort: { account: Account; amount: number }[] = [];
  let totalLiabilitiesShort = 0;
  const liabilitiesLong: { account: Account; amount: number }[] = [];
  let totalLiabilitiesLong = 0;

  accounts.forEach(acc => {
    const summary = ledgers[acc.code];
    let balance = summary.closingBalance;
    if (balance === 0) return;

    const accCodeNum = parseInt(acc.code);

    if (acc.category === 'Aset') {
      if (accCodeNum >= 101 && accCodeNum <= 149) {
        // Lancar
        assetsLancar.push({ account: acc, amount: balance });
        totalAssetsLancar += balance;
      } else if (accCodeNum >= 150 && accCodeNum <= 199) {
        // Tetap / Tidak Lancar
        // Akumulasi penyusutan is contra, so subtract from fixed assets
        const actualVal = acc.isContra ? -balance : balance;
        assetsTetap.push({ account: acc, amount: balance }); // Display as positive or show minus sign in layout
        totalAssetsTetap += actualVal;
      }
    } else if (acc.category === 'Liabilitas') {
      if (accCodeNum >= 201 && accCodeNum <= 249) {
        liabilitiesShort.push({ account: acc, amount: balance });
        totalLiabilitiesShort += balance;
      } else if (accCodeNum >= 250 && accCodeNum <= 299) {
        liabilitiesLong.push({ account: acc, amount: balance });
        totalLiabilitiesLong += balance;
      }
    }
  });

  const totalAssets = totalAssetsLancar + totalAssetsTetap;
  const totalLiabilities = totalLiabilitiesShort + totalLiabilitiesLong;

  // Equity Modal from Change of Equity report (301 balance + netProfit - drawings)
  const equityStat = generateEquityStatement(transactions, accounts, netProfit);
  const capital = equityStat.endingCapital;
  const totalEquity = capital;

  const totalLiabAndEquity = totalLiabilities + totalEquity;
  const difference = Math.abs(totalAssets - totalLiabAndEquity);
  const isBalanced = difference < 0.01;

  return {
    assetsLancar,
    totalAssetsLancar,
    assetsTetap,
    totalAssetsTetap,
    totalAssets,
    
    liabilitiesShort,
    totalLiabilitiesShort,
    liabilitiesLong,
    totalLiabilitiesLong,
    totalLiabilities,
    
    capital,
    totalEquity,
    isBalanced,
    difference
  };
}

// Cash Flow Models (Direct & Indirect)
export interface CashFlowCategoryRow {
  description: string;
  amount: number;
}

export interface CashFlowResult {
  operatingActivities: CashFlowCategoryRow[];
  totalOperating: number;
  investingActivities: CashFlowCategoryRow[];
  totalInvesting: number;
  financingActivities: CashFlowCategoryRow[];
  totalFinancing: number;
  netCashFlow: number;
  initialCash: number;
  endingCash: number;
  reconciliation?: CashFlowCategoryRow[]; // for indirect
}

export function generateDirectCashFlow(transactions: JournalTransaction[], accounts: Account[]): CashFlowResult {
  const ledgers = generateLedger(transactions, accounts);
  
  // Initial cash: Kas (101) + Bank (102) balances before earliest transaction? 
  // No, let's look at the earliest transaction.
  // Actually, standard balance of Cash at beginning.
  // Since we run 100% in-memory with custom transactions,
  // let's assume initial cash is 0, or we can look at setoran modal (Modal 301 debit cash) which is a financing receipt
  // The sum of Cash + Bank at the start of the transactions is indeed 0 unless they occurred over time.
  // Wait, we can find out the total Kas/Bank closing balances:
  const cashClosing = ledgers['101']?.closingBalance || 0;
  const bankClosing = ledgers['102']?.closingBalance || 0;
  const endingCash = cashClosing + bankClosing;

  let operatingRows: CashFlowCategoryRow[] = [];
  let investingRows: CashFlowCategoryRow[] = [];
  let financingRows: CashFlowCategoryRow[] = [];

  let totalOperating = 0;
  let totalInvesting = 0;
  let totalFinancing = 0;

  // Let's analyze transactions that involve cash accounts (101 or 102)
  transactions.forEach(tx => {
    const cashEntries = tx.entries.filter(e => isCashAccount(e.accountCode));
    const nonCashEntries = tx.entries.filter(e => !isCashAccount(e.accountCode));

    if (cashEntries.length === 0) return; // No cash involved

    // Net cash flow of this transaction
    let netTxCash = 0;
    cashEntries.forEach(ce => {
      if (ce.posisi === 'debit') netTxCash += ce.nominal;
      else netTxCash -= ce.nominal;
    });

    if (netTxCash === 0) return; // internally swapped cash (e.g. Kas to Bank or Bank to Kas)

    // Analyze non-cash counterparties to categorize this cash flow
    // Try to find the most dominant counterparty account category
    nonCashEntries.forEach(nce => {
      const targetAcc = accounts.find(a => a.code === nce.accountCode);
      if (!targetAcc) return;

      const isDebitCash = netTxCash > 0;
      // We align the contribution proportionally or contextually
      const nominalFraction = nce.nominal;
      const flowAmt = isDebitCash ? nominalFraction : -nominalFraction;

      const accCodeNum = parseInt(targetAcc.code);

      if (targetAcc.category === 'Pendapatan' || targetAcc.code === '103') {
        // Revenue or Piutang
        const desc = isDebitCash ? 'Penerimaan kas dari pelanggan' : 'Pengembalian kas kepada pelanggan';
        addOrUpdateRow(operatingRows, desc, flowAmt);
      } else if (targetAcc.category === 'Beban' || targetAcc.code === '104' || targetAcc.code === '201' || targetAcc.code === '202') {
        // Expenses, Perlengkapan, Utang Usaha, Utang Gaji
        let desc = 'Pembayaran operasional dan beban';
        if (targetAcc.code === '104') desc = 'Pembayaran perlengkapan usaha';
        else if (targetAcc.code === '201') desc = 'Pembayaran utang usaha kepada pemasok';
        else if (targetAcc.code === '202' || targetAcc.code === '501') desc = 'Pembayaran gaji karyawan';
        addOrUpdateRow(operatingRows, desc, flowAmt);
      } else if (targetAcc.category === 'Aset' && accCodeNum >= 150 && accCodeNum <= 199) {
        // Fixed assets
        const desc = isDebitCash ? `Penjualan aset tetap (${targetAcc.name})` : `Pembelian aset tetap (${targetAcc.name})`;
        addOrUpdateRow(investingRows, desc, flowAmt);
      } else if (targetAcc.code === '301') {
        // Capital contribution
        const desc = 'Setoran modal dari pemilik';
        addOrUpdateRow(financingRows, desc, flowAmt);
      } else if (targetAcc.code === '302') {
        // Drawings
        const desc = 'Pengambilan prive oleh pemilik';
        addOrUpdateRow(financingRows, desc, flowAmt);
      } else if (targetAcc.code === '251') {
        // Long term debt
        const desc = isDebitCash ? 'Penerimaan utang bank jangka panjang' : 'Pelunasan utang bank jangka panjang';
        addOrUpdateRow(financingRows, desc, flowAmt);
      } else {
        // General backup
        const desc = isDebitCash ? `Penerimaan kas terkait ${targetAcc.name}` : `Pengeluaran kas terkait ${targetAcc.name}`;
        addOrUpdateRow(operatingRows, desc, flowAmt);
      }
    });
  });

  totalOperating = operatingRows.reduce((a, b) => a + b.amount, 0);
  totalInvesting = investingRows.reduce((a, b) => a + b.amount, 0);
  totalFinancing = financingRows.reduce((a, b) => a + b.amount, 0);

  const netCashFlow = totalOperating + totalInvesting + totalFinancing;
  const initialCash = endingCash - netCashFlow;

  return {
    operatingActivities: operatingRows,
    totalOperating,
    investingActivities: investingRows,
    totalInvesting,
    financingActivities: financingRows,
    totalFinancing,
    netCashFlow,
    initialCash,
    endingCash
  };
}

function addOrUpdateRow(rows: CashFlowCategoryRow[], desc: string, amount: number) {
  const existing = rows.find(r => r.description === desc);
  if (existing) {
    existing.amount += amount;
  } else {
    rows.push({ description: desc, amount });
  }
}

export function generateIndirectCashFlow(transactions: JournalTransaction[], accounts: Account[], netProfit: number): CashFlowResult {
  const ledgers = generateLedger(transactions, accounts);
  const directFlow = generateDirectCashFlow(transactions, accounts);

  // Indirect converts Laba Bersih to Cash Flow from Operating Activities
  // 1. Start with Laba Bersih (netProfit)
  // 2. Adjustments:
  //    - Add non-cash expenses: Depreciation Expense (504, 505)
  //    - Changes in working capital:
  //      - Piutang Usaha (103): increase is cash outflow, decrease is cash inflow.
  //      - Perlengkapan (104): increase is cash outflow, decrease is cash inflow.
  //      - Persediaan (105): increase is cash outflow.
  //      - Utang Usaha (201): increase is cash inflow, decrease is outflow.
  //      - Utang Gaji (202): increase is cash inflow.
  
  const reconRows: CashFlowCategoryRow[] = [
    { description: 'Laba Bersih', amount: netProfit }
  ];

  // Depreciation
  let totalDeprec = 0;
  const depAccs = ['504', '505'];
  accounts.forEach(acc => {
    if (depAccs.includes(acc.code)) {
      const balance = ledgers[acc.code]?.closingBalance || 0;
      if (balance > 0) {
        totalDeprec += balance;
      }
    }
  });
  if (totalDeprec > 0) {
    reconRows.push({ description: 'Penyesuaian: Beban Penyusutan (Non-Kas)', amount: totalDeprec });
  }

  // Working Capital Changes from journal entries
  // To evaluate true "change" in current assets & liabilities, we sum their transaction debits vs credits
  const getNetChange = (code: string, category: 'Aset'|'Liabilitas') => {
    const summary = ledgers[code];
    if (!summary) return 0;
    
    let D = 0;
    let K = 0;
    summary.rows.forEach(r => {
      D += r.debit;
      K += r.kredit;
    });

    if (category === 'Aset') {
      // Net change (increase = D - K)
      return D - K;
    } else {
      // Net change (increase = K - D)
      return K - D;
    }
  };

  // Piutang (103)
  const piutangChange = getNetChange('103', 'Aset');
  if (piutangChange !== 0) {
    reconRows.push({
      description: piutangChange > 0 ? 'Kenaikan Piutang Usaha' : 'Penurunan Piutang Usaha',
      amount: -piutangChange // increase reduces cash flow
    });
  }

  // Perlengkapan (104)
  const perlengkapanChange = getNetChange('104', 'Aset');
  if (perlengkapanChange !== 0) {
    reconRows.push({
      description: perlengkapanChange > 0 ? 'Kenaikan Perlengkapan' : 'Penurunan Perlengkapan',
      amount: -perlengkapanChange
    });
  }

  // Persediaan (105)
  const persediaanChange = getNetChange('105', 'Aset');
  if (persediaanChange !== 0) {
    reconRows.push({
      description: persediaanChange > 0 ? 'Kenaikan Persediaan' : 'Penurunan Persediaan',
      amount: -persediaanChange
    });
  }

  // Utang Usaha (201)
  const utangChange = getNetChange('201', 'Liabilitas');
  if (utangChange !== 0) {
    reconRows.push({
      description: utangChange > 0 ? 'Kenaikan Utang Usaha' : 'Penurunan Utang Usaha',
      amount: utangChange // AP increase is source of cash (increases cash)
    });
  }

  // Utang Gaji (202)
  const utangGajiChange = getNetChange('202', 'Liabilitas');
  if (utangGajiChange !== 0) {
    reconRows.push({
      description: utangGajiChange > 0 ? 'Kenaikan Utang Gaji' : 'Penurunan Utang Gaji',
      amount: utangGajiChange
    });
  }

  const calculatedOperating = reconRows.reduce((sum, item) => sum + item.amount, 0);

  // Re-adjust operating rows to just reconcile nicely
  const operatingActivitiesSum: CashFlowCategoryRow[] = [
    { description: 'Arus Kas dari Aktivitas Operasi (Sesuai Rekonsiliasi)', amount: calculatedOperating }
  ];

  return {
    operatingActivities: operatingActivitiesSum,
    totalOperating: calculatedOperating,
    investingActivities: directFlow.investingActivities,
    totalInvesting: directFlow.totalInvesting,
    financingActivities: directFlow.financingActivities,
    totalFinancing: directFlow.totalFinancing,
    netCashFlow: calculatedOperating + directFlow.totalInvesting + directFlow.totalFinancing,
    initialCash: directFlow.initialCash,
    endingCash: directFlow.endingCash,
    reconciliation: reconRows
  };
}

// FORMAT RUPIAH HELPER
export function formatRupiah(num: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(num);
}

// Format angka murni tanpa simbol mata uang (digit grouping ala Indonesia).
// Dipakai oleh formatRupiahParentheses() di App.tsx agar simbol mata uang
// (Rp atau $) tidak ditambahkan dua kali.
export function formatNumberOnly(num: number): string {
  return new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(num);
}
