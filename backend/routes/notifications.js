const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');

router.get('/', authenticate, async (req, res) => {
  try {
    const db = req.app.locals.db;
    const result = await db.query(
      'SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50',
      [req.user.id]
    );
    res.json({ notifications: result.rows });
  } catch (error) {
    res.status(500).json({ error: { message: 'Failed to get notifications' } });
  }
});

router.put('/:id/read', authenticate, async (req, res) => {
  try {
    const db = req.app.locals.db;
    await db.query(
      'UPDATE notifications SET is_read = true, read_at = CURRENT_TIMESTAMP WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    res.json({ message: 'Notification marked as read' });
  } catch (error) {
    res.status(500).json({ error: { message: 'Failed to update notification' } });
  }
});

router.put('/mark-all-read', authenticate, async (req, res) => {
  try {
    const db = req.app.locals.db;
    await db.query(
      'UPDATE notifications SET is_read = true, read_at = CURRENT_TIMESTAMP WHERE user_id = $1 AND is_read = false',
      [req.user.id]
    );
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    res.status(500).json({ error: { message: 'Failed to update notifications' } });
  }
});

module.exports = router;