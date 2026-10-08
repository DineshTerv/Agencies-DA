-- ================================================================
--   DINESH AGENCIES — USER AUTHENTICATION SQL SCHEMA
--   Run this in MySQL to set up the full auth system.
-- ================================================================

CREATE DATABASE IF NOT EXISTS `dinesh_agencies_db`;
USE `dinesh_agencies_db`;

-- ----------------------------------------------------------------
-- USERS TABLE — Self-registration with role-based access
-- role  : 'admin' | 'worker' | 'user'
-- status: 'active' (can login) | 'pending' (awaiting approval)
--         | 'inactive' (deactivated by admin)
--
-- HOW IT WORKS:
--   1. Anyone can register at /login  → picks their role
--   2. 'user' and 'worker' accounts → status = 'active' instantly
--   3. 'admin' accounts             → status = 'pending' (owner approves)
--   4. On login, backend checks role → redirects to correct portal
-- ----------------------------------------------------------------

CREATE TABLE IF NOT EXISTS users (
  id          INT          AUTO_INCREMENT PRIMARY KEY,
  username    VARCHAR(100) NOT NULL UNIQUE,
  email       VARCHAR(255) NOT NULL UNIQUE,
  password    VARCHAR(255) NOT NULL,           -- bcrypt hashed
  role        ENUM('admin','worker','user')    NOT NULL DEFAULT 'user',
  status      ENUM('active','pending','inactive') NOT NULL DEFAULT 'active',
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------
-- SEED: Default admin account
-- Password: admin123  (bcrypt hash generated at runtime by init_db.js)
-- ----------------------------------------------------------------
-- INSERT INTO users (username, email, password, role, status)
-- VALUES ('admin', 'admin@dineshagencies.com', '<bcrypt_hash>', 'admin', 'active');
-- NOTE: Run `node backend/init_db.js` to auto-create this with proper bcrypt hash.

-- ----------------------------------------------------------------
-- LEGACY TABLES (kept for backward compatibility)
-- ----------------------------------------------------------------

CREATE TABLE IF NOT EXISTS admins (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  username   VARCHAR(255) NOT NULL UNIQUE,
  password   VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS categories (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS products (
  id          INT          AUTO_INCREMENT PRIMARY KEY,
  category_id INT,
  name        VARCHAR(255) NOT NULL,
  description TEXT,
  price       DECIMAL(10,2) NOT NULL,
  image_url   VARCHAR(512),
  is_active   BOOLEAN       DEFAULT TRUE,
  stock       INT           DEFAULT 0,
  created_at  TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS orders (
  id               INT           AUTO_INCREMENT PRIMARY KEY,
  customer_name    VARCHAR(255)  NOT NULL,
  customer_phone   VARCHAR(50)   NOT NULL,
  customer_address TEXT          NOT NULL,
  total_amount     DECIMAL(10,2) NOT NULL,
  status           ENUM(
    'PENDING','CONFIRMED','PREPARING',
    'OUT_FOR_DELIVERY','DELIVERED','CANCELLED'
  ) DEFAULT 'PENDING',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS order_items (
  id             INT           AUTO_INCREMENT PRIMARY KEY,
  order_id       INT           NOT NULL,
  product_id     INT,
  quantity       INT           NOT NULL,
  price_at_time  DECIMAL(10,2) NOT NULL,
  FOREIGN KEY (order_id)   REFERENCES orders(id)   ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
);

-- ----------------------------------------------------------------
-- USEFUL QUERIES
-- ----------------------------------------------------------------

-- View all users with their roles and statuses:
-- SELECT id, username, email, role, status, created_at FROM users ORDER BY created_at DESC;

-- Approve a pending admin:
-- UPDATE users SET status = 'active' WHERE username = 'someadmin' AND role = 'admin';

-- Deactivate a user:
-- UPDATE users SET status = 'inactive' WHERE id = <user_id>;

-- Count users by role:
-- SELECT role, COUNT(*) AS total FROM users GROUP BY role;
