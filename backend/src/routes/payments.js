// Razorpay checkout (UPI / NetBanking / Cards). Without keys it runs in MOCK mode for testing.
const router = require('express').Router();
const crypto = require('crypto');
const db = require('../db');
const { auth, features } = require('../util');

router.use(auth());
const keys = () => ({ id: process.env.RAZORPAY_KEY_ID, secret: process.env.RAZORPAY_KEY_SECRET });

router.post('/order', async (req, res) => {
  const { purpose, businessId, adId } = req.body; // purpose: premium_plan | banner_ad
  let amount;
  if (purpose === 'premium_plan') {
    if (!features().premiumUpgrade) return res.status(403).json({ message: 'Premium upgrades are currently disabled' });
    const b = db.get('businesses', businessId);
    if (!b || b.ownerId !== req.user._id) return res.status(400).json({ message: 'Invalid listing' });
    if (b.status !== 'approved') return res.status(400).json({ message: 'Listing must be approved by admin before upgrading' });
    amount = Number(process.env.PREMIUM_PLAN_PRICE || 2999);
  } else if (purpose === 'banner_ad') {
    const a = db.get('ads', adId);
    if (!a || a.ownerId !== req.user._id) return res.status(400).json({ message: 'Invalid ad' });
    if (a.paymentStatus === 'paid') return res.status(400).json({ message: 'Already paid' });
    amount = a.amount;
  } else return res.status(400).json({ message: 'Invalid purpose' });

  const k = keys();
  let orderId = 'mock_order_' + Date.now();
  if (k.id && k.secret) {
    const r = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Basic ' + Buffer.from(`${k.id}:${k.secret}`).toString('base64') },
      body: JSON.stringify({ amount: amount * 100, currency: 'INR', receipt: 'rcpt_' + Date.now(), notes: { purpose, businessId, adId } }),
    });
    const j = await r.json();
    if (!r.ok) return res.status(502).json({ message: j.error?.description || 'Razorpay error' });
    orderId = j.id;
  }
  const p = db.insert('payments', { userId: req.user._id, purpose, businessId, adId, amount, orderId, status: 'created', mock: !k.id }, 'pay');
  res.json({ paymentId: p._id, orderId, amount, key: k.id || null, mock: !k.id });
});

router.post('/verify', (req, res) => {
  const { paymentId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
  const p = db.get('payments', paymentId);
  if (!p || p.userId !== req.user._id) return res.status(404).json({ message: 'Payment not found' });
  if (p.status === 'paid') return res.json({ message: 'Already verified' });
  if (!p.mock) {
    const exp = crypto.createHmac('sha256', keys().secret).update(`${p.orderId}|${razorpay_payment_id}`).digest('hex');
    if (razorpay_order_id !== p.orderId || exp !== razorpay_signature) {
      db.update('payments', p._id, { status: 'failed' }); return res.status(400).json({ message: 'Payment verification failed' });
    }
  }
  db.update('payments', p._id, { status: 'paid', razorpayPaymentId: razorpay_payment_id || 'mock', paidAt: new Date().toISOString() });
  if (p.purpose === 'premium_plan') {
    const b = db.get('businesses', p.businessId);
    const base = b.planExpiry && new Date(b.planExpiry) > new Date() ? new Date(b.planExpiry) : new Date();
    const exp = new Date(base.getTime() + Number(process.env.PREMIUM_PLAN_DAYS || 365) * 864e5);
    db.update('businesses', b._id, { plan: 'premium', planStart: new Date().toISOString(), planExpiry: exp.toISOString() });
    return res.json({ message: `Premium activated till ${exp.toDateString()}. Call/WhatsApp buttons unlocked.` });
  }
  db.update('ads', p.adId, { paymentStatus: 'paid' });
  res.json({ message: 'Payment received. Your banner goes live after admin approval.' });
});

module.exports = router;
