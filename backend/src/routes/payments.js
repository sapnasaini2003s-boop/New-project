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
    amount = require('../util').prices().premium;
  } else if (purpose === 'banner_ad') {
    const a = db.get('ads', adId);
    if (!a || a.ownerId !== req.user._id) return res.status(400).json({ message: 'Invalid ad' });
    if (a.paymentStatus === 'paid') return res.status(400).json({ message: 'Already paid' });
    amount = a.amount;
  } else if (purpose === 'booster') {
    const bo = db.find('boosters', (x) => x.key === req.body.boosterKey && x.active !== false && x.kind === 'activate')[0];
    const b = db.get('businesses', businessId); const days = Number(req.body.days);
    if (!bo) return res.status(400).json({ message: 'This booster cannot be bought online' });
    if (!b || b.ownerId !== req.user._id || b.status !== 'approved') return res.status(400).json({ message: 'Listing must be approved first' });
    if (![7, 30, 90].includes(days)) return res.status(400).json({ message: 'Choose 7, 30 or 90 days' });
    amount = bo.price * days;
  } else return res.status(400).json({ message: 'Invalid purpose' });

  const k = keys();
  let orderId = 'mock_order_' + Date.now();
  if (k.id && k.secret) {
    const r = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Basic ' + Buffer.from(`${k.id}:${k.secret}`).toString('base64') },
      body: JSON.stringify({ amount: amount * 100, currency: 'INR', receipt: 'rcpt_' + Date.now(), notes: { purpose, businessId, adId, boosterKey: req.body.boosterKey } }),
    });
    const j = await r.json();
    if (!r.ok) return res.status(502).json({ message: j.error?.description || 'Razorpay error' });
    orderId = j.id;
  }
  const p = db.insert('payments', { userId: req.user._id, purpose, businessId, adId, boosterKey: purpose === 'booster' ? req.body.boosterKey : undefined, days: purpose === 'booster' ? Number(req.body.days) : undefined, amount, orderId, status: 'created', mock: !k.id }, 'pay');
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
    const exp = new Date(base.getTime() + require('../util').prices().premiumDays * 864e5);
    if (b.referredBy && db.get('users', b.referredBy)) {
      const pct = Number((db.settings().partner || {}).pct ?? 10);
      db.insert('commissions', { userId: b.referredBy, businessId: b._id, businessName: b.name, paymentId: p._id, base: p.amount, pct, amount: Math.round(p.amount * pct) / 100, status: 'pending' }, 'com');
    }
    db.update('businesses', b._id, { plan: 'premium', planStart: new Date().toISOString(), planExpiry: exp.toISOString() });
    return res.json({ message: `Premium activated till ${exp.toDateString()}. Call/WhatsApp buttons unlocked.` });
  }
  if (p.purpose === 'booster') {
    const b = db.get('businesses', p.businessId); const cur = b.boosters?.[p.boosterKey];
    const base = cur && new Date(cur.until) > new Date() ? new Date(cur.until) : new Date();
    const until = new Date(base.getTime() + p.days * 864e5).toISOString();
    db.update('businesses', b._id, { boosters: { ...(b.boosters || {}), [p.boosterKey]: { until, since: new Date().toISOString() } } });
    return res.json({ message: `Booster active till ${new Date(until).toDateString()}` });
  }
  db.update('ads', p.adId, { paymentStatus: 'paid' });
  res.json({ message: 'Payment received. Your banner goes live after admin approval.' });
});

module.exports = router;
