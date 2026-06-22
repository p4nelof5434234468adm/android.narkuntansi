import React, { useState } from 'react';
import { Plus, Edit2, Trash2, BookOpen, AlertCircle, RefreshCw } from 'lucide-react';
import { Account, AccountCategory } from '../types';

interface COAManagerProps {
  accounts: Account[];
  onAccountsChange: (updatedAccounts: Account[]) => void;
  onResetAccounts: () => void;
  showToast: (message: string, type: 'success' | 'error') => void;
}

export function COAManager({ accounts, onAccountsChange, onResetAccounts, showToast }: COAManagerProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingCode, setEditingCode] = useState<string | null>(null);

  // Form Fields
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState<AccountCategory>('Aset');
  const [normalBalance, setNormalBalance] = useState<'D' | 'K'>('D');
  const [isContra, setIsContra] = useState(false);

  // Edit Mode toggle
  const startEdit = (acc: Account) => {
    setEditingCode(acc.code);
    setCode(acc.code);
    setName(acc.name);
    setCategory(acc.category);
    setNormalBalance(acc.normalBalance);
    setIsContra(acc.isContra);
    setIsAdding(true);
  };

  const cancelForm = () => {
    setIsAdding(false);
    setEditingCode(null);
    setCode('');
    setName('');
    setCategory('Aset');
    setNormalBalance('D');
    setIsContra(false);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    if (!code || code.trim().length !== 3) {
      showToast('Kode akun harus terdiri dari 3 digit angka', 'error');
      return;
    }

    if (!name || name.trim() === '') {
      showToast('Nama akun tidak boleh kosong', 'error');
      return;
    }

    // Check category prefix standard check 
    const firstDigit = code.charAt(0);
    let expectedPrefix = '1';
    if (category === 'Liabilitas') expectedPrefix = '2';
    else if (category === 'Ekuitas') expectedPrefix = '3';
    else if (category === 'Pendapatan') expectedPrefix = '4';
    else if (category === 'Beban') expectedPrefix = '5';

    if (firstDigit !== expectedPrefix) {
      showToast(`Rekomendasi Kode Akun ${category} diawali dengan angka ${expectedPrefix}xx`, 'error');
      // allow save but show notification of standard compliance
    }

    const duplicateCode = accounts.some(acc => acc.code === code && acc.code !== editingCode);
    if (duplicateCode) {
      showToast(`Kode akun ${code} sudah digunakan oleh akun lain!`, 'error');
      return;
    }

    const newAccount: Account = {
      code: code.trim(),
      name: name.trim(),
      category,
      normalBalance,
      isContra
    };

    let updatedList: Account[];
    if (editingCode) {
      updatedList = accounts.map(acc => (acc.code === editingCode ? newAccount : acc));
      showToast(`Akun ${name} berhasil diperbarui`, 'success');
    } else {
      updatedList = [...accounts, newAccount];
      showToast(`Akun ${name} berhasil ditambahkan ke daftar`, 'success');
    }

    // Sort accounts by code
    updatedList.sort((a, b) => a.code.localeCompare(b.code));
    onAccountsChange(updatedList);
    cancelForm();
  };

  const handleDelete = (targetCode: string) => {
    // Avoid deleting core accounts that are highly dependent
    const protectCodes = ['101', '301'];
    if (protectCodes.includes(targetCode)) {
      showToast(`Akun utama (${targetCode}) tidak diperkenankan untuk dihapus`, 'error');
      return;
    }

    const targetAcc = accounts.find(a => a.code === targetCode);
    if (window.confirm(`Apakah Anda yakin ingin menghapus akun [${targetCode}] ${targetAcc?.name || ''}?`)) {
      const filtered = accounts.filter(acc => acc.code !== targetCode);
      onAccountsChange(filtered);
      showToast(`Akun ${targetAcc?.name || targetCode} berhasil dihapus`, 'success');
    }
  };

  const autofillNormalBalance = (cat: AccountCategory) => {
    setCategory(cat);
    if (cat === 'Aset' || cat === 'Beban') {
      setNormalBalance('D');
    } else {
      setNormalBalance('K');
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden transition-colors duration-200">
      <div className="p-6 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-50 dark:bg-blue-950/45 rounded-xl text-blue-600 dark:text-blue-400">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800 dark:text-white">Chart of Accounts (Daftar Bagan Akun)</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Kelola bagan perkiraan laporan keuangan Anda sesuai standar PSAK dan SAK EP 25.
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={onResetAccounts}
            className="px-3 py-1.5 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold rounded-lg flex items-center gap-1.5 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
            title="Muat Ulang COA Standar Indonesia"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Reset COA Standar
          </button>

          {!isAdding && (
            <button
              onClick={() => setIsAdding(true)}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Tambah Akun Baru
            </button>
          )}
        </div>
      </div>

      <div className="p-6">
        {/* ADD / EDIT FORM PANEL */}
        {isAdding && (
          <form onSubmit={handleSave} className="mb-6 p-4 border border-slate-100 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-900/30 grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
            <div>
              <label className="text-xs font-bold text-slate-500 block mb-1">Kode Akun (3 Digit)</label>
              <input
                type="text"
                placeholder="misal: 107"
                maxLength={3}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                disabled={editingCode !== null}
                className="w-full text-xs p-2.5 border border-slate-200 dark:border-slate-800 dark:bg-slate-900 rounded-lg dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-500 block mb-1">Nama Perkiraan (Akun)</label>
              <input
                type="text"
                placeholder="misal: Piutang Karyawan"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full text-xs p-2.5 border border-slate-200 dark:border-slate-800 dark:bg-slate-900 rounded-lg dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-500 block mb-1">Klasifikasi Laporan</label>
              <select
                value={category}
                onChange={(e) => autofillNormalBalance(e.target.value as AccountCategory)}
                className="w-full text-xs p-2.5 border border-slate-200 dark:border-slate-800 dark:bg-slate-900 rounded-lg dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="Aset">1xx — Aset (Harta)</option>
                <option value="Liabilitas">2xx — Liabilitas (Utang)</option>
                <option value="Ekuitas">3xx — Ekuitas (Modal)</option>
                <option value="Pendapatan">4xx — Pendapatan</option>
                <option value="Beban">5xx — Beban</option>
              </select>
            </div>

            <div className="flex gap-4">
              <div className="flex-1">
                <label className="text-xs font-bold text-slate-500 block mb-1">Saldo Normal</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setNormalBalance('D')}
                    className={`flex-1 text-xs py-2 border rounded-lg font-semibold transition-all ${
                      normalBalance === 'D'
                        ? 'bg-blue-50 dark:bg-blue-950/30 border-blue-500 text-blue-700 dark:text-blue-400'
                        : 'border-slate-200 dark:border-slate-800 dark:text-slate-300'
                    }`}
                  >
                    Debit (D)
                  </button>
                  <button
                    type="button"
                    onClick={() => setNormalBalance('K')}
                    className={`flex-1 text-xs py-2 border rounded-lg font-semibold transition-all ${
                      normalBalance === 'K'
                        ? 'bg-blue-50 dark:bg-blue-950/30 border-blue-500 text-blue-700 dark:text-blue-400'
                        : 'border-slate-200 dark:border-slate-800 dark:text-slate-300'
                    }`}
                  >
                    Kredit (K)
                  </button>
                </div>
              </div>

              <div className="flex flex-col items-center justify-center">
                <label className="text-xs font-bold text-slate-500 block mb-2 cursor-pointer">Contra Akun?</label>
                <input
                  type="checkbox"
                  checked={isContra}
                  onChange={(e) => setIsContra(e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-slate-200 rounded focus:ring-blue-500 cursor-pointer"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs transition-colors cursor-pointer"
              >
                {editingCode ? 'Update Akun' : 'Simpan Akun'}
              </button>
              <button
                type="button"
                onClick={cancelForm}
                className="py-2 px-3 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-xs text-slate-500 dark:text-slate-400 transition-colors cursor-pointer"
              >
                Batal
              </button>
            </div>
          </form>
        )}

        {/* COA LIST TABLE */}
        <div className="overflow-x-auto border border-slate-150 dark:border-slate-800 rounded-xl">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-950/40 text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800 font-bold">
                <th className="p-3">Kode Akun</th>
                <th className="p-3">Nama Akun / Rekening</th>
                <th className="p-3">Klasifikasi Utama</th>
                <th className="p-3 text-center">Saldo Normal</th>
                <th className="p-3">Sifat / Keterangan</th>
                <th className="p-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-700 dark:text-slate-300">
              {accounts.map(acc => {
                let badgeColor = 'bg-blue-50 text-blue-700 dark:bg-blue-950/20 dark:text-blue-400';
                if (acc.category === 'Liabilitas') badgeColor = 'bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400';
                else if (acc.category === 'Ekuitas') badgeColor = 'bg-teal-50 text-teal-700 dark:bg-teal-950/20 dark:text-teal-400';
                else if (acc.category === 'Pendapatan') badgeColor = 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400';
                else if (acc.category === 'Beban') badgeColor = 'bg-rose-50 text-rose-700 dark:bg-rose-950/20 dark:text-rose-400';

                return (
                  <tr key={acc.code} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10 transition-colors">
                    <td className="p-3 font-mono font-bold text-slate-800 dark:text-slate-200">{acc.code}</td>
                    <td className="p-3 font-semibold text-slate-800 dark:text-white capitalize">{acc.name}</td>
                    <td className="p-3">
                      <span className={`px-2 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${badgeColor}`}>
                        {acc.category}
                      </span>
                    </td>
                    <td className="p-3 text-center font-bold">
                      <span className={acc.normalBalance === 'D' ? 'text-blue-600' : 'text-amber-600'}>
                        {acc.normalBalance === 'D' ? 'DEBIT' : 'KREDIT'}
                      </span>
                    </td>
                    <td className="p-3">
                      {acc.isContra ? (
                        <span className="text-[10px] font-bold text-rose-500 bg-rose-50 dark:bg-rose-950/15 border border-rose-100 dark:border-rose-950/30 px-1.5 py-0.5 rounded">
                          Contra Account (Pengurang)
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400">Standar Normal</span>
                      )}
                    </td>
                    <td className="p-3">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => startEdit(acc)}
                          type="button"
                          className="p-1.5 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800/80 rounded transition-colors"
                          title="Ubah Rincian Akun"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(acc.code)}
                          disabled={['101', '301'].includes(acc.code)}
                          type="button"
                          className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800/80 rounded transition-colors disabled:opacity-40"
                          title="Hapus Akun"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
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
