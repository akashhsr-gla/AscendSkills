const mongoose = require('mongoose');

const SubscriptionPlanSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true, lowercase: true, trim: true }, // monthly | quarterly | half_yearly
  name: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  durationDays: { type: Number, required: true },
  priceInr: { type: Number, required: true },
  isActive: { type: Boolean, default: true },
  sortOrder: { type: Number, default: 0 }
}, { timestamps: true });

SubscriptionPlanSchema.index({ key: 1 }, { unique: true });
SubscriptionPlanSchema.index({ isActive: 1, sortOrder: 1 });

module.exports = mongoose.model('SubscriptionPlan', SubscriptionPlanSchema);


