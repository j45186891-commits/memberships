const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');

router.get('/', authenticate, async (req, res) => {
  try {
    const db = req.app.locals.db;
    const result = await db.query('SELECT * FROM surveys WHERE organization_id = $1 AND is_active = true ORDER BY created_at DESC', [req.user.organization_id]);
    res.json({ surveys: result.rows });
  } catch (error) {
    res.status(500).json({ error: { message: 'Failed to get surveys' } });
  }
});

router.post('/', authenticate, authorize('admin', 'super_admin'), async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { title, description, questions, start_date, end_date } = req.body;
    const result = await db.query(
      'INSERT INTO surveys (organization_id, title, description, questions, start_date, end_date, created_by) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [req.user.organization_id, title, description, JSON.stringify(questions), start_date, end_date, req.user.id]
    );
    res.status(201).json({ survey: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: { message: 'Failed to create survey' } });
  }
});

// Get survey by ID
router.get('/:id', authenticate, async (req, res) => {
  try {
    const db = req.app.locals.db;
    const result = await db.query(
      'SELECT * FROM surveys WHERE id = $1 AND organization_id = $2',
      [req.params.id, req.user.organization_id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: { message: 'Survey not found' } });
    }
    
    res.json({ survey: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: { message: 'Failed to get survey' } });
  }
});

// Update survey
router.put('/:id', authenticate, authorize('admin', 'super_admin'), async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { id } = req.params;
    const { title, description, questions, start_date, end_date, is_active } = req.body;
    
    const updates = [];
    const params = [];
    let paramCount = 0;
    
    if (title !== undefined) {
      paramCount++;
      updates.push(`title = $${paramCount}`);
      params.push(title);
    }
    if (description !== undefined) {
      paramCount++;
      updates.push(`description = $${paramCount}`);
      params.push(description);
    }
    if (questions !== undefined) {
      paramCount++;
      updates.push(`questions = $${paramCount}`);
      params.push(JSON.stringify(questions));
    }
    if (start_date !== undefined) {
      paramCount++;
      updates.push(`start_date = $${paramCount}`);
      params.push(start_date);
    }
    if (end_date !== undefined) {
      paramCount++;
      updates.push(`end_date = $${paramCount}`);
      params.push(end_date);
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
      `UPDATE surveys SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = $${paramCount - 1} AND organization_id = $${paramCount}`,
      params
    );
    
    res.json({ message: 'Survey updated successfully' });
  } catch (error) {
    console.error('Update survey error:', error);
    res.status(500).json({ error: { message: 'Failed to update survey' } });
  }
});

// Delete survey
router.delete('/:id', authenticate, authorize('admin', 'super_admin'), async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { id } = req.params;
    
    // Check if survey has responses
    const responses = await db.query(
      'SELECT COUNT(*) as count FROM survey_responses WHERE survey_id = $1',
      [id]
    );
    
    if (parseInt(responses.rows[0].count) > 0) {
      return res.status(400).json({ 
        error: { message: 'Cannot delete survey with existing responses. Deactivate it instead.' } 
      });
    }
    
    await db.query(
      'DELETE FROM surveys WHERE id = $1 AND organization_id = $2',
      [id, req.user.organization_id]
    );
    
    res.json({ message: 'Survey deleted successfully' });
  } catch (error) {
    console.error('Delete survey error:', error);
    res.status(500).json({ error: { message: 'Failed to delete survey' } });
  }
});

router.post('/:id/responses', authenticate, async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { answers } = req.body;
    const result = await db.query(
      'INSERT INTO survey_responses (survey_id, user_id, answers) VALUES ($1, $2, $3) RETURNING *',
      [req.params.id, req.user.id, JSON.stringify(answers)]
    );
    res.status(201).json({ response: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: { message: 'Failed to submit response' } });
  }
});

module.exports = router;