import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import PDFDocument from 'pdfkit';
import pool, { initializeDatabase } from './db.js';

dotenv.config();

const app = express();
const port = Number(process.env.PORT || 5000);
const allowedOrigin = process.env.CORS_ORIGIN || 'http://localhost:5173';

// Track import history
let lastImportInfo = {
  timestamp: null,
  count: 0,
  transactionIds: [],
};

app.use(cors({ origin: allowedOrigin }));
app.use(express.json());

const normalizeCategory = (row) => ({
  id: row.id,
  name: row.name,
  type: row.category_type,
  color: row.color,
  icon: row.icon,
});

const normalizeTransaction = (row) => ({
  id: row.id,
  categoryId: row.category_id,
  categoryName: row.category_name || 'Uncategorized',
  categoryType: row.category_type || row.transaction_type,
  categoryColor: row.category_color || '#6B7280',
  categoryIcon: row.category_icon || null,
  type: row.transaction_type,
  amount: Number(row.amount),
  transactionDate: row.transaction_date,
  description: row.description || '',
  fromAccountId: row.from_account_id || null,
  toAccountId: row.to_account_id || null,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const buildSummary = (transactions, accounts = []) => {
  // Filter out:
  // 1. Loan-related transactions (categoryType = 'loan')
  // 2. Transfers (not real income/expense)
  const realTransactions = transactions.filter(
    (t) => t.type !== 'transfer' && t.categoryType !== 'loan'
  );

  const income = realTransactions
    .filter((transaction) => transaction.type === 'income')
    .reduce((total, transaction) => total + Number(transaction.amount || 0), 0);

  const expense = realTransactions
    .filter((transaction) => transaction.type === 'expense')
    .reduce((total, transaction) => total + Number(transaction.amount || 0), 0);

  // Balance adalah total balance dari semua wallet
  const balance = accounts.reduce((total, account) => total + Number(account.balance || 0), 0);

  return {
    income,
    expense,
    balance,
  };
};

async function getTransactions() {
  const [rows] = await pool.query(`
    SELECT
      t.id,
      t.category_id,
      t.transaction_type,
      t.amount,
      DATE_FORMAT(t.transaction_date, '%Y-%m-%d') AS transaction_date,
      t.description,
      t.from_account_id,
      t.to_account_id,
      t.created_at,
      t.updated_at,
      c.name AS category_name,
      c.category_type,
      c.color AS category_color,
      c.icon AS category_icon
    FROM transactions t
    LEFT JOIN categories c ON c.id = t.category_id
    WHERE t.transaction_type != 'loan'
    ORDER BY t.transaction_date DESC, t.id DESC;
  `);

  return rows.map(normalizeTransaction);
}

async function getCategories() {
  const [rows] = await pool.query(`
    SELECT id, name, category_type, color, icon
    FROM categories
    ORDER BY category_type ASC, name ASC;
  `);

  return rows.map(normalizeCategory);
}

async function getAccounts() {
  const [rows] = await pool.query(`
    SELECT id, name, account_type, balance, currency, color, is_active
    FROM accounts
    WHERE is_active = true
    ORDER BY name ASC;
  `);

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    type: row.account_type,
    balance: Number(row.balance),
    currency: row.currency,
    color: row.color,
  }));
}

async function validateTransactionPayload(payload) {
  const amount = Number(payload.amount);
  const transactionType = String(payload.transactionType || payload.type || '').trim();
  const categoryId = Number(payload.categoryId);
  const transactionDate = String(payload.transactionDate || '').trim();
  const description = String(payload.description || '').trim();
  const accountId = Number(payload.accountId) || null;
  const fromAccountId = Number(payload.fromAccountId) || null;
  const toAccountId = Number(payload.toAccountId) || null;

  if (!Number.isFinite(amount) || amount <= 0) {
    return { error: 'Nominal harus berupa angka lebih dari 0.' };
  }

  if (!['income', 'expense', 'transfer', 'loan'].includes(transactionType)) {
    return { error: 'Tipe transaksi tidak valid.' };
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(transactionDate)) {
    return { error: 'Tanggal transaksi tidak valid.' };
  }

  // For transfers
  if (transactionType === 'transfer') {
    if (!fromAccountId || !toAccountId) {
      return { error: 'Pilih wallet sumber dan tujuan untuk transfer.' };
    }
    if (fromAccountId === toAccountId) {
      return { error: 'Wallet sumber dan tujuan tidak boleh sama.' };
    }
    // Check if accounts exist
    const [accounts] = await pool.query(
      'SELECT id FROM accounts WHERE id IN (?, ?)',
      [fromAccountId, toAccountId],
    );
    if (accounts.length !== 2) {
      return { error: 'Wallet tidak ditemukan.' };
    }
    return {
      amount,
      transactionType,
      categoryId: null,
      transactionDate,
      description,
      accountId: null,
      fromAccountId,
      toAccountId,
    };
  }

  // For income/expense, require wallet
  if (!accountId) {
    return { error: 'Pilih wallet untuk transaksi.' };
  }

  // Check if account exists
  const [accounts] = await pool.query('SELECT id FROM accounts WHERE id = ?', [accountId]);
  if (accounts.length === 0) {
    return { error: 'Wallet tidak ditemukan.' };
  }

  // Validate category
  if (!Number.isInteger(categoryId) || categoryId <= 0) {
    return { error: 'Kategori harus dipilih.' };
  }

  const [categoryRows] = await pool.query(
    'SELECT id, name, category_type FROM categories WHERE id = ?',
    [categoryId],
  );

  if (categoryRows.length === 0) {
    return { error: 'Kategori tidak ditemukan.' };
  }

  const category = categoryRows[0];
  if (category.category_type !== transactionType) {
    return { error: 'Tipe transaksi harus sesuai dengan tipe kategori.' };
  }

  return {
    amount,
    transactionType,
    categoryId,
    transactionDate,
    description,
    accountId,
    fromAccountId: null,
    toAccountId: null,
  };
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, message: 'Personal Finance Tracker API is running.' });
});

app.get('/api/categories', async (_req, res, next) => {
  try {
    const categories = await getCategories();
    res.json({ categories });
  } catch (error) {
    next(error);
  }
});

app.get('/api/accounts', async (_req, res, next) => {
  try {
    const accounts = await getAccounts();
    res.json({ accounts });
  } catch (error) {
    next(error);
  }
});

