require('dotenv').config();
const mongoose = require('mongoose');
const Order = require('../models/Order');
const { sendOrderEmail } = require('../utils/email');

async function main() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB Atlas');

    // Find all orders
    const orders = await Order.find({}).sort({ createdAt: -1 });
    console.log(`Checking ${orders.length} orders in database...`);

    let sentCount = 0;
    for (const ord of orders) {
      let targetEmail = ord.customer_email;
      if (!targetEmail && ord.customer_name && ord.customer_name.includes('@')) {
        targetEmail = ord.customer_name.trim();
        ord.customer_email = targetEmail;
        await ord.save();
      }

      if (targetEmail && targetEmail.includes('@') && targetEmail.includes('.')) {
        console.log(`\nDispatching Bill for Order #${ord._id} to ${targetEmail} (${ord.customer_name || ord.username}, Amount: ₹${ord.total_amount})...`);
        const res = await sendOrderEmail(ord, targetEmail);
        if (res.success) {
          console.log(`--> SUCCESS! MessageID: ${res.messageId}`);
          sentCount++;
        } else {
          console.error(`--> FAILED: ${res.error || res.reason}`);
        }
      } else {
        console.log(`Skipping Order #${ord._id} (Customer: ${ord.customer_name || 'Anonymous'}) - No email address.`);
      }
    }

    console.log(`\n========================================`);
    console.log(`Completed: Dispatched ${sentCount} bill emails.`);
    console.log(`========================================`);
    process.exit(0);
  } catch (err) {
    console.error('Fatal error:', err);
    process.exit(1);
  }
}

main();
