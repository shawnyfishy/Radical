// Vercel serverless entrypoint. The /api/:path* rewrite in vercel.json
// forwards every /api/* request here while preserving the original URL,
// so the Express app's own /api/* route mounts in backend/server.js
// resolve correctly.
module.exports = require('../backend/server.js');
