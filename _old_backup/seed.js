const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Business = require('./models/Business');

dotenv.config();

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('Connected to DB');
    
    // Create dummy pending business
    const dummyBusiness = new Business({
      ownerId: new mongoose.Types.ObjectId(), // Fake ID
      name: "Udupi Sri Krishna Bhavan",
      description: "Authentic South Indian Veg Restaurant.",
      category: "Food & Dining",
      subCategory: "Pure Veg Restaurants",
      contact: { phone: "9876543210", whatsapp: "9876543210" },
      location: { city: "Udupi", address: "Car Street" },
      status: "pending",
      documents: { tradeLicense: "uploaded", fssai: "uploaded" },
      subscription: { plan: 'free' }
    });

    await dummyBusiness.save();
    console.log('Dummy pending business inserted!');
    process.exit();
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
