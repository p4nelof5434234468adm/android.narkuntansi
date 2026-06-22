import { Account, JournalTransaction, SystemSettings } from '../types';
import { 
  generateLedger, 
  generateTrialBalance, 
  generateIncomeStatement, 
  generateEquityStatement, 
  generateBalanceSheet,
  isCashAccount
} from '../accountingEngine';

// Extend window object in typed file
declare global {
  interface Window {
    XLSX?: any;
  }
}

// Dynamically load SheetJS from CDN
export function loadSheetJS(): Promise<any> {
  return new Promise((resolve, reject) => {
    if (window.XLSX) {
      resolve(window.XLSX);
      return;
    }
    const script = document.createElement('script');
    script.src = "https://cdn.sheetjs.com/xlsx-0.20.1/package/dist/xlsx.full.min.js";
    script.async = true;
    script.onload = () => {
      if (window.XLSX) {
        resolve(window.XLSX);
      } else {
        reject(new Error("SheetJS failed to initialize."));
      }
    };
    script.onerror = () => reject(new Error("Failed to load SheetJS from CDN."));
    document.body.appendChild(script);
  });
}

// Currency number formatter helper for Excel cells
function applyCurrencyFormatting(ws: any, XLSX: any) {
  if (!ws['!ref']) return;
  const range = XLSX.utils.decode_range(ws['!ref']);
  for (let r = range.s.r; r <= range.e.r; ++r) {
    for (let c = range.s.c; c <= range.e.c; ++c) {
      const addr = XLSX.utils.encode_cell({ r, c });
      const cell = ws[addr];
      if (cell && typeof cell.v === 'number') {
        cell.t = 'n';
        // Excel standard Accounting / Currency format for Rupiah
        cell.z = '"Rp"#,##0;("Rp"#,##0);"-"';
      }
    }
  }
}

// Parse custom owner settings
function getOwnerName(): string {
  return localStorage.getItem('namaPemilik') || 'Pemilik';
}

function getCompanyAddress(): string {
  return localStorage.getItem('alamatPerusahaan') || 'Alamat Perusahaan';
}

// -----------------------------------------------------------------
// A. JURNAL UMUM EXPORTER
// -----------------------------------------------------------------
export function generateJurnalUmumSheet(
  XLSX: any,
  transactions: JournalTransaction[],
  accounts: Account[],
  settings: SystemSettings,
  isPenyesuaianOnly = false,
  isPenutupOnly = false
): any {
  const companyName = settings.companyName;
  const period = settings.period;
  
  // Filter transactions
  let filteredTxs = [...transactions];
  let title = "JURNAL UMUM";
  if (isPenyesuaianOnly) {
    filteredTxs = transactions.filter(t => t.refNo.startsWith('JA-'));
    title = "JURNAL PENYESUAIAN";
  } else if (isPenutupOnly) {
    filteredTxs = transactions.filter(t => t.refNo.startsWith('JP-'));
    title = "JURNAL PENUTUP";
  } else {
    // Standard General Journal omits closing entries unless we want all.
    // Let's include everything except closing entries, or include JU and JA
    filteredTxs = transactions.filter(t => !t.refNo.startsWith('JP-'));
  }

  // Sort by date then refNo
  filteredTxs.sort((a, b) => a.date.localeCompare(b.date) || a.refNo.localeCompare(b.refNo));

  const rows: any[][] = [
    [companyName],
    [title],
    [`Periode: ${period}`],
    [], // Blank spacing
    ["No", "Tanggal", "No. Jurnal", "Ref", "Keterangan", "Kode Akun", "Nama Akun", "Debit", "Kredit"]
  ];

  let noIdx = 1;
  let runningDebit = 0;
  let runningKredit = 0;

  filteredTxs.forEach(tx => {
    tx.entries.forEach((entry, idx) => {
      const acc = accounts.find(a => a.code === entry.accountCode);
      const accName = acc ? acc.name : '';
      const isDebit = entry.posisi === 'debit';
      const debVal = isDebit ? entry.nominal : null;
      const kreVal = !isDebit ? entry.nominal : null;

      if (isDebit) runningDebit += entry.nominal;
      else runningKredit += entry.nominal;

      rows.push([
        idx === 0 ? noIdx : "",
        idx === 0 ? tx.date : "",
        idx === 0 ? tx.refNo : "",
        idx === 0 ? tx.refNo : "", // Ref
        idx === 0 ? tx.description : (isDebit ? "" : "   "), 
        entry.accountCode,
        isDebit ? accName : `    ${accName}`, // Indent credits
        debVal,
        kreVal
      ]);
    });
    noIdx++;
    // Add simple spacer
    rows.push(["", "", "", "", "", "", "", null, null]);
  });

  // Remove trailing spacer row if any
  if (rows[rows.length - 1][0] === "") {
    rows.pop();
  }

  // Append Total
  rows.push(["", "", "", "", "TOTAL JURNAL", "", "", runningDebit, runningKredit]);

  const ws = XLSX.utils.aoa_to_sheet(rows);

  // Set merges
  ws['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 8 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: 8 } },
    { s: { r: 2, c: 0 }, e: { r: 2, c: 8 } }
  ];

  // Set widths
  ws['!cols'] = [
    { wch: 6 },  // No
    { wch: 13 }, // Tanggal
    { wch: 16 }, // No Jurnal
    { wch: 14 }, // Ref
    { wch: 26 }, // Keterangan
    { wch: 11 }, // Kode
    { wch: 28 }, // Nama Akun
    { wch: 16 }, // Debit
    { wch: 16 }  // Kredit
  ];

  applyCurrencyFormatting(ws, XLSX);
  return ws;
}

