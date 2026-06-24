require('dotenv').config({ path: require('path').join(__dirname, '.env') });

const express = require('express');
const path    = require('path');
const helmet  = require('helmet');
const { rateLimit } = require('express-rate-limit');
const cors = require('cors');

const app       = express();
const FRONTEND  = path.join(__dirname, '..');  // parent folder = RADICAL WEBSITE
const IS_VERCEL = !!process.env.VERCEL;

// ── Security & Rate Limiting ────────────────────────────────────
// Trust reverse proxies (Vercel uses them) for accurate rate limiting by IP
app.set('trust proxy', 1);

// CORS: only allow requests from our own domain (and localhost for dev)
const ALLOWED_ORIGINS = [
  'https://radicalhood.com',
  'https://radical-self.vercel.app',
];
if (process.env.ALLOWED_ORIGIN) {
  ALLOWED_ORIGINS.push(process.env.ALLOWED_ORIGIN);
}
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like server-to-server or curl in dev)
    if (!origin || ALLOWED_ORIGINS.includes(origin) || process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    }
    callback(new Error('CORS: origin not allowed — ' + origin));
  },
  credentials: true,
}));

// Add standard HTTP security headers (CSP disabled to avoid blocking inline frontend scripts/CDNs)
app.use(helmet({
  contentSecurityPolicy: false,
}));

// Global Rate Limiter: max 100 requests per 15 minutes per IP
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests from this IP, please try again after 15 minutes' }
});
app.use('/api', globalLimiter);

// Auth Endpoints Rate Limiter: max 15 requests per 15 minutes per IP (prevent brute force)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many authentication attempts, please try again after 15 minutes' }
});
app.use('/api/auth', authLimiter);

// Log-error endpoint limiter: max 20 requests per 15 minutes per IP
const logLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many log requests' }
});

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
app.post('/api/log-error', logLimiter, (req, res) => {
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
