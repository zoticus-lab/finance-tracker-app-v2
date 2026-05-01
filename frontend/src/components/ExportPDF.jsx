import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';

const ExportPDF = ({ transactions, accounts, isOpen, onClose }) => {
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [allMonths, setAllMonths] = useState(false);
  const [previewData, setPreviewData] = useState([]);
  const [loading, setLoading] = useState(false);

  // Generate preview
  useEffect(() => {
    if (!isOpen) return;

    // Check if filtering by month
    const isFiltering = !allMonths;

    // Calculate running balance from ALL transactions (from beginning)
    const allSorted = [...transactions].sort(
      (a, b) => new Date(a.transactionDate) - new Date(b.transactionDate)
    );

    let balance = 0;
    let startingBalanceForFilter = 0;
    const allWithBalance = allSorted.map((t) => {
      // Before applying this transaction, capture the starting balance for the filtered period
      if (isFiltering) {
        const [txYear, txMonth] = t.transactionDate.split('-').map(Number);
        if (txMonth === month && txYear === year && startingBalanceForFilter === 0) {
          startingBalanceForFilter = balance;
        }
      }

      if (t.type === 'income') {
        balance += t.amount;
      } else if (t.type === 'expense') {
        balance -= t.amount;
      }
      return { ...t, balance };
    });

    // Now filter by month/year if specified (keeping the balance from all transactions)
    let filtered = allWithBalance;
    if (isFiltering) {
      filtered = allWithBalance.filter((t) => {
        const [txYear, txMonth] = t.transactionDate.split('-').map(Number);
        return txMonth === month && txYear === year;
      });
    }

    setPreviewData(filtered);
  }, [isOpen, month, year, allMonths, transactions]);

  const handleExportPDF = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (!allMonths) {
        params.append('month', month);
        params.append('year', year);
      } else {
        params.append('allMonths', 'true');
      }

      // Fetch PDF and trigger download
      const response = await api.get(`/api/transactions/export-pdf?${params}`, {
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(response);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `laporan-keuangan-${month}-${year}.pdf`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      onClose();
    } catch (error) {
      console.error('Error exporting PDF:', error);
      alert('Gagal mengunduh PDF');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 10 }, (_, i) => currentYear - i);

  const totalBalance = accounts.reduce((sum, acc) => sum + (acc.balance || 0), 0);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white p-6">
          <h2 className="text-2xl font-bold mb-2">📄 Export Laporan PDF</h2>
          <p className="text-emerald-100">Pratinjau dan download laporan transaksi Anda</p>
        </div>

        {/* Controls */}
        <div className="border-b p-4 bg-gray-50 flex flex-wrap gap-4 items-center">
          {/* Month/Year Selector */}
          <div className="flex gap-3 items-center flex-wrap">
            <label className="font-semibold text-sm text-gray-700">Periode:</label>
            <select
              value={allMonths ? 'all' : month}
              onChange={(e) => {
                if (e.target.value === 'all') {
                  setAllMonths(true);
                } else {
                  setAllMonths(false);
                  setMonth(Number(e.target.value));
                }
              }}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">Semua Bulan</option>
              {monthNames.map((m, i) => (
                <option key={i} value={i + 1}>
                  {m}
                </option>
              ))}
            </select>

            {!allMonths && (
              <select
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Export Button */}
          <button
            onClick={handleExportPDF}
            disabled={loading}
            className="ml-auto px-6 py-2 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 disabled:opacity-50 transition"
          >
            {loading ? '⏳ Mengunduh...' : '📥 Download PDF'}
          </button>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg transition"
          >
            ✕
          </button>
        </div>

        {/* Preview Table */}
        <div className="flex-1 overflow-auto p-4">
          {previewData.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p className="text-lg">Tidak ada transaksi untuk periode ini</p>
            </div>
          ) : (
            <div>
              {/* Account Summary */}
              <div className="bg-blue-50 rounded-lg p-4 mb-4 border border-blue-200">
                <h3 className="font-bold text-blue-900 mb-3">💰 Ringkasan Akun</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {accounts.map((acc) => (
                    <div key={acc.id} className="text-sm">
                      <p className="text-gray-600">{acc.name}</p>
                      <p className="font-bold text-blue-700">
                        Rp {acc.balance?.toLocaleString('id-ID') || 0}
                      </p>
                    </div>
                  ))}
                  <div className="text-sm border-l-2 border-blue-300 pl-3">
                    <p className="text-gray-600">Total Saldo</p>
                    <p className="font-bold text-blue-900">
                      Rp {totalBalance?.toLocaleString('id-ID') || 0}
                    </p>
                  </div>
                </div>
              </div>

              {/* Transaction Table */}
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-200 border-b">
                    <tr className="text-xs font-bold text-gray-700">
                      <th className="px-3 py-2 text-left whitespace-nowrap">Tanggal</th>
                      <th className="px-3 py-2 text-left">Deskripsi</th>
                      <th className="px-3 py-2 text-left whitespace-nowrap">Kategori</th>
                      <th className="px-3 py-2 text-left whitespace-nowrap">Akun</th>
                      <th className="px-3 py-2 text-right whitespace-nowrap">Keluar</th>
                      <th className="px-3 py-2 text-right whitespace-nowrap">Masuk</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {previewData.map((t, idx) => {
                      const isExpense = t.type === 'expense';
                      const isIncome = t.type === 'income';
                      return (
                        <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="px-3 py-2 whitespace-nowrap text-gray-600">
                            {new Date(t.transactionDate).toLocaleDateString('id-ID')}
                          </td>
                          <td className="px-3 py-2 text-gray-700 truncate max-w-xs">
                            {t.description || 'Tanpa deskripsi'}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap">
                            <span className="text-xs px-2 py-1 rounded-full inline-block" 
                              style={{ backgroundColor: t.categoryColor + '20', color: t.categoryColor }}>
                              {t.categoryName}
                            </span>
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap text-gray-600 text-xs">
                            {t.categoryType === 'transfer' 
                              ? 'Transfer'
                              : (accounts.find(a => a.id === t.fromAccountId)?.name || 'Unknown')}
                          </td>
                          <td className="px-3 py-2 text-right font-mono text-red-600">
                            {isExpense ? `Rp ${t.amount?.toLocaleString('id-ID') || 0}` : '—'}
                          </td>
                          <td className="px-3 py-2 text-right font-mono text-green-600">
                            {isIncome ? `Rp ${t.amount?.toLocaleString('id-ID') || 0}` : '—'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Summary Footer */}
              <div className="mt-4 p-3 bg-gray-100 rounded-lg flex justify-between items-center text-sm">
                <span className="font-semibold text-gray-700">
                  Total Transaksi: {previewData.length}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExportPDF;
