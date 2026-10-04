const router = require('express').Router();
const db = require('../db');
const { sign, auth, features } = require('../util');
const { limit, clean, isEmail } = require('../guard');

const otps = new Map(); // phone -> {otp, exp, tries}
const valid = (p) => /^[6-9]\d{9}$/.test(p || '');

// Who is logging in, and does this login need an OTP? (controlled from Admin → Feature Controls)
function policy(phone, intent) {
  const f = features();
  const existing = db.find('users', (u) => u.phone === phone)[0];
  const isAdmin = phone === process.env.ADMIN_PHONE || existing?.role === 'admin' || existing?.role === 'moderator';
  const role = isAdmin ? 'admin' : existing?.role === 'vendor' || intent === 'vendor' ? 'vendor' : 'user';
  if (role === 'user' && !f.customerLogin) return { error: 'Customer login is currently disabled by admin.' };
  if (role === 'vendor' && !existing && !f.vendorSignup) return { error: 'New business registrations are paused. Please try again later.' };
  const otp = role === 'admin' ? true : role === 'vendor' ? f.vendorOtp : true;
  return { role, otp, existing };
}

router.get('/policy', (req, res) => {
  const { phone, intent } = req.query;
  if (!valid(phone)) return res.json({ otp: true });
  const p = policy(phone, intent); res.json({ otp: p.otp, error: p.error });
});

router.post('/request-otp', limit('otp-ip', 20, 3600e3), limit('otp', 4, 10 * 60e3, (r) => r.body.phone), (req, res) => {
  const { phone, intent } = req.body;
  if (!valid(phone)) return res.status(400).json({ message: 'Enter a valid 10-digit Indian mobile number' });
  const p = policy(phone, intent);
  if (p.error) return res.status(403).json({ message: p.error });
  if (!p.otp) return res.json({ message: 'No OTP needed — continue', otpRequired: false });
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
router.post('/verify-otp', limit('verify', 30, 10 * 60e3), async (req, res) => {
  let { phone, otp, name, intent, firebaseToken } = req.body;
  name = clean(name, 60); intent = intent === 'vendor' ? 'vendor' : 'user';
  let firebaseUid;
  if (!valid(phone) && !firebaseToken) return res.status(400).json({ message: 'Enter a valid 10-digit Indian mobile number' });
  const pol = firebaseToken ? { otp: true } : policy(phone, intent);
  if (pol.error) return res.status(403).json({ message: pol.error });
  try {
    if (!pol.otp) { /* OTP disabled for this role by admin */ }
    else if ((process.env.OTP_MODE || 'dev') === 'firebase') {
      const f = await verifyFirebase(firebaseToken); phone = f.phone; firebaseUid = f.uid;
    } else {
      const rec = otps.get(phone);
      if (!rec || rec.exp < Date.now()) return res.status(401).json({ message: 'OTP expired, request again' });
      if (rec.tries++ >= 5) { otps.delete(phone); return res.status(429).json({ message: 'Too many attempts' }); }
      if (rec.otp !== String(otp)) return res.status(401).json({ message: 'Invalid OTP' });
      otps.delete(phone);
    }
  } catch (e) { return res.status(401).json({ message: e.message }); }

  const p2 = policy(phone, intent);
  if (p2.error) return res.status(403).json({ message: p2.error });
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
  const name = clean(req.body.name, 60), email = clean(req.body.email, 100);
  if (req.body.email && !isEmail(email)) return res.status(400).json({ message: 'Invalid email address' });
  res.json(db.update('users', req.user._id, { ...(name && { name }), ...(req.body.email !== undefined && { email }) }));
});

// ---- Data rights (DPDP Act): download my data / delete my account ----
router.get('/export', auth(), (req, res) => {
  const u = req.user._id;
  const mine = (c, f) => db.find(c, f);
  res.set('Content-Disposition', 'attachment; filename="my-pvrs-data.json"');
  res.json({ exportedAt: new Date().toISOString(), profile: req.user, listings: mine('businesses', (b) => b.ownerId === u).map(({ documents, ...b }) => b),
    reviews: mine('reviews', (r) => r.userId === u), enquiries: mine('enquiries', (e) => e.userId === u || e.ownerId === u), favorites: mine('favorites', (f) => f.userId === u), payments: mine('payments', (p) => p.userId === u) });
});
router.delete('/me', auth(), (req, res) => {
  if (['admin', 'moderator'].includes(req.user.role)) return res.status(403).json({ message: 'Admin accounts cannot be deleted here' });
  if (req.body?.confirm !== 'DELETE') return res.status(400).json({ message: 'Type DELETE to confirm' });
  const u = req.user._id;
  db.find('businesses', (b) => b.ownerId === u).forEach((b) => db.update('businesses', b._id, { status: 'suspended', suspendReason: 'Owner deleted account' }));
  db.find('favorites', (f) => f.userId === u).forEach((f) => db.remove('favorites', f._id));
  db.find('reviews', (r) => r.userId === u).forEach((r) => db.update('reviews', r._id, { name: 'Deleted user', phone: '', userId: null }));
  db.log('account_deleted', u, { phone: req.user.phone }); db.remove('users', u);
  res.json({ message: 'Your account has been deleted.' });
});

module.exports = router;
