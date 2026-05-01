import { RefreshCcw } from 'lucide-react';
import SummaryCards from './SummaryCards';
import TransactionHistory from './TransactionHistory';

export default function Dashboard({
  summary,
  transactions,
  categories,
  accounts,
  loading,
  deletingId,
  onRefresh,
  onEdit,
  onDelete,
}) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-500 mt-1">Ringkasan keuangan Anda hari ini</p>
        </div>
        <button
          onClick={onRefresh}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
        >
          <RefreshCcw size={18} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Summary Cards */}
      <SummaryCards summary={summary} />

      {/* Accounts */}
      {accounts && accounts.length > 0 && (
        <div className="rounded-3xl border border-white/30 bg-white/70 p-6 shadow-glass backdrop-blur-md">
          <h2 className="text-lg font-bold text-slate-900 mb-4">💰 Wallet Anda</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {accounts.map((account) => (
              <div
                key={account.id}
                className="rounded-2xl p-4 border-2"
                style={{
                  borderColor: account.color,
                  backgroundColor: `${account.color}15`,
                }}
              >
                <p className="text-sm text-slate-600 font-semibold">{account.name}</p>
                <p
                  className="text-xl font-bold mt-2"
                  style={{ color: account.color }}
                >
                  {new Intl.NumberFormat('id-ID', {
                    style: 'currency',
                    currency: account.currency,
                    minimumFractionDigits: 0,
                  }).format(account.balance)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Transaction History */}
      <div className="rounded-3xl border border-white/30 bg-white/70 p-6 shadow-glass backdrop-blur-md">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-slate-900">Riwayat Transaksi</h2>
          <p className="text-sm text-slate-500 mt-1">
            {transactions.length} transaksi tercatat
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-pulse text-slate-400">Loading...</div>
          </div>
        ) : transactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <p className="text-slate-400 mb-2">Belum ada transaksi</p>
            <p className="text-sm text-slate-500">
              Mulai dengan menambahkan transaksi pertama Anda
            </p>
          </div>
        ) : (
          <TransactionHistory
            transactions={transactions}
            deletingId={deletingId}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        )}
      </div>
    </div>
  );
}
