const router = require('express').Router();
const db     = require('../db/database');
const { requireAuth } = require('../middleware/auth');

router.use(requireAuth);

// GET /api/addresses
router.get('/', (req, res) => {
  const addresses = db.prepare('SELECT * FROM addresses WHERE user_id = ? ORDER BY is_default DESC').all(req.user.id);
  res.json({ addresses });
});

// POST /api/addresses
router.post('/', (req, res) => {
  const { name, line1, line2, city, state, postal_code, country, phone, is_default } = req.body;
  if (!name || !line1 || !city || !state || !postal_code) {
    return res.status(400).json({ error: 'name, line1, city, state and postal_code are required' });
  }

  if (is_default) {
    db.prepare('UPDATE addresses SET is_default = 0 WHERE user_id = ?').run(req.user.id);
  }

  const result = db.prepare(`
    INSERT INTO addresses (user_id, name, line1, line2, city, state, postal_code, country, phone, is_default)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(req.user.id, name, line1, line2 ?? null, city, state, postal_code, country ?? 'IN', phone ?? null, is_default ? 1 : 0);

  const address = db.prepare('SELECT * FROM addresses WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ address });
});

// DELETE /api/addresses/:id
router.delete('/:id', (req, res) => {
  const address = db.prepare('SELECT * FROM addresses WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!address) return res.status(404).json({ error: 'Address not found' });
  db.prepare('DELETE FROM addresses WHERE id = ?').run(address.id);
  res.json({ message: 'Address deleted' });
});

module.exports = router;
