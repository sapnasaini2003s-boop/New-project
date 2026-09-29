// Admin panel APIs — approval queues + full site management
const router = require('express').Router();
const path = require('path');
const fs = require('fs');
const db = require('../db');
const { auth, role, upload, fileUrl, notify, parseJSON, UP, isPremium } = require('../util');
const { runExpiryJob } = require('../jobs');

// Private document viewer (token via ?token= so it opens in new tab)
router.get('/files/private/:name', auth(), role('admin'), (req, res) => {
  const f = path.join(UP, 'private', path.basename(req.params.name));
  fs.existsSync(f) ? res.sendFile(f) : res.status(404).send('Not found');
});

router.use(auth(), role('admin'));

router.get('/overview', (req, res) => {
  const B = db.all('businesses'), P = db.all('payments').filter((p) => p.status === 'paid');
  res.json({
    revenue: P.reduce((s, p) => s + p.amount, 0),
    premium: B.filter(isPremium).length, free: B.filter((b) => !isPremium(b)).length,
    live: B.filter((b) => b.status === 'approved').length, suspended: B.filter((b) => b.status === 'suspended').length,
    users: db.all('users').length, leads: db.all('leads').length,
    queue: queueCounts(), searchStats: db.settings().searchStats || {},
    recentPayments: P.slice(-8).reverse(),
  });
});

function queueCounts() {
  return {
    listings: db.find('businesses', (b) => b.status === 'pending').length,
    edits: db.find('businesses', (b) => b.pendingUpdates).length,
    vendors: db.find('users', (u) => u.status === 'pending').length,
    ads: db.find('ads', (a) => a.status === 'pending').length,
    claims: db.find('claims', (c) => c.status === 'pending').length,
  };
}

router.get('/queue', (req, res) => {
  const owner = (id) => { const u = db.get('users', id); return u ? { name: u.name, phone: u.phone, status: u.status } : null; };
  res.json({
    counts: queueCounts(),
    listings: db.find('businesses', (b) => b.status === 'pending').map((b) => ({ ...b, owner: owner(b.ownerId) })),
    edits: db.find('businesses', (b) => b.pendingUpdates).map((b) => ({ ...b, owner: owner(b.ownerId) })),
    vendors: db.find('users', (u) => u.status === 'pending'),
    ads: db.find('ads', (a) => a.status === 'pending'),
    claims: db.find('claims', (c) => c.status === 'pending'),
  });
});

// ---- listing approval ----
router.put('/listings/:id/approve', (req, res) => {
  const b = db.get('businesses', req.params.id); if (!b) return res.status(404).json({ message: 'Not found' });
  const patch = { status: 'approved', approvedOnce: true, verified: true, rejectionReason: null, approvedAt: new Date().toISOString() };
  if (b.pendingUpdates) Object.assign(patch, b.pendingUpdates, { pendingUpdates: null });
  db.update('businesses', b._id, patch);
  const u = db.get('users', b.ownerId); if (u && u.status === 'pending') db.update('users', u._id, { status: 'approved' });
  db.log('approved', req.user._id, { id: b._id });
  notify(b.ownerId, 'Listing approved', `${b.name} is now live on PVRS HUB`);
  res.json({ message: 'Approved & published' });
});
router.put('/listings/:id/reject', (req, res) => {
  const b = db.get('businesses', req.params.id); if (!b) return res.status(404).json({ message: 'Not found' });
  const reason = req.body.reason || 'Documents could not be verified';
  if (b.pendingUpdates) db.update('businesses', b._id, { pendingUpdates: null, lastRejectedEdit: reason }); // keep old live data
  else db.update('businesses', b._id, { status: 'rejected', rejectionReason: reason });
  db.log('rejected', req.user._id, { id: b._id, reason });
  notify(b.ownerId, 'Update rejected', `${b.name}: ${reason}`);
  res.json({ message: 'Rejected' });
});
router.put('/listings/:id/suspend', (req, res) => { db.update('businesses', req.params.id, { status: 'suspended', suspendReason: req.body.reason || 'Admin action' }); res.json({ message: 'Suspended' }); });
router.put('/listings/:id/reactivate', (req, res) => { db.update('businesses', req.params.id, { status: 'approved' }); res.json({ message: 'Reactivated' }); });

