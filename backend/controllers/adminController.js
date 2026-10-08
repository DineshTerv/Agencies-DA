const db = require('../db');

exports.login = async (req, res) => {
  const { username, password } = req.body;
  try {
    const [rows] = await db.query('SELECT * FROM admins WHERE username = ? AND password = ?', [username, password]);
    if (rows.length > 0) {
      // For a real app, generate and return a JWT token here
      res.json({ message: 'Login successful', adminId: rows[0].id, username: rows[0].username });
    } else {
      res.status(401).json({ message: 'Invalid credentials' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error during login' });
  }
};

exports.getDashboardStats = async (req, res) => {
  try {
    const [orderCount] = await db.query('SELECT COUNT(*) as count FROM orders');
    const [productCount] = await db.query('SELECT COUNT(*) as count FROM products');
    const [categoryCount] = await db.query('SELECT COUNT(*) as count FROM categories');
    const [revenue] = await db.query('SELECT SUM(total_amount) as total FROM orders WHERE status != "CANCELLED"');
    
    res.json({
      orders: orderCount[0].count,
      products: productCount[0].count,
      categories: categoryCount[0].count,
      totalRevenue: revenue[0].total || 0
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching stats' });
  }
};
