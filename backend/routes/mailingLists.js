const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');

// Get all mailing lists
router.get('/', authenticate, async (req, res) => {
  try {
    const db = req.app.locals.db;
    const result = await db.query(
      'SELECT * FROM mailing_lists WHERE organization_id = $1 ORDER BY name',
      [req.user.organization_id]
    );
    res.json({ mailing_lists: result.rows });
  } catch (error) {
    res.status(500).json({ error: { message: 'Failed to get mailing lists' } });
  }
});

// Get mailing list by ID
router.get('/:id', authenticate, async (req, res) => {
  try {
    const db = req.app.locals.db;
    const result = await db.query(
      'SELECT * FROM mailing_lists WHERE id = $1 AND organization_id = $2',
      [req.params.id, req.user.organization_id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: { message: 'Mailing list not found' } });
    }

    const mailingList = result.rows[0];

    // Get subscribers
    const subscribersResult = await db.query(`
      SELECT mls.*, u.first_name, u.last_name, u.email
      FROM mailing_list_subscribers mls
      JOIN users u ON mls.user_id = u.id
      WHERE mls.mailing_list_id = $1 AND mls.is_active = true
    `, [req.params.id]);

    mailingList.subscribers = subscribersResult.rows;

    res.json({ mailing_list: mailingList });
  } catch (error) {
    res.status(500).json({ error: { message: 'Failed to get mailing list' } });
  }
});

// Create mailing list
router.post('/', authenticate, authorize('admin', 'super_admin'), async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { name, email, description, list_type, auto_sync, access_level, settings } = req.body;

    const result = await db.query(`
      INSERT INTO mailing_lists (organization_id, name, email, description, list_type, auto_sync, access_level, settings)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `, [req.user.organization_id, name, email, description, list_type || 'manual', auto_sync || false, access_level || 'public', JSON.stringify(settings || {})]);

    res.status(201).json({ mailing_list: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: { message: 'Failed to create mailing list' } });
  }
});

// Add subscriber
router.post('/:id/subscribers', authenticate, authorize('admin', 'super_admin'), async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { user_id } = req.body;

    const result = await db.query(`
      INSERT INTO mailing_list_subscribers (mailing_list_id, user_id, is_active)
      VALUES ($1, $2, true)
      ON CONFLICT (mailing_list_id, user_id) DO UPDATE SET is_active = true
      RETURNING *
    `, [req.params.id, user_id]);

    res.status(201).json({ subscriber: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: { message: 'Failed to add subscriber' } });
  }
});

// Remove subscriber
router.delete('/:id/subscribers/:user_id', authenticate, authorize('admin', 'super_admin'), async (req, res) => {
  try {
    const db = req.app.locals.db;
    await db.query(
      'UPDATE mailing_list_subscribers SET is_active = false WHERE mailing_list_id = $1 AND user_id = $2',
      [req.params.id, req.params.user_id]
    );
    res.json({ message: 'Subscriber removed' });
  } catch (error) {
    res.status(500).json({ error: { message: 'Failed to remove subscriber' } });
  }
});

module.exports = router;