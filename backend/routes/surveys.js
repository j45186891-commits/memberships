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