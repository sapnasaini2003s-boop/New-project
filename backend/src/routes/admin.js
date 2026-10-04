// Admin panel APIs — approval queues + full site management
const router = require('express').Router();
const path = require('path');
const fs = require('fs');
const db = require('../db');
const { cleanHours, features, FEATURE_DEFAULTS, auth, role, upload, fileUrl, sendStored, notify, parseJSON, UP, isPremium } = require('../util');
const { cleanBiz } = require('../guard');
const { runExpiryJob } = require('../jobs');

// Private document viewer (token via ?token= so it opens in new tab)
router.get('/files/private/:name', auth(), role('admin', 'moderator'), (req, res, next) => {
  sendStored('private', req.params.name, res).catch(next);
});

router.use(auth(), role('admin', 'moderator'));
// Moderators can only work the approval queues; everything else is super-admin only
const MOD_OK = [/^\/queue/, /^\/listings\//, /^\/reviews/, /^\/reports/, /^\/claims/, /^\/enquiries/, /^\/overview/, /^\/me$/];
router.use((req, res, next) => (req.user.role === 'admin' || MOD_OK.some((r) => r.test(req.path)) ? next() : res.status(403).json({ message: 'Admin only — moderators cannot access this section' })));
router.get('/me', (req, res) => res.json({ role: req.user.role, name: req.user.name, phone: req.user.phone }));

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
    reviews: db.find('reviews', (r) => r.status === 'pending').length,
    reports: db.find('reports', (r) => r.status === 'pending').length,
  };
}

// ---- analytics (charts on Admin → Overview) ----
router.get('/analytics', (req, res) => {
  const days = Math.min(90, Math.max(7, parseInt(req.query.days) || 30));
  const DAY = 864e5; const start = new Date(); start.setHours(0, 0, 0, 0); const t0 = start.getTime() - (days - 1) * DAY;
  const idx = (iso) => { const t = new Date(iso).getTime(); return t < t0 ? -1 : Math.floor((t - t0) / DAY); };
  const series = (rows, pred = () => true, val = () => 1) => { const a = Array(days).fill(0); for (const r of rows) { if (!pred(r)) continue; const i = idx(r.createdAt); if (i >= 0 && i < days) a[i] += val(r); } return a; };
  const leads = db.all('leads'); const B = db.all('businesses'); const P = db.all('payments').filter((p) => p.status === 'paid');
  const labels = Array.from({ length: days }, (_, i) => new Date(t0 + i * DAY).toISOString().slice(0, 10));
  const cats = db.all('categories');
  const count = (arr, key) => { const m = {}; for (const x of arr) { const k = key(x) || '—'; m[k] = (m[k] || 0) + 1; } return Object.entries(m).sort((a, b) => b[1] - a[1]).map(([name, value]) => ({ name, value })); };
  const live = B.filter((b) => b.status === 'approved');
  const sum = (a) => a.reduce((x, y) => x + y, 0);
  const half = Math.floor(days / 2);
  const trend = (a) => { const prev = sum(a.slice(0, half)), cur = sum(a.slice(half)); return prev ? Math.round(((cur - prev) / prev) * 100) : (cur ? 100 : 0); };
  const views = series(leads, (l) => l.type === 'view'), calls = series(leads, (l) => l.type === 'call'), whatsapp = series(leads, (l) => l.type === 'whatsapp'),
    enquiries = series(db.all('enquiries')), revenue = series(P, () => true, (p) => p.amount), listings = series(B), users = series(db.all('users'));
  res.json({
    days, labels,
    series: { views, calls, whatsapp, enquiries, revenue, listings, users },
    totals: { views: sum(views), contacts: sum(calls) + sum(whatsapp) + sum(enquiries), revenue: sum(revenue), listings: sum(listings), users: sum(users) },
    trends: { views: trend(views), contacts: trend(calls.map((v, i) => v + whatsapp[i] + enquiries[i])), revenue: trend(revenue), listings: trend(listings), users: trend(users) },
    byCategory: count(live, (b) => cats.find((c) => c.slug === b.category)?.name || b.category).slice(0, 8),
    byCity: count(live, (b) => b.city).slice(0, 8),
    plans: { premium: B.filter(isPremium).length, free: B.filter((b) => !isPremium(b)).length },
    status: count(B, (b) => b.status),
    topBusinesses: live.slice().sort((a, b) => ((b.views || 0) + (b.leads || 0) * 5) - ((a.views || 0) + (a.leads || 0) * 5)).slice(0, 8)
      .map((b) => ({ _id: b._id, name: b.name, city: b.city, views: b.views || 0, leads: b.leads || 0, plan: isPremium(b) ? 'premium' : 'free', rating: b.rating || 0 })),
    searches: Object.entries(db.settings().searchStats || {}).map(([k, v]) => ({ name: cats.find((c) => c.slug === k)?.name || k, value: v })).sort((a, b) => b.value - a.value).slice(0, 8),
    expiring: B.filter((b) => isPremium(b) && b.planExpiry && new Date(b.planExpiry) - Date.now() < 30 * DAY).map((b) => ({ _id: b._id, name: b.name, planExpiry: b.planExpiry })).slice(0, 8),
  });
});

