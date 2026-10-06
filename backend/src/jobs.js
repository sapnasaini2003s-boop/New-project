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
      // 7-day grace after expiry before the listing is hidden (avoids surprise 'disappearing' listings)
      if (left <= -7 * DAY) {
        db.update('businesses', b._id, { status: 'suspended', suspendReason: 'License / certificate expired. Upload renewed document.' }); r.suspended++;
        notify(b.ownerId, 'Listing suspended', `${b.name}: your licence expired. Upload the renewed certificate to restore.`);
      } else if (left <= 0 && warned.docExpired !== exp) {
        db.update('businesses', b._id, { warned: { ...(b.warned || {}), docExpired: exp } }); r.warned++;
        notify(b.ownerId, 'Licence expired — 7 days to renew', `${b.name}: your licence expired on ${new Date(exp).toDateString()}. Upload the renewal within 7 days or the listing will be hidden.`);
      } else if (left > 0 && left < 15 * DAY && warned.doc !== exp) {
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
// ---- Auto-reply to grievances / issues after N hours (message + delay controlled by Admin) ----
const AUTO_DEFAULT = { enabled: true, delayHours: 24, message: 'Dear {name}, we have received your {type} (ID: {ref}). Our Grievance Officer will review it and get back to you as per the IT (Intermediary Guidelines) Rules 2021. Thanks, PVRS HUB Team' };
const autoCfg = () => ({ ...AUTO_DEFAULT, ...(db.settings().autoReply || {}) });
const fill = (m, r) => m.replace(/\{name\}/g, r.name || 'Customer').replace(/\{type\}/g, r.type === 'issue' ? 'issue' : 'grievance').replace(/\{ref\}/g, String(r._id).slice(-6).toUpperCase());
function autoReplyJob() {
  const c = autoCfg(); let sent = 0; if (!c.enabled) return { sent };
  for (const r of db.find('reports', (x) => x.type && x.status === 'pending' && !x.response && !x.autoResponse)) {
    if (Date.now() - new Date(r.createdAt) < c.delayHours * 3600e3) continue;
    db.update('reports', r._id, { autoResponse: fill(c.message, r), autoRepliedAt: new Date().toISOString() });
    if (r.userId) notify(r.userId, 'We received your complaint', fill(c.message, r), 'email');
    sent++;
  }
  if (sent) console.log(`[auto-reply] sent ${sent}`);
  return { sent };
}
function start() { tracked(); autoReplyJob(); setInterval(tracked, 6 * 3600e3); setInterval(autoReplyJob, 15 * 60e3); }
module.exports = { runExpiryJob: tracked, autoReplyJob, autoCfg, AUTO_DEFAULT, start };
