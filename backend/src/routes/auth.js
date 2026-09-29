const router = require('express').Router();
const db = require('../db');
const { sign, auth } = require('../util');

const otps = new Map(); // phone -> {otp, exp, tries}
const valid = (p) => /^[6-9]\d{9}$/.test(p || '');

router.post('/request-otp', (req, res) => {
  const { phone } = req.body;
  if (!valid(phone)) return res.status(400).json({ message: 'Enter a valid 10-digit Indian mobile number' });
  if ((process.env.OTP_MODE || 'dev') === 'firebase') return res.json({ message: 'Use Firebase to send OTP', mode: 'firebase' });
  otps.set(phone, { otp: '123456', exp: Date.now() + 5 * 60e3, tries: 0 });
  res.json({ message: `OTP sent to +91 ${phone} (test OTP: 123456)`, mode: 'dev' });
});

async function verifyFirebase(idToken) {
  const key = process.env.FIREBASE_API_KEY;
  const r = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${key}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ idToken }),
  });
  const j = await r.json();
  const u = j.users && j.users[0];
  if (!u || !u.phoneNumber) throw new Error('Invalid Firebase token');
  return { phone: u.phoneNumber.replace(/^\+91/, ''), uid: u.localId };
}

// Single endpoint for login + signup. intent: 'user' | 'vendor'
router.post('/verify-otp', async (req, res) => {
  let { phone, otp, name, intent, firebaseToken } = req.body;
  let firebaseUid;
  try {
    if ((process.env.OTP_MODE || 'dev') === 'firebase') {
      const f = await verifyFirebase(firebaseToken); phone = f.phone; firebaseUid = f.uid;
    } else {
      const rec = otps.get(phone);
      if (!rec || rec.exp < Date.now()) return res.status(401).json({ message: 'OTP expired, request again' });
      if (rec.tries++ >= 5) { otps.delete(phone); return res.status(429).json({ message: 'Too many attempts' }); }
      if (rec.otp !== String(otp)) return res.status(401).json({ message: 'Invalid OTP' });
      otps.delete(phone);
    }
  } catch (e) { return res.status(401).json({ message: e.message }); }

  let user = db.find('users', (u) => u.phone === phone)[0];
  const isAdmin = phone === process.env.ADMIN_PHONE;
  if (!user) {
    const role = isAdmin ? 'admin' : intent === 'vendor' ? 'vendor' : 'user';
    user = db.insert('users', {
      phone, name: name || '', role, firebaseUid,
      // Vendors need admin approval; normal users are active immediately
      status: role === 'vendor' ? 'pending' : 'approved',
    }, 'usr');
    if (role === 'vendor') db.log('vendor_signup', user._id, { phone });
  } else {
    if (isAdmin && user.role !== 'admin') db.update('users', user._id, { role: 'admin', status: 'approved' });
    if (intent === 'vendor' && user.role === 'user') db.update('users', user._id, { role: 'vendor', status: 'pending' });
    if (name && !user.name) db.update('users', user._id, { name });
  }
  if (user.blocked) return res.status(403).json({ message: 'Account blocked. Contact support.' });
  res.json({ token: sign(user), user });
});

router.get('/me', auth(), (req, res) => res.json(req.user));
router.put('/me', auth(), (req, res) => {
  const { name, email } = req.body;
  res.json(db.update('users', req.user._id, { name, email }));
});

module.exports = router;
