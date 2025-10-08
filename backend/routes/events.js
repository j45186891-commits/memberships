const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');

router.get('/', authenticate, async (req, res) => {
  try {
    const db = req.app.locals.db;
    const result = await db.query(
      'SELECT * FROM events WHERE organization_id = $1 AND (is_public = true OR $2 IN ($3, $4)) ORDER BY start_date',
      [req.user.organization_id, req.user.role, 'admin', 'super_admin']
    );
    res.json({ events: result.rows });
  } catch (error) {
    res.status(500).json({ error: { message: 'Failed to get events' } });
  }
});

router.post('/', authenticate, authorize('admin', 'super_admin'), async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { title, description, location, start_date, end_date, max_attendees, registration_deadline, price, is_public } = req.body;
    const result = await db.query(
      'INSERT INTO events (organization_id, title, description, location, start_date, end_date, max_attendees, registration_deadline, price, is_public, created_by) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *',
      [req.user.organization_id, title, description, location, start_date, end_date, max_attendees, registration_deadline, price || 0, is_public !== false, req.user.id]
    );
    res.status(201).json({ event: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: { message: 'Failed to create event' } });
  }
});

// Get event by ID
router.get('/:id', authenticate, async (req, res) => {
  try {
    const db = req.app.locals.db;
    const result = await db.query(
      'SELECT * FROM events WHERE id = $1 AND organization_id = $2',
      [req.params.id, req.user.organization_id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: { message: 'Event not found' } });
    }
    
    res.json({ event: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: { message: 'Failed to get event' } });
  }
});

// Update event
router.put('/:id', authenticate, authorize('admin', 'super_admin'), async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { id } = req.params;
    const { title, description, location, start_date, end_date, max_attendees, registration_deadline, price, is_public, status } = req.body;
    
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
    if (location !== undefined) {
      paramCount++;
      updates.push(`location = $${paramCount}`);
      params.push(location);
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
    if (max_attendees !== undefined) {
      paramCount++;
      updates.push(`max_attendees = $${paramCount}`);
      params.push(max_attendees);
    }
    if (registration_deadline !== undefined) {
      paramCount++;
      updates.push(`registration_deadline = $${paramCount}`);
      params.push(registration_deadline);
    }
    if (price !== undefined) {
      paramCount++;
      updates.push(`price = $${paramCount}`);
      params.push(price);
    }
    if (is_public !== undefined) {
      paramCount++;
      updates.push(`is_public = $${paramCount}`);
      params.push(is_public);
    }
    if (status !== undefined) {
      paramCount++;
      updates.push(`status = $${paramCount}`);
      params.push(status);
    }
    
    if (updates.length === 0) {
      return res.status(400).json({ error: { message: 'No updates provided' } });
    }
    
    paramCount++;
    params.push(id);
    paramCount++;
    params.push(req.user.organization_id);
    
    await db.query(
      `UPDATE events SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = $${paramCount - 1} AND organization_id = $${paramCount}`,
      params
    );
    
    res.json({ message: 'Event updated successfully' });
  } catch (error) {
    console.error('Update event error:', error);
    res.status(500).json({ error: { message: 'Failed to update event' } });
  }
});

// Delete event
router.delete('/:id', authenticate, authorize('admin', 'super_admin'), async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { id } = req.params;
    
    // Check if event has registrations
    const registrations = await db.query(
      'SELECT COUNT(*) as count FROM event_registrations WHERE event_id = $1',
      [id]
    );
    
    if (parseInt(registrations.rows[0].count) > 0) {
      return res.status(400).json({ 
        error: { message: 'Cannot delete event with existing registrations. Cancel the event instead.' } 
      });
    }
    
    await db.query(
      'DELETE FROM events WHERE id = $1 AND organization_id = $2',
      [id, req.user.organization_id]
    );
    
    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Delete event error:', error);
    res.status(500).json({ error: { message: 'Failed to delete event' } });
  }
});

router.post('/:id/register', authenticate, async (req, res) => {
  try {
    const db = req.app.locals.db;
    const result = await db.query(
      'INSERT INTO event_registrations (event_id, user_id, status) VALUES ($1, $2, $3) ON CONFLICT (event_id, user_id) DO NOTHING RETURNING *',
      [req.params.id, req.user.id, 'registered']
    );
    res.status(201).json({ registration: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: { message: 'Failed to register for event' } });
  }
});

module.exports = router;