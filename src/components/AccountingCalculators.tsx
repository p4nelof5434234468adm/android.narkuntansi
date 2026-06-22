import React, { useState, useMemo } from 'react';
import { Percent, Wallet, DollarSign, Calculator, ChevronRight, BarChart3, TrendingUp, HelpCircle } from 'lucide-react';
import { DepreciationScheduleRow, SimpleInterestResult, CompoundInterestRow } from '../types';
import { formatRupiah } from '../accountingEngine';

export function AccountingCalculators() {
  const [activeSubTab, setActiveSubTab] = useState<'ratio' | 'depreciation' | 'interest' | 'equation'>('equation');

  // ============================================
  // DEPRESIASI STATE & LOGIC
  // ============================================
  const [cost, setCost] = useState(50000000); // Rp 50.000.000
  const [salvage, setSalvage] = useState(5000000); // Rp 5.000.000
  const [usefulLife, setUsefulLife] = useState(5); // 5 Tahun
  const [rate, setRate] = useState(40); // 40% for declining balance, default is usually double (2/life = 40%)
  const [deprMethod, setDeprMethod] = useState<'straight' | 'declining' | 'sumofyears'>('straight');

  const deprSchedule = useMemo<DepreciationScheduleRow[]>(() => {
    const rows: DepreciationScheduleRow[] = [];
    if (usefulLife <= 0) return rows;

    if (deprMethod === 'straight') {
      const depreciableAmount = cost - salvage;
      const annualDepr = depreciableAmount / usefulLife;
      let accDepr = 0;
      let bookValue = cost;

      for (let y = 1; y <= usefulLife; y++) {
        accDepr += annualDepr;
        bookValue -= annualDepr;
        rows.push({
          year: y,
          beginningBookValue: bookValue + annualDepr,
          depreciationExpense: annualDepr,
          accumulatedDepreciation: accDepr,
          endingBookValue: bookValue
        });
      }
    } else if (deprMethod === 'declining') {
      let bookValue = cost;
      let accDepr = 0;
      const pctRate = rate / 100;

      for (let y = 1; y <= usefulLife; y++) {
        const begVal = bookValue;
        let deprExpense = begVal * pctRate;
        // In the final year, adjust to match exact salvage value
        if (y === usefulLife || begVal - deprExpense < salvage) {
          deprExpense = Math.max(begVal - salvage, 0);
        }
        accDepr += deprExpense;
        bookValue -= deprExpense;

        rows.push({
          year: y,
          beginningBookValue: begVal,
          depreciationExpense: deprExpense,
          accumulatedDepreciation: accDepr,
          endingBookValue: bookValue
        });
        if (bookValue <= salvage) break;
      }
    } else if (deprMethod === 'sumofyears') {
      const depreciableAmount = cost - salvage;
      const sumOfYears = (usefulLife * (usefulLife + 1)) / 2;
      let accDepr = 0;
      let bookValue = cost;

      for (let y = 1; y <= usefulLife; y++) {
        const begVal = bookValue;
        const remainingLife = usefulLife - y + 1;
        const annualDepr = (remainingLife / sumOfYears) * depreciableAmount;
        accDepr += annualDepr;
        bookValue -= annualDepr;

        rows.push({
          year: y,
          beginningBookValue: begVal,
          depreciationExpense: annualDepr,
          accumulatedDepreciation: accDepr,
          endingBookValue: bookValue
        });
      }
    }
    return rows;
  }, [cost, salvage, usefulLife, rate, deprMethod]);

  // ============================================
  // BUNGA STATE & LOGIC
  // ============================================
  const [principal, setPrincipal] = useState(10000000); // 10jt
  const [interestRate, setInterestRate] = useState(10); // 10%
  const [timePeriod, setTimePeriod] = useState(3); // 3 Tahun
  const [compoundsPerYear, setCompoundsPerYear] = useState(1); // Tahunan

  const simpleInterestResult = useMemo<SimpleInterestResult>(() => {
    const rVal = interestRate / 100;
    const interest = principal * rVal * timePeriod;
    return {
      interest,
      totalAmount: principal + interest
    };
  }, [principal, interestRate, timePeriod]);

  const compoundInterestRows = useMemo<CompoundInterestRow[]>(() => {
    const rows: CompoundInterestRow[] = [];
    const rVal = interestRate / 100;
    const n = compoundsPerYear;
    const totalPeriods = timePeriod * n;
    
    let balance = principal;

    for (let p = 1; p <= totalPeriods; p++) {
      const startBal = balance;
      const interestEarned = startBal * (rVal / n);
      balance = startBal + interestEarned;
      rows.push({
        period: p,
        beginningBalance: startBal,
        interestEarned,
        endingBalance: balance
      });
    }
    return rows;
  }, [principal, interestRate, timePeriod, compoundsPerYear]);

  const presentValueResult = useMemo(() => {
    const rVal = interestRate / 100;
    // PV = principal / (1 + r)^t
    const pv = principal / Math.pow(1 + rVal, timePeriod);
    return pv;
  }, [principal, interestRate, timePeriod]);

  // ============================================
  // RASIO KEUANGAN STATE & LOGIC
  // ============================================
  const [asetLancarInput, setAsetLancarInput] = useState(120000000);
  const [liabilitasLancarInput, setLiabilitasLancarInput] = useState(50000000);
  const [persediaanInput, setPersediaanInput] = useState(30000000);
  const [kasInput, setKasInput] = useState(40000000);
  const [labaKotorInput, setLabaKotorInput] = useState(75000000);
  const [labaBersihInput, setLabaBersihInput] = useState(35000000);
  const [pendapatanInput, setPendapatanInput] = useState(200000000);
  const [totalAsetInput, setTotalAsetInput] = useState(500000000);
  const [totalLiabilitasInput, setTotalLiabilitasInput] = useState(200000000);
  const [totalEkuitasInput, setTotalEkuitasInput] = useState(300000000);

  const calculatedRatios = useMemo(() => {
    const currentRatio = asetLancarInput / (liabilitasLancarInput || 1);
    const quickRatio = (asetLancarInput - persediaanInput) / (liabilitasLancarInput || 1);
    const cashRatio = kasInput / (liabilitasLancarInput || 1);

    const gpm = (labaKotorInput / (pendapatanInput || 1)) * 100;
    const npm = (labaBersihInput / (pendapatanInput || 1)) * 100;
    const roa = (labaBersihInput / (totalAsetInput || 1)) * 100;
    const roe = (labaBersihInput / (totalEkuitasInput || 1)) * 100;

    const dar = totalLiabilitasInput / (totalAsetInput || 1);
    const der = totalLiabilitasInput / (totalEkuitasInput || 1);

    return {
      currentRatio,
      quickRatio,
      cashRatio,
      gpm,
      npm,
      roa,
      roe,
      dar,
      der
    };
  }, [
    asetLancarInput, liabilitasLancarInput, persediaanInput, kasInput,
    labaKotorInput, labaBersihInput, pendapatanInput,
    totalAsetInput, totalLiabilitasInput, totalEkuitasInput
  ]);

  // ============================================
  // PERSAMAAN AKUNTANSI (VISUAL GAME)
  // ============================================
  const [eqAssets, setEqAssets] = useState(150000000);
  const [eqLiabilities, setEqLiabilities] = useState(60000000);
  const [eqEquity, setEqEquity] = useState(90000000);

  const assetsBalanced = Math.abs(eqAssets - (eqLiabilities + eqEquity)) < 1;

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm transition-colors duration-200 overflow-hidden">
      {/* Header bar */}
      <div className="p-6 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50">
        <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
          <Calculator className="w-5 h-5 text-blue-600" />
          Kalkulator & Referensi Rumus Akuntansi
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Simulasikan perhitungan rasio keuangan, penyusutan aset tetap, bunga modal, dan ketahui visualisasi persamaan dasar akrual.
        </p>

        {/* Sub Tabs */}
        <div className="flex gap-1.5 mt-5 border-b border-slate-100 dark:border-slate-800/60 pb-1 flex-wrap">
          <button
            onClick={() => setActiveSubTab('equation')}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              activeSubTab === 'equation'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/55'
            }`}
          >
            Persamaan Akuntansi
          </button>
          <button
            onClick={() => setActiveSubTab('ratio')}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              activeSubTab === 'ratio'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/55'
            }`}
          >
            Rasio Keuangan
          </button>
          <button
            onClick={() => setActiveSubTab('depreciation')}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              activeSubTab === 'depreciation'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/55'
            }`}
          >
            Kalkulator Depresiasi
          </button>
          <button
            onClick={() => setActiveSubTab('interest')}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              activeSubTab === 'interest'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/55'
            }`}
          >
            Kalkulator Bunga & PV
          </button>
        </div>
      </div>

      <div className="p-6">
        {/* ======================================================
            TAB 1: PERSAMAAN AKUNTANSI
            ====================================================== */}
        {activeSubTab === 'equation' && (
          <div className="space-y-6">
            <div className="p-4 bg-blue-50/50 dark:bg-blue-950/15 border border-blue-100 dark:border-blue-900/30 rounded-xl">
              <h3 className="font-semibold text-blue-900 dark:text-blue-400 text-sm flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4" /> Persamaan Dasar Akuntansi
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
                Persamaan dasar akuntansi adalah pilar utama akrual SAK Indonesia 2025. Sifat ganda sistem berpasangan (Double-Entry) menjamin bahwa total aset selalu sama dengan jumlah liabilitas dan ekuitas.
              </p>
            </div>

            {/* Visual Balance Scale */}
            <div className="border border-slate-100 dark:border-slate-800 rounded-2xl p-6 bg-slate-50/40 dark:bg-slate-900/40 flex flex-col items-center">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-6">Visualisasi Neraca Berimbang</span>

              <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-8 items-center max-w-3xl">
                {/* Left Side: Aset */}
                <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-sm rounded-xl p-5 text-center">
                  <div className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest">Aset (Harta)</div>
                  <div className="text-2xl font-black text-slate-800 dark:text-white mt-1">{formatRupiah(eqAssets)}</div>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">Sumber daya yang dimiliki / dikendalikan entitas</p>
                  
                  <input
                    type="range"
                    min="10000000"
                    max="500000000"
                    step="5000000"
                    value={eqAssets}
                    onChange={(e) => setEqAssets(Number(e.target.value))}
                    className="w-full mt-4 h-1 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                </div>

                {/* Right Side: Liabilitas + Ekuitas */}
                <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-sm rounded-xl p-5 text-center relative">
                  <div className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-widest">Liabilitas + Ekuitas</div>
                  <div className="text-2xl font-black text-slate-800 dark:text-white mt-1">
                    {formatRupiah(eqLiabilities + eqEquity)}
                  </div>
                  <div className="flex justify-between gap-4 mt-1 text-[10px] text-slate-400 dark:text-slate-500">
                    <span>Utang: {formatRupiah(eqLiabilities)}</span>
                    <span>Modal: {formatRupiah(eqEquity)}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mt-4">
                    <div>
                      <span className="text-[9px] font-bold text-slate-400 block mb-1">Sl. Liabilitas</span>
                      <input
                        type="range"
                        min="0"
                        max="250000000"
                        step="5000000"
                        value={eqLiabilities}
                        onChange={(e) => setEqLiabilities(Number(e.target.value))}
                        className="w-full h-1 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-600"
                      />
                    </div>
                    <div>
                      <span className="text-[9px] font-bold text-slate-400 block mb-1">Sl. Ekuitas</span>
                      <input
                        type="range"
                        min="0"
                        max="250000000"
                        step="5000000"
                        value={eqEquity}
                        onChange={(e) => setEqEquity(Number(e.target.value))}
                        className="w-full h-1 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-teal-600"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Equilibrium Status */}
              <div className="mt-8 flex flex-col items-center">
                {assetsBalanced ? (
                  <div className="px-5 py-2.5 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50 rounded-full flex items-center gap-2">
                    <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping" />
                    <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">Neraca Seimbang (Harta = Utang + Modal)</span>
                  </div>
                ) : (
                  <div className="px-5 py-2.5 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50 rounded-full flex flex-col items-center gap-1">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 bg-rose-500 rounded-full animate-bounce" />
                      <span className="text-xs font-bold text-rose-700 dark:text-rose-400">Tidak Seimbang! Selisih {formatRupiah(Math.abs(eqAssets - (eqLiabilities + eqEquity)))}</span>
                    </div>
                    <button
                      onClick={() => {
                        // Distribute half to liability and equity
                        const halfDiff = (eqAssets - (eqLiabilities + eqEquity)) / 2;
                        setEqLiabilities(Math.max(0, eqLiabilities + Math.floor(halfDiff)));
                        setEqEquity(Math.max(0, eqEquity + Math.ceil(halfDiff)));
                      }}
                      className="text-[10px] text-blue-600 underline hover:text-blue-800"
                    >
                      Seimbangkan Otomatis
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Core equations explainers */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border border-slate-100 dark:border-slate-800 rounded-xl p-4 bg-white dark:bg-slate-950">
                <span className="text-xs font-bold text-slate-400">Rumus Laba Bersih</span>
                <h4 className="text-base font-bold text-slate-800 dark:text-white mt-1">Laba Bersih = Pendapatan - Beban</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Laba bersih positif menambah ekuitas pemilik. Jika bernilai negatif, maka entitas mengalami defisit (rugi bersh).</p>
              </div>
              <div className="border border-slate-100 dark:border-slate-800 rounded-xl p-4 bg-white dark:bg-slate-950">
                <span className="text-xs font-bold text-slate-400">Ekuitas Akhir</span>
                <h4 className="text-base font-bold text-slate-800 dark:text-white mt-1">Modal Akhir = Modal Awal + Laba - Prive</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Disusun dalam Laporan Perubahan Ekuitas. Saldo Prive pemilik secara langsung mereduksi nilai nominal ekuitas.</p>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================
            TAB 2: RASIO KEUANGAN
            ====================================================== */}
        {activeSubTab === 'ratio' && (
          <div className="space-y-6">
            <span className="text-xs font-bold text-slate-400 block">Atur Variabel Untuk Simulasi Rasio Keuangan</span>
            
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block mb-1">Aset Lancar (AL)</label>
                <input
                  type="number"
                  value={asetLancarInput}
                  onChange={(e) => setAsetLancarInput(Number(e.target.value))}
                  className="w-full text-xs p-2 border border-slate-200 dark:border-slate-800 dark:bg-slate-950 dark:text-white rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block mb-1">Liab. Lancar (LL)</label>
                <input
                  type="number"
                  value={liabilitasLancarInput}
                  onChange={(e) => setLiabilitasLancarInput(Number(e.target.value))}
                  className="w-full text-xs p-2 border border-slate-200 dark:border-slate-800 dark:bg-slate-950 dark:text-white rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block mb-1">Persediaan</label>
                <input
                  type="number"
                  value={persediaanInput}
                  onChange={(e) => setPersediaanInput(Number(e.target.value))}
                  className="w-full text-xs p-2 border border-slate-200 dark:border-slate-800 dark:bg-slate-950 dark:text-white rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block mb-1">Kas / Setara</label>
                <input
                  type="number"
                  value={kasInput}
                  onChange={(e) => setKasInput(Number(e.target.value))}
                  className="w-full text-xs p-2 border border-slate-200 dark:border-slate-800 dark:bg-slate-950 dark:text-white rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block mb-1">Pendapatan</label>
                <input
                  type="number"
                  value={pendapatanInput}
                  onChange={(e) => setPendapatanInput(Number(e.target.value))}
                  className="w-full text-xs p-2 border border-slate-200 dark:border-slate-800 dark:bg-slate-950 dark:text-white rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block mb-1">Laba Kotor</label>
                <input
                  type="number"
                  value={labaKotorInput}
                  onChange={(e) => setLabaKotorInput(Number(e.target.value))}
                  className="w-full text-xs p-2 border border-slate-200 dark:border-slate-800 dark:bg-slate-950 dark:text-white rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block mb-1">Laba Bersih</label>
                <input
                  type="number"
                  value={labaBersihInput}
                  onChange={(e) => setLabaBersihInput(Number(e.target.value))}
                  className="w-full text-xs p-2 border border-slate-200 dark:border-slate-800 dark:bg-slate-950 dark:text-white rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block mb-1">Total Aset</label>
                <input
                  type="number"
                  value={totalAsetInput}
                  onChange={(e) => setTotalAsetInput(Number(e.target.value))}
                  className="w-full text-xs p-2 border border-slate-200 dark:border-slate-800 dark:bg-slate-950 dark:text-white rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block mb-1">Tot. Liabilitas</label>
                <input
                  type="number"
                  value={totalLiabilitasInput}
                  onChange={(e) => setTotalLiabilitasInput(Number(e.target.value))}
                  className="w-full text-xs p-2 border border-slate-200 dark:border-slate-800 dark:bg-slate-950 dark:text-white rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block mb-1">Tot. Ekuitas</label>
                <input
                  type="number"
                  value={totalEkuitasInput}
                  onChange={(e) => setTotalEkuitasInput(Number(e.target.value))}
                  className="w-full text-xs p-2 border border-slate-200 dark:border-slate-800 dark:bg-slate-950 dark:text-white rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Results Grid split by category */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Likuiditas */}
              <div className="border border-slate-100 dark:border-slate-800 rounded-xl p-5 bg-slate-50/50 dark:bg-slate-900/30">
                <span className="font-bold text-xs text-blue-600 dark:text-blue-400 uppercase tracking-widest block mb-3">Rasio Likuiditas</span>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">Current Ratio</span>
                      <span className="font-mono font-bold text-slate-900 dark:text-white">{calculatedRatios.currentRatio.toFixed(2)}x</span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full mt-1.5 overflow-hidden">
                      <div className="bg-blue-600 h-full" style={{ width: `${Math.min(calculatedRatios.currentRatio * 30, 100)}%` }}></div>
                    </div>
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      AL / LL. Interpretasi:{' '}
                      {calculatedRatios.currentRatio > 2 ? (
                        <span className="text-emerald-600 font-bold">Sangat Baik</span>
                      ) : calculatedRatios.currentRatio >= 1 ? (
                        <span className="text-amber-600 font-bold">Cukup</span>
                      ) : (
                        <span className="text-rose-600 font-bold">Bahaya (Illiquid)</span>
                      )}
                    </span>
                  </div>

                  <div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">Quick Ratio (Acid Test)</span>
                      <span className="font-mono font-bold text-slate-900 dark:text-white">{calculatedRatios.quickRatio.toFixed(2)}x</span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full mt-1.5 overflow-hidden">
                      <div className="bg-amber-500 h-full" style={{ width: `${Math.min(calculatedRatios.quickRatio * 30, 100)}%` }}></div>
                    </div>
                    <span className="text-[10px] text-slate-400 mt-1 block">(AL - Persediaan) / LL.</span>
                  </div>

                  <div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">Cash Ratio</span>
                      <span className="font-mono font-bold text-slate-900 dark:text-white">{calculatedRatios.cashRatio.toFixed(2)}x</span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full mt-1.5 overflow-hidden">
                      <div className="bg-teal-500 h-full" style={{ width: `${Math.min(calculatedRatios.cashRatio * 40, 100)}%` }}></div>
                    </div>
                    <span className="text-[10px] text-slate-400 mt-1 block">Kas / LL. Tingkat kemudahan bayar instan.</span>
                  </div>
                </div>
              </div>

              {/* Profitabilitas */}
              <div className="border border-slate-100 dark:border-slate-800 rounded-xl p-5 bg-slate-50/50 dark:bg-slate-900/30">
                <span className="font-bold text-xs text-emerald-600 dark:text-emerald-400 uppercase tracking-widest block mb-3">Rasio Profitabilitas</span>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">Gross Profit Margin (GPM)</span>
                      <span className="font-mono font-bold text-slate-900 dark:text-white">{calculatedRatios.gpm.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full mt-1.5 overflow-hidden">
                      <div className="bg-emerald-600 h-full" style={{ width: `${Math.min(calculatedRatios.gpm, 100)}%` }}></div>
                    </div>
                    <span className="text-[10px] text-slate-400 mt-1 block">(Laba Kotor / Pendapatan) x 100%</span>
                  </div>

                  <div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">Net Profit Margin (NPM)</span>
                      <span className="font-mono font-bold text-slate-900 dark:text-white">{calculatedRatios.npm.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full mt-1.5 overflow-hidden">
                      <div className="bg-emerald-500 h-full" style={{ width: `${Math.min(calculatedRatios.npm, 100)}%` }}></div>
                    </div>
                    <span className="text-[10px] text-slate-400 mt-1 block">(Laba Bersih / Pendapatan) x 100%</span>
                  </div>

                  <div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">Return on Assets (ROA)</span>
                      <span className="font-mono font-bold text-slate-900 dark:text-white">{calculatedRatios.roa.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full mt-1.5 overflow-hidden">
                      <div className="bg-teal-600 h-full" style={{ width: `${Math.min(calculatedRatios.roa * 3, 100)}%` }}></div>
                    </div>
                    <span className="text-[10px] text-slate-400 mt-1 block">(Laba Bersih / Total Aset) x 100%</span>
                  </div>
                </div>
              </div>

              {/* Solvabilitas */}
              <div className="border border-slate-100 dark:border-slate-800 rounded-xl p-5 bg-slate-50/50 dark:bg-slate-900/30">
                <span className="font-bold text-xs text-rose-600 dark:text-rose-400 uppercase tracking-widest block mb-3">Rasio Solvabilitas</span>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">Debt to Asset Ratio (DAR)</span>
                      <span className="font-mono font-bold text-slate-900 dark:text-white">{(calculatedRatios.dar * 100).toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full mt-1.5 overflow-hidden">
                      <div className="bg-rose-600 h-full" style={{ width: `${Math.min(calculatedRatios.dar * 100, 100)}%` }}></div>
                    </div>
                    <span className="text-[10px] text-slate-400 mt-1 block">Total Liabilitas / Total Aset.</span>
                  </div>

                  <div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">Debt to Equity Ratio (DER)</span>
                      <span className="font-mono font-bold text-slate-900 dark:text-white">{(calculatedRatios.der * 100).toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full mt-1.5 overflow-hidden">
                      <div className="bg-rose-500 h-full" style={{ width: `${Math.min(calculatedRatios.der * 100, 100)}%` }}></div>
                    </div>
                    <span className="text-[10px] text-slate-400 mt-1 block">Total Liabilitas / Total Ekuitas.</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================
            TAB 3: KALKULATOR DEPRESIASI
            ====================================================== */}
        {activeSubTab === 'depreciation' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-150 dark:border-slate-800">
              <div>
                <label className="text-xs font-bold text-slate-500 block mb-1">Harga Perolehan (Cost)</label>
                <input
                  type="number"
                  value={cost}
                  onChange={(e) => setCost(Number(e.target.value))}
                  className="w-full text-xs p-2.5 border border-slate-200 dark:border-slate-800 dark:bg-slate-900 rounded-lg dark:text-white focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 block mb-1">Nilai Sisa (Salvage)</label>
                <input
                  type="number"
                  value={salvage}
                  onChange={(e) => setSalvage(Number(e.target.value))}
                  className="w-full text-xs p-2.5 border border-slate-200 dark:border-slate-800 dark:bg-slate-900 rounded-lg dark:text-white focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 block mb-1">Umur Ekonomis (Tahun)</label>
                <input
                  type="number"
                  value={usefulLife}
                  min="1"
                  max="50"
                  onChange={(e) => setUsefulLife(Number(e.target.value))}
                  className="w-full text-xs p-2.5 border border-slate-200 dark:border-slate-800 dark:bg-slate-900 rounded-lg dark:text-white focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 block mb-1">Metode Penyusutan</label>
                <select
                  value={deprMethod}
                  onChange={(e) => setDeprMethod(e.target.value as any)}
                  className="w-full text-xs p-2.5 border border-slate-200 dark:border-slate-800 dark:bg-slate-900 rounded-lg dark:text-white focus:outline-none"
                >
                  <option value="straight">Metode Garis Lurus</option>
                  <option value="declining">Metode Saldo Menurun</option>
                  <option value="sumofyears">Metode Jumlah Angka Tahun</option>
                </select>
              </div>
            </div>

            {deprMethod === 'declining' && (
              <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 rounded-xl max-w-md">
                <label className="text-xs font-bold text-amber-800 dark:text-amber-400 block mb-1">Tarif Penyusutan (%)</label>
                <span className="text-[10px] text-amber-600 block mb-2">Nilai ganda standar untuk umur {usefulLife} tahun adalah {((2 / usefulLife) * 100).toFixed(1)}%</span>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="5"
                    max="100"
                    value={rate}
                    onChange={(e) => setRate(Number(e.target.value))}
                    className="w-full accent-amber-600"
                  />
                  <span className="text-xs font-bold font-mono dark:text-white">{rate}%</span>
                </div>
              </div>
            )}

            {/* Amortization Schedule heading */}
            <div className="mt-6">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-3">Tabel Amortisasi Penyusutan</span>
              
              <div className="overflow-x-auto border border-slate-100 dark:border-slate-800 rounded-xl">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-950/50 border-b border-slate-100 dark:border-slate-800 font-bold text-slate-500 dark:text-slate-400">
                      <th className="p-3">Tahun</th>
                      <th className="p-3">Nilai Buku Awal</th>
                      <th className="p-3">Beban Penyusutan</th>
                      <th className="p-3">Akumulasi Penyusutan</th>
                      <th className="p-3">Nilai Buku Akhir</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                    {deprSchedule.map((row) => (
                      <tr key={row.year} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20">
                        <td className="p-3 font-semibold dark:text-slate-200">Tahun {row.year}</td>
                        <td className="p-3 font-mono">{formatRupiah(row.beginningBookValue)}</td>
                        <td className="p-3 font-mono text-amber-600 font-medium">{formatRupiah(row.depreciationExpense)}</td>
                        <td className="p-3 font-mono">{formatRupiah(row.accumulatedDepreciation)}</td>
                        <td className="p-3 font-mono font-bold text-slate-800 dark:text-slate-100">{formatRupiah(row.endingBookValue)}</td>
                      </tr>
                    ))}
                    {deprSchedule.length === 0 && (
                      <tr>
                        <td colSpan={5} className="p-4 text-center text-slate-400">Silakan masukkan umur ekonomis yang valid</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================
            TAB 4: KALKULATOR BUNGA
            ====================================================== */}
        {activeSubTab === 'interest' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-150 dark:border-slate-800">
              <div>
                <label className="text-xs font-bold text-slate-500 block mb-1">Modal Pokok (Principal)</label>
                <input
                  type="number"
                  value={principal}
                  onChange={(e) => setPrincipal(Number(e.target.value))}
                  className="w-full text-xs p-2.5 border border-slate-200 dark:border-slate-800 dark:bg-slate-900 rounded-lg dark:text-white"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 block mb-1">Suku Bunga Tahunan (%)</label>
                <input
                  type="number"
                  value={interestRate}
                  onChange={(e) => setInterestRate(Number(e.target.value))}
                  className="w-full text-xs p-2.5 border border-slate-200 dark:border-slate-800 dark:bg-slate-900 rounded-lg dark:text-white"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 block mb-1">Jangka Waktu (Tahun)</label>
                <input
                  type="number"
                  value={timePeriod}
                  onChange={(e) => setTimePeriod(Number(e.target.value))}
                  className="w-full text-xs p-2.5 border border-slate-200 dark:border-slate-800 dark:bg-slate-900 rounded-lg dark:text-white"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 block mb-1">Frekuensi Bunga Majemuk</label>
                <select
                  value={compoundsPerYear}
                  onChange={(e) => setCompoundsPerYear(Number(e.target.value))}
                  className="w-full text-xs p-2.5 border border-slate-200 dark:border-slate-800 dark:bg-slate-900 rounded-lg dark:text-white"
                >
                  <option value={1}>Tahunan (1x/tahun)</option>
                  <option value={2}>Semesteran (2x/tahun)</option>
                  <option value={4}>Triwulanan (4x/tahun)</option>
                  <option value={12}>Bulanan (12x/tahun)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Simple Interest card */}
              <div className="border border-slate-100 dark:border-slate-800 rounded-xl p-5 bg-white dark:bg-slate-950 shadow-sm text-center">
                <span className="font-bold text-xs text-blue-600 uppercase tracking-widest block mb-2">Bunga Sederhana (Simple Interest)</span>
                <span className="text-[10px] text-slate-400 block mb-4">I = P x r x t</span>
                
                <div className="text-2xl font-black text-slate-800 dark:text-white">{formatRupiah(simpleInterestResult.totalAmount)}</div>
                <span className="text-[10px] text-slate-400 block mt-1">Nilai Akhir (Pokok + Bunga)</span>

                <div className="mt-4 p-2 bg-slate-50 dark:bg-slate-900/60 rounded-lg text-xs font-mono flex justify-between">
                  <span className="text-slate-500">Nilai Bunga:</span>
                  <span className="font-bold text-blue-600 dark:text-blue-400">{formatRupiah(simpleInterestResult.interest)}</span>
                </div>
              </div>

              {/* Compound Interest card */}
              <div className="border border-slate-100 dark:border-slate-800 rounded-xl p-5 bg-white dark:bg-slate-950 shadow-sm text-center">
                <span className="font-bold text-xs text-teal-600 uppercase tracking-widest block mb-2">Bunga Majemuk (Compound Interest)</span>
                <span className="text-[10px] text-slate-400 block mb-4">FV = P x (1 + r/n)^(n x t)</span>

                {compoundInterestRows.length > 0 ? (
                  <>
                    <div className="text-2xl font-black text-slate-800 dark:text-white">
                      {formatRupiah(compoundInterestRows[compoundInterestRows.length - 1].endingBalance)}
                    </div>
                    <span className="text-[10px] text-slate-400 block mt-1">Nilai Masa Depan (Future Value)</span>

                    <div className="mt-4 p-2 bg-slate-50 dark:bg-slate-900/60 rounded-lg text-xs font-mono flex justify-between">
                      <span className="text-slate-500">Akumulasi Bunga:</span>
                      <span className="font-bold text-teal-600 dark:text-teal-400">
                        {formatRupiah(compoundInterestRows[compoundInterestRows.length - 1].endingBalance - principal)}
                      </span>
                    </div>
                  </>
                ) : (
                  <span className="text-slate-400 text-xs">Silakan perbaiki data di atas</span>
                )}
              </div>

              {/* Present Value card */}
              <div className="border border-slate-100 dark:border-slate-800 rounded-xl p-5 bg-white dark:bg-slate-950 shadow-sm text-center">
                <span className="font-bold text-xs text-indigo-600 uppercase tracking-widest block mb-2">Nilai Sekarang (Present Value - PV)</span>
                <span className="text-[10px] text-slate-400 block mb-4">PV = FV / (1 + r)^t</span>

                <div className="text-2xl font-black text-slate-800 dark:text-white">{formatRupiah(presentValueResult)}</div>
                <span className="text-[10px] text-slate-400 block mt-1">Nilai hari ini jika menerima uang di masa depan</span>

                <div className="mt-4 p-2 bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-950/40 rounded-lg text-xs text-indigo-700 dark:text-indigo-400 leading-relaxed text-left">
                  Membantu analisis kelayakan modal dan pendanaan sesuai SAK EP 2025.
                </div>
              </div>
            </div>

            {/* List compound rows if period <= 12 */}
            {compoundInterestRows.length > 0 && compoundInterestRows.length <= 12 && (
              <div>
                <span className="text-xs font-bold text-slate-400 block mb-2">Transparansi Bunga Majemuk Per Periode</span>
                <div className="max-h-60 overflow-y-auto border border-slate-100 dark:border-slate-800 rounded-xl">
                  <table className="w-full text-left text-[11px] border-collapse">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-950/50 text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800 leading-relaxed">
                        <th className="p-2">Periode bunga</th>
                        <th className="p-2">Saldo Awal</th>
                        <th className="p-2">Bunga Berjalan</th>
                        <th className="p-2">Saldo Akhir</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                      {compoundInterestRows.map((row) => (
                        <tr key={row.period} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10">
                          <td className="p-2 font-sans">Baris ke-{row.period}</td>
                          <td className="p-2">{formatRupiah(row.beginningBalance)}</td>
                          <td className="p-2 text-emerald-600">{formatRupiah(row.interestEarned)}</td>
                          <td className="p-2 text-slate-800 dark:text-slate-200 font-semibold">{formatRupiah(row.endingBalance)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
