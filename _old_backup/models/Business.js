const mongoose = require('mongoose');

const businessSchema = new mongoose.Schema({
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: { type: String, required: true },
  description: { type: String },
  category: { type: String, required: true }, // e.g., 'Food & Dining'
  subCategory: { type: String }, // e.g., 'Pure Veg Restaurants'
  
  // Contact details (Will be hidden on free tier)
  contact: {
    phone: { type: String },
    whatsapp: { type: String },
    email: { type: String }
  },
  
  location: {
    city: { type: String, required: true }, // Udupi, Mangaluru
    address: { type: String }
  },

  // Media
  profileImage: { type: String }, // Hardlocked to 1 image for free tier
  media: {
    gallery: [{ type: String }], // Multi-image
    youtubeEmbed: { type: String } // Embedded Video Ad (Premium Only)
  },

  // Escrow & Document Compliance
  documents: {
    tradeLicense: { type: String }, // URL to uploaded PDF/JPEG
    fssai: { type: String }
  },

  // Subscription Details (Revenue Engine)
  subscription: {
    plan: { type: String, enum: ['free', 'premium'], default: 'free' },
    startDate: { type: Date },
    expiryDate: { type: Date } // Expiry triggers auto-suspend
  },

  // Global Manual Review Safety Queue (Anti-Switch Trick Control)
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'suspended'],
    default: 'pending' // Default pending for admin review
  },
  
  // When a vendor updates their profile, changes go here first instead of overriding live data
  pendingUpdates: {
    type: Object,
    default: null
  }

}, { timestamps: true });

module.exports = mongoose.model('Business', businessSchema);
