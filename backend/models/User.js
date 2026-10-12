const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String },
  phone: { type: String, default: '' },
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['ADMIN', 'WORKER', 'CUSTOMER', 'user', 'worker', 'admin'], default: 'CUSTOMER' },
  gender: { type: String, default: 'male' },
  age: { type: String, default: '' },
  address: { type: String, default: '' },
  avatar: { type: String, default: 'man' },
  status: { type: String, default: 'active' }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