// -----------------------------------------------------------------
// B. BUKU BESAR EXPORTER (Returns multiple sheets)
// -----------------------------------------------------------------
export function addBukuBesarSheetsToWorkbook(
  XLSX: any,
  wb: any,
  transactions: JournalTransaction[],
  accounts: Account[],
  settings: SystemSettings
) {
  const ledgers = generateLedger(transactions, accounts);
  const companyName = settings.companyName;
  const period = settings.period;

  accounts.forEach(acc => {
    const summary = ledgers[acc.code];
    // Only generate sheet if has transactions or has closing balance to avoid cluttering with 45 tabs
    if (!summary || summary.rows.length === 0) return;

    const rows: any[][] = [
      [companyName],
      ["BUKU BESAR"],
      [`Akun: [${acc.code}] ${acc.name} (${acc.category})`],
      [`Periode: ${period}`],
      [],
      ["Tanggal", "Keterangan", "Ref", "Debit", "Kredit", "Saldo Running"]
    ];

    let currentBalance = 0;
    summary.rows.forEach(r => {
      // Running balance
      const isDebit = r.debit > 0;
      const value = isDebit ? r.debit : r.kredit;
      
      rows.push([
        r.date,
        r.description,
        r.refNo,
        r.debit > 0 ? r.debit : null,
        r.kredit > 0 ? r.kredit : null,
        r.balance
      ]);
    });

    // Closing balance row
    rows.push(["", "SALDO AKHIR", "", null, null, summary.closingBalance]);

    const ws = XLSX.utils.aoa_to_sheet(rows);

    // Merges
    ws['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 5 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: 5 } },
      { s: { r: 2, c: 0 }, e: { r: 2, c: 5 } },
      { s: { r: 3, c: 0 }, e: { r: 3, c: 5 } }
    ];

    ws['!cols'] = [
      { wch: 13 }, // Tanggal
      { wch: 30 }, // Keterangan
      { wch: 15 }, // Ref
      { wch: 16 }, // Debit
      { wch: 16 }, // Kredit
      { wch: 18 }  // Saldo
    ];

    applyCurrencyFormatting(ws, XLSX);
    
    // Sheet name length limit in Excel is 31 and cannot contain specific chars
    const rawSheetName = `${acc.code}-${acc.name}`;
    const cleanSheetName = rawSheetName.replace(/[\\\/\?\*\[\]]/g, '').substring(0, 30);
    XLSX.utils.book_append_sheet(wb, ws, cleanSheetName);
  });
}

