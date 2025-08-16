const Razorpay = require('razorpay');
const crypto = require('crypto');
const SubscriptionPlan = require('../models/SubscriptionPlan');
const PaymentTransaction = require('../models/PaymentTransaction');
const User = require('../models/User');

// Init Razorpay instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || '',
  key_secret: process.env.RAZORPAY_KEY_SECRET || ''
});

// Debug: Log Razorpay configuration (without exposing secrets)
console.log('🔑 Razorpay initialized with key_id:', process.env.RAZORPAY_KEY_ID ? 'SET' : 'NOT SET');
console.log('🔑 Razorpay initialized with key_secret:', process.env.RAZORPAY_KEY_SECRET ? 'SET' : 'NOT SET');

// Admin: seed default plans (idempotent)
exports.seedDefaultPlans = async (req, res) => {
  try {
    const defaults = [
      { key: 'monthly', name: 'Monthly', durationDays: 30, priceInr: 499, sortOrder: 1 },
      { key: 'quarterly', name: '3 Months', durationDays: 90, priceInr: 1299, sortOrder: 2 },
      { key: 'half_yearly', name: '6 Months', durationDays: 180, priceInr: 2299, sortOrder: 3 }
    ];

    const results = [];
    for (const plan of defaults) {
      const updated = await SubscriptionPlan.findOneAndUpdate(
        { key: plan.key },
        { $set: { ...plan, isActive: true } },
        { upsert: true, new: true }
      );
      results.push(updated);
    }

    res.json({ success: true, data: results });
  } catch (error) {
    console.error('Seed plans error:', error);
    res.status(500).json({ success: false, message: 'Failed to seed plans' });
  }
};

// Public: list active plans
exports.getPlans = async (req, res) => {
  try {
    const plans = await SubscriptionPlan.find({ isActive: true }).sort({ sortOrder: 1 });
    res.json({ success: true, data: plans });
  } catch (error) {
    console.error('Get plans error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch plans' });
  }
};

// Admin: create/update a plan
exports.upsertPlan = async (req, res) => {
  try {
    const { key, name, description, durationDays, priceInr, isActive = true, sortOrder = 0 } = req.body;
    if (!key || !name || !durationDays || !priceInr) {
      return res.status(400).json({ success: false, message: 'key, name, durationDays, priceInr are required' });
    }
    const plan = await SubscriptionPlan.findOneAndUpdate(
      { key },
      { $set: { name, description, durationDays, priceInr, isActive, sortOrder } },
      { upsert: true, new: true }
    );
    res.json({ success: true, data: plan });
  } catch (error) {
    console.error('Upsert plan error:', error);
    res.status(500).json({ success: false, message: 'Failed to save plan' });
  }
};

// Admin: toggle plan active
exports.togglePlan = async (req, res) => {
  try {
    const { id } = req.params;
    const plan = await SubscriptionPlan.findById(id);
    if (!plan) return res.status(404).json({ success: false, message: 'Plan not found' });
    plan.isActive = !plan.isActive;
    await plan.save();
    res.json({ success: true, data: plan });
  } catch (error) {
    console.error('Toggle plan error:', error);
    res.status(500).json({ success: false, message: 'Failed to toggle plan' });
  }
};

// Admin: manually set user subscription status
exports.setUserSubscription = async (req, res) => {
  try {
    const { userId } = req.params;
    const { planKey = null, isActive = false } = req.body;
    console.log('setUserSubscription called with:', { userId, planKey, isActive });
    
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    if (!planKey || !isActive) {
      // remove subscription
      console.log('Removing subscription for user:', user.email);
      user.subscription.type = 'free';
      user.subscription.isActive = false;
      user.subscription.startDate = null;
      user.subscription.endDate = null;
      user.subscription.amount = 0;
      user.subscription.paymentStatus = 'cancelled';
      await user.save();
      console.log('User moved to free plan');
      return res.json({ success: true, message: 'User moved to free plan', data: user.sanitize() });
    }

    const plan = await SubscriptionPlan.findOne({ key: planKey, isActive: true });
    if (!plan) return res.status(404).json({ success: false, message: 'Plan not found or inactive' });

    console.log('Setting subscription for user:', user.email, 'plan:', plan.name);
    const now = new Date();
    const endDate = new Date(now.getTime() + plan.durationDays * 24 * 60 * 60 * 1000);
    console.log('Start date:', now, 'End date:', endDate);
    
    user.subscription.type = plan.key;
    user.subscription.isActive = true;
    user.subscription.startDate = now;
    user.subscription.endDate = endDate;
    user.subscription.amount = plan.priceInr;
    user.subscription.paymentStatus = 'completed';
    await user.save();

    console.log('User subscription updated successfully');
    res.json({ success: true, message: 'User subscription updated', data: user.sanitize() });
  } catch (error) {
    console.error('Set user subscription error:', error);
    res.status(500).json({ success: false, message: 'Failed to set user subscription' });
  }
};

