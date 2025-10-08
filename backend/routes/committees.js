const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const { logAudit } = require('../utils/auditLogger');

// Get all committees
router.get('/', authenticate, async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { is_active } = req.query;

    let query = 'SELECT * FROM committees WHERE organization_id = $1';
    const params = [req.user.organization_id];

    if (is_active !== undefined) {
      query += ' AND is_active = $2';
      params.push(is_active === 'true');
    }

    query += ' ORDER BY name';

    const result = await db.query(query, params);

    // Get member counts for each committee
    for (const committee of result.rows) {
      const countResult = await db.query(
        'SELECT COUNT(*) as count FROM committee_members WHERE committee_id = $1 AND is_active = true',
        [committee.id]
      );
      committee.member_count = parseInt(countResult.rows[0].count);
    }

    res.json({ committees: result.rows });
  } catch (error) {
    console.error('Get committees error:', error);
    res.status(500).json({ error: { message: 'Failed to get committees' } });
  }
});

// Get committee by ID
router.get('/:id', authenticate, async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { id } = req.params;

    const result = await db.query(
      'SELECT * FROM committees WHERE id = $1 AND organization_id = $2',
      [id, req.user.organization_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: { message: 'Committee not found' } });
    }

    const committee = result.rows[0];

    // Get positions
    const positionsResult = await db.query(
      'SELECT * FROM committee_positions WHERE committee_id = $1 ORDER BY display_order',
      [id]
    );
    committee.positions = positionsResult.rows;

    // Get members
    const membersResult = await db.query(`
      SELECT cm.*, cp.title as position_title,
             u.first_name, u.last_name, u.email
      FROM committee_members cm
      JOIN committee_positions cp ON cm.position_id = cp.id
      JOIN users u ON cm.user_id = u.id
      WHERE cm.committee_id = $1
      ORDER BY cp.display_order, cm.start_date DESC
    `, [id]);
    committee.members = membersResult.rows;

    res.json({ committee });
  } catch (error) {
    console.error('Get committee error:', error);
    res.status(500).json({ error: { message: 'Failed to get committee' } });
  }
});

// Create committee
router.post('/', authenticate, authorize('admin', 'super_admin'), async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { name, description, email, is_active, settings } = req.body;

    const result = await db.query(`
      INSERT INTO committees (organization_id, name, description, email, is_active, settings)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [
      req.user.organization_id,
      name,
      description,
      email,
      is_active !== false,
      JSON.stringify(settings || {})
    ]);

    const committee = result.rows[0];

    // Create mailing list for committee
    await db.query(`
      INSERT INTO mailing_lists (organization_id, name, email, list_type, auto_sync, access_level, settings)
      VALUES ($1, $2, $3, 'committee', true, 'committee', $4)
    `, [
      req.user.organization_id,
      `${name} Committee`,
      email || `${name.toLowerCase().replace(/\s+/g, '-')}@committee.local`,
      JSON.stringify({ committee_id: committee.id })
    ]);

    // Log audit
    await logAudit(db, {
      organization_id: req.user.organization_id,
      user_id: req.user.id,
      action: 'committee_created',
      entity_type: 'committee',
      entity_id: committee.id,
      ip_address: req.ip
    });

    res.status(201).json({ committee });
  } catch (error) {
    console.error('Create committee error:', error);
    res.status(500).json({ error: { message: 'Failed to create committee' } });
  }
});

// Update committee
router.put('/:id', authenticate, authorize('admin', 'super_admin'), async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { id } = req.params;
    const { name, description, email, is_active, settings } = req.body;

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
    if (email !== undefined) {
      paramCount++;
      updates.push(`email = $${paramCount}`);
      params.push(email);
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
      `UPDATE committees SET ${updates.join(', ')} WHERE id = $${paramCount - 1} AND organization_id = $${paramCount}`,
      params
    );

    // Log audit
    await logAudit(db, {
      organization_id: req.user.organization_id,
      user_id: req.user.id,
      action: 'committee_updated',
      entity_type: 'committee',
      entity_id: id,
      changes: req.body,
      ip_address: req.ip
    });

    res.json({ message: 'Committee updated successfully' });
  } catch (error) {
    console.error('Update committee error:', error);
    res.status(500).json({ error: { message: 'Failed to update committee' } });
  }
});

// Add position to committee
router.post('/:id/positions', authenticate, authorize('admin', 'super_admin'), async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { id } = req.params;
    const { title, description, can_send_emails, permissions } = req.body;

    // Get next display order
    const orderResult = await db.query(
      'SELECT COALESCE(MAX(display_order), -1) + 1 as next_order FROM committee_positions WHERE committee_id = $1',
      [id]
    );
    const display_order = orderResult.rows[0].next_order;

    const result = await db.query(`
      INSERT INTO committee_positions (committee_id, title, description, can_send_emails, permissions, display_order)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [id, title, description, can_send_emails || false, JSON.stringify(permissions || []), display_order]);

    res.status(201).json({ position: result.rows[0] });
  } catch (error) {
    console.error('Add position error:', error);
    res.status(500).json({ error: { message: 'Failed to add position' } });
  }
});