// -----------------------------------------------------------------
// C. NERACA SALDO EXPORTER
// -----------------------------------------------------------------
export function generateNeracaSaldoSheet(
  XLSX: any,
  transactions: JournalTransaction[],
  accounts: Account[],
  settings: SystemSettings
): any {
  const companyName = settings.companyName;
  const period = settings.period;
  
  const tb = generateTrialBalance(transactions, accounts);

  const rows: any[][] = [
    [companyName],
    ["NERACA SALDO"],
    [`Periode: ${period}`],
    [],
    ["No", "Kode Akun", "Nama Akun", "Debit", "Kredit"]
  ];

  tb.items.forEach((item, idx) => {
    rows.push([
      idx + 1,
      item.account.code,
      item.account.name,
      item.debit > 0 ? item.debit : null,
      item.kredit > 0 ? item.kredit : null
    ]);
  });

  rows.push(["", "", "TOTAL SELURUHNYA", tb.totalDebit, tb.totalKredit]);
  rows.push([]);
  rows.push(["Status:", tb.isBalanced ? "SEIMBANG ✓" : "LENGKET / TIDAK SEIMBANG ✗", "", "", tb.difference > 0 ? `Selisih: ${tb.difference}` : ""]);

  const ws = XLSX.utils.aoa_to_sheet(rows);

  ws['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 4 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: 4 } },
    { s: { r: 2, c: 0 }, e: { r: 2, c: 4 } }
  ];

  ws['!cols'] = [
    { wch: 6 },  // No
    { wch: 12 }, // Kode Akun
    { wch: 32 }, // Nama Akun
    { wch: 18 }, // Debit
    { wch: 18 }  // Kredit
  ];

  applyCurrencyFormatting(ws, XLSX);
  return ws;
}

