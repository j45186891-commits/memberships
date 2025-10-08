const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');

router.get('/', authenticate, async (req, res) => {
  try {
    const db = req.app.locals.db;
    const result = await db.query('SELECT * FROM feature_flags WHERE organization_id = $1', [req.user.organization_id]);
    const flags = {};
    result.rows.forEach(row => {
      flags[row.feature_name] = row.is_enabled;
    });
    res.json({ features: flags });
  } catch (error) {
    res.status(500).json({ error: { message: 'Failed to get feature flags' } });
  }
});

router.put('/:feature_name', authenticate, authorize('super_admin'), async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { is_enabled, settings } = req.body;
    await db.query(
      'INSERT INTO feature_flags (organization_id, feature_name, is_enabled, settings) VALUES ($1, $2, $3, $4) ON CONFLICT (organization_id, feature_name) DO UPDATE SET is_enabled = $3, settings = $4',
      [req.user.organization_id, req.params.feature_name, is_enabled, JSON.stringify(settings || {})]
    );
    res.json({ message: 'Feature flag updated' });
  } catch (error) {
    res.status(500).json({ error: { message: 'Failed to update feature flag' } });
  }
});

module.exports = router;