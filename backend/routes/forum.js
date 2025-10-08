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

// Create forum category (admin only)
router.post('/categories', authenticate, authorize('admin', 'super_admin'), async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { name, description, display_order, is_active } = req.body;
    
    const result = await db.query(
      'INSERT INTO forum_categories (organization_id, name, description, display_order, is_active) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [req.user.organization_id, name, description, display_order || 0, is_active !== false]
    );
    
    res.status(201).json({ category: result.rows[0] });
  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({ error: { message: 'Failed to create category' } });
  }
});

// Update forum category
router.put('/categories/:id', authenticate, authorize('admin', 'super_admin'), async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { id } = req.params;
    const { name, description, display_order, is_active } = req.body;
    
    const updates = [];
    const params = [];
    let paramCount = 0;
    
    if (name !== undefined) {
      paramCount++;
      updates.push(`name = $${paramCount}`);
      params.push(name);
    }
    if (description !== undefined) {
      paramCount++;
      updates.push(`description = $${paramCount}`);
      params.push(description);
    }
    if (display_order !== undefined) {
      paramCount++;
      updates.push(`display_order = $${paramCount}`);
      params.push(display_order);
    }
    if (is_active !== undefined) {
      paramCount++;
      updates.push(`is_active = $${paramCount}`);
      params.push(is_active);
    }
    
    if (updates.length === 0) {
      return res.status(400).json({ error: { message: 'No updates provided' } });
    }
    
    paramCount++;
    params.push(id);
    paramCount++;
    params.push(req.user.organization_id);
    
    await db.query(
      `UPDATE forum_categories SET ${updates.join(', ')} WHERE id = $${paramCount - 1} AND organization_id = $${paramCount}`,
      params
    );
    
    res.json({ message: 'Category updated successfully' });
  } catch (error) {
    console.error('Update category error:', error);
    res.status(500).json({ error: { message: 'Failed to update category' } });
  }
});

// Delete forum category
router.delete('/categories/:id', authenticate, authorize('admin', 'super_admin'), async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { id } = req.params;
    
    // Check if category has topics
    const topics = await db.query(
      'SELECT COUNT(*) as count FROM forum_topics WHERE category_id = $1',
      [id]
    );
    
    if (parseInt(topics.rows[0].count) > 0) {
      return res.status(400).json({ 
        error: { message: 'Cannot delete category with existing topics. Deactivate it instead.' } 
      });
    }
    
    await db.query(
      'DELETE FROM forum_categories WHERE id = $1 AND organization_id = $2',
      [id, req.user.organization_id]
    );
    
    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({ error: { message: 'Failed to delete category' } });
  }
});

// Update topic
router.put('/topics/:id', authenticate, async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { id } = req.params;
    const { title, content, is_pinned, is_locked } = req.body;
    
    // Check if user is author or admin
    const topicResult = await db.query('SELECT user_id FROM forum_topics WHERE id = $1', [id]);
    if (topicResult.rows.length === 0) {
      return res.status(404).json({ error: { message: 'Topic not found' } });
    }
    
    const isAuthor = topicResult.rows[0].user_id === req.user.id;
    const isAdmin = ['admin', 'super_admin'].includes(req.user.role);
    
    if (!isAuthor && !isAdmin) {
      return res.status(403).json({ error: { message: 'Not authorized to edit this topic' } });
    }
    
    const updates = [];
    const params = [];
    let paramCount = 0;
    
    if (title !== undefined && (isAuthor || isAdmin)) {
      paramCount++;
      updates.push(`title = $${paramCount}`);
      params.push(title);
    }
    if (content !== undefined && (isAuthor || isAdmin)) {
      paramCount++;
      updates.push(`content = $${paramCount}`);
      params.push(content);
    }
    if (is_pinned !== undefined && isAdmin) {
      paramCount++;
      updates.push(`is_pinned = $${paramCount}`);
      params.push(is_pinned);
    }
    if (is_locked !== undefined && isAdmin) {
      paramCount++;
      updates.push(`is_locked = $${paramCount}`);
      params.push(is_locked);
    }
    
    if (updates.length === 0) {
      return res.status(400).json({ error: { message: 'No updates provided' } });
    }
    
    paramCount++;
    params.push(id);
    
    await db.query(
      `UPDATE forum_topics SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = $${paramCount}`,
      params
    );
    
    res.json({ message: 'Topic updated successfully' });
  } catch (error) {
    console.error('Update topic error:', error);
    res.status(500).json({ error: { message: 'Failed to update topic' } });
  }
});

