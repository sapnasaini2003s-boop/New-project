// Vendor (business owner) dashboard APIs. Every create/edit goes to the admin Pending Review queue.
const router = require('express').Router();
const db = require('../db');
const { cleanBiz } = require('../guard');
const { cleanHours, features, requireFeature, auth, upload, fileUrl, isPremium, parseJSON, pick, EDITABLE, notify } = require('../util');

router.use(auth());
// ── Vendor activity: time on site + page/action log (shown in Admin → Users)
const bump = (u, fn) => { const cur = db.get('users', u._id); if (!cur) return; const act = { seconds: 0, visits: 0, pages: {}, log: [], ...(cur.activity || {}) }; fn(act); act.log = act.log.slice(-80); db.update('users', u._id, { activity: act }); };
router.post('/activity', (req, res) => {
  const path = String(req.body.path || '/').slice(0, 80).replace(/[?#].*$/, ''); const secs = Math.min(Math.max(Number(req.body.secs) || 0, 0), 60);
  bump(req.user, (a) => {
    const now = new Date().toISOString();
    if (req.body.start) { a.visits += 1; a.log.push({ at: now, t: 'visit', path }); }
    else if (req.body.page) a.log.push({ at: now, t: 'page', path });
    a.seconds += secs; if (secs) { a.pages[path] = (a.pages[path] || 0) + secs; const k = Object.keys(a.pages); if (k.length > 30) delete a.pages[k[0]]; }
    a.lastSeen = now; a.lastPath = path;
  });
  res.json({ ok: true });
});
router.use((req, res, next) => {
  if (req.method !== 'GET' && req.path !== '/activity') res.on('finish', () => { if (res.statusCode < 400) bump(req.user, (a) => a.log.push({ at: new Date().toISOString(), t: 'action', path: `${req.method} ${req.originalUrl.replace(/^\/api\/vendor/, '').replace(/[?#].*$/, '').slice(0, 70)}` })); });
  next();
});
const notMaint = (req, res, next) => (features().maintenance ? res.status(503).json({ message: 'Site is under maintenance. Submissions are paused, please try later.' }) : next());
const mine = (req) => db.find('businesses', (b) => b.ownerId === req.user._id);
const own = (req, res) => {
  const b = db.get('businesses', req.params.id);
  if (!b || (b.ownerId !== req.user._id && req.user.role !== 'admin')) { res.status(404).json({ message: 'Listing not found' }); return null; }
  return b;
};
const files = upload.fields([{ name: 'profileImage', maxCount: 1 }, { name: 'gallery', maxCount: 10 }, { name: 'bannerImage', maxCount: 1 }, { name: 'document', maxCount: 1 }]);

// Build a clean data object from multipart body + files, enforcing free-tier hardlocks
function buildData(req, premium, existing = {}) {
  const body = req.body;
  const d = pick({
    name: body.name, description: body.description, category: body.category, subCategory: body.subCategory,
    city: body.city, address: body.address, timings: body.timings, hours: cleanHours(parseJSON(body.hours, undefined)),
    tags: body.tags ? String(body.tags).split(',').map((s) => s.trim()).filter(Boolean) : undefined,
    contact: parseJSON(body.contact, undefined), orderOnline: parseJSON(body.orderOnline, undefined),
    videos: parseJSON(body.videos, undefined), lat: body.lat, lng: body.lng, info: parseJSON(body.info, undefined), menu: parseJSON(body.menu, undefined), orderCfg: parseJSON(body.orderCfg, undefined),
  }, EDITABLE);
  cleanBiz(d, { create: !existing._id });
  if (d.city !== undefined) { const list = db.settings().cities; const hit = Array.isArray(list) && list.find((c) => c.toLowerCase() === String(d.city).toLowerCase()); if (Array.isArray(list) && list.length && !hit) throw Object.assign(new Error('Choose one of the cities we currently serve'), { status: 400 }); if (hit) d.city = hit; }
  const f = req.files || {};
  if (f.profileImage) d.profileImage = fileUrl(f.profileImage[0]);
  if (f.document) {
    d.documents = { ...(existing.documents || {}), file: fileUrl(f.document[0]), type: body.docType || 'Trade License', number: body.docNumber, expiry: body.docExpiry };
  } else if (body.docExpiry || body.docNumber) {
    d.documents = { ...(existing.documents || {}), type: body.docType || existing.documents?.type, number: body.docNumber, expiry: body.docExpiry };
  }
  const wantsPremiumMedia = f.gallery || f.bannerImage || (d.videos && Object.values(d.videos).some(Boolean));
  if (!premium && wantsPremiumMedia) {
    const e = new Error('Free plan allows only ONE profile image. Upgrade to Premium for gallery, banner & video embeds.'); e.status = 402; throw e;
  }
  if (premium) {
    if (f.gallery) d.gallery = [...(parseJSON(body.keepGallery, existing.gallery || [])), ...f.gallery.map(fileUrl)];
    else if (body.keepGallery) d.gallery = parseJSON(body.keepGallery, []);
    if (f.bannerImage) d.bannerImage = fileUrl(f.bannerImage[0]);
  }
  if (d.documents?.expiry && new Date(d.documents.expiry) < new Date(new Date().toDateString())) { const e = new Error('Licence expiry date is already in the past — please upload a valid (renewed) certificate'); e.status = 400; throw e; }
    return d;
}

router.get('/listings', (req, res) => res.json(mine(req)));
router.get('/listings/:id', (req, res) => { const b = own(req, res); if (b) res.json(b); });

// New listing -> status pending (not public until Admin approves)
router.post('/listings', notMaint, files, (req, res) => {
  try {
    if (!req.files?.document) return res.status(400).json({ message: 'Upload Trade License / FSSAI / KMC Registration Certificate (JPG, PNG or PDF) is mandatory' });
    const d = buildData(req, false);
    if (!d.name || !d.category || !d.city) return res.status(400).json({ message: 'Name, category and city are required' });
    if (!d.contact?.email) return res.status(400).json({ message: 'Business email is required — plan and licence expiry alerts are sent there' });
    const ph = d.contact?.phone;
    const dup = db.find('businesses', (b) => b.status !== 'rejected' && ((ph && b.contact?.phone === ph && b.ownerId !== req.user._id) || (b.ownerId === req.user._id && b.name?.toLowerCase() === d.name.toLowerCase() && (b.city || '').toLowerCase() === (d.city || '').toLowerCase())))[0];
    if (dup) return res.status(409).json({ message: dup.ownerId === req.user._id ? 'You already added this business.' : 'A listing with this phone number already exists. If it is your business, open it and use "Claim this listing".' });
    if (req.user.role === 'user') db.update('users', req.user._id, { role: 'vendor', status: 'pending' });
    const refUser = req.body.ref ? db.find('users', (u) => u.referralCode && u.referralCode === String(req.body.ref).trim().toUpperCase() && u._id !== req.user._id)[0] : null;
    if (req.body.ref && !refUser) return res.status(400).json({ message: 'Invalid referral code' });
    const b = db.insert('businesses', { ...d, referredBy: refUser?._id, ownerId: req.user._id, plan: 'free', status: 'pending', views: 0, leads: 0, rating: 0 }, 'biz');
    db.log('listing_submitted', req.user._id, { id: b._id });
    notify(null, 'New listing in review queue', b.name, 'inbox');
    res.status(201).json({ message: 'Submitted! Your listing will go live after admin verification.', data: b });
  } catch (e) { res.status(e.status || 400).json({ message: e.message }); }
});

// Edit -> stored in pendingUpdates. Public keeps showing the OLD verified data until admin approves.
router.put('/listings/:id', notMaint, files, (req, res) => {
  const b = own(req, res); if (!b) return;
  try {
    const d = buildData(req, isPremium(b), b);
    if (b.status === 'pending' && !b.approvedOnce) {
      // never approved yet -> just update the submission itself (still in queue)
      db.update('businesses', b._id, d);
      return res.json({ message: 'Submission updated. Still awaiting admin review.' });
    }
    const pendingUpdates = { ...(b.pendingUpdates || {}), ...d };
    db.update('businesses', b._id, { pendingUpdates, pendingSince: new Date().toISOString() });
    db.log('edit_submitted', req.user._id, { id: b._id, fields: Object.keys(d) });
    res.json({ message: 'Changes sent for admin review. Your live page shows old details until approved.' });
  } catch (e) { res.status(e.status || 400).json({ message: e.message }); }
});

router.delete('/listings/:id/pending', (req, res) => {
  const b = own(req, res); if (!b) return;
  db.update('businesses', b._id, { pendingUpdates: null }); res.json({ message: 'Pending changes withdrawn' });
});

router.get('/stats', (req, res) => {
  const ids = new Set(mine(req).map((b) => b._id));
  const leads = db.find('leads', (l) => ids.has(l.businessId));
  const by = (t) => leads.filter((l) => l.type === t).length;
  res.json({ views: mine(req).reduce((s, b) => s + (b.views || 0), 0), calls: by('call'), whatsapp: by('whatsapp'), orders: by('order'), recent: leads.slice(-20).reverse() });
});

// ---- Pay-per-day banner ad booking ----
router.post('/ads', requireFeature('bannerBooking', 'Banner booking is currently disabled'), upload.fields([{ name: 'image', maxCount: 1 }]), (req, res) => {
  const { businessId, type = 'top_banner', title, subtitle, link, startDate, days, youtubeUrl, cta } = req.body; const categorySlug = String(req.body.categorySlug || '').trim();
  const b = db.get('businesses', businessId);
  if (!b || b.ownerId !== req.user._id) return res.status(400).json({ message: 'Select your listing' });
  if (!isPremium(b)) return res.status(402).json({ message: 'Only Premium vendors can buy banner slots' });
  if (!['top_banner', 'middle_banner', 'category_banner', 'promo', 'hero_video'].includes(type)) return res.status(400).json({ message: 'Invalid slot' });
  if (type === 'category_banner' && categorySlug && !db.find('categories', (c) => c.slug === categorySlug).length) return res.status(400).json({ message: 'Choose a valid category' });
  const n = Math.max(1, Math.min(90, parseInt(days) || 1));
  const start = startDate ? new Date(startDate) : new Date();
  const end = new Date(start.getTime() + n * 864e5);
  const perDay = type === 'category_banner' ? require('../util').prices().categoryBannerPerDay : require('../util').prices().bannerPerDay * (type === 'hero_video' ? 2 : 1);
  const ad = db.insert('ads', {
    type, categorySlug: type === 'category_banner' ? categorySlug : '', title: title || b.name, subtitle, link: link || `/business/${b._id}`, cta: cta || 'View',
    image: req.files?.image ? fileUrl(req.files.image[0]) : b.profileImage, youtubeUrl,
    startDate: start.toISOString(), endDate: end.toISOString(), days: n, amount: n * perDay,
    businessId: b._id, ownerId: req.user._id, status: 'pending', paymentStatus: 'unpaid', createdBy: 'vendor',
  }, 'ad');
  res.status(201).json({ message: 'Ad booked. Complete payment; it goes live after admin approval.', data: ad });
});
router.get('/ads', (req, res) => res.json(db.find('ads', (a) => a.ownerId === req.user._id)));

// ---- Claim an unclaimed (pre-loaded) listing ----
router.post('/claims', requireFeature('claims', 'Claiming is currently disabled'), upload.fields([{ name: 'document', maxCount: 1 }]), (req, res) => {
  const b = db.get('businesses', req.body.businessId);
  if (!b || !b.unclaimed) return res.status(400).json({ message: 'This listing cannot be claimed' });
  if (!req.files?.document) return res.status(400).json({ message: 'Upload a proof document (Trade License / FSSAI / KMC)' });
  if (db.find('claims', (c) => c.businessId === b._id && c.userId === req.user._id && c.status === 'pending').length)
    return res.status(400).json({ message: 'You already have a pending claim' });
  const c = db.insert('claims', { businessId: b._id, businessName: b.name, userId: req.user._id, phone: req.user.phone, name: req.body.name, document: fileUrl(req.files.document[0]), status: 'pending' }, 'clm');
  res.status(201).json({ message: 'Claim submitted for admin verification', data: c });
});

router.get('/enquiries', (req, res) => {
  const ids = new Set(mine(req).map((b) => b._id));
  res.json(db.find('enquiries', (e) => ids.has(e.businessId)).slice().reverse());
});
router.put('/enquiries/:id', (req, res) => {
  const e = db.get('enquiries', req.params.id); const b = e && db.get('businesses', e.businessId);
  if (!b || b.ownerId !== req.user._id) return res.status(404).json({ message: 'Not found' });
  res.json(db.update('enquiries', e._id, { status: req.body.status === 'closed' ? 'closed' : 'contacted' }));
});
router.get('/reviews', (req, res) => {
  const ids = new Set(mine(req).map((b) => b._id));
  res.json(db.find('reviews', (r) => ids.has(r.businessId) && r.status === 'approved').slice().reverse());
});
router.get('/payments', (req, res) => res.json(db.find('payments', (p) => p.userId === req.user._id)));
router.get('/notifications', (req, res) => res.json(db.find('notifications', (n) => n.userId === req.user._id).slice(-30).reverse()));

module.exports = router;
