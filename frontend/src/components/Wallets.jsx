import { useState } from 'react';
import { api } from '../lib/api';

const accountTypes = [
  { value: 'bank', label: 'Bank' },
  { value: 'cash', label: 'Cash' },
  { value: 'savings', label: 'Savings' },
];

export default function Wallets({ accounts, loading, onRefresh, message, error, setMessage, setError }) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '',
    type: 'bank',
    balance: '',
    currency: 'IDR',
    color: '#3498db',
  });

  const handleAdd = () => {
    setEditingId(null);
    setForm({
      name: '',
      type: 'bank',
      balance: '',
      currency: 'IDR',
      color: '#3498db',
    });
    setShowForm(true);
  };

  const handleEdit = (account) => {
    setEditingId(account.id);
    setForm({
      name: account.name,
      type: account.type,
      balance: String(account.balance),
      currency: account.currency,
      color: account.color,
    });
    setShowForm(true);
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      setError('Nama wallet wajib diisi');
      return;
    }

    setSaving(true);
    setError('');
    setMessage('');

    try {
      if (editingId) {
        await api.updateAccount(editingId, form);
        setMessage('Wallet berhasil diperbarui.');
      } else {
        await api.createAccount(form);
        setMessage('Wallet berhasil ditambahkan.');
      }
      setShowForm(false);
      await onRefresh?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (account) => {
    const confirmed = window.confirm(`Hapus wallet "${account.name}"?`);
    if (!confirmed) return;

    setSaving(true);
    setError('');
    setMessage('');

    try {
      await api.deleteAccount(account.id);
      setMessage('Wallet berhasil dihapus.');
      await onRefresh?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const totalBalance = accounts?.reduce((sum, acc) => sum + acc.balance, 0) || 0;

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-3xl p-6 border border-emerald-200 shadow-lg">
          <p className="text-sm text-emerald-600 font-semibold mb-2">💰 Total Saldo</p>
          <p className="text-3xl font-bold text-emerald-900">
            {new Intl.NumberFormat('id-ID', {
              style: 'currency',
              currency: 'IDR',
              minimumFractionDigits: 0,
            }).format(totalBalance)}
          </p>
        </div>
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-3xl p-6 border border-blue-200 shadow-lg">
          <p className="text-sm text-blue-600 font-semibold mb-2">🏦 Jumlah Wallet</p>
          <p className="text-3xl font-bold text-blue-900">{accounts?.length || 0}</p>
        </div>
      </div>

      {/* Add Button */}
      <button
        onClick={handleAdd}
        className="w-full bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-semibold py-3 rounded-2xl transition transform hover:scale-105 active:scale-95"
      >
        ➕ Tambah Wallet
      </button>

      {/* Wallets List */}
      {loading ? (
        <div className="text-center py-8 text-slate-500">Loading...</div>
      ) : accounts?.length === 0 ? (
        <div className="text-center py-12 bg-slate-50 rounded-2xl">
          <p className="text-slate-500 mb-2">Belum ada wallet</p>
          <p className="text-sm text-slate-400">Klik tombol "Tambah Wallet" untuk membuat wallet baru</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {accounts.map((account) => (
            <div
              key={account.id}
              className="rounded-2xl p-5 border-2 shadow-md hover:shadow-lg transition"
              style={{
                borderColor: account.color,
                backgroundColor: `${account.color}15`,
              }}
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <p className="font-semibold text-slate-900">{account.name}</p>
                  <p className="text-xs text-slate-500">
                    {accountTypes.find((t) => t.value === account.type)?.label} • {account.currency}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(account)}
                    className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded-lg transition"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => handleDelete(account)}
                    className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white text-sm rounded-lg transition"
                  >
                    🗑️
                  </button>
                </div>
              </div>
              <p className="text-2xl font-bold" style={{ color: account.color }}>
                {new Intl.NumberFormat('id-ID', {
                  style: 'currency',
                  currency: account.currency,
                  minimumFractionDigits: 0,
                }).format(account.balance)}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md">
            <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-bold text-white">
                {editingId ? 'Edit Wallet' : 'Tambah Wallet'}
              </h2>
              <button
                onClick={() => setShowForm(false)}
                className="text-white hover:bg-white/20 rounded-lg p-2 transition"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Nama Wallet</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="BCA, Dana, Cash Dompet, dll"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Tipe</label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {accountTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Mata Uang</label>
                  <input
                    type="text"
                    value={form.currency}
                    onChange={(e) => setForm({ ...form, currency: e.target.value.toUpperCase() })}
                    className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    maxLength="3"
                    placeholder="IDR"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Saldo Awal</label>
                <input
                  type="number"
                  value={form.balance}
                  onChange={(e) => setForm({ ...form, balance: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Warna</label>
                <div className="flex gap-2">
                  {['#3498db', '#e74c3c', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c'].map((color) => (
                    <button
                      key={color}
                      onClick={() => setForm({ ...form, color })}
                      className={`w-10 h-10 rounded-lg transition transform ${
                        form.color === color ? 'scale-125 ring-2 ring-offset-2 ring-slate-400' : ''
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowForm(false)}
                  className="flex-1 px-4 py-2 text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 transition"
                >
                  Batal
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={saving}
                  className="flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white rounded-lg transition"
                >
                  {saving ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
