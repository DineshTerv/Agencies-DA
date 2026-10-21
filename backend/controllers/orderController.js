const Order = require('../models/Order');
const User = require('../models/User');
const { sendOrPrepareWhatsAppMessage } = require('../utils/whatsapp');
const { sendOrderEmail, generateInvoiceHtml } = require('../utils/email');

exports.placeOrder = async (req, res) => {
  const { customer_name, customer_email, customer_phone, customer_address, username, total_amount, items } = req.body;
  
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
      variant: item.variant,
      quantity: item.quantity || 1,
      price: item.price || 0
    }));

    let finalEmail = (customer_email || '').trim();
    if (!finalEmail && username) {
      try {
        const u = await User.findOne({ username });
        if (u && u.email) finalEmail = u.email;
      } catch (uErr) {
        // continue
      }
    }

    const newOrder = new Order({
      customer_name,
      customer_email: finalEmail,
      customer_phone,
      customer_address: customer_address || '',
      username: username || customer_name,
      total_amount: total_amount || 0,
      items: formattedItems,
      status: 'PENDING'
    });

    const savedOrder = await newOrder.save();

    // Prepare or dispatch automated WhatsApp notification for the customer
    let whatsappResult = null;
    try {
      whatsappResult = await sendOrPrepareWhatsAppMessage(savedOrder, 'PENDING');
    } catch (waErr) {
      console.warn('Error preparing WhatsApp message on placeOrder:', waErr.message);
    }

    // Automatically send order invoice bill to customer email
    let emailResult = null;
    if (savedOrder.customer_email && savedOrder.customer_email.includes('@')) {
      try {
        emailResult = await sendOrderEmail(savedOrder);
      } catch (emErr) {
        console.warn('Error sending invoice email on placeOrder:', emErr.message);
      }
    }
    
    res.status(201).json({ 
      message: 'Order placed successfully', 
      orderId: savedOrder._id,
      order: savedOrder,
      whatsapp: whatsappResult,
      email: emailResult
    });
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

exports.getUserOrders = async (req, res) => {
  const { username } = req.params;
  try {
    const orders = await Order.find({
      $or: [
        { username: username },
        { customer_name: { $regex: new RegExp(`^${username}$`, 'i') } }
      ]
    }).sort({ createdAt: -1 });

    const formattedOrders = orders.map(o => {
      const oObj = o.toObject();
      oObj.id = oObj._id.toString();
      return oObj;
    });
    res.json(formattedOrders);
  } catch (error) {
    console.error('Error fetching user orders:', error);
    res.status(500).json({ message: 'Server error fetching user orders' });
  }
};

exports.updateOrderStatus = async (req, res) => {
  const { id } = req.params;
  const { status, worker_name } = req.body;
  try {
    const updatedOrder = await Order.findByIdAndUpdate(id, { status }, { new: true });
    if (!updatedOrder) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Automatically dispatch updated bill & status notification to customer's email
    let emailResult = null;
    let targetEmail = (updatedOrder.customer_email || '').trim();
    if (!targetEmail && updatedOrder.username) {
      try {
        const u = await User.findOne({ username: updatedOrder.username });
        if (u && u.email) {
          targetEmail = u.email;
          updatedOrder.customer_email = targetEmail;
          await updatedOrder.save();
        }
      } catch (uErr) {
        // continue
      }
    }

    if (targetEmail && targetEmail.includes('@')) {
      try {
        emailResult = await sendOrderEmail(updatedOrder, targetEmail);
      } catch (emErr) {
        console.warn('Error sending automated status update email:', emErr.message);
      }
    }

    // Try sending automated WhatsApp if API is configured, or return prepared WhatsApp payload
    const whatsappResult = await sendOrPrepareWhatsAppMessage(updatedOrder, status, worker_name);

    res.json({ 
      message: 'Order status updated successfully',
      order: updatedOrder,
      email: emailResult,
      whatsapp: whatsappResult
    });
  } catch (error) {
    console.error('Error updating status:', error);
    res.status(500).json({ message: 'Server error updating order status' });
  }
};

exports.notifyOrderWhatsApp = async (req, res) => {
  const { id } = req.params;
  const { status, worker_name } = req.body;
  try {
    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    const whatsappResult = await sendOrPrepareWhatsAppMessage(order, status || order.status, worker_name);
    res.json({ success: true, whatsapp: whatsappResult });
  } catch (error) {
    console.error('Error in notifyOrderWhatsApp:', error);
    res.status(500).json({ message: 'Server error sending WhatsApp notification' });
  }
};


exports.assignWorker = async (req, res) => {
  const { id } = req.params;
  const { worker_id } = req.body;
  try {
    await Order.findByIdAndUpdate(id, { worker_assigned: worker_id });
    res.json({ message: 'Worker assigned successfully' });
  } catch (error) {
    console.error('Error assigning worker:', error);
    res.status(500).json({ message: 'Server error assigning worker' });
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

exports.sendInvoiceEmail = async (req, res) => {
  const { id } = req.params;
  const { email } = req.body;
  try {
    const order = await Order.findById(id);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    
    const targetEmail = (email || order.customer_email || '').trim();
    if (!targetEmail || !targetEmail.includes('@')) {
      return res.status(400).json({ message: 'Please provide a valid email address to send the bill' });
    }

    const emailResult = await sendOrderEmail(order, targetEmail);
    if (emailResult.success) {
      res.json({ 
        success: true, 
        message: `Invoice bill successfully sent to ${targetEmail}`,
        details: emailResult 
      });
    } else {
      res.status(500).json({ 
        success: false, 
        message: `Could not send email: ${emailResult.error || emailResult.reason}`,
        details: emailResult 
      });
    }
  } catch (error) {
    console.error('Error in sendInvoiceEmail:', error);
    res.status(500).json({ message: 'Server error sending invoice email' });
  }
};

exports.downloadInvoiceHtml = async (req, res) => {
  const { id } = req.params;
  try {
    const order = await Order.findById(id);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    const html = generateInvoiceHtml(order);
    const rawId = (order._id || id).toString();
    const shortId = rawId.length > 8 ? rawId.slice(-8) : rawId;
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="Invoice_${shortId}.html"`);
    res.send(html);
  } catch (error) {
    console.error('Error downloading invoice:', error);
    res.status(500).json({ message: 'Server error downloading invoice' });
  }
};
