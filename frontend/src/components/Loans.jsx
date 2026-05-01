import { useState } from 'react';
import { Plus, Trash2, Edit2, X, Check } from 'lucide-react';
import { api } from '../lib/api';

export default function Loans({ loans = [], loanTransactions = [], categories = [], accounts = [], onUpdate, loading }) {
  const [showForm, setShowForm] = useState(false);
  const [formType, setFormType] = useState('hutang'); // 'piutang' or 'hutang'
  const [editingId, setEditingId] = useState(null);
  const [loanTab, setLoanTab] = useState('piutang'); // piutang or hutang
  
  // Hutang loan record form
  const [form, setForm] = useState({
    name: '',
    lenderName: '',
    loanType: 'bank',
    principalAmount: '',
    interestRate: '',
    tenorMonths: '',
    startDate: new Date().toISOString().split('T')[0],
    accountId: '',
    notes: '',
  });

  // Piutang simple transaction form
  const [piutangForm, setPiutangForm] = useState({
    namaOrang: '',
    jumlah: '',
    walletId: '',
    tanggal: new Date().toISOString().split('T')[0],
    deskripsi: '',
  });

  const [showPaymentForm, setShowPaymentForm] = useState(null);
  const [paymentForm, setPaymentForm] = useState({
    paymentDate: new Date().toISOString().split('T')[0],
    principalPaid: '',
    interestPaid: '',
  });

  const buangaCategory = categories.find((c) => c.name === 'Bunga Utang Bank');
  const piutangDiberiCategory = categories.find((c) => c.name === 'Piutang Diberikan');

  const handleAddPiutang = () => {
    setFormType('piutang');
    setPiutangForm({
      namaOrang: '',
      jumlah: '',
      walletId: '',
      tanggal: new Date().toISOString().split('T')[0],
      deskripsi: '',
    });
    setShowForm(true);
  };

  const handleAddHutang = () => {
    setFormType('hutang');
    setEditingId(null);
    setForm({
      name: '',
      lenderName: '',
      loanType: 'bank',
      principalAmount: '',
      interestRate: '',
      tenorMonths: '',
      startDate: new Date().toISOString().split('T')[0],
      accountId: '',
      notes: '',
    });
    setShowForm(true);
  };

  const handleEdit = (loan) => {
    setFormType('hutang');
    setEditingId(loan.id);
    setForm({
      name: loan.name,
      lenderName: loan.lenderName,
      loanType: loan.loanType,
      principalAmount: loan.principalAmount.toString(),
      interestRate: loan.interestRate.toString(),
      tenorMonths: loan.tenorMonths.toString(),
      startDate: loan.startDate,
      notes: loan.notes || '',
    });
    setShowForm(true);
  };

  const handleSubmitPiutang = async (e) => {
    e.preventDefault();

    if (!piutangForm.namaOrang || !piutangForm.jumlah || !piutangForm.tanggal) {
      alert('Isi nama orang, jumlah, dan tanggal');
      return;
    }

    if (!piutangForm.walletId) {
      alert('Pilih wallet sumber piutang');
      return;
    }

    try {
      // Create Piutang Diberikan transaction
      const result = await api.post('/api/transactions', {
        amount: Number(piutangForm.jumlah),
        transactionDate: piutangForm.tanggal,
        description: piutangForm.deskripsi || `Piutang diberikan ke ${piutangForm.namaOrang}`,
        categoryId: piutangDiberiCategory?.id,
        accountId: Number(piutangForm.walletId),
        transactionType: 'loan',
      });

      // Refresh parent component
      window.location.reload();
    } catch (error) {
      alert('Error: ' + error.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.name || !form.lenderName || !form.principalAmount || !form.tenorMonths) {
      alert('Isi semua data yang diperlukan');
      return;
    }

    if (!form.accountId) {
      alert('Pilih wallet tujuan utang');
      return;
    }

    try {
      if (editingId) {
        // Update existing loan
        const result = await api.updateLoan(editingId, {
          name: form.name,
          lenderName: form.lenderName,
          notes: form.notes,
        });
        onUpdate(result.loans || []);
      } else {
        // Create new loan
        const result = await api.createLoan({
          name: form.name,
          lenderName: form.lenderName,
          loanType: form.loanType,
          principalAmount: Number(form.principalAmount),
          interestRate: Number(form.interestRate) || 0,
          tenorMonths: Number(form.tenorMonths),
          startDate: form.startDate,
          accountId: form.accountId ? Number(form.accountId) : null,
          notes: form.notes,
        });
        onUpdate(result.loans || []);
      }
      setShowForm(false);
    } catch (error) {
      alert('Error: ' + error.message);
    }
  };

  const handleDelete = async (loanId) => {
    if (!confirm('Yakin hapus utang ini?')) return;

    try {
      const result = await api.deleteLoan(loanId);
      onUpdate(result.loans || []);
    } catch (error) {
      alert('Error: ' + error.message);
    }
  };

  const handlePaymentSubmit = async (e, loanId) => {
    e.preventDefault();

    if (!paymentForm.principalPaid || !paymentForm.paymentDate) {
      alert('Isi data pembayaran');
      return;
    }

    try {
      const result = await api.recordLoanPayment(loanId, {
        paymentDate: paymentForm.paymentDate,
        principalPaid: Number(paymentForm.principalPaid),
        interestPaid: Number(paymentForm.interestPaid) || 0,
        categoryId: buangaCategory?.id,
      });
      onUpdate(result.loans || []);
      setShowPaymentForm(null);
      setPaymentForm({
        paymentDate: new Date().toISOString().split('T')[0],
        principalPaid: '',
        interestPaid: '',
      });
    } catch (error) {
      alert('Error: ' + error.message);
    }
  };

  const totalDebt = loans.reduce((sum, loan) => sum + loan.principalAmount, 0);
  const totalRemaining = loans.reduce((sum, loan) => sum + loan.remainingBalance, 0);
  const totalPaid = loans.reduce((sum, loan) => sum + loan.totalPaid, 0);

  // Filter piutang dan hutang
  const piutangTxs = loanTransactions.filter(tx => 
    tx.categoryName === 'Piutang Diberikan' || tx.categoryName === 'Pembayaran Piutang'
  );
  const hutangTxs = loanTransactions.filter(tx => 
    tx.categoryName === 'Utang' || tx.categoryName === 'Cicilan Utang'
  );

  const totalPiutang = piutangTxs.reduce((sum, tx) => sum + tx.amount, 0);
  const totalHutang = hutangTxs.reduce((sum, tx) => sum + tx.amount, 0);

  const displayTransactions = loanTab === 'piutang' ? piutangTxs : hutangTxs;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-slate-900">💰 Manajemen Piutang & Hutang</h1>
        <div className="flex gap-2">
          <button
            onClick={handleAddPiutang}
            className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-4 py-2 rounded-lg transition"
          >
            <Plus size={20} />
            Tambah Piutang
          </button>
          <button
            onClick={handleAddHutang}
            className="flex items-center gap-2 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white px-4 py-2 rounded-lg transition"
          >
            <Plus size={20} />
            Tambah Utang
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Piutang Card */}
        <div className="bg-gradient-to-br from-red-50 to-orange-100 rounded-3xl p-6 border border-orange-200 shadow-lg">
          <p className="text-orange-600 text-sm mb-2">💸 Total Piutang Kami</p>
          <p className="text-3xl font-bold text-orange-900">
            Rp {totalPiutang.toLocaleString('id-ID')}
          </p>
          <p className="text-xs text-orange-600 mt-2">{piutangTxs.length} transaksi</p>
        </div>
        
        {/* Hutang Card */}
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-3xl p-6 border border-purple-200 shadow-lg">
          <p className="text-purple-600 text-sm mb-2">📉 Total Utang Kami</p>
          <p className="text-3xl font-bold text-purple-900">
            Rp {totalHutang.toLocaleString('id-ID')}
          </p>
          <p className="text-xs text-purple-600 mt-2">{hutangTxs.length} transaksi</p>
        </div>
      </div>

        {/* Loans List */}
        <div className="space-y-4">
          {loans.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-slate-400">Belum ada utang</p>
            </div>
          ) : (
            loans.map((loan) => (
              <div
                key={loan.id}
                className="bg-white rounded-2xl p-6 border border-slate-200 shadow-lg"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-slate-900 mb-1">{loan.name}</h3>
                    <p className="text-slate-600 text-sm">
                      {loan.loanType === 'bank' ? '🏦 Bank' : '👤 Personal'} • {loan.lenderName}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(loan)}
                      className="p-2 hover:bg-slate-100 rounded-lg transition"
                    >
                      <Edit2 size={18} className="text-blue-600" />
                    </button>
                    <button
                      onClick={() => handleDelete(loan.id)}
                      className="p-2 hover:bg-slate-100 rounded-lg transition"
                    >
                      <Trash2 size={18} className="text-rose-600" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
                  <div>
                    <p className="text-slate-500">Nominal</p>
                    <p className="text-slate-900 font-semibold">
                      Rp {loan.principalAmount.toLocaleString('id-ID')}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-500">Bunga/Bulan</p>
                    <p className="text-slate-900 font-semibold">{loan.interestRate}%</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Tenor</p>
                    <p className="text-slate-900 font-semibold">{loan.tenorMonths} bulan</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Cicilan/Bulan</p>
                    <p className="text-slate-900 font-semibold">
                      Rp {loan.monthlyPayment.toLocaleString('id-ID', { maximumFractionDigits: 0 })}
                    </p>
                  </div>
                </div>

                {/* Payment Progress */}
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-slate-700 text-sm">Progress: {loan.paidInstallments}/{loan.tenorMonths}</p>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      loan.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                      loan.status === 'paused' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {loan.status === 'completed' ? 'Selesai' : loan.status === 'paused' ? 'Tertunda' : 'Aktif'}
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-emerald-500 to-emerald-400 h-2 rounded-full"
                      style={{ width: `${(loan.paidInstallments / loan.tenorMonths) * 100}%` }}
                    />
                  </div>
                  <p className="text-slate-500 text-xs mt-2">
                    Sisa: Rp {loan.remainingBalance.toLocaleString('id-ID')}
                  </p>
                </div>

                {/* Dates */}
                <div className="grid grid-cols-2 gap-4 mb-4 text-xs">
                  <div>
                    <p className="text-slate-500">Mulai</p>
                    <p className="text-slate-900">{new Date(loan.startDate).toLocaleDateString('id-ID')}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Selesai</p>
                    <p className="text-slate-900">{new Date(loan.endDate).toLocaleDateString('id-ID')}</p>
                  </div>
                </div>

                {/* Payment Button */}
                {loan.status === 'active' && (
                  <button
                    onClick={() => setShowPaymentForm(loan.id)}
                    className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white py-2 rounded-lg transition font-semibold"
                  >
                    Catat Pembayaran Cicilan
                  </button>
                )}

                {/* Payment Form */}
                {showPaymentForm === loan.id && (
                  <div className="mt-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
                    <form onSubmit={(e) => handlePaymentSubmit(e, loan.id)}>
                      <div className="space-y-3">
                        <div>
                          <label className="text-slate-700 text-sm">Tanggal Pembayaran</label>
                          <input
                            type="date"
                            value={paymentForm.paymentDate}
                            onChange={(e) => setPaymentForm({ ...paymentForm, paymentDate: e.target.value })}
                            className="w-full bg-white text-slate-900 rounded-lg px-3 py-2 border border-slate-300"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-slate-700 text-sm">Pokok</label>
                            <input
                              type="number"
                              value={paymentForm.principalPaid}
                              onChange={(e) => setPaymentForm({ ...paymentForm, principalPaid: e.target.value })}
                              placeholder="0"
                              className="w-full bg-white text-slate-900 rounded-lg px-3 py-2 border border-slate-300"
                            />
                          </div>
                          <div>
                            <label className="text-slate-700 text-sm">Bunga</label>
                            <input
                              type="number"
                              value={paymentForm.interestPaid}
                              onChange={(e) => setPaymentForm({ ...paymentForm, interestPaid: e.target.value })}
                              placeholder="0"
                              className="w-full bg-white text-slate-900 rounded-lg px-3 py-2 border border-slate-300"
                            />
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="submit"
                            className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white py-2 rounded-lg flex items-center justify-center gap-2"
                          >
                            <Check size={18} /> Simpan
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowPaymentForm(null)}
                            className="flex-1 bg-slate-300 hover:bg-slate-400 text-slate-900 py-2 rounded-lg flex items-center justify-center gap-2"
                          >
                            <X size={18} /> Batal
                          </button>
                        </div>
                      </div>
                    </form>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Add/Edit Form Modal */}
        {showForm && formType === 'piutang' && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl p-8 border border-slate-200 max-w-md w-full shadow-lg">
              <h2 className="text-2xl font-bold text-slate-900 mb-6">💸 Tambah Piutang Diberikan</h2>

              <form onSubmit={handleSubmitPiutang} className="space-y-4">
                <div>
                  <label className="text-slate-700 text-sm">Nama Orang *</label>
                  <input
                    type="text"
                    value={piutangForm.namaOrang}
                    onChange={(e) => setPiutangForm({ ...piutangForm, namaOrang: e.target.value })}
                    placeholder="Siapa yang punya utang ke kita?"
                    className="w-full bg-slate-50 text-slate-900 rounded-lg px-3 py-2 border border-slate-300"
                  />
                </div>

                <div>
                  <label className="text-slate-700 text-sm">Jumlah (Rp) *</label>
                  <input
                    type="number"
                    value={piutangForm.jumlah}
                    onChange={(e) => setPiutangForm({ ...piutangForm, jumlah: e.target.value })}
                    placeholder="0"
                    className="w-full bg-slate-50 text-slate-900 rounded-lg px-3 py-2 border border-slate-300"
                  />
                </div>

                <div>
                  <label className="text-slate-700 text-sm">Dari Wallet (Sumber Dana) *</label>
                  <select
                    value={piutangForm.walletId}
                    onChange={(e) => setPiutangForm({ ...piutangForm, walletId: e.target.value })}
                    className="w-full bg-slate-50 text-slate-900 rounded-lg px-3 py-2 border border-slate-300"
                    required
                  >
                    <option value="">-- Pilih Wallet --</option>
                    {accounts.map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.name} ({account.type})
                      </option>
                    ))}
                  </select>
                  <p className="text-slate-500 text-xs mt-1">Saldo wallet akan berkurang sebesar jumlah piutang</p>
                </div>

                <div>
                  <label className="text-slate-700 text-sm">Tanggal *</label>
                  <input
                    type="date"
                    value={piutangForm.tanggal}
                    onChange={(e) => setPiutangForm({ ...piutangForm, tanggal: e.target.value })}
                    className="w-full bg-slate-50 text-slate-900 rounded-lg px-3 py-2 border border-slate-300"
                  />
                </div>

                <div>
                  <label className="text-slate-700 text-sm">Deskripsi</label>
                  <textarea
                    value={piutangForm.deskripsi}
                    onChange={(e) => setPiutangForm({ ...piutangForm, deskripsi: e.target.value })}
                    placeholder="Keterangan piutang..."
                    className="w-full bg-slate-50 text-slate-900 rounded-lg px-3 py-2 border border-slate-300 resize-none h-16"
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white py-2 rounded-lg font-semibold transition"
                  >
                    Simpan Piutang
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="flex-1 bg-slate-300 hover:bg-slate-400 text-slate-900 py-2 rounded-lg font-semibold transition"
                  >
                    Batal
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Hutang Form Modal */}
        {showForm && formType === 'hutang' && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl p-8 border border-slate-200 max-w-md w-full shadow-lg">
              <h2 className="text-2xl font-bold text-slate-900 mb-6">
                {editingId ? 'Edit Utang' : 'Tambah Utang Baru'}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-slate-700 text-sm">Nama Utang</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Utang KPR, Pinjaman Modal, dll"
                    className="w-full bg-slate-50 text-slate-900 rounded-lg px-3 py-2 border border-slate-300"
                  />
                </div>

                <div>
                  <label className="text-slate-700 text-sm">Pemberi Utang</label>
                  <input
                    type="text"
                    value={form.lenderName}
                    onChange={(e) => setForm({ ...form, lenderName: e.target.value })}
                    placeholder="BCA, BRI, Teman, dll"
                    className="w-full bg-slate-50 text-slate-900 rounded-lg px-3 py-2 border border-slate-300"
                  />
                </div>

                <div>
                  <label className="text-slate-700 text-sm">Jenis Utang</label>
                  <select
                    value={form.loanType}
                    onChange={(e) => setForm({ ...form, loanType: e.target.value })}
                    className="w-full bg-slate-50 text-slate-900 rounded-lg px-3 py-2 border border-slate-300"
                  >
                    <option value="bank">Bank</option>
                    <option value="personal">Personal</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-700 text-sm">Masuk ke Wallet *</label>
                  <select
                    value={form.accountId}
                    onChange={(e) => setForm({ ...form, accountId: e.target.value })}
                    className="w-full bg-slate-50 text-slate-900 rounded-lg px-3 py-2 border border-slate-300"
                    required
                  >
                    <option value="">-- Pilih Wallet --</option>
                    {accounts.map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.name} ({account.type})
                      </option>
                    ))}
                  </select>
                  <p className="text-slate-500 text-xs mt-1">Uang utang akan masuk ke wallet ini</p>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-slate-700 text-sm">Nominal (Rp)</label>
                    <input
                      type="number"
                      value={form.principalAmount}
                      onChange={(e) => setForm({ ...form, principalAmount: e.target.value })}
                      placeholder="0"
                      className="w-full bg-slate-50 text-slate-900 rounded-lg px-3 py-2 border border-slate-300"
                    />
                  </div>
                  <div>
                    <label className="text-slate-700 text-sm">Bunga (%/tahun)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={form.interestRate}
                      onChange={(e) => setForm({ ...form, interestRate: e.target.value })}
                      placeholder="0"
                      className="w-full bg-slate-50 text-slate-900 rounded-lg px-3 py-2 border border-slate-300"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-slate-700 text-sm">Tenor (Bulan)</label>
                    <input
                      type="number"
                      value={form.tenorMonths}
                      onChange={(e) => setForm({ ...form, tenorMonths: e.target.value })}
                      placeholder="0"
                      className="w-full bg-slate-50 text-slate-900 rounded-lg px-3 py-2 border border-slate-300"
                    />
                  </div>
                  <div>
                    <label className="text-slate-700 text-sm">Mulai</label>
                    <input
                      type="date"
                      value={form.startDate}
                      onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                      className="w-full bg-slate-50 text-slate-900 rounded-lg px-3 py-2 border border-slate-300"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-slate-700 text-sm">Catatan</label>
                  <textarea
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    placeholder="Catatan tambahan..."
                    className="w-full bg-slate-50 text-slate-900 rounded-lg px-3 py-2 border border-slate-300 resize-none h-20"
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white py-2 rounded-lg font-semibold transition"
                  >
                    {editingId ? 'Update' : 'Tambah'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="flex-1 bg-slate-300 hover:bg-slate-400 text-slate-900 py-2 rounded-lg font-semibold transition"
                  >
                    Batal
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      {/* Loan Transactions Section */}
      <div className="space-y-4 mt-8">
        <h2 className="text-2xl font-bold text-slate-900">📋 Riwayat Transaksi Piutang/Hutang</h2>
        
        {/* Tab Navigation */}
        <div className="flex gap-2">
          <button
            onClick={() => setLoanTab('piutang')}
            className={`px-6 py-2 rounded-lg font-medium transition ${
              loanTab === 'piutang'
                ? 'bg-orange-600 text-white shadow-lg'
                : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
            }`}
          >
            💸 Piutang ({piutangTxs.length})
          </button>
          <button
            onClick={() => setLoanTab('hutang')}
            className={`px-6 py-2 rounded-lg font-medium transition ${
              loanTab === 'hutang'
                ? 'bg-purple-600 text-white shadow-lg'
                : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
            }`}
          >
            📉 Hutang ({hutangTxs.length})
          </button>
        </div>
        
        {displayTransactions.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-slate-200">
            <p className="text-slate-400">
              Belum ada transaksi {loanTab === 'piutang' ? 'piutang' : 'hutang'}
            </p>
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-200 shadow-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className={`border-b border-slate-200 ${
                loanTab === 'piutang'
                  ? 'bg-orange-50'
                  : 'bg-purple-50'
              }`}>
                <tr>
                  <th className="text-left py-3 px-4 text-slate-700 font-semibold">Tanggal</th>
                  <th className="text-left py-3 px-4 text-slate-700 font-semibold">Kategori</th>
                  <th className="text-left py-3 px-4 text-slate-700 font-semibold">Tipe</th>
                  <th className="text-right py-3 px-4 text-slate-700 font-semibold">Jumlah</th>
                  <th className="text-left py-3 px-4 text-slate-700 font-semibold">Deskripsi</th>
                </tr>
              </thead>
              <tbody>
                {displayTransactions.map((tx, idx) => (
                  <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-3 px-4 text-slate-700">
                      {new Date(tx.transactionDate).toLocaleDateString('id-ID')}
                    </td>
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
                        loanTab === 'piutang'
                          ? 'bg-orange-100 text-orange-700'
                          : 'bg-purple-100 text-purple-700'
                      }`}>
                        {loanTab === 'piutang' ? 'Piutang' : 'Hutang'}
                      </span>
                    </td>
                    <td className={`text-right py-3 px-4 font-semibold ${
                      loanTab === 'piutang'
                        ? 'text-orange-600'
                        : 'text-purple-600'
                    }`}>
                      Rp {new Intl.NumberFormat('id-ID', {
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0,
                      }).format(tx.amount)}
                    </td>
                    <td className="py-3 px-4 text-slate-600 max-w-xs truncate">
                      {tx.description || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      </div>
  );
}
