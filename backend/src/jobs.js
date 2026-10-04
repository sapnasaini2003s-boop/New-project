// Subscription & document expiry tracker — runs every 6 hours
const db = require('./db');
const { notify } = require('./util');

const DAY = 864e5;
function runExpiryJob() {
  const t = Date.now(); const r = { warned: 0, downgraded: 0, suspended: 0 };
  for (const b of db.all('businesses')) {
    const warned = b.warned || {};
    // Plan expiry
    if (b.plan === 'premium' && b.planExpiry) {
      const left = new Date(b.planExpiry) - t;
      if (left <= 0) {
        db.update('businesses', b._id, { plan: 'free', warned: { ...warned, plan: null } }); r.downgraded++;
        notify(b.ownerId, 'Premium plan expired', `${b.name} moved to Free plan. Call/WhatsApp buttons are now hidden. Renew to unlock.`);
      } else if (left < 7 * DAY && warned.plan !== b.planExpiry) {
        db.update('businesses', b._id, { warned: { ...warned, plan: b.planExpiry } }); r.warned++;
        notify(b.ownerId, 'Plan expiring soon', `Your Premium plan for ${b.name} expires on ${new Date(b.planExpiry).toDateString()}.`);
      }
    }
    // Government licence expiry
    const exp = b.documents?.expiry;
    if (exp && b.status === 'approved') {
      const left = new Date(exp) - t;
      if (left <= 0) {
        db.update('businesses', b._id, { status: 'suspended', suspendReason: 'License / certificate expired. Upload renewed document.' }); r.suspended++;
        notify(b.ownerId, 'Listing suspended', `${b.name}: your licence expired. Upload the renewed certificate to restore.`);
      } else if (left < 15 * DAY && warned.doc !== exp) {
        db.update('businesses', b._id, { warned: { ...(db.get('businesses', b._id).warned || {}), doc: exp } }); r.warned++;
        notify(b.ownerId, 'Licence expiring soon', `${b.name}: licence expires on ${new Date(exp).toDateString()}. Please upload renewal.`);
      }
    }
  }
  // Expired ads
  for (const a of db.all('ads')) if (a.status === 'approved' && a.endDate && new Date(a.endDate) < t) db.update('ads', a._id, { status: 'expired' });
  return r;
}
function tracked() { const t = Date.now(); const r = runExpiryJob(); db.setSettings({ jobs: { ...(db.settings().jobs || {}), expiry: { lastRun: new Date().toISOString(), ms: Date.now() - t, result: r } } }); return r; }
function start() { tracked(); setInterval(tracked, 6 * 3600e3); }
module.exports = { runExpiryJob: tracked, start };
