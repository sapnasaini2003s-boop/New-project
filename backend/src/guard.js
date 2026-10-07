// Rate limiting, security headers and input validators (no extra dependencies).
const buckets = new Map();
setInterval(() => { const n = Date.now(); for (const [k, v] of buckets) if (v.reset < n) buckets.delete(k); }, 60e3).unref();

// limit('otp', 5, 10*60e3, req => req.body.phone)  -> max 5 hits per key per window
const limit = (name, max, windowMs, keyFn) => (req, res, next) => {
  const key = `${name}:${req.ip}:${keyFn ? keyFn(req) || '' : ''}`; const now = Date.now();
  let b = buckets.get(key); if (!b || b.reset < now) { b = { n: 0, reset: now + windowMs }; buckets.set(key, b); }
  if (++b.n > max) { res.set('Retry-After', Math.ceil((b.reset - now) / 1000)); return res.status(429).json({ message: 'Too many requests. Please wait a few minutes and try again.' }); }
  next();
};

const headers = (req, res, next) => {
  res.set({ 'X-Content-Type-Options': 'nosniff', 'X-Frame-Options': 'DENY', 'Referrer-Policy': 'strict-origin-when-cross-origin', 'Permissions-Policy': 'camera=(), microphone=()' });
  res.removeHeader('X-Powered-By'); next();
};

const bad = (m) => Object.assign(new Error(m), { status: 400 });
const clean = (s, max) => String(s ?? '').replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max);
const isPhone = (p) => /^[6-9]\d{9}$/.test(p || '');
const isEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e || '') && e.length <= 100;
const isUrl = (u) => { try { return ['http:', 'https:'].includes(new URL(u).protocol); } catch { return false; } };
const hostOk = (u, hosts) => { try { const h = new URL(u).hostname.replace(/^www\./, '').replace(/^m\./, ''); return hosts.some((x) => h === x || h.endsWith('.' + x)); } catch { return false; } };

