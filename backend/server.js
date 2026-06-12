require('dotenv').config();

const express = require('express');
const path    = require('path');

const app      = express();
const FRONTEND = path.join(__dirname, '..');  // parent folder = RADICAL WEBSITE

// ── Middleware ──────────────────────────────────────────────────
app.use(express.json());

// ── Local Fallback for Video Assets (Serves original files if optimized files are missing) ──
app.use((req, res, next) => {
  const fs = require('fs');
  if (req.path.startsWith('/assets/')) {
    const decodePath = decodeURIComponent(req.path);
    const fullPath = path.join(FRONTEND, decodePath);
    if (!fs.existsSync(fullPath)) {
      if (req.path.includes('hero_desktop') || req.path.includes('hero_mobile')) {
        req.url = '/assets/RADICAL%20WEBSITE%20VIDEO%20REBOOT.mp4';
      } else if (req.path.includes('full_bleed_optimized')) {
        req.url = '/assets/RADICAL%20WEBSITE%20VIDEO%20222222.mp4';
      }
    }
  }
  next();
});

// ── Serve frontend static files ─────────────────────────────────
app.use(express.static(FRONTEND));

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

// ── All other routes → serve corresponding HTML file or index.html (SPA-style fallback) ────
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