app.post('/api/accounts', async (req, res, next) => {
  try {
    const { name, type, balance, currency, color } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Nama wallet wajib diisi.' });
    }

    const amount = Number(balance) || 0;
    const accountType = type || 'bank';
    const curr = currency || 'IDR';

    const [result] = await pool.execute(
      `INSERT INTO accounts (name, account_type, balance, currency, color)
       VALUES (?, ?, ?, ?, ?)`,
      [
        name.trim(),
        accountType,
        amount,
        curr,
        color || '#3498db',
      ]
    );

    res.status(201).json({
      account: {
        id: result.insertId,
        name: name.trim(),
        type: accountType,
        balance: amount,
        currency: curr,
        color: color || '#3498db',
      },
    });
  } catch (error) {
    next(error);
  }
});

app.put('/api/accounts/:id', async (req, res, next) => {
  try {
    const accountId = Number(req.params.id);
    const { name, type, balance, currency, color } = req.body;

    if (!Number.isInteger(accountId) || accountId <= 0) {
      return res.status(400).json({ message: 'ID wallet tidak valid.' });
    }

    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Nama wallet wajib diisi.' });
    }

    const amount = Number(balance) || 0;
    const accountType = type || 'bank';
    const curr = currency || 'IDR';

    const [result] = await pool.execute(
      `UPDATE accounts
       SET name = ?, account_type = ?, balance = ?, currency = ?, color = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [
        name.trim(),
        accountType,
        amount,
        curr,
        color || '#3498db',
        accountId,
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Wallet tidak ditemukan.' });
    }

    res.json({
      account: {
        id: accountId,
        name: name.trim(),
        type: accountType,
        balance: amount,
        currency: curr,
        color: color || '#3498db',
      },
    });
  } catch (error) {
    next(error);
  }
});

app.delete('/api/accounts/:id', async (req, res, next) => {
  try {
    const accountId = Number(req.params.id);

    if (!Number.isInteger(accountId) || accountId <= 0) {
      return res.status(400).json({ message: 'ID wallet tidak valid.' });
    }

    const [result] = await pool.execute(
      'UPDATE accounts SET is_active = false WHERE id = ?',
      [accountId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Wallet tidak ditemukan.' });
    }

    res.json({ message: 'Wallet berhasil dihapus.' });
  } catch (error) {
    next(error);
  }
});

// ============ LOAN ENDPOINTS ============
async function getLoans() {
  const [rows] = await pool.query(`
    SELECT 
      l.*,
      COALESCE(COUNT(lp.id), 0) as total_payments,
      COALESCE(SUM(lp.principal_paid + lp.interest_paid), 0) as total_paid_calc
    FROM loans l
    LEFT JOIN loan_payments lp ON lp.loan_id = l.id
    GROUP BY l.id
    ORDER BY l.start_date DESC, l.id DESC;
  `);

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    lenderName: row.lender_name,
    loanType: row.loan_type,
    principalAmount: Number(row.principal_amount),
    interestRate: Number(row.interest_rate),
    tenorMonths: row.tenor_months,
    monthlyPayment: Number(row.monthly_payment),
    startDate: row.start_date,
    endDate: row.end_date,
    paidInstallments: row.paid_installments,
    totalPaid: Number(row.total_paid),
    status: row.status,
    notes: row.notes,
    totalPayments: row.total_payments,
    remainingBalance: Number(row.principal_amount) - Number(row.total_paid_calc),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

app.get('/api/loans', async (_req, res, next) => {
  try {
    const loans = await getLoans();
    
    // Get loan transactions (piutang/hutang)
    const [loanTransactions] = await pool.query(`
      SELECT
        t.id,
        t.category_id,
        t.transaction_type,
        t.amount,
        DATE_FORMAT(t.transaction_date, '%Y-%m-%d') AS transaction_date,
        t.description,
        t.from_account_id,
        t.to_account_id,
        t.created_at,
        t.updated_at,
        c.name AS category_name,
        c.category_type,
        c.color AS category_color,
        c.icon AS category_icon
      FROM transactions t
      LEFT JOIN categories c ON c.id = t.category_id
      WHERE t.transaction_type = 'loan'
      ORDER BY t.transaction_date DESC, t.id DESC
    `);
    
    const normalizedLoanTxs = loanTransactions.map(normalizeTransaction);
    
    res.json({ 
      loans,
      loanTransactions: normalizedLoanTxs
    });
  } catch (error) {
    next(error);
  }
});

app.post('/api/loans', async (req, res, next) => {
  try {
    const { name, lenderName, loanType, principalAmount, interestRate, tenorMonths, startDate, accountId, notes } = req.body;

    if (!name || !lenderName || !loanType || !principalAmount || tenorMonths <= 0) {
      return res.status(400).json({ message: 'Data utang tidak lengkap.' });
    }

    // Calculate monthly payment (simple interest)
    const principal = Number(principalAmount);
    const interest = Number(interestRate) / 100;
    const totalInterest = principal * interest * tenorMonths;
    const monthlyPayment = (principal + totalInterest) / tenorMonths;

    // Calculate end date
    const start = new Date(startDate);
    const end = new Date(start);
    end.setMonth(end.getMonth() + tenorMonths);
    const endDateStr = end.toISOString().split('T')[0];

    // Start transaction
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      // 1. Insert loan record
      const [loanResult] = await connection.execute(
        `INSERT INTO loans (account_id, name, lender_name, loan_type, principal_amount, interest_rate, tenor_months, 
         monthly_payment, start_date, end_date, notes) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [accountId || null, name, lenderName, loanType, principal, interestRate, tenorMonths, monthlyPayment, startDate, endDateStr, notes || null]
      );

      // 2. Update wallet balance if accountId provided
      if (accountId) {
        await connection.execute(
          `UPDATE accounts SET balance = balance + ?, updated_at = NOW() WHERE id = ?`,
          [principal, accountId]
        );

        // 3. Create transaction record for audit trail (category: Utang, type: expense, but won't count in summary)
        const [utangCategory] = await connection.query(
          `SELECT id FROM categories WHERE name = 'Utang' LIMIT 1`
        );

        if (utangCategory.length > 0) {
          await connection.execute(
            `INSERT INTO transactions (category_id, transaction_type, amount, transaction_date, description) 
             VALUES (?, 'expense', ?, ?, ?)`,
            [utangCategory[0].id, principal, startDate, `Penerimaan ${name} dari ${lenderName}`]
          );
        }
      }

      await connection.commit();

      const loans = await getLoans();
      res.status(201).json({ message: 'Utang berhasil ditambahkan.', loans });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    next(error);
  }
});

