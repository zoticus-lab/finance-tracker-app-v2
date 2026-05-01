import { useEffect, useState } from 'react';
import { api } from '../lib/api';

export default function ImportExport({ transactions, categories, onImportSuccess, onClose }) {
  const [activeTab, setActiveTab] = useState('import');
  const [uploading, setUploading] = useState(false);
  const [importStatus, setImportStatus] = useState('');
  const [importError, setImportError] = useState('');
  const [importHistory, setImportHistory] = useState(null);
  const [rolling, setRolling] = useState(false);

  useEffect(() => {
    loadImportHistory();
  }, []);

  const loadImportHistory = async () => {
    try {
      const history = await api.getImportHistory();
      setImportHistory(history);
    } catch (error) {
      console.error('Failed to load import history:', error);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setImportError('');
    setImportStatus('Membaca file...');

    try {
      const text = await file.text();
      const data = JSON.parse(text);

      setImportStatus('Validasi data...');

      // Validate backup format
      if (!data.transactions || !Array.isArray(data.transactions)) {
        throw new Error('Format JSON tidak valid. Field "transactions" tidak ditemukan atau bukan array.');
      }

      // Import transactions
      const response = await api.importTransactions(data);

      const accountMsg = response.accounts ? ` dan ${response.accounts} account` : '';
      setImportStatus(`✅ Berhasil mengimport ${response.imported} transaksi${accountMsg}`);
      setTimeout(() => {
        onImportSuccess?.();
        setImportStatus('');
        setActiveTab('import');
      }, 2000);
    } catch (error) {
      console.error('Import error:', error);
      setImportError(error.message || 'Gagal mengimport file');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleExport = async () => {
    try {
      setImportStatus('Membuat file backup...');

      const exportData = {
        meta: {
          format: 'uang-backup-v1',
          exported_at: new Date().toISOString(),
          exported_from: 'Personal Finance Tracker v1',
        },
        categories,
        transactions,
      };

      const json = JSON.stringify(exportData, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `finance-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setImportStatus('✅ File backup berhasil diunduh');
      setTimeout(() => setImportStatus(''), 2000);
    } catch (error) {
      console.error('Export error:', error);
      setImportError('Gagal membuat backup file');
    }
  };

  const handleRollback = async () => {
    const confirmed = window.confirm('Yakin ingin rollback import terakhir? Semua transaksi yang diimport akan dihapus.');
    if (!confirmed) return;

    setRolling(true);
    setImportError('');
    setImportStatus('Melakukan rollback...');

    try {
      const response = await api.rollbackImport();
      setImportStatus(`✅ ${response.message}`);
      await loadImportHistory();
      setTimeout(() => {
        onImportSuccess?.();
        setImportStatus('');
      }, 2000);
    } catch (error) {
      console.error('Rollback error:', error);
      setImportError(error.message || 'Gagal rollback import');
    } finally {
      setRolling(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-emerald-600 to-emerald-700 px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-bold text-white">Import & Export</h2>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 rounded-lg p-2 transition"
          >
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200">
          <button
            onClick={() => setActiveTab('import')}
            className={`flex-1 px-4 py-3 font-semibold transition ${
              activeTab === 'import'
                ? 'text-emerald-600 border-b-2 border-emerald-600'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Import Data
          </button>
          <button
            onClick={() => setActiveTab('export')}
            className={`flex-1 px-4 py-3 font-semibold transition ${
              activeTab === 'export'
                ? 'text-emerald-600 border-b-2 border-emerald-600'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Export Data
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Import Tab */}
          {activeTab === 'import' && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
                <p className="text-sm text-blue-900 font-semibold mb-2">ℹ️ Format File</p>
                <p className="text-sm text-blue-800">
                  Diterima file JSON dari aplikasi Uang atau finance tracker lainnya dengan struktur yang sama.
                </p>
              </div>

              <div className="bg-gradient-to-br from-slate-50 to-slate-100 border-2 border-dashed border-emerald-300 rounded-2xl p-8 text-center cursor-pointer hover:border-emerald-500 hover:bg-slate-100/50 transition"
                onClick={() => document.getElementById('file-input').click()}
              >
                <div className="text-4xl mb-2">📁</div>
                <p className="font-semibold text-slate-700 mb-1">
                  {uploading ? 'Memproses...' : 'Klik atau drag file JSON'}
                </p>
                <p className="text-sm text-slate-600">
                  File backup dari aplikasi finance
                </p>
                <input
                  id="file-input"
                  type="file"
                  accept=".json"
                  onChange={handleFileUpload}
                  disabled={uploading}
                  className="hidden"
                />
              </div>

              {importStatus && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4">
                  <p className="text-sm text-emerald-900">{importStatus}</p>
                </div>
              )}

              {importError && (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
                  <p className="text-sm text-red-900 font-semibold">❌ Error</p>
                  <p className="text-sm text-red-800">{importError}</p>
                </div>
              )}

              {importHistory?.hasImport && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 space-y-3">
                  <div>
                    <p className="text-sm font-semibold text-amber-900">⏮️ Import Terakhir</p>
                    <p className="text-sm text-amber-800 mt-1">
                      {importHistory.lastImport.count} transaksi diimport pada {new Date(importHistory.lastImport.timestamp).toLocaleString('id-ID')}
                    </p>
                  </div>
                  <button
                    onClick={handleRollback}
                    disabled={rolling}
                    className="w-full bg-amber-500 hover:bg-amber-600 disabled:bg-amber-300 text-white font-semibold py-2 rounded-lg transition transform hover:scale-105 active:scale-95"
                  >
                    {rolling ? 'Rollback...' : '↩️ Rollback Import'}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Export Tab */}
          {activeTab === 'export' && (
            <div className="space-y-4">
              <div className="bg-slate-50 rounded-2xl p-4 space-y-2">
                <p className="text-sm font-semibold text-slate-700">📊 Data yang akan diexport:</p>
                <ul className="text-sm text-slate-600 space-y-1 ml-2">
                  <li>✓ {transactions?.length || 0} Transaksi</li>
                  <li>✓ {categories?.length || 0} Kategori</li>
                  <li>✓ Metadata (waktu export, format)</li>
                </ul>
              </div>

              <button
                onClick={handleExport}
                className="w-full bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-semibold py-3 rounded-2xl transition transform hover:scale-105 active:scale-95"
              >
                💾 Download Backup JSON
              </button>

              {importStatus && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4">
                  <p className="text-sm text-emerald-900">{importStatus}</p>
                </div>
              )}

              {importError && (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
                  <p className="text-sm text-red-900 font-semibold">❌ Error</p>
                  <p className="text-sm text-red-800">{importError}</p>
                </div>
              )}

              <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 text-sm text-yellow-900">
                <p className="font-semibold mb-1">⚠️ Tips</p>
                <p>Simpan backup file di tempat aman untuk mencegah kehilangan data.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
