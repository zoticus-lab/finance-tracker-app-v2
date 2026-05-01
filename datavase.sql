-- --------------------------------------------------------
-- Host:                         127.0.0.1
-- Server version:               8.0.30 - MySQL Community Server - GPL
-- Server OS:                    Win64
-- HeidiSQL Version:             12.15.0.7171
-- --------------------------------------------------------

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET NAMES utf8 */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;


-- Dumping database structure for personal_finance_tracker
DROP DATABASE IF EXISTS `personal_finance_tracker`;
CREATE DATABASE IF NOT EXISTS `personal_finance_tracker` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;
USE `personal_finance_tracker`;

-- Dumping structure for table personal_finance_tracker.accounts
DROP TABLE IF EXISTS `accounts`;
CREATE TABLE IF NOT EXISTS `accounts` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `account_type` enum('bank','cash','savings') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'bank',
  `balance` decimal(15,2) NOT NULL DEFAULT '0.00',
  `currency` varchar(3) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'IDR',
  `color` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '#3498db',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_accounts_name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table personal_finance_tracker.accounts: ~2 rows (approximately)
INSERT IGNORE INTO `accounts` (`id`, `name`, `account_type`, `balance`, `currency`, `color`, `is_active`, `created_at`, `updated_at`) VALUES
	(1, 'BCA', 'bank', 692100.00, 'IDR', '#3498db', 1, '2026-04-19 14:51:18', '2026-04-24 07:26:25'),
	(2, 'Cash Dompet', 'cash', 1000.00, 'IDR', '#3498db', 1, '2026-04-19 14:51:18', '2026-04-24 14:54:10');

-- Dumping structure for table personal_finance_tracker.categories
DROP TABLE IF EXISTS `categories`;
CREATE TABLE IF NOT EXISTS `categories` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `category_type` enum('income','expense','loan') COLLATE utf8mb4_unicode_ci NOT NULL,
  `color` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '#00AA5B',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `icon` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_categories_name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=2015 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table personal_finance_tracker.categories: ~22 rows (approximately)
INSERT IGNORE INTO `categories` (`id`, `name`, `category_type`, `color`, `created_at`, `updated_at`, `icon`) VALUES
	(1, 'Gaji', 'income', '#00AA5B', '2026-04-19 13:25:19', '2026-04-20 14:35:14', 'DollarSign'),
	(2, 'Bonus', 'income', '#059669', '2026-04-19 13:25:19', '2026-04-20 14:35:14', 'Gift'),
	(3, 'Investasi', 'income', '#10B981', '2026-04-19 13:25:19', '2026-04-20 14:35:14', 'TrendingUp'),
	(4, 'Makanan', 'expense', '#EF4444', '2026-04-19 13:25:19', '2026-04-20 14:35:14', 'Utensils'),
	(5, 'Transportasi', 'expense', '#F97316', '2026-04-19 13:25:19', '2026-04-20 14:35:14', 'Car'),
	(6, 'Belanja', 'expense', '#EC4899', '2026-04-19 13:25:19', '2026-04-20 14:35:14', 'ShoppingBag'),
	(7, 'Tagihan', 'expense', '#DC2626', '2026-04-19 13:25:19', '2026-04-20 15:01:18', 'Receipt'),
	(8, 'Kesehatan', 'expense', '#8B5CF6', '2026-04-19 13:25:19', '2026-04-20 14:35:14', 'Heart'),
	(9, 'Hiburan', 'expense', '#6366F1', '2026-04-19 13:25:19', '2026-04-20 14:35:14', 'Smile'),
	(10, 'Lainnya', 'expense', '#6B7280', '2026-04-19 13:25:19', '2026-04-20 14:35:14', 'MoreHorizontal'),
	(124, 'Pembayaran Piutang', 'loan', '#34D399', '2026-04-19 14:39:10', '2026-04-24 05:49:55', 'Send'),
	(131, 'Piutang Diberikan', 'loan', '#F87171', '2026-04-19 14:39:10', '2026-04-24 05:49:55', 'CheckCircle'),
	(132, 'Parkir', 'expense', '#FB923C', '2026-04-19 14:39:10', '2026-04-20 14:40:10', 'MapPin'),
	(133, 'Biaya Admin', 'expense', '#FBBF24', '2026-04-19 14:39:10', '2026-04-20 14:58:58', 'CreditCard'),
	(134, 'Donasi', 'expense', '#A78BFA', '2026-04-19 14:39:10', '2026-04-20 14:58:58', 'Hand'),
	(135, 'Bensin', 'expense', '#FCA5A5', '2026-04-19 14:39:10', '2026-04-20 14:58:58', 'Droplet'),
	(136, 'Langganan', 'expense', '#60A5FA', '2026-04-19 14:39:10', '2026-04-20 14:35:14', 'RotateCw'),
	(494, 'Bunga Utang Bank', 'expense', '#DC2626', '2026-04-19 15:11:00', '2026-04-20 14:35:14', 'AlertCircle'),
	(496, 'Utang', 'loan', '#991B1B', '2026-04-19 15:11:00', '2026-04-24 05:49:55', 'AlertTriangle'),
	(497, 'Cicilan Utang', 'loan', '#B91C1C', '2026-04-19 15:11:00', '2026-04-24 05:49:55', 'CreditCard'),
	(796, 'Transfer', 'expense', '#8B5CF6', '2026-04-20 14:17:35', '2026-04-20 14:35:14', 'ArrowRightLeft'),
	(1034, 'Makanan & Minuman', 'expense', '#EF4444', '2026-04-22 15:56:20', '2026-04-22 15:56:20', 'Utensils');