app.put('/api/loans/:id', async (req, res, next) => {
  try {
    const loanId = Number(req.params.id);
    const { name, lenderName, notes, status } = req.body;

    if (!Number.isInteger(loanId) || loanId <= 0) {
      return res.status(400).json({ message: 'ID utang tidak valid.' });
    }

    await pool.execute(
      `UPDATE loans SET name = ?, lender_name = ?, notes = ?, status = ?, updated_at = NOW() 
       WHERE id = ?`,
      [name, lenderName, notes || null, status || 'active', loanId]
    );

    const loans = await getLoans();
    res.json({ message: 'Utang berhasil diperbarui.', loans });
  } catch (error) {
    next(error);
  }
});

app.delete('/api/loans/:id', async (req, res, next) => {
  try {
    const loanId = Number(req.params.id);

    if (!Number.isInteger(loanId) || loanId <= 0) {
      return res.status(400).json({ message: 'ID utang tidak valid.' });
    }

    // Delete related payments first
    await pool.execute('DELETE FROM loan_payments WHERE loan_id = ?', [loanId]);
    // Delete loan
    await pool.execute('DELETE FROM loans WHERE id = ?', [loanId]);

    const loans = await getLoans();
    res.json({ message: 'Utang berhasil dihapus.', loans });
  } catch (error) {
    next(error);
  }
});

app.get('/api/loans/:id/payments', async (req, res, next) => {
  try {
    const loanId = Number(req.params.id);

    if (!Number.isInteger(loanId) || loanId <= 0) {
      return res.status(400).json({ message: 'ID utang tidak valid.' });
    }

    const [payments] = await pool.query(
      `SELECT * FROM loan_payments WHERE loan_id = ? ORDER BY payment_date ASC`,
      [loanId]
    );

    res.json({ 
      payments: payments.map(p => ({
        id: p.id,
        paymentDate: p.payment_date,
        principalPaid: Number(p.principal_paid),
        interestPaid: Number(p.interest_paid),
        totalPaid: Number(p.principal_paid) + Number(p.interest_paid),
        transactionId: p.transaction_id,
      }))
    });
  } catch (error) {
    next(error);
  }
});

app.post('/api/loans/:id/payment', async (req, res, next) => {
  try {
    const loanId = Number(req.params.id);
    const { paymentDate, principalPaid, interestPaid, categoryId, description } = req.body;

    if (!Number.isInteger(loanId) || loanId <= 0) {
      return res.status(400).json({ message: 'ID utang tidak valid.' });
    }

    // Get loan info
    const [loans] = await pool.query('SELECT * FROM loans WHERE id = ?', [loanId]);
    if (loans.length === 0) {
      return res.status(404).json({ message: 'Utang tidak ditemukan.' });
    }

    const loan = loans[0];
    const principal = Number(principalPaid);
    const interest = Number(interestPaid);
    const totalPayment = principal + interest;

    // Start transaction
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();

      // Insert loan payment
      const [paymentResult] = await connection.execute(
        `INSERT INTO loan_payments (loan_id, payment_date, principal_paid, interest_paid) 
         VALUES (?, ?, ?, ?)`,
        [loanId, paymentDate, principal, interest]
      );

      // Update loan
      const newPaidInstallments = loan.paid_installments + 1;
      const newTotalPaid = Number(loan.total_paid) + totalPayment;
      const newStatus = newPaidInstallments >= loan.tenor_months ? 'completed' : 'active';

      await connection.execute(
        `UPDATE loans SET paid_installments = ?, total_paid = ?, status = ?, updated_at = NOW() 
         WHERE id = ?`,
        [newPaidInstallments, newTotalPaid, newStatus, loanId]
      );

      // Create transaction for interest (if any)
      if (interest > 0 && categoryId) {
        const interestCategoryId = categoryId; // Should be Bunga Utang Bank
        await connection.execute(
          `INSERT INTO transactions (category_id, transaction_type, amount, transaction_date, description) 
           VALUES (?, 'expense', ?, ?, ?)`,
          [interestCategoryId, interest, paymentDate, description || `Bunga cicilan utang: ${loan.name}`]
        );
      }

      await connection.commit();

      const loans = await getLoans();
      res.status(201).json({ 
        message: 'Pembayaran cicilan berhasil dicatat.', 
        loans,
        paymentId: paymentResult.insertId
      });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    next(error);
  }
});

app.get('/api/transactions', async (_req, res, next) => {
  try {
    const transactions = await getTransactions();
    res.json({ transactions });
  } catch (error) {
    next(error);
  }
});

app.get('/api/dashboard', async (_req, res, next) => {
  try {
    const [categories, transactions, accounts] = await Promise.all([
      getCategories(),
      getTransactions(),
      getAccounts(),
    ]);

    res.json({
      accounts,
      categories,
      transactions,
      summary: buildSummary(transactions, accounts),
    });
  } catch (error) {
    next(error);
  }
});

