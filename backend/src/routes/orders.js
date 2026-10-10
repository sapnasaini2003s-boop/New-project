// Menu cart → order (customer) + order inbox (vendor). Prices are ALWAYS re-read from the saved menu, never trusted from the browser.
const express = require('express');
const db = require('../db');
const { auth, notify, features, isPremium, hasBooster, sendWhatsApp } = require('../util');
const { limit, clean, isPhone } = require('../guard');

const STATUS = ['new', 'confirmed', 'ready', 'delivered', 'cancelled'];
const TYPES = ['pickup', 'delivery', 'dinein', 'home', 'visit', 'booking'];
const TYPE_LABEL = { pickup: 'Pickup', delivery: 'Home delivery', dinein: 'Dine-in', home: 'Service at my address', visit: 'I will visit your shop / office', booking: 'Booking / enquiry' };
const pub = express.Router();
const ven = express.Router();

// Offer codes: approved + active + not expired, for this business (or all businesses when offer.businessId is empty)
const findOffer = (code, b, subtotal) => {
  const c = String(code || '').trim().toUpperCase(); if (!c) return { error: 'Enter an offer code' };
  const today = new Date(new Date().toDateString());
  const o = db.find('offers', (x) => String(x.code || '').toUpperCase() === c && x.active !== false && (!x.status || x.status === 'approved') && (!x.businessId || x.businessId === b._id) && (!x.expiry || new Date(x.expiry) >= today))[0];
  if (!o) return { error: 'This code is invalid, expired or not valid for this business' };
  if (!o.discountType || !(Number(o.discountValue) > 0)) return { error: 'This offer is shown to customers but has no automatic discount — show it to the business directly' };
  if (Number(o.minOrder) > subtotal) return { error: `Add items worth ₹${o.minOrder} or more to use this code` };
  let d = o.discountType === 'percent' ? Math.floor(subtotal * Number(o.discountValue) / 100) : Number(o.discountValue);
  if (o.discountType === 'percent' && Number(o.maxDiscount) > 0) d = Math.min(d, Number(o.maxDiscount));
  d = Math.max(0, Math.min(d, subtotal));
  const label = o.discountType === 'percent' ? `${o.discountValue}% OFF` : `₹${o.discountValue} OFF`;
  return { offer: o, discount: d, label, code: c };
};
const buildItems = (b, lines) => {
  if (!Array.isArray(lines) || !lines.length || lines.length > 30) return { error: 'Add 1 to 30 items to your cart' };
  const items = []; const seen = new Set();
  for (const l of lines) {
    const cat = b.menu.find((c) => c.name === l?.cat); const it = cat?.items.find((x) => x.name === l?.name);
    const qty = Number(l?.qty);
    if (!it) return { error: `"${clean(l?.name, 40)}" is no longer available — refresh the page` };
    if (!Number.isInteger(qty) || qty < 1 || qty > 20) return { error: 'Quantity must be between 1 and 20' };
    const k = cat.name + '||' + it.name; if (seen.has(k)) return { error: 'Duplicate dish in cart' }; seen.add(k);
    items.push({ cat: cat.name, name: it.name, qty, price: it.price, veg: it.veg });
  }
  return { items };
};
const waText = (o) => [
  `*New order / booking ${o.orderNo} — Tap2Bizz*`,
  ...o.items.map((i) => `${i.name} — Quantity ${i.qty}`),
  `Type: ${TYPE_LABEL[o.type] || 'Pickup'}`,
  `Name: ${o.name}`, `Phone: ${o.phone}`,
  ...(o.address ? [`Address: ${o.address}`] : []),
  ...(o.note ? [`Note: ${o.note}`] : []),
  ...(o.code ? [`Offer code: ${o.code} (${o.offerLabel})`] : []),
].join('\n');

// Check an offer code against the current cart (discount is re-computed again when the order is placed)
pub.post('/businesses/:id/offer-check', limit('ocheck', 30, 10 * 60e3), (req, res) => {
  const b = db.get('businesses', req.params.id); if (!b || b.status !== 'approved' || !b.menu?.length) return res.status(404).json({ message: 'Listing not found' });
  const built = buildItems(b, req.body.items); if (built.error) return res.status(400).json({ message: built.error });
  const r = findOffer(req.body.code, b, built.items.reduce((s, i) => s + i.price * i.qty, 0));
  if (r.error) return res.status(400).json({ message: r.error });
  res.json({ code: r.code, label: r.label, discount: r.discount, title: r.offer.title });
});

