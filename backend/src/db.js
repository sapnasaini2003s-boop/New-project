// Data layer with a synchronous in-memory API.
// - If DATABASE_URL is reachable -> every write is persisted to Postgres.
// - Otherwise                      -> persisted to backend/data/db.json (local dev only).
// NOTE: Render/Vercel/Railway free disks are wiped on restart, so production MUST use Postgres.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const FILE = path.join(__dirname, '..', 'data', 'db.json');
const COLLECTIONS = ['users', 'businesses', 'categories', 'ads', 'payments', 'leads', 'claims', 'offers', 'blogs', 'videos', 'notifications', 'audit', 'reviews', 'enquiries', 'favorites', 'reports', 'boosters', 'boosterRequests', 'commissions', 'categoryLeads'];

let state = null;
let pgPool = null;
const pending = new Set();

function blank() { const s = { settings: {} }; for (const c of COLLECTIONS) s[c] = []; return s; }
function load() {
  if (state) return state;
  state = blank();
  return state;
}

// ---------- persistence ----------
let timer = null;
function saveFile() {
  clearTimeout(timer);
  timer = setTimeout(() => {
    try {
      fs.mkdirSync(path.dirname(FILE), { recursive: true });
      fs.writeFileSync(FILE + '.tmp', JSON.stringify(state, null, 2));
      fs.renameSync(FILE + '.tmp', FILE);
    } catch (e) { console.error('[db] file save failed:', e.message); }
  }, 50);
}

function track(p, retry, attempt = 1) {
  pending.add(p);
  p.catch((e) => {
    console.error(`[db] pg write failed (attempt ${attempt}):`, e.message);
    failedWrites++;
    if (retry && attempt < 4) setTimeout(() => track(retry(), retry, attempt + 1), attempt * 2000);
  }).finally(() => pending.delete(p));
}
let failedWrites = 0;

const persist = {
  upsert(c, doc) { 
    if (pgPool) { const q = () => pgPool.query(`INSERT INTO docs (c, id, doc) VALUES ($1, $2, $3) ON CONFLICT (c, id) DO UPDATE SET doc = EXCLUDED.doc`, [c, doc._id, doc]); track(q(), q); } 
    else saveFile(); 
  },
  remove(c, _id) { 
    if (pgPool) { const q = () => pgPool.query(`DELETE FROM docs WHERE c = $1 AND id = $2`, [c, _id]); track(q(), q); } 
    else saveFile(); 
  },
  settings() { 
    if (pgPool) { const q = () => pgPool.query(`INSERT INTO settings (id, doc) VALUES ('site', $1) ON CONFLICT (id) DO UPDATE SET doc = EXCLUDED.doc`, [state.settings]); track(q(), q); } 
    else saveFile(); 
  },
};

async function init() {
  const uri = process.env.DATABASE_URL;
  if (uri) {
    try {
      const { Pool } = require('pg');
      // Render sets DATABASE_URL, which usually requires SSL
      pgPool = new Pool({ connectionString: uri, ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 15000 });
      pgPool.on('error', (e) => console.error('[db] pg pool error:', e.message));
      // Render Postgres can be slow to wake up — retry instead of silently falling back to a local file
      for (let i = 1; ; i++) {
        try { await pgPool.query('SELECT 1'); break; }
        catch (e) { if (i >= 8) throw e; console.warn(`[db] Postgres not ready (attempt ${i}/8): ${e.message}`); await new Promise((r) => setTimeout(r, i * 3000)); }
      }

      // Create tables
      await pgPool.query(`
        CREATE TABLE IF NOT EXISTS docs (c TEXT, id TEXT, doc JSONB, PRIMARY KEY (c, id));
        CREATE TABLE IF NOT EXISTS settings (id TEXT PRIMARY KEY, doc JSONB);
        CREATE TABLE IF NOT EXISTS files (name TEXT PRIMARY KEY, kind TEXT, mimetype TEXT, data BYTEA);
      `);

      state = blank();
      
      // Load docs
      const { rows } = await pgPool.query('SELECT c, doc FROM docs');
      for (const row of rows) {
        if (state[row.c]) state[row.c].push(row.doc);
      }
      
      // Load settings
      const { rows: sRows } = await pgPool.query('SELECT doc FROM settings WHERE id = $1', ['site']);
      if (sRows.length > 0) state.settings = sRows[0].doc;
      
      // One-time migration: if PG is empty but a local db.json exists, import it
      if (!state.categories.length && fs.existsSync(FILE)) {
        const old = JSON.parse(fs.readFileSync(FILE, 'utf8'));
        for (const c of COLLECTIONS) for (const d of old[c] || []) { state[c].push(d); persist.upsert(c, d); }
        state.settings = old.settings || {}; persist.settings();
        console.log('[db] migrated data/db.json -> Postgres');
      }
      console.log(`[db] Postgres connected — data is persistent`);
      return 'pg';
    } catch (e) {
      // IMPORTANT: never fall back to the file when DATABASE_URL is set — data written there would be
      // lost and the real DB would look "deleted" on the next restart. Crash so Render restarts us.
      console.error(`[db] Postgres connection FAILED (${e.message}). Refusing to start without the database.`);
      process.exit(1);
    }
  }
  
  // Fallback to local file
  try { 
    const raw = JSON.parse(fs.readFileSync(FILE, 'utf8')); 
    state = blank(); 
    Object.assign(state, raw); 
    for (const c of COLLECTIONS) state[c] = state[c] || []; 
    state.settings = state.settings || {}; 
  } catch { 
    state = blank(); 
  }
  console.log('[db] Using local file data/db.json');
  return 'file';
}

const id = (p) => `${p}_${crypto.randomBytes(6).toString('hex')}`;
const now = () => new Date().toISOString();

const db = {
  init,
  mode: () => (pgPool ? 'pg' : 'file'),
  failedWrites: () => failedWrites,
  pg: () => pgPool,
  all: (c) => load()[c],
  find: (c, fn) => load()[c].filter(fn),
  get: (c, _id) => load()[c].find((x) => x._id === _id),
  insert(c, doc, prefix = c.slice(0, 3)) {
    const d = { _id: id(prefix), createdAt: now(), updatedAt: now(), ...doc };
    load()[c].push(d); persist.upsert(c, d); return d;
  },
  update(c, _id, patch) {
    const d = db.get(c, _id); if (!d) return null;
    Object.assign(d, patch, { updatedAt: now() }); persist.upsert(c, d); return d;
  },
  remove(c, _id) {
    const s = load(); const i = s[c].findIndex((x) => x._id === _id);
    if (i === -1) return false; s[c].splice(i, 1); persist.remove(c, _id); return true;
  },
  settings: () => load().settings,
  setSettings(patch) { Object.assign(load().settings, patch); persist.settings(); return load().settings; },
  async reset() {
    state = blank();
    if (pgPool) {
      await pgPool.query('TRUNCATE docs, settings, files');
    } else saveFile();
  },
  async flush() {
    if (pgPool) await Promise.allSettled([...pending]);
    else { clearTimeout(timer); fs.mkdirSync(path.dirname(FILE), { recursive: true }); fs.writeFileSync(FILE, JSON.stringify(load(), null, 2)); }
  },
  // Fresh install only: no categories, no businesses and no users at all
  isEmpty: () => { const s = load(); return !s.categories.length && !s.businesses.length && !s.users.length; },
  log(action, by, meta = {}) { db.insert('audit', { action, by, meta }, 'log'); },
};
module.exports = db;
