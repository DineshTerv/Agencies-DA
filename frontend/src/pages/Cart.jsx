import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Trash2, Plus, Minus, ArrowRight, CheckCircle2, Phone, MapPin, User, Package, Calendar,
  MessageCircle, Send, ExternalLink, Copy, Check, Smartphone, Share2, Mail, Download, Printer
} from 'lucide-react';
import axios from 'axios';
import { PRODUCTS_DATA } from '../data/products';
import { cleanPhoneNumber, generateStatusMessage, getWhatsAppUrl, openWhatsApp } from '../utils/whatsapp';
import { downloadInvoiceFile, sendInvoiceEmail } from '../utils/invoice';
import './Cart.css';

const Cart = ({ cartItems, setCartItems }) => {
  const savedUsername = localStorage.getItem('username') || '';
  const [formData, setFormData] = useState(() => {
    let email = '';
    let phone = '';
    let address = '';
    try {
      const users = JSON.parse(localStorage.getItem('da_users') || '[]');
      const current = users.find(u => u.username === savedUsername);
      if (current) {
        email = current.email || '';
        phone = current.phone || '';
        address = current.address || '';
      }
    } catch (e) {}

    return {
      name: savedUsername !== 'admin' && !savedUsername.startsWith('W') ? savedUsername : '',
      email,
      phone,
      address
    };
  });
  const [orderPlacedData, setOrderPlacedData] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sendViaWhatsApp, setSendViaWhatsApp] = useState(true);
  const [customWaPhone, setCustomWaPhone] = useState('');
  const [waCopied, setWaCopied] = useState(false);
  const [waToastMsg, setWaToastMsg] = useState('');
  const [showWaPreview, setShowWaPreview] = useState(false);
  const [redirectCountdown, setRedirectCountdown] = useState(null);
  const [emailSending, setEmailSending] = useState(false);
  const [emailSentStatus, setEmailSentStatus] = useState('');
  const [customEmailInput, setCustomEmailInput] = useState('');

  // Auto-launch countdown effect for instant WhatsApp opening
  React.useEffect(() => {
    if (redirectCountdown === null) return;
    if (redirectCountdown <= 0) {
      if (orderPlacedData) {
        const phoneToUse = customWaPhone || orderPlacedData.customer_phone;
        const msg = generateStatusMessage(orderPlacedData, orderPlacedData.status || 'PENDING');
        openWhatsApp(phoneToUse, msg, true);
      }
      setRedirectCountdown(null);
      return;
    }

    const timer = setTimeout(() => {
      setRedirectCountdown(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearTimeout(timer);
  }, [redirectCountdown, orderPlacedData, customWaPhone]);

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

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

    try {
      const res = await axios.post(`${API_URL}/orders`, {
        customer_name: formData.name,
        customer_email: formData.email || '',
        customer_phone: formData.phone,
        customer_address: formData.address,
        username: savedUsername || formData.name,
        total_amount: totalAmount,
        items: cartItems.map(i => ({ 
          product_id: i.id, 
          name: i.name, 
          variant: i.variant, 
          quantity: i.quantity, 
          price: i.price,
          image_url: i.image_url 
        }))
      });

      const orderData = {
        id: res.data.orderId || newOrderId,
        _id: res.data.orderId || newOrderId,
        customer_name: formData.name,
        customer_email: formData.email || '',
        customer_phone: formData.phone,
        customer_address: formData.address,
        username: savedUsername || formData.name,
        total_amount: totalAmount,
        status: 'PENDING',
        created_at: now.toLocaleString(),
        createdAt: now.toISOString(),
        items: cartItems.map(i => ({
          id: i.id,
          product_id: i.id,
          name: i.name,
          variant: i.variant,
          quantity: i.quantity,
          price: i.price,
          image_url: i.image_url
        }))
      };

      // Save into local storage orders list for immediate persistence
      try {
        const localOrders = JSON.parse(localStorage.getItem('da_orders') || '[]');
        localOrders.unshift(orderData);
        localStorage.setItem('da_orders', JSON.stringify(localOrders));
      } catch (storageErr) {
        console.warn("Could not save to localStorage:", storageErr);
      }

      setOrderPlacedData(orderData);
      setCartItems([]);

      if (sendViaWhatsApp && formData.phone) {
        setRedirectCountdown(2);
      }
    } catch (err) {
      console.error("API error:", err.message);
      // Fallback: save locally anyway so user never loses order
      const fallbackOrder = {
        id: newOrderId,
        _id: newOrderId,
        customer_name: formData.name,
        customer_phone: formData.phone,
        customer_address: formData.address,
        username: savedUsername || formData.name,
        total_amount: totalAmount,
        status: 'PENDING',
        created_at: now.toLocaleString(),
        createdAt: now.toISOString(),
        items: cartItems
      };
      const localOrders = JSON.parse(localStorage.getItem('da_orders') || '[]');
      localOrders.unshift(fallbackOrder);
      localStorage.setItem('da_orders', JSON.stringify(localOrders));

      setOrderPlacedData(fallbackOrder);
      setCartItems([]);

      if (sendViaWhatsApp && formData.phone) {
        setRedirectCountdown(2);
      }
    }

    setIsSubmitting(false);
  };

  const handleManualSendWhatsApp = (targetPhone = null) => {
    if (!orderPlacedData) return;
    setRedirectCountdown(null);
    const phoneToUse = targetPhone || customWaPhone || orderPlacedData.customer_phone;
    const msg = generateStatusMessage(orderPlacedData, orderPlacedData.status || 'PENDING');
    openWhatsApp(phoneToUse, msg, true);
    setWaToastMsg(`Connecting to WhatsApp for +${cleanPhoneNumber(phoneToUse)}...`);
    setTimeout(() => setWaToastMsg(''), 4000);
  };

  const handleCopyWaMessage = () => {
    if (!orderPlacedData) return;
    const msg = generateStatusMessage(orderPlacedData, orderPlacedData.status || 'PENDING');
    navigator.clipboard.writeText(msg);
    setWaCopied(true);
    setTimeout(() => setWaCopied(false), 2500);
  };

  const handleSendEmail = async (overrideEmail = null) => {
    if (!orderPlacedData) return;
    const target = (overrideEmail || customEmailInput || orderPlacedData.customer_email || '').trim();
    if (!target || !target.includes('@')) {
      alert('Please enter a valid email address.');
      return;
    }
    setEmailSending(true);
    setEmailSentStatus('');
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const res = await sendInvoiceEmail(orderPlacedData.id, target, API_URL);
      setEmailSentStatus(`✅ Bill successfully sent to ${target}!`);
      setTimeout(() => setEmailSentStatus(''), 5000);
    } catch (err) {
      console.error('Email error:', err);
      setEmailSentStatus(`⚠️ Error sending email: ${err.response?.data?.message || err.message}`);
    } finally {
      setEmailSending(false);
    }
  };

  if (orderPlacedData) {
    const rawPhone = orderPlacedData.customer_phone || '';
    const cleanPhone = cleanPhoneNumber(rawPhone);
    const waMessage = generateStatusMessage(orderPlacedData, orderPlacedData.status || 'PENDING');

    return (
      <div className="order-success-container glass">
        <div className="success-header">
          <CheckCircle2 size={56} className="success-icon" color="#1dd1a1" />
          <h2>Order Placed Successfully!</h2>
          <p className="order-id-badge">Order ID: <strong>#{orderPlacedData.id}</strong></p>
          <span className="order-status-tag">Status: PENDING CONFIRMATION</span>
        </div>

        {/* ── AUTOMATIC INSTANT WHATSAPP REDIRECT BANNER ── */}
        {redirectCountdown !== null && (
          <div className="wa-auto-redirect-banner">
            <div className="wa-spinner-pulse">
              <MessageCircle size={24} color="#25D366" />
            </div>
            <div className="wa-auto-text">
              <strong>🚀 Automatically opening WhatsApp in {redirectCountdown}s...</strong>
              <p>Sending your complete itemized bill to WhatsApp (+{cleanPhone})</p>
            </div>
            <div className="wa-auto-btns">
              <button 
                type="button" 
                className="wa-now-btn"
                onClick={() => {
                  setRedirectCountdown(null);
                  handleManualSendWhatsApp(rawPhone);
                }}
              >
                Open Now ➔
              </button>
              <button 
                type="button" 
                className="wa-cancel-btn"
                onClick={() => setRedirectCountdown(null)}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {waToastMsg && (
          <div className="wa-toast-alert">
            <MessageCircle size={18} color="#25D366" />
            <span>{waToastMsg}</span>
          </div>
        )}

        {/* ── DEDICATED WHATSAPP NOTIFICATION CARD ── */}
        <div className="wa-order-banner glass">
          <div className="wa-banner-header">
            <div className="wa-brand-icon">
              <MessageCircle size={28} color="#fff" />
            </div>
            <div className="wa-banner-text">
              <h3>Get Order Bill & Live Tracking on WhatsApp</h3>
              <p>
                {cleanPhone 
                  ? `Your complete order receipt is ready to be sent to WhatsApp (+${cleanPhone})`
                  : 'Receive your order invoice and tracking updates directly on WhatsApp'}
              </p>
            </div>
          </div>

          <div className="wa-banner-actions">
            <button 
              type="button" 
              className="wa-primary-send-btn" 
              onClick={() => handleManualSendWhatsApp(rawPhone)}
            >
              <MessageCircle size={18} />
              <span>Send Order to My WhatsApp {cleanPhone ? `(+${cleanPhone})` : ''}</span>
              <ExternalLink size={15} />
            </button>

            <button 
              type="button" 
              className="wa-secondary-copy-btn" 
              onClick={handleCopyWaMessage}
            >
              {waCopied ? <><Check size={16} color="#27ae60" /> Copied Receipt</> : <><Copy size={16} /> Copy Message</>}
            </button>

            <button 
              type="button" 
              className="wa-preview-toggle-btn"
              onClick={() => setShowWaPreview(!showWaPreview)}
            >
              {showWaPreview ? 'Hide Message Preview' : 'Preview Message'}
            </button>
          </div>

          {/* Optional alternate WhatsApp phone input */}
          <div className="wa-alternate-phone-row">
            <Smartphone size={15} className="wa-alt-icon" />
            <span>Send to another number:</span>
            <input 
              type="tel" 
              placeholder="e.g. 9443695071" 
              value={customWaPhone} 
              onChange={e => setCustomWaPhone(e.target.value)} 
              className="wa-alt-input"
            />
            <button 
              type="button" 
              className="wa-alt-send-btn"
              onClick={() => handleManualSendWhatsApp(customWaPhone)}
              disabled={!customWaPhone}
            >
              <Send size={14} /> Send
            </button>
          </div>

          {/* Expandable WhatsApp Message Preview */}
          {showWaPreview && (
            <div className="wa-message-preview-box">
              <label>WhatsApp Message Content:</label>
              <pre>{waMessage}</pre>
            </div>
          )}
        </div>

        {/* ── EMAIL INVOICE & DOWNLOAD BILL CARD ── */}
        <div className="email-invoice-banner glass">
          <div className="email-banner-header">
            <div className="email-brand-icon">
              <Mail size={26} color="#fff" />
            </div>
            <div className="email-banner-text">
              <h3>Invoice Bill & Direct Download</h3>
              <p>
                {orderPlacedData.customer_email 
                  ? `Your official invoice bill has been sent to ${orderPlacedData.customer_email}` 
                  : 'Receive your itemized invoice directly in your email inbox'}
              </p>
            </div>
          </div>

          <div className="email-banner-actions">
            <button 
              type="button" 
              className="download-invoice-btn" 
              onClick={() => downloadInvoiceFile(orderPlacedData)}
              title="Download standalone invoice HTML/PDF"
            >
              <Download size={18} />
              <span>Download Bill (HTML/PDF)</span>
            </button>

            <button 
              type="button" 
              className="send-email-btn" 
              onClick={() => handleSendEmail()}
              disabled={emailSending}
              title="Send bill directly to email"
            >
              <Mail size={18} />
              <span>{emailSending ? 'Sending Bill...' : 'Send Bill to Email'}</span>
            </button>

            <button 
              type="button" 
              className="print-receipt-btn" 
              onClick={() => window.print()}
              title="Print bill receipt"
            >
              <Printer size={18} />
              <span>Print Receipt</span>
            </button>
          </div>

          {/* Optional alternate email input */}
          <div className="email-input-row">
            <Mail size={15} style={{ color: '#0984e3' }} />
            <span>Send to another email:</span>
            <input 
              type="email" 
              placeholder="e.g. shopowner@gmail.com" 
              value={customEmailInput} 
              onChange={e => setCustomEmailInput(e.target.value)} 
              className="email-alt-input"
            />
            <button 
              type="button" 
              className="email-alt-send-btn"
              onClick={() => handleSendEmail(customEmailInput)}
              disabled={emailSending || !customEmailInput}
            >
              <Send size={14} /> Send
            </button>
          </div>

          {emailSentStatus && (
            <div className="email-sent-badge">
              {emailSentStatus}
            </div>
          )}
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

        <div className="receipt-actions" style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to="/">
            <button className="primary-btn">🛍️ Continue Shopping</button>
          </Link>
          <Link to="/orders">
            <button className="primary-btn" style={{ background: '#2ed573' }}>📦 View All Orders History</button>
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
            <label>Phone Number (WhatsApp Mobile) *</label>
            <input 
              required 
              type="tel" 
              value={formData.phone} 
              onChange={e => setFormData({...formData, phone: e.target.value})} 
              placeholder="10-digit mobile e.g. 9876543210" 
            />
            <small className="field-hint">
              💬 Your order bill & live tracking updates will be delivered to this WhatsApp number.
            </small>
          </div>
          <div className="form-group">
            <label>Email Address (to receive bill directly) *</label>
            <input 
              required
              type="email" 
              value={formData.email} 
              onChange={e => setFormData({...formData, email: e.target.value})} 
              placeholder="e.g. yourname@gmail.com" 
            />
            <small className="field-hint" style={{ color: '#0984e3' }}>
              ✉️ Your official invoice bill with items, prices, and tracking will be sent directly to this email ID.
            </small>
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
          
          <div className="wa-form-optin-box">
            <label className="wa-optin-label">
              <input 
                type="checkbox" 
                checked={sendViaWhatsApp} 
                onChange={e => setSendViaWhatsApp(e.target.checked)} 
              />
              <span className="wa-optin-text">
                <MessageCircle size={16} color="#25D366" /> 
                Send order receipt & status updates to my WhatsApp
              </span>
            </label>
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
