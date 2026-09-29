const express = require('express');
const router = express.Router();

// IN-MEMORY MOCK DATABASE (Because MongoDB is not installed locally)
let businesses = [
  {
    _id: "biz_001",
    name: "Udupi Sri Krishna Bhavan",
    description: "Authentic South Indian Veg Restaurant.",
    category: "Food & Dining",
    subCategory: "Pure Veg Restaurants",
    contact: { phone: "9876543210", whatsapp: "9876543210" },
    location: { city: "Udupi", address: "Car Street" },
    status: "pending", // Starts as pending for the Admin to approve
    documents: { tradeLicense: "uploaded", fssai: "uploaded" },
    subscription: { plan: "free" },
    createdAt: new Date().toISOString()
  },
  {
    _id: "biz_002",
    name: "Mangalore Tech Hub",
    description: "Computer repair and accessories.",
    category: "Electronics",
    subCategory: "Computer Shops",
    contact: { phone: "9123456789", whatsapp: "9123456789" },
    location: { city: "Mangaluru", address: "MG Road" },
    status: "approved", // Already approved
    documents: { tradeLicense: "uploaded" },
    subscription: { plan: "premium" }, // Premium plan will show contact info
    createdAt: new Date().toISOString()
  }
];

// 1. PUBLIC: Get all APPROVED businesses (For Homepage & Search)
router.get('/', (req, res) => {
  let approved = businesses.filter(b => b.status === 'approved');
  
  if (req.query.q) {
    const q = req.query.q.toLowerCase();
    approved = approved.filter(b => b.name.toLowerCase().includes(q) || b.category.toLowerCase().includes(q) || b.description.toLowerCase().includes(q));
  }
  
  if (req.query.category) {
    approved = approved.filter(b => b.category.toLowerCase() === req.query.category.toLowerCase());
  }

  res.json(approved);
});

// 2. PUBLIC: Get SINGLE business by ID
router.get('/:id', (req, res) => {
  const biz = businesses.find(b => b._id === req.params.id);
  if (biz) res.json(biz);
  else res.status(404).json({ message: 'Not found' });
});

// 3. ADMIN: Get all PENDING businesses (For Admin Queue)
router.get('/pending', (req, res) => {
  const pending = businesses.filter(b => b.status === 'pending');
  res.json(pending);
});

// 3. VENDOR: Create a new business
router.post('/', (req, res) => {
  const newBusiness = {
    ...req.body,
    _id: "biz_" + Math.floor(Math.random() * 10000),
    status: 'pending',
    createdAt: new Date().toISOString()
  };
  businesses.push(newBusiness);
  res.status(201).json({ message: 'Submitted successfully', data: newBusiness });
});

// 4. ADMIN: Approve a business
router.put('/approve/:id', (req, res) => {
  const index = businesses.findIndex(b => b._id === req.params.id);
  if (index === -1) return res.status(404).json({ message: 'Not found' });
  
  if (businesses[index].pendingUpdates) {
     Object.assign(businesses[index], businesses[index].pendingUpdates);
     businesses[index].pendingUpdates = null;
  }
  
  businesses[index].status = 'approved';
  res.json({ message: 'Approved', data: businesses[index] });
});

// 5. ADMIN: Reject a business
router.put('/reject/:id', (req, res) => {
    const index = businesses.findIndex(b => b._id === req.params.id);
    if (index === -1) return res.status(404).json({ message: 'Not found' });
    
    businesses[index].status = 'rejected';
    res.json({ message: 'Rejected', data: businesses[index] });
});

// 6. VENDOR: Request Profile Update (Goes to Manual Review)
router.put('/:id/vendor-update', (req, res) => {
    const index = businesses.findIndex(b => b._id === req.params.id);
    if (index === -1) return res.status(404).json({ message: 'Not found' });
    
    // Enforce Global Manual Review Safety Queue
    businesses[index].pendingUpdates = req.body;
    businesses[index].status = 'pending'; 
    res.json({ message: 'Updates submitted for Admin review', data: businesses[index] });
});

module.exports = router;
