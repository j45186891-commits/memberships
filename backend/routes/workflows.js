const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');

router.get('/', authenticate, authorize('admin', 'super_admin'), async (req, res) => {
  try {
    const db = req.app.locals.db;
    const result = await db.query('SELECT * FROM workflows WHERE organization_id = $1 ORDER BY name', [req.user.organization_id]);
    res.json({ workflows: result.rows });
  } catch (error) {
    res.status(500).json({ error: { message: 'Failed to get workflows' } });
  }
});

router.post('/', authenticate, authorize('admin', 'super_admin'), async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { name, trigger_type, trigger_config, actions, is_active } = req.body;
    const result = await db.query(
      'INSERT INTO workflows (organization_id, name, trigger_type, trigger_config, actions, is_active) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [req.user.organization_id, name, trigger_type, JSON.stringify(trigger_config || {}), JSON.stringify(actions), is_active !== false]
    );
    res.status(201).json({ workflow: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: { message: 'Failed to create workflow' } });
  }
});

module.exports = router;