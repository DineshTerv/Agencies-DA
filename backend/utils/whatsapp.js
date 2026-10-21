/**
 * Backend WhatsApp Helper for Dinesh Agencies
 * Handles phone number cleaning, message formatting, and optional automated sending via
 * Twilio, Meta WhatsApp Cloud API, or UltraMsg if configured in .env.
 */

const cleanPhoneNumber = (phone) => {
  if (!phone) return '';
  let digits = String(phone).replace(/\D/g, '');
  while (digits.startsWith('0')) {
    digits = digits.substring(1);
  }
  // Handle Indian trunk code e.g. 9109876543210 -> 919876543210
  if (digits.startsWith('910') && digits.length === 13) {
    digits = '91' + digits.substring(3);
  }
  if (digits.length === 10) {
    digits = '91' + digits;
  }
  return digits;
};

const generateStatusMessage = (order, newStatus, workerName = '') => {
  if (!order) return '';
  const status = newStatus || order.status || 'PENDING';
  const customerName = order.customer_name || order.username || 'Valued Customer';
  const rawId = (order._id || order.id || '').toString();
  const shortId = rawId.length > 8 ? rawId.slice(-8) : rawId;
  const total = order.total_amount ? Number(order.total_amount).toLocaleString('en-IN') : '0';
  const address = order.customer_address ? order.customer_address.trim() : '';

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

const getWhatsAppUrl = (phone, message) => {
  const cleanPhone = cleanPhoneNumber(phone);
  const encoded = encodeURIComponent(message);
  return cleanPhone 
    ? `https://wa.me/${cleanPhone}?text=${encoded}` 
    : `https://wa.me/?text=${encoded}`;
};

/**
 * Attempts automated delivery if third-party credentials exist, otherwise generates WhatsApp Web URL
 */
const sendOrPrepareWhatsAppMessage = async (order, newStatus, workerName = '') => {
  const phone = order.customer_phone;
  const cleanPhone = cleanPhoneNumber(phone);
  const message = generateStatusMessage(order, newStatus, workerName);
  const whatsappUrl = getWhatsAppUrl(phone, message);

  // 1. Meta WhatsApp Cloud API check
  if (process.env.WHATSAPP_PHONE_NUMBER_ID && process.env.WHATSAPP_ACCESS_TOKEN && cleanPhone) {
    try {
      const response = await fetch(`https://graph.facebook.com/v19.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: cleanPhone,
          type: 'text',
          text: { body: message }
        })
      });
      const data = await response.json();
      console.log('[WhatsApp Cloud API] Message dispatched:', data);
      return { success: true, method: 'cloud_api', message, whatsappUrl };
    } catch (apiErr) {
      console.warn('[WhatsApp Cloud API] Send error:', apiErr.message);
    }
  }

  // 2. Twilio WhatsApp API check
  if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_WHATSAPP_NUMBER && cleanPhone) {
    try {
      const auth = Buffer.from(`${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`).toString('base64');
      const params = new URLSearchParams({
        From: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
        To: `whatsapp:+${cleanPhone}`,
        Body: message
      });
      const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${process.env.TWILIO_ACCOUNT_SID}/Messages.json`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: params
      });
      const data = await response.json();
      console.log('[Twilio WhatsApp] Message dispatched:', data);
      return { success: true, method: 'twilio', message, whatsappUrl };
    } catch (twilioErr) {
      console.warn('[Twilio WhatsApp] Send error:', twilioErr.message);
    }
  }

  // 3. UltraMsg API check
  if (process.env.ULTRAMSG_INSTANCE_ID && process.env.ULTRAMSG_TOKEN && cleanPhone) {
    try {
      const params = new URLSearchParams({
        token: process.env.ULTRAMSG_TOKEN,
        to: `+${cleanPhone}`,
        body: message
      });
      const response = await fetch(`https://api.ultramsg.com/${process.env.ULTRAMSG_INSTANCE_ID}/messages/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params
      });
      const data = await response.json();
      console.log('[UltraMsg] Message dispatched:', data);
      return { success: true, method: 'ultramsg', message, whatsappUrl };
    } catch (ultraErr) {
      console.warn('[UltraMsg] Send error:', ultraErr.message);
    }
  }

  // Fallback: Automated API credentials not set. Returns payload for client-side instant click-to-chat.
  return {
    success: false,
    method: 'client_link',
    message,
    whatsappUrl,
    cleanPhone
  };
};

module.exports = {
  cleanPhoneNumber,
  generateStatusMessage,
  getWhatsAppUrl,
  sendOrPrepareWhatsAppMessage
};
