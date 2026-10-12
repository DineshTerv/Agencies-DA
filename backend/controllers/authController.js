const User = require('../models/User');
const Order = require('../models/Order');
const bcrypt = require('bcrypt');

// POST /api/auth/register
exports.register = async (req, res) => {
  const { username, email, password, role, name, gender, age, phone, address, avatar } = req.body;

  const allowedRoles = ['user', 'worker', 'admin', 'CUSTOMER', 'WORKER', 'ADMIN'];
  const selectedRole = allowedRoles.includes(role) ? role : 'CUSTOMER';

  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required.' });
  }

  try {
    // Check if user already exists
    const existing = await User.findOne({ 
      $or: [
        { username: username }, 
        ...(email ? [{ email: email }] : [])
      ] 
    });

    if (existing) {
      return res.status(409).json({ message: 'Username or email already exists.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const status = (selectedRole === 'admin' || selectedRole === 'ADMIN') ? 'pending' : 'active';
    const computedAvatar = avatar || (gender === 'female' ? 'girl' : 'man');

    const newUser = new User({
      username,
      email: email || '',
      password: hashedPassword,
      name: name || username,
      role: selectedRole,
      gender: gender || 'male',
      age: age || '',
      phone: phone || '',
      address: address || '',
      avatar: computedAvatar,
      status
    });

    await newUser.save();

    return res.status(201).json({
      message: status === 'pending'
        ? 'Admin account created. Awaiting approval.'
        : 'Account created successfully. You can now log in.',
      userId: newUser._id
    });
  } catch (err) {
    console.error('Register error:', err);
    return res.status(500).json({ message: 'Server error during registration.' });
  }
};

// POST /api/auth/login
exports.login = async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required.' });
  }

  try {
    const user = await User.findOne({ username });

    if (!user) {
      return res.status(401).json({ message: 'Invalid username or password.' });
    }

    if (user.status === 'pending') {
      return res.status(403).json({ message: 'Your account is pending approval. Contact the admin.' });
    }
    if (user.status === 'inactive') {
      return res.status(403).json({ message: 'Your account has been deactivated. Contact the admin.' });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ message: 'Invalid username or password.' });
    }

    const token = `${user.role}-token-${user._id}`;

    return res.status(200).json({
      message: 'Login successful',
      token,
      role: user.role,
      username: user.username,
      name: user.name,
      userId: user._id,
      avatar: user.avatar,
      email: user.email,
      phone: user.phone,
      address: user.address
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ message: 'Server error during login.' });
  }
};

// GET /api/auth/customers
exports.getCustomers = async (req, res) => {
  try {
    const customers = await User.find({
      role: { $nin: ['ADMIN', 'admin', 'WORKER', 'worker'] }
    }).select('-password').sort({ createdAt: -1 });

    const customerMap = new Map();

    customers.forEach(u => {
      const key = (u.username || u.email || u._id.toString()).toLowerCase();
      customerMap.set(key, {
        id: u._id.toString(),
        username: u.username,
        name: u.name || u.username,
        email: u.email || '',
        phone: u.phone || '',
        address: u.address || '',
        avatar: u.avatar || 'man',
        gender: u.gender || 'male',
        age: u.age || '',
        createdAt: u.createdAt
      });
    });

    // Also include buyers from Orders collection
    try {
      const orders = await Order.find({}).sort({ createdAt: -1 });
      orders.forEach(o => {
        const usernameKey = (o.username || o.customer_name || '').toLowerCase();
        if (usernameKey && usernameKey !== 'admin' && !usernameKey.startsWith('w') && !customerMap.has(usernameKey)) {
          customerMap.set(usernameKey, {
            id: o._id ? o._id.toString() : `ord-${usernameKey}`,
            username: o.username || usernameKey,
            name: o.customer_name || usernameKey,
            email: '',
            phone: o.customer_phone || '',
            address: o.customer_address || '',
            avatar: 'man',
            gender: 'male',
            age: '',
            createdAt: o.createdAt || new Date()
          });
        }
      });
    } catch (ordErr) {
      console.warn('Orders extraction for customers notice:', ordErr.message);
    }

    return res.json(Array.from(customerMap.values()));
  } catch (err) {
    console.error('Error fetching customers:', err);
    return res.status(500).json({ message: 'Server error fetching customers.' });
  }
};
