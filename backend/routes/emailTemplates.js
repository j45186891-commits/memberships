const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');

// Get all email templates
router.get('/', authenticate, authorize('admin', 'super_admin'), async (req, res) => {
  try {
    const db = req.app.locals.db;
    const result = await db.query(
      'SELECT * FROM email_templates WHERE organization_id = $1 ORDER BY name',
      [req.user.organization_id]
    );
    res.json({ templates: result.rows });
  } catch (error) {
    res.status(500).json({ error: { message: 'Failed to get templates' } });
  }
});

// Get template by ID
router.get('/:id', authenticate, authorize('admin', 'super_admin'), async (req, res) => {
  try {
    const db = req.app.locals.db;
    const result = await db.query(
      'SELECT * FROM email_templates WHERE id = $1 AND organization_id = $2',
      [req.params.id, req.user.organization_id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: { message: 'Template not found' } });
    }

    res.json({ template: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: { message: 'Failed to get template' } });
  }
});

// Create template
router.post('/', authenticate, authorize('admin', 'super_admin'), async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { name, slug, subject, body_html, body_text, template_type, variables, is_active } = req.body;

    const result = await db.query(`
      INSERT INTO email_templates (organization_id, name, slug, subject, body_html, body_text, template_type, variables, is_active)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `, [req.user.organization_id, name, slug, subject, body_html, body_text, template_type, JSON.stringify(variables || []), is_active !== false]);

    res.status(201).json({ template: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: { message: 'Failed to create template' } });
  }
});

// Update template
router.put('/:id', authenticate, authorize('admin', 'super_admin'), async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { name, subject, body_html, body_text, template_type, variables, is_active } = req.body;

    const updates = [];
    const params = [];
    let paramCount = 0;

    if (name !== undefined) {
      paramCount++;
      updates.push(`name = $${paramCount}`);
      params.push(name);
    }
    if (subject !== undefined) {
      paramCount++;
      updates.push(`subject = $${paramCount}`);
      params.push(subject);
    }
    if (body_html !== undefined) {
      paramCount++;
      updates.push(`body_html = $${paramCount}`);
      params.push(body_html);
    }
    if (body_text !== undefined) {
      paramCount++;
      updates.push(`body_text = $${paramCount}`);
      params.push(body_text);
    }
    if (template_type !== undefined) {
      paramCount++;
      updates.push(`template_type = $${paramCount}`);
      params.push(template_type);
    }
    if (variables !== undefined) {
      paramCount++;
      updates.push(`variables = $${paramCount}`);
      params.push(JSON.stringify(variables));
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
    params.push(req.params.id);
    paramCount++;
    params.push(req.user.organization_id);

    await db.query(
      `UPDATE email_templates SET ${updates.join(', ')} WHERE id = $${paramCount - 1} AND organization_id = $${paramCount}`,
      params
    );

    res.json({ message: 'Template updated successfully' });
  } catch (error) {
    res.status(500).json({ error: { message: 'Failed to update template' } });
  }
});

// Delete template
router.delete('/:id', authenticate, authorize('super_admin'), async (req, res) => {
  try {
    const db = req.app.locals.db;
    await db.query(
      'DELETE FROM email_templates WHERE id = $1 AND organization_id = $2',
      [req.params.id, req.user.organization_id]
    );
    res.json({ message: 'Template deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: { message: 'Failed to delete template' } });
  }
});

module.exports = router;