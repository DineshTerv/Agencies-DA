# Dinesh Agencies - FMCG Wholesale & Distribution 
## End-to-End Architecture & Implementation Guide

---

### 1. DIRECTORY STRUCTURE

#### Backend (`server/`)
```text
backend/
├── .env
├── .env.example
├── package.json
├── server.js
├── db.js
├── middleware/
│   ├── authMiddleware.js
│   └── roleMiddleware.js
├── models/
│   ├── User.js
│   ├── Product.js
│   └── Order.js
├── controllers/
│   ├── authController.js
│   ├── productController.js
│   ├── orderController.js
│   └── analyticsController.js
└── routes/
    ├── authRoutes.js
    ├── productRoutes.js
    ├── orderRoutes.js
    └── analyticsRoutes.js
```

#### Frontend (`client/`)
```text
frontend/
├── .env
├── package.json
├── vite.config.js
├── index.html
├── src/
│   ├── main.jsx
│   ├── App.jsx
│   ├── App.css
│   ├── components/
│   │   ├── Navbar.jsx
│   │   ├── ProtectedRoute.jsx
│   │   ├── ProductCard.jsx
│   │   └── CartDrawer.jsx
│   ├── pages/
│   │   ├── Auth/
│   │   │   └── Login.jsx
│   │   ├── Customer/
│   │   │   ├── Home.jsx
│   │   │   └── OrderTracker.jsx
│   │   ├── Worker/
│   │   │   └── WorkerDashboard.jsx
│   │   └── Admin/
│   │       ├── AdminDashboard.jsx
│   │       └── Inventory.jsx
│   └── context/
│       ├── AuthContext.jsx
│       └── CartContext.jsx
```

---

### 2. CONFIGURATION FILES

#### `.env.example` (Backend)
```env
PORT=5000
MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/dinesh_agencies?retryWrites=true&w=majority
JWT_SECRET=your_super_secret_jwt_key
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

#### `package.json` (Backend)
```json
{
  "name": "dinesh-agencies-api",
  "version": "1.0.0",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  },
  "dependencies": {
    "bcryptjs": "^2.4.3",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1",
    "express": "^4.18.2",
    "jsonwebtoken": "^9.0.2",
    "mongoose": "^7.5.0"
  },
  "devDependencies": {
    "nodemon": "^3.0.1"
  }
}
```

---

### 3. DATABASE SCHEMAS (Mongoose)

#### `models/User.js`
```javascript
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['Customer', 'Worker', 'Admin'], default: 'Customer' },
  phone: { type: String },
  address: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
```

#### `models/Product.js`
```javascript
const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: { type: String, required: true },
  price: { type: Number, required: true },
  discount: { type: Number, default: 0 },
  stockQuantity: { type: Number, required: true, default: 0 },
  images: [{ type: String }], // Cloudinary URLs
  description: { type: String },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);
```

#### `models/Order.js`
```javascript
const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  workerAssigned: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  items: [{
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    quantity: { type: Number, required: true },
    price: { type: Number, required: true }
  }],
  totalAmount: { type: Number, required: true },
  discountAmount: { type: Number, default: 0 },
  deliveryStatus: { 
    type: String, 
    enum: ['Pending', 'Out for Delivery', 'Delivered', 'Failed'], 
    default: 'Pending' 
  },
  paymentStatus: { type: String, enum: ['Pending', 'Paid'], default: 'Pending' },
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);
```

---

### 4. BACKEND ROUTES & CONTROLLERS (Express)

#### `middleware/authMiddleware.js`
```javascript
const jwt = require('jsonwebtoken');
const User = require('../models/User');

exports.protect = async (req, res, next) => {
  let token = req.headers.authorization;
  if (token && token.startsWith('Bearer')) {
    try {
      token = token.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select('-password');
      return next();
    } catch (error) {
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }
  res.status(401).json({ message: 'Not authorized, no token' });
};

exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: `User role ${req.user.role} is not authorized` });
    }
    next();
  };
};
```

#### `routes/orderRoutes.js`
```javascript
const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const orderController = require('../controllers/orderController');

router.post('/', protect, orderController.createOrder);
router.get('/', protect, orderController.getOrders);
router.patch('/:id/assign', protect, authorize('Admin'), orderController.assignWorker);
router.patch('/:id/status', protect, authorize('Worker', 'Admin'), orderController.updateStatus);

module.exports = router;
```

#### `controllers/orderController.js`
```javascript
const Order = require('../models/Order');

exports.createOrder = async (req, res) => {
  try {
    const { items, totalAmount, discountAmount } = req.body;
    const order = await Order.create({
      customer: req.user.id,
      items, totalAmount, discountAmount
    });
    res.status(201).json(order);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getOrders = async (req, res) => {
  try {
    let query = {};
    if (req.user.role === 'Customer') query.customer = req.user.id;
    if (req.user.role === 'Worker') query.workerAssigned = req.user.id;
    
    const orders = await Order.find(query).populate('customer', 'name address phone');
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
```

---

### 5. FRONTEND ARCHITECTURE (React)

#### `src/App.jsx` (Protected Routing)
```jsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

import Home from './pages/Customer/Home';
import Login from './pages/Auth/Login';
import WorkerDashboard from './pages/Worker/WorkerDashboard';
import AdminDashboard from './pages/Admin/AdminDashboard';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          {/* Customer Routes */}
          <Route path="/" element={<Home />} />

          {/* Worker Routes */}
          <Route element={<ProtectedRoute allowedRoles={['Worker', 'Admin']} />}>
            <Route path="/worker/dashboard" element={<WorkerDashboard />} />
          </Route>

          {/* Admin Routes */}
          <Route element={<ProtectedRoute allowedRoles={['Admin']} />}>
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
```

#### `src/components/ProtectedRoute.jsx`
```jsx
import { Navigate, Outlet } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

const ProtectedRoute = ({ allowedRoles }) => {
  const { user, loading } = useContext(AuthContext);

  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (!allowedRoles.includes(user.role)) return <Navigate to="/" replace />;

  return <Outlet />;
};

export default ProtectedRoute;
```
