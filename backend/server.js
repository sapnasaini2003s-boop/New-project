require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const db = require('./src/db');
const { sendStored } = require('./src/util');
const app = express();
const STARTED = Date.now(); app.locals.started = STARTED;
app.use(cors()); // Bearer-token auth (no cookies) so open CORS is safe
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.get('/uploads/public/:name', (req, res, next) => sendStored('public', req.params.name, res).catch(next));

app.get('/', (req, res) => res.json({ message: 'PVRS HUB API running', storage: db.mode() }));
app.get('/api/health', (req, res) => res.json({ ok: true, storage: db.mode() }));
app.use('/api/auth', require('./src/routes/auth'));
app.use('/api', require('./src/routes/public'));
app.use('/api/vendor', require('./src/routes/vendor'));
app.use('/api/payments', require('./src/routes/payments'));
app.use('/api/admin', require('./src/routes/admin'));

app.use((err, req, res, next) => {
  console.error(err.message);
  res.status(err.status || 400).json({ message: err.message || 'Server error' });
});

const PORT = process.env.PORT || 5000;
(async () => {
  await db.init();
  await require('./src/seed')(false); // seeds only when DB is empty
  require('./src/migrations').runPending();
  require('./src/jobs').start();
  app.listen(PORT, () => console.log(`PVRS HUB API on http://localhost:${PORT} (storage: ${db.mode()})`));
})();
const bye = async () => { await db.flush(); process.exit(0); };
process.on('SIGINT', bye); process.on('SIGTERM', bye);
