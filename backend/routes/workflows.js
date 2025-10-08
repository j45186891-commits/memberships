const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');

// Get all workflows
router.get('/', authenticate, authorize('admin', 'super_admin'), async (req, res) => {
  try {
    const db = req.app.locals.db;
    const result = await db.query('SELECT * FROM workflows WHERE organization_id = $1 ORDER BY name', [req.user.organization_id]);
    res.json({ workflows: result.rows });
  } catch (error) {
    res.status(500).json({ error: { message: 'Failed to get workflows' } });
  }
});

// Get workflow by ID
router.get('/:id', authenticate, authorize('admin', 'super_admin'), async (req, res) => {
  try {
    const db = req.app.locals.db;
    const result = await db.query(
      'SELECT * FROM workflows WHERE id = $1 AND organization_id = $2',
      [req.params.id, req.user.organization_id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: { message: 'Workflow not found' } });
    }
    
    res.json({ workflow: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: { message: 'Failed to get workflow' } });
  }
});

// Create workflow
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

// Update workflow
router.put('/:id', authenticate, authorize('admin', 'super_admin'), async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { id } = req.params;
    const { name, trigger_type, trigger_config, actions, is_active } = req.body;
    
    const updates = [];
    const params = [];
    let paramCount = 0;
    
    if (name !== undefined) {
      paramCount++;
      updates.push(`name = $${paramCount}`);
      params.push(name);
    }
    if (trigger_type !== undefined) {
      paramCount++;
      updates.push(`trigger_type = $${paramCount}`);
      params.push(trigger_type);
    }
    if (trigger_config !== undefined) {
      paramCount++;
      updates.push(`trigger_config = $${paramCount}`);
      params.push(JSON.stringify(trigger_config));
    }
    if (actions !== undefined) {
      paramCount++;
      updates.push(`actions = $${paramCount}`);
      params.push(JSON.stringify(actions));
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
      `UPDATE workflows SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = $${paramCount - 1} AND organization_id = $${paramCount}`,
      params
    );
    
    res.json({ message: 'Workflow updated successfully' });
  } catch (error) {
    console.error('Update workflow error:', error);
    res.status(500).json({ error: { message: 'Failed to update workflow' } });
  }
});

// Delete workflow
router.delete('/:id', authenticate, authorize('admin', 'super_admin'), async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { id } = req.params;
    
    // Delete workflow executions first
    await db.query('DELETE FROM workflow_executions WHERE workflow_id = $1', [id]);
    
    // Delete workflow
    await db.query(
      'DELETE FROM workflows WHERE id = $1 AND organization_id = $2',
      [id, req.user.organization_id]
    );
    
    res.json({ message: 'Workflow deleted successfully' });
  } catch (error) {
    console.error('Delete workflow error:', error);
    res.status(500).json({ error: { message: 'Failed to delete workflow' } });
  }
});

module.exports = router;