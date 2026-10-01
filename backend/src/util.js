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

// Fields a vendor may edit (anything else is admin-only)
const EDITABLE = ['name', 'description', 'category', 'subCategory', 'city', 'address', 'contact', 'orderOnline',
  'profileImage', 'gallery', 'bannerImage', 'videos', 'timings', 'tags', 'documents'];

// Public view: enforce free-tier lead hiding & media hardlock. NEVER expose pendingUpdates/documents.
function publicBiz(b, full = false) {
  const prem = isPremium(b);
  const out = {
    _id: b._id, name: b.name, description: b.description, category: b.category, subCategory: b.subCategory,
    city: b.city, address: full ? b.address : undefined, profileImage: b.profileImage || b.image, badge: b.badge,
    mapUrl: full && (b.address || b.city) ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([b.name, b.address, b.city].filter(Boolean).join(', '))}` : undefined, rating: b.rating || 0,
    reviews: b.reviews || 0, verified: !!b.verified, plan: prem ? 'premium' : 'free', unclaimed: !!b.unclaimed,
    timings: b.timings, tags: b.tags, featured: prem,
    orderOnline: b.orderOnline && (b.orderOnline.swiggy || b.orderOnline.zomato) ? b.orderOnline : undefined,
  };
  if (prem && !b.unclaimed) {
    out.contact = { phone: b.contact?.phone, whatsapp: b.contact?.whatsapp, email: full ? b.contact?.email : undefined };
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

function notify(userId, title, message, channel = 'email') {
  const u = userId && db.get('users', userId);
  db.insert('notifications', { userId, to: u?.email || u?.phone, title, message, channel, sent: false }, 'ntf');
  console.log(`[notify:${channel}] -> ${u?.phone || 'admin'}: ${title}`);
}

module.exports = { sign, auth, role, upload, fileUrl, sendStored, isPremium, publicBiz, pick, parseJSON, EDITABLE, notify, UP };
