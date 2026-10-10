const jwt = require('jsonwebtoken');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const crypto = require('crypto');
const db = require('./db');

const SECRET = () => process.env.JWT_SECRET || 'dev-secret-change-me';
const sign = (u) => jwt.sign({ id: u._id, role: u.role }, SECRET(), { expiresIn: '30d' });

function auth(required = true) {
  return (req, res, next) => {
    const h = req.headers.authorization || '';
    const token = h.startsWith('Bearer ') ? h.slice(7) : req.query.token;
    if (token) {
      try {
        const p = jwt.verify(token, SECRET());
        const u = db.get('users', p.id);
        if (u && !u.blocked) req.user = u;
      } catch { /* ignore */ }
    }
    if (required && !req.user) return res.status(401).json({ message: 'Please login first' });
    next();
  };
}
const role = (...roles) => (req, res, next) =>
  req.user && roles.includes(req.user.role) ? next() : res.status(403).json({ message: 'Not allowed' });

// ---------- uploads ----------
// Files go to Postgres BYTEA when Postgres is connected (survives redeploys), else to backend/uploads/.
const UP = path.join(__dirname, '..', 'uploads');
for (const d of ['public', 'private']) fs.mkdirSync(path.join(UP, d), { recursive: true });
const ALLOWED = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp', 'application/pdf': '.pdf' };
const mem = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED[file.mimetype]) return cb(Object.assign(new Error('Only JPG, PNG, WEBP or PDF files allowed'), { status: 400 }));
    if (file.fieldname !== 'document' && file.mimetype === 'application/pdf') return cb(Object.assign(new Error('Images must be JPG/PNG/WEBP'), { status: 400 }));
    cb(null, true);
  },
});

async function storeFile(f) {
  if (!require('./guard').sniff(f.buffer, f.mimetype)) throw Object.assign(new Error('File content does not match its type. Upload a real JPG, PNG, WEBP or PDF.'), { status: 400 });
  const kind = f.fieldname === 'document' ? 'private' : 'public';
  const name = Date.now() + '-' + crypto.randomBytes(5).toString('hex') + ALLOWED[f.mimetype];
  
  const pool = db.pg();
  if (pool) {
    await pool.query('INSERT INTO files (name, kind, mimetype, data) VALUES ($1, $2, $3, $4)', [name, kind, f.mimetype, f.buffer]);
  } else {
    fs.writeFileSync(path.join(UP, kind, name), f.buffer);
  }
  
  f.url = kind === 'private' ? `private/${name}` : `/uploads/public/${name}`;
  delete f.buffer;
}

const upload = {
  fields: (spec) => [mem.fields(spec), async (req, res, next) => {
    try { for (const list of Object.values(req.files || {})) for (const f of list) await storeFile(f); next(); } catch (e) { next(e); }
  }],
};

const fileUrl = (f) => (f ? f.url : undefined);

// Stream a stored file (Postgres or disk)
async function sendStored(kind, name, res) {
  name = path.basename(name);
  const pool = db.pg();
  if (pool) {
    const { rows } = await pool.query('SELECT mimetype, data FROM files WHERE name = $1 AND kind = $2', [name, kind]);
    if (rows.length === 0) return res.status(404).send('Not found');
    res.type(rows[0].mimetype);
    res.set('Cache-Control', kind === 'public' ? 'public, max-age=604800' : 'private, no-store');
    return res.send(rows[0].data);
  } else {
    const f = path.join(UP, kind, name); 
    return fs.existsSync(f) ? res.sendFile(f) : res.status(404).send('Not found');
  }
}

// ---------- plan helpers ----------
const isPremium = (b) => b.plan === 'premium' && (!b.planExpiry || new Date(b.planExpiry) > new Date());
const hasBooster = (b, key) => !!(b.boosters && b.boosters[key] && new Date(b.boosters[key].until) > new Date());

// Fields a vendor may edit (anything else is admin-only)
const EDITABLE = ['name', 'description', 'category', 'subCategory', 'city', 'address', 'contact', 'orderOnline',
  'profileImage', 'gallery', 'bannerImage', 'videos', 'timings', 'hours', 'tags', 'documents', 'lat', 'lng', 'info', 'menu', 'orderCfg'];

