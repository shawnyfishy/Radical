require('dotenv').config();

const express = require('express');
const path    = require('path');

const app      = express();
const FRONTEND = path.join(__dirname, '..');  // parent folder = RADICAL WEBSITE

// ── Middleware ──────────────────────────────────────────────────
app.use(express.json());

// ── Serve frontend static files ─────────────────────────────────
app.use(express.static(FRONTEND));

// ── API Routes ──────────────────────────────────────────────────
app.use('/api/auth',      require('./routes/auth'));
app.use('/api/products',  require('./routes/products'));
app.use('/api/cart',      require('./routes/cart'));
app.use('/api/orders',    require('./routes/orders'));
app.use('/api/addresses', require('./routes/addresses'));
app.use('/api/admin',     require('./routes/admin'));

// ── Health check ────────────────────────────────────────────────
app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// ── All other routes → serve index.html (SPA-style fallback) ────
app.get(/^(?!\/api).*/, (req, res) => {
  res.sendFile(path.join(FRONTEND, 'index.html'));
});

// ── Error handler ───────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`RADICAL running on http://localhost:${PORT}`);
  console.log(`API available at http://localhost:${PORT}/api`);
});
