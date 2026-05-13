const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  passwordHash: {
    type: String,
    required: true
  },
  role: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Role',
    required: true
  },
  status: {
    type: String,
    enum: ['actif', 'inactif', 'en_attente_validation', 'email_a_verifier'],
    default: 'actif'
  },
  emailValidationToken: String,
  emailValidationExpires: Date,
  activatedAt: Date
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);



