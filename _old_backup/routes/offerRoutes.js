const express = require('express');
const router = express.Router();

let offers = [
  { id: "off_1", title: "FLAT 50% OFF", subtitle: "On All Services", businessName: "Sagar Spa & Salon", location: "Manipal", code: "PVRS50", bg: "bg-orange-500", expiry: "Valid till 31st Oct 2026" },
  { id: "off_2", title: "BUY 1 GET 1", subtitle: "Premium Meals", businessName: "Hotel Supreme", location: "Udupi", code: "SUPREMEBOGO", bg: "bg-blue-600", expiry: "Valid on Weekends" },
  { id: "off_3", title: "20% DISCOUNT", subtitle: "Electronics Repair", businessName: "Mangalore Tech Hub", location: "Mangaluru", code: "TECH20", bg: "bg-green-600", expiry: "First 100 Customers" }
];

router.get('/', (req, res) => {
  res.json(offers);
});

module.exports = router;
