require('dotenv').config();

const express = require('express');
const path    = require('path');

const app       = express();
const FRONTEND  = path.join(__dirname, '..');  // parent folder = RADICAL WEBSITE
const IS_VERCEL = !!process.env.VERCEL;

// ── Middleware ──────────────────────────────────────────────────
app.use(express.json());

// ── Local dev only: serve the frontend directly from this server.
// On Vercel, static files (HTML/CSS/JS/images/video) are served by Vercel's
// CDN directly — this app only ever receives /api/* requests there, so none
// of this should run (and must not be bundled into the function package).
if (!IS_VERCEL) {
  app.use(express.static(FRONTEND));
}

// ── API Routes ──────────────────────────────────────────────────
app.use('/api/auth',      require('./routes/auth'));
app.use('/api/products',  require('./routes/products'));
app.use('/api/cart',      require('./routes/cart'));
app.use('/api/orders',    require('./routes/orders'));
app.use('/api/addresses', require('./routes/addresses'));
app.use('/api/admin',     require('./routes/admin'));

// ── Error logging from browser ──────────────────────────────────
app.post('/api/log-error', (req, res) => {
  console.log('=== BROWSER ERROR ===', req.body);
  res.sendStatus(200);
});

// ── Health check ────────────────────────────────────────────────
app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// ── Local dev only: serve corresponding HTML file or index.html (SPA-style fallback) ────
if (!IS_VERCEL) {
  app.get(/^(?!\/api).*/, (req, res) => {
    const safePath = req.path.replace(/\/$/, ''); // Remove trailing slash
    const htmlFile = safePath.endsWith('.html') ? safePath : `${safePath}.html`;
    const fullPath = path.join(FRONTEND, htmlFile);

    res.sendFile(fullPath, (err) => {
      if (err) {
        // Fallback to index.html if the specific HTML file doesn't exist
        res.sendFile(path.join(FRONTEND, 'index.html'));
      }
    });
  });
}

// ── Error handler ───────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

// Vercel imports this module and calls the exported app per-request —
// it must never call .listen() itself.
if (!IS_VERCEL) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`RADICAL running on http://localhost:${PORT}`);
    console.log(`API available at http://localhost:${PORT}/api`);
  });
}

module.exports = app;
