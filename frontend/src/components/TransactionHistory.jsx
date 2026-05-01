import { Edit3, Trash2 } from 'lucide-react';
import * as Icons from 'lucide-react';

const currencyFormatter = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0,
});

const dateFormatter = new Intl.DateTimeFormat('id-ID', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
});

function getIconComponent(iconName) {
  if (!iconName) return null;
  
  const IconComponent = Icons[iconName];
  if (IconComponent) {
    return <IconComponent className="h-5 w-5" />;
  }
  
  console.warn(`⚠️ Icon not found: ${iconName}`);
  return null;
}

function TransactionBadge({ type }) {
  if (type === 'transfer') {
    return (
      <span className="inline-flex items-center rounded-full bg-purple-100 px-3 py-1 text-xs font-semibold text-purple-700">
        Transfer
      </span>
    );
  }

  if (type === 'loan') {
    return (
      <span className="inline-flex items-center rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
        Pinjaman
      </span>
    );
  }

  const isIncome = type === 'income';

  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
        isIncome ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
      }`}
    >
      {isIncome ? 'Pemasukan' : 'Pengeluaran'}
    </span>
  );
}

function TransactionRow({ transaction, accounts, onEdit, onDelete, deletingId }) {
  const amountColor = transaction.type === 'income' ? 'text-emerald-700' : transaction.type === 'transfer' ? 'text-purple-700' : transaction.type === 'loan' ? 'text-amber-700' : 'text-rose-700';
  const isDeleting = deletingId === transaction.id;

  let displayName = transaction.categoryName;
  let displayDescription = transaction.description || 'Tanpa keterangan';

  if (transaction.type === 'transfer' && accounts && accounts.length > 0) {
    const fromAccount = accounts.find((acc) => acc.id === transaction.fromAccountId);
    const toAccount = accounts.find((acc) => acc.id === transaction.toAccountId);
    displayName = `Transfer ${fromAccount?.name || 'Unknown'} → ${toAccount?.name || 'Unknown'}`;
    displayDescription = transaction.description || 'Transfer antar wallet';
  }

  return (
    <tr className="border-b border-slate-100/80 last:border-0 hover:bg-slate-50/70">
      <td className="px-4 py-4 align-top">
        <div>
          <div className="flex items-center gap-3">
            {transaction.categoryIcon && !transaction.type.includes('transfer') && (
              <div
                className="flex h-8 w-8 items-center justify-center rounded-lg flex-shrink-0"
                style={{ backgroundColor: `${transaction.categoryColor}20` }}
              >
                {getIconComponent(transaction.categoryIcon)}
              </div>
            )}
            <p className="font-semibold text-slate-900">{displayName}</p>
          </div>
          <p className="mt-1 text-sm text-slate-500">{displayDescription}</p>
        </div>
      </td>
      <td className="px-4 py-4 align-top">
        <TransactionBadge type={transaction.type} />
      </td>
      <td className={`px-4 py-4 align-top font-bold ${amountColor}`}>{currencyFormatter.format(transaction.amount)}</td>
      <td className="px-4 py-4 align-top text-slate-600">
        {dateFormatter.format(new Date(`${transaction.transactionDate}T00:00:00`))}
      </td>
      <td className="px-4 py-4 align-top">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => onEdit(transaction)}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            <Edit3 className="h-4 w-4" />
            Edit
          </button>
          <button
            type="button"
            onClick={() => onDelete(transaction)}
            disabled={isDeleting}
            className="inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Trash2 className="h-4 w-4" />
            {isDeleting ? 'Menghapus...' : 'Hapus'}
          </button>
        </div>
      </td>
    </tr>
  );
}

export default function TransactionHistory({ transactions, accounts, onEdit, onDelete, deletingId }) {
  return (
    <section className="rounded-3xl border border-white/30 bg-white/70 p-6 shadow-glass backdrop-blur-md">
      <div className="mb-5 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">History</p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">Riwayat Transaksi</h2>
        </div>
        <div className="rounded-2xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-600">
          {transactions.length} transaksi
        </div>
      </div>

      {transactions.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white/60 px-6 py-10 text-center text-slate-500">
          Belum ada transaksi. Tambahkan data pertama Anda untuk mulai melacak keuangan.
        </div>
      ) : (
        <div className="overflow-hidden rounded-3xl border border-slate-200/70 bg-white/85">
          <div className="hidden overflow-x-auto md:block">
            <table className="min-w-full divide-y divide-slate-100">
              <thead className="bg-slate-50/90 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                <tr>
                  <th className="px-4 py-4">Kategori</th>
                  <th className="px-4 py-4">Tipe</th>
                  <th className="px-4 py-4">Nominal</th>
                  <th className="px-4 py-4">Tanggal</th>
                  <th className="px-4 py-4">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((transaction) => (
                  <TransactionRow
                    key={transaction.id}
                    transaction={transaction}
                    accounts={accounts}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    deletingId={deletingId}
                  />
                ))}
              </tbody>
            </table>
          </div>

          <div className="grid gap-3 p-4 md:hidden">
            {transactions.map((transaction) => {
              const amountColor = transaction.type === 'income' ? 'text-emerald-700' : transaction.type === 'transfer' ? 'text-purple-700' : transaction.type === 'loan' ? 'text-amber-700' : 'text-rose-700';
              
              let displayName = transaction.categoryName;
              let displayDescription = transaction.description || 'Tanpa keterangan';

              if (transaction.type === 'transfer' && accounts && accounts.length > 0) {
                const fromAccount = accounts.find((acc) => acc.id === transaction.fromAccountId);
                const toAccount = accounts.find((acc) => acc.id === transaction.toAccountId);
                displayName = `Transfer ${fromAccount?.name || 'Unknown'} → ${toAccount?.name || 'Unknown'}`;
                displayDescription = transaction.description || 'Transfer antar wallet';
              }

              return (
                <article key={transaction.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        {transaction.categoryIcon && !transaction.type.includes('transfer') && (
                          <div
                            className="flex h-8 w-8 items-center justify-center rounded-lg flex-shrink-0"
                            style={{ backgroundColor: `${transaction.categoryColor}20` }}
                          >
                            {getIconComponent(transaction.categoryIcon)}
                          </div>
                        )}
                        <p className="font-semibold text-slate-900">{displayName}</p>
                      </div>
                      <p className="mt-1 text-sm text-slate-500">{displayDescription}</p>
                    </div>
                    <TransactionBadge type={transaction.type} />
                  </div>

                  <div className="mt-4 flex items-center justify-between gap-4">
                    <div>
                      <p className={`text-lg font-bold ${amountColor}`}>{currencyFormatter.format(transaction.amount)}</p>
                      <p className="mt-1 text-sm text-slate-500">
                        {dateFormatter.format(new Date(`${transaction.transactionDate}T00:00:00`))}
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => onEdit(transaction)}
                        className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(transaction)}
                        disabled={deletingId === transaction.id}
                        className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {deletingId === transaction.id ? 'Menghapus...' : 'Hapus'}
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
