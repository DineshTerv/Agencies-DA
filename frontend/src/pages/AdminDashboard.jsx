import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, Package, ShoppingBag, LogOut, Plus, Edit2, Trash2, X, Users, User,
  Eye, Phone, MapPin, Calendar, Clock, CheckCircle, AlertCircle, Search, RefreshCw 
} from 'lucide-react';
import { ResponsiveContainer, ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import './Admin.css';
import MotivationCarousel from '../components/MotivationCarousel';
import { PRODUCTS_DATA } from '../data/products';
import axios from 'axios';

const INITIAL_DEMO_ORDERS = [
  {
    id: "ORD-100234",
    customer_name: "Ramesh Kumar (Ganesh Maligai)",
    customer_phone: "9876543210",
    customer_address: "12/4 Cross Street, Near Bus Stand, Dharmapuri - 636701",
    username: "ramesh",
    total_amount: 1450,
    status: "CONFIRMED",
    created_at: new Date(Date.now() - 3600000 * 2).toLocaleString(),
    items: [
      { id: "L001", name: "Lacto King (Jar)", quantity: 3, price: 180 },
      { id: "C001", name: "Cycle Three in One Agarbatti", quantity: 5, price: 110 },
      { id: "P001", name: "Pitambari Shining Powder 1kg", quantity: 4, price: 90 }
    ]
  },
  {
    id: "ORD-100235",
    customer_name: "K. Nallathambi",
    customer_phone: "9443695071",
    customer_address: "DA Main Warehouse, Salem Road",
    username: "nallathambi",
    total_amount: 3200,
    status: "PREPARING",
    created_at: new Date(Date.now() - 3600000 * 5).toLocaleString(),
    items: [
      { id: "L002", name: "Coconut Punch (Jar)", quantity: 5, price: 180 },
      { id: "L010", name: "Lotte Choco Pie (Box 12s)", quantity: 10, price: 150 },
      { id: "P002", name: "Sanitall Toilet Cleaner 500ml", quantity: 8, price: 95 }
    ]
  },
  {
    id: "ORD-100236",
    customer_name: "Priya Supermarket",
    customer_phone: "9123456780",
    customer_address: "Shop #45, Gandhi Bazaar, Dharmapuri",
    username: "priya_stores",
    total_amount: 850,
    status: "PENDING",
    created_at: new Date(Date.now() - 3600000 * 8).toLocaleString(),
    items: [
      { id: "L016", name: "BooProo Gum (Pack)", quantity: 20, price: 10 },
      { id: "C002", name: "Royal Sandal Agarbatti", quantity: 5, price: 130 }
    ]
  }
];

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [products, setProducts] = useState(PRODUCTS_DATA);
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('ALL');
  
  const daUsers = JSON.parse(localStorage.getItem('da_users') || '[]');
  
  const [workers, setWorkers] = useState(() => {
    const saved = localStorage.getItem('da_workers');
    if (saved) return JSON.parse(saved);
    const initial = [
      { id: 'W101', name: 'Ramesh (Field Agent)', phone: '9876543210', password: 'worker123' },
      { id: 'W102', name: 'Suresh (Delivery)', phone: '9845123456', password: 'worker123' }
    ];
    localStorage.setItem('da_workers', JSON.stringify(initial));
    return initial;
  });

  useEffect(() => {
    localStorage.setItem('da_workers', JSON.stringify(workers));
  }, [workers]);
  
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isWorkerModalOpen, setIsWorkerModalOpen] = useState(false);
  const [currentProduct, setCurrentProduct] = useState({ name: '', category_id: 1, price: '', stock: '', description: '' });
  const [currentWorker, setCurrentWorker] = useState({ name: '', phone: '', password: '' });
  const [timeFilter, setTimeFilter] = useState('Daily');

  const navigate = useNavigate();

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  const loadOrders = async () => {
    try {
      const res = await axios.get(`${API_URL}/orders`);
      if (res.data) {
        const formatted = res.data.map(order => ({
          ...order,
          created_at: new Date(order.created_at).toLocaleString(),
          items: order.items || []
        }));
        setOrders(formatted);
      }
    } catch (err) {
      console.error("Error fetching orders:", err.message);
      setOrders(INITIAL_DEMO_ORDERS);
    }
  };

  const loadProducts = async () => {
    try {
      const res = await axios.get(`${API_URL}/products`);
      if (res.data) setProducts(res.data);
    } catch (err) {
      console.error("Error fetching products:", err.message);
      setProducts(PRODUCTS_DATA);
    }
  };

  useEffect(() => {
    if (!localStorage.getItem('adminToken')) {
      navigate('/login');
    }
    loadOrders();
    loadProducts();
  }, [navigate]);

  const handleLogout = () => {
    ['authToken', 'adminToken', 'workerToken', 'username', 'workerId', 'userRole'].forEach(key => localStorage.removeItem(key));
    navigate('/login');
  };

  const handleStatusChange = async (orderId, newStatus) => {
    const updated = orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o);
    setOrders(updated);
    if (selectedOrder && selectedOrder.id === orderId) {
      setSelectedOrder({ ...selectedOrder, status: newStatus });
    }

    try {
      await axios.put(`${API_URL}/orders/${orderId}/status`, { status: newStatus });
      // Reload products if delivered, because stock might have been deducted by backend
      if (newStatus === 'DELIVERED') {
         loadProducts();
      }
    } catch (e) {
      console.error('API update failed', e);
    }
  };

  const handleWorkerAssign = async (orderId, workerId) => {
    const updated = orders.map(o => o.id === orderId ? { ...o, worker_assigned: workerId } : o);
    setOrders(updated);
    if (selectedOrder && selectedOrder.id === orderId) {
      setSelectedOrder({ ...selectedOrder, worker_assigned: workerId });
    }
    
    try {
      await axios.put(`${API_URL}/orders/${orderId}/assign`, { worker_id: workerId });
    } catch (e) {
      console.error('API update failed', e);
      alert('Failed to assign worker to order on backend.');
    }
  };

  const handleDeleteOrder = async (orderId) => {
    if (window.confirm(`Are you sure you want to delete Order #${orderId}?`)) {
      setOrders(orders.filter(o => o.id !== orderId));
      if (selectedOrder && selectedOrder.id === orderId) setSelectedOrder(null);
      try {
        await axios.delete(`${API_URL}/orders/${orderId}`);
      } catch (e) {
        console.error('API delete failed', e);
      }
    }
  };

  const openAddModal = () => {
    setCurrentProduct({ name: '', category_id: 1, price: '', stock: '', description: '', image_url: '' });
    setIsProductModalOpen(true);
  };

  const openEditModal = (product) => {
    setCurrentProduct(product);
    setIsProductModalOpen(true);
  };

  const handleProductSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...currentProduct, category_name: currentProduct.category_name || "General" };
      if (currentProduct.id) {
        await axios.put(`${API_URL}/products/${currentProduct.id}`, payload);
      } else {
        await axios.post(`${API_URL}/products`, payload);
      }
      loadProducts();
      setIsProductModalOpen(false);
    } catch (error) {
      console.error("Failed to save product", error);
      alert("Failed to save product to database.");
    }
  };

  const handleWorkerSubmit = (e) => {
    e.preventDefault();
    const newId = 'W' + (100 + workers.length + 1);
    setWorkers([...workers, { ...currentWorker, id: newId }]);
    setIsWorkerModalOpen(false);
  };

  const deleteProduct = async (id) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await axios.delete(`${API_URL}/products/${id}`);
        setProducts(products.filter(p => p.id !== id));
      } catch (error) {
        console.error("Failed to delete product", error);
      }
    }
  };

  // Filtered Orders List
  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      (order.customer_name && order.customer_name.toLowerCase().includes(orderSearch.toLowerCase())) ||
      (order.customer_phone && order.customer_phone.includes(orderSearch)) ||
      (String(order.id).toLowerCase().includes(orderSearch.toLowerCase())) ||
      (order.customer_address && order.customer_address.toLowerCase().includes(orderSearch.toLowerCase()));
    
    const matchesStatus = orderStatusFilter === 'ALL' || order.status === orderStatusFilter;
    return matchesSearch && matchesStatus;
  });

  // Calculate live stats
  const totalRevenue = orders.reduce((sum, o) => sum + Number(o.total_amount || 0), 0);
  const pendingCount = orders.filter(o => o.status === 'PENDING').length;
  const confirmedCount = orders.filter(o => o.status === 'CONFIRMED' || o.status === 'PREPARING').length;
  const deliveredCount = orders.filter(o => o.status === 'DELIVERED').length;

  const salesChartData = [
    { date: '1 Oct', products: 42, target: 50 },
    { date: '2 Oct', products: 66, target: 70 },
    { date: '3 Oct', products: 49, target: 60 },
    { date: '4 Oct', products: 14, target: 20 },
    { date: '5 Oct', products: 186, target: 190 },
    { date: '6 Oct', products: 95, target: 100 }
  ];

  const revenueChartData = [
    { month: 'May', revenue: 66, expected: 70 },
    { month: 'Jun', revenue: 72, expected: 75 },
    { month: 'Jul', revenue: 188, expected: 190 },
    { month: 'Aug', revenue: 95, expected: 100 },
    { month: 'Sep', revenue: 150, expected: 160 }
  ];

  return (
    <div className="admin-layout">
      {/* Sidebar Navigation */}
      <aside className="admin-sidebar glass">
        <h2>DA-ADMIN PAGE</h2>

        <nav>
          <button 
            className={`nav-btn ${activeTab === 'dashboard' ? 'active' : ''}`} 
            onClick={() => setActiveTab('dashboard')}
          >
            <LayoutDashboard size={20} /> Overview
          </button>

          <button 
            className={`nav-btn ${activeTab === 'orders' ? 'active' : ''}`} 
            onClick={() => { setActiveTab('orders'); loadOrders(); }}
          >
            <ShoppingBag size={20} /> Orders ({orders.length})
          </button>

          <button 
            className={`nav-btn ${activeTab === 'products' ? 'active' : ''}`} 
            onClick={() => setActiveTab('products')}
          >
            <Package size={20} /> Products ({products.length})
          </button>

          <button 
            className={`nav-btn ${activeTab === 'workers' ? 'active' : ''}`} 
            onClick={() => setActiveTab('workers')}
          >
            <Users size={20} /> Workers ({workers.length})
          </button>

          <button 
            className={`nav-btn ${activeTab === 'customers' ? 'active' : ''}`} 
            onClick={() => setActiveTab('customers')}
          >
            <User size={20} /> Customers ({daUsers.length})
          </button>
        </nav>

        <button className="logout-btn" onClick={handleLogout}>
          <LogOut size={20} /> Logout
        </button>
      </aside>

      {/* Main Content Area */}
      <main className="admin-main">
        {/* ── OVERVIEW TAB ── */}
        {activeTab === 'dashboard' && (
          <div className="dashboard-container">
            <div className="section-header">
              <h1>Dashboard Overview</h1>
              <button className="refresh-btn" onClick={loadOrders} title="Reload Data">
                <RefreshCw size={16} /> Refresh
              </button>
            </div>

            {/* Live Metrics Cards */}
            <div className="metric-cards-row">
              <div className="metric-card">
                <div className="mc-icon" style={{background: 'rgba(255, 159, 67, 0.15)', color: '#ff9f43'}}>
                  <ShoppingBag size={28} />
                </div>
                <div className="mc-content">
                  <h3>{orders.length}</h3>
                  <p>Total Customer Orders</p>
                  <span className="mc-badge success">{pendingCount} Pending confirmation</span>
                </div>
              </div>

              <div className="metric-card">
                <div className="mc-icon" style={{background: 'rgba(29, 209, 161, 0.15)', color: '#1dd1a1'}}>
                  <CheckCircle size={28} />
                </div>
                <div className="mc-content">
                  <h3>₹{totalRevenue.toLocaleString()}</h3>
                  <p>Total Order Revenue</p>
                  <span className="mc-badge success">{deliveredCount} Orders Delivered</span>
                </div>
              </div>

              <div className="metric-card">
                <div className="mc-icon" style={{background: 'rgba(108, 92, 231, 0.15)', color: '#6c5ce7'}}>
                  <Package size={28} />
                </div>
                <div className="mc-content">
                  <h3>{products.length}</h3>
                  <p>Catalog Products</p>
                  <span className="mc-badge success">All categories active</span>
                </div>
              </div>

              <div className="metric-card">
                <div className="mc-icon" style={{background: 'rgba(0, 184, 148, 0.15)', color: '#00b894'}}>
                  <Users size={28} />
                </div>
                <div className="mc-content">
                  <h3>{workers.length}</h3>
                  <p>Active Field Workers</p>
                  <span className="mc-badge success">Online</span>
                </div>
              </div>
            </div>

            {/* Charts Row */}
            <div className="charts-row">
              <div className="chart-card">
                <h3>Products Sold Trend (Last 7 Days)</h3>
                <p className="chart-sub">Daily breakdown of units sold</p>
                <div className="chart-wrapper">
                  <ResponsiveContainer width="100%" height={260}>
                    <ComposedChart data={salesChartData} margin={{ top: 10, right: 10, bottom: 10, left: -20 }}>
                      <CartesianGrid stroke="#f5f5f5" strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#a0a0a0', fontSize: 12}} />
                      <YAxis axisLine={false} tickLine={false} tick={{fill: '#a0a0a0', fontSize: 12}} />
                      <Tooltip />
                      <Bar dataKey="products" barSize={26} fill="#ff9f43" radius={[4, 4, 0, 0]} />
                      <Line type="monotone" dataKey="target" stroke="#ff4757" strokeWidth={2.5} dot={{r: 3}} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="chart-card">
                <h3>Revenue Growth Analysis</h3>
                <p className="chart-sub">Monthly wholesale performance</p>
                <div className="chart-wrapper">
                  <ResponsiveContainer width="100%" height={260}>
                    <ComposedChart data={revenueChartData} margin={{ top: 10, right: 10, bottom: 10, left: -20 }}>
                      <CartesianGrid stroke="#f5f5f5" strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#a0a0a0', fontSize: 12}} />
                      <YAxis axisLine={false} tickLine={false} tick={{fill: '#a0a0a0', fontSize: 12}} />
                      <Tooltip />
                      <Bar dataKey="revenue" barSize={26} fill="#1dd1a1" radius={[4, 4, 0, 0]} />
                      <Line type="monotone" dataKey="expected" stroke="#6c5ce7" strokeWidth={2.5} dot={{r: 3}} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── ORDERS TAB ── */}
        {activeTab === 'orders' && (
          <div>
            <div className="section-header">
              <div>
                <h1>Customer Order Management</h1>
                <p style={{color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px'}}>
                  All incoming orders from Customers and Stores with complete delivery information
                </p>
              </div>
              <button className="refresh-btn" onClick={loadOrders} style={{background: 'var(--primary-color)', color: '#fff'}}>
                <RefreshCw size={16} /> Sync Orders
              </button>
            </div>

            {/* Orders Filter & Search Toolbar */}
            <div className="orders-toolbar glass">
              <div className="search-box">
                <Search size={18} color="#888" />
                <input 
                  type="text" 
                  placeholder="Search by customer name, phone, address, or Order ID..." 
                  value={orderSearch}
                  onChange={e => setOrderSearch(e.target.value)}
                />
              </div>

              <div className="status-filter-group">
                <label>Filter Status:</label>
                <select 
                  value={orderStatusFilter} 
                  onChange={e => setOrderStatusFilter(e.target.value)}
                  className="status-select"
                >
                  <option value="ALL">All Orders ({orders.length})</option>
                  <option value="PENDING">PENDING ({orders.filter(o => o.status === 'PENDING').length})</option>
                  <option value="CONFIRMED">CONFIRMED</option>
                  <option value="PREPARING">PREPARING</option>
                  <option value="OUT_FOR_DELIVERY">OUT FOR DELIVERY</option>
                  <option value="DELIVERED">DELIVERED</option>
                  <option value="CANCELLED">CANCELLED</option>
                </select>
              </div>
            </div>

            {/* Orders Table */}
            <div className="table-container glass">
              {filteredOrders.length === 0 ? (
                <div style={{textAlign: 'center', padding: '3rem', color: 'var(--text-muted)'}}>
                  <ShoppingBag size={48} style={{opacity: 0.3, marginBottom: '1rem'}} />
                  <h3>No Orders Found</h3>
                  <p>When customers place orders from the Cart, they will appear right here!</p>
                </div>
              ) : (
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Order ID</th>
                      <th>Customer Details</th>
                      <th>Delivery Address</th>
                      <th>Items</th>
                      <th>Total (₹)</th>
                      <th>Date / Time</th>
                      <th>Status</th>
                      <th>Worker</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrders.map(order => (
                      <tr key={order.id} style={{verticalAlign: 'middle'}}>
                        <td>
                          <span className="order-id-chip">#{order.id}</span>
                        </td>
                        <td>
                          <div className="customer-info-cell">
                            <strong>{order.customer_name}</strong>
                            <a href={`tel:${order.customer_phone}`} className="cust-phone-link">
                              <Phone size={13} /> {order.customer_phone}
                            </a>
                          </div>
                        </td>
                        <td>
                          <div className="address-cell" title={order.customer_address}>
                            <MapPin size={13} style={{flexShrink: 0, marginTop: '3px', color: '#ff9f43'}} />
                            <span>{order.customer_address || 'Address not provided'}</span>
                          </div>
                        </td>
                        <td>
                          <span className="items-count-badge">
                            {order.items ? `${order.items.length} items` : '1 item'}
                          </span>
                        </td>
                        <td>
                          <strong style={{color: 'var(--primary-dark)', fontSize: '1.05rem'}}>
                            ₹{order.total_amount}
                          </strong>
                        </td>
                        <td>
                          <span style={{fontSize: '0.82rem', color: '#666'}}>
                            {order.created_at || 'Just now'}
                          </span>
                        </td>
                        <td>
                          <select 
                            className={`status-select-pill status-${(order.status || 'PENDING').toLowerCase()}`}
                            value={order.status || 'PENDING'}
                            onChange={e => handleStatusChange(order.id, e.target.value)}
                          >
                            <option value="PENDING">⏳ PENDING</option>
                            <option value="CONFIRMED">✅ CONFIRMED</option>
                            <option value="PREPARING">📦 PREPARING</option>
                            <option value="OUT_FOR_DELIVERY">🚚 OUT FOR DELIVERY</option>
                            <option value="DELIVERED">🎉 DELIVERED</option>
                            <option value="CANCELLED">❌ CANCELLED</option>
                          </select>
                        </td>
                        <td>
                          <select 
                            style={{ padding: '6px', borderRadius: '15px', border: '1px solid #ddd', fontSize: '0.85rem' }}
                            value={order.worker_assigned || ''}
                            onChange={e => handleWorkerAssign(order.id, e.target.value)}
                          >
                            <option value="">Unassigned</option>
                            {workers.map(w => (
                              <option key={w.id} value={w.id}>{w.name} ({w.id})</option>
                            ))}
                          </select>
                        </td>
                        <td>
                          <div className="action-buttons">
                            <button 
                              className="icon-btn" 
                              title="View Customer & Items Detail"
                              onClick={() => setSelectedOrder(order)}
                              style={{color: 'var(--primary-dark)', background: 'rgba(255, 159, 67, 0.15)'}}
                            >
                              <Eye size={17} /> Details
                            </button>
                            <button 
                              className="icon-btn danger" 
                              title="Delete Order"
                              onClick={() => handleDeleteOrder(order.id)}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* ── PRODUCTS TAB ── */}
        {activeTab === 'products' && (
          <div>
            <div className="section-header">
              <h1>Product Management</h1>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button 
                  className="add-btn" 
                  style={{ background: '#4cd137' }}
                  onClick={async () => {
                    let promises = [];
                    const updated = products.map(p => {
                      const inputEl = document.getElementById(`stock-input-${p.id}`);
                      if (inputEl) {
                        const newStock = Number(inputEl.value);
                        if (newStock !== p.stock) {
                          promises.push(axios.put(`${API_URL}/products/${p.id}`, { ...p, stock: newStock }));
                        }
                        return { ...p, stock: newStock };
                      }
                      return p;
                    });
                    setProducts(updated);
                    try {
                      await Promise.all(promises);
                      alert("All stock changes saved to the live database successfully!");
                    } catch (e) {
                      console.error(e);
                      alert("Some stock updates failed to save to the database.");
                    }
                  }}
                >
                  <Plus size={18} /> Save All Stock
                </button>
                <button className="add-btn" onClick={openAddModal}><Plus size={18} /> Add Product</button>
              </div>
            </div>
            <div className="table-container glass">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Image</th>
                    <th>Name</th>
                    <th>Category</th>
                    <th>Price</th>
                    <th>Stock</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map(product => (
                    <tr key={product.id}>
                      <td><img src={product.image_url} alt="" style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '6px' }} /></td>
                      <td><strong>{product.name}</strong></td>
                      <td><span className="badge">{product.category_name || "General"}</span></td>
                      <td>₹{product.price}</td>
                      <td>
                        <input 
                          type="number" 
                          defaultValue={product.stock}
                          id={`stock-input-${product.id}`}
                          style={{ width: '80px', padding: '6px', borderRadius: '4px', border: '1px solid #ccc', textAlign: 'center' }}
                          min="0"
                        />
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button className="icon-btn edit" onClick={() => openEditModal(product)}><Edit2 size={16} /></button>
                          <button className="icon-btn danger" onClick={() => deleteProduct(product.id)}><Trash2 size={16} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── WORKERS TAB ── */}
        {activeTab === 'workers' && (
          <div>
            <div className="section-header">
              <h1>Field Workers & Agents</h1>
              <button className="add-btn" onClick={() => { setCurrentWorker({name:'', phone:'', password:''}); setIsWorkerModalOpen(true); }}>
                <Plus size={18} /> Create Worker ID
              </button>
            </div>
            <div className="table-container glass">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Worker ID</th>
                    <th>Name / Role</th>
                    <th>Phone</th>
                    <th>Password</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {workers.map(worker => (
                    <tr key={worker.id}>
                      <td><span className="badge" style={{background: 'rgba(0, 184, 148, 0.15)', color: '#00b894'}}>#{worker.id}</span></td>
                      <td><strong>{worker.name}</strong></td>
                      <td>{worker.phone}</td>
                      <td><code>{worker.password}</code></td>
                      <td>
                        <button className="icon-btn danger" onClick={() => setWorkers(workers.filter(w => w.id !== worker.id))}><Trash2 size={16} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── CUSTOMERS TAB ── */}
        {activeTab === 'customers' && (
          <div className="section-container">
            <div className="section-header">
              <h1>Registered Customers</h1>
            </div>
            <div className="table-container glass">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Avatar</th>
                    <th>Name / Username</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Delivery Address</th>
                  </tr>
                </thead>
                <tbody>
                  {daUsers.length > 0 ? daUsers.map((u, idx) => (
                    <tr key={idx}>
                      <td style={{fontSize: '24px'}}>{u.avatar === 'girl' ? '👩' : (u.avatar === 'man' ? '👨' : '👤')}</td>
                      <td><strong>{u.name || u.username}</strong><br/><span style={{fontSize: '12px', color: '#666'}}>@{u.username}</span></td>
                      <td>{u.email || '-'}</td>
                      <td>{u.phone || '-'}</td>
                      <td style={{whiteSpace: 'pre-wrap', maxWidth: '300px'}}>{u.address || '-'}</td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan="5" style={{textAlign: 'center', padding: '2rem', color: '#888'}}>No customers registered yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* ── ORDER DETAILS POPUP MODAL ── */}
      {selectedOrder && (
        <div className="modal-overlay" onClick={() => setSelectedOrder(null)}>
          <div className="modal-content glass order-modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2>Order #{selectedOrder.id} Details</h2>
                <span className={`status-pill status-${(selectedOrder.status || 'PENDING').toLowerCase()}`}>
                  Status: {selectedOrder.status}
                </span>
              </div>
              <button className="close-btn" onClick={() => setSelectedOrder(null)}><X size={24} /></button>
            </div>

            <div className="order-detail-grid">
              {/* Customer Information Card */}
              <div className="detail-card">
                <h3><Users size={18} /> Customer Information</h3>
                <p><strong>Customer Name:</strong> {selectedOrder.customer_name}</p>
                <p>
                  <strong>Contact Phone:</strong> 
                  <a href={`tel:${selectedOrder.customer_phone}`} className="phone-tag" style={{marginLeft: '6px'}}>
                    <Phone size={14} /> {selectedOrder.customer_phone}
                  </a>
                </p>
                <p><strong>Order Timestamp:</strong> {selectedOrder.created_at || 'Recent'}</p>
                <p><strong>Payment Mode:</strong> Cash on Delivery (COD)</p>
              </div>

              {/* Delivery Address Card */}
              <div className="detail-card">
                <h3><MapPin size={18} /> Delivery Location</h3>
                <p style={{whiteSpace: 'pre-wrap', lineHeight: '1.5'}}>{selectedOrder.customer_address || 'No address provided.'}</p>
              </div>
            </div>

            {/* Ordered Items List */}
            <div className="ordered-items-section">
              <h3><Package size={18} /> Ordered Products & Quantities</h3>
              <div className="ordered-items-table-wrapper">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Quantity</th>
                      <th>Unit Price</th>
                      <th>Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(selectedOrder.items && selectedOrder.items.length > 0) ? (
                      selectedOrder.items.map((item, idx) => (
                        <tr key={idx}>
                          <td>
                            <strong>{item.name || item.product_name || `Product #${item.product_id}`}</strong>
                            {item.variant && <span style={{fontSize: '0.8rem', color: '#666', display: 'block'}}>{item.variant}</span>}
                          </td>
                          <td>{item.quantity} units</td>
                          <td>₹{item.price || item.price_at_time}</td>
                          <td><strong>₹{(item.quantity || 1) * (item.price || item.price_at_time || 0)}</strong></td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="4" style={{textAlign: 'center', color: '#888'}}>No individual item details available.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="order-modal-footer">
                <div className="status-update-control">
                  <label>Update Order Status:</label>
                  <select 
                    value={selectedOrder.status || 'PENDING'} 
                    onChange={e => handleStatusChange(selectedOrder.id, e.target.value)}
                    className="status-select"
                  >
                    <option value="PENDING">PENDING</option>
                    <option value="CONFIRMED">CONFIRMED</option>
                    <option value="PREPARING">PREPARING</option>
                    <option value="OUT_FOR_DELIVERY">OUT FOR DELIVERY</option>
                    <option value="DELIVERED">DELIVERED</option>
                    <option value="CANCELLED">CANCELLED</option>
                  </select>
                </div>

                <div className="status-update-control">
                  <label>Assign Delivery Worker:</label>
                  <select 
                    value={selectedOrder.worker_assigned || ''} 
                    onChange={e => handleWorkerAssign(selectedOrder.id, e.target.value)}
                    className="status-select"
                  >
                    <option value="">-- Unassigned --</option>
                    {workers.map(w => (
                      <option key={w.id} value={w.id}>{w.name} ({w.id})</option>
                    ))}
                  </select>
                </div>

                <div className="order-grand-total">
                  <span>Grand Total:</span>
                  <h3>₹{selectedOrder.total_amount}</h3>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Product Modal */}
      {isProductModalOpen && (
        <div className="modal-overlay" onClick={() => setIsProductModalOpen(false)}>
          <div className="modal-content glass" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{currentProduct.id ? 'Edit Product' : 'Add New Product'}</h2>
              <button className="close-btn" onClick={() => setIsProductModalOpen(false)}><X size={24} /></button>
            </div>
            <form onSubmit={handleProductSubmit}>
              <div className="form-group">
                <label>Product Name</label>
                <input type="text" value={currentProduct.name} onChange={e => setCurrentProduct({...currentProduct, name: e.target.value})} required />
              </div>
              <div className="form-group">
                <label>Upload Product Image (Optional)</label>
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        setCurrentProduct({...currentProduct, image_url: reader.result});
                      };
                      reader.readAsDataURL(file);
                    }
                  }} 
                />
                {currentProduct.image_url && (
                  <img src={currentProduct.image_url} alt="Preview" style={{ marginTop: '10px', height: '60px', borderRadius: '4px', objectFit: 'cover' }} />
                )}
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Price (₹)</label>
                  <input type="number" value={currentProduct.price} onChange={e => setCurrentProduct({...currentProduct, price: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label>Initial Stock</label>
                  <input type="number" value={currentProduct.stock} onChange={e => setCurrentProduct({...currentProduct, stock: e.target.value})} required />
                </div>
              </div>
              <button type="submit" className="save-btn">Save Product</button>
            </form>
          </div>
        </div>
      )}

      {/* Worker Modal */}
      {isWorkerModalOpen && (
        <div className="modal-overlay" onClick={() => setIsWorkerModalOpen(false)}>
          <div className="modal-content glass" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Create Worker Account</h2>
              <button className="close-btn" onClick={() => setIsWorkerModalOpen(false)}><X size={24} /></button>
            </div>
            <form onSubmit={handleWorkerSubmit}>
              <div className="form-group">
                <label>Worker Full Name</label>
                <input type="text" value={currentWorker.name} onChange={e => setCurrentWorker({...currentWorker, name: e.target.value})} required placeholder="e.g. Suresh" />
              </div>
              <div className="form-group">
                <label>Mobile Number</label>
                <input type="tel" value={currentWorker.phone} onChange={e => setCurrentWorker({...currentWorker, phone: e.target.value})} required placeholder="9876543210" />
              </div>
              <div className="form-group">
                <label>Login Password</label>
                <input type="text" value={currentWorker.password} onChange={e => setCurrentWorker({...currentWorker, password: e.target.value})} required placeholder="worker123" />
              </div>
              <button type="submit" className="save-btn">Generate Worker ID</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
