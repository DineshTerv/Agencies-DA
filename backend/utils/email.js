const nodemailer = require('nodemailer');

/**
 * Creates and returns a Nodemailer transporter.
 * Supports Gmail, custom SMTP, or falls back to an Ethereal test transporter if no credentials set.
 */
const getTransporter = async () => {
  if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    if (process.env.SMTP_HOST) {
      return nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT) || 465,
        secure: process.env.SMTP_SECURE !== 'false',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        },
        connectionTimeout: 15000,
        greetingTimeout: 15000,
        socketTimeout: 20000
      });
    }

    // Connect via Gmail SSL on port 465 (works on Render, AWS, and cloud hosts)
    return nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      },
      connectionTimeout: 5000,
      greetingTimeout: 5000,
      socketTimeout: 8000
    });
  }

  // Fallback: create ethereal test account for demonstration if no credentials provided
  try {
    const testAccount = await nodemailer.createTestAccount();
    return nodemailer.createTransport({
      host: testAccount.smtp.host,
      port: testAccount.smtp.port,
      secure: testAccount.smtp.secure,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass
      }
    });
  } catch (err) {
    console.warn('[Email Helper] Could not create Ethereal test account:', err.message);
    return null;
  }
};

/**
 * Generates an HTML invoice bill template for Dinesh Agencies orders
 */
const generateInvoiceHtml = (order) => {
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

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Invoice - Dinesh Agencies</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f7f9fa; margin: 0; padding: 20px; color: #333; }
        .invoice-card { max-width: 650px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08); border: 1px solid #e1e8ed; }
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
        .contact-btn { display: inline-block; margin-top: 10px; background: #ff9f43; color: #ffffff !important; text-decoration: none; padding: 8px 16px; border-radius: 6px; font-weight: 600; font-size: 12px; }
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
    </html>
  `;
};

/**
 * Sends order invoice email to customer
 */
const sendOrderEmail = async (order, targetEmail = null) => {
  const recipient = (targetEmail || order.customer_email || '').trim();
  if (!recipient || !recipient.includes('@')) {
    console.log('[Email Helper] No valid recipient email for order:', order._id || order.id);
    return { success: false, reason: 'No valid recipient email address' };
  }

  const rawId = (order._id || order.id || '').toString();
  const shortId = rawId.length > 8 ? rawId.slice(-8) : rawId;
  const statusTag = order.status && order.status !== 'PENDING' ? `[${order.status.replace(/_/g, ' ')}] ` : '';
  const subject = `${statusTag}Order Invoice #${shortId} - Dinesh Agencies`;
  const htmlContent = generateInvoiceHtml(order);

  try {
    const transporter = await getTransporter();
    if (!transporter) {
      return { success: false, reason: 'Email transporter not available' };
    }

    const sender = process.env.EMAIL_FROM || (process.env.EMAIL_USER ? `"Dinesh Agencies" <${process.env.EMAIL_USER}>` : 'Dinesh Agencies <orders@dinesh-agencies.com>');

    const sendPromise = transporter.sendMail({
      from: sender,
      to: recipient,
      subject,
      html: htmlContent
    });

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Email dispatch timed out')), 8000)
    );

    const info = await Promise.race([sendPromise, timeoutPromise]);

    console.log(`[Email Dispatched] To: ${recipient} | MessageId: ${info.messageId}`);
    
    // If test ethereal account, log preview URL
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      console.log(`[Email Preview URL]: ${previewUrl}`);
    }

    return { 
      success: true, 
      recipient, 
      messageId: info.messageId, 
      previewUrl: previewUrl || null 
    };
  } catch (err) {
    console.error('[Email Helper Error]:', err.message);
    return { success: false, error: err.message };
  }
};

module.exports = {
  sendOrderEmail,
  generateInvoiceHtml
};
