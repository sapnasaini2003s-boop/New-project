const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  phone: {
    type: String,
    required: true,
    unique: true,
    match: [/^\d{10}$/, 'Please enter a valid 10-digit mobile number'] // 10-Digit Mobile Number requirement
  },
  role: {
    type: String,
    enum: ['user', 'vendor', 'admin'],
    default: 'user'
  },
  name: {
    type: String
  },
  firebaseUid: {
    type: String,
    unique: true, // Tied to Firebase Phone Auth
    sparse: true
  }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
