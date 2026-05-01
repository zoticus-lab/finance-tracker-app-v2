CREATE DATABASE IF NOT EXISTS personal_finance_tracker
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE personal_finance_tracker;

CREATE TABLE IF NOT EXISTS categories (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  category_type ENUM('income', 'expense') NOT NULL,
  color VARCHAR(20) NOT NULL DEFAULT '#00AA5B',
  icon VARCHAR(50) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_categories_name (name)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS transactions (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  category_id INT UNSIGNED NOT NULL,
  transaction_type ENUM('income', 'expense') NOT NULL,
  amount DECIMAL(15, 2) NOT NULL,
  transaction_date DATE NOT NULL,
  description VARCHAR(500) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_transactions_date (transaction_date),
  KEY idx_transactions_category (category_id),
  CONSTRAINT fk_transactions_category
    FOREIGN KEY (category_id) REFERENCES categories (id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT
) ENGINE=InnoDB;

INSERT IGNORE INTO categories (name, category_type, color) VALUES
  ('Gaji', 'income', '#00AA5B'),
  ('Bonus', 'income', '#059669'),
  ('Investasi', 'income', '#10B981'),
  ('Makanan', 'expense', '#EF4444'),
  ('Transportasi', 'expense', '#F97316'),
  ('Belanja', 'expense', '#EC4899'),
  ('Tagihan', 'expense', '#DC2626'),
  ('Kesehatan', 'expense', '#8B5CF6'),
  ('Hiburan', 'expense', '#6366F1'),
  ('Lainnya', 'expense', '#6B7280');
