const express = require('express');
const router = express.Router();

// Mock DB (Since MongoDB is offline)
let otpStore = {}; 
let users = [];

// 1. Request OTP
router.post('/request-otp', (req, res) => {
  const { phone } = req.body;
  const otp = '123456'; 
  otpStore[phone] = otp;
  res.json({ message: `OTP sent successfully to +91 ${phone}` });
});

// 2. Explicit Signup (Requires Admin Approval later)
router.post('/signup', (req, res) => {
  const { name, phone, otp } = req.body;
  if (otpStore[phone] !== otp) return res.status(401).json({ message: 'Invalid OTP' });
  
  delete otpStore[phone];

  let user = users.find(u => u.phone === phone);
  if (user) return res.status(400).json({ message: 'User already exists, please login.' });

  user = {
    id: 'usr_' + Date.now(),
    name,
    phone,
    role: 'vendor',
    isApproved: false // SIGNUP KE BAAD APPROVAL LOCK
  };
  users.push(user);

  res.json({ message: 'Signup successful! Pending Admin Approval.', user });
});

// 3. Login
router.post('/verify-otp', (req, res) => {
  const { phone, otp } = req.body;
  if (otpStore[phone] !== otp) return res.status(401).json({ message: 'Invalid OTP' });
  
  delete otpStore[phone];

  let user = users.find(u => u.phone === phone);
  if (!user) return res.status(404).json({ message: 'User not found. Please signup first.' });

  res.json({ 
    message: 'Login successful', 
    user 
  });
});

// --- ADMIN ROUTES FOR USERS ---

// 4. Get all users
router.get('/', (req, res) => {
  res.json(users);
});

// 5. Get pending users (unapproved vendors)
router.get('/pending', (req, res) => {
  const pending = users.filter(u => u.isApproved === false);
  res.json(pending);
});

// 6. Approve User
router.put('/approve/:id', (req, res) => {
  const user = users.find(u => u.id === req.params.id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  
  user.isApproved = true;
  res.json({ message: 'User approved successfully', user });
});

module.exports = router;