// -----------------------------------------------------------------
// D. KERTAS KERJA / WORKSHEET 10 KOLOM EXPORTER
// -----------------------------------------------------------------
export function generateKertasKerjaSheet(
  XLSX: any,
  transactions: JournalTransaction[],
  accounts: Account[],
  settings: SystemSettings
): any {
  const companyName = settings.companyName;
  const period = settings.period;

  // Let's split transactions: adjustments (starts with JA-) and standard
  const standardTxs = transactions.filter(t => !t.refNo.startsWith('JA-') && !t.refNo.startsWith('JP-'));
  const adjTxs = transactions.filter(t => t.refNo.startsWith('JA-'));

  // Calculate standard Trial Balance balances
  const stdLedgers = generateLedger(standardTxs, accounts);
  const adjLedgers = generateLedger(adjTxs, accounts);

  const rows: any[][] = [
    [companyName],
    ["KERTAS KERJA (10 KOLOM)"],
    [`Periode: ${period}`],
    [],
    [
      "No", "Kode", "Nama Akun", 
      "Neraca Saldo", "", 
      "Penyesuaian", "", 
      "NS Setelah Penyesuaian", "", 
      "Laba Rugi", "", 
      "Neraca keuangan", ""
    ],
    [
      "", "", "", 
      "Debit", "Kredit", 
      "Debit", "Kredit", 
      "Debit", "Kredit", 
      "Debit", "Kredit", 
      "Debit", "Kredit"
    ]
  ];

  // Totals calculations
  let sumNS_D = 0, sumNS_K = 0;
  let sumAdj_D = 0, sumAdj_K = 0;
  let sumNSD_D = 0, sumNSD_K = 0;
  let sumLR_D = 0, sumLR_K = 0;
  let sumN_D = 0, sumN_K = 0;

  let rowCounter = 1;

  accounts.forEach(acc => {
    // Standard Trial Balance cell
    const stdSum = stdLedgers[acc.code];
    const stdBal = stdSum?.closingBalance || 0;
    let nsD = 0, nsK = 0;
    if (stdBal > 0) {
      if (acc.normalBalance === 'D') nsD = stdBal;
      else nsK = stdBal;
    }

    // Adjustments cell from JA- ledger rows
    let adjD = 0, adjK = 0;
    const adjSum = adjLedgers[acc.code];
    if (adjSum) {
      adjSum.rows.forEach(row => {
        adjD += row.debit;
        adjK += row.kredit;
      });
    }

    // Computed NSD balance
    let nsdD = 0, nsdK = 0;
    // Calculation: NS_D - NS_K + Adj_D - Adj_K
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

    // Allocate to LR or N
    let lrD = 0, lrK = 0;
    let nD = 0, nK = 0;
    const codeNum = parseInt(acc.code);

    if (codeNum >= 400) {
      lrD = nsdD;
      lrK = nsdK;
    } else {
      nD = nsdD;
      nK = nsdK;
    }

    // Accumulate total sums if there is any transaction entry to keep worksheet tight
    const hasValue = (nsD > 0 || nsK > 0 || adjD > 0 || adjK > 0 || nsdD > 0 || nsdK > 0 || lrD > 0 || lrK > 0 || nD > 0 || nK > 0);
    
    if (hasValue) {
      rows.push([
        rowCounter++,
        acc.code,
        acc.name,
        nsD > 0 ? nsD : null,
        nsK > 0 ? nsK : null,
        adjD > 0 ? adjD : null,
        adjK > 0 ? adjK : null,
        nsdD > 0 ? nsdD : null,
        nsdK > 0 ? nsdK : null,
        lrD > 0 ? lrD : null,
        lrK > 0 ? lrK : null,
        nD > 0 ? nD : null,
        nK > 0 ? nK : null
      ]);

      sumNS_D += nsD; sumNS_K += nsK;
      sumAdj_D += adjD; sumAdj_K += adjK;
      sumNSD_D += nsdD; sumNSD_K += nsdK;
      sumLR_D += lrD; sumLR_K += lrK;
      sumN_D += nD; sumN_K += nK;
    }
  });

  // Intermediate Column totals
  rows.push([
    "Totals", "", "JUMLAH",
    sumNS_D, sumNS_K,
    sumAdj_D, sumAdj_K,
    sumNSD_D, sumNSD_K,
    sumLR_D, sumLR_K,
    sumN_D, sumN_K
  ]);

  // Calculate Net Profit / Loss
  // Revenues (LR Credits) vs Expenses (LR Debits)
  const netIncome = sumLR_K - sumLR_D;
  const isLoss = netIncome < 0;
  const absNet = Math.abs(netIncome);

  let netLR_D = 0, netLR_K = 0;
  let netN_D = 0, netN_K = 0;

  if (!isLoss) {
    // Profit
    netLR_D = absNet; // put on LR debit to balance
    netN_K = absNet;  // put on Neraca credit to balance
  } else {
    // Loss
    netLR_K = absNet; // put on LR credit to balance
    netN_D = absNet;  // put on Neraca debit to balance
  }

  // Row: Net Profit / Loss
  rows.push([
    "", "", isLoss ? "RUGI BERSIH PERIODE BERJALAN" : "LABA BERSIH PERIODE BERJALAN",
    null, null,
    null, null,
    null, null,
    netLR_D > 0 ? netLR_D : null,
    netLR_K > 0 ? netLR_K : null,
    netN_D > 0 ? netN_D : null,
    netN_K > 0 ? netN_K : null
  ]);

  // Row final balances (Balanced sum)
  rows.push([
    "", "", "BALANCED GRAND TOTAL",
    sumNS_D, sumNS_K,
    sumAdj_D, sumAdj_K,
    sumNSD_D, sumNSD_K,
    sumLR_D + netLR_D, sumLR_K + netLR_K,
    sumN_D + netN_D, sumN_K + netN_K
  ]);

  const ws = XLSX.utils.aoa_to_sheet(rows);

  // Set Merges
  ws['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 12 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: 12 } },
    { s: { r: 2, c: 0 }, e: { r: 2, c: 12 } },
    // Col headers merge
    { s: { r: 4, c: 0 }, e: { r: 5, c: 0 } }, // No
    { s: { r: 4, c: 1 }, e: { r: 5, c: 1 } }, // Kode
    { s: { r: 4, c: 2 }, e: { r: 5, c: 2 } }, // Nama
    { s: { r: 4, c: 3 }, e: { r: 4, c: 4 } }, // NS
    { s: { r: 4, c: 5 }, e: { r: 4, c: 6 } }, // Penyesuaian
    { s: { r: 4, c: 7 }, e: { r: 4, c: 8 } }, // NSD
    { s: { r: 4, c: 9 }, e: { r: 4, c: 10 } }, // LR
    { s: { r: 4, c: 11 }, e: { r: 4, c: 12 } } // Neraca
  ];

  ws['!cols'] = [
    { wch: 5 },   // No
    { wch: 9 },   // Kode
    { wch: 25 },  // Nama
    { wch: 14 }, { wch: 14 }, // NS D, NS K
    { wch: 14 }, { wch: 14 }, // Adj D, Adj K
    { wch: 14 }, { wch: 14 }, // NSD D, NSD K
    { wch: 14 }, { wch: 14 }, // LR D, LR K
    { wch: 14 }, { wch: 14 }  // Neraca D, Neraca K
  ];

  applyCurrencyFormatting(ws, XLSX);
  return ws;
}

