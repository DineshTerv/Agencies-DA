const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');

router.post('/', orderController.placeOrder);
router.get('/', orderController.getAllOrders);
router.get('/user/:username', orderController.getUserOrders);
router.put('/:id/status', orderController.updateOrderStatus);
router.post('/:id/notify-whatsapp', orderController.notifyOrderWhatsApp);
router.post('/:id/send-email', orderController.sendInvoiceEmail);
router.get('/:id/invoice-html', orderController.downloadInvoiceHtml);
router.put('/:id/assign', orderController.assignWorker);
router.delete('/:id', orderController.deleteOrder);

module.exports = router;
