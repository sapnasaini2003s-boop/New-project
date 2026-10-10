// Vendor growth tools: Biz Boosters (paid add-ons + sales leads), vendor offers, partner/referral programme
const router = require('express').Router();
const db = require('../db');
const { auth, notify, hasBooster } = require('../util');
const { limit, clean, isPhone } = require('../guard');
const crypto = require('crypto');

router.use(auth());
const own = (req, id) => { const b = db.get('businesses', id); return b && b.ownerId === req.user._id ? b : null; };
const bad = (res, m, s = 400) => res.status(s).json({ message: m });

// ---- Biz Boosters ----
router.get('/boosters', (req, res) => {
  const mine = db.find('businesses', (b) => b.ownerId === req.user._id);
  res.json({
    catalog: db.all('boosters').filter((b) => b.active !== false).sort((a, b) => (a.order || 0) - (b.order || 0)),
    active: mine.flatMap((b) => Object.entries(b.boosters || {}).filter(([k]) => hasBooster(b, k)).map(([k, v]) => ({ key: k, businessId: b._id, businessName: b.name, until: v.until }))),
    requests: db.find('boosterRequests', (r) => r.userId === req.user._id).slice().reverse(),
  });
});
router.post('/boosters/request', limit('bst', 10, 3600e3), (req, res) => {
  const { key, businessId, phone, note } = req.body;
  const bo = db.find('boosters', (x) => x.key === key && x.active !== false && x.kind === 'request')[0];
  const b = own(req, businessId);
  if (!bo) return bad(res, 'This service cannot be requested');
  if (!b) return bad(res, 'Choose one of your listings');
  const ph = String(phone || '').replace(/\D/g, '').slice(-10);
  if (!isPhone(ph)) return bad(res, 'Enter a valid 10-digit mobile so our team can call you');
  if (db.find('boosterRequests', (r) => r.userId === req.user._id && r.businessId === b._id && r.key === key && ['new', 'contacted'].includes(r.status)).length) return bad(res, 'You already have an open request for this service', 409);
  const r = db.insert('boosterRequests', { userId: req.user._id, businessId: b._id, businessName: b.name, city: b.city, key, title: bo.title, name: req.user.name || '', phone: ph, note: clean(note, 300), status: 'new' }, 'brq');
  notify(null, `New request: ${bo.title}`, `${b.name} (${b.city || ''}) — +91 ${ph}`, 'inbox');
  res.status(201).json({ message: 'Request received! Our team will call you shortly.', data: r });
});

// ---- Vendor offers (go live after admin approval) ----
router.get('/offers', (req, res) => res.json(db.find('offers', (o) => o.ownerId === req.user._id).slice().reverse()));
router.post('/offers', limit('vofr', 10, 3600e3), (req, res) => {
  const b = own(req, req.body.businessId); if (!b) return bad(res, 'Choose one of your listings');
  if (b.status !== 'approved') return bad(res, 'Listing must be approved first');
  const title = clean(req.body.title, 80), code = clean(req.body.code, 20).toUpperCase(), subtitle = clean(req.body.subtitle, 160);
  if (title.length < 5) return bad(res, 'Offer title must be at least 5 characters');
  const exp = req.body.expiry; if (!exp || isNaN(new Date(exp)) || new Date(exp) < new Date(new Date().toDateString())) return bad(res, 'Choose a valid expiry date (today or later)');
  if (new Date(exp) - Date.now() > 366 * 864e5) return bad(res, 'Expiry cannot be more than 1 year away');
  if (db.find('offers', (o) => o.ownerId === req.user._id && o.status === 'pending').length >= 5) return bad(res, 'You already have 5 offers awaiting approval');
  let disc; try { disc = require('../util').discountFields(req.body); } catch (e) { return bad(res, e.message); }
  if (disc.discountType && code.length < 3) return bad(res, 'Enter an offer code (min 3 characters) for the discount');
  const o = db.insert('offers', { ...disc, title, subtitle, code, expiry: exp, businessId: b._id, businessName: b.name, city: b.city, ownerId: req.user._id, status: 'pending', active: true }, 'off');
  notify(null, 'New offer to review', `${b.name}: ${title}`, 'inbox');
  res.status(201).json({ message: 'Offer submitted. It goes live after admin approval.', data: o });
});
router.delete('/offers/:id', (req, res) => {
  const o = db.get('offers', req.params.id); if (!o || o.ownerId !== req.user._id) return bad(res, 'Not found', 404);
  db.remove('offers', o._id); res.json({ ok: true });
});

// ---- Partner (referral) programme ----
router.get('/partner', (req, res) => {
  let u = db.get('users', req.user._id);
  if (!u.referralCode) { const code = 'PV' + crypto.randomBytes(3).toString('hex').toUpperCase(); u = db.update('users', u._id, { referralCode: code }); }
  const cfg = { enabled: true, pct: 10, ...(db.settings().partner || {}) };
  const refs = db.find('businesses', (b) => b.referredBy === u._id).map((b) => ({ name: b.name, status: b.status, plan: b.plan, createdAt: b.createdAt }));
  const com = db.find('commissions', (c) => c.userId === u._id).slice().reverse();
  res.json({ code: u.referralCode, enabled: cfg.enabled, pct: cfg.pct, referred: refs, commissions: com, earned: com.reduce((s, c) => s + c.amount, 0), paid: com.filter((c) => c.status === 'paid').reduce((s, c) => s + c.amount, 0) });
});

module.exports = router;
