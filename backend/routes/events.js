const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');

router.get('/', authenticate, async (req, res) => {
  try {
    const db = req.app.locals.db;
    const result = await db.query(
      'SELECT * FROM events WHERE organization_id = $1 AND (is_public = true OR $2 IN ($3, $4)) ORDER BY start_date',
      [req.user.organization_id, req.user.role, 'admin', 'super_admin']
    );
    res.json({ events: result.rows });
  } catch (error) {
    res.status(500).json({ error: { message: 'Failed to get events' } });
  }
});

router.post('/', authenticate, authorize('admin', 'super_admin'), async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { title, description, location, start_date, end_date, max_attendees, registration_deadline, price, is_public } = req.body;
    const result = await db.query(
      'INSERT INTO events (organization_id, title, description, location, start_date, end_date, max_attendees, registration_deadline, price, is_public, created_by) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *',
      [req.user.organization_id, title, description, location, start_date, end_date, max_attendees, registration_deadline, price || 0, is_public !== false, req.user.id]
    );
    res.status(201).json({ event: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: { message: 'Failed to create event' } });
  }
});

router.post('/:id/register', authenticate, async (req, res) => {
  try {
    const db = req.app.locals.db;
    const result = await db.query(
      'INSERT INTO event_registrations (event_id, user_id, status) VALUES ($1, $2, $3) ON CONFLICT (event_id, user_id) DO NOTHING RETURNING *',
      [req.params.id, req.user.id, 'registered']
    );
    res.status(201).json({ registration: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: { message: 'Failed to register for event' } });
  }
});

module.exports = router;