// Public view: enforce free-tier lead hiding & media hardlock. NEVER expose pendingUpdates/documents.
function publicBiz(b, full = false) {
  const prem = isPremium(b);
  const out = {
    _id: b._id, name: b.name, description: b.description, category: b.category, subCategory: b.subCategory,
    city: b.city, address: full ? b.address : undefined, profileImage: b.profileImage || b.image, badge: b.badge,
    mapUrl: full && (b.address || b.city) ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([b.name, b.address, b.city].filter(Boolean).join(', '))}` : undefined, rating: b.rating || 0,
    reviews: b.reviews || 0, verified: !!b.verified, plan: prem ? 'premium' : 'free', unclaimed: !!b.unclaimed,
    timings: b.timings, hours: b.hours, tags: b.tags, featured: prem, trustSeal: hasBooster(b, 'trust-seal') || undefined, info: b.info, hasMenu: !!(b.menu && b.menu.length) || undefined, orderCfg: b.orderCfg, menu: full ? b.menu : undefined,
    orderOnline: b.orderOnline && (b.orderOnline.swiggy || b.orderOnline.zomato) ? b.orderOnline : undefined,
  };
  if (prem && !b.unclaimed) {
    out.contact = { phone: b.contact?.phone, whatsapp: b.contact?.whatsapp, email: full ? b.contact?.email : undefined,
      ...(full ? { phones: b.contact?.phones, whatsapps: b.contact?.whatsapps, emails: b.contact?.emails, landline: b.contact?.landline, tollFree: b.contact?.tollFree } : {}) };
    out.gallery = b.gallery || [];
    out.bannerImage = b.bannerImage;
    out.videos = b.videos;
  } else {
    out.contactLocked = true;
  }
  return out;
}

function pick(obj, keys) { const o = {}; for (const k of keys) if (obj[k] !== undefined) o[k] = obj[k]; return o; }

function parseJSON(v, fallback) { if (v == null || v === '') return fallback; if (typeof v !== 'string') return v; try { return JSON.parse(v); } catch { return fallback; } }

// Email via SMTP (set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, MAIL_FROM, ADMIN_EMAIL). Falls back to in-app log.
let mailer = null;
function getMailer() {
  if (mailer !== null) return mailer;
  const host = process.env.SMTP_HOST || (process.env.SMTP_USER && process.env.SMTP_PASS ? 'smtp.gmail.com' : '');
  if (!host || !process.env.SMTP_PASS) return (mailer = false);
  try {
    mailer = require('nodemailer').createTransport({ host, port: Number(process.env.SMTP_PORT || 465), secure: Number(process.env.SMTP_PORT || 465) === 465, auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } });
  } catch (e) { console.error('[mail] init failed', e.message); mailer = false; }
  return mailer;
}
const emailHtml = (title, message) => `<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden">
  <div style="background:#0055FF;color:#fff;padding:18px 24px;font-size:20px;font-weight:bold">Tap2Bizz <span style="color:#FF6600">HUB</span></div>
  <div style="padding:24px"><h2 style="margin:0 0 12px;color:#0b1b3f">${title}</h2><p style="color:#374151;line-height:1.6">${message}</p>
  <a href="${(process.env.FRONTEND_URL || '').split(',')[0]}/vendor/dashboard" style="display:inline-block;margin-top:16px;background:#FF6600;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none">Open dashboard</a></div>
  <div style="background:#f9fafb;color:#9ca3af;font-size:12px;padding:12px 24px">Grievance: legal@yourdomain.in</div></div>`;
function notify(userId, title, message, channel = 'email') {
  const u = userId && db.get('users', userId);
  // vendors log in by mobile only, so fall back to the e-mail on their business listing
  const bizMail = u && db.find('businesses', (b) => b.ownerId === u._id && b.contact?.email)[0]?.contact.email;
  const to = channel === 'inbox' ? (process.env.ADMIN_EMAIL || process.env.SMTP_USER) : (u?.email || bizMail);
  const n = db.insert('notifications', { userId, to: to || u?.phone, title, message, channel, sent: false }, 'ntf');
  const m = getMailer();
  if (m && to && (channel === 'email' || channel === 'inbox')) {
    m.sendMail({ from: process.env.MAIL_FROM || process.env.SMTP_USER, to, subject: `Tap2Bizz: ${title}`, html: emailHtml(title, message) })
      .then(() => db.update('notifications', n._id, { sent: true })).catch((e) => db.update('notifications', n._id, { error: e.message }));
  }
  console.log(`[notify:${channel}] -> ${to || u?.phone || 'admin'}: ${title}`);
}

// ---------- Feature switches (Admin → Feature Controls) ----------
const FEATURE_DEFAULTS = {
  customerLogin: true,    // customers log in (OTP always required) to review / report / raise grievances
  vendorSignup: true,     // new business owners can register
  vendorOtp: true,        // vendors must verify OTP (admin login ALWAYS needs OTP)
  reviews: true, enquiries: true, favorites: true, claims: true,
  bannerBooking: true, premiumUpgrade: true, reports: false, complaintForm: false, orderOnline: true, cartOrders: true, grievanceForm: true,
  maintenance: false,     // shows maintenance banner + blocks vendor submissions
};
const features = () => ({ ...FEATURE_DEFAULTS, ...(db.settings().features || {}) });
const requireFeature = (k, msg) => (req, res, next) => (features()[k] ? next() : res.status(403).json({ message: msg || 'This feature is currently disabled by admin' }));

// Weekly hours: { mon: { open: true, from: '09:00', to: '21:00' }, ... } — validated & normalised
const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
function cleanHours(h) {
  if (!h || typeof h !== 'object') return undefined;
  const out = {}; const t = /^([01]\d|2[0-3]):[0-5]\d$/;
  for (const d of DAYS) {
    const x = h[d] || {};
    out[d] = x.open && t.test(x.from) && t.test(x.to) ? { open: true, from: x.from, to: x.to, ...(x.allDay ? { allDay: true } : {}) } : { open: false };
  }
  return out;
}

// ---- WhatsApp Cloud API helpers (one place, one set of env names) ----
const waCfg = () => ({ tk: process.env.WHATSAPP_TOKEN, pid: process.env.WHATSAPP_PHONE_NUMBER_ID || process.env.WHATSAPP_PHONE_ID });
async function waPost(body) {
  const { tk, pid } = waCfg(); if (!tk || !pid) return { ok: false, error: 'WhatsApp is not configured' };
  try {
    const r = await fetch(`https://graph.facebook.com/v21.0/${pid}/messages`, { method: 'POST', headers: { Authorization: `Bearer ${tk}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ messaging_product: 'whatsapp', ...body }) });
    if (!r.ok) { const j = await r.json().catch(() => ({})); return { ok: false, error: j.error?.message || `HTTP ${r.status}` }; }
    return { ok: true };
  } catch (e) { return { ok: false, error: e.message }; }
}
async function sendWhatsApp(to, text) { if (!to) return false; const r = await waPost({ to: '91' + to, type: 'text', text: { body: text } }); if (!r.ok && r.error !== 'WhatsApp is not configured') console.error('WhatsApp send failed:', r.error); return r.ok; }
// Login OTP. Meta only allows free text inside a 24h chat window, so production should use an approved AUTHENTICATION template (WHATSAPP_OTP_TEMPLATE).
async function sendWhatsAppOtp(to, code) {
  const tpl = process.env.WHATSAPP_OTP_TEMPLATE;
  if (tpl) return waPost({ to: '91' + to, type: 'template', template: { name: tpl, language: { code: process.env.WHATSAPP_OTP_LANG || 'en' }, components: [{ type: 'body', parameters: [{ type: 'text', text: code }] }, { type: 'button', sub_type: 'url', index: '0', parameters: [{ type: 'text', text: code }] }] } });
  return waPost({ to: '91' + to, type: 'text', text: { body: `Your Tap2Bizz login OTP is ${code}. Valid for 5 minutes. Do not share it with anyone.` } });
}

module.exports = { sendWhatsApp, sendWhatsAppOtp, waCfg,  hasBooster, cleanHours, getMailer, features, requireFeature, FEATURE_DEFAULTS, sign, auth, role, upload, fileUrl, sendStored, isPremium, publicBiz, pick, parseJSON, EDITABLE, notify, UP };
