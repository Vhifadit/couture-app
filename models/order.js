const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  client_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  couturier_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // ✅ CORRIGÉ: service_type (pas service_id)
  service_type: {
    type: String,
    required: true,
    enum: ['RETOUCHE', 'CREATION_SUR_MESURE', 'CONFECTION', 'AUTRE']
  },
  // ✅ OPTIONNEL: adresse de rendez-vous (pas location_id)
  meeting_address: {
    type: String,
    default: null
  },
  date: {
    type: Date,
    required: true
  },
  start_time: {
    type: String,
    required: true
  },
  end_time: {
    type: String,
    required: true,
    validate: {
      validator: function(v) {
        return v > this.start_time;
      },
      message: 'end_time doit être après start_time'
    }
  },
  status: {
    type: String,
    enum: ['PLANNED', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'MODIFIED'],
    default: 'PLANNED'
  },
  notes: {
    type: String,
    default: null
  },
  measurements: {
    type: Map,
    of: String,
    default: {}
  },
  estimated_price: {
    type: Number,
    default: null
  },
  // ✅ AJOUTÉ: prix final après négociation
  final_price: {
    type: Number,
    default: null
  },
  history: [{
    status: String,
    changed_at: { type: Date, default: Date.now },
    changed_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reason: String  // ✅ Pourquoi le changement
  }]
}, { timestamps: true });

// Index
orderSchema.index({ client_id: 1, createdAt: -1 });
orderSchema.index({ couturier_id: 1, date: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ service_type: 1 });

module.exports = mongoose.model('Order', orderSchema);