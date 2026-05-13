const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  order_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true,
    unique: true
  },
  client_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  couturier_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Couturier',
    required: true,
    index: true
  },
  couturier_user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  note: {
    type: Number,
    min: 1,
    max: 5,
    required: true
  },
  commentaire: {
    type: String,
    maxlength: 1000,
    trim: true
  }
}, { timestamps: true });

module.exports = mongoose.model('Review', reviewSchema);
