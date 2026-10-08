const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  stock: { type: Number, required: true, default: 0 },
  image_url: { type: String },
  category_name: { type: String, default: 'General' },
  description: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);
