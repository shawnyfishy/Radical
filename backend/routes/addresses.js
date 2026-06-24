const router = require('express').Router();
const db     = require('../db/database');
const { requireAuth } = require('../middleware/auth');

router.use(requireAuth);

// GET /api/addresses
router.get('/', async (req, res) => {
  const addresses = await db.all(
    'SELECT * FROM addresses WHERE user_id = ? ORDER BY is_default DESC',
    [req.user.id]
  );
  res.json({ addresses });
});

// POST /api/addresses
router.post('/', async (req, res) => {
  const { name, line1, line2, city, state, postal_code, country, phone, is_default } = req.body;
  if (!name || !line1 || !city || !state || !postal_code) {
    return res.status(400).json({ error: 'name, line1, city, state and postal_code are required' });
  }

  if (is_default) {
    await db.run('UPDATE addresses SET is_default = 0 WHERE user_id = ?', [req.user.id]);
  }

  const result = await db.run(`
    INSERT INTO addresses (user_id, name, line1, line2, city, state, postal_code, country, phone, is_default)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [req.user.id, name, line1, line2 ?? null, city, state, postal_code, country ?? 'IN', phone ?? null, is_default ? 1 : 0]);

  const address = await db.get('SELECT * FROM addresses WHERE id = ?', [result.lastInsertRowid]);
  res.status(201).json({ address });
});

// DELETE /api/addresses/:id
router.delete('/:id', async (req, res) => {
  const address = await db.get(
    'SELECT * FROM addresses WHERE id = ? AND user_id = ?',
    [req.params.id, req.user.id]
  );
  if (!address) return res.status(404).json({ error: 'Address not found' });
  await db.run('DELETE FROM addresses WHERE id = ?', [address.id]);
  res.json({ message: 'Address deleted' });
});

module.exports = router;
