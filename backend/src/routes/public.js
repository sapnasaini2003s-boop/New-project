// Public (no-login) APIs used by the website
const router = require('express').Router();
const db = require('../db');
const { publicBiz, isPremium, auth, notify, features, requireFeature } = require('../util');

const live = (b) => b.status === 'approved';
const activeAd = (a) => {
  const t = new Date();
  return a.status === 'approved' && (!a.startDate || new Date(a.startDate) <= t) && (!a.endDate || new Date(a.endDate) >= t);
};
const trackSearch = (cat) => {
  if (!cat) return; const s = db.settings(); const st = s.searchStats || {};
  st[cat] = (st[cat] || 0) + 1; db.setSettings({ searchStats: st });
};

// Public config: feature switches the frontend uses to show/hide things
router.get('/config', (req, res) => { const s = db.settings(); res.json({ features: features(), siteName: s.siteName, cities: s.cities, announcement: s.announcement }); });

router.get('/categories', (req, res) => res.json(db.all('categories').filter((c) => c.active !== false).sort((a, b) => (a.order || 0) - (b.order || 0))));

router.get('/home', (req, res) => {
  const s = db.settings();
  const ads = db.all('ads').filter(activeAd);
  const approved = db.all('businesses').filter(live);
  const stats = s.stats || {};
  res.json({
    settings: { hero: s.hero, cta: s.cta, locationBanner: s.locationBanner, social: s.social, apps: s.apps, cities: s.cities, popularSearches: s.popularSearches, siteName: s.siteName },
    stats: { ...stats, businesses: stats.businesses || `${approved.length}+` },
    ads: {
      top: ads.filter((a) => a.type === 'top_banner'),
      middle: ads.filter((a) => a.type === 'middle_banner'),
      promo: ads.filter((a) => a.type === 'promo'),
      heroVideo: ads.filter((a) => a.type === 'hero_video'),
    },
    videos: db.all('videos').filter((v) => v.active !== false).slice(0, 10),
    offers: db.all('offers').filter((o) => o.active !== false).slice(0, 6),
  });
});

// Featured loop: ONLY premium; ranked by live demand (category search trend + views + leads)
router.get('/featured', (req, res) => {
  const trend = db.settings().searchStats || {};
  const city = req.query.city;
  const list = db.all('businesses').filter((b) => live(b) && isPremium(b) && !b.unclaimed && (!city || b.city === city))
    .map((b) => ({ b, score: (trend[b.category] || 0) * 3 + (b.views || 0) + (b.leads || 0) * 5 + (b.rating || 0) * 10 }))
    .sort((x, y) => y.score - x.score).slice(0, 12).map((x) => publicBiz(x.b));
  res.json(list);
});

router.get('/businesses', (req, res) => {
  const { q, category, sub, city, sort, ids } = req.query;
  let list = db.all('businesses').filter(live);
  if (ids) { const set = new Set(String(ids).split(',')); return res.json(list.filter((b) => set.has(b._id)).map((b) => publicBiz(b))); }
  if (category) { list = list.filter((b) => b.category === category); trackSearch(category); }
  if (sub) list = list.filter((b) => b.subCategory === sub);
  if (city) list = list.filter((b) => !b.city || b.city.toLowerCase() === String(city).toLowerCase());
  if (q) {
    const t = String(q).toLowerCase();
    const cats = db.all('categories');
    list = list.filter((b) => {
      const cat = cats.find((c) => c.slug === b.category);
      return [b.name, b.description, b.subCategory, cat?.name, ...(b.tags || [])].some((x) => x && String(x).toLowerCase().includes(t));
    });
    const hit = cats.find((c) => c.name.toLowerCase().includes(t) || (c.subs || []).some((s) => s.toLowerCase().includes(t)));
    if (hit) trackSearch(hit.slug);
  }
  // Premium first, then rating
  list.sort((a, b) => (isPremium(b) - isPremium(a)) || ((b.rating || 0) - (a.rating || 0)));
  if (sort === 'trending') list.sort((a, b) => (b.views || 0) - (a.views || 0));
  res.json(list.map((b) => publicBiz(b)));
});

router.get('/businesses/:id', (req, res) => {
  const b = db.get('businesses', req.params.id);
  if (!b || !live(b)) return res.status(404).json({ message: 'Listing not found' });
  db.update('businesses', b._id, { views: (b.views || 0) + 1 });
  const full = publicBiz(b, true);
  full.related = db.find('businesses', (x) => live(x) && x._id !== b._id && x.category === b.category)
                   .sort((x, y) => (y.featured ? 1 : 0) - (x.featured ? 1 : 0) || (y.rating || 0) - (x.rating || 0))
                   .slice(0, 4).map((x) => publicBiz(x));
  res.json(full);
});

