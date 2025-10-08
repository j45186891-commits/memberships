const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');

router.get('/', authenticate, async (req, res) => {
  try {
    const db = req.app.locals.db;
    const result = await db.query('SELECT * FROM resources WHERE organization_id = $1 AND is_active = true ORDER BY name', [req.user.organization_id]);
    res.json({ resources: result.rows });
  } catch (error) {
    res.status(500).json({ error: { message: 'Failed to get resources' } });
  }
});

router.post('/', authenticate, authorize('admin', 'super_admin'), async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { name, description, resource_type, capacity, settings } = req.body;
    const result = await db.query(
      'INSERT INTO resources (organization_id, name, description, resource_type, capacity, settings) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [req.user.organization_id, name, description, resource_type, capacity, JSON.stringify(settings || {})]
    );
    res.status(201).json({ resource: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: { message: 'Failed to create resource' } });
  }
});

router.post('/:id/bookings', authenticate, async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { start_time, end_time, purpose } = req.body;
    const result = await db.query(
      'INSERT INTO resource_bookings (resource_id, user_id, start_time, end_time, purpose, status) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [req.params.id, req.user.id, start_time, end_time, purpose, 'pending']
    );
    res.status(201).json({ booking: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: { message: 'Failed to create booking' } });
  }
});

module.exports = router;