// ---- businesses management ----
router.get('/businesses', (req, res) => res.json(db.all('businesses').slice().reverse()));
const imgFields = upload.fields([{ name: 'profileImage', maxCount: 1 }, { name: 'gallery', maxCount: 10 }, { name: 'bannerImage', maxCount: 1 }]);
function adminData(req) {
  const b = req.body, f = req.files || {};
  const d = {
    name: b.name, description: b.description, category: b.category, subCategory: b.subCategory, city: b.city, address: b.address,
    timings: b.timings, contact: parseJSON(b.contact, undefined), orderOnline: parseJSON(b.orderOnline, undefined), videos: parseJSON(b.videos, undefined),
    plan: b.plan, planExpiry: b.planExpiry || undefined, rating: b.rating ? Number(b.rating) : undefined, reviews: b.reviews ? Number(b.reviews) : undefined,
    unclaimed: b.unclaimed === undefined ? undefined : b.unclaimed === 'true' || b.unclaimed === true,
    tags: b.tags ? String(b.tags).split(',').map((s) => s.trim()).filter(Boolean) : undefined,
  };
  if (f.profileImage) d.profileImage = fileUrl(f.profileImage[0]);
  if (f.bannerImage) d.bannerImage = fileUrl(f.bannerImage[0]);
  if (f.gallery) d.gallery = f.gallery.map(fileUrl);
  Object.keys(d).forEach((k) => d[k] === undefined && delete d[k]);
  return d;
}
// Admin can pre-load a business (unclaimed -> shows "Claim it now" badge)
router.post('/businesses', imgFields, (req, res) => {
  const d = adminData(req);
  if (!d.name || !d.category) return res.status(400).json({ message: 'Name & category required' });
  const b = db.insert('businesses', { plan: 'free', unclaimed: true, ...d, status: 'approved', approvedOnce: true, views: 0, leads: 0 }, 'biz');
  res.status(201).json(b);
});
router.put('/businesses/:id', imgFields, (req, res) => res.json(db.update('businesses', req.params.id, adminData(req))));
router.delete('/businesses/:id', (req, res) => res.json({ ok: db.remove('businesses', req.params.id) }));

// ---- users ----
router.get('/users', (req, res) => res.json(db.all('users').slice().reverse()));
router.put('/users/:id', (req, res) => {
  const { status, role: r, blocked, name } = req.body;
  const u = db.update('users', req.params.id, JSON.parse(JSON.stringify({ status, role: r, blocked, name })));
  if (status === 'approved') notify(u._id, 'Account approved', 'Your vendor account is approved');
  res.json(u);
});

// ---- ads ----
router.get('/ads', (req, res) => res.json(db.all('ads').slice().reverse()));
router.post('/ads', upload.fields([{ name: 'image', maxCount: 1 }]), (req, res) => {
  const b = req.body;
  const a = db.insert('ads', { type: b.type, title: b.title, subtitle: b.subtitle, link: b.link, cta: b.cta, youtubeUrl: b.youtubeUrl, bg: b.bg,
    image: req.files?.image ? fileUrl(req.files.image[0]) : b.imageUrl, startDate: b.startDate || null, endDate: b.endDate || null,
    status: 'approved', paymentStatus: 'na', createdBy: 'admin' }, 'ad');
  res.status(201).json(a);
});
router.put('/ads/:id', upload.fields([{ name: 'image', maxCount: 1 }]), (req, res) => {
  const patch = { ...req.body }; if (req.files?.image) patch.image = fileUrl(req.files.image[0]); if (patch.imageUrl) { patch.image = patch.imageUrl; delete patch.imageUrl; }
  const a = db.update('ads', req.params.id, patch);
  if (a && a.ownerId && (patch.status === 'approved' || patch.status === 'rejected')) notify(a.ownerId, `Banner ad ${patch.status}`, a.title);
  res.json(a);
});
router.delete('/ads/:id', (req, res) => res.json({ ok: db.remove('ads', req.params.id) }));

