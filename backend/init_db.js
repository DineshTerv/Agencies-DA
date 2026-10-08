const mysql = require('mysql2/promise');
require('dotenv').config();

async function initDB() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
    });

    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME}\`;`);
    console.log(`Database ${process.env.DB_NAME} created or already exists.`);

    await connection.query(`USE \`${process.env.DB_NAME}\`;`);

    // ============================================================
    // UNIFIED USERS TABLE  (self-registration, role-based access)
    // role: 'admin' | 'worker' | 'user'
    // status: 'active' | 'pending' | 'inactive'
    // Admin accounts start as 'pending' until approved by owner.
    // ============================================================
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(100) NOT NULL UNIQUE,
        email VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        role ENUM('admin', 'worker', 'user') NOT NULL DEFAULT 'user',
        status ENUM('active', 'pending', 'inactive') NOT NULL DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log("Users table ready.");

    // Legacy Admins Table (kept for backward compatibility)
    await connection.query(`
      CREATE TABLE IF NOT EXISTS admins (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log("Admins table ready.");

    // Categories Table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log("Categories table ready.");

    // Products Table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS products (
        id INT AUTO_INCREMENT PRIMARY KEY,
        category_id INT,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        price DECIMAL(10, 2) NOT NULL,
        image_url VARCHAR(255),
        is_active BOOLEAN DEFAULT TRUE,
        stock INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
      );
    `);
    console.log("Products table ready.");

    // Orders Table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id INT AUTO_INCREMENT PRIMARY KEY,
        customer_name VARCHAR(255) NOT NULL,
        customer_phone VARCHAR(50) NOT NULL,
        customer_address TEXT NOT NULL,
        total_amount DECIMAL(10, 2) NOT NULL,
        status ENUM('PENDING', 'CONFIRMED', 'PREPARING', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED') DEFAULT 'PENDING',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log("Orders table ready.");

    // Order Items Table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS order_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        order_id INT NOT NULL,
        product_id INT,
        quantity INT NOT NULL,
        price_at_time DECIMAL(10, 2) NOT NULL,
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
      );
    `);
    console.log("Order items table ready.");

    // Insert Default Admin into legacy admins table
    const [adminRows] = await connection.query('SELECT * FROM admins WHERE username = ?', ['admin']);
    if (adminRows.length === 0) {
      await connection.query('INSERT INTO admins (username, password) VALUES (?, ?)', ['admin', 'admin123']);
      console.log("Default admin created in admins table (admin / admin123).");
    }

    // Insert Default Admin into new users table (bcrypt hashed)
    const bcrypt = require('bcrypt');
    const [userAdminRows] = await connection.query('SELECT * FROM users WHERE username = ?', ['admin']);
    if (userAdminRows.length === 0) {
      const hashedPw = await bcrypt.hash('admin123', 10);
      await connection.query(
        'INSERT INTO users (username, email, password, role, status) VALUES (?, ?, ?, ?, ?)',
        ['admin', 'admin@dineshagencies.com', hashedPw, 'admin', 'active']
      );
      console.log("Default admin user created in users table (admin / admin123).");
    }

    // Insert Default Worker into users table
    const [userWorkerRows] = await connection.query('SELECT * FROM users WHERE username = ?', ['W101']);
    if (userWorkerRows.length === 0) {
      const hashedPw = await bcrypt.hash('worker123', 10);
      await connection.query(
        'INSERT INTO users (username, email, password, role, status) VALUES (?, ?, ?, ?, ?)',
        ['W101', 'worker101@dineshagencies.com', hashedPw, 'worker', 'active']
      );
      console.log("Default worker user created in users table (W101 / worker123).");
    }

    // Insert Initial Categories
    const categories = ['Chocolates', 'Lollipops', 'Choco Pie', 'Agarbatti', 'Cooking Oil', 'Dish Wash', 'Other Products'];
    for (const cat of categories) {
      const [rows] = await connection.query('SELECT * FROM categories WHERE name = ?', [cat]);
      if (rows.length === 0) {
        await connection.query('INSERT INTO categories (name) VALUES (?)', [cat]);
        console.log(`Category '${cat}' inserted.`);
      }
    }

    console.log("Database initialization completed successfully.");
    await connection.end();
  } catch (error) {
    console.error("Error initializing database:", error);
    process.exit(1);
  }
}

initDB();
