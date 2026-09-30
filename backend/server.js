require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

require('./src/seed')(false); // seeds only when DB is empty
const app = express();
app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/uploads/public', express.static(path.join(__dirname, 'uploads', 'public'), { maxAge: '7d' }));

app.get('/', (req, res) => res.json({ message: 'PVRS HUB API running' }));
app.use('/api/auth', require('./src/routes/auth'));
app.use('/api', require('./src/routes/public'));
app.use('/api/vendor', require('./src/routes/vendor'));
app.use('/api/payments', require('./src/routes/payments'));
app.use('/api/admin', require('./src/routes/admin'));

app.use((err, req, res, next) => {
  console.error(err.message);
  res.status(err.status || 400).json({ message: err.message || 'Server error' });
});

require('./src/jobs').start();
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`PVRS HUB API on http://localhost:${PORT}`));
