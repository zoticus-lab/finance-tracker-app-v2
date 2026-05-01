import dotenv from 'dotenv';
import mysql from 'mysql2/promise';

dotenv.config();

console.log('Database Config:', {
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  database: process.env.DB_NAME || 'personal_finance_tracker',
});

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'personal_finance_tracker',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  decimalNumbers: true,
});

const seedCategories = [
  // Income
  ['Gaji', 'income', '#00AA5B', 'DollarSign'],
  ['Bonus', 'income', '#059669', 'Gift'],
  ['Investasi', 'income', '#10B981', 'TrendingUp'],
  
  // Expense
  ['Makanan & Minuman', 'expense', '#EF4444', 'Utensils'],
  ['Transportasi', 'expense', '#F97316', 'Car'],
  ['Belanja', 'expense', '#EC4899', 'ShoppingBag'],
  ['Tagihan', 'expense', '#DC2626', 'Receipt'],
  ['Kesehatan', 'expense', '#8B5CF6', 'Heart'],
  ['Hiburan', 'expense', '#6366F1', 'Smile'],
  ['Parkir', 'expense', '#FB923C', 'MapPin'],
  ['Biaya Admin', 'expense', '#FBBF24', 'CreditCard'],
  ['Donasi', 'expense', '#A78BFA', 'Hand'],
  ['Bensin', 'expense', '#FCA5A5', 'Droplet'],
  ['Langganan', 'expense', '#60A5FA', 'RotateCw'],
  ['Lainnya', 'expense', '#6B7280', 'MoreHorizontal'],
  
  // Transfer
  ['Transfer', 'expense', '#8B5CF6', 'ArrowRightLeft'],
];

const loanCategories = [
  // Loan related - tidak masuk income/expense
  ['Utang', 'loan', '#991B1B', 'AlertTriangle'],
  ['Cicilan Utang', 'loan', '#B91C1C', 'CreditCard'],
  ['Piutang Diberikan', 'loan', '#F87171', 'CheckCircle'],
  ['Pembayaran Piutang', 'loan', '#34D399', 'Send'],
];