// -----------------------------------------------------------------
// E. LAPORAN LABA RUGI EXPORTER
// -----------------------------------------------------------------
export function generateLabaRugiSheet(
  XLSX: any,
  transactions: JournalTransaction[],
  accounts: Account[],
  settings: SystemSettings
): any {
  const companyName = settings.companyName;
  const period = settings.period;

  const lr = generateIncomeStatement(transactions, accounts);

  const rows: any[][] = [
    [companyName],
    ["LAPORAN LABA RUGI"],
    [`Untuk Periode yang Berakhir: ${period}`],
    [],
    ["PENDAPATAN", ""],
  ];

  lr.revenues.forEach(item => {
    rows.push([`  ${item.account.name}`, item.amount]);
  });
  rows.push(["TOTAL PENDAPATAN JASA/USAHA", lr.totalRevenue]);
  rows.push([]);
  rows.push(["BEBAN OPERASIONAL & LAINNYA", ""]);

  lr.expenses.forEach(item => {
    rows.push([`  ${item.account.name}`, item.amount]);
  });
  rows.push(["TOTAL BEBAN OPERASIONAL", lr.totalExpense]);
  rows.push([]);
  rows.push([
    lr.netProfit >= 0 ? "LABA BERSIH PERIODE BERJALAN" : "RUGI BERSIH PERIODE BERJALAN (RUGI)", 
    lr.netProfit
  ]);

  const ws = XLSX.utils.aoa_to_sheet(rows);

  ws['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 1 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: 1 } },
    { s: { r: 2, c: 0 }, e: { r: 2, c: 1 } }
  ];

  ws['!cols'] = [
    { wch: 45 }, // Keterangan
    { wch: 20 }  // Rupiah
  ];

  applyCurrencyFormatting(ws, XLSX);
  return ws;
}

