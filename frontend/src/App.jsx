import { useEffect, useMemo, useState } from 'react';
import { api } from './lib/api';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Transactions from './components/Transactions';
import Wallets from './components/Wallets';
import Loans from './components/Loans';
import Reports from './components/Reports';
import ImportExport from './components/ImportExport';

const today = new Date().toISOString().slice(0, 10);

function createInitialForm(categories = []) {
  const defaultExpense = categories.find((category) => category.type === 'expense');
  const defaultCategory = defaultExpense || categories[0] || null;

  return {
    amount: '',
    type: defaultCategory?.type || 'expense',
    categoryId: defaultCategory ? String(defaultCategory.id) : '',
    transactionDate: today,
    description: '',
    fromAccountId: '',
    toAccountId: '',
  };
}

export default function App() {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [accounts, setAccounts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loans, setLoans] = useState([]);
  const [loanTransactions, setLoanTransactions] = useState([]);
  const [summary, setSummary] = useState({ balance: 0, income: 0, expense: 0 });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(createInitialForm());
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [showImportExport, setShowImportExport] = useState(false);

  const editingData = useMemo(
    () => transactions.find((transaction) => transaction.id === editingId) || null,
    [editingId, transactions],
  );

  const loadDashboard = async () => {
    setLoading(true);
    setError('');

    try {
      const [dashboardData, loansData] = await Promise.all([
        api.getDashboard(),
        api.getLoans(),
      ]);
      
      console.log('🔍 First category from API:', dashboardData.categories?.[0]);
      console.log('🔍 Has icon field?', !!dashboardData.categories?.[0]?.icon);
      
      setAccounts(dashboardData.accounts || []);
      setCategories(dashboardData.categories || []);
      setTransactions(dashboardData.transactions || []);
      setLoans(loansData.loans || []);
      setLoanTransactions(loansData.loanTransactions || []);
      setSummary(dashboardData.summary || { balance: 0, income: 0, expense: 0 });
      setForm((current) => {
        if (editingId) {
          return current;
        }

        if (current.categoryId) {
          return current;
        }

        return createInitialForm(dashboardData.categories || []);
      });
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  useEffect(() => {
    if (!editingData) {
      return;
    }

    setForm({
      amount: String(editingData.amount),
      type: editingData.type,
      categoryId: String(editingData.categoryId),
      transactionDate: editingData.transactionDate,
      description: editingData.description || '',
      fromAccountId: editingData.fromAccountId || '',
      toAccountId: editingData.toAccountId || '',
    });
  }, [editingData]);

  const updateForm = (partial) => {
    setForm((current) => ({
      ...current,
      ...partial,
    }));
  };

  const resetForm = () => {
    setEditingId(null);
    setForm(createInitialForm(categories));
  };

  const handleSubmit = async () => {
    setSaving(true);
    setError('');
    setMessage('');

    try {
      const payload = {
        amount: form.amount,
        type: form.type,
        categoryId: form.categoryId,
        transactionDate: form.transactionDate,
        description: form.description,
      };

      // Add account-specific fields
      if (form.type === 'transfer') {
        payload.fromAccountId = form.fromAccountId;
        payload.toAccountId = form.toAccountId;
      } else {
        payload.accountId = form.accountId;
      }

      if (editingId) {
        await api.updateTransaction(editingId, payload);
        setMessage('Transaksi berhasil diperbarui.');
      } else {
        await api.createTransaction(payload);
        setMessage('Transaksi berhasil ditambahkan.');
      }

      setEditingId(null);
      setForm(createInitialForm(categories));
      await loadDashboard();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (transaction) => {
    setEditingId(transaction.id);
    setMessage('');
    setError('');
    setForm({
      amount: String(transaction.amount),
      type: transaction.type,
      categoryId: String(transaction.categoryId),
      transactionDate: transaction.transactionDate,
      description: transaction.description || '',
      accountId: transaction.type === 'transfer' ? '' : String(transaction.fromAccountId || transaction.toAccountId || ''),
      fromAccountId: transaction.fromAccountId || '',
      toAccountId: transaction.toAccountId || '',
    });
  };

  const handleDelete = async (transaction) => {
    const confirmed = window.confirm(`Hapus transaksi "${transaction.categoryName}"?`);
    if (!confirmed) {
      return;
    }

    setDeletingId(transaction.id);
    setError('');
    setMessage('');

    try {
      await api.deleteTransaction(transaction.id);
      setMessage('Transaksi berhasil dihapus.');

      if (editingId === transaction.id) {
        resetForm();
      }

      await loadDashboard();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Sidebar */}
      <Sidebar currentPage={currentPage} onNavigate={setCurrentPage} onImportExport={() => setShowImportExport(true)} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <div className="bg-white border-b border-slate-200 px-6 py-4 shadow-sm">
          <h2 className="text-2xl font-bold text-slate-900">Personal Finance Tracker</h2>
          <p className="text-sm text-slate-500 mt-1">Kelola keuangan Anda dengan mudah</p>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-auto bg-gradient-to-br from-slate-50 via-emerald-50/20 to-blue-50/20">
          <div className="p-6">
            {/* Messages */}
            {message && (
              <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-emerald-800">
                {message}
              </div>
            )}

            {error && (
              <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-rose-700">
                {error}
              </div>
            )}

            {/* Dashboard Page */}
            {currentPage === 'dashboard' && (
              <Dashboard
                summary={summary}
                transactions={transactions}
                categories={categories}
                accounts={accounts}
                loading={loading}
                deletingId={deletingId}
                onRefresh={loadDashboard}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            )}

            {/* Wallets Page */}
            {currentPage === 'wallets' && (
              <Wallets
                accounts={accounts}
                loading={loading}
                onRefresh={loadDashboard}
                message={message}
                error={error}
                setMessage={setMessage}
                setError={setError}
              />
            )}

            {/* Loans Page */}
            {currentPage === 'loans' && (
              <Loans
                loans={loans}
                loanTransactions={loanTransactions}
                categories={categories}
                accounts={accounts}
                loading={loading}
                onUpdate={setLoans}
              />
            )}

            {/* Transactions Page */}
            {currentPage === 'transactions' && (
              <Transactions
                form={form}
                categories={categories}
                accounts={accounts}
                transactions={transactions}
                loading={loading}
                saving={saving}
                deletingId={deletingId}
                editing={Boolean(editingId)}
                editingTransaction={editingData}
                onFormChange={updateForm}
                onFormSubmit={handleSubmit}
                onFormCancel={resetForm}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onRefresh={loadDashboard}
              />
            )}

            {/* Reports Page */}
            {currentPage === 'reports' && (
              <Reports />
            )}
          </div>
        </div>
      </div>

      {/* Import/Export Modal */}
      {showImportExport && (
        <ImportExport
          transactions={transactions}
          categories={categories}
          onImportSuccess={loadDashboard}
          onClose={() => setShowImportExport(false)}
        />
      )}
    </div>
  );
}