// Delete topic
router.delete('/topics/:id', authenticate, async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { id } = req.params;
    
    // Check if user is author or admin
    const topicResult = await db.query('SELECT user_id FROM forum_topics WHERE id = $1', [id]);
    if (topicResult.rows.length === 0) {
      return res.status(404).json({ error: { message: 'Topic not found' } });
    }
    
    const isAuthor = topicResult.rows[0].user_id === req.user.id;
    const isAdmin = ['admin', 'super_admin'].includes(req.user.role);
    
    if (!isAuthor && !isAdmin) {
      return res.status(403).json({ error: { message: 'Not authorized to delete this topic' } });
    }
    
    // Delete replies first
    await db.query('DELETE FROM forum_replies WHERE topic_id = $1', [id]);
    
    // Delete topic
    await db.query('DELETE FROM forum_topics WHERE id = $1', [id]);
    
    res.json({ message: 'Topic deleted successfully' });
  } catch (error) {
    console.error('Delete topic error:', error);
    res.status(500).json({ error: { message: 'Failed to delete topic' } });
  }
});

// Update reply
router.put('/replies/:id', authenticate, async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { id } = req.params;
    const { content } = req.body;
    
    // Check if user is author or admin
    const replyResult = await db.query('SELECT user_id FROM forum_replies WHERE id = $1', [id]);
    if (replyResult.rows.length === 0) {
      return res.status(404).json({ error: { message: 'Reply not found' } });
    }
    
    const isAuthor = replyResult.rows[0].user_id === req.user.id;
    const isAdmin = ['admin', 'super_admin'].includes(req.user.role);
    
    if (!isAuthor && !isAdmin) {
      return res.status(403).json({ error: { message: 'Not authorized to edit this reply' } });
    }
    
    await db.query(
      'UPDATE forum_replies SET content = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [content, id]
    );
    
    res.json({ message: 'Reply updated successfully' });
  } catch (error) {
    console.error('Update reply error:', error);
    res.status(500).json({ error: { message: 'Failed to update reply' } });
  }
});

// Delete reply
router.delete('/replies/:id', authenticate, async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { id } = req.params;
    
    // Check if user is author or admin
    const replyResult = await db.query('SELECT user_id, topic_id FROM forum_replies WHERE id = $1', [id]);
    if (replyResult.rows.length === 0) {
      return res.status(404).json({ error: { message: 'Reply not found' } });
    }
    
    const isAuthor = replyResult.rows[0].user_id === req.user.id;
    const isAdmin = ['admin', 'super_admin'].includes(req.user.role);
    
    if (!isAuthor && !isAdmin) {
      return res.status(403).json({ error: { message: 'Not authorized to delete this reply' } });
    }
    
    const topicId = replyResult.rows[0].topic_id;
    
    // Delete reply
    await db.query('DELETE FROM forum_replies WHERE id = $1', [id]);
    
    // Update topic reply count
    await db.query('UPDATE forum_topics SET reply_count = reply_count - 1 WHERE id = $1', [topicId]);
    
    res.json({ message: 'Reply deleted successfully' });
  } catch (error) {
    console.error('Delete reply error:', error);
    res.status(500).json({ error: { message: 'Failed to delete reply' } });
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