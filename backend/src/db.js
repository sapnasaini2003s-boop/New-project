// Lightweight JSON-file database (zero setup; works on any Node host incl. Hostinger).
// Swap to MongoDB later by re-implementing these helpers.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const FILE = path.join(__dirname, '..', 'data', 'db.json');
const COLLECTIONS = ['users', 'businesses', 'categories', 'ads', 'payments', 'leads', 'claims', 'offers', 'blogs', 'videos', 'notifications', 'audit'];

let state = null;
function load() {
  if (state) return state;
  try { state = JSON.parse(fs.readFileSync(FILE, 'utf8')); } catch { state = {}; }
  for (const c of COLLECTIONS) state[c] = state[c] || [];
  state.settings = state.settings || {};
  return state;
}
let timer = null;
function save() {
  clearTimeout(timer);
  timer = setTimeout(() => {
    fs.mkdirSync(path.dirname(FILE), { recursive: true });
    fs.writeFileSync(FILE + '.tmp', JSON.stringify(state, null, 2));
    fs.renameSync(FILE + '.tmp', FILE);
  }, 50);
}
const id = (p) => `${p}_${crypto.randomBytes(6).toString('hex')}`;
const now = () => new Date().toISOString();

const db = {
  all: (c) => load()[c],
  find: (c, fn) => load()[c].filter(fn),
  get: (c, _id) => load()[c].find((x) => x._id === _id),
  insert(c, doc, prefix = c.slice(0, 3)) {
    const d = { _id: id(prefix), createdAt: now(), updatedAt: now(), ...doc };
    load()[c].push(d); save(); return d;
  },
  update(c, _id, patch) {
    const d = db.get(c, _id); if (!d) return null;
    Object.assign(d, patch, { updatedAt: now() }); save(); return d;
  },
  remove(c, _id) {
    const s = load(); const i = s[c].findIndex((x) => x._id === _id);
    if (i === -1) return false; s[c].splice(i, 1); save(); return true;
  },
  settings: () => load().settings,
  setSettings(patch) { Object.assign(load().settings, patch); save(); return load().settings; },
  reset(data) { state = data; for (const c of COLLECTIONS) state[c] = state[c] || []; state.settings = state.settings || {}; save(); },
  flush() { clearTimeout(timer); fs.mkdirSync(path.dirname(FILE), { recursive: true }); fs.writeFileSync(FILE, JSON.stringify(load(), null, 2)); },
  isEmpty: () => load().categories.length === 0,
  log(action, by, meta = {}) { db.insert('audit', { action, by, meta }, 'log'); },
};
module.exports = db;
