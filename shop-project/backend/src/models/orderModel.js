const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true, min: 1 },
  image: { type: String, default: '' },
  variant: { type: mongoose.Schema.Types.ObjectId, default: null },
  variantLabel: { type: String, default: '' },
});

const statusHistorySchema = new mongoose.Schema({
  status: { type: String, required: true },
  changedAt: { type: Date, default: Date.now },
  changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  note: { type: String, default: '' },
});

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    orderItems: [orderItemSchema],
    shippingAddress: {
      recipientName: { type: String },
      street: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      phone: { type: String, required: true },
    },
    paymentMethod: {
      type: String,
      enum: ['COD', 'Banking', 'VNPAY'],
      default: 'COD',
    },
    coupon: {
      code: { type: String, default: '' },
      discountAmount: { type: Number, default: 0 },
    },
    itemsPrice: { type: Number, required: true, default: 0 },
    shippingPrice: { type: Number, default: 0 },
    totalPrice: { type: Number, required: true, default: 0 },
    status: {
      type: String,
      enum: ['Pending', 'Confirmed', 'Processing', 'Shipping', 'Delivered', 'Cancelled'],
      default: 'Pending',
    },
    trackingNumber: { type: String, default: '' },
    shippingNotes: { type: String, default: '' },
    isPaid: { type: Boolean, default: false },
    paidAt: { type: Date },
    deliveredAt: { type: Date },
    cancelledAt: { type: Date },
    cancelReason: { type: String, default: '' },
    statusHistory: [statusHistorySchema],
  },
  { timestamps: true }
);

orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ status: 1, createdAt: -1 });

const Order = mongoose.model('Order', orderSchema);
module.exports = Order;

