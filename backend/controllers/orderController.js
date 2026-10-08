const Order = require('../models/Order');

exports.placeOrder = async (req, res) => {
  const { customer_name, customer_phone, customer_address, total_amount, items } = req.body;
  
  if (!customer_name || !customer_phone) {
    return res.status(400).json({ message: 'Customer name and phone number are required' });
  }

  if (!items || items.length === 0) {
    return res.status(400).json({ message: 'Order must contain at least one item' });
  }

  try {
    const formattedItems = items.map(item => ({
      product_id: item.product_id || item.id,
      name: item.name,
      quantity: item.quantity || 1,
      price: item.price || 0
    }));

    const newOrder = new Order({
      customer_name,
      customer_phone,
      total_amount: total_amount || 0,
      items: formattedItems,
      status: 'PENDING'
    });

    const savedOrder = await newOrder.save();
    
    res.status(201).json({ message: 'Order placed successfully', orderId: savedOrder._id });
  } catch (error) {
    console.error('Order placement error:', error);
    res.status(500).json({ message: 'Server error placing order' });
  }
};

exports.getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    const formattedOrders = orders.map(o => {
      const oObj = o.toObject();
      oObj.id = oObj._id.toString();
      return oObj;
    });
    res.json(formattedOrders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ message: 'Server error fetching orders' });
  }
};

exports.updateOrderStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  try {
    await Order.findByIdAndUpdate(id, { status });
    res.json({ message: 'Order status updated successfully' });
  } catch (error) {
    console.error('Error updating status:', error);
    res.status(500).json({ message: 'Server error updating order status' });
  }
};

exports.deleteOrder = async (req, res) => {
  const { id } = req.params;
  try {
    await Order.findByIdAndDelete(id);
    res.json({ message: 'Order deleted successfully' });
  } catch (error) {
    console.error('Error deleting order:', error);
    res.status(500).json({ message: 'Server error deleting order' });
  }
};
