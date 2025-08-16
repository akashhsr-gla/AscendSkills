const mongoose = require('mongoose');

const PaymentTransactionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  plan: { type: mongoose.Schema.Types.ObjectId, ref: 'SubscriptionPlan', required: true },
  amountInr: { type: Number, required: true },
  currency: { type: String, default: 'INR' },
  razorpayOrderId: { type: String },
  razorpayPaymentId: { type: String },
  razorpaySignature: { type: String },
  status: { type: String, enum: ['created', 'paid', 'failed', 'refunded'], default: 'created' },
  paymentMethod: { type: String, default: 'razorpay' },
  notes: { type: Object, default: {} }
}, { timestamps: true });

PaymentTransactionSchema.index({ user: 1, createdAt: -1 });
PaymentTransactionSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('PaymentTransaction', PaymentTransactionSchema);


