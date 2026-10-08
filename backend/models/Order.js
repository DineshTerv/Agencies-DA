const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  product_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  name: { type: String },
  quantity: { type: Number, required: true },
  price: { type: Number, required: true }
});

const orderSchema = new mongoose.Schema({
  customer_name: { type: String },
  customer_phone: { type: String },
  total_amount: { type: Number, required: true },
  items: [orderItemSchema],
  status: { 
    type: String, 
    enum: ['PENDING', 'CONFIRMED', 'PREPARING', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'],
    default: 'PENDING'
  },
  worker_assigned: { type: String, default: null } // could be ObjectId ref to Worker if you make a User model
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);