app.post('/api/transactions', async (req, res, next) => {
  try {
    console.log('📝 Creating transaction:', {
      type: req.body.type,
      amount: req.body.amount,
      accountId: req.body.accountId,
      categoryId: req.body.categoryId,
    });

    const payload = await validateTransactionPayload(req.body);
    if (payload.error) {
      console.log('❌ Validation error:', payload.error);
      return res.status(400).json({ message: payload.error });
    }

    console.log('✓ Payload valid:', {
      type: payload.transactionType,
      amount: payload.amount,
      accountId: payload.accountId,
    });

    // Handle transfer with account balance updates
    if (payload.transactionType === 'transfer') {
      const conn = await pool.getConnection();
      try {
        await conn.beginTransaction();

        // Deduct from source account
        await conn.execute(
          `UPDATE accounts SET balance = balance - ? WHERE id = ?`,
          [payload.amount, payload.fromAccountId],
        );

        // Add to destination account
        await conn.execute(
          `UPDATE accounts SET balance = balance + ? WHERE id = ?`,
          [payload.amount, payload.toAccountId],
        );

        // Create transaction record
        const [result] = await conn.execute(
          `INSERT INTO transactions (category_id, transaction_type, amount, transaction_date, description, from_account_id, to_account_id)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            null,
            'transfer',
            payload.amount,
            payload.transactionDate,
            payload.description || null,
            payload.fromAccountId,
            payload.toAccountId,
          ],
        );

        await conn.commit();

        // Fetch the created transaction
        const [rows] = await pool.query(
          `
            SELECT
              t.id,
              t.category_id,
              t.transaction_type,
              t.amount,
              DATE_FORMAT(t.transaction_date, '%Y-%m-%d') AS transaction_date,
              t.description,
              t.from_account_id,
              t.to_account_id,
              t.created_at,
              t.updated_at,
              'Transfer' AS category_name,
              'transfer' AS category_type,
              '#8B5CF6' AS category_color
            FROM transactions t
            WHERE t.id = ?
          `,
          [result.insertId],
        );

        res.status(201).json({ transaction: normalizeTransaction(rows[0]) });
      } catch (error) {
        await conn.rollback();
        throw error;
      } finally {
        conn.release();
      }
    } else {
      // Regular income/expense transaction with account balance update
      const conn = await pool.getConnection();
      try {
        await conn.beginTransaction();

        console.log(`💰 Updating account balance for ${payload.transactionType}:`, {
          accountId: payload.accountId,
          amount: payload.amount,
          operation: payload.transactionType === 'income' ? 'ADD' : 'SUBTRACT',
        });

        // Update account balance
        if (payload.transactionType === 'income') {
          // Income: add to wallet
          const [updateResult] = await conn.execute(
            `UPDATE accounts SET balance = balance + ? WHERE id = ?`,
            [payload.amount, payload.accountId],
          );
          console.log('✓ Income update result:', updateResult);
        } else {
          // Expense: deduct from wallet
          const [updateResult] = await conn.execute(
            `UPDATE accounts SET balance = balance - ? WHERE id = ?`,
            [payload.amount, payload.accountId],
          );
          console.log('✓ Expense update result:', updateResult);
        }

        // Create transaction record
        const [result] = await conn.execute(
          `INSERT INTO transactions (category_id, transaction_type, amount, transaction_date, description, from_account_id, to_account_id)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            payload.categoryId,
            payload.transactionType,
            payload.amount,
            payload.transactionDate,
            payload.description || null,
            payload.transactionType === 'expense' ? payload.accountId : null,
            payload.transactionType === 'income' ? payload.accountId : null,
          ],
        );

        console.log('✓ Transaction record inserted:', result.insertId);

        await conn.commit();
        console.log('✅ Transaction committed successfully');

        // Fetch the created transaction
        const [rows] = await conn.query(
          `
            SELECT
              t.id,
              t.category_id,
              t.transaction_type,
              t.amount,
              DATE_FORMAT(t.transaction_date, '%Y-%m-%d') AS transaction_date,
              t.description,
              t.from_account_id,
              t.to_account_id,
              t.created_at,
              t.updated_at,
              c.name AS category_name,
              c.category_type,
              c.color AS category_color
            FROM transactions t
            LEFT JOIN categories c ON c.id = t.category_id
            WHERE t.id = ?
          `,
          [result.insertId],
        );

        res.status(201).json({ transaction: normalizeTransaction(rows[0]) });
      } catch (error) {
        await conn.rollback();
        console.log('❌ Transaction error:', error.message);
        throw error;
      } finally {
        conn.release();
      }
    }
  } catch (error) {
    next(error);
  }
});

