const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');

router.post('/', orderController.placeOrder);
router.get('/', orderController.getAllOrders);
router.put('/:id/status', orderController.updateOrderStatus);
router.put('/:id/assign', orderController.assignWorker);
router.delete('/:id', orderController.deleteOrder);

module.exports = router;
