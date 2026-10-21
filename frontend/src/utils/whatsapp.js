/**
 * WhatsApp integration utility for Dinesh Agencies
 * Handles phone formatting, message generation for each status, and WhatsApp Web/App URLs
 */

export const cleanPhoneNumber = (phone) => {
  if (!phone) return '';
  let digits = String(phone).replace(/\D/g, '');
  
  // Strip any leading zeros (e.g., 08300592839 -> 8300592839)
  while (digits.startsWith('0')) {
    digits = digits.substring(1);
  }
  
  // Handle Indian trunk code e.g. 9109876543210 -> 919876543210
  if (digits.startsWith('910') && digits.length === 13) {
    digits = '91' + digits.substring(3);
  }

  // If 10-digit Indian number, prepend 91 country code
  if (digits.length === 10) {
    digits = '91' + digits;
  }
  
  return digits;
};

export const getStatusLabel = (status) => {
  switch (status) {
    case 'CONFIRMED': return 'Confirmed';
    case 'PREPARING': return 'Packing / Preparing';
    case 'OUT_FOR_DELIVERY': return 'Out for Delivery';
    case 'DELIVERED': return 'Delivered';
    case 'CANCELLED': return 'Cancelled';
    case 'PENDING': return 'Order Placed';
    default: return status || 'Updated';
  }
};

export const getStatusEmoji = (status) => {
  switch (status) {
    case 'CONFIRMED': return '✅';
    case 'PREPARING': return '📦';
    case 'OUT_FOR_DELIVERY': return '🚚';
    case 'DELIVERED': return '🎉';
    case 'CANCELLED': return '❌';
    case 'PENDING': return '⏳';
    default: return '🔔';
  }
};

/**
 * Generate a beautifully formatted WhatsApp message for order status update
 */
export const generateStatusMessage = (order, newStatus, workerName = '') => {
  if (!order) return '';
  const status = newStatus || order.status || 'PENDING';
  const customerName = order.customer_name || order.username || 'Valued Customer';
  const rawId = (order._id || order.id || '').toString();
  const shortId = rawId.length > 8 ? rawId.slice(-8) : rawId;
  const total = order.total_amount ? Number(order.total_amount).toLocaleString('en-IN') : '0';
  const address = order.customer_address ? order.customer_address.trim() : '';

  // Format items summary
  let itemsSummary = '';
  if (order.items && Array.isArray(order.items) && order.items.length > 0) {
    const list = order.items.slice(0, 15).map(item => {
      const q = item.quantity || 1;
      const v = item.variant ? ` (${item.variant})` : '';
      const p = item.price ? ` (₹${Number(item.price) * q})` : '';
      return `• ${item.name || 'Product'}${v} x ${q}${p}`;
    });
    if (order.items.length > 15) {
      list.push(`• ...and ${order.items.length - 15} more item(s)`);
    }
    itemsSummary = `\n📦 *Order Items:*\n${list.join('\n')}\n`;
  }

  const addressLine = address ? `📍 *Delivery Address:* ${address}\n` : '';
  const workerLine = workerName ? `👤 *Delivery Partner:* ${workerName}\n` : '';

  switch (status) {
    case 'CONFIRMED':
      return (
`🛍️ *DINESH AGENCIES*
*Order Confirmed!* ✅

Hello *${customerName}*,
Your order *#${shortId}* has been confirmed by Dinesh Agencies!
${itemsSummary}
💰 *Total Amount:* ₹${total}
${addressLine}
We will begin packing your order shortly. Thank you for your business! 🙏

📞 *Contact:* 9443695071 / 9566714372
_Dinesh Agencies - Quality & Service You Can Trust_`
      );

    case 'PREPARING':
      return (
`📦 *DINESH AGENCIES*
*Order is Being Packed!* 📦

Hello *${customerName}*,
Good news! Your order *#${shortId}* is currently being packed and prepared for dispatch.
${itemsSummary}
💰 *Total Amount:* ₹${total}
${addressLine}
We will notify you as soon as it is out for delivery! 🚚

📞 *Contact:* 9443695071 / 9566714372
_Dinesh Agencies_`
      );

    case 'OUT_FOR_DELIVERY':
      return (
`🚚 *DINESH AGENCIES*
*Order Out For Delivery!* 🛵

Hello *${customerName}*,
Your order *#${shortId}* is on its way to your doorstep!

${workerLine}💰 *Total to Pay:* ₹${total} (Cash on Delivery)
${addressLine}
Please keep the payment ready. Have a great day! ✨

📞 *Contact:* 9443695071 / 9566714372
_Dinesh Agencies_`
      );

    case 'DELIVERED':
      return (
`🎉 *DINESH AGENCIES*
*Order Delivered Successfully!* 🎉

Hello *${customerName}*,
Your order *#${shortId}* has been delivered!

${workerLine}💰 *Total Paid:* ₹${total}
${itemsSummary}
Thank you for choosing Dinesh Agencies! We look forward to serving you again. If you have any feedback, please let us know! ⭐

📞 *Contact:* 9443695071 / 9566714372
_Dinesh Agencies_`
      );

    case 'CANCELLED':
      return (
`❌ *DINESH AGENCIES*
*Order Update: Cancelled*

Hello *${customerName}*,
Your order *#${shortId}* has been cancelled.

If you have any questions or this was done in error, please contact us directly.
📞 *Contact:* 9443695071 / 9566714372

_Dinesh Agencies_`
      );

    case 'PENDING':
    default:
      return (
`🛍️ *DINESH AGENCIES*
*Order Received Successfully!* 📋

Hello *${customerName}*,
Thank you for your order *#${shortId}* with Dinesh Agencies!
${itemsSummary}
💰 *Total Amount:* ₹${total} (Cash on Delivery)
${addressLine}
⏳ *Current Status:* Order Placed (Pending Confirmation)
We are processing your order and will keep you updated as it moves to packing and delivery! 🚚

📞 *For inquiries/support:* 9443695071 / 9566714372
_Dinesh Agencies - Quality & Service You Can Trust_`
      );
  }
};

/**
 * Returns direct WhatsApp Web or App link
 */
export const getWhatsAppUrl = (phone, message) => {
  const cleanPhone = cleanPhoneNumber(phone);
  const encodedText = encodeURIComponent(message);
  if (!cleanPhone) {
    return `https://wa.me/?text=${encodedText}`;
  }
  return `https://wa.me/${cleanPhone}?text=${encodedText}`;
};

/**
 * Opens WhatsApp in a new browser tab or WhatsApp App
 */
export const openWhatsApp = (phone, message, forceDirect = false) => {
  const url = getWhatsAppUrl(phone, message);
  const isMobile = typeof navigator !== 'undefined' && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

  if (forceDirect || isMobile) {
    try {
      window.location.href = url;
      return { success: true, url, blocked: false };
    } catch (e) {
      // Fallback to window.open if navigation fails
    }
  }

  try {
    const win = window.open(url, '_blank', 'noopener,noreferrer');
    if (!win || win.closed || typeof win.closed === 'undefined') {
      return { success: false, url, blocked: true };
    }
    return { success: true, url, blocked: false };
  } catch (err) {
    return { success: false, url, blocked: true, error: err.message };
  }
};
