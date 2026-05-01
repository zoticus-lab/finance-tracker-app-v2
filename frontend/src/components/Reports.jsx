import { useState, useEffect } from 'react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { Download } from 'lucide-react';
import { api } from '../lib/api';

export default function Reports() {
  const [reportData, setReportData] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('summary');
  const [filterType, setFilterType] = useState('all'); // all, income, expense
  const [filterMonth, setFilterMonth] = useState('all'); // all atau yyyy-mm

  useEffect(() => {
    loadReports();
    loadTransactions();
  }, []);

  const loadReports = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.get('/api/reports');
      setReportData(data);
      setLoading(false);
    } catch (err) {
      setError(err.message || 'Failed to load reports');
      setLoading(false);
    }
  };

  const loadTransactions = async () => {
    try {
      const [txData, loansData] = await Promise.all([
        api.get('/api/transactions'),
        api.get('/api/loans')
      ]);
      const allTransactions = [
        ...(txData.transactions || []),
        ...(loansData.loanTransactions || [])
      ];
      // Sort by date descending
      allTransactions.sort((a, b) => new Date(b.transactionDate) - new Date(a.transactionDate));
      setTransactions(allTransactions);
    } catch (err) {
      console.error('Failed to load transactions:', err);
    }
  };

  const formatRupiah = (num) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(num);
  };

  const downloadCSV = (data, filename) => {
    const csv = convertToCSV(data);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
  };

  const convertToCSV = (data) => {
    let csv = '';
    if (Array.isArray(data)) {
      if (data.length === 0) return csv;
      csv = Object.keys(data[0]).join(',') + '\n';
      data.forEach(row => {
        csv += Object.values(row).join(',') + '\n';
      });
    } else {
      Object.entries(data).forEach(([key, value]) => {
        csv += `${key},${value}\n`;
      });
    }
    return csv;
  };

  // Filter transactions berdasarkan type dan month
  const getFilteredTransactions = () => {
    return transactions.filter(t => {
      // Filter by type
      if (filterType !== 'all') {
        if (t.type !== filterType) {
          return false;
        }
      }

      // Filter by month
      if (filterMonth !== 'all') {
        const txMonth = t.transactionDate.substring(0, 7); // YYYY-MM
        if (txMonth !== filterMonth) {
          return false;
        }
      }

      return true;
    });
  };

  // Get unique months for filter dropdown
  const getAvailableMonths = () => {
    const months = new Set();
    transactions.forEach(t => {
      const month = t.transactionDate.substring(0, 7);
      months.add(month);
    });
    return Array.from(months).sort().reverse();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-slate-600 text-lg">Loading reports...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-600 text-lg">❌ {error}</div>
      </div>
    );
  }

  const { monthlySummary, categoryBreakdown, budgetCapacity, spendingTrend } = reportData || {};

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-slate-900 mb-2">📊 Laporan Keuangan</h1>
        <p className="text-slate-500">
          {monthlySummary?.monthName} {monthlySummary?.year}
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
        {[
          { id: 'summary', label: '📈 Summary', icon: '📈' },
          { id: 'budget', label: '💰 Budget Capacity', icon: '💰' },
          { id: 'category', label: '🥧 Category Breakdown', icon: '🥧' },
          { id: 'trend', label: '📊 Spending Trend', icon: '📊' },
          { id: 'transactions', label: '🗂️ Semua Transaksi', icon: '🗂️' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-6 py-3 rounded-lg font-medium transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-emerald-600 text-white shadow-lg'
                : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ===== 1. MONTHLY SUMMARY ===== */}
      {activeTab === 'summary' && monthlySummary && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Total Income */}
            <div className="rounded-3xl border border-white/30 bg-white/70 p-6 shadow-glass backdrop-blur-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-600 text-sm mb-1">Total Pemasukan</p>
                  <p className="text-3xl font-bold text-emerald-600">
                    {formatRupiah(monthlySummary.income)}
                  </p>
                </div>
                <div className="text-4xl">📈</div>
              </div>
            </div>

            {/* Total Expense */}
            <div className="rounded-3xl border border-white/30 bg-white/70 p-6 shadow-glass backdrop-blur-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-600 text-sm mb-1">Total Pengeluaran</p>
                  <p className="text-3xl font-bold text-red-600">
                    {formatRupiah(monthlySummary.expense)}
                  </p>
                </div>
                <div className="text-4xl">📉</div>
              </div>
            </div>

            {/* Balance */}
            <div className="rounded-3xl border border-white/30 bg-white/70 p-6 shadow-glass backdrop-blur-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-600 text-sm mb-1">Sisa/Tabungan</p>
                  <p className={`text-3xl font-bold ${monthlySummary.balance >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                    {formatRupiah(monthlySummary.balance)}
                  </p>
                </div>
                <div className="text-4xl">💰</div>
              </div>
            </div>
          </div>

          {/* Export Button */}
          <button
            onClick={() => {
              const data = {
                'Bulan': monthlySummary.monthName,
                'Tahun': monthlySummary.year,
                'Total Pemasukan': monthlySummary.income,
                'Total Pengeluaran': monthlySummary.expense,
                'Sisa': monthlySummary.balance,
              };
              downloadCSV([data], `monthly-summary-${monthlySummary.month}-${monthlySummary.year}.csv`);
            }}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg transition"
          >
            <Download size={18} />
            Download CSV
          </button>
        </div>
      )}

      {/* ===== 2. BUDGET CAPACITY ===== */}
      {activeTab === 'budget' && budgetCapacity && (
        <div className="space-y-6">
          {/* Analysis */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Left side - Income & Costs */}
            <div className="rounded-3xl border border-white/30 bg-white/70 p-6 shadow-glass backdrop-blur-md">
              <h3 className="text-xl font-bold text-slate-900 mb-4">📊 Analisis Keuangan</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                  <span className="text-slate-600">Rata-rata Pemasukan</span>
                  <span className="text-emerald-600 font-bold">{formatRupiah(budgetCapacity.avgIncome)}</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                  <span className="text-slate-600">Biaya Tetap (Fixed)</span>
                  <span className="text-red-600 font-bold">{formatRupiah(budgetCapacity.fixedCost)}</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                  <span className="text-slate-600">Biaya Rutin</span>
                  <span className="text-orange-600 font-bold">{formatRupiah(budgetCapacity.routineCost)}</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                  <span className="text-slate-600">Biaya Diskresioner</span>
                  <span className="text-yellow-600 font-bold">{formatRupiah(budgetCapacity.discretionaryCost)}</span>
                </div>
              </div>
            </div>

            {/* Right side - Recommendations */}
            <div className="space-y-4">
              {/* Available for Spending */}
              <div className="rounded-3xl border border-white/30 bg-white/70 p-6 shadow-glass backdrop-blur-md">
                <p className="text-slate-600 text-sm mb-2">💪 Tersedia untuk Belanja</p>
                <p className="text-3xl font-bold text-blue-600">
                  {formatRupiah(budgetCapacity.availableForSpending)}
                </p>
                <p className="text-xs text-slate-500 mt-2">Setelah biaya tetap & rutin</p>
              </div>

              {/* Recommended Savings */}
              <div className="rounded-3xl border border-white/30 bg-white/70 p-6 shadow-glass backdrop-blur-md">
                <p className="text-slate-600 text-sm mb-2">🏦 Disarankan Tabung (20%)</p>
                <p className="text-2xl font-bold text-emerald-600">
                  {formatRupiah(budgetCapacity.recommendedSavings)}
                </p>
              </div>

              {/* Safe to Spend */}
              <div className="rounded-3xl border border-white/30 bg-white/70 p-6 shadow-glass backdrop-blur-md">
                <p className="text-slate-600 text-sm mb-2">✅ AMAN DIHABISKAN (80%)</p>
                <p className="text-2xl font-bold text-purple-600">
                  {formatRupiah(budgetCapacity.safeToSpend)}
                </p>
              </div>
            </div>
          </div>

          {/* Budget Breakdown Chart */}
          <div className="rounded-3xl border border-white/30 bg-white/70 p-6 shadow-glass backdrop-blur-md">
            <h3 className="text-lg font-bold text-slate-900 mb-4">💹 Breakdown Biaya</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={[
                    { name: 'Fixed Cost', value: budgetCapacity.fixedCost },
                    { name: 'Routine Cost', value: budgetCapacity.routineCost },
                    { name: 'Discretionary', value: budgetCapacity.discretionaryCost },
                  ]}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  <Cell fill="#EF4444" />
                  <Cell fill="#F59E0B" />
                  <Cell fill="#FBBF24" />
                </Pie>
                <Tooltip formatter={(value) => formatRupiah(value)} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Export Button */}
          <button
            onClick={() => {
              const data = {
                'Rata-rata Pemasukan': budgetCapacity.avgIncome,
                'Biaya Tetap': budgetCapacity.fixedCost,
                'Biaya Rutin': budgetCapacity.routineCost,
                'Biaya Diskresioner': budgetCapacity.discretionaryCost,
                'Total Pengeluaran': budgetCapacity.totalExpense,
                'Tersedia untuk Belanja': budgetCapacity.availableForSpending,
                'Disarankan Tabung': budgetCapacity.recommendedSavings,
                'Aman Dihabiskan': budgetCapacity.safeToSpend,
              };
              downloadCSV([data], 'budget-capacity.csv');
            }}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg transition"
          >
            <Download size={18} />
            Download CSV
          </button>
        </div>
      )}

      {/* ===== 3. CATEGORY BREAKDOWN ===== */}
      {activeTab === 'category' && categoryBreakdown && (
        <div className="space-y-6">
          {/* Income Categories */}
          <div className="rounded-3xl border border-white/30 bg-white/70 p-6 shadow-glass backdrop-blur-md">
            <h3 className="text-lg font-bold text-slate-900 mb-4">📈 Pemasukan per Kategori</h3>
            <div className="space-y-2">
              {categoryBreakdown.income.length > 0 ? (
                categoryBreakdown.income.map((cat, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-slate-100 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: cat.color }}
                      ></div>
                      <span className="text-slate-700">{cat.name}</span>
                    </div>
                    <span className="text-emerald-600 font-bold">{formatRupiah(cat.amount)}</span>
                  </div>
                ))
              ) : (
                <p className="text-slate-500">Tidak ada pemasukan bulan ini</p>
              )}
            </div>
          </div>

          {/* Expense Categories */}
          <div className="rounded-3xl border border-white/30 bg-white/70 p-6 shadow-glass backdrop-blur-md">
            <h3 className="text-lg font-bold text-slate-900 mb-4">📉 Pengeluaran per Kategori</h3>
            <div className="space-y-2">
              {categoryBreakdown.expense.length > 0 ? (
                categoryBreakdown.expense.map((cat, idx) => {
                  const total = categoryBreakdown.expense.reduce((sum, c) => sum + c.amount, 0);
                  const percentage = total > 0 ? (cat.amount / total * 100) : 0;
                  return (
                    <div key={idx} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: cat.color }}
                          ></div>
                          <span className="text-slate-700">{cat.name}</span>
                        </div>
                        <span className="text-red-600 font-bold">{formatRupiah(cat.amount)}</span>
                      </div>
                      <div className="h-2 bg-slate-200 rounded-full overflow-hidden ml-6">
                        <div
                          className="h-full transition-all"
                          style={{ width: `${percentage}%`, backgroundColor: cat.color }}
                        ></div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-slate-500">Tidak ada pengeluaran bulan ini</p>
              )}
            </div>
          </div>

          {/* Pie Chart */}
          <div className="rounded-3xl border border-white/30 bg-white/70 p-6 shadow-glass backdrop-blur-md">
            <h3 className="text-lg font-bold text-slate-900 mb-4">🥧 Visualisasi Pengeluaran</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryBreakdown.expense}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name} ${formatRupiah(value)}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="amount"
                >
                  {categoryBreakdown.expense.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatRupiah(value)} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Export Button */}
          <button
            onClick={() => {
              const data = [
                ...categoryBreakdown.expense.map(cat => ({
                  'Kategori': cat.name,
                  'Tipe': 'Pengeluaran',
                  'Jumlah': cat.amount
                })),
                ...categoryBreakdown.income.map(cat => ({
                  'Kategori': cat.name,
                  'Tipe': 'Pemasukan',
                  'Jumlah': cat.amount
                }))
              ];
              downloadCSV(data, 'category-breakdown.csv');
            }}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg transition"
          >
            <Download size={18} />
            Download CSV
          </button>
        </div>
      )}

      {/* ===== 4. SPENDING TREND (12 Months) ===== */}
      {activeTab === 'trend' && spendingTrend && (
        <div className="space-y-6">
          {/* Chart */}
          <div className="rounded-3xl border border-white/30 bg-white/70 p-6 shadow-glass backdrop-blur-md">
            <h3 className="text-lg font-bold text-slate-900 mb-4">📈 12 Bulan Terakhir</h3>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={spendingTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="monthName" stroke="#64748B" />
                <YAxis stroke="#64748B" />
                <Tooltip 
                  formatter={(value) => formatRupiah(value)}
                  contentStyle={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px' }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="income"
                  stroke="#10B981"
                  strokeWidth={2}
                  dot={{ fill: '#10B981', r: 4 }}
                  activeDot={{ r: 6 }}
                  name="Pemasukan"
                />
                <Line
                  type="monotone"
                  dataKey="expense"
                  stroke="#EF4444"
                  strokeWidth={2}
                  dot={{ fill: '#EF4444', r: 4 }}
                  activeDot={{ r: 6 }}
                  name="Pengeluaran"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Table */}
          <div className="rounded-3xl border border-white/30 bg-white/70 p-6 shadow-glass backdrop-blur-md overflow-x-auto">
            <h3 className="text-lg font-bold text-slate-900 mb-4">📊 Detail Bulanan</h3>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 px-4 text-slate-700 font-semibold">Bulan</th>
                  <th className="text-right py-3 px-4 text-slate-700 font-semibold">Pemasukan</th>
                  <th className="text-right py-3 px-4 text-slate-700 font-semibold">Pengeluaran</th>
                  <th className="text-right py-3 px-4 text-slate-700 font-semibold">Sisa</th>
                </tr>
              </thead>
              <tbody>
                {spendingTrend.map((item, idx) => {
                  const balance = item.income - item.expense;
                  return (
                    <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-3 px-4 text-slate-700">
                        {item.monthName} {item.year}
                      </td>
                      <td className="text-right py-3 px-4 text-emerald-600 font-semibold">
                        {formatRupiah(item.income)}
                      </td>
                      <td className="text-right py-3 px-4 text-red-600 font-semibold">
                        {formatRupiah(item.expense)}
                      </td>
                      <td className={`text-right py-3 px-4 font-semibold ${balance >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                        {formatRupiah(balance)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Export Button */}
          <button
            onClick={() => {
              const data = spendingTrend.map(item => ({
                'Bulan': `${item.monthName} ${item.year}`,
                'Pemasukan': item.income,
                'Pengeluaran': item.expense,
                'Sisa': item.income - item.expense
              }));
              downloadCSV(data, 'spending-trend-12months.csv');
            }}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg transition"
          >
            <Download size={18} />
            Download CSV
          </button>
        </div>
      )}

      {/* ===== 5. SEMUA TRANSAKSI ===== */}
      {activeTab === 'transactions' && (
        <div className="space-y-6">
          {/* Filter Controls */}
          <div className="rounded-3xl border border-white/30 bg-white/70 p-6 shadow-glass backdrop-blur-md">
            <h3 className="text-lg font-bold text-slate-900 mb-4">🔍 Filter Transaksi</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Type Filter */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Tipe Transaksi</label>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="all">Semua</option>
                  <option value="income">Pemasukan</option>
                  <option value="expense">Pengeluaran</option>
                </select>
              </div>

              {/* Month Filter */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Bulan</label>
                <select
                  value={filterMonth}
                  onChange={(e) => setFilterMonth(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="all">Semua Bulan</option>
                  {getAvailableMonths().map(month => (
                    <option key={month} value={month}>{month}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Transactions Table */}
          <div className="rounded-3xl border border-white/30 bg-white/70 p-6 shadow-glass backdrop-blur-md overflow-x-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-900">
                📋 Transaksi ({getFilteredTransactions().length})
              </h3>
              <button
                onClick={() => {
                  const data = getFilteredTransactions().map(t => ({
                    'Tanggal': t.transactionDate,
                    'Kategori': t.categoryName,
                    'Tipe': t.type === 'income' ? 'Pemasukan' : t.type === 'expense' ? 'Pengeluaran' : t.type === 'loan' ? 'Pinjaman' : 'Transfer',
                    'Jumlah': t.amount,
                    'Deskripsi': t.description,
                  }));
                  downloadCSV(data, 'transaksi-semua.csv');
                }}
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg transition text-sm"
              >
                <Download size={16} />
                Download CSV
              </button>
            </div>

            {getFilteredTransactions().length > 0 ? (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-3 px-4 text-slate-700 font-semibold">Tanggal</th>
                    <th className="text-left py-3 px-4 text-slate-700 font-semibold">Kategori</th>
                    <th className="text-left py-3 px-4 text-slate-700 font-semibold">Tipe</th>
                    <th className="text-right py-3 px-4 text-slate-700 font-semibold">Jumlah</th>
                    <th className="text-left py-3 px-4 text-slate-700 font-semibold">Deskripsi</th>
                  </tr>
                </thead>
                <tbody>
                  {getFilteredTransactions().map((tx, idx) => (
                    <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-3 px-4 text-slate-700">{tx.transactionDate}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: tx.categoryColor }}
                          ></div>
                          <span className="text-slate-700">{tx.categoryName}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          tx.type === 'income'
                            ? 'bg-emerald-100 text-emerald-700'
                            : tx.type === 'expense'
                            ? 'bg-red-100 text-red-700'
                            : tx.type === 'loan'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}>
                          {tx.type === 'income' ? 'Pemasukan' : tx.type === 'expense' ? 'Pengeluaran' : tx.type === 'loan' ? 'Pinjaman' : 'Transfer'}
                        </span>
                      </td>
                      <td className={`text-right py-3 px-4 font-semibold ${
                        tx.type === 'income' ? 'text-emerald-600' : tx.type === 'transfer' ? 'text-blue-600' : tx.type === 'loan' ? 'text-amber-600' : 'text-red-600'
                      }`}>
                        {tx.type === 'income' ? '+' : tx.type === 'transfer' ? '' : tx.type === 'loan' ? '' : '-'}{formatRupiah(tx.amount)}
                      </td>
                      <td className="py-3 px-4 text-slate-600 max-w-xs truncate">{tx.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="text-center py-12">
                <p className="text-slate-500 text-lg">Tidak ada transaksi yang sesuai dengan filter</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