// ---- claims ----
router.get('/claims', (req, res) => res.json(db.all('claims').slice().reverse()));
router.put('/claims/:id/:action', (req, res) => {
  const c = db.get('claims', req.params.id); if (!c) return res.status(404).json({ message: 'Not found' });
  if (req.params.action === 'approve') {
    db.update('businesses', c.businessId, { ownerId: c.userId, unclaimed: false, verified: true });
    const u = db.get('users', c.userId); if (u) db.update('users', u._id, { role: u.role === 'admin' ? 'admin' : 'vendor', status: 'approved' });
    db.update('claims', c._id, { status: 'approved' });
    db.find('claims', (x) => x.businessId === c.businessId && x.status === 'pending').forEach((x) => db.update('claims', x._id, { status: 'rejected' }));
    notify(c.userId, 'Claim approved', `You now manage ${c.businessName}. Upgrade to Premium to unlock contact buttons.`);
  } else { db.update('claims', c._id, { status: 'rejected' }); notify(c.userId, 'Claim rejected', c.businessName); }
  res.json({ message: 'Done' });
});

// ---- categories ----
router.post('/categories', (req, res) => {
  const { name, icon, subs, color, order } = req.body;
  const slug = (req.body.slug || name).toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  res.status(201).json(db.insert('categories', { name, slug, icon, color, order: Number(order) || 0, subs: Array.isArray(subs) ? subs : String(subs || '').split(',').map((s) => s.trim()).filter(Boolean), active: true }, 'cat'));
});
router.put('/categories/:id', (req, res) => {
  const p = { ...req.body }; if (p.subs && !Array.isArray(p.subs)) p.subs = String(p.subs).split(',').map((s) => s.trim()).filter(Boolean);
  res.json(db.update('categories', req.params.id, p));
});
router.delete('/categories/:id', (req, res) => res.json({ ok: db.remove('categories', req.params.id) }));

// ---- generic content: offers / blogs / videos ----
for (const c of ['offers', 'blogs', 'videos']) {
  router.get(`/${c}`, (req, res) => res.json(db.all(c).slice().reverse()));
  router.post(`/${c}`, upload.fields([{ name: 'image', maxCount: 1 }]), (req, res) => {
    const d = { ...req.body }; if (req.files?.image) d.image = fileUrl(req.files.image[0]);
    res.status(201).json(db.insert(c, { active: true, published: true, ...d }, c.slice(0, 3)));
  });
  router.put(`/${c}/:id`, upload.fields([{ name: 'image', maxCount: 1 }]), (req, res) => {
    const d = { ...req.body }; if (req.files?.image) d.image = fileUrl(req.files.image[0]);
    res.json(db.update(c, req.params.id, d));
  });
  router.delete(`/${c}/:id`, (req, res) => res.json({ ok: db.remove(c, req.params.id) }));
}

// ---- site settings (homepage text, stats, legal pages, social links) ----
router.get('/settings', (req, res) => res.json(db.settings()));
router.put('/settings', (req, res) => res.json(db.setSettings(req.body)));

router.get('/payments', (req, res) => res.json(db.all('payments').slice().reverse()));
router.get('/notifications', (req, res) => res.json(db.all('notifications').slice(-100).reverse()));
router.get('/audit', (req, res) => res.json(db.all('audit').slice(-100).reverse()));
router.post('/run-expiry-job', (req, res) => res.json(runExpiryJob()));

module.exports = router;