// Update position
router.put('/:id/positions/:position_id', authenticate, authorize('admin', 'super_admin'), async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { position_id } = req.params;
    const { title, description, can_send_emails, permissions, display_order } = req.body;

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
    if (can_send_emails !== undefined) {
      paramCount++;
      updates.push(`can_send_emails = $${paramCount}`);
      params.push(can_send_emails);
    }
    if (permissions !== undefined) {
      paramCount++;
      updates.push(`permissions = $${paramCount}`);
      params.push(JSON.stringify(permissions));
    }
    if (display_order !== undefined) {
      paramCount++;
      updates.push(`display_order = $${paramCount}`);
      params.push(display_order);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: { message: 'No updates provided' } });
    }

    paramCount++;
    params.push(position_id);

    await db.query(
      `UPDATE committee_positions SET ${updates.join(', ')} WHERE id = $${paramCount}`,
      params
    );

    res.json({ message: 'Position updated successfully' });
  } catch (error) {
    console.error('Update position error:', error);
    res.status(500).json({ error: { message: 'Failed to update position' } });
  }
});

// Add member to committee
router.post('/:id/members', authenticate, authorize('admin', 'super_admin'), async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { id } = req.params;
    const { user_id, position_id, start_date, end_date } = req.body;

    const result = await db.query(`
      INSERT INTO committee_members (committee_id, position_id, user_id, start_date, end_date, is_active)
      VALUES ($1, $2, $3, $4, $5, true)
      RETURNING *
    `, [id, position_id, user_id, start_date, end_date]);

    // Sync with mailing list
    const mailingListResult = await db.query(
      "SELECT id FROM mailing_lists WHERE settings->>'committee_id' = $1",
      [id]
    );

    if (mailingListResult.rows.length > 0) {
      await db.query(`
        INSERT INTO mailing_list_subscribers (mailing_list_id, user_id, is_active)
        VALUES ($1, $2, true)
        ON CONFLICT (mailing_list_id, user_id) DO UPDATE SET is_active = true
      `, [mailingListResult.rows[0].id, user_id]);
    }

    // Log audit
    await logAudit(db, {
      organization_id: req.user.organization_id,
      user_id: req.user.id,
      action: 'committee_member_added',
      entity_type: 'committee_member',
      entity_id: result.rows[0].id,
      ip_address: req.ip
    });

    res.status(201).json({ member: result.rows[0] });
  } catch (error) {
    console.error('Add committee member error:', error);
    res.status(500).json({ error: { message: 'Failed to add committee member' } });
  }
});

// Remove member from committee
router.delete('/:id/members/:member_id', authenticate, authorize('admin', 'super_admin'), async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { id, member_id } = req.params;

    // Get member details before deletion
    const memberResult = await db.query(
      'SELECT user_id FROM committee_members WHERE id = $1',
      [member_id]
    );

    if (memberResult.rows.length === 0) {
      return res.status(404).json({ error: { message: 'Member not found' } });
    }

    const user_id = memberResult.rows[0].user_id;

    // Deactivate member
    await db.query(
      'UPDATE committee_members SET is_active = false, end_date = CURRENT_DATE WHERE id = $1',
      [member_id]
    );

    // Remove from mailing list
    const mailingListResult = await db.query(
      "SELECT id FROM mailing_lists WHERE settings->>'committee_id' = $1",
      [id]
    );

    if (mailingListResult.rows.length > 0) {
      await db.query(
        'UPDATE mailing_list_subscribers SET is_active = false WHERE mailing_list_id = $1 AND user_id = $2',
        [mailingListResult.rows[0].id, user_id]
      );
    }

    // Log audit
    await logAudit(db, {
      organization_id: req.user.organization_id,
      user_id: req.user.id,
      action: 'committee_member_removed',
      entity_type: 'committee_member',
      entity_id: member_id,
      ip_address: req.ip
    });

    res.json({ message: 'Committee member removed successfully' });
  } catch (error) {
    console.error('Remove committee member error:', error);
    res.status(500).json({ error: { message: 'Failed to remove committee member' } });
  }
});

// Delete committee
router.delete('/:id', authenticate, authorize('admin', 'super_admin'), async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { id } = req.params;
    
    // Check if committee has active members
    const members = await db.query(
      'SELECT COUNT(*) as count FROM committee_members WHERE committee_id = $1 AND is_active = true',
      [id]
    );
    
    if (parseInt(members.rows[0].count) > 0) {
      return res.status(400).json({ 
        error: { message: 'Cannot delete committee with active members. Deactivate it instead.' } 
      });
    }
    
    // Delete committee positions
    await db.query('DELETE FROM committee_positions WHERE committee_id = $1', [id]);
    
    // Delete committee members
    await db.query('DELETE FROM committee_members WHERE committee_id = $1', [id]);
    
    // Delete associated mailing list
    await db.query(
      "DELETE FROM mailing_lists WHERE settings->>'committee_id' = $1",
      [id]
    );
    
    // Delete committee
    await db.query(
      'DELETE FROM committees WHERE id = $1 AND organization_id = $2',
      [id, req.user.organization_id]
    );
    
    // Log audit
    await logAudit(db, {
      organization_id: req.user.organization_id,
      user_id: req.user.id,
      action: 'committee_deleted',
      entity_type: 'committee',
      entity_id: id,
      ip_address: req.ip
    });
    
    res.json({ message: 'Committee deleted successfully' });
  } catch (error) {
    console.error('Delete committee error:', error);
    res.status(500).json({ error: { message: 'Failed to delete committee' } });
  }
});

module.exports = router;