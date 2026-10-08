const db = require('../db');

exports.getAllProducts = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT p.*, c.name as category_name 
      FROM products p 
      LEFT JOIN categories c ON p.category_id = c.id
      ORDER BY p.created_at DESC
    `);
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching products' });
  }
};

exports.getProductById = async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await db.query('SELECT * FROM products WHERE id = ?', [id]);
    if (rows.length === 0) return res.status(404).json({ message: 'Product not found' });
    res.json(rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching product' });
  }
};

exports.createProduct = async (req, res) => {
  const { category_id, name, description, price, image_url, stock, is_active } = req.body;
  try {
    const [result] = await db.query(
      'INSERT INTO products (category_id, name, description, price, image_url, stock, is_active) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [category_id, name, description, price, image_url, stock || 0, is_active !== undefined ? is_active : true]
    );
    res.status(201).json({ id: result.insertId, message: 'Product created successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error creating product' });
  }
};

exports.updateProduct = async (req, res) => {
  const { id } = req.params;
  const { category_id, name, description, price, image_url, stock, is_active } = req.body;
  try {
    await db.query(
      'UPDATE products SET category_id = ?, name = ?, description = ?, price = ?, image_url = ?, stock = ?, is_active = ? WHERE id = ?',
      [category_id, name, description, price, image_url, stock, is_active, id]
    );
    res.json({ message: 'Product updated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error updating product' });
  }
};

exports.deleteProduct = async (req, res) => {
  const { id } = req.params;
  try {
    await db.query('DELETE FROM products WHERE id = ?', [id]);
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error deleting product' });
  }
};
