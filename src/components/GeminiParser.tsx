import React, { useState } from 'react';
import { Sparkles, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { JournalTransaction, JournalEntryItem } from '../types';

interface GeminiParserProps {
  onTransactionsParsed: (newTransactions: JournalTransaction[]) => void;
  showToast: (message: string, type: 'success' | 'error') => void;
  geminiApiKey: string;
}

export function GeminiParser({ onTransactionsParsed, showToast, geminiApiKey }: GeminiParserProps) {
  const [soalText, setSoalText] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleAnalyze = async () => {
    setErrorMsg(null);

    if (!geminiApiKey || geminiApiKey.trim() === '') {
      setErrorMsg('Masukkan Gemini API key di halaman Settings terlebih dahulu.');
      showToast('API Key belum diisi', 'error');
      return;
    }

    if (!soalText || soalText.trim() === '') {
      setErrorMsg('Ketik atau paste soal cerita akuntansi terlebih dahulu.');
      return;
    }

    setLoading(true);

    try {
      const coaList = `
Standard Chart of Accounts (COA) / Daftar Akun:
101: Kas
102: Bank
103: Piutang Usaha
104: Perlengkapan
105: Persediaan Barang Dagang
106: Sewa Dibayar di Muka
151: Peralatan
152: Akumulasi Penyusutan Peralatan
153: Gedung
154: Akumulasi Penyusutan Gedung
155: Tanah
201: Utang Usaha
202: Utang Gaji
203: Pendapatan Diterima di Muka
251: Utang Bank Jangka Panjang
301: Modal Pemilik
302: Prive Pemilik
303: Ikhtisar Laba Rugi
401: Pendapatan Jasa
402: Pendapatan Penjualan
403: Pendapatan Lain-lain
501: Beban Gaji
502: Beban Sewa
503: Beban Perlengkapan
504: Beban Penyusutan Peralatan
505: Beban Penyusutan Gedung
506: Beban Utilitas (Air/Listrik/Telp)
507: Beban Bunga
508: Beban Administrasi & Umum
509: Beban Pokok Penjualan (HPP)
      `.trim();

      const systemPrompt = `Kamu adalah ahli akuntansi Indonesia kawakan. Analisis soal cerita akuntansi berikut, petakan secara tepat ke Jurnal Umum berpasangan (Double Entry) seimbang, dan ekstrak semua transaksi.
PERSYARATAN UTAMA:
1. Setiap transaksi wajib berpasangan seimbang (Jumlah total nominal posisi 'debit' harus tepat sama dengan total nominal posisi 'kredit').
2. Wajib menggunakan akun-akun dari Daftar Akun Standar berikut secara presisi (cocokkan string nama akun dan kode 3 digitnya):
${coaList}
3. Keterangan ("keterangan") per transaksi harus dibuat sangat singkat dan padat (maksimal 5 kata, contoh: 'Setoran modal awal', 'Beli perlengkapan', 'Penyusutan peralatan', dll.) agar menghemat token dan respons cepat.
4. Tanggal harus ditulis dalam format "YYYY-MM-DD" sesuai tahun soal cerita. Jika tanggal hanya angka, gunakan tahun 2025 (misal 'Tanggal 3' menjadi '2025-01-03').

Format respons wajib berupa JSON utuh (tanpa penjelasan diluar JSON) seperti berikut:
{
  "transaksi": [
    {
      "tanggal": "2025-01-01",
      "keterangan": "Deskripsi singkat",
      "entri": [
        {
          "akun": "Nama Akun",
          "kode": "Kode Akun",
          "posisi": "debit",
          "nominal": 1000000
        },
        {
          "akun": "Nama Akun Kedua",
          "kode": "Kode Akun Kedua",
          "posisi": "kredit",
          "nominal": 1000000
        }
      ]
    }
  ]
}

Soal Cerita:`;
      const fullPrompt = `${systemPrompt}\n\n${soalText}`;

      const requestBody = {
        contents: [{
          role: 'user',
          parts: [{ text: fullPrompt }]
        }],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 8192,
          responseMimeType: 'application/json'
        }
      };

      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${encodeURIComponent(geminiApiKey)}`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        let errText = '';
        try {
          const errData = await response.json();
          errText = errData?.error?.message || response.statusText;
        } catch {
          errText = `HTTP error ${response.status}`;
        }
        throw new Error(errText);
      }

      const data = await response.json();
      
      let rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawText) {
        throw new Error('Respons kosong atau format tidak sesuai. Pastikan API key benar.');
      }

      // Cleanup formatting in case markdown or extra text wraps the JSON response
      rawText = rawText.trim();
      
      // Helper function to extract correct JSON boundaries if conversational wrap occurred
      const extractJsonString = (str: string): string => {
        const start = str.indexOf('{');
        const end = str.lastIndexOf('}');
        if (start !== -1 && end !== -1 && end > start) {
          return str.substring(start, end + 1);
        }
        return str;
      };

      const cleanJsonString = extractJsonString(rawText);
      const parsedJSON = JSON.parse(cleanJsonString);

      if (!parsedJSON.transaksi || !Array.isArray(parsedJSON.transaksi)) {
        throw new Error('Format JSON hasil analisis tidak valid. Harap ulangi.');
      }

      const mappedTransactions: JournalTransaction[] = parsedJSON.transaksi.map((tx: any, idx: number) => {
        const id = `gemini_${Date.now()}_${idx}_${Math.random().toString(36).substr(2, 5)}`;
        const date = tx.tanggal || new Date().toISOString().split('T')[0];
        const refNo = `JR-${Math.floor(100 + Math.random() * 900)}`;
        const description = tx.keterangan || 'Transaksi dari AI';
        
        const entries: JournalEntryItem[] = (tx.entri || []).map((ent: any, eIdx: number) => ({
          id: `${id}_itm_${eIdx}`,
          accountCode: String(ent.kode),
          posisi: (ent.posisi || 'debit').toLowerCase() === 'debit' ? 'debit' : 'kredit',
          nominal: Number(ent.nominal || 0)
        }));

        return {
          id,
          date,
          refNo,
          description,
          entries
        };
      });

      // Filter translations to ensure accounts with entries
      const validTxs = mappedTransactions.filter(t => t.entries.length > 0);

      if (validTxs.length === 0) {
        throw new Error('Tidak ditemukan entri transaksi akuntansi yang valid dalam teks tersebut.');
      }

      onTransactionsParsed(validTxs);
      setSoalText('');
      showToast(`${validTxs.length} entri jurnal berhasil ditambahkan dari soal cerita`, 'success');
    } catch (err: any) {
      console.error(err);
      setErrorMsg(`API gagal: ${err.message || 'Kunci API salah atau kuota terlampaui. Silakan cek ulang.'}`);
      showToast('Gagal memproses soal cerita', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm mb-8 transition-colors duration-200">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/45 rounded-xl text-indigo-600 dark:text-indigo-400">
          <Sparkles className="w-5 h-5 animate-pulse" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-slate-800 dark:text-white">✨ Parser Jurnal Otomatis (Gemini AI)</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Ketik atau paste soal cerita akuntansi untuk menerjemahkan transaksi berpasangan seimbang (debit-kredit) secara instan ke Jurnal Umum SAK EP 2026.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <textarea
          rows={4}
          value={soalText}
          onChange={(e) => setSoalText(e.target.value)}
          placeholder={`Ketik atau paste soal akuntansi di sini...\nContoh:\nPada 1 Januari 2025, Toko Maju membeli peralatan senilai Rp 10.000.000 secara tunai.\nPada 3 Januari 2025, diselesaikan jasa servis AC untuk pelanggan senilai Rp 1.500.000 tunai.`}
          className="w-full p-4 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all font-sans"
          disabled={loading}
        />

        {errorMsg && (
          <div className="flex items-start gap-2.5 p-3.5 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 rounded-xl text-rose-700 dark:text-rose-400 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="text-xs text-slate-400 dark:text-slate-500">
            {!geminiApiKey ? (
              <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" /> API Key belum diatur di Settings.
              </span>
            ) : (
              <span className="text-green-600 dark:text-green-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Gemini API Key siap digunakan.
              </span>
            )}
          </div>

          <button
            onClick={handleAnalyze}
            disabled={loading}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 dark:disabled:bg-indigo-900/40 text-white font-semibold text-sm rounded-xl flex items-center gap-2 shadow-sm transition-all cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Menganalisis Soal Cerita...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Analisis & Masukkan ke Tabel
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
