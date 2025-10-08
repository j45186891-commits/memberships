const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');

router.get('/', authenticate, async (req, res) => {
  try {
    const db = req.app.locals.db;
    const result = await db.query('SELECT * FROM resources WHERE organization_id = $1 AND is_active = true ORDER BY name', [req.user.organization_id]);
    res.json({ resources: result.rows });
  } catch (error) {
    res.status(500).json({ error: { message: 'Failed to get resources' } });
  }
});

router.post('/', authenticate, authorize('admin', 'super_admin'), async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { name, description, resource_type, capacity, settings } = req.body;
    const result = await db.query(
      'INSERT INTO resources (organization_id, name, description, resource_type, capacity, settings) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [req.user.organization_id, name, description, resource_type, capacity, JSON.stringify(settings || {})]
    );
    res.status(201).json({ resource: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: { message: 'Failed to create resource' } });
  }
});

// Get resource by ID
router.get('/:id', authenticate, async (req, res) => {
  try {
    const db = req.app.locals.db;
    const result = await db.query(
      'SELECT * FROM resources WHERE id = $1 AND organization_id = $2',
      [req.params.id, req.user.organization_id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: { message: 'Resource not found' } });
    }
    
    res.json({ resource: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: { message: 'Failed to get resource' } });
  }
});

// Update resource
router.put('/:id', authenticate, authorize('admin', 'super_admin'), async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { id } = req.params;
    const { name, description, resource_type, capacity, is_active, settings } = req.body;
    
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
    if (resource_type !== undefined) {
      paramCount++;
      updates.push(`resource_type = $${paramCount}`);
      params.push(resource_type);
    }
    if (capacity !== undefined) {
      paramCount++;
      updates.push(`capacity = $${paramCount}`);
      params.push(capacity);
    }
    if (is_active !== undefined) {
      paramCount++;
      updates.push(`is_active = $${paramCount}`);
      params.push(is_active);
    }
    if (settings !== undefined) {
      paramCount++;
      updates.push(`settings = $${paramCount}`);
      params.push(JSON.stringify(settings));
    }
    
    if (updates.length === 0) {
      return res.status(400).json({ error: { message: 'No updates provided' } });
    }
    
    paramCount++;
    params.push(id);
    paramCount++;
    params.push(req.user.organization_id);
    
    await db.query(
      `UPDATE resources SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = $${paramCount - 1} AND organization_id = $${paramCount}`,
      params
    );
    
    res.json({ message: 'Resource updated successfully' });
  } catch (error) {
    console.error('Update resource error:', error);
    res.status(500).json({ error: { message: 'Failed to update resource' } });
  }
});

// Delete resource
router.delete('/:id', authenticate, authorize('admin', 'super_admin'), async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { id } = req.params;
    
    // Check if resource has active bookings
    const bookings = await db.query(
      'SELECT COUNT(*) as count FROM resource_bookings WHERE resource_id = $1 AND status IN ($2, $3) AND end_time > CURRENT_TIMESTAMP',
      [id, 'pending', 'approved']
    );
    
    if (parseInt(bookings.rows[0].count) > 0) {
      return res.status(400).json({ 
        error: { message: 'Cannot delete resource with active bookings. Deactivate it instead.' } 
      });
    }
    
    await db.query(
      'DELETE FROM resources WHERE id = $1 AND organization_id = $2',
      [id, req.user.organization_id]
    );
    
    res.json({ message: 'Resource deleted successfully' });
  } catch (error) {
    console.error('Delete resource error:', error);
    res.status(500).json({ error: { message: 'Failed to delete resource' } });
  }
});

router.post('/:id/bookings', authenticate, async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { start_time, end_time, purpose } = req.body;
    const result = await db.query(
      'INSERT INTO resource_bookings (resource_id, user_id, start_time, end_time, purpose, status) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [req.params.id, req.user.id, start_time, end_time, purpose, 'pending']
    );
    res.status(201).json({ booking: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: { message: 'Failed to create booking' } });
  }
});

module.exports = router;