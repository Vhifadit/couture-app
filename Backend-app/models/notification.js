const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  order_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    default: null
  },
  type: {
    type: String,
    enum: [
      'ORDER_CREATED',
      'ORDER_STATUS_CHANGED',
      'ORDER_CANCELLED',
      'DELIVERY_REMINDER',
      'ORDER_LATE',
      'NEW_MESSAGE'
    ],
    required: true
  },
  titre: { type: String, required: true },
  message: { type: String, required: true },
  lu: { type: Boolean, default: false },
  date_lecture: Date
}, { timestamps: true });

notificationSchema.index({ user_id: 1, lu: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
