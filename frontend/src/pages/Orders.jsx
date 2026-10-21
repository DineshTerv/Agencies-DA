import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Package, ShoppingBag, Clock, CheckCircle2, Truck, AlertCircle, 
  MapPin, Phone, User, Calendar, RefreshCw, ChevronRight, ArrowLeft,
  Search, FileText, Check, ChevronDown, ChevronUp, ShoppingCart,
  MessageCircle, ExternalLink, Download, Mail
} from 'lucide-react';
import axios from 'axios';
import { PRODUCTS_DATA } from '../data/products';
import { cleanPhoneNumber, generateStatusMessage, openWhatsApp } from '../utils/whatsapp';
import { downloadInvoiceFile, sendInvoiceEmail } from '../utils/invoice';
import './Orders.css';

const Orders = ({ addToCart }) => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrderForInvoice, setSelectedOrderForInvoice] = useState(null);
  const [expandedOrderIds, setExpandedOrderIds] = useState({});
  const [emailSendingMap, setEmailSendingMap] = useState({});
  const [emailStatusMap, setEmailStatusMap] = useState({});
  const [modalEmail, setModalEmail] = useState('');
  const [modalEmailSending, setModalEmailSending] = useState(false);
  const [modalEmailMsg, setModalEmailMsg] = useState('');

  const savedUsername = localStorage.getItem('username') || '';
  const authToken = localStorage.getItem('authToken') || localStorage.getItem('adminToken') || localStorage.getItem('workerToken');

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  const toggleExpand = (orderId) => {
    setExpandedOrderIds(prev => ({
      ...prev,
      [orderId]: !prev[orderId]
    }));
  };

  const loadUserOrders = async () => {
    setLoading(true);
    let allOrders = [];

    // 1. Fetch from LocalStorage (always immediate)
    const localOrders = JSON.parse(localStorage.getItem('da_orders') || '[]');
    allOrders = [...localOrders];

    // 2. Fetch from Backend
    try {
      if (savedUsername) {
        // Try user specific endpoint first
        try {
          const res = await axios.get(`${API_URL}/orders/user/${encodeURIComponent(savedUsername)}`);
          if (res.data && Array.isArray(res.data)) {
            allOrders = [...res.data, ...allOrders];
          }
        } catch (e) {
          // Fallback: fetch all orders and filter by user/name/phone
          const allRes = await axios.get(`${API_URL}/orders`);
          if (allRes.data && Array.isArray(allRes.data)) {
            const userOnly = allRes.data.filter(o => 
              (o.username && o.username.toLowerCase() === savedUsername.toLowerCase()) ||
              (o.customer_name && o.customer_name.toLowerCase() === savedUsername.toLowerCase())
            );
            allOrders = [...userOnly, ...allOrders];
          }
        }
      }
    } catch (err) {
      console.warn("Backend orders fetch error, showing local orders:", err.message);
    }

    // Deduplicate by id or _id
    const seenIds = new Set();
    const uniqueOrders = [];
    for (const ord of allOrders) {
      const idKey = ord.id || ord._id;
      if (idKey && !seenIds.has(idKey)) {
        seenIds.add(idKey);
        
        // Enrich items with catalog data (images, names, variants) if missing
        const enrichedItems = (ord.items || []).map(item => {
          const matched = PRODUCTS_DATA.find(p => p.id === (item.product_id || item.id));
          return {
            ...item,
            name: item.name || matched?.name || item.product_id || 'Product Item',
            variant: item.variant || matched?.variant || '',
            image_url: item.image_url || matched?.image_url || '/logo.jpg',
            price: item.price !== undefined ? item.price : (matched?.price || 0)
          };
        });

        uniqueOrders.push({
          ...ord,
          id: idKey,
          items: enrichedItems,
          dateObj: new Date(ord.createdAt || ord.created_at || Date.now())
        });
      }
    }

    // Sort newest first
    uniqueOrders.sort((a, b) => b.dateObj - a.dateObj);
    setOrders(uniqueOrders);
    
    // Auto expand the most recent order
    if (uniqueOrders.length > 0) {
      setExpandedOrderIds({ [uniqueOrders[0].id]: true });
    }

    setLoading(false);
  };

  useEffect(() => {
    loadUserOrders();
  }, [savedUsername]);

  // Status badge helper
  const getStatusBadge = (status) => {
    switch (status) {
      case 'DELIVERED':
        return { label: 'Delivered', className: 'status-delivered', icon: <CheckCircle2 size={15} /> };
      case 'OUT_FOR_DELIVERY':
        return { label: 'Out for Delivery', className: 'status-out', icon: <Truck size={15} /> };
      case 'PREPARING':
        return { label: 'Preparing / Packing', className: 'status-prep', icon: <Package size={15} /> };
      case 'CONFIRMED':
        return { label: 'Order Confirmed', className: 'status-confirmed', icon: <Check size={15} /> };
      case 'CANCELLED':
        return { label: 'Cancelled', className: 'status-cancelled', icon: <AlertCircle size={15} /> };
      case 'PENDING':
      default:
        return { label: 'Order Placed (Pending)', className: 'status-pending', icon: <Clock size={15} /> };
    }
  };

  // Timeline Tracker Steps
  const renderStatusTracker = (status) => {
    if (status === 'CANCELLED') {
      return (
        <div className="order-tracker-alert cancelled">
          <AlertCircle size={16} /> This order has been cancelled.
        </div>
      );
    }

    const steps = [
      { key: 'PENDING', label: 'Placed' },
      { key: 'CONFIRMED', label: 'Confirmed' },
      { key: 'PREPARING', label: 'Packing' },
      { key: 'OUT_FOR_DELIVERY', label: 'On Way' },
      { key: 'DELIVERED', label: 'Delivered' }
    ];

    const stepOrder = ['PENDING', 'CONFIRMED', 'PREPARING', 'OUT_FOR_DELIVERY', 'DELIVERED'];
    const currentIndex = stepOrder.indexOf(status);

    return (
      <div className="order-tracker">
        <div className="tracker-track">
          {steps.map((st, idx) => {
            const isDone = currentIndex >= idx;
            const isCurrent = currentIndex === idx;
            return (
              <div key={st.key} className={`tracker-step ${isDone ? 'done' : ''} ${isCurrent ? 'current' : ''}`}>
                <div className="tracker-dot">
                  {isDone ? <Check size={12} /> : idx + 1}
                </div>
                <span className="tracker-label">{st.label}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Reorder all items in an order into cart
  const handleReorder = (order) => {
    if (addToCart && order.items) {
      order.items.forEach(item => {
        const productToAdd = {
          id: item.product_id || item.id,
          name: item.name,
          variant: item.variant,
          price: item.price,
          image_url: item.image_url
        };
        for (let i = 0; i < (item.quantity || 1); i++) {
          addToCart(productToAdd);
        }
      });
      alert(`Added ${order.items.length} items from Order #${order.id} to your cart!`);
      navigate('/cart');
    }
  };

  const handleWhatsAppStatus = (order) => {
    if (!order) return;
    const msg = generateStatusMessage(order, order.status);
    const res = openWhatsApp(order.customer_phone, msg);
    if (res.blocked) {
      alert('WhatsApp popup was blocked by your browser. Please allow popups or visit WhatsApp directly.');
    }
  };

  const handleSendOrderEmail = async (order, customEmail = null) => {
    const targetEmail = (customEmail || order.customer_email || prompt('Enter email address to send the bill:', order.customer_email || ''))?.trim();
    if (!targetEmail) return;

    if (!targetEmail.includes('@') || !targetEmail.includes('.')) {
      alert('Please enter a valid email address.');
      return;
    }

    const orderKey = order.id || order._id;
    setEmailSendingMap(prev => ({ ...prev, [orderKey]: true }));
    setEmailStatusMap(prev => ({ ...prev, [orderKey]: null }));

    try {
      const res = await sendInvoiceEmail(orderKey, targetEmail, API_URL);
      if (res.success) {
        setEmailStatusMap(prev => ({
          ...prev,
          [orderKey]: { success: true, msg: `Invoice bill successfully sent to ${targetEmail}!` }
        }));
      } else {
        setEmailStatusMap(prev => ({
          ...prev,
          [orderKey]: { success: false, msg: res.error || 'Failed to dispatch email' }
        }));
      }
    } catch (err) {
      setEmailStatusMap(prev => ({
        ...prev,
        [orderKey]: { success: false, msg: err.message || 'Error dispatching email' }
      }));
    } finally {
      setEmailSendingMap(prev => ({ ...prev, [orderKey]: false }));
    }
  };

  // Filter orders
  const filteredOrders = orders.filter(order => {
    const matchesFilter = 
      activeFilter === 'ALL' ? true :
      activeFilter === 'ACTIVE' ? ['PENDING', 'CONFIRMED', 'PREPARING', 'OUT_FOR_DELIVERY'].includes(order.status) :
      activeFilter === 'DELIVERED' ? order.status === 'DELIVERED' :
      activeFilter === 'CANCELLED' ? order.status === 'CANCELLED' : true;

    if (!matchesFilter) return false;

    if (!searchQuery.trim()) return true;

    const query = searchQuery.toLowerCase();
    const matchId = String(order.id).toLowerCase().includes(query);
    const matchCustomer = order.customer_name?.toLowerCase().includes(query);
    const matchItems = order.items?.some(it => it.name?.toLowerCase().includes(query));

    return matchId || matchCustomer || matchItems;
  });

  return (
    <div className="orders-page-container">
      {/* ── TOP HEADER / BREADCRUMB ── */}
      <div className="orders-header glass">
        <div className="header-left">
          <Link to="/" className="back-link">
            <ArrowLeft size={18} /> Back to Catalog
          </Link>
          <div className="header-titles">
            <h1>
              <Package className="header-icon" /> My Orders & History
            </h1>
            <p className="subtitle">
              Track delivery progress and view all products you have ordered from Dinesh Agencies
            </p>
          </div>
        </div>

        <button className="sync-btn" onClick={loadUserOrders} title="Sync latest orders">
          <RefreshCw size={16} className={loading ? 'spinning' : ''} /> Refresh Orders
        </button>
      </div>

      {/* ── TOOLBAR: STATS & SEARCH & FILTER ── */}
      <div className="orders-toolbar glass">
        <div className="search-box">
          <Search size={18} className="search-icon" />
          <input 
            type="text" 
            placeholder="Search by order ID or product name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button className="clear-search" onClick={() => setSearchQuery('')}>×</button>
          )}
        </div>

        <div className="filter-chips">
          <button 
            className={`filter-chip ${activeFilter === 'ALL' ? 'active' : ''}`}
            onClick={() => setActiveFilter('ALL')}
          >
            All Orders ({orders.length})
          </button>
          <button 
            className={`filter-chip ${activeFilter === 'ACTIVE' ? 'active' : ''}`}
            onClick={() => setActiveFilter('ACTIVE')}
          >
            Active In-Progress ({orders.filter(o => ['PENDING', 'CONFIRMED', 'PREPARING', 'OUT_FOR_DELIVERY'].includes(o.status)).length})
          </button>
          <button 
            className={`filter-chip ${activeFilter === 'DELIVERED' ? 'active' : ''}`}
            onClick={() => setActiveFilter('DELIVERED')}
          >
            Delivered ({orders.filter(o => o.status === 'DELIVERED').length})
          </button>
        </div>
      </div>

      {/* ── MAIN ORDERS LIST ── */}
      {loading ? (
        <div className="orders-loading glass">
          <RefreshCw size={36} className="spinning" color="#ff9f43" />
          <p>Loading your orders...</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="orders-empty glass">
          <div className="empty-icon-circle">
            <ShoppingBag size={48} color="#ff9f43" />
          </div>
          <h2>No Orders Found</h2>
          <p>
            {orders.length === 0 
              ? "You haven't placed any orders with us yet. Browse our wholesale grocery & puja catalog!" 
              : "No orders match your current filter or search criteria."}
          </p>
          <Link to="/">
            <button className="primary-btn browse-btn">
              🛍️ Explore & Order Products Now
            </button>
          </Link>
        </div>
      ) : (
        <div className="orders-list">
          {filteredOrders.map(order => {
            const badge = getStatusBadge(order.status);
            const isExpanded = !!expandedOrderIds[order.id];
            const itemsCount = (order.items || []).reduce((sum, it) => sum + (it.quantity || 1), 0);

            return (
              <div key={order.id} className="order-card glass">
                {/* ── CARD HEADER ── */}
                <div className="order-card-header">
                  <div className="order-header-left">
                    <span className="order-id-tag">#{order.id}</span>
                    <span className="order-date">
                      <Calendar size={14} /> {order.created_at || order.dateObj.toLocaleString()}
                    </span>
                  </div>

                  <div className="order-header-right">
                    <span className={`status-badge ${badge.className}`}>
                      {badge.icon} {badge.label}
                    </span>
                  </div>
                </div>

                {/* ── STATUS PROGRESS BAR ── */}
                {renderStatusTracker(order.status)}

                {/* ── PRODUCTS SUMMARY / LIST ── */}
                <div className="order-products-section">
                  <div className="products-section-header" onClick={() => toggleExpand(order.id)}>
                    <div className="products-header-title">
                      <Package size={18} color="#ff9f43" />
                      <strong>Ordered Products ({itemsCount} items)</strong>
                    </div>
                    <button className="expand-btn">
                      {isExpanded ? <>Hide Details <ChevronUp size={16} /></> : <>View Products ({order.items?.length || 0}) <ChevronDown size={16} /></>}
                    </button>
                  </div>

                  {/* Always show product previews, fully expand on click */}
                  <div className={`order-items-grid ${isExpanded ? 'expanded' : 'collapsed'}`}>
                    {(order.items || []).map((item, idx) => (
                      <div key={idx} className="order-item-row">
                        <img 
                          src={item.image_url || '/logo.jpg'} 
                          alt={item.name} 
                          className="item-thumbnail"
                          onError={(e) => { e.target.src = '/logo.jpg'; }}
                        />
                        <div className="item-info">
                          <h4 className="item-title">{item.name}</h4>
                          {item.variant && (
                            <span className="item-variant-pill">
                              Variant: {item.variant}
                            </span>
                          )}
                          <div className="item-pricing">
                            <span className="qty-tag">Qty: {item.quantity || 1}</span>
                            <span className="price-tag">₹{item.price} each</span>
                          </div>
                        </div>
                        <div className="item-subtotal">
                          ₹{Number((item.price || 0) * (item.quantity || 1))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* ── DELIVERY & PAYMENT DETAILS ── */}
                <div className="order-footer-details">
                  <div className="delivery-info">
                    <div className="info-row">
                      <User size={15} className="info-icon" />
                      <span><strong>Recipient:</strong> {order.customer_name || 'Customer'}</span>
                    </div>
                    {order.customer_phone && (
                      <div className="info-row">
                        <Phone size={15} className="info-icon" />
                        <span><strong>Phone:</strong> {order.customer_phone}</span>
                      </div>
                    )}
                    {order.customer_email && (
                      <div className="info-row">
                        <Mail size={15} className="info-icon" />
                        <span><strong>Email:</strong> {order.customer_email}</span>
                      </div>
                    )}
                    {order.customer_address && (
                      <div className="info-row">
                        <MapPin size={15} className="info-icon" />
                        <span><strong>Address:</strong> {order.customer_address}</span>
                      </div>
                    )}
                  </div>

                  <div className="order-summary-box">
                    <div className="total-row">
                      <span>Total Amount:</span>
                      <strong className="grand-total-amount">₹{order.total_amount}</strong>
                    </div>
                    <span className="payment-mode-tag">💵 Cash on Delivery (COD)</span>
                    
                    <div className="order-action-buttons">
                      <button 
                        className="download-btn"
                        onClick={() => downloadInvoiceFile(order)}
                        title="Download Offline HTML/PDF Invoice Bill"
                      >
                        <Download size={15} /> Download Bill
                      </button>
                      <button 
                        className="email-btn"
                        onClick={() => handleSendOrderEmail(order)}
                        disabled={emailSendingMap[order.id]}
                        title={`Directly send bill to ${order.customer_email || 'Email ID'}`}
                      >
                        <Mail size={15} /> {emailSendingMap[order.id] ? 'Sending...' : 'Email Bill'}
                      </button>
                      <button 
                        className="wa-status-btn" 
                        onClick={() => handleWhatsAppStatus(order)}
                        title="Get live order items and status on WhatsApp"
                      >
                        <MessageCircle size={15} /> WhatsApp
                      </button>
                      <button 
                        className="invoice-btn" 
                        onClick={() => {
                          setSelectedOrderForInvoice(order);
                          setModalEmail(order.customer_email || '');
                          setModalEmailMsg('');
                        }}
                        title="View printable bill receipt"
                      >
                        <FileText size={15} /> View Receipt
                      </button>
                      <button 
                        className="reorder-btn" 
                        onClick={() => handleReorder(order)}
                        title="Add these items to your cart again"
                      >
                        <ShoppingCart size={15} /> Buy Again
                      </button>
                    </div>

                    {emailStatusMap[order.id] && (
                      <div className={`order-email-notification ${emailStatusMap[order.id].success ? 'success' : 'error'}`}>
                        {emailStatusMap[order.id].success ? '✓' : '⚠️'} {emailStatusMap[order.id].msg}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── PRINTABLE BILL / RECEIPT MODAL ── */}
      {selectedOrderForInvoice && (
        <div className="receipt-modal-overlay" onClick={() => setSelectedOrderForInvoice(null)}>
          <div className="receipt-modal-content glass" onClick={e => e.stopPropagation()}>
            <div className="receipt-modal-header">
              <div className="receipt-brand">
                <img src="/logo.jpg" alt="Dinesh Agencies" className="receipt-logo" />
                <div>
                  <h2>DINESH AGENCIES</h2>
                  <p>Wholesale Distributor • Since 1999</p>
                  <small>Ph: 944369507 / 9566714372</small>
                </div>
              </div>
              <button className="close-receipt-btn" onClick={() => setSelectedOrderForInvoice(null)}>×</button>
            </div>

            <div className="receipt-bill-meta">
              <div>
                <p><strong>Order ID:</strong> #{selectedOrderForInvoice.id}</p>
                <p><strong>Date:</strong> {selectedOrderForInvoice.created_at || selectedOrderForInvoice.dateObj?.toLocaleString()}</p>
                <p><strong>Status:</strong> {selectedOrderForInvoice.status}</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p><strong>Billed To:</strong> {selectedOrderForInvoice.customer_name}</p>
                <p><strong>Phone:</strong> {selectedOrderForInvoice.customer_phone}</p>
                {selectedOrderForInvoice.customer_email && (
                  <p><strong>Email:</strong> {selectedOrderForInvoice.customer_email}</p>
                )}
                <p><strong>Address:</strong> {selectedOrderForInvoice.customer_address || 'Store Delivery'}</p>
              </div>
            </div>

            <table className="receipt-table">
              <thead>
                <tr>
                  <th>Item Description</th>
                  <th>Variant</th>
                  <th style={{ textAlign: 'center' }}>Qty</th>
                  <th style={{ textAlign: 'right' }}>Price</th>
                  <th style={{ textAlign: 'right' }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {selectedOrderForInvoice.items.map((it, i) => (
                  <tr key={i}>
                    <td><strong>{it.name}</strong></td>
                    <td>{it.variant || '-'}</td>
                    <td style={{ textAlign: 'center' }}>{it.quantity}</td>
                    <td style={{ textAlign: 'right' }}>₹{it.price}</td>
                    <td style={{ textAlign: 'right' }}>₹{it.price * it.quantity}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan="4" style={{ textAlign: 'right', fontWeight: 'bold' }}>Grand Total:</td>
                  <td style={{ textAlign: 'right', fontWeight: 'bold', color: '#ff9f43', fontSize: '1.2rem' }}>
                    ₹{selectedOrderForInvoice.total_amount}
                  </td>
                </tr>
              </tfoot>
            </table>

            <div className="receipt-footer-note">
              {/* Direct Email sending bar inside Receipt modal */}
              <div className="modal-email-send-bar">
                <div className="modal-email-input-wrap">
                  <Mail size={16} className="modal-mail-icon" />
                  <input 
                    type="email" 
                    placeholder="Enter email to receive this bill..." 
                    value={modalEmail}
                    onChange={e => setModalEmail(e.target.value)}
                    className="modal-email-input"
                  />
                  <button 
                    type="button"
                    className="modal-send-email-btn"
                    disabled={modalEmailSending}
                    onClick={async () => {
                      if (!modalEmail.trim() || !modalEmail.includes('@')) {
                        alert('Please enter a valid email address.');
                        return;
                      }
                      setModalEmailSending(true);
                      setModalEmailMsg('');
                      try {
                        const res = await sendInvoiceEmail(selectedOrderForInvoice.id, modalEmail.trim(), API_URL);
                        if (res.success) {
                          setModalEmailMsg(`✓ Bill successfully dispatched to ${modalEmail.trim()}!`);
                        } else {
                          setModalEmailMsg(`⚠️ Failed: ${res.error || 'Server error'}`);
                        }
                      } catch (e) {
                        setModalEmailMsg(`⚠️ Error: ${e.message}`);
                      } finally {
                        setModalEmailSending(false);
                      }
                    }}
                  >
                    {modalEmailSending ? 'Sending...' : 'Send Bill to Email'}
                  </button>
                </div>
                {modalEmailMsg && (
                  <p className={`modal-email-status-text ${modalEmailMsg.startsWith('✓') ? 'success' : 'error'}`}>
                    {modalEmailMsg}
                  </p>
                )}
              </div>

              <p>Thank you for choosing Dinesh Agencies! For bulk orders and inquiries, contact us.</p>
              <div className="receipt-modal-actions">
                <button 
                  className="primary-btn download-receipt-btn"
                  onClick={() => downloadInvoiceFile(selectedOrderForInvoice)}
                  title="Download offline HTML bill invoice"
                >
                  <Download size={16} /> Download Bill
                </button>
                <button 
                  className="primary-btn wa-receipt-btn" 
                  onClick={() => handleWhatsAppStatus(selectedOrderForInvoice)}
                  title="Share or send this receipt to WhatsApp"
                >
                  <MessageCircle size={16} /> WhatsApp
                </button>
                <button className="primary-btn" onClick={() => window.print()}>🖨️ Print Receipt</button>
                <button className="close-btn-outline" onClick={() => setSelectedOrderForInvoice(null)}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Orders;
