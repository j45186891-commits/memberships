const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');

router.get('/categories', authenticate, async (req, res) => {
  try {
    const db = req.app.locals.db;
    const result = await db.query('SELECT * FROM forum_categories WHERE organization_id = $1 AND is_active = true ORDER BY display_order', [req.user.organization_id]);
    res.json({ categories: result.rows });
  } catch (error) {
    res.status(500).json({ error: { message: 'Failed to get categories' } });
  }
});

router.get('/topics', authenticate, async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { category_id } = req.query;
    let query = 'SELECT t.*, u.first_name, u.last_name FROM forum_topics t LEFT JOIN users u ON t.user_id = u.id WHERE t.category_id IN (SELECT id FROM forum_categories WHERE organization_id = $1)';
    const params = [req.user.organization_id];
    if (category_id) {
      query += ' AND t.category_id = $2';
      params.push(category_id);
    }
    query += ' ORDER BY t.is_pinned DESC, t.last_reply_at DESC NULLS LAST, t.created_at DESC';
    const result = await db.query(query, params);
    res.json({ topics: result.rows });
  } catch (error) {
    res.status(500).json({ error: { message: 'Failed to get topics' } });
  }
});

router.post('/topics', authenticate, async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { category_id, title, content } = req.body;
    const result = await db.query(
      'INSERT INTO forum_topics (category_id, user_id, title, content) VALUES ($1, $2, $3, $4) RETURNING *',
      [category_id, req.user.id, title, content]
    );
    res.status(201).json({ topic: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: { message: 'Failed to create topic' } });
  }
});

router.post('/topics/:id/replies', authenticate, async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { content } = req.body;
    const result = await db.query(
      'INSERT INTO forum_replies (topic_id, user_id, content) VALUES ($1, $2, $3) RETURNING *',
      [req.params.id, req.user.id, content]
    );
    await db.query('UPDATE forum_topics SET reply_count = reply_count + 1, last_reply_at = CURRENT_TIMESTAMP WHERE id = $1', [req.params.id]);
    res.status(201).json({ reply: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: { message: 'Failed to create reply' } });
  }
});

module.exports = router;