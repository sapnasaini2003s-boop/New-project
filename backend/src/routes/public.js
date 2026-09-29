// Public (no-login) APIs used by the website
const router = require('express').Router();
const db = require('../db');
const { publicBiz, isPremium, auth, notify } = require('../util');

const live = (b) => b.status === 'approved';
const activeAd = (a) => {
  const t = new Date();
  return a.status === 'approved' && (!a.startDate || new Date(a.startDate) <= t) && (!a.endDate || new Date(a.endDate) >= t);
};
const trackSearch = (cat) => {
  if (!cat) return; const s = db.settings(); const st = s.searchStats || {};
  st[cat] = (st[cat] || 0) + 1; db.setSettings({ searchStats: st });
};

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
  const { q, category, sub, city, sort } = req.query;
  let list = db.all('businesses').filter(live);
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
  res.json(publicBiz(b, true));
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

module.exports = router;
module.exports.sendWhatsApp = sendWhatsApp;