-- Dumping structure for table personal_finance_tracker.loan_payments
DROP TABLE IF EXISTS `loan_payments`;
CREATE TABLE IF NOT EXISTS `loan_payments` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `loan_id` int unsigned NOT NULL,
  `payment_date` date NOT NULL,
  `principal_paid` decimal(15,2) NOT NULL,
  `interest_paid` decimal(15,2) NOT NULL,
  `transaction_id` int unsigned DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_loan_payments_loan` (`loan_id`),
  CONSTRAINT `fk_loan_payments_loan` FOREIGN KEY (`loan_id`) REFERENCES `loans` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table personal_finance_tracker.loan_payments: ~0 rows (approximately)

-- Dumping structure for table personal_finance_tracker.loans
DROP TABLE IF EXISTS `loans`;
CREATE TABLE IF NOT EXISTS `loans` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `lender_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `loan_type` enum('bank','personal') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'bank',
  `principal_amount` decimal(15,2) NOT NULL,
  `interest_rate` decimal(5,2) NOT NULL DEFAULT '0.00',
  `tenor_months` int NOT NULL,
  `monthly_payment` decimal(15,2) NOT NULL,
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `paid_installments` int NOT NULL DEFAULT '0',
  `total_paid` decimal(15,2) NOT NULL DEFAULT '0.00',
  `status` enum('active','completed','paused') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `notes` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table personal_finance_tracker.loans: ~0 rows (approximately)

