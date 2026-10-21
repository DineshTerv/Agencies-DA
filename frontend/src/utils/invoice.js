/**
 * Frontend Invoice & Email Utilities for Dinesh Agencies
 */
import axios from 'axios';

export const generateClientInvoiceHtml = (order) => {
  if (!order) return '';
  const customerName = order.customer_name || order.username || 'Valued Customer';
  const rawId = (order._id || order.id || '').toString();
  const shortId = rawId.length > 8 ? rawId.slice(-8) : rawId;
  const orderDate = new Date(order.createdAt || order.created_at || Date.now()).toLocaleString('en-IN');
  const total = Number(order.total_amount || 0).toLocaleString('en-IN');
  const address = order.customer_address || 'Store Delivery';
  const phone = order.customer_phone || '-';
  const email = order.customer_email || '-';
  const status = order.status || 'PENDING';

  const rows = (order.items || []).map(item => {
    const qty = Number(item.quantity) || 1;
    const price = Number(item.price) || 0;
    const sub = qty * price;
    return `
      <tr style="border-bottom: 1px solid #eeeeee;">
        <td style="padding: 10px 12px; font-weight: 600; color: #2d3436;">${item.name || 'Product'}</td>
        <td style="padding: 10px 12px; color: #636e72;">${item.variant || '-'}</td>
        <td style="padding: 10px 12px; text-align: center; color: #2d3436;">${qty}</td>
        <td style="padding: 10px 12px; text-align: right; color: #2d3436;">₹${price.toLocaleString('en-IN')}</td>
        <td style="padding: 10px 12px; text-align: right; font-weight: bold; color: #2d3436;">₹${sub.toLocaleString('en-IN')}</td>
      </tr>
    `;
  }).join('');

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Invoice #${shortId} - Dinesh Agencies</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f7f9fa; margin: 0; padding: 20px; color: #333; }
    .invoice-card { max-width: 680px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08); border: 1px solid #e1e8ed; }
    .header { background: linear-gradient(135deg, #ff9f43 0%, #ee5253 100%); color: #ffffff; padding: 25px 30px; display: flex; justify-content: space-between; align-items: center; }
    .header h1 { margin: 0; font-size: 22px; font-weight: 800; letter-spacing: 0.5px; }
    .header p { margin: 3px 0 0 0; font-size: 13px; opacity: 0.9; }
    .meta-section { padding: 20px 30px; background: #fafbfc; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; flex-wrap: wrap; gap: 15px; }
    .meta-col { flex: 1 1 240px; font-size: 13px; line-height: 1.6; }
    .meta-col strong { color: #2d3436; }
    .status-badge { display: inline-block; padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: 700; text-transform: uppercase; background: #ffeaa7; color: #d63031; }
    .table-container { padding: 15px 30px; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; margin-top: 10px; }
    th { background: #f1f2f6; color: #4b6584; text-align: left; padding: 10px 12px; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; }
    .total-box { padding: 15px 30px 25px 30px; text-align: right; }
    .total-row { display: flex; justify-content: flex-end; align-items: baseline; gap: 15px; }
    .total-label { font-size: 15px; font-weight: 600; color: #57606f; }
    .total-amount { font-size: 24px; font-weight: 800; color: #ff9f43; }
    .footer { background: #f8f9fa; border-top: 1px solid #eee; padding: 20px 30px; text-align: center; font-size: 12px; color: #8395a7; line-height: 1.5; }
    @media print {
      body { background: #fff; padding: 0; }
      .invoice-card { box-shadow: none; border: none; max-width: 100%; }
    }
  </style>
</head>
<body>
  <div class="invoice-card">
    <div class="header">
      <div>
        <h1>DINESH AGENCIES</h1>
        <p>Wholesale Distributor • Salem Road, Dharmapuri</p>
      </div>
      <div style="text-align: right;">
        <div style="font-size: 14px; font-weight: 700;">OFFICIAL INVOICE</div>
        <p style="font-size: 11px;">#${shortId}</p>
      </div>
    </div>

    <div class="meta-section">
      <div class="meta-col">
        <p style="margin: 0 0 5px 0;"><strong>Billed To:</strong> ${customerName}</p>
        <p style="margin: 0 0 5px 0;"><strong>Phone:</strong> ${phone}</p>
        <p style="margin: 0 0 5px 0;"><strong>Email:</strong> ${email}</p>
        <p style="margin: 0;"><strong>Delivery Address:</strong> ${address}</p>
      </div>
      <div class="meta-col" style="text-align: right;">
        <p style="margin: 0 0 5px 0;"><strong>Order Date:</strong> ${orderDate}</p>
        <p style="margin: 0 0 5px 0;"><strong>Payment Method:</strong> Cash on Delivery (COD)</p>
        <p style="margin: 0;"><strong>Status:</strong> <span class="status-badge">${status}</span></p>
      </div>
    </div>

    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th>Item Description</th>
            <th>Variant</th>
            <th style="text-align: center;">Qty</th>
            <th style="text-align: right;">Price</th>
            <th style="text-align: right;">Subtotal</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    </div>

    <div class="total-box">
      <div class="total-row">
        <span class="total-label">Total Amount Payable:</span>
        <span class="total-amount">₹${total}</span>
      </div>
      <div style="font-size: 12px; color: #747d8c; margin-top: 4px;">Inclusive of all applicable wholesale distributor taxes</div>
    </div>

    <div class="footer">
      <p>Thank you for choosing Dinesh Agencies! For bulk orders or delivery inquiries, call <strong>9443695071 / 9566714372</strong>.</p>
      <p>Dinesh Agencies • Quality & Service You Can Trust</p>
    </div>
  </div>
</body>
</html>`;
};

/**
 * Downloads the invoice HTML file directly to user device
 */
export const downloadInvoiceFile = (order) => {
  if (!order) return;
  const rawId = (order._id || order.id || '').toString();
  const shortId = rawId.length > 8 ? rawId.slice(-8) : rawId;
  const html = generateClientInvoiceHtml(order);

  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Invoice_Dinesh_Agencies_${shortId}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

/**
 * Triggers backend email dispatch to customer email
 */
export const sendInvoiceEmail = async (orderId, email, apiUrl) => {
  const base = apiUrl || import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
  const res = await axios.post(`${base}/orders/${orderId}/send-email`, { email });
  return res.data;
};