// -----------------------------------------------------------------
// F. LAPORAN PERUBAHAN MODAL EXPORTER
// -----------------------------------------------------------------
export function generatePerubahanModalSheet(
  XLSX: any,
  transactions: JournalTransaction[],
  accounts: Account[],
  settings: SystemSettings
): any {
  const companyName = settings.companyName;
  const period = settings.period;
  
  const lr = generateIncomeStatement(transactions, accounts);
  const eq = generateEquityStatement(transactions, accounts, lr.netProfit);
  const ownerName = getOwnerName();

  const rows: any[][] = [
    [companyName],
    ["LAPORAN PERUBAHAN MODAL"],
    [`Untuk Periode yang Berakhir: ${period}`],
    [],
    [`Modal, Tuan/Nyonya ${ownerName} (Awal)`, eq.initialCapital],
    [
      lr.netProfit >= 0 ? "Tambah: Laba Bersih Periode Berjalan" : "Kurang: Rugi Bersih Periode Berjalan", 
      eq.netProfit
    ],
    [`Kurang: Prive, Tuan/Nyonya ${ownerName}`, eq.drawings > 0 ? -eq.drawings : null],
    [],
    [`Modal Akhir, Tuan/Nyonya ${ownerName} (Per Akhir Periode)`, eq.endingCapital]
  ];

  const ws = XLSX.utils.aoa_to_sheet(rows);

  ws['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 1 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: 1 } },
    { s: { r: 2, c: 0 }, e: { r: 2, c: 1 } }
  ];

  ws['!cols'] = [
    { wch: 45 }, // Item Description
    { wch: 20 }  // Rupiah Amount
  ];

  applyCurrencyFormatting(ws, XLSX);
  return ws;
}

// -----------------------------------------------------------------
// G. LAPORAN NERACA (BALANCE SHEET - TWO COLUMNS) EXPORTER
// -----------------------------------------------------------------
export function generateNeracaSheet(
  XLSX: any,
  transactions: JournalTransaction[],
  accounts: Account[],
  settings: SystemSettings
): any {
  const companyName = settings.companyName;
  const period = settings.period;
  
  const lr = generateIncomeStatement(transactions, accounts);
  const bs = generateBalanceSheet(transactions, accounts, lr.netProfit);
  const ownerName = getOwnerName();

  const rows: any[][] = [
    [companyName],
    ["LAPORAN NERACA (BALANCE SHEET)"],
    [`Per tanggal akhir periode: ${period}`],
    [],
    // Merged main section header
    ["ASET / AKTIVA", "", "LIABILITAS & EKUITAS", ""],
    ["Aset Lancar:", "", "Liabilitas Lancar:", ""],
  ];

  // Map elements of Assets, Liabilities & Equities side-by-side
  const assetRowsSum: any[][] = [];
  const liabLancarSum: any[][] = [];
  const liabPanjangSum: any[][] = [];

  // Populate Assets Lancar
  bs.assetsLancar.forEach(al => {
    assetRowsSum.push([al.account.name, al.amount, false]);
  });
  assetRowsSum.push(["Total Aset Lancar", bs.totalAssetsLancar, true]);
  assetRowsSum.push(["", null, false]); // gap

  // Populate Assets Tetap
  assetRowsSum.push(["Aset Tidak Lancar / Tetap:", null, false]);
  bs.assetsTetap.forEach(at => {
    const isContra = at.account.isContra;
    const dispVal = isContra ? -at.amount : at.amount;
    assetRowsSum.push([
      isContra ? `  (${at.account.name})` : `  ${at.account.name}`, 
      dispVal, 
      false
    ]);
  });
  assetRowsSum.push(["Total Aset Tidak Lancar / Tetap", bs.totalAssetsTetap, true]);
  assetRowsSum.push(["", null, false]); // gap
  assetRowsSum.push(["TOTAL SELURUH ASET", bs.totalAssets, true]);

  // Liabilities Lancar side
  const rightRows: any[][] = [];
  bs.liabilitiesShort.forEach(lls => {
    rightRows.push([lls.account.name, lls.amount]);
  });
  rightRows.push(["Total Liabilitas Lancar", bs.totalLiabilitiesShort]);
  rightRows.push(["", null]); // spacer

  // Liabilities Jangka Panjang side
  rightRows.push(["Liabilitas Jangka Panjang:", null]);
  bs.liabilitiesLong.forEach(llg => {
    rightRows.push([llg.account.name, llg.amount]);
  });
  rightRows.push(["Total Liabilitas Jangka Panjang", bs.totalLiabilitiesLong]);
  rightRows.push(["Total Liabilitas Keseluruhan", bs.totalLiabilities]);
  rightRows.push(["", null]); // spacer

  // Equity side
  rightRows.push(["Ekuitas / Modal:", null]);
  rightRows.push([`Modal Akhir, ${ownerName}`, bs.capital]);
  rightRows.push(["Total Ekuitas Pemilik", bs.totalEquity]);
  rightRows.push(["", null]); // spacer
  rightRows.push(["TOTAL LIABILITAS & EKUITAS", bs.totalLiabilities + bs.totalEquity]);

  // Combine Left and Right arrays
  const maxRows = Math.max(assetRowsSum.length, rightRows.length);
  for (let idx = 0; idx < maxRows; idx++) {
    const assetPair = assetRowsSum[idx] || ["", null, false];
    const liabPair = rightRows[idx] || ["", null];

    rows.push([
      assetPair[0],
      assetPair[1],
      liabPair[0],
      liabPair[1]
    ]);
  }

  // Balanced indicator at bottom
  rows.push([]);
  rows.push([
    "Status Balance:",
    bs.isBalanced ? "NERACA SEIMBANG ✓" : "TIDAK SEIMBANG ✗",
    bs.difference > 0 ? `Selisih: Rp ${bs.difference}` : "Sempurna",
    ""
  ]);

  const ws = XLSX.utils.aoa_to_sheet(rows);

  ws['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 3 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: 3 } },
    { s: { r: 2, c: 0 }, e: { r: 2, c: 3 } },
    // Col headers merge
    { s: { r: 4, c: 0 }, e: { r: 4, c: 1 } },
    { s: { r: 4, c: 2 }, e: { r: 4, c: 3 } }
  ];

  ws['!cols'] = [
    { wch: 32 }, { wch: 18 }, // Left (Asets description, amount)
    { wch: 32 }, { wch: 18 }  // Right (Liab/Eq description, amount)
  ];

  applyCurrencyFormatting(ws, XLSX);
  return ws;
}

