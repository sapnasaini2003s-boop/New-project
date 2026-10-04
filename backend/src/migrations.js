// Versioned data migrations. Each runs once; applied list is stored in settings.migrations.
// Visible in Admin → System. Add new ones at the END with a new id.
const db = require('./db');

const SUBS = {
  'restaurants-and-food': ['Pure Veg Restaurants', 'Non-Veg Dhabas', 'Cafes', 'Biryani Houses', 'Ice Cream Parlours', 'Home Kitchens & Home-Cooked Food Deliveries'],
  'hotels-and-stay': ['Student PGs & Hostels', 'Homestays'],
  'health-and-hospitals': ['General Physicians', 'Dentists', '24/7 Pharmacies', 'Diagnostic Labs', 'Ayurvedic Clinics', 'Local Home Nursing Care'],
  'home-and-construction': ['Electricians', 'Plumbers', 'AC Repair', 'Carpenters', 'Pest Control', 'Appliance Technicians', 'Laundry & Dry Cleaning', 'Packers & Movers'],
  'automotive-and-transport': ['Car Rentals', 'Two-Wheeler/Scooter Rentals', 'Auto-Rickshaw Call Links', 'Local Taxi Services', 'Garages', 'Towing Services'],
  'events-and-entertainment': ['Kalyana Mantapas (Wedding Halls)', 'Event Decorators', 'Local Photographers', 'DJ Sound Providers', 'Outdoor Caterers'],
  'real-estate': ['Rent Houses', 'Flats & Apartments for Lease', 'Commercial Shops', 'Real Estate Brokers'],
};

const MIGRATIONS = [
  { id: '001', name: 'Initialise feature switches', run: () => { if (!db.settings().features) db.setSettings({ features: {} }); return 'ok'; } },
  { id: '002', name: 'Add coastal-Karnataka sub-categories (spec §2)', run: () => {
    let n = 0;
    for (const c of db.all('categories')) {
      const add = SUBS[c.slug]; if (!add) continue;
      const subs = [...(c.subs || [])]; for (const s of add) if (!subs.includes(s)) { subs.push(s); n++; }
      db.update('categories', c._id, { subs });
    }
    return `${n} sub-categories added`;
  } },
  { id: '003', name: 'Backfill listing counters & approval flags', run: () => {
    let n = 0;
    for (const b of db.all('businesses')) {
      const p = {}; if (typeof b.views !== 'number') p.views = 0; if (typeof b.leads !== 'number') p.leads = 0;
      if (b.status === 'approved' && !b.approvedOnce) p.approvedOnce = true;
      if (Object.keys(p).length) { db.update('businesses', b._id, p); n++; }
    }
    return `${n} listings updated`;
  } },
  { id: '004', name: 'Ensure super-admin account role', run: () => {
    const u = db.find('users', (x) => x.phone === process.env.ADMIN_PHONE)[0];
    if (u && u.role !== 'admin') db.update('users', u._id, { role: 'admin', status: 'approved' });
    return u ? 'admin verified' : 'admin not registered yet';
  } },
  { id: '005', name: 'Default SEO & contact settings', run: () => {
    const s = db.settings();
    if (!s.seo) db.setSettings({ seo: { title: 'PVRS HUB – Udupi & Mangaluru Local Business Directory', description: 'Find verified local businesses in Udupi, Manipal, Malpe and Mangaluru.' } });
    if (!s.contact) db.setSettings({ contact: { email: 'support@yourdomain.in', grievance: 'legal@yourdomain.in', phone: '' } });
    return 'ok';
  } },
];

// One-off maintenance tasks the admin can trigger manually
const TASKS = {
  'remove-demo-data': { name: 'Remove demo analytics data', run: () => { const d = db.find('leads', (l) => l.demo); d.forEach((l) => db.remove('leads', l._id)); return `${d.length} demo records removed`; } },
  'reset-search-stats': { name: 'Reset search-demand statistics', run: () => { db.setSettings({ searchStats: {} }); return 'search stats cleared'; } },
  'clear-old-notifications': { name: 'Delete notifications older than 90 days', run: () => { const cut = Date.now() - 90 * 864e5; const old = db.find('notifications', (n) => new Date(n.createdAt) < cut); old.forEach((n) => db.remove('notifications', n._id)); return `${old.length} removed`; } },
  'recount-ratings': { name: 'Recalculate ratings from approved reviews', run: () => {
    let n = 0;
    for (const b of db.all('businesses')) {
      const r = db.find('reviews', (x) => x.businessId === b._id && x.status === 'approved' && !x.counted);
      if (!r.length) continue; n++;
    }
    return `${n} listings have reviews (ratings already update on approval)`;
  } },
};

function status() {
  const applied = db.settings().migrations || [];
  return MIGRATIONS.map((m) => ({ id: m.id, name: m.name, ...(applied.find((a) => a.id === m.id) || { pending: true }) }));
}
function runPending(by = 'system') {
  const applied = [...(db.settings().migrations || [])]; const out = [];
  for (const m of MIGRATIONS) {
    if (applied.find((a) => a.id === m.id)) continue;
    const t = Date.now();
    try { const result = m.run(); applied.push({ id: m.id, appliedAt: new Date().toISOString(), result, ms: Date.now() - t, by }); out.push({ id: m.id, result }); }
    catch (e) { out.push({ id: m.id, error: e.message }); console.error('[migration]', m.id, e.message); break; }
  }
  db.setSettings({ migrations: applied });
  if (out.length) console.log('[migrations] applied', out.map((o) => o.id).join(', '));
  return out;
}
module.exports = { status, runPending, TASKS };