router.get('/queue', (req, res) => {
  const owner = (id) => { const u = db.get('users', id); return u ? { name: u.name, phone: u.phone, status: u.status } : null; };
  res.json({
    counts: queueCounts(),
    listings: db.find('businesses', (b) => b.status === 'pending').map((b) => ({ ...b, owner: owner(b.ownerId) })),
    edits: db.find('businesses', (b) => b.pendingUpdates).map((b) => ({ ...b, owner: owner(b.ownerId) })),
    vendors: db.find('users', (u) => u.status === 'pending'),
    ads: db.find('ads', (a) => a.status === 'pending'),
    claims: db.find('claims', (c) => c.status === 'pending'),
    reviews: db.find('reviews', (r) => r.status === 'pending'),
    reports: db.find('reports', (r) => r.status === 'pending'),
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
    timings: b.timings, hours: cleanHours(parseJSON(b.hours, undefined)), contact: parseJSON(b.contact, undefined), orderOnline: parseJSON(b.orderOnline, undefined), videos: parseJSON(b.videos, undefined),
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
  let d; try { d = cleanBiz(adminData(req), { create: true }); } catch (e) { return res.status(400).json({ message: e.message }); }
  if (!d.name || !d.category) return res.status(400).json({ message: 'Name & category required' });
  const b = db.insert('businesses', { plan: 'free', unclaimed: true, ...d, status: 'approved', approvedOnce: true, views: 0, leads: 0 }, 'biz');
  res.status(201).json(b);
});
router.put('/businesses/:id', imgFields, (req, res) => {
  try { res.json(db.update('businesses', req.params.id, cleanBiz(adminData(req), { create: false }))); } catch (e) { res.status(400).json({ message: e.message }); }
});
router.delete('/businesses/:id', (req, res) => {
  const b = db.get('businesses', req.params.id);
  if (b) db.log('business_deleted', req.user._id, { id: b._id, name: b.name, snapshot: b }); // recoverable from Activity Log
  res.json({ ok: db.remove('businesses', req.params.id) });
});

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

// ---- reviews moderation ----
router.get('/reviews', (req, res) => res.json(db.all('reviews').slice().reverse()));
router.put('/reviews/:id/:action', (req, res) => {
  const r = db.get('reviews', req.params.id); if (!r) return res.status(404).json({ message: 'Not found' });
  const approve = req.params.action === 'approve';
  if (approve && r.status !== 'approved') {
    const b = db.get('businesses', r.businessId);
    if (b) { const n = (b.reviews || 0) + 1; db.update('businesses', b._id, { reviews: n, rating: Math.round((((b.rating || 0) * (n - 1)) + r.rating) / n * 10) / 10 }); }
  }
  db.update('reviews', r._id, { status: approve ? 'approved' : 'rejected' });
  res.json({ message: approve ? 'Review published' : 'Review rejected' });
});
router.delete('/reviews/:id', (req, res) => res.json({ ok: db.remove('reviews', req.params.id) }));
router.get('/enquiries', (req, res) => res.json(db.all('enquiries').slice().reverse()));

// ---- reports (takedown / spam) ----
router.put('/reports/:id', (req, res) => {
  const r = db.get('reports', req.params.id); if (!r) return res.status(404).json({ message: 'Not found' });
  const act = req.body.action;
  if (act === 'suspend') { if (!r.businessId || !db.get('businesses', r.businessId)) return res.status(400).json({ message: 'No listing attached to this item' }); db.update('businesses', r.businessId, { status: 'suspended', suspendReason: `Reported: ${r.reason}` }); }
  const response = String(req.body.response || '').trim().slice(0, 1000);
  if (act !== 'suspend' && r.type && !response) return res.status(400).json({ message: 'Write a short reply for the customer' });
  db.update('reports', r._id, { status: act === 'dismiss' ? 'dismissed' : 'resolved', response, resolvedAt: new Date().toISOString() });
  if (r.userId && response) notify(r.userId, 'Update on your complaint', response, 'email');
  db.log('report_' + (req.body.action || 'resolve'), req.user._id, { id: r._id, businessId: r.businessId });
  res.json({ message: 'Done' });
});

// ---- team / staff ----
router.get('/team', (req, res) => res.json(db.find('users', (u) => u.role === 'admin' || u.role === 'moderator').map((u) => ({ ...u, superAdmin: u.phone === process.env.ADMIN_PHONE }))));
router.post('/team', (req, res) => {
  const { phone, name, role: r = 'moderator', email } = req.body;
  if (!/^[6-9]\d{9}$/.test(phone || '')) return res.status(400).json({ message: 'Valid 10-digit mobile required' });
  if (!['admin', 'moderator'].includes(r)) return res.status(400).json({ message: 'Invalid role' });
  let u = db.find('users', (x) => x.phone === phone)[0];
  if (u) u = db.update('users', u._id, { role: r, status: 'approved', name: name || u.name, email: email || u.email, blocked: false });
  else u = db.insert('users', { phone, name: name || '', email, role: r, status: 'approved' }, 'usr');
  db.log('staff_added', req.user._id, { phone, role: r });
  res.status(201).json({ message: `${name || phone} added as ${r}. They log in at /admin/login with OTP.`, user: u });
});
router.delete('/team/:id', (req, res) => {
  const u = db.get('users', req.params.id); if (!u) return res.status(404).json({ message: 'Not found' });
  if (u.phone === process.env.ADMIN_PHONE) return res.status(400).json({ message: 'Super-admin cannot be removed' });
  if (u._id === req.user._id) return res.status(400).json({ message: 'You cannot remove yourself' });
  db.update('users', u._id, { role: 'user' }); db.log('staff_removed', req.user._id, { phone: u.phone });
  res.json({ message: 'Access removed' });
});

// ---- system: health, integrations, migrations, backups ----
router.get('/system', (req, res) => {
  const mig = require('../migrations'); const mem = process.memoryUsage(); const env = process.env;
  const counts = {}; for (const c of ['users', 'businesses', 'categories', 'ads', 'payments', 'leads', 'claims', 'reviews', 'enquiries', 'reports', 'favorites', 'offers', 'blogs', 'videos', 'notifications', 'audit']) counts[c] = db.all(c).length;
  res.json({
    storage: db.mode(), failedWrites: db.failedWrites(), node: process.version, uptimeSec: Math.round(process.uptime()), memoryMB: Math.round(mem.rss / 1048576), env: env.NODE_ENV || 'development',
    counts, migrations: mig.status(), tasks: Object.entries(mig.TASKS).map(([id, t]) => ({ id, name: t.name })),
    jobs: db.settings().jobs || {},
    integrations: [
      { key: 'database', name: 'Database (Postgres)', ok: db.mode() !== 'file', hint: 'Set DATABASE_URL — otherwise data is saved to a local file and lost on Render restarts' },
      { key: 'otp', name: 'SMS OTP (Firebase)', ok: env.OTP_MODE === 'firebase' && !!env.FIREBASE_API_KEY, hint: 'OTP_MODE=firebase + FIREBASE_API_KEY (backend) and NEXT_PUBLIC_FIREBASE_* (frontend). Now: test OTP 123456' },
      { key: 'razorpay', name: 'Razorpay payments', ok: !!(env.RAZORPAY_KEY_ID && env.RAZORPAY_KEY_SECRET), hint: 'RAZORPAY_KEY_ID + RAZORPAY_KEY_SECRET. Now: test/mock payments' },
      { key: 'whatsapp', name: 'WhatsApp lead alerts', ok: !!(env.WHATSAPP_TOKEN && env.WHATSAPP_PHONE_NUMBER_ID), hint: 'WHATSAPP_TOKEN + WHATSAPP_PHONE_NUMBER_ID (Meta Cloud API)' },
      { key: 'email', name: 'Email alerts (SMTP)', ok: !!env.SMTP_HOST, hint: 'SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, MAIL_FROM, ADMIN_EMAIL' },
      { key: 'jwt', name: 'Secure JWT secret', ok: !!env.JWT_SECRET && !/change|dev-secret/.test(env.JWT_SECRET), hint: 'Set a long random JWT_SECRET' },
    ],
  });
});
router.post('/system/migrate', (req, res) => res.json({ applied: require('../migrations').runPending(req.user.phone) }));
router.post('/system/task/:id', (req, res) => {
  const t = require('../migrations').TASKS[req.params.id]; if (!t) return res.status(404).json({ message: 'Unknown task' });
  const result = t.run(); db.log('task_' + req.params.id, req.user._id, { result }); res.json({ message: result });
});
router.post('/system/test-email', async (req, res) => {
  const m = require('../util').getMailer(); const to = req.body.to || process.env.ADMIN_EMAIL;
  if (!m) return res.status(400).json({ message: 'SMTP is not configured (set SMTP_HOST etc.)' });
  if (!to) return res.status(400).json({ message: 'Enter an email address' });
  try { await m.sendMail({ from: process.env.MAIL_FROM || process.env.SMTP_USER, to, subject: 'PVRS HUB test email', text: 'SMTP is working 🎉' }); res.json({ message: `Test email sent to ${to}` }); }
  catch (e) { res.status(500).json({ message: e.message }); }
});
router.get('/system/backup', (req, res) => {
  const out = { exportedAt: new Date().toISOString(), settings: db.settings() };
  for (const c of ['users', 'businesses', 'categories', 'ads', 'payments', 'leads', 'claims', 'reviews', 'enquiries', 'reports', 'favorites', 'offers', 'blogs', 'videos', 'notifications', 'audit']) out[c] = db.all(c);
  res.set('Content-Disposition', `attachment; filename="pvrs-backup-${new Date().toISOString().slice(0, 10)}.json"`).json(out);
});

// ---- feature switches ----
router.get('/features', (req, res) => res.json(features()));
router.put('/features', (req, res) => {
  const cur = db.settings().features || {}; const next = { ...cur };
  for (const k of Object.keys(FEATURE_DEFAULTS)) if (typeof req.body[k] === 'boolean') next[k] = req.body[k];
  if (typeof req.body.customerOtp === 'boolean') next.customerOtp = req.body.customerOtp;
  db.setSettings({ features: next }); db.log('features_changed', req.user._id, req.body);
  res.json(features());
});

// ---- bulk approve ----
router.post('/bulk-approve', (req, res) => {
  const ids = Array.isArray(req.body.ids) ? req.body.ids : []; let n = 0;
  for (const id of ids) {
    const b = db.get('businesses', id); if (!b) continue;
    const patch = { status: 'approved', approvedOnce: true, verified: true, rejectionReason: null };
    if (b.pendingUpdates) Object.assign(patch, b.pendingUpdates, { pendingUpdates: null });
    db.update('businesses', id, patch); n++;
    const u = db.get('users', b.ownerId); if (u && u.status === 'pending') db.update('users', u._id, { status: 'approved' });
    notify(b.ownerId, 'Listing approved', `${b.name} is now live on PVRS HUB`);
  }
  db.log('bulk_approve', req.user._id, { count: n }); res.json({ message: `${n} listing(s) approved` });
});

// ---- CSV export ----
const CSV = {
  businesses: ['_id', 'name', 'category', 'subCategory', 'city', 'address', 'contact.phone', 'contact.whatsapp', 'plan', 'planExpiry', 'status', 'views', 'leads', 'rating', 'reviews', 'createdAt'],
  users: ['_id', 'name', 'phone', 'role', 'status', 'blocked', 'createdAt'],
  enquiries: ['_id', 'businessName', 'name', 'phone', 'message', 'status', 'createdAt'],
  payments: ['_id', 'purpose', 'amount', 'status', 'orderId', 'razorpayPaymentId', 'createdAt'],
  reviews: ['_id', 'businessName', 'name', 'phone', 'rating', 'text', 'status', 'createdAt'],
};
router.get('/export/:what', (req, res) => {
  const cols = CSV[req.params.what]; if (!cols) return res.status(404).send('Unknown export');
  const get = (o, k) => k.split('.').reduce((a, x) => (a == null ? a : a[x]), o);
  const esc = (v) => { const t = v == null ? '' : String(v); return /[",\n]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t; };
  const rows = [cols.join(','), ...db.all(req.params.what).map((o) => cols.map((c) => esc(get(o, c))).join(','))];
  res.set('Content-Type', 'text/csv; charset=utf-8').set('Content-Disposition', `attachment; filename="pvrs-${req.params.what}-${new Date().toISOString().slice(0, 10)}.csv"`).send('\ufeff' + rows.join('\n'));
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
router.post('/restore/:id', (req, res) => {
  const l = db.get('audit', req.params.id);
  if (!l || l.action !== 'business_deleted' || !l.meta?.snapshot) return res.status(404).json({ message: 'Nothing to restore' });
  if (db.get('businesses', l.meta.id)) return res.status(400).json({ message: 'Business already exists' });
  const b = db.insert('businesses', l.meta.snapshot, 'biz'); db.update('audit', l._id, { action: 'business_restored' });
  res.json({ message: `Restored "${b.name}"` });
});
router.get('/audit', (req, res) => res.json(db.all('audit').slice(-100).reverse()));
router.post('/run-expiry-job', (req, res) => { const r = runExpiryJob(); res.json({ ...r, message: `Expiry check done — warned ${r.warned}, downgraded ${r.downgraded}, suspended ${r.suspended}` }); });

module.exports = router;
