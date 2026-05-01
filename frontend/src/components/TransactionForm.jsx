import { Check, Plus, RotateCcw, Sparkles, Search, X } from 'lucide-react';
import * as Icons from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

function currencyPreview(value) {
  const amount = Number(value || 0);
  if (!amount) {
    return 'Rp0';
  }

  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount);
}

function CategorySearchDropdown({ categories, value, onChange, label }) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const dropdownRef = useRef(null);

  const filteredCategories = categories.filter((cat) =>
    cat.name.toLowerCase().includes(search.toLowerCase())
  );

  const selectedCategory = categories.find((cat) => cat.id === Number(value));

  const getIcon = (iconName) => {
    if (!iconName) return null;
    
    const IconComponent = Icons[iconName];
    if (IconComponent) {
      return <IconComponent className="h-4 w-4" />;
    }
    
    console.warn(`⚠️ Icon not found: ${iconName}`);
    return null;
  };

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="space-y-2">
      <span className="text-sm font-semibold text-slate-700">{label}</span>
      <div className="relative" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-white/90 px-4 py-3 text-left outline-none transition hover:border-slate-300 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
        >
          <div className="flex items-center gap-3">
            {selectedCategory?.icon && getIcon(selectedCategory.icon)}
            <span className={selectedCategory ? 'text-slate-900' : 'text-slate-500'}>
              {selectedCategory?.name || 'Pilih kategori...'}
            </span>
          </div>
          <Search className="h-4 w-4 text-slate-400" />
        </button>

        {isOpen && (
          <div className="absolute top-full z-50 mt-2 w-full rounded-2xl border border-slate-200 bg-white shadow-lg">
            <div className="border-b border-slate-100 p-3">
              <input
                type="text"
                placeholder="Cari kategori..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                autoFocus
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
              />
            </div>

            <div className="max-h-64 overflow-y-auto">
              {filteredCategories.length === 0 ? (
                <div className="px-4 py-6 text-center text-sm text-slate-500">
                  Tidak ada kategori yang cocok
                </div>
              ) : (
                filteredCategories.map((category) => (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => {
                      onChange(category.id);
                      setIsOpen(false);
                      setSearch('');
                    }}
                    className={`flex w-full items-center gap-3 border-b border-slate-50 px-4 py-3 text-left transition hover:bg-slate-50 ${
                      value === String(category.id) ? 'bg-emerald-50' : ''
                    }`}
                  >
                    {category.icon ? (
                      <div
                        className="flex h-8 w-8 items-center justify-center rounded-lg flex-shrink-0"
                        style={{ backgroundColor: `${category.color}30` }}
                      >
                        {getIcon(category.icon)}
                      </div>
                    ) : null}
                    <div className="flex-1">
                      <p className="font-medium text-slate-900">{category.name}</p>
                      <p className="text-xs text-slate-500">
                        {category.type === 'income' ? 'Pemasukan' : 'Pengeluaran'}
                      </p>
                    </div>
                    {value === String(category.id) && (
                      <Check className="h-4 w-4 text-emerald-600" />
                    )}
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function TransactionForm({
  values,
  categories,
  accounts,
  submitting,
  editing,
  onChange,
  onSubmit,
  onCancel,
}) {
  const filteredCategories = categories.filter((category) => category.type === values.type);
  const isTransfer = values.type === 'transfer';

  const handleTypeChange = (event) => {
    const nextType = event.target.value;
    
    if (nextType === 'transfer') {
      onChange({
        type: 'transfer',
        categoryId: '',
        accountId: '',
        fromAccountId: '',
        toAccountId: '',
      });
    } else {
      const nextCategories = categories.filter((category) => category.type === nextType);
      onChange({
        type: nextType,
        categoryId: nextCategories[0] ? String(nextCategories[0].id) : '',
        accountId: '',
        fromAccountId: '',
        toAccountId: '',
      });
    }
  };

  return (
    <section className="rounded-3xl border border-white/30 bg-white/70 p-6 shadow-glass backdrop-blur-md">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
            <Sparkles className="h-3.5 w-3.5" />
            Input Transaksi
          </p>
          <h2 className="mt-3 text-2xl font-bold tracking-tight text-slate-900">
            {editing ? 'Edit transaksi' : 'Tambah transaksi baru'}
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Catat pemasukan dan pengeluaran dengan tampilan yang clean dan cepat.
          </p>
        </div>

        <div className="hidden rounded-2xl bg-emerald-50 px-4 py-3 text-right md:block">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-emerald-700/80">Preview nominal</p>
          <p className="mt-1 text-lg font-bold text-emerald-700">{currencyPreview(values.amount)}</p>
        </div>
      </div>

      <form
        className="grid gap-4 md:grid-cols-2"
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit();
        }}
      >
        <label className="space-y-2">
          <span className="text-sm font-semibold text-slate-700">Nominal</span>
          <input
            type="number"
            min="0"
            step="0.01"
            inputMode="decimal"
            value={values.amount}
            onChange={(event) => onChange({ amount: event.target.value })}
            placeholder="Masukkan nominal"
            className="w-full rounded-2xl border border-slate-200 bg-white/90 px-4 py-3 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
          />
        </label>

        <label className="space-y-2">
          <span className="text-sm font-semibold text-slate-700">Tipe</span>
          <select
            value={values.type}
            onChange={handleTypeChange}
            className="w-full rounded-2xl border border-slate-200 bg-white/90 px-4 py-3 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
          >
            <option value="expense">Pengeluaran</option>
            <option value="income">Pemasukan</option>
            <option value="transfer">Transfer Antar Wallet</option>
          </select>
        </label>

        {isTransfer ? (
          <>
            <label className="space-y-2">
              <span className="text-sm font-semibold text-slate-700">Dari Wallet *</span>
              <select
                value={values.fromAccountId || ''}
                onChange={(event) => onChange({ fromAccountId: event.target.value })}
                className="w-full rounded-2xl border border-slate-200 bg-white/90 px-4 py-3 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
              >
                <option value="">-- Pilih wallet sumber --</option>
                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name} (Rp {new Intl.NumberFormat('id-ID').format(Math.round(account.balance))})
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2">
              <span className="text-sm font-semibold text-slate-700">Ke Wallet *</span>
              <select
                value={values.toAccountId || ''}
                onChange={(event) => onChange({ toAccountId: event.target.value })}
                className="w-full rounded-2xl border border-slate-200 bg-white/90 px-4 py-3 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
              >
                <option value="">-- Pilih wallet tujuan --</option>
                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name} (Rp {new Intl.NumberFormat('id-ID').format(Math.round(account.balance))})
                  </option>
                ))}
              </select>
            </label>
          </>
        ) : (
          <>
            <label className="space-y-2">
              <span className="text-sm font-semibold text-slate-700">
                Wallet {values.type === 'income' ? '(Masuk ke)' : '(Keluar dari)'} *
              </span>
              <select
                value={values.accountId || ''}
                onChange={(event) => onChange({ accountId: event.target.value })}
                className="w-full rounded-2xl border border-slate-200 bg-white/90 px-4 py-3 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
              >
                <option value="">-- Pilih wallet --</option>
                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name} (Rp {new Intl.NumberFormat('id-ID').format(Math.round(account.balance))})
                  </option>
                ))}
              </select>
            </label>

            <CategorySearchDropdown
              categories={filteredCategories}
              value={values.categoryId}
              onChange={(categoryId) => onChange({ categoryId: String(categoryId) })}
              label="Kategori"
            />
          </>
        )}

        <label className="space-y-2">
          <span className="text-sm font-semibold text-slate-700">Tanggal</span>
          <input
            type="date"
            value={values.transactionDate}
            onChange={(event) => onChange({ transactionDate: event.target.value })}
            className="w-full rounded-2xl border border-slate-200 bg-white/90 px-4 py-3 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
          />
        </label>

        <label className="space-y-2 md:col-span-2">
          <span className="text-sm font-semibold text-slate-700">Keterangan</span>
          <textarea
            rows="4"
            value={values.description}
            onChange={(event) => onChange({ description: event.target.value })}
            placeholder="Contoh: makan siang, bayar listrik, gaji bulanan"
            className="w-full rounded-2xl border border-slate-200 bg-white/90 px-4 py-3 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
          />
        </label>

        <div className="flex flex-col gap-3 md:col-span-2 md:flex-row md:items-center md:justify-between">
          <p className="text-sm text-slate-500">
            {isTransfer 
              ? 'Pilih wallet sumber dan tujuan untuk melakukan transfer.'
              : filteredCategories.length > 0
              ? `${filteredCategories.length} kategori tersedia. Pilih wallet tujuan.`
              : 'Tambahkan kategori terlebih dahulu jika belum ada pilihan.'}
          </p>

          <div className="flex gap-3">
            {editing ? (
              <button
                type="button"
                onClick={onCancel}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                <RotateCcw className="h-4 w-4" />
                Batal
              </button>
            ) : null}

            <button
              type="submit"
              disabled={submitting || (isTransfer ? (!values.fromAccountId || !values.toAccountId) : (!values.accountId || filteredCategories.length === 0))}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 font-semibold text-white shadow-lg shadow-emerald-600/25 transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {editing ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
              {submitting ? 'Menyimpan...' : editing ? 'Simpan Perubahan' : 'Tambah Transaksi'}
            </button>
          </div>
        </div>
      </form>
    </section>
  );
}
