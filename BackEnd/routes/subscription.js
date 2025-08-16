const express = require('express');
const router = express.Router();
const { authenticate, authorize, optionalAuth } = require('../middleware/auth');
const controller = require('../controllers/subscriptionController');

// Public
router.get('/plans', controller.getPlans);

// Admin
router.post('/admin/seed', authenticate, authorize('admin'), controller.seedDefaultPlans);
router.post('/admin/plan', authenticate, authorize('admin'), controller.upsertPlan);
router.patch('/admin/plan/:id/toggle', authenticate, authorize('admin'), controller.togglePlan);
router.put('/admin/user/:userId/subscription', authenticate, authorize('admin'), controller.setUserSubscription);
router.get('/admin/transactions', authenticate, authorize('admin'), controller.listTransactions);

// User purchase flow
router.post('/order', authenticate, controller.createOrder);
router.post('/verify', authenticate, controller.verifyPaymentClient);

// Razorpay webhook (no auth, but signature verified)
router.post('/webhook/razorpay', express.json({ type: '*/*' }), controller.verifyPaymentWebhook);

module.exports = router;


