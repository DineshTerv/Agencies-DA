import React, { useState, useEffect } from 'react';
import { MessageCircle, Send, X, Copy, Check, ExternalLink, Smartphone } from 'lucide-react';
import { cleanPhoneNumber, getWhatsAppUrl, getStatusLabel, getStatusEmoji } from '../utils/whatsapp';
import './WhatsAppPromptModal.css';

const WhatsAppPromptModal = ({ 
  isOpen, 
  onClose, 
  order, 
  newStatus, 
  initialMessage, 
  autoOpenEnabled, 
  onToggleAutoOpen 
}) => {
  const [message, setMessage] = useState('');
  const [phoneInput, setPhoneInput] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (initialMessage) {
      setMessage(initialMessage);
    }
    if (order) {
      setPhoneInput(order.customer_phone || '');
    }
  }, [initialMessage, order, newStatus]);

  if (!isOpen || !order) return null;

  const cleanPhone = cleanPhoneNumber(phoneInput);
  const status = newStatus || order.status || 'PENDING';
  const statusLabel = getStatusLabel(status);
  const statusEmoji = getStatusEmoji(status);
  const orderId = order.id || order._id || '';
  const shortId = orderId.length > 8 ? orderId.slice(-8) : orderId;

  const handleSend = () => {
    const res = openWhatsApp(cleanPhone, message);
    if (res.blocked) {
      alert('WhatsApp window was blocked by your browser. Please allow popups or use WhatsApp Web.');
    }
    onClose();
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(message);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="wa-modal-overlay" onClick={onClose}>
      <div className="wa-modal-card" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="wa-modal-header">
          <div className="wa-header-title">
            <div className="wa-icon-badge">
              <MessageCircle size={22} color="#fff" />
            </div>
            <div>
              <h3>Notify Customer on WhatsApp</h3>
              <p>Direct WhatsApp update for order #{shortId}</p>
            </div>
          </div>
          <button className="wa-close-btn" onClick={onClose} title="Dismiss">
            <X size={20} />
          </button>
        </div>

        {/* Info Grid */}
        <div className="wa-info-grid">
          <div className="wa-info-item">
            <span className="wa-info-label">Customer</span>
            <span className="wa-info-value">{order.customer_name || 'Customer'}</span>
          </div>
          <div className="wa-info-item">
            <span className="wa-info-label">WhatsApp Number (Editable)</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
              <Smartphone size={14} color="#25D366" />
              <input 
                type="tel"
                value={phoneInput}
                onChange={e => setPhoneInput(e.target.value)}
                placeholder="10-digit phone"
                style={{
                  padding: '3px 8px',
                  borderRadius: '6px',
                  border: '1px solid #ccd1d9',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  color: '#2d3436',
                  width: '140px'
                }}
              />
            </div>
          </div>
          <div className="wa-info-item">
            <span className="wa-info-label">Order Total</span>
            <span className="wa-info-value" style={{ color: '#27ae60', fontWeight: 'bold' }}>
              ₹{order.total_amount ? Number(order.total_amount).toLocaleString('en-IN') : '0'}
            </span>
          </div>
          <div className="wa-info-item">
            <span className="wa-info-label">Status Changed To</span>
            <span className={`wa-status-badge wa-status-${status.toLowerCase()}`}>
              {statusEmoji} {statusLabel}
            </span>
          </div>
        </div>

        {/* Message Editor / Preview */}
        <div className="wa-message-section">
          <div className="wa-message-header">
            <label htmlFor="wa-message-text">WhatsApp Message Preview (Editable):</label>
            <button 
              type="button" 
              className="wa-copy-btn" 
              onClick={handleCopy}
              title="Copy message text"
            >
              {copied ? <><Check size={14} color="#27ae60" /> Copied</> : <><Copy size={14} /> Copy</>}
            </button>
          </div>
          <textarea
            id="wa-message-text"
            className="wa-message-textarea"
            rows={8}
            value={message}
            onChange={e => setMessage(e.target.value)}
          />
        </div>

        {/* Footer actions */}
        <div className="wa-modal-footer">
          <label className="wa-auto-toggle">
            <input 
              type="checkbox" 
              checked={autoOpenEnabled} 
              onChange={e => onToggleAutoOpen(e.target.checked)} 
            />
            <span>Always auto-open WhatsApp when status changes</span>
          </label>

          <div className="wa-action-buttons">
            <button type="button" className="wa-btn-secondary" onClick={onClose}>
              Dismiss
            </button>
            <button 
              type="button" 
              className="wa-btn-primary" 
              onClick={handleSend}
              disabled={!cleanPhone && !message}
            >
              <Send size={16} />
              <span>Send via WhatsApp</span>
              <ExternalLink size={14} style={{ opacity: 0.8 }} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WhatsAppPromptModal;
