const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');

router.get('/', authenticate, authorize('admin', 'super_admin'), async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { page = 1, limit = 50, action, entity_type, user_id } = req.query;

    let query = `
      SELECT al.*, u.first_name, u.last_name, u.email
      FROM audit_log al
      LEFT JOIN users u ON al.user_id = u.id
      WHERE al.organization_id = $1
    `;
    const params = [req.user.organization_id];
    let paramCount = 1;

    if (action) {
      paramCount++;
      query += ` AND al.action = $${paramCount}`;
      params.push(action);
    }

    if (entity_type) {
      paramCount++;
      query += ` AND al.entity_type = $${paramCount}`;
      params.push(entity_type);
    }

    if (user_id) {
      paramCount++;
      query += ` AND al.user_id = $${paramCount}`;
      params.push(user_id);
    }

    query += ' ORDER BY al.created_at DESC';

    const offset = (page - 1) * limit;
    query += ` LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    params.push(limit, offset);

    const result = await db.query(query, params);

    res.json({ audit_log: result.rows });
  } catch (error) {
    res.status(500).json({ error: { message: 'Failed to get audit log' } });
  }
});

module.exports = router;