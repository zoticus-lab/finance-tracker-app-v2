import { RefreshCcw, FileText } from 'lucide-react';
import { useState } from 'react';
import TransactionForm from './TransactionForm';
import TransactionHistory from './TransactionHistory';
import ExportPDF from './ExportPDF';

export default function Transactions({
  form,
  categories,
  accounts,
  transactions,
  loading,
  saving,
  deletingId,
  editing,
  editingTransaction,
  onFormChange,
  onFormSubmit,
  onFormCancel,
  onEdit,
  onDelete,
  onRefresh,
}) {
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Kelola Transaksi</h1>
          <p className="text-slate-500 mt-1">Tambah, edit, atau hapus transaksi Anda</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setIsExportModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <FileText size={18} />
            Export PDF
          </button>
          <button
            onClick={onRefresh}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
          >
            <RefreshCcw size={18} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form */}
        <div className="lg:col-span-1">
          <TransactionForm
            values={form}
            categories={categories}
            accounts={accounts}
            submitting={saving}
            editing={editing}
            onChange={onFormChange}
            onSubmit={onFormSubmit}
            onCancel={onFormCancel}
          />
        </div>

        {/* History */}
        <div className="lg:col-span-2">
          <div className="rounded-3xl border border-white/30 bg-white/70 p-6 shadow-glass backdrop-blur-md">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-slate-900">Daftar Transaksi</h2>
              <p className="text-sm text-slate-500 mt-1">
                Total {transactions.length} transaksi
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
                  Isi form di samping untuk membuat transaksi pertama Anda
                </p>
              </div>
            ) : (
              <TransactionHistory
                transactions={transactions}
                accounts={accounts}
                deletingId={deletingId}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            )}
          </div>
        </div>
      </div>

      {/* Export PDF Modal */}
      <ExportPDF
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        transactions={transactions}
        accounts={accounts}
      />
    </div>
  );
}