// -----------------------------------------------------------------
// EXPORT ALL AT ONCE (Single Excel book, multiple sheets)
// -----------------------------------------------------------------
export function exportAllReportsToExcel(
  XLSX: any,
  transactions: JournalTransaction[],
  accounts: Account[],
  settings: SystemSettings
) {
  const wb = XLSX.utils.book_new();

  // 1. Jurnal Umum
  const jGeneral = generateJurnalUmumSheet(XLSX, transactions, accounts, settings, false, false);
  XLSX.utils.book_append_sheet(wb, jGeneral, "Jurnal Umum");

  // 2. Neraca Saldo
  const nSaldo = generateNeracaSaldoSheet(XLSX, transactions, accounts, settings);
  XLSX.utils.book_append_sheet(wb, nSaldo, "Neraca Saldo");

  // 3. Kertas Kerja
  const kKerja = generateKertasKerjaSheet(XLSX, transactions, accounts, settings);
  XLSX.utils.book_append_sheet(wb, kKerja, "Kertas Kerja");

  // 4. Laba Rugi
  const lRugi = generateLabaRugiSheet(XLSX, transactions, accounts, settings);
  XLSX.utils.book_append_sheet(wb, lRugi, "Laporan Laba Rugi");

  // 5. Perubahan Modal
  const pModal = generatePerubahanModalSheet(XLSX, transactions, accounts, settings);
  XLSX.utils.book_append_sheet(wb, pModal, "Perubahan Modal");

  // 6. Neraca Keuangan
  const neraca = generateNeracaSheet(XLSX, transactions, accounts, settings);
  XLSX.utils.book_append_sheet(wb, neraca, "Neraca");

  // 7. Jurnal Penutup
  const jPenutup = generateJurnalUmumSheet(XLSX, transactions, accounts, settings, false, true);
  XLSX.utils.book_append_sheet(wb, jPenutup, "Jurnal Penutup");

  // 8. Individual Buku Besar sheets (appended safely)
  addBukuBesarSheetsToWorkbook(XLSX, wb, transactions, accounts, settings);

  // Trigger download file
  const fileName = `LaporanLengkap_${settings.companyName.replace(/\s+/g, '_')}_${settings.period.replace(/\s+/g, '_')}.xlsx`;
  XLSX.writeFile(wb, fileName);
}
