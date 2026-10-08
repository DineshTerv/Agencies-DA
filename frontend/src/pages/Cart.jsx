import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Trash2, Plus, Minus, ArrowRight, CheckCircle2, Phone, MapPin, User, Package, Calendar } from 'lucide-react';
import axios from 'axios';
import { PRODUCTS_DATA } from '../data/products';
import './Cart.css';

const Cart = ({ cartItems, setCartItems }) => {
  const savedUsername = localStorage.getItem('username') || '';
  const [formData, setFormData] = useState({ 
    name: savedUsername !== 'admin' && !savedUsername.startsWith('W') ? savedUsername : '', 
    phone: '', 
    address: '' 
  });
  const [orderPlacedData, setOrderPlacedData] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const totalAmount = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  const updateQuantity = (id, delta) => {
    setCartItems(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = item.quantity + delta;
        return newQty > 0 ? { ...item, quantity: newQty } : item;
      }
      return item;
    }));
  };

  const removeItem = (id) => {
    setCartItems(prev => prev.filter(item => item.id !== id));
  };

  const placeOrder = async (e) => {
    e.preventDefault();
    if (cartItems.length === 0) return;
    if (totalAmount < 150) {
      alert("Minimum order amount is ₹150.");
      return;
    }

    setIsSubmitting(true);
    const newOrderId = 'ORD-' + Math.floor(100000 + Math.random() * 900000);
    const now = new Date();

    const orderPayload = {
      id: newOrderId,
      customer_name: formData.name,
      customer_phone: formData.phone,
      customer_address: formData.address,
      username: savedUsername || formData.name,
      total_amount: totalAmount,
      status: 'PENDING',
      created_at: now.toLocaleString(),
      items: cartItems.map(i => ({ 
        id: i.id,
        product_id: i.id, 
        name: i.name,
        variant: i.variant,
        image_url: i.image_url,
        quantity: i.quantity, 
        price: i.price 
      }))
    };

    // 1. Save to localStorage for instant synchronization with Admin & Worker
    try {
      const existingOrders = JSON.parse(localStorage.getItem('da_orders') || '[]');
      const updatedOrders = [orderPayload, ...existingOrders];
      localStorage.setItem('da_orders', JSON.stringify(updatedOrders));
    } catch (e) {
      console.error('LocalStorage write error:', e);
    }

    // 2. Send to backend MySQL API
    try {
      await axios.post('http://localhost:5000/api/orders', {
        customer_name: formData.name,
        customer_phone: formData.phone,
        customer_address: formData.address,
        total_amount: totalAmount,
        items: cartItems.map(i => ({ product_id: i.id, quantity: i.quantity, price: i.price }))
      });
    } catch (err) {
      console.warn("Backend API notice: order saved locally.", err.message);
    }

    setOrderPlacedData(orderPayload);
    setCartItems([]);
    setIsSubmitting(false);
  };

  if (orderPlacedData) {
    return (
      <div className="order-success-container glass">
        <div className="success-header">
          <CheckCircle2 size={56} className="success-icon" color="#1dd1a1" />
          <h2>Order Placed Successfully!</h2>
          <p className="order-id-badge">Order ID: <strong>#{orderPlacedData.id}</strong></p>
          <span className="order-status-tag">Status: PENDING CONFIRMATION</span>
        </div>

        <div className="order-receipt-grid">
          {/* Customer & Delivery Details */}
          <div className="receipt-card">
            <h3><User size={18} /> Customer Details</h3>
            <p><strong>Name:</strong> {orderPlacedData.customer_name}</p>
            <p><strong>Phone:</strong> <a href={`tel:${orderPlacedData.customer_phone}`} className="phone-tag"><Phone size={14} /> {orderPlacedData.customer_phone}</a></p>
            <p><strong>Delivery Address:</strong> <MapPin size={14} /> {orderPlacedData.customer_address}</p>
            <p><strong>Date:</strong> <Calendar size={14} /> {orderPlacedData.created_at}</p>
            <p><strong>Payment Method:</strong> Cash on Delivery (COD)</p>
          </div>

          {/* Ordered Items Summary */}
          <div className="receipt-card">
            <h3><Package size={18} /> Order Summary</h3>
            <div className="receipt-items-list">
              {orderPlacedData.items.map((item, idx) => (
                <div key={idx} className="receipt-item-row">
                  <span>{item.name} {item.variant ? `(${item.variant})` : ''} × {item.quantity}</span>
                  <strong>₹{item.price * item.quantity}</strong>
                </div>
              ))}
            </div>
            <div className="receipt-total-row">
              <span>Total Payable Amount:</span>
              <span className="grand-total">₹{orderPlacedData.total_amount}</span>
            </div>
          </div>
        </div>

        <div className="receipt-actions">
          <Link to="/">
            <button className="primary-btn">🛍️ Continue Shopping</button>
          </Link>
        </div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="empty-cart glass">
        <h2>Your Cart is Empty</h2>
        <p>Looks like you haven't added anything to your cart yet.</p>
        <Link to="/">
          <button style={{ marginTop: '2rem' }}>Browse Products</button>
        </Link>
      </div>
    );
  }

  return (
    <div className="cart-container">
      <div className="cart-items glass">
        <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center' }}>
          <Link to="/" style={{ color: '#ff9f43', textDecoration: 'none', fontWeight: 'bold' }}>
            ← Back to Product Catalog
          </Link>
        </div>
        <h2>Shopping Cart ({cartItems.length} items)</h2>
        <div className="items-list">
          {cartItems.map(item => (
            <div key={item.id} className="cart-item">
              <img src={item.image_url || 'https://via.placeholder.com/100'} alt={item.name} />
              <div className="item-details">
                <h3>{item.name}</h3>
                {item.variant && <p className="item-variant">{item.variant}</p>}
                <span className="item-price">₹{item.price}</span>
              </div>
              <div className="quantity-controls">
                <button className="icon-btn" onClick={() => updateQuantity(item.id, -1)}><Minus size={16} /></button>
                <span>{item.quantity}</span>
                <button className="icon-btn" onClick={() => updateQuantity(item.id, 1)}><Plus size={16} /></button>
              </div>
              <div className="item-total">₹{item.price * item.quantity}</div>
              <button className="icon-btn danger" onClick={() => removeItem(item.id)}><Trash2 size={20} /></button>
            </div>
          ))}
        </div>
        <div className="cart-summary">
          <h3>Total Amount: <span>₹{totalAmount}</span></h3>
        </div>
      </div>

      <div className="checkout-form glass">
        <h2>Delivery & Customer Details</h2>
        <form onSubmit={placeOrder}>
          <div className="form-group">
            <label>Full Name / Customer Name *</label>
            <input 
              required 
              type="text" 
              value={formData.name} 
              onChange={e => setFormData({...formData, name: e.target.value})} 
              placeholder="e.g. Nallathambi / Ramesh" 
            />
          </div>
          <div className="form-group">
            <label>Phone Number (Mobile) *</label>
            <input 
              required 
              type="tel" 
              value={formData.phone} 
              onChange={e => setFormData({...formData, phone: e.target.value})} 
              placeholder="e.g. 9876543210" 
            />
          </div>
          <div className="form-group">
            <label>Delivery Address *</label>
            <textarea 
              required 
              rows="4" 
              value={formData.address} 
              onChange={e => setFormData({...formData, address: e.target.value})} 
              placeholder="Shop Name, Door No, Street, Landmark, City/Town..."
            ></textarea>
          </div>
          
          <div className="payment-note">
            <p>💵 Payment: Cash on Delivery (Pay when goods arrive at your store)</p>
          </div>
          
          {totalAmount < 150 && (
            <div style={{color: 'var(--danger-color)', marginBottom: '1rem', fontWeight: 'bold'}}>
              Minimum order amount is ₹150. You need ₹{150 - totalAmount} more.
            </div>
          )}
          
          <button 
            type="submit" 
            className="place-order-btn" 
            disabled={totalAmount < 150 || isSubmitting} 
            style={{ opacity: totalAmount < 150 ? 0.5 : 1 }}
          >
            {isSubmitting ? 'Placing Order...' : 'Confirm & Place Order'} <ArrowRight size={18} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default Cart;