app.put('/api/transactions/:id', async (req, res, next) => {
  try {
    const transactionId = Number(req.params.id);

    if (!Number.isInteger(transactionId) || transactionId <= 0) {
      return res.status(400).json({ message: 'ID transaksi tidak valid.' });
    }

    const payload = await validateTransactionPayload(req.body);
    if (payload.error) {
      return res.status(400).json({ message: payload.error });
    }

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      // Get old transaction to revert wallet balance
      const [oldRows] = await conn.query(
        'SELECT transaction_type, amount, from_account_id, to_account_id FROM transactions WHERE id = ?',
        [transactionId],
      );

      if (oldRows.length === 0) {
        return res.status(404).json({ message: 'Transaksi tidak ditemukan.' });
      }

      const oldTransaction = oldRows[0];

      // Revert old wallet changes
      if (oldTransaction.transaction_type === 'transfer') {
        // Undo transfer: add back to source, subtract from destination
        await conn.execute(
          `UPDATE accounts SET balance = balance + ? WHERE id = ?`,
          [oldTransaction.amount, oldTransaction.from_account_id],
        );
        await conn.execute(
          `UPDATE accounts SET balance = balance - ? WHERE id = ?`,
          [oldTransaction.amount, oldTransaction.to_account_id],
        );
      } else if (oldTransaction.transaction_type === 'income') {
        // Undo income: subtract from wallet
        await conn.execute(
          `UPDATE accounts SET balance = balance - ? WHERE id = ?`,
          [oldTransaction.amount, oldTransaction.to_account_id],
        );
      } else if (oldTransaction.transaction_type === 'expense') {
        // Undo expense: add back to wallet
        await conn.execute(
          `UPDATE accounts SET balance = balance + ? WHERE id = ?`,
          [oldTransaction.amount, oldTransaction.from_account_id],
        );
      }

      // Apply new wallet changes
      if (payload.transactionType === 'transfer') {
        await conn.execute(
          `UPDATE accounts SET balance = balance - ? WHERE id = ?`,
          [payload.amount, payload.fromAccountId],
        );
        await conn.execute(
          `UPDATE accounts SET balance = balance + ? WHERE id = ?`,
          [payload.amount, payload.toAccountId],
        );
      } else if (payload.transactionType === 'income') {
        await conn.execute(
          `UPDATE accounts SET balance = balance + ? WHERE id = ?`,
          [payload.amount, payload.accountId],
        );
      } else if (payload.transactionType === 'expense') {
        await conn.execute(
          `UPDATE accounts SET balance = balance - ? WHERE id = ?`,
          [payload.amount, payload.accountId],
        );
      }

      // Update transaction
      const [result] = await conn.execute(
        `UPDATE transactions
         SET category_id = ?, transaction_type = ?, amount = ?, transaction_date = ?, description = ?, from_account_id = ?, to_account_id = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [
          payload.categoryId,
          payload.transactionType,
          payload.amount,
          payload.transactionDate,
          payload.description || null,
          payload.transactionType === 'expense' ? payload.accountId : payload.fromAccountId,
          payload.transactionType === 'income' ? payload.accountId : payload.toAccountId,
          transactionId,
        ],
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'Transaksi tidak ditemukan.' });
      }

      await conn.commit();

      const [rows] = await conn.query(
        `
          SELECT
            t.id,
            t.category_id,
            t.transaction_type,
            t.amount,
            DATE_FORMAT(t.transaction_date, '%Y-%m-%d') AS transaction_date,
            t.description,
            t.from_account_id,
            t.to_account_id,
            t.created_at,
            t.updated_at,
            c.name AS category_name,
            c.category_type,
            c.color AS category_color
          FROM transactions t
          LEFT JOIN categories c ON c.id = t.category_id
          WHERE t.id = ?
        `,
        [transactionId],
      );

      res.json({ transaction: normalizeTransaction(rows[0]) });
    } catch (error) {
      await conn.rollback();
      throw error;
    } finally {
      conn.release();
    }
  } catch (error) {
    next(error);
  }
});

app.delete('/api/transactions/:id', async (req, res, next) => {
  try {
    const transactionId = Number(req.params.id);

    if (!Number.isInteger(transactionId) || transactionId <= 0) {
      return res.status(400).json({ message: 'ID transaksi tidak valid.' });
    }

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      // Get transaction to revert wallet balance
      const [rows] = await conn.query(
        'SELECT transaction_type, amount, from_account_id, to_account_id FROM transactions WHERE id = ?',
        [transactionId],
      );

      if (rows.length === 0) {
        return res.status(404).json({ message: 'Transaksi tidak ditemukan.' });
      }

      const transaction = rows[0];

      // Revert wallet changes based on transaction type
      if (transaction.transaction_type === 'transfer') {
        // Add back to source, subtract from destination
        await conn.execute(
          `UPDATE accounts SET balance = balance + ? WHERE id = ?`,
          [transaction.amount, transaction.from_account_id],
        );
        await conn.execute(
          `UPDATE accounts SET balance = balance - ? WHERE id = ?`,
          [transaction.amount, transaction.to_account_id],
        );
      } else if (transaction.transaction_type === 'income') {
        // Subtract from wallet (undo income)
        await conn.execute(
          `UPDATE accounts SET balance = balance - ? WHERE id = ?`,
          [transaction.amount, transaction.to_account_id],
        );
      } else if (transaction.transaction_type === 'expense') {
        // Add back to wallet (undo expense)
        await conn.execute(
          `UPDATE accounts SET balance = balance + ? WHERE id = ?`,
          [transaction.amount, transaction.from_account_id],
        );
      }

      // Delete transaction
      const [result] = await conn.execute('DELETE FROM transactions WHERE id = ?', [transactionId]);

      if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'Transaksi tidak ditemukan.' });
      }

      await conn.commit();

      res.json({ message: 'Transaksi berhasil dihapus.' });
    } catch (error) {
      await conn.rollback();
      throw error;
    } finally {
      conn.release();
    }
  } catch (error) {
    next(error);
  }
});

app.post('/api/import', async (req, res, next) => {
  try {
    const backupData = req.body;

    // Validate backup structure
    if (!backupData.transactions || !Array.isArray(backupData.transactions)) {
      return res.status(400).json({ message: 'Format JSON tidak valid.' });
    }

    let importedAccounts = 0;
    const errors = [];

    // Import accounts first (if available)
    if (backupData.accounts && Array.isArray(backupData.accounts)) {
      for (const account of backupData.accounts) {
        try {
          const accountName = account.account_name || account.name;
          const accountType = account.account_type || 'bank';
          const balance = Number(account.balance) || 0;
          const currency = account.currency || 'IDR';
          const color = account.color_code || account.color || '#3498db';

          if (!accountName) continue;

          // Check if account already exists
          const [existing] = await pool.query(
            'SELECT id FROM accounts WHERE name = ?',
            [accountName]
          );

          if (existing.length === 0) {
            await pool.execute(
              `INSERT INTO accounts (name, account_type, balance, currency, color)
               VALUES (?, ?, ?, ?, ?)`,
              [accountName, accountType, balance, currency, color]
            );
            importedAccounts++;
          }
        } catch (accError) {
          console.error('Error importing account:', accError);
          errors.push(`Gagal mengimport account: ${accError.message}`);
        }
      }
    }

    const [existingCategories] = await pool.query('SELECT id, name, category_type FROM categories');
    
    // Create maps for lookup
    const categoryByName = new Map();
    const categoriesByType = { income: [], expense: [] };
    
    existingCategories.forEach((cat) => {
      categoryByName.set(cat.name.toLowerCase().trim(), cat);
      categoryByName.set(cat.name.toLowerCase().replace(/\s+/g, ''), cat);
      if (categoriesByType[cat.category_type]) {
        categoriesByType[cat.category_type].push(cat);
      }
    });

    // Category name mapping/normalization
    const categoryAliases = {
      'piutang diberikan': 'Piutang Diberikan',
      'piutang_diberikan': 'Piutang Diberikan',
      'pembayaran piutang': 'Pembayaran Piutang',
      'pembayaran_piutang': 'Pembayaran Piutang',
      'gaji': 'Gaji',
      'salary': 'Gaji',
      'bonus': 'Bonus',
      'investasi': 'Investasi',
      'investment': 'Investasi',
      'makanan': 'Makanan & Minuman',
      'food': 'Makanan & Minuman',
      'food & drinks': 'Makanan & Minuman',
      'fooddrinks': 'Makanan & Minuman',
      'transportasi': 'Transportasi',
      'transport': 'Transportasi',
      'belanja': 'Belanja',
      'shopping': 'Belanja',
      'tagihan': 'Tagihan',
      'bills': 'Tagihan',
      'kesehatan': 'Kesehatan',
      'health': 'Kesehatan',
      'hiburan': 'Hiburan',
      'entertainment': 'Hiburan',
      'parkir': 'Parkir',
      'parking': 'Parkir',
      'biaya admin': 'Biaya Admin',
      'admin fee': 'Biaya Admin',
      'adminfee': 'Biaya Admin',
      'bank charge': 'Biaya Admin',
      'donasi': 'Donasi',
      'donation': 'Donasi',
      'bensin': 'Bensin',
      'fuel': 'Bensin',
      'langganan': 'Langganan',
      'subscription': 'Langganan',
    };

    const normalizeCategory = (name) => {
      const normalized = name?.toLowerCase().trim().replace(/\s+/g, '');
      return categoryAliases[normalized] || categoryAliases[name?.toLowerCase().trim()] || name;
    };

    const findCategory = (name, type) => {
      // Normalize name
      const normalized = normalizeCategory(name);
      const normalizedLower = normalized.toLowerCase();

      // Try exact match
      let found = categoryByName.get(normalizedLower);
      if (found && found.category_type === type) {
        return found;
      }

      // Try with spaces removed
      found = categoryByName.get(normalizedLower.replace(/\s+/g, ''));
      if (found && found.category_type === type) {
        return found;
      }

      // Try all categories, match by type first
      const typeCats = categoriesByType[type] || [];
      if (typeCats.length > 0) {
        // Try to find by partial name match
        const partial = typeCats.find(cat => 
          cat.name.toLowerCase().includes(normalizedLower.substring(0, 3)) ||
          normalizedLower.includes(cat.name.toLowerCase().substring(0, 3))
        );
        if (partial) return partial;
        
        // Return first of type as fallback
        return typeCats[0];
      }

      return null;
    };

    let importedCount = 0;

    for (const transaction of backupData.transactions) {
      try {
        // Skip transfer type (tidak ada support)
        if (transaction.transaction_type === 'transfer') {
          continue;
        }

        const type = transaction.transaction_type || 'expense';
        const amount = Number(transaction.amount);

        // Get category name dari category_export_key, category_name, atau notes
        let categoryName = 
          transaction.category_export_key?.split('|')[0] || 
          transaction.category_name ||
          transaction.notes?.substring(0, 20) ||
          'Lainnya';

        // Find matching category
        const category = findCategory(categoryName, type);

        if (!category) {
          errors.push(`Kategori tidak ditemukan untuk: ${categoryName} (${type})`);
          continue;
        }

        // Validate amount
        if (!Number.isFinite(amount) || amount <= 0) {
          errors.push(`Nominal tidak valid: ${transaction.notes || categoryName}`);
          continue;
        }

        // Get transaction date
        const transactionDate = transaction.transaction_date?.split(' ')[0] || new Date().toISOString().split('T')[0];

        // Insert transaction
        const [result] = await pool.execute(
          `INSERT INTO transactions (category_id, transaction_type, amount, transaction_date, description)
           VALUES (?, ?, ?, ?, ?)`,
          [
            category.id,
            type,
            amount,
            transactionDate,
            transaction.notes || transaction.description || null,
          ]
        );

        if (result.insertId) {
          lastImportInfo.transactionIds.push(result.insertId);
        }

        importedCount++;
      } catch (transactionError) {
        console.error('Error importing transaction:', transactionError);
        errors.push(`Gagal mengimport transaksi: ${transactionError.message}`);
      }
    }

    // Update import info
    lastImportInfo.timestamp = new Date();
    lastImportInfo.count = importedCount;

    res.json({
      imported: importedCount,
      accounts: importedAccounts,
      errors: errors.length > 0 ? errors : undefined,
      message: `Berhasil mengimport ${importedAccounts} account dan ${importedCount} transaksi.`,
    });
  } catch (error) {
    next(error);
  }
});

app.get('/api/export', async (_req, res, next) => {
  try {
    const [categories] = await pool.query(
      'SELECT id, name, category_type, color, icon FROM categories ORDER BY category_type ASC, name ASC'
    );

    const [transactions] = await pool.query(`
      SELECT
        t.id,
        t.category_id,
        t.transaction_type,
        t.amount,
        DATE_FORMAT(t.transaction_date, '%Y-%m-%d') AS transaction_date,
        t.description,
        t.created_at,
        t.updated_at,
        c.name AS category_name,
        c.category_type,
        c.color AS category_color
      FROM transactions t
      LEFT JOIN categories c ON c.id = t.category_id
      ORDER BY t.transaction_date DESC, t.id DESC
    `);

    const exportData = {
      meta: {
        format: 'uang-backup-v1',
        exported_at: new Date().toISOString(),
        exported_from: 'Personal Finance Tracker v1',
      },
      categories: categories.map((cat) => ({
        id: cat.id,
        name: cat.name,
        category_type: cat.category_type,
        color: cat.color,
      })),
      transactions: transactions.map((t) => ({
        id: t.id,
        transaction_type: t.transaction_type,
        amount: Number(t.amount),
        transaction_date: t.transaction_date,
        description: t.description || null,
        category_id: t.category_id,
        category_name: t.category_name,
        created_at: t.created_at,
        updated_at: t.updated_at,
      })),
    };

    res.json(exportData);
  } catch (error) {
    next(error);
  }
});

app.get('/api/import-history', (_req, res) => {
  if (!lastImportInfo.timestamp) {
    return res.json({
      hasImport: false,
      lastImport: null,
    });
  }

  res.json({
    hasImport: true,
    lastImport: {
      timestamp: lastImportInfo.timestamp,
      count: lastImportInfo.count,
      transactionIds: lastImportInfo.transactionIds,
    },
  });
});

app.delete('/api/import/rollback', async (req, res, next) => {
  try {
    if (!lastImportInfo.timestamp || lastImportInfo.transactionIds.length === 0) {
      return res.status(400).json({ message: 'Tidak ada import untuk di-rollback.' });
    }

    const transactionIds = lastImportInfo.transactionIds;
    let deletedCount = 0;

    for (const id of transactionIds) {
      const [result] = await pool.execute('DELETE FROM transactions WHERE id = ?', [id]);
      if (result.affectedRows > 0) {
        deletedCount++;
      }
    }

    // Reset import info
    lastImportInfo = {
      timestamp: null,
      count: 0,
      transactionIds: [],
    };

    res.json({
      deleted: deletedCount,
      message: `Rollback berhasil. ${deletedCount} transaksi dihapus.`,
    });
  } catch (error) {
    next(error);
  }
});

// ============= REPORTS ENDPOINT =============
app.get('/api/reports', async (_req, res, next) => {
  try {
    // Get all transactions with categories
    const [transactions] = await pool.query(`
      SELECT
        t.id,
        t.category_id,
        t.transaction_type,
        t.amount,
        DATE_FORMAT(t.transaction_date, '%Y-%m-%d') AS transaction_date,
        CAST(DATE_FORMAT(t.transaction_date, '%m') AS UNSIGNED) AS month,
        CAST(DATE_FORMAT(t.transaction_date, '%Y') AS UNSIGNED) AS year,
        t.description,
        t.from_account_id,
        t.to_account_id,
        c.name AS category_name,
        c.category_type,
        c.color AS category_color,
        c.icon AS category_icon
      FROM transactions t
      LEFT JOIN categories c ON c.id = t.category_id
      WHERE t.transaction_date >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
      ORDER BY t.transaction_date DESC
    `);

    const [accounts] = await pool.query('SELECT id, name, balance FROM accounts');

    // Get current month
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    // Normalize transactions
    const normalizedTransactions = transactions.map(normalizeTransaction);

    // Filter for real income/expense (exclude transfers and loan types)
    const realTransactions = normalizedTransactions.filter(
      (t) => t.type !== 'transfer' && t.type !== 'loan'
    );

    // ===== 1. MONTHLY SUMMARY (Current Month) =====
    const currentMonthTransactions = realTransactions.filter((t) => {
      // Parse YYYY-MM-DD string directly to avoid timezone issues
      const [year, month] = t.transactionDate.split('-').map(Number);
      return month === currentMonth && year === currentYear;
    });

    const monthlyIncome = currentMonthTransactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const monthlyExpense = currentMonthTransactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    // Calculate total balance from all wallets
    const totalBalance = accounts.reduce((sum, acc) => sum + (acc.balance || 0), 0);

    const monthlySummary = {
      year: currentYear,
      month: currentMonth,
      monthName: new Date(currentYear, currentMonth - 1).toLocaleString('id-ID', { month: 'long' }),
      income: monthlyIncome,
      expense: monthlyExpense,
      balance: totalBalance,
    };

    // ===== 2. CATEGORY BREAKDOWN =====
    const expenseByCategory = {};
    const incomeByCategory = {};

    currentMonthTransactions.forEach((t) => {
      if (t.type === 'expense') {
        if (!expenseByCategory[t.categoryName]) {
          expenseByCategory[t.categoryName] = {
            name: t.categoryName,
            amount: 0,
            color: t.categoryColor,
            icon: t.categoryIcon,
          };
        }
        expenseByCategory[t.categoryName].amount += t.amount;
      } else if (t.type === 'income') {
        if (!incomeByCategory[t.categoryName]) {
          incomeByCategory[t.categoryName] = {
            name: t.categoryName,
            amount: 0,
            color: t.categoryColor,
            icon: t.categoryIcon,
          };
        }
        incomeByCategory[t.categoryName].amount += t.amount;
      }
    });

    const categoryBreakdown = {
      income: Object.values(incomeByCategory).sort((a, b) => b.amount - a.amount),
      expense: Object.values(expenseByCategory).sort((a, b) => b.amount - a.amount),
    };

    // ===== 3. BUDGET CAPACITY =====
    // Get last 3 months data to calculate averages
    const last3Months = [];
    for (let i = 0; i < 3; i++) {
      const date = new Date(currentYear, currentMonth - 1 - i);
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      last3Months.push({ year, month });
    }

    let totalIncomeLastMonths = 0;
    let totalExpenseLastMonths = 0;
    let monthCount = 0;

    last3Months.forEach(({ year, month }) => {
      const monthData = realTransactions.filter((t) => {
        // Parse YYYY-MM-DD string directly to avoid timezone issues
        const [txYear, txMonth] = t.transactionDate.split('-').map(Number);
        return txMonth === month && txYear === year;
      });

      const income = monthData.filter((t) => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
      const expense = monthData.filter((t) => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);

      if (income > 0 || expense > 0) {
        totalIncomeLastMonths += income;
        totalExpenseLastMonths += expense;
        monthCount++;
      }
    });

    const avgIncome = monthCount > 0 ? totalIncomeLastMonths / monthCount : monthlyIncome;
    const avgExpense = monthCount > 0 ? totalExpenseLastMonths / monthCount : monthlyExpense;

    // Categorize expenses as fixed, routine, or discretionary
    const fixedCategories = ['Tagihan', 'Cicilan Utang', 'Bunga Utang Bank'];
    const routineCategories = ['Makanan & Minuman', 'Transportasi', 'Kesehatan', 'Langganan'];

    let fixedCost = 0;
    let routineCost = 0;
    let discretionaryCost = 0;

    currentMonthTransactions.forEach((t) => {
      if (t.type === 'expense') {
        if (fixedCategories.includes(t.categoryName)) {
          fixedCost += t.amount;
        } else if (routineCategories.includes(t.categoryName)) {
          routineCost += t.amount;
        } else {
          discretionaryCost += t.amount;
        }
      }
    });

    const budgetCapacity = {
      avgIncome,
      fixedCost,
      routineCost,
      discretionaryCost,
      totalExpense: fixedCost + routineCost + discretionaryCost,
      availableForSpending: avgIncome - fixedCost - routineCost,
      recommendedSavings: (avgIncome - fixedCost - routineCost) * 0.2, // 20%
      safeToSpend: (avgIncome - fixedCost - routineCost) * 0.8, // 80%
    };

    // ===== 4. MONTHLY SPENDING TREND (Last 12 Months) =====
    const spendingTrend = {};

    // Initialize all 12 months
    for (let i = 11; i >= 0; i--) {
      const date = new Date(currentYear, currentMonth - 1 - i);
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const key = `${year}-${String(month).padStart(2, '0')}`;
      spendingTrend[key] = {
        year,
        month,
        monthName: date.toLocaleString('id-ID', { month: 'short' }),
        income: 0,
        expense: 0,
      };
    }

    // Fill in data
    realTransactions.forEach((t) => {
      // Parse YYYY-MM-DD string directly to avoid timezone issues
      const [year, month] = t.transactionDate.split('-').map(Number);
      const key = `${year}-${String(month).padStart(2, '0')}`;

      if (spendingTrend[key]) {
        if (t.type === 'income') {
          spendingTrend[key].income += t.amount;
        } else if (t.type === 'expense') {
          spendingTrend[key].expense += t.amount;
        }
      }
    });

    return res.json({
      monthlySummary,
      categoryBreakdown,
      budgetCapacity,
      spendingTrend: Object.values(spendingTrend),
    });
  } catch (error) {
    next(error);
  }
});

// ===== PDF EXPORT ENDPOINT =====
app.get('/api/transactions/export-pdf', async (req, res, next) => {
  try {
    const { month, year, allMonths } = req.query;

    // Fetch ALL transactions (excluding loans) from beginning - SORTED OLDEST FIRST
    const [allTransactions] = await pool.query(`
      SELECT
        t.id,
        t.amount,
        t.transaction_date,
        t.description,
        t.transaction_type as type,
        c.name as category_name,
        c.color as category_color,
        a.name as account_name,
        t.from_account_id
      FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.id
      LEFT JOIN accounts a ON t.from_account_id = a.id
      WHERE c.category_type IS NULL OR c.category_type != 'loan'
      ORDER BY t.transaction_date ASC
    `);

    // Fetch all accounts for balance calculation
    const [accounts] = await pool.query('SELECT id, name, balance FROM accounts');

    // Determine if we're filtering by month
    const isFiltering = !allMonths && month && year;

    // Calculate running balance for all transactions from the beginning
    let runningBalance = 0;
    let startingBalanceForFilter = 0;
    const allTransactionsWithBalance = allTransactions.map((t) => {
      // Before applying this transaction, capture the starting balance for the filtered period
      if (isFiltering) {
        const [txYear, txMonth] = t.transaction_date.split('-').map(Number);
        if (txMonth === Number(month) && txYear === Number(year) && startingBalanceForFilter === 0) {
          startingBalanceForFilter = runningBalance;
        }
      }

      if (t.type === 'income') {
        runningBalance += t.amount;
      } else if (t.type === 'expense') {
        runningBalance -= t.amount;
      }
      return { ...t, balance: runningBalance };
    });

    // Filter by month/year if specified (keeping the correct balance)
    let transactionsWithBalance = allTransactionsWithBalance;
    if (isFiltering) {
      transactionsWithBalance = allTransactionsWithBalance.filter((t) => {
        const [txYear, txMonth] = t.transaction_date.split('-').map(Number);
        return txMonth === Number(month) && txYear === Number(year);
      });
    }

    // Create PDF
    const doc = new PDFDocument({ margin: 40, size: 'A4' });

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="bank-statement.pdf"');

    // Pipe to response
    doc.pipe(res);

    // Header
    doc.fontSize(16).font('Helvetica-Bold').text('📊 LAPORAN TRANSAKSI KEUANGAN', { align: 'center' });
    doc.fontSize(10).font('Helvetica').text('Bank Statement Format', { align: 'center' });
    doc.moveDown(0.5);

    // Date range
    const dateRangeText = allMonths ? 'Semua Periode' :
      month && year ? `${new Date(year, month - 1).toLocaleString('id-ID', { month: 'long', year: 'numeric' })}` :
      'Semua Transaksi';
    doc.fontSize(10).text(`Periode: ${dateRangeText}`, { align: 'center' });
    doc.text(`Tanggal Cetak: ${new Date().toLocaleString('id-ID')}`, { align: 'center' });
    doc.moveDown(1);

    // Account summary
    const totalBalance = accounts.reduce((sum, acc) => sum + (acc.balance || 0), 0);
    doc.fontSize(9).font('Helvetica-Bold').text('Ringkasan Akun:', 0, doc.y);
    doc.moveDown(0.3);
    accounts.forEach((account) => {
      const balanceFormatted = new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
      }).format(account.balance);
      doc.fontSize(8).font('Helvetica').text(`  💰 ${account.name}: ${balanceFormatted}`);
    });
    const totalFormatted = new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(totalBalance);
    doc.fontSize(8).font('Helvetica-Bold').text(`  ══════════════════════════════`);
    doc.text(`  Total: ${totalFormatted}`, { continued: false });
    doc.moveDown(0.5);

    // Table header
    const tableTop = doc.y;
    const col1 = 40;
    const col2 = 120;
    const col3 = 200;
    const col4 = 260;
    const col5 = 320;
    const col6 = 380;

    doc.fontSize(8).font('Helvetica-Bold');
    doc.text('Tanggal', col1, tableTop);
    doc.text('Deskripsi', col2, tableTop);
    doc.text('Kategori', col3, tableTop);
    doc.text('Akun', col4, tableTop);
    doc.text('Keluar', col5, tableTop);
    doc.text('Masuk', col6, tableTop);

    // Horizontal line under header
    doc.moveTo(40, tableTop + 12).lineTo(480, tableTop + 12).stroke();
    doc.moveDown(0.7);

    // Table rows
    doc.fontSize(7).font('Helvetica');
    transactionsWithBalance.forEach((t) => {
      const y = doc.y;
      const dateStr = new Date(t.transaction_date).toLocaleDateString('id-ID');
      const description = (t.description || 'Tanpa deskripsi').substring(0, 30);
      const category = t.category_name || 'Lainnya';
      const accountName = (t.account_name || 'Unknown').substring(0, 15);

      // Format currency
      const amount = new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
      }).format(t.amount);

      doc.text(dateStr, col1, y, { width: 60 });
      doc.text(description, col2, y, { width: 70 });
      doc.text(category, col3, y, { width: 50 });
      doc.text(accountName, col4, y, { width: 50 });

      if (t.type === 'expense') {
        doc.text(amount, col5, y, { width: 50, align: 'right' });
        doc.text('-', col6, y, { width: 50, align: 'right' });
      } else if (t.type === 'income') {
        doc.text('-', col5, y, { width: 50, align: 'right' });
        doc.text(amount, col6, y, { width: 50, align: 'right' });
      } else {
        doc.text('-', col5, y, { width: 50, align: 'right' });
        doc.text('-', col6, y, { width: 50, align: 'right' });
      }

      doc.moveDown(0.6);

      // Check if we need to add a new page
      if (doc.y > 750) {
        doc.addPage();
      }
    });

    // Footer
    doc.moveDown(1);
    doc.moveTo(40, doc.y).lineTo(480, doc.y).stroke();
    doc.moveDown(0.5);
    doc.fontSize(8).font('Helvetica-Bold').text(`Total Transaksi: ${transactionsWithBalance.length}`, 40);
    doc.fontSize(7).font('Helvetica').text('Catatan: Dokumen ini adalah laporan otomatis dari sistem Personal Finance Tracker', 40);
    doc.text('Saldo akhir adalah total dari semua akun/dompet yang dimiliki', 40);

    // Finalize PDF
    doc.end();
  } catch (error) {
    next(error);
  }
});

// ===== ERROR HANDLER =====
app.use((error, _req, res, _next) => {
  console.error('API Error:', error.message);
  console.error('Stack:', error.stack);
  res.status(500).json({
    message: error.message || 'Terjadi kesalahan pada server.',
  });
});

async function startServer() {
  const maxRetries = 10;
  let retries = 0;

  while (retries < maxRetries) {
    try {
      console.log(`Initializing database (attempt ${retries + 1}/${maxRetries})...`);
      await initializeDatabase();
      console.log('✓ Database initialized successfully');
      break;
    } catch (error) {
      retries++;
      if (retries >= maxRetries) {
        console.error('✗ Failed to initialize database after', maxRetries, 'attempts:', error.message);
        process.exit(1);
      }
      console.warn(`⚠ Database initialization failed, retrying in 3 seconds...`, error.message);
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }
  }

  app.listen(port, () => {
    console.log(`✓ API running on http://localhost:${port}`);
  });
}

startServer().catch((error) => {
  console.error('✗ Failed to start server:', error);
  process.exit(1);
});
