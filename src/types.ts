export type AccountCategory = 'Aset' | 'Liabilitas' | 'Ekuitas' | 'Pendapatan' | 'Beban';

export interface Account {
  code: string;            // 3 digits representation, e.g., "101"
  name: string;
  category: AccountCategory;
  normalBalance: 'D' | 'K';
  isContra: boolean;      // For items like Accumulated Depreciation
}

export interface JournalEntryItem {
  id: string;              // unique ID for item
  accountCode: string;
  posisi: 'debit' | 'kredit';
  nominal: number;
}

export interface JournalTransaction {
  id: string;
  date: string;            // YYYY-MM-DD
  refNo: string;           // Journal Number or ref
  description: string;
  entries: JournalEntryItem[];
}

export interface SystemSettings {
  geminiApiKey: string;
  companyName: string;
  period: string;          // e.g., "Juni 2026", "Tahun 2026"
  namaPemilik?: string;
  alamatPerusahaan?: string;
  tanggalAwal?: string;
  tanggalAkhir?: string;
  matauang?: string;
  saldoAwalKas?: number;
}

// Depreciation Calculation Models
export interface DepreciationScheduleRow {
  year: number;
  beginningBookValue: number;
  depreciationExpense: number;
  accumulatedDepreciation: number;
  endingBookValue: number;
}

// Interest Calculation Models
export interface SimpleInterestResult {
  interest: number;
  totalAmount: number;
}

export interface CompoundInterestRow {
  period: number;
  beginningBalance: number;
  interestEarned: number;
  endingBalance: number;
}