// User: create Razorpay order for a plan
exports.createOrder = async (req, res) => {
  try {
    console.log('🎯 createOrder called with planKey:', req.body.planKey);
    console.log('🎯 User ID:', req.user.id);
    
    const { planKey } = req.body;
    const plan = await SubscriptionPlan.findOne({ key: planKey, isActive: true });
    if (!plan) return res.status(404).json({ success: false, message: 'Plan not found' });
    
    console.log('🎯 Plan found:', plan.name, 'Price:', plan.priceInr);

    const amountPaise = plan.priceInr * 100; // Razorpay uses smallest currency unit
    console.log('🎯 Creating Razorpay order for amount (paise):', amountPaise);
    
    const order = await razorpay.orders.create({
      amount: amountPaise,
      currency: 'INR',
      receipt: `rcpt_${Date.now()}`, // Shortened receipt ID to meet Razorpay's 40 char limit
      notes: { planKey }
    });

    console.log('🎯 Razorpay order created successfully:', order.id);
    console.log('🎯 Creating transaction record...');
    
    const transaction = await PaymentTransaction.create({
      user: req.user.id,
      plan: plan._id,
      amountInr: plan.priceInr,
      currency: 'INR',
      razorpayOrderId: order.id,
      status: 'created',
      notes: { planKey }
    });
    
    console.log('🎯 Transaction created:', transaction._id);
    res.json({ success: true, data: { order, transactionId: transaction._id } });
  } catch (error) {
    console.error('🚨 Create order error:', error);
    console.error('🚨 Error stack:', error.stack);
    console.error('🚨 Error message:', error.message);
    res.status(500).json({ success: false, message: 'Failed to create order' });
  }
};

// Webhook: verify payment and activate subscription
exports.verifyPaymentWebhook = async (req, res) => {
  try {
    const signature = req.headers['x-razorpay-signature'];
    const body = JSON.stringify(req.body);
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET || '')
      .update(body)
      .digest('hex');

    if (signature !== expectedSignature) {
      return res.status(400).json({ success: false, message: 'Invalid signature' });
    }

    const event = req.body.event;
    const payload = req.body.payload || {};

    if (event === 'payment.captured' || event === 'order.paid') {
      const payment = payload.payment?.entity || payload.order?.entity;
      const razorpayOrderId = payment.order_id || payload.order?.entity?.id;
      const transaction = await PaymentTransaction.findOne({ razorpayOrderId }).populate('plan').populate('user');
      if (!transaction) return res.status(404).json({ success: false, message: 'Transaction not found' });

      transaction.status = 'paid';
      transaction.razorpayPaymentId = payment.id || transaction.razorpayPaymentId;
      transaction.razorpaySignature = signature;
      await transaction.save();

      // Activate user subscription
      const user = await User.findById(transaction.user._id);
      if (user) {
        const now = new Date();
        const endDate = new Date(now.getTime() + transaction.plan.durationDays * 24 * 60 * 60 * 1000);
        user.subscription.type = transaction.plan.key;
        user.subscription.isActive = true;
        user.subscription.startDate = now;
        user.subscription.endDate = endDate;
        user.subscription.amount = transaction.amountInr;
        user.subscription.paymentStatus = 'completed';
        user.subscription.transactionId = transaction._id.toString();
        await user.save();
      }
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ success: false, message: 'Webhook processing failed' });
  }
};

// User: verify payment from client confirmation (non-webhook fallback)
exports.verifyPaymentClient = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    
    console.log('🔐 verifyPaymentClient called with:', { 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature: razorpay_signature ? 'SET' : 'NOT SET' 
    });
    
    // Check if required fields are present
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      console.log('🔐 Missing required fields:', { razorpay_order_id, razorpay_payment_id, razorpay_signature });
      return res.status(400).json({ success: false, message: 'Missing payment verification data' });
    }
    
    // Verify signature
    const razorpaySecret = process.env.RAZORPAY_KEY_SECRET || '';
    console.log('🔐 Razorpay secret length:', razorpaySecret.length);
    
    const generatedSignature = crypto
      .createHmac('sha256', razorpaySecret)
      .update(razorpay_order_id + '|' + razorpay_payment_id)
      .digest('hex');

    console.log('🔐 Signature comparison:', {
      generated: generatedSignature.substring(0, 10) + '...',
      received: razorpay_signature.substring(0, 10) + '...',
      match: generatedSignature === razorpay_signature
    });

    if (generatedSignature !== razorpay_signature) {
      console.log('🔐 Signature verification failed');
      return res.status(400).json({ success: false, message: 'Signature verification failed' });
    }

    const transaction = await PaymentTransaction.findOne({ razorpayOrderId: razorpay_order_id }).populate('plan');
    if (!transaction) return res.status(404).json({ success: false, message: 'Transaction not found' });

    transaction.status = 'paid';
    transaction.razorpayPaymentId = razorpay_payment_id;
    transaction.razorpaySignature = razorpay_signature;
    await transaction.save();

    // Activate subscription
    const user = await User.findById(req.user.id);
    const now = new Date();
    const endDate = new Date(now.getTime() + transaction.plan.durationDays * 24 * 60 * 60 * 1000);
    user.subscription.type = transaction.plan.key;
    user.subscription.isActive = true;
    user.subscription.startDate = now;
    user.subscription.endDate = endDate;
    user.subscription.amount = transaction.amountInr;
    user.subscription.paymentStatus = 'completed';
    user.subscription.transactionId = transaction._id.toString();
    await user.save();

    res.json({ success: true, message: 'Payment verified and subscription activated' });
  } catch (error) {
    console.error('Client verify error:', error);
    res.status(500).json({ success: false, message: 'Verification failed' });
  }
};

// Admin: list transactions with filters
exports.listTransactions = async (req, res) => {
  try {
    const { page = 1, limit = 10, status = '', userId = '' } = req.query;
    const query = {};
    if (status) query.status = status;
    if (userId) query.user = userId;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [items, total] = await Promise.all([
      PaymentTransaction.find(query)
        .populate('user', 'name email')
        .populate('plan', 'key name priceInr durationDays')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      PaymentTransaction.countDocuments(query)
    ]);

    res.json({ success: true, data: { items, pagination: { page: parseInt(page), limit: parseInt(limit), total } } });
  } catch (error) {
    console.error('List transactions error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch transactions' });
  }
};


