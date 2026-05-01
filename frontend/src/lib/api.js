const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  });

  // Handle blob responses (for PDF export)
  if (options.responseType === 'blob') {
    if (!response.ok) {
      throw new Error('Request failed.');
    }
    return await response.blob();
  }

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload.message || 'Request failed.');
  }

  return payload;
}

export const api = {
  get: (path) => request(path, { method: 'GET' }),
  post: (path, data) =>
    request(path, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  put: (path, data) =>
    request(path, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  delete: (path) =>
    request(path, {
      method: 'DELETE',
    }),
  getDashboard: () => request('/api/dashboard'),
  getAccounts: () => request('/api/accounts'),
  createAccount: (data) =>
    request('/api/accounts', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateAccount: (id, data) =>
    request(`/api/accounts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteAccount: (id) =>
    request(`/api/accounts/${id}`, {
      method: 'DELETE',
    }),
  createTransaction: (data) =>
    request('/api/transactions', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateTransaction: (id, data) =>
    request(`/api/transactions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteTransaction: (id) =>
    request(`/api/transactions/${id}`, {
      method: 'DELETE',
    }),
  importTransactions: (data) =>
    request('/api/import', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  exportData: () =>
    request('/api/export', {
      method: 'GET',
    }),
  getImportHistory: () =>
    request('/api/import-history', {
      method: 'GET',
    }),
  rollbackImport: () =>
    request('/api/import/rollback', {
      method: 'DELETE',
    }),
  getLoans: () => request('/api/loans'),
  createLoan: (data) =>
    request('/api/loans', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateLoan: (id, data) =>
    request(`/api/loans/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteLoan: (id) =>
    request(`/api/loans/${id}`, {
      method: 'DELETE',
    }),
  getLoanPayments: (loanId) =>
    request(`/api/loans/${loanId}/payments`),
  recordLoanPayment: (loanId, data) =>
    request(`/api/loans/${loanId}/payment`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};
