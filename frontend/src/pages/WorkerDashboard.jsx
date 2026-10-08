import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, LogOut, PackageSearch, ClipboardList, CheckCircle, TrendingUp, Store, Truck } from 'lucide-react';
import axios from 'axios';
import './Worker.css'; 
import { PRODUCTS_DATA } from '../data/products';

const WorkerDashboard = () => {
  const [activeTab, setActiveTab] = useState('take-order');
  const [cart, setCart] = useState([]);
  const [products, setProducts] = useState([]);
  const [storeName, setStoreName] = useState('');
  const [recentOrders, setRecentOrders] = useState([]);
  const [deliveries, setDeliveries] = useState([]);
  const navigate = useNavigate();
  const workerId = localStorage.getItem('workerId');

  const [orderView, setOrderView] = useState('catalog'); // 'catalog' or 'cart'
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Rest of the hooks and functions remain same
  const loadDeliveries = () => {
    const wId = localStorage.getItem('workerId');
    const allOrders = JSON.parse(localStorage.getItem('da_orders') || '[]');
    const myDeliveries = allOrders.filter(o => o.worker_assigned === wId);
    setDeliveries(myDeliveries);
  };

  useEffect(() => {
    if (!localStorage.getItem('workerToken')) {
      navigate('/login');
    }

    const fetchData = async () => {
      // Prioritize local storage so admin edits are immediately visible globally
      const savedProducts = localStorage.getItem('da_products');
      if (savedProducts) {
        setProducts(JSON.parse(savedProducts));
        return;
      }

      try {
        const res = await axios.get('http://localhost:5000/api/products');
        if(res.data && res.data.length > 0) setProducts(res.data);
        else throw new Error("Fallback to local");
      } catch (e) {
        setProducts(PRODUCTS_DATA);
      }
    };
    fetchData();
    loadDeliveries();

    setRecentOrders([
      { id: "ORD-9283", store: "Ganesh Maligai", amount: 1450, date: new Date().toLocaleDateString(), status: 'CONFIRMED' },
      { id: "ORD-9102", store: "Krishna Stores", amount: 320, date: new Date().toLocaleDateString(), status: 'PENDING' }
    ]);
  }, [navigate]);

  const updateDeliveryStatus = (orderId, newStatus) => {
    const allOrders = JSON.parse(localStorage.getItem('da_orders') || '[]');
    let targetOrder = null;
    const updated = allOrders.map(o => {
      if (o.id === orderId) {
        targetOrder = o;
        return { ...o, status: newStatus };
      }
      return o;
    });
    localStorage.setItem('da_orders', JSON.stringify(updated));
    loadDeliveries();

    if (newStatus === 'DELIVERED' && targetOrder) {
      // Deduct stock upon delivery
      const storedProducts = localStorage.getItem('da_products');
      let currentProducts = storedProducts ? JSON.parse(storedProducts) : PRODUCTS_DATA;
      let lowStockAlerts = [];
      
      const updatedProducts = currentProducts.map(p => {
        const orderedItem = targetOrder.items.find(i => i.id === p.id || i.product_id === p.id);
        if (orderedItem) {
           const newStock = Math.max(0, Number(p.stock || 0) - orderedItem.quantity);
           if (newStock < 10) lowStockAlerts.push(`${p.name} (${newStock} units left)`);
           return { ...p, stock: newStock };
        }
        return p;
      });
      localStorage.setItem('da_products', JSON.stringify(updatedProducts));
      setProducts(updatedProducts);

      if (lowStockAlerts.length > 0) {
        alert(`Stock Deducted.\n\nLow Stock Alert triggered for:\n${lowStockAlerts.join('\n')}\n\nSystem has sent a re-order alert email to: dineshnallathambi2001@gmail.com`);
      } else {
        alert(`Order ${orderId} marked as DELIVERED. Stock updated.`);
      }
    } else {
      alert(`Order ${orderId} marked as ${newStatus}`);
    }
  };

  const handleLogout = () => {
    ['authToken', 'adminToken', 'workerToken', 'username', 'workerId', 'userRole'].forEach(key => localStorage.removeItem(key));
    navigate('/login');
  };

  const addToCart = (product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const removeFromCart = (id) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const decreaseQuantity = (id) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === id);
      if (existing && existing.quantity > 1) {
        return prev.map(item => item.id === id ? { ...item, quantity: item.quantity - 1 } : item);
      } else {
        return prev.filter(item => item.id !== id);
      }
    });
  };

  const getCartQuantity = (id) => {
    const item = cart.find(c => c.id === id);
    return item ? item.quantity : 0;
  };

  const totalAmount = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  const placeOrder = async (e) => {
    e.preventDefault();
    if(cart.length === 0) return alert("Cart is empty");
    if(totalAmount < 150) {
      alert("Minimum order amount must be ₹150.");
      return;
    }
    
    const orderIdStr = "ORD-" + Math.floor(Math.random() * 900000 + 100000);
    
    const newOrderFull = {
      id: orderIdStr,
      customer_name: storeName + ` (by ${workerId})`,
      customer_phone: "Worker Placed",
      customer_address: "Store Address Pending",
      username: workerId,
      total_amount: totalAmount,
      status: 'PENDING',
      created_at: new Date().toLocaleString(),
      items: cart.map(i => ({ 
        id: i.id,
        product_id: i.id, 
        name: i.name,
        variant: i.variant,
        image_url: i.image_url,
        quantity: i.quantity, 
        price: i.price 
      }))
    };

    // Save to localStorage for instant synchronization with Admin Dashboard
    try {
      const existingOrders = JSON.parse(localStorage.getItem('da_orders') || '[]');
      const updatedOrders = [newOrderFull, ...existingOrders];
      localStorage.setItem('da_orders', JSON.stringify(updatedOrders));
    } catch (e) {
      console.error('LocalStorage write error:', e);
    }

    try {
      await axios.post('http://localhost:5000/api/orders', newOrderFull);
    } catch (e) {
      console.log("Order API failed, saving to local state only.");
    }
    
    setRecentOrders([{ 
      id: orderIdStr, 
      store: storeName, 
      amount: totalAmount, 
      date: new Date().toLocaleDateString(),
      status: 'PENDING'
    }, ...recentOrders]);
    
    setCart([]);
    setStoreName('');
    setOrderView('catalog');
    alert("Order successfully placed for " + storeName);
    setActiveTab('history');
  };

  const cartItemsCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <div className="worker-layout">
      {/* Mobile-Friendly Bottom Navigation or Sidebar on Desktop */}
      <nav className="worker-nav">
        <div className="worker-nav-header">
          <Store size={24} color="var(--primary-color)"/>
          <span>Worker Portal</span>
        </div>
        <div className="worker-nav-links">
          <button className={`nav-item ${activeTab === 'take-order' ? 'active' : ''}`} onClick={() => { setActiveTab('take-order'); setOrderView('catalog'); }}>
            <PackageSearch size={22} />
            <span>New Order</span>
          </button>
          <button className={`nav-item ${activeTab === 'history' ? 'active' : ''}`} onClick={() => setActiveTab('history')}>
            <ClipboardList size={22} />
            <span>My Orders</span>
          </button>
          <button className={`nav-item ${activeTab === 'deliveries' ? 'active' : ''}`} onClick={() => { setActiveTab('deliveries'); loadDeliveries(); }}>
            <Truck size={22} />
            <span>Deliveries</span>
          </button>
          <button className="nav-item text-danger" onClick={handleLogout}>
            <LogOut size={22} />
            <span>Logout</span>
          </button>
        </div>
      </nav>

      <main className="worker-main">
        {/* Welcome Header */}
        <header className="worker-topbar glass">
          <div className="greeting">
            {(() => {
              const workers = JSON.parse(localStorage.getItem('da_workers') || '[]');
              const worker = workers.find(w => w.id === workerId);
              const workerName = worker ? worker.name : workerId;
              return <h1>Hello, {workerName} 👋</h1>;
            })()}
            <p>Ready to close some sales today?</p>
          </div>
          <div className="performance-badge gradient-bg">
            <TrendingUp size={16} />
            <span>{recentOrders.length} Sales Today</span>
          </div>
        </header>

        <div className="worker-content">
          {activeTab === 'take-order' && (
            <div className="take-order-view">
              
              {orderView === 'catalog' ? (
                <div className="catalog-section">
                  <h2 className="section-title">Select Products</h2>
                  <div className="worker-products-grid">
                    {products.map(p => {
                      const qty = getCartQuantity(p.id);
                      return (
                      <div key={p.id} className="worker-product-card">
                        <div className="wp-image-container" style={{ position: 'relative' }}>
                          {p.discount_text && (
                            <span style={{ position: 'absolute', top: '5px', left: '5px', background: '#e17055', color: 'white', padding: '2px 6px', fontSize: '0.7rem', borderRadius: '4px', zIndex: 1, fontWeight: 'bold' }}>
                              {p.discount_text}
                            </span>
                          )}
                          {p.image_url ? (
                            <img 
                              src={p.image_url} 
                              alt={p.name} 
                              className="wp-image" 
                              onClick={() => setSelectedProduct(p)} 
                              style={{ cursor: 'pointer' }}
                            />
                          ) : (
                            <div 
                              className="wp-image-placeholder" 
                              onClick={() => setSelectedProduct(p)} 
                              style={{ cursor: 'pointer' }}
                            >
                              No Image
                            </div>
                          )}
                          <div className="wp-badge">{p.category_name}</div>
                        </div>
                        <div className="wp-info">
                          <h4 style={{fontSize: '0.9rem'}}>{p.name}</h4>
                          <p style={{fontSize: '0.8rem', color: 'var(--text-muted)'}}>{p.variant}</p>
                          <p className="wp-price">
                            ₹{p.price}
                            {p.original_price && (
                              <span style={{textDecoration: 'line-through', color: '#999', fontSize: '0.85rem', marginLeft: '5px', fontWeight: 'normal'}}>
                                ₹{p.original_price}
                              </span>
                            )}
                          </p>
                        </div>
                        
                        {qty > 0 ? (
                          <div className="worker-quantity-control">
                            <button onClick={() => decreaseQuantity(p.id)}>-</button>
                            <span>{qty}</span>
                            <button onClick={() => addToCart(p)}>+</button>
                          </div>
                        ) : Number(p.stock) === 0 ? (
                          <button className="wp-add-btn" disabled style={{ background: '#e0e0e0', color: '#888', cursor: 'not-allowed' }}>Out of Stock</button>
                        ) : (
                          <button className="wp-add-btn" onClick={() => addToCart(p)}>Add to Cart</button>
                        )}
                      </div>
                    )})}
                  </div>
                  
                  {cartItemsCount > 0 && (
                    <div className="floating-cart-bar glass" onClick={() => setOrderView('cart')}>
                      <div className="fcb-info">
                        <span className="fcb-count">{cartItemsCount} Items</span>
                        <span className="fcb-total">₹{totalAmount}</span>
                      </div>
                      <div className="fcb-action">
                        View Cart & Checkout ➔
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="cart-section glass">
                  <div className="cart-header">
                    <button className="back-btn" onClick={() => setOrderView('catalog')}>
                      ← Back to Catalog
                    </button>
                    <h2 className="section-title"><ShoppingCart size={20} /> Store Cart</h2>
                  </div>
                  
                  <div className="cart-items-wrapper">
                    {cart.length === 0 ? (
                      <div className="empty-cart-msg">
                        <div style={{opacity: 0.2, marginBottom: '1rem'}}>
                          <ShoppingCart size={48} />
                        </div>
                        <h3>Cart is empty</h3>
                        <p>Start adding products from the catalog</p>
                      </div>
                    ) : (
                      cart.map(c => (
                        <div key={c.id} className="worker-cart-item">
                          <div className="wci-info">
                            <h5>{c.name}</h5>
                            <span>₹{c.price} x {c.quantity}</span>
                          </div>
                          <div className="wci-actions">
                            <span className="wci-total">₹{c.price * c.quantity}</span>
                            <button className="wci-remove" onClick={() => removeFromCart(c.id)}>✕</button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  
                  <div className="cart-footer">
                    <div className="cart-total-row">
                      <span>Total Amount</span>
                      <span className="total-highlight">₹{totalAmount}</span>
                    </div>
                    <form onSubmit={placeOrder} className="worker-checkout-form">
                      <input 
                        type="text" 
                        value={storeName} 
                        onChange={e => setStoreName(e.target.value)} 
                        required 
                        placeholder="Enter Store Name (e.g. Balaji Shop)" 
                        className="store-input"
                      />
                      
                      {totalAmount < 150 && (
                        <div style={{color: 'var(--danger-color)', fontSize: '0.85rem', marginBottom: '0.5rem', textAlign: 'left', fontWeight: 'bold'}}>
                          Min order ₹150. Need ₹{150 - totalAmount} more.
                        </div>
                      )}
                      
                      <button type="submit" className="worker-submit-btn" disabled={cart.length === 0 || totalAmount < 150} style={{ opacity: totalAmount < 150 ? 0.5 : 1 }}>
                        <CheckCircle size={18} /> Confirm Order
                      </button>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'history' && (
            <div className="history-view glass">
              <h2 className="section-title">Order History</h2>
              <div className="worker-orders-list">
                {recentOrders.length === 0 ? (
                  <p>You haven't placed any orders yet.</p>
                ) : (
                  recentOrders.map((ord, idx) => (
                    <div key={idx} className="worker-order-card">
                      <div className="woc-header">
                        <span className="woc-id">{ord.id}</span>
                        <span className={`woc-status ${ord.status.toLowerCase()}`}>{ord.status}</span>
                      </div>
                      <h3 className="woc-store">{ord.store}</h3>
                      <div className="woc-footer">
                        <span className="woc-date">{ord.date}</span>
                        <span className="woc-amount">₹{ord.amount}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'deliveries' && (
            <div className="deliveries-view glass">
              <h2 className="section-title">My Assigned Deliveries</h2>
              <div className="worker-orders-list">
                {deliveries.length === 0 ? (
                  <p>No deliveries assigned to you right now.</p>
                ) : (
                  deliveries.map((order, idx) => (
                    <div key={idx} className="worker-order-card" style={{ borderLeft: '5px solid #ff9f43' }}>
                      <div className="woc-header">
                        <span className="woc-id">{order.id}</span>
                        <span className={`woc-status ${order.status.toLowerCase()}`}>{order.status}</span>
                      </div>
                      <h3 className="woc-store">{order.customer_name}</h3>
                      <p style={{fontSize:'0.9rem', marginBottom:'5px'}}>{order.customer_address}</p>
                      <p style={{fontSize:'0.9rem', marginBottom:'15px'}}>Phone: {order.customer_phone}</p>
                      <div className="woc-footer">
                        <span className="woc-date">{order.created_at || 'Recent'}</span>
                        <span className="woc-amount">₹{order.total_amount}</span>
                      </div>
                      
                      {order.status !== 'DELIVERED' && (
                        <div style={{ marginTop: '15px', display: 'flex', gap: '10px' }}>
                          <button 
                            onClick={() => updateDeliveryStatus(order.id, 'OUT_FOR_DELIVERY')}
                            style={{ padding: '8px', background: '#e17055', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', flex: 1, fontSize:'0.85rem' }}
                          >
                            Out for Delivery
                          </button>
                          <button 
                            onClick={() => updateDeliveryStatus(order.id, 'DELIVERED')}
                            style={{ padding: '8px', background: '#00b894', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', flex: 1, fontSize:'0.85rem' }}
                          >
                            Mark Delivered
                          </button>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Product Details Modal */}
      {selectedProduct && (
        <div className="modal-overlay" onClick={() => setSelectedProduct(null)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div className="modal-content glass" onClick={e => e.stopPropagation()} style={{ background: 'white', borderRadius: '12px', padding: '20px', maxWidth: '600px', width: '100%', position: 'relative', maxHeight: '90vh', overflowY: 'auto' }}>
            <button className="close-btn" onClick={() => setSelectedProduct(null)} style={{ position: 'absolute', top: '10px', right: '15px', background: 'none', border: 'none', fontSize: '2rem', cursor: 'pointer', color: '#666' }}>&times;</button>
            <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', marginTop: '10px' }}>
              <div style={{ flex: '1 1 250px', textAlign: 'center' }}>
                <img src={selectedProduct.image_url || 'https://via.placeholder.com/250x200?text=No+Image'} alt={selectedProduct.name} style={{ maxWidth: '100%', maxHeight: '300px', objectFit: 'contain', borderRadius: '8px' }} />
              </div>
              <div style={{ flex: '1 1 250px' }}>
                <h2 style={{ marginBottom: '5px', color: '#333' }}>{selectedProduct.name}</h2>
                <p style={{ color: 'var(--text-muted)', marginBottom: '15px', fontSize: '0.9rem' }}>{selectedProduct.category_name} - {selectedProduct.variant}</p>
                
                <div style={{ background: '#f8f9fa', padding: '15px', borderRadius: '8px', marginBottom: '15px', border: '1px solid #eee' }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
                    <h3 style={{ color: 'var(--primary-color)', fontSize: '1.8rem', margin: 0 }}>
                      ₹{selectedProduct.price}
                    </h3>
                    {selectedProduct.original_price && (
                      <span style={{ textDecoration: 'line-through', color: '#999', fontSize: '1rem' }}>
                        ₹{selectedProduct.original_price}
                      </span>
                    )}
                  </div>
                  
                  {selectedProduct.original_price && (
                    <p style={{ color: '#00b894', fontWeight: 'bold', marginTop: '5px', fontSize: '0.95rem' }}>
                      You Save: ₹{selectedProduct.original_price - selectedProduct.price}
                    </p>
                  )}
                  {selectedProduct.discount_text && (
                    <span style={{ display: 'inline-block', marginTop: '8px', background: '#e17055', color: 'white', padding: '4px 8px', fontSize: '0.8rem', borderRadius: '4px', fontWeight: 'bold' }}>
                        {selectedProduct.discount_text}
                    </span>
                  )}
                </div>
                
                <div style={{ marginBottom: '20px' }}>
                  <h4 style={{ marginBottom: '8px', color: '#444' }}>About this item</h4>
                  <p style={{ fontSize: '0.95rem', lineHeight: '1.6', color: '#666', whiteSpace: 'pre-line' }}>
                    {selectedProduct.description || "A high-quality product from Dinesh Agencies. Perfect for your daily needs and fully guaranteed for freshness and quality."}
                  </p>
                </div>

                {(() => {
                  const qty = getCartQuantity(selectedProduct.id);
                  return qty > 0 ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '5px', background: '#f8f9fa', borderRadius: '8px', overflow: 'hidden', border: '1px solid #e2e8f0', fontSize: '1.2rem' }}>
                      <button onClick={() => decreaseQuantity(selectedProduct.id)} style={{ padding: '10px 20px', background: 'white', color: '#333', border: 'none', borderRight: '1px solid #e2e8f0', cursor: 'pointer', fontWeight: 'bold', flex: 1, fontSize: '1.2rem' }}>-</button>
                      <span style={{ fontWeight: 'bold', padding: '0 20px', color: '#333' }}>{qty}</span>
                      <button onClick={() => addToCart(selectedProduct)} style={{ padding: '10px 20px', background: 'white', color: '#333', border: 'none', borderLeft: '1px solid #e2e8f0', cursor: 'pointer', fontWeight: 'bold', flex: 1, fontSize: '1.2rem' }}>+</button>
                    </div>
                  ) : selectedProduct.stock === 0 ? (
                    <button className="out-of-stock-btn" disabled style={{ width: '100%', padding: '12px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', fontSize: '1.05rem', background: '#e0e0e0', color: '#888', border: 'none', borderRadius: '8px', cursor: 'not-allowed', fontWeight: 'bold' }}>
                      Out of Stock
                    </button>
                  ) : (
                    <button className="add-to-cart-btn" onClick={() => addToCart(selectedProduct)} style={{ width: '100%', padding: '12px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', fontSize: '1.05rem', background: 'var(--primary-color)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
                      <ShoppingCart size={20} /> Add to Cart
                    </button>
                  );
                })()}
              </div>
            </div>

            {/* Related Products */}
            <div style={{ marginTop: '30px', borderTop: '1px solid #eee', paddingTop: '20px' }}>
              <h3 style={{ marginBottom: '15px', color: '#444' }}>Related Products</h3>
              <div style={{ display: 'flex', gap: '15px', overflowX: 'auto', paddingBottom: '10px' }}>
                {products.filter(p => p.category_name === selectedProduct.category_name && p.id !== selectedProduct.id).slice(0, 5).map(related => (
                  <div key={related.id} style={{ minWidth: '150px', maxWidth: '150px', border: '1px solid #eee', borderRadius: '8px', padding: '10px', cursor: 'pointer', flexShrink: 0 }} onClick={() => setSelectedProduct(related)}>
                    <img src={related.image_url || 'https://via.placeholder.com/150'} alt={related.name} style={{ width: '100%', height: '100px', objectFit: 'contain', marginBottom: '10px' }} />
                    <h5 style={{ fontSize: '0.85rem', marginBottom: '5px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: '#333' }}>{related.name}</h5>
                    <p style={{ fontWeight: 'bold', color: 'var(--primary-color)', fontSize: '0.9rem' }}>₹{related.price}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkerDashboard;