// Validate + normalise a business payload (create or edit). Throws 400 with a clear message.
function cleanBiz(d, { create }) {
  if (create || d.name !== undefined) { d.name = clean(d.name, 100); if (d.name.length < 3) throw bad('Business name must be at least 3 characters'); }
  if (d.description !== undefined) d.description = String(d.description).replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '').trim().slice(0, 2000);
  for (const [k, m] of [['city', 60], ['category', 60], ['subCategory', 60], ['address', 250], ['timings', 200]]) if (d[k] !== undefined) d[k] = clean(d[k], m);
  if (d.tags) d.tags = [...new Set(d.tags.map((t) => clean(t, 30).toLowerCase()).filter(Boolean))].slice(0, 15);
  if (d.lat !== undefined || d.lng !== undefined) {
    const la = Number(d.lat), ln = Number(d.lng);
    if (d.lat === '' && d.lng === '') { delete d.lat; delete d.lng; }
    else if (!(la >= 6 && la <= 38 && ln >= 68 && ln <= 98)) throw bad('Location must be a valid latitude/longitude within India');
    else { d.lat = +la.toFixed(6); d.lng = +ln.toFixed(6); }
  }
  const c = d.contact;
  if (c) {
    if (typeof c !== 'object') throw bad('Invalid contact details');
    for (const k of ['phone', 'whatsapp']) { if (c[k] && !isPhone(String(c[k]))) throw bad(`Invalid ${k} number — enter a 10-digit Indian mobile`); }
    if (c.email && !isEmail(c.email)) throw bad('Invalid email address');
    const list = (k, ok, msg) => { if (c[k] === undefined) return; if (!Array.isArray(c[k])) throw bad(`Invalid ${k}`); c[k] = [...new Set(c[k].map((x) => String(x).trim()).filter(Boolean))]; if (c[k].length > 3) throw bad(`Maximum 3 extra ${k}`); if (c[k].some((x) => !ok(x))) throw bad(msg); };
    list('phones', isPhone, 'Extra mobile numbers must be 10-digit Indian mobiles');
    list('whatsapps', isPhone, 'Extra WhatsApp numbers must be 10-digit Indian mobiles');
    list('emails', isEmail, 'Extra emails must be valid email addresses');
    if (c.landline && !/^\d{2,5}[- ]?\d{6,8}$/.test(String(c.landline).trim())) throw bad('Landline must be like 0820-2522222');
    if (c.tollFree && !/^1800[- ]?\d{3}[- ]?\d{3,4}$/.test(String(c.tollFree).trim())) throw bad('Toll-free must start with 1800');
    if (c.website && !isUrl(c.website)) throw bad('Website must start with http:// or https://');
  }
  const o = d.orderOnline;
  if (o) {
    if (o.swiggy && !hostOk(o.swiggy, ['swiggy.com'])) throw bad('Swiggy link must be a swiggy.com URL');
    if (o.zomato && !hostOk(o.zomato, ['zomato.com'])) throw bad('Zomato link must be a zomato.com URL');
  }
  const v = d.videos;
  if (v) {
    if (v.youtube && !hostOk(v.youtube, ['youtube.com', 'youtu.be'])) throw bad('YouTube link must be a youtube.com / youtu.be URL');
    if (v.facebook && !hostOk(v.facebook, ['facebook.com', 'fb.watch'])) throw bad('Facebook link must be a facebook.com URL');
    if (v.instagram && !hostOk(v.instagram, ['instagram.com'])) throw bad('Instagram link must be an instagram.com URL');
  }
  if (d.info) {
    const i = d.info; if (typeof i !== 'object') throw bad('Invalid business info');
    if (i.year !== undefined && i.year !== '') { const y = Number(i.year); if (!Number.isInteger(y) || y < 1900 || y > new Date().getFullYear()) throw bad('Year established must be between 1900 and this year'); i.year = y; } else delete i.year;
    const PAY = ['Cash', 'UPI', 'Debit Card', 'Credit Card', 'Net Banking', 'Cheque']; i.payments = (i.payments || []).filter((p) => PAY.includes(p));
    i.awards = clean(i.awards, 300); i.services = clean(i.services, 300);
  }
  if (d.menu !== undefined) {
    if (!Array.isArray(d.menu) || d.menu.length > 25) throw bad('Menu can have up to 25 categories');
    d.menu = d.menu.map((c) => {
      const name = clean(c && c.name, 40); const items = Array.isArray(c && c.items) ? c.items : [];
      if (items.length > 80) throw bad('Up to 80 items per menu category');
      return { name, items: items.map((it) => { const price = Number(it && it.price); if (!(price >= 0 && price <= 100000)) throw bad('Menu item price must be between 0 and 1,00,000'); return { name: clean(it.name, 80), price, veg: it.veg === true || it.veg === 'true' ? true : it.veg === false || it.veg === 'false' ? false : null }; }).filter((it) => it.name) };
    }).filter((c) => c.name && c.items.length);
  }
  if (d.documents) { if (d.documents.number) d.documents.number = clean(d.documents.number, 50); if (d.documents.type) d.documents.type = clean(d.documents.type, 60); }
  return d;
}

// Check real file signature (JPG/PNG/WEBP/PDF) — a renamed .exe with image mime is rejected
function sniff(buf, mime) {
  if (!buf || buf.length < 12) return false;
  const h = buf.subarray(0, 12);
  if (mime === 'image/jpeg') return h[0] === 0xff && h[1] === 0xd8;
  if (mime === 'image/png') return h.subarray(0, 4).toString('hex') === '89504e47';
  if (mime === 'image/webp') return h.subarray(0, 4).toString() === 'RIFF' && h.subarray(8, 12).toString() === 'WEBP';
  if (mime === 'application/pdf') return h.subarray(0, 4).toString() === '%PDF';
  return false;
}
module.exports = { limit, headers, bad, clean, isPhone, isEmail, isUrl, cleanBiz, sniff };