export async function initializeDatabase() {
  // First, update existing tables to support new category_type enum
  try {
    await pool.execute(`
      ALTER TABLE categories MODIFY category_type ENUM('income', 'expense', 'loan') NOT NULL
    `);
    console.log('✓ Updated category_type ENUM to include loan');
  } catch (err) {
    console.log('⚠ category_type ENUM update: ', err.message);
  }

  await pool.execute(`
    CREATE TABLE IF NOT EXISTS accounts (
      id INT UNSIGNED NOT NULL AUTO_INCREMENT,
      name VARCHAR(100) NOT NULL,
      account_type ENUM('bank', 'cash', 'savings') NOT NULL DEFAULT 'bank',
      balance DECIMAL(15, 2) NOT NULL DEFAULT 0,
      currency VARCHAR(3) NOT NULL DEFAULT 'IDR',
      color VARCHAR(20) NOT NULL DEFAULT '#3498db',
      is_active BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY uq_accounts_name (name)
    ) ENGINE=InnoDB;
  `);

  await pool.execute(`
    CREATE TABLE IF NOT EXISTS categories (
      id INT UNSIGNED NOT NULL AUTO_INCREMENT,
      name VARCHAR(100) NOT NULL,
      category_type ENUM('income', 'expense', 'loan') NOT NULL,
      color VARCHAR(20) NOT NULL DEFAULT '#00AA5B',
      icon VARCHAR(50) NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY uq_categories_name (name)
    ) ENGINE=InnoDB;
  `);

  await pool.execute(`
    CREATE TABLE IF NOT EXISTS transactions (
      id INT UNSIGNED NOT NULL AUTO_INCREMENT,
      category_id INT UNSIGNED,
      transaction_type ENUM('income', 'expense', 'transfer') NOT NULL DEFAULT 'expense',
      amount DECIMAL(15, 2) NOT NULL,
      transaction_date DATE NOT NULL,
      description VARCHAR(500) NULL,
      from_account_id INT UNSIGNED NULL,
      to_account_id INT UNSIGNED NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      KEY idx_transactions_date (transaction_date),
      KEY idx_transactions_category (category_id),
      KEY idx_transactions_from_account (from_account_id),
      KEY idx_transactions_to_account (to_account_id),
      CONSTRAINT fk_transactions_category
        FOREIGN KEY (category_id) REFERENCES categories (id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,
      CONSTRAINT fk_transactions_from_account
        FOREIGN KEY (from_account_id) REFERENCES accounts (id)
        ON UPDATE CASCADE
        ON DELETE SET NULL,
      CONSTRAINT fk_transactions_to_account
        FOREIGN KEY (to_account_id) REFERENCES accounts (id)
        ON UPDATE CASCADE
        ON DELETE SET NULL
    ) ENGINE=InnoDB;
  `);

  await pool.execute(`
    CREATE TABLE IF NOT EXISTS loans (
      id INT UNSIGNED NOT NULL AUTO_INCREMENT,
      account_id INT UNSIGNED NULL,
      name VARCHAR(200) NOT NULL,
      lender_name VARCHAR(100) NOT NULL,
      loan_type ENUM('bank', 'personal') NOT NULL DEFAULT 'bank',
      principal_amount DECIMAL(15, 2) NOT NULL,
      interest_rate DECIMAL(5, 2) NOT NULL DEFAULT 0,
      tenor_months INT NOT NULL,
      monthly_payment DECIMAL(15, 2) NOT NULL,
      start_date DATE NOT NULL,
      end_date DATE NOT NULL,
      paid_installments INT NOT NULL DEFAULT 0,
      total_paid DECIMAL(15, 2) NOT NULL DEFAULT 0,
      status ENUM('active', 'completed', 'paused') NOT NULL DEFAULT 'active',
      notes VARCHAR(500) NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      KEY idx_loans_account (account_id),
      CONSTRAINT fk_loans_account
        FOREIGN KEY (account_id) REFERENCES accounts (id)
        ON UPDATE CASCADE
        ON DELETE SET NULL
    ) ENGINE=InnoDB;
  `);

  await pool.execute(`
    CREATE TABLE IF NOT EXISTS loan_payments (
      id INT UNSIGNED NOT NULL AUTO_INCREMENT,
      loan_id INT UNSIGNED NOT NULL,
      payment_date DATE NOT NULL,
      principal_paid DECIMAL(15, 2) NOT NULL,
      interest_paid DECIMAL(15, 2) NOT NULL,
      transaction_id INT UNSIGNED NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      KEY idx_loan_payments_loan (loan_id),
      CONSTRAINT fk_loan_payments_loan
        FOREIGN KEY (loan_id) REFERENCES loans (id)
        ON UPDATE CASCADE
        ON DELETE CASCADE
    ) ENGINE=InnoDB;
  `);

  // Add transfer support to existing databases
  console.log('Updating transactions table schema...');
  
  try {
    await pool.execute(`ALTER TABLE categories ADD COLUMN icon VARCHAR(50) NULL`);
    console.log('✓ Added icon column');
  } catch (err) {
    if (err.code !== 'ER_DUP_FIELDNAME') {
      console.log('⚠ icon column: ', err.message);
    }
  }

  for (const [name, categoryType, color, icon] of [...seedCategories, ...loanCategories]) {
    await pool.execute(
      `INSERT INTO categories (name, category_type, color, icon) VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE color = VALUES(color), icon = VALUES(icon)`,
      [name, categoryType, color, icon],
    );
  }

  // Update icons for existing categories by name
  const iconUpdates = [
    ['Gaji', 'DollarSign'],
    ['Bonus', 'Gift'],
    ['Investasi', 'TrendingUp'],
    ['Pembayaran Piutang', 'Send'],
    ['Makanan & Minuman', 'Utensils'],
    ['Transportasi', 'Car'],
    ['Belanja', 'ShoppingBag'],
    ['Tagihan', 'Receipt'],
    ['Kesehatan', 'Heart'],
    ['Hiburan', 'Smile'],
    ['Piutang Diberikan', 'CheckCircle'],
    ['Parkir', 'MapPin'],
    ['Biaya Admin', 'CreditCard'],
    ['Donasi', 'Hand'],
    ['Bensin', 'Droplet'],
    ['Langganan', 'RotateCw'],
    ['Bunga Utang Bank', 'AlertCircle'],
    ['Lainnya', 'MoreHorizontal'],
    ['Transfer', 'ArrowRightLeft'],
    ['Utang', 'AlertTriangle'],
    ['Cicilan Utang', 'CreditCard'],
  ];

  for (const [name, icon] of iconUpdates) {
    await pool.execute(`UPDATE categories SET icon = ? WHERE name = ?`, [icon, name]);
  }
  console.log('✓ Updated all category icons');

  // Update transaction_type untuk data lama berdasarkan category_type
  console.log('Updating transaction types based on categories...');
  
  // First, ensure ALL loan categories exist and have correct type
  const loanCategoryNames = ['Utang', 'Cicilan Utang', 'Piutang Diberikan', 'Pembayaran Piutang'];
  const loanCategoryDetails = [
    ['Utang', 'loan', '#991B1B', 'AlertTriangle'],
    ['Cicilan Utang', 'loan', '#B91C1C', 'CreditCard'],
    ['Piutang Diberikan', 'loan', '#F87171', 'CheckCircle'],
    ['Pembayaran Piutang', 'loan', '#34D399', 'Send'],
  ];
  
  for (const [catName, catType, catColor, catIcon] of loanCategoryDetails) {
    await pool.execute(`
      INSERT INTO categories (name, category_type, color, icon) VALUES (?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE category_type = ?, color = ?, icon = ?
    `, [catName, catType, catColor, catIcon, catType, catColor, catIcon]);
  }
  console.log('✓ Ensured all 4 loan categories exist with type "loan"');
  
  // Update transactions dengan kategori loan -> transaction_type = 'loan'
  const [loanResult] = await pool.execute(`
    UPDATE transactions t
    INNER JOIN categories c ON t.category_id = c.id
    SET t.transaction_type = 'loan'
    WHERE c.category_type = 'loan' AND t.transaction_type != 'loan'
  `);
  if (loanResult.changedRows > 0) {
    console.log(`✓ Updated ${loanResult.changedRows} loan transactions via category link`);
  }

  // Update transactions dengan kategori Transfer -> transaction_type = 'transfer'
  const [transferResult] = await pool.execute(`
    UPDATE transactions t
    INNER JOIN categories c ON t.category_id = c.id
    SET t.transaction_type = 'transfer'
    WHERE c.name = 'Transfer' AND t.transaction_type != 'transfer'
  `);
  if (transferResult.changedRows > 0) {
    console.log(`✓ Updated ${transferResult.changedRows} transfer transactions via category link`);
  }

  try {
    await pool.execute(`ALTER TABLE transactions ADD COLUMN from_account_id INT UNSIGNED NULL`);
    console.log('✓ Added from_account_id column');
  } catch (err) {
    if (err.code !== 'ER_DUP_FIELDNAME') {
      console.log('⚠ from_account_id: ', err.message);
    }
  }

  try {
    await pool.execute(`ALTER TABLE transactions ADD COLUMN to_account_id INT UNSIGNED NULL`);
    console.log('✓ Added to_account_id column');
  } catch (err) {
    if (err.code !== 'ER_DUP_FIELDNAME') {
      console.log('⚠ to_account_id: ', err.message);
    }
  }

  try {
    await pool.execute(`ALTER TABLE transactions MODIFY transaction_type ENUM('income', 'expense', 'transfer', 'loan') NOT NULL DEFAULT 'expense'`);
    console.log('✓ Updated transaction_type enum to include loan');
  } catch (err) {
    console.log('⚠ transaction_type: ', err.message);
  }

  try {
    await pool.execute(`ALTER TABLE transactions MODIFY category_id INT UNSIGNED NULL`);
    console.log('✓ Made category_id nullable');
  } catch (err) {
    console.log('⚠ category_id nullable: ', err.message);
  }

  console.log('Database initialization complete!');
}

export default pool;