// Customer places an order from the business page menu
pub.post('/businesses/:id/orders', limit('order', 6, 10 * 60e3), auth(false), (req, res) => {
  if (features().cartOrders === false) return res.status(403).json({ message: 'Online ordering is currently paused' });
  const b = db.get('businesses', req.params.id);
  if (!b || b.status !== 'approved') return res.status(404).json({ message: 'Listing not found' });
  if (!b.menu?.length || b.orderCfg?.accept === false) return res.status(400).json({ message: 'This business is not taking menu orders right now' });
  const name = clean(req.body.name, 60), phone = String(req.body.phone || ''), type = TYPES.includes(req.body.type) ? req.body.type : 'pickup';
  if (name.length < 2 || !isPhone(phone)) return res.status(400).json({ message: 'Enter your name and a valid 10-digit mobile number' });
  const address = clean(req.body.address, 200), note = clean(req.body.note, 200);
  if ((type === 'delivery' || type === 'home') && address.length < 8) return res.status(400).json({ message: 'Enter your full address' });
  const built = buildItems(b, req.body.items); if (built.error) return res.status(400).json({ message: built.error });
  const items = built.items;
  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
  let offer = null;
  if (req.body.code) { offer = findOffer(req.body.code, b, subtotal); if (offer.error) return res.status(400).json({ message: offer.error }); }
  const total = subtotal - (offer?.discount || 0);
  const min = Number(b.orderCfg?.min) || 0;
  if (subtotal < min) return res.status(400).json({ message: `Minimum order for this business is ₹${min}` });
  if (db.find('orders', (o) => o.businessId === b._id && o.phone === phone && o.total === total && Date.now() - new Date(o.createdAt || 0) < 2 * 60e3).length) return res.status(429).json({ message: 'You just placed this order — please wait a couple of minutes.' });
  const orderNo = 'PV' + Date.now().toString(36).slice(-5).toUpperCase();
  const canWa = !!(b.contact?.whatsapp || b.contact?.phone) && isPremium(b);
  const o = db.insert('orders', { orderNo, businessId: b._id, businessName: b.name, ownerId: b.ownerId || null, userId: req.user?._id || null, name, phone, type, address, note, items, subtotal, discount: offer?.discount || 0, code: offer?.code || '', offerLabel: offer?.label || '', total, status: 'new', via: canWa ? 'whatsapp' : 'platform' }, 'ord');
  if (b.ownerId) {
    notify(b.ownerId, `New order ${orderNo} — ₹${total}`, `${name} (${phone}) ordered ${items.length} item(s) from ${b.name}.`, 'inbox');
    if (isPremium(b) || hasBooster(b, 'whatsapp-leads')) sendWhatsApp(b.contact?.whatsapp || b.contact?.phone, waText(o));
  }
  db.update('businesses', b._id, { leads: (b.leads || 0) + 1 });
  const wa = canWa ? `https://wa.me/91${b.contact.whatsapp || b.contact.phone}?text=${encodeURIComponent(waText(o))}` : null;
  res.status(201).json({ message: canWa ? 'Order saved. Opening WhatsApp to send it to the business…' : 'Order sent! The business will contact you on your mobile.', orderNo, total, waUrl: wa });
});

// Vendor: my orders
ven.get('/orders', auth(), (req, res) => res.json(db.find('orders', (o) => o.ownerId === req.user._id).slice().reverse()));
ven.put('/orders/:id', auth(), (req, res) => {
  const o = db.get('orders', req.params.id);
  if (!o || o.ownerId !== req.user._id) return res.status(404).json({ message: 'Order not found' });
  if (!STATUS.includes(req.body.status)) return res.status(400).json({ message: 'Invalid status' });
  db.update('orders', o._id, { status: req.body.status });
  if (o.userId) notify(o.userId, `Order ${o.orderNo} ${req.body.status}`, `${o.businessName}: your order is now "${req.body.status}".`, 'inbox');
  res.json({ message: 'Updated' });
});

module.exports = { pub, ven, STATUS };