-- Dumping structure for table personal_finance_tracker.transactions
DROP TABLE IF EXISTS `transactions`;
CREATE TABLE IF NOT EXISTS `transactions` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `category_id` int unsigned DEFAULT NULL,
  `transaction_type` enum('income','expense','transfer','loan') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'expense',
  `amount` decimal(15,2) NOT NULL,
  `transaction_date` date NOT NULL,
  `description` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `from_account_id` int unsigned DEFAULT NULL,
  `to_account_id` int unsigned DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_transactions_date` (`transaction_date`),
  KEY `idx_transactions_category` (`category_id`),
  CONSTRAINT `fk_transactions_category` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=78 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table personal_finance_tracker.transactions: ~29 rows (approximately)
INSERT IGNORE INTO `transactions` (`id`, `category_id`, `transaction_type`, `amount`, `transaction_date`, `description`, `created_at`, `updated_at`, `from_account_id`, `to_account_id`) VALUES
	(45, 131, 'loan', 500000.00, '2026-03-28', 'Auto-created from credit #1', '2026-04-19 14:51:18', '2026-04-24 05:49:55', NULL, NULL),
	(46, 132, 'expense', 40000.00, '2026-03-29', 'Parkir Itenas', '2026-04-19 14:51:18', '2026-04-19 14:51:18', NULL, NULL),
	(47, 133, 'expense', 1000.00, '2026-03-29', NULL, '2026-04-19 14:51:18', '2026-04-19 14:51:18', NULL, NULL),
	(48, 4, 'expense', 4000.00, '2026-03-30', 'Air minum Cinde Mart', '2026-04-19 14:51:18', '2026-04-19 14:51:18', NULL, NULL),
	(49, 4, 'expense', 10000.00, '2026-03-30', 'Cuanki', '2026-04-19 14:51:18', '2026-04-19 14:51:18', NULL, NULL),
	(50, 131, 'loan', 7000.00, '2026-03-31', 'Auto-created from credit #3', '2026-04-19 14:51:18', '2026-04-24 05:49:55', NULL, NULL),
	(51, 124, 'loan', 7000.00, '2026-03-31', 'Auto-created from credit payment #2', '2026-04-19 14:51:18', '2026-04-24 05:49:55', NULL, NULL),
	(52, 4, 'expense', 4000.00, '2026-03-31', 'Aqua viva', '2026-04-19 14:51:18', '2026-04-19 14:51:18', NULL, NULL),
	(53, 124, 'loan', 500000.00, '2026-04-01', 'Auto-created from credit payment #3', '2026-04-19 14:51:19', '2026-04-24 05:49:55', NULL, NULL),
	(54, 135, 'expense', 40000.00, '2026-04-01', NULL, '2026-04-19 14:51:19', '2026-04-19 14:51:19', NULL, NULL),
	(55, 134, 'expense', 2000.00, '2026-04-03', 'cleng', '2026-04-19 14:51:19', '2026-04-19 14:51:19', NULL, NULL),
	(56, 134, 'expense', 8000.00, '2026-04-03', 'sukro & adem sari sachet', '2026-04-19 14:51:19', '2026-04-19 14:51:19', NULL, NULL),
	(57, 4, 'expense', 5000.00, '2026-04-04', 'sotong', '2026-04-19 14:51:19', '2026-04-19 14:51:19', NULL, NULL),
	(58, 136, 'expense', 7500.00, '2026-04-08', 'Beli Canva Pro', '2026-04-19 14:51:19', '2026-04-19 14:51:19', NULL, NULL),
	(59, 131, 'loan', 97000.00, '2026-04-05', 'Auto-created from credit #9', '2026-04-19 14:51:19', '2026-04-24 05:49:55', NULL, NULL),
	(60, 124, 'loan', 97000.00, '2026-04-08', 'Auto-created from credit payment #9', '2026-04-19 14:51:19', '2026-04-24 05:49:55', NULL, NULL),
	(61, 2, 'income', 3000.00, '2026-04-08', 'tambahan dari ibu', '2026-04-19 14:51:19', '2026-04-19 14:51:19', NULL, NULL),
	(62, 131, 'loan', 600000.00, '2026-04-09', 'Auto-created from credit #10', '2026-04-19 14:51:19', '2026-04-24 05:49:55', NULL, NULL),
	(63, 8, 'expense', 36400.00, '2026-04-13', 'Deodrant Dan Freshcare', '2026-04-19 14:51:20', '2026-04-19 14:51:20', NULL, NULL),
	(64, 133, 'expense', 10000.00, '2026-04-17', 'Admin Bca Bulanan', '2026-04-19 14:51:20', '2026-04-19 14:51:20', NULL, NULL),
	(65, 4, 'expense', 6000.00, '2026-04-17', 'Air minum Cinde mart', '2026-04-19 14:51:20', '2026-04-19 14:51:20', NULL, NULL),
	(66, 134, 'expense', 2000.00, '2026-04-17', NULL, '2026-04-19 14:51:20', '2026-04-24 14:54:10', 2, NULL),
	(71, 124, 'loan', 600000.00, '2026-04-20', 'Kacamata', '2026-04-20 14:18:40', '2026-04-24 05:49:55', NULL, 2),
	(72, NULL, 'transfer', 500000.00, '2026-04-20', 'Tf bca', '2026-04-20 14:24:37', '2026-04-20 14:24:37', 2, 1),
	(73, 135, 'expense', 60000.00, '2026-04-20', 'Pertamax', '2026-04-20 15:03:29', '2026-04-24 14:53:45', 2, NULL),
	(74, 8, 'expense', 25000.00, '2026-04-20', 'Dicukur', '2026-04-20 15:03:49', '2026-04-24 14:53:37', 2, NULL),
	(75, 1034, 'expense', 8000.00, '2026-04-21', 'Teh anget', '2026-04-22 15:56:57', '2026-04-24 14:53:23', 2, NULL),
	(76, 1034, 'expense', 4000.00, '2026-04-22', 'aqua cindemart', '2026-04-22 15:57:16', '2026-04-24 14:53:05', 2, NULL),
	(77, 131, 'loan', 300000.00, '2026-04-23', 'berenang', '2026-04-24 07:26:25', '2026-04-24 14:52:42', 1, NULL);

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;
