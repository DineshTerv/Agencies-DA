const db = require('../db');

exports.placeOrder = async (req, res) => {
  const { customer_name, customer_phone, customer_address, total_amount, items } = req.body;
  
  if (!customer_name || !customer_phone) {
    return res.status(400).json({ message: 'Customer name and phone number are required' });
  }

  if (!items || items.length === 0) {
    return res.status(400).json({ message: 'Order must contain at least one item' });
  }

  let connection;
  try {
    connection = await db.getConnection();
    await connection.beginTransaction();
    
    // Insert order
    const [orderResult] = await connection.query(
      'INSERT INTO orders (customer_name, customer_phone, customer_address, total_amount, status) VALUES (?, ?, ?, ?, ?)',
      [customer_name, customer_phone, customer_address || '', total_amount || 0, 'PENDING']
    );
    const orderId = orderResult.insertId;

    // Insert order items
    for (let item of items) {
      const prodId = Number.isInteger(Number(item.product_id || item.id)) ? Number(item.product_id || item.id) : null;
      try {
        await connection.query(
          'INSERT INTO order_items (order_id, product_id, quantity, price_at_time) VALUES (?, ?, ?, ?)',
          [orderId, prodId, item.quantity || 1, item.price || 0]
        );
      } catch (itemErr) {
        console.warn('Could not insert FK item:', itemErr.message);
      }
    }

    await connection.commit();
    res.status(201).json({ message: 'Order placed successfully', orderId });
  } catch (error) {
    if (connection) await connection.rollback();
    console.error('Order placement error:', error);
    res.status(500).json({ message: 'Server error placing order' });
  } finally {
    if (connection) connection.release();
  }
};

exports.getAllOrders = async (req, res) => {
  try {
    const [orders] = await db.query('SELECT * FROM orders ORDER BY created_at DESC');
    
    // Fetch items for each order
    for (let order of orders) {
      try {
        const [items] = await db.query(`
          SELECT oi.*, COALESCE(p.name, 'Item') as product_name, p.image_url 
          FROM order_items oi 
          LEFT JOIN products p ON oi.product_id = p.id 
          WHERE oi.order_id = ?
        `, [order.id]);
        order.items = items;
      } catch (err) {
        order.items = [];
      }
    }
    
    res.json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ message: 'Server error fetching orders' });
  }
};

exports.updateOrderStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  try {
    await db.query('UPDATE orders SET status = ? WHERE id = ?', [status, id]);
    res.json({ message: 'Order status updated successfully' });
  } catch (error) {
    console.error('Error updating status:', error);
    res.status(500).json({ message: 'Server error updating order status' });
  }
};

exports.deleteOrder = async (req, res) => {
  const { id } = req.params;
  try {
    await db.query('DELETE FROM orders WHERE id = ?', [id]);
    res.json({ message: 'Order deleted successfully' });
  } catch (error) {
    console.error('Error deleting order:', error);
    res.status(500).json({ message: 'Server error deleting order' });
  }
};
