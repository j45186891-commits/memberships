const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');

router.get('/', authenticate, authorize('admin', 'super_admin'), async (req, res) => {
  try {
    const db = req.app.locals.db;
    const result = await db.query(
      'SELECT p.*, u.first_name, u.last_name, u.email FROM payments p LEFT JOIN users u ON p.user_id = u.id WHERE p.organization_id = $1 ORDER BY p.created_at DESC',
      [req.user.organization_id]
    );
    res.json({ payments: result.rows });
  } catch (error) {
    res.status(500).json({ error: { message: 'Failed to get payments' } });
  }
});

router.post('/', authenticate, async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { membership_id, amount, currency, payment_method, metadata } = req.body;
    const result = await db.query(
      'INSERT INTO payments (organization_id, user_id, membership_id, amount, currency, payment_method, status, metadata) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
      [req.user.organization_id, req.user.id, membership_id, amount, currency || 'USD', payment_method, 'pending', JSON.stringify(metadata || {})]
    );
    res.status(201).json({ payment: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: { message: 'Failed to create payment' } });
  }
});

module.exports = router;