// Lead tracking + WhatsApp auto-alert to premium owners
const lastAlert = new Map();
router.post('/leads', auth(false), async (req, res) => {
  const { businessId, type } = req.body; // view | call | whatsapp | order
  const b = db.get('businesses', businessId);
  if (!b || !live(b)) return res.status(404).json({ message: 'Not found' });
  db.insert('leads', { businessId, type, userId: req.user?._id, userPhone: req.user?.phone }, 'lead');
  if (type !== 'view') db.update('businesses', b._id, { leads: (b.leads || 0) + 1 });
  if (isPremium(b) && b.ownerId) {
    const key = b._id + type; const t = Date.now();
    if (!lastAlert.get(key) || t - lastAlert.get(key) > 10 * 60e3) {
      lastAlert.set(key, t);
      sendWhatsApp(b.contact?.whatsapp || b.contact?.phone,
        `PVRS HUB: A customer just ${type === 'view' ? 'viewed' : 'clicked ' + type + ' on'} your listing "${b.name}".`);
      notify(b.ownerId, 'New lead', `Customer ${type} on ${b.name}`, 'whatsapp');
    }
  }
  res.json({ ok: true });
});

async function sendWhatsApp(to, text) {
  const { WHATSAPP_TOKEN: tk, WHATSAPP_PHONE_NUMBER_ID: pid } = process.env;
  if (!tk || !pid || !to) return;
  try {
    await fetch(`https://graph.facebook.com/v21.0/${pid}/messages`, {
      method: 'POST', headers: { Authorization: `Bearer ${tk}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ messaging_product: 'whatsapp', to: '91' + to, type: 'text', text: { body: text } }),
    });
  } catch (e) { console.error('WhatsApp send failed', e.message); }
}

router.get('/offers', (req, res) => res.json(db.all('offers').filter((o) => o.active !== false)));
router.get('/blogs', (req, res) => res.json(db.all('blogs').filter((b) => b.published !== false)));
router.get('/blogs/:id', (req, res) => { const b = db.get('blogs', req.params.id); b ? res.json(b) : res.status(404).json({ message: 'Not found' }); });
router.get('/videos', (req, res) => res.json(db.all('videos').filter((v) => v.active !== false)));
router.get('/pages/:slug', (req, res) => {
  const p = (db.settings().pages || {})[req.params.slug];
  p ? res.json(p) : res.status(404).json({ message: 'Not found' });
});
router.get('/pricing', (req, res) => res.json({
  premium: Number(process.env.PREMIUM_PLAN_PRICE || 2999), premiumDays: Number(process.env.PREMIUM_PLAN_DAYS || 365),
  bannerPerDay: Number(process.env.BANNER_PRICE_PER_DAY || 199), razorpayKey: process.env.RAZORPAY_KEY_ID || null,
}));
router.post('/contact', (req, res) => {
  const { name, phone, message, type } = req.body;
  if (!name || !message) return res.status(400).json({ message: 'Name and message required' });
  db.insert('notifications', { title: `Contact form (${type || 'general'})`, message: `${name} (${phone}): ${message}`, channel: 'inbox', forAdmin: true }, 'ntf');
  res.json({ message: 'Thanks! Our team will contact you soon.' });
});


// ---------- Grievance (login required) ----------
router.post('/grievances', auth(true), (req, res) => {
  const { kind, details } = req.body; const text = String(details || '').trim();
  if (text.length < 5) return res.status(400).json({ message: 'Please write your query' });
  const issue = kind === 'issue';
  db.insert('reports', { type: issue ? 'issue' : 'grievance', businessId: null, businessName: issue ? 'Reported issue' : 'Grievance redressal', reason: issue ? 'Issue' : 'Grievance', details: text.slice(0, 2000), name: req.user.name, phone: req.user.phone, userId: req.user._id, status: 'pending' }, 'rep');
  notify(null, issue ? 'New issue reported' : 'New grievance', `${req.user.name || req.user.phone}: ${text.slice(0, 120)}`, 'inbox');
  res.status(201).json({ message: 'Submitted. Our team will act on it within 24-48 hours.' });
});

// ---------- Search suggestions ----------
router.get('/suggest', (req, res) => {
  const t = String(req.query.q || '').toLowerCase().trim(); if (t.length < 2) return res.json([]);
  const out = [];
  for (const c of db.all('categories')) {
    if (c.name.toLowerCase().includes(t)) out.push({ type: 'category', label: c.name, icon: c.icon, href: `/category/${c.slug}` });
    for (const s of c.subs || []) if (s.toLowerCase().includes(t)) out.push({ type: 'sub', label: s, icon: c.icon, href: `/category/${c.slug}?sub=${encodeURIComponent(s)}` });
  }
  for (const b of db.all('businesses')) if (live(b) && b.name.toLowerCase().includes(t)) out.push({ type: 'business', label: b.name, sub: b.city, href: `/business/${b._id}` });
  res.json(out.slice(0, 10));
});

// ---------- Reviews (go live after admin approval) ----------
router.get('/businesses/:id/reviews', (req, res) => {
  res.json(db.find('reviews', (r) => r.businessId === req.params.id && r.status === 'approved').slice(-50).reverse()
    .map((r) => ({ _id: r._id, name: r.name, rating: r.rating, text: r.text, createdAt: r.createdAt })));
});
router.post('/reviews', auth(true), requireFeature('reviews', 'Reviews are currently disabled'), (req, res) => {
  const { businessId, rating, text } = req.body; const b = db.get('businesses', businessId);
  const n = Number(rating);
  if (!b || !live(b)) return res.status(404).json({ message: 'Listing not found' });
  if (!(n >= 1 && n <= 5)) return res.status(400).json({ message: 'Rating must be 1–5' });
  const name = req.user.name, phone = req.user.phone;
  if (b.ownerId === req.user._id) return res.status(400).json({ message: 'You cannot review your own business' });
  if (db.find('reviews', (r) => r.businessId === businessId && r.phone === phone && r.status !== 'rejected').length)
    return res.status(400).json({ message: 'You have already reviewed this business' });
  db.insert('reviews', { businessId, businessName: b.name, userId: req.user._id, name: name || 'Customer', phone, rating: n, text: String(text || '').slice(0, 1000), status: 'pending' }, 'rev');
  res.status(201).json({ message: 'Thanks! Your review will appear after moderation.' });
});

// ---------- Report a listing (Section 79 takedown / spam) ----------
router.post('/reports', auth(true), requireFeature('reports', 'Reporting is currently disabled'), (req, res) => {
  const { businessId, reason, details, name, phone } = req.body; const b = db.get('businesses', businessId);
  if (!b) return res.status(404).json({ message: 'Listing not found' });
  if (!reason) return res.status(400).json({ message: 'Select a reason' });
  db.insert('reports', { businessId, businessName: b.name, reason, details: String(details || '').slice(0, 1000), name: req.user?.name || name, phone: req.user?.phone || phone, userId: req.user._id, status: 'pending' }, 'rep');
  notify(null, 'Listing reported', `${b.name}: ${reason}`, 'inbox');
  res.status(201).json({ message: 'Report submitted. Our team will review it within 24 hours.' });
});

// ---------- Enquiries (lead form — works on every plan) ----------
router.post('/enquiries', auth(false), requireFeature('enquiries', 'Enquiries are currently disabled'), (req, res) => {
  const { businessId, name, phone, message } = req.body; const b = db.get('businesses', businessId);
  if (!b || !live(b)) return res.status(404).json({ message: 'Listing not found' });
  if (!name || !/^[6-9]\d{9}$/.test(phone || '')) return res.status(400).json({ message: 'Enter your name and a valid 10-digit mobile' });
  db.insert('enquiries', { businessId, businessName: b.name, ownerId: b.ownerId || null, name, phone, message: String(message || '').slice(0, 1000), userId: req.user?._id, status: 'new' }, 'enq');
  db.update('businesses', b._id, { leads: (b.leads || 0) + 1 });
  if (b.ownerId) {
    notify(b.ownerId, 'New enquiry', `${name} enquired about ${b.name}`, 'inbox');
    if (isPremium(b)) sendWhatsApp(b.contact?.whatsapp || b.contact?.phone, `PVRS HUB: New enquiry for "${b.name}" from ${name}. Check your dashboard.`);
  }
  res.status(201).json({ message: 'Enquiry sent! The business will contact you soon.' });
});

// ---------- Favourites ----------
router.get('/favorites', auth(), (req, res) => {
  const ids = db.find('favorites', (f) => f.userId === req.user._id).map((f) => f.businessId);
  res.json(db.all('businesses').filter((b) => ids.includes(b._id) && live(b)).map((b) => publicBiz(b)));
});
router.post('/favorites/:id', auth(), (req, res) => {
  const ex = db.find('favorites', (f) => f.userId === req.user._id && f.businessId === req.params.id)[0];
  if (ex) { db.remove('favorites', ex._id); return res.json({ saved: false }); }
  db.insert('favorites', { userId: req.user._id, businessId: req.params.id }, 'fav'); res.json({ saved: true });
});

module.exports = router;
module.exports.sendWhatsApp = sendWhatsApp;
