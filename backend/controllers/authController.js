const db = require('../db');
const bcrypt = require('bcrypt');

// POST /api/auth/register
exports.register = async (req, res) => {
  const { username, email, password, role } = req.body;

  // Only allow valid roles — admin must be approved by owner, so default pending
  const allowedRoles = ['user', 'worker', 'admin'];
  const selectedRole = allowedRoles.includes(role) ? role : 'user';

  if (!username || !email || !password) {
    return res.status(400).json({ message: 'All fields are required.' });
  }

  try {
    // Check if username or email already taken
    const [existing] = await db.query(
      'SELECT id FROM users WHERE username = ? OR email = ?',
      [username, email]
    );
    if (existing.length > 0) {
      return res.status(409).json({ message: 'Username or email already exists.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Admin accounts start as pending until approved
    const status = selectedRole === 'admin' ? 'pending' : 'active';

    await db.query(
      'INSERT INTO users (username, email, password, role, status) VALUES (?, ?, ?, ?, ?)',
      [username, email, hashedPassword, selectedRole, status]
    );

    return res.status(201).json({
      message: selectedRole === 'admin'
        ? 'Admin account created. Awaiting approval.'
        : 'Account created successfully. You can now log in.'
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
    const [rows] = await db.query(
      'SELECT * FROM users WHERE username = ?',
      [username]
    );

    if (rows.length === 0) {
      return res.status(401).json({ message: 'Invalid username or password.' });
    }

    const user = rows[0];

    // Check account status
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

    // Return user info + role (no JWT for now, simple token demo)
    const token = `${user.role}-token-${user.id}`;

    return res.status(200).json({
      message: 'Login successful',
      token,
      role: user.role,
      username: user.username,
      userId: user.id
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ message: 'Server error during login.' });
  }
};
