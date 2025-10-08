const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');
const { logAudit } = require('../utils/auditLogger');

// Get all memberships (admin)
router.get('/', authenticate, authorize('admin', 'super_admin'), async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { status, membership_type_id, page = 1, limit = 50, search } = req.query;

    let query = `
      SELECT m.*, 
             u.email, u.first_name, u.last_name, u.phone,
             mt.name as membership_type_name,
             approver.first_name as approver_first_name,
             approver.last_name as approver_last_name
      FROM memberships m
      JOIN users u ON m.user_id = u.id
      LEFT JOIN membership_types mt ON m.membership_type_id = mt.id
      LEFT JOIN users approver ON m.approved_by = approver.id
      WHERE m.organization_id = $1
    `;
    const params = [req.user.organization_id];
    let paramCount = 1;

    if (status) {
      paramCount++;
      query += ` AND m.status = $${paramCount}`;
      params.push(status);
    }

    if (membership_type_id) {
      paramCount++;
      query += ` AND m.membership_type_id = $${paramCount}`;
      params.push(membership_type_id);
    }

    if (search) {
      paramCount++;
      query += ` AND (u.first_name ILIKE $${paramCount} OR u.last_name ILIKE $${paramCount} OR u.email ILIKE $${paramCount})`;
      params.push(`%${search}%`);
    }

    // Get total count
    const countResult = await db.query(
      query.replace('SELECT m.*,', 'SELECT COUNT(*)'),
      params
    );
    const total = parseInt(countResult.rows[0].count);

    // Add pagination
    const offset = (page - 1) * limit;
    query += ` ORDER BY m.created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    params.push(limit, offset);

    const result = await db.query(query, params);

    res.json({
      memberships: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get memberships error:', error);
    res.status(500).json({ error: { message: 'Failed to get memberships' } });
  }
});

// Get membership by ID
router.get('/:id', authenticate, async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { id } = req.params;

    const result = await db.query(`
      SELECT m.*, 
             u.email, u.first_name, u.last_name, u.phone,
             mt.name as membership_type_name, mt.settings as membership_type_settings,
             approver.first_name as approver_first_name,
             approver.last_name as approver_last_name
      FROM memberships m
      JOIN users u ON m.user_id = u.id
      LEFT JOIN membership_types mt ON m.membership_type_id = mt.id
      LEFT JOIN users approver ON m.approved_by = approver.id
      WHERE m.id = $1 AND m.organization_id = $2
    `, [id, req.user.organization_id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: { message: 'Membership not found' } });
    }

    const membership = result.rows[0];

    // Check permissions
    if (req.user.role === 'member' && membership.user_id !== req.user.id) {
      return res.status(403).json({ error: { message: 'Access denied' } });
    }

    // Get linked members
    const linkedResult = await db.query(
      'SELECT * FROM linked_members WHERE membership_id = $1 ORDER BY created_at',
      [id]
    );

    membership.linked_members = linkedResult.rows;

    res.json({ membership });
  } catch (error) {
    console.error('Get membership error:', error);
    res.status(500).json({ error: { message: 'Failed to get membership' } });
  }
});

// Get current user's membership
router.get('/my/current', authenticate, async (req, res) => {
  try {
    const db = req.app.locals.db;

    const result = await db.query(`
      SELECT m.*, 
             mt.name as membership_type_name, mt.settings as membership_type_settings
      FROM memberships m
      LEFT JOIN membership_types mt ON m.membership_type_id = mt.id
      WHERE m.user_id = $1 AND m.organization_id = $2
      ORDER BY m.created_at DESC
      LIMIT 1
    `, [req.user.id, req.user.organization_id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: { message: 'No membership found' } });
    }

    const membership = result.rows[0];

    // Get linked members
    const linkedResult = await db.query(
      'SELECT * FROM linked_members WHERE membership_id = $1 ORDER BY created_at',
      [membership.id]
    );

    membership.linked_members = linkedResult.rows;

    res.json({ membership });
  } catch (error) {
    console.error('Get current membership error:', error);
    res.status(500).json({ error: { message: 'Failed to get membership' } });
  }
});

// Approve membership
router.post('/:id/approve', authenticate, authorize('admin', 'super_admin'), async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { id } = req.params;
    const { start_date, end_date, notes } = req.body;

    // Get membership
    const membershipResult = await db.query(
      'SELECT * FROM memberships WHERE id = $1 AND organization_id = $2',
      [id, req.user.organization_id]
    );

    if (membershipResult.rows.length === 0) {
      return res.status(404).json({ error: { message: 'Membership not found' } });
    }

    const membership = membershipResult.rows[0];

    if (membership.status !== 'pending') {
      return res.status(400).json({ error: { message: 'Membership is not pending' } });
    }

    // Calculate dates if not provided
    const actualStartDate = start_date || new Date().toISOString().split('T')[0];
    let actualEndDate = end_date;
    
    if (!actualEndDate) {
      const typeResult = await db.query(
        'SELECT duration_months FROM membership_types WHERE id = $1',
        [membership.membership_type_id]
      );
      const durationMonths = typeResult.rows[0].duration_months;
      const endDateObj = new Date(actualStartDate);
      endDateObj.setMonth(endDateObj.getMonth() + durationMonths);
      actualEndDate = endDateObj.toISOString().split('T')[0];
    }

    // Update membership
    await db.query(`
      UPDATE memberships 
      SET status = 'active', 
          start_date = $1, 
          end_date = $2,
          approved_by = $3,
          approved_at = CURRENT_TIMESTAMP,
          notes = $4
      WHERE id = $5
    `, [actualStartDate, actualEndDate, req.user.id, notes, id]);

    // Update user status
    await db.query(
      'UPDATE users SET status = $1 WHERE id = $2',
      ['active', membership.user_id]
    );

    // Log audit
    await logAudit(db, {
      organization_id: req.user.organization_id,
      user_id: req.user.id,
      action: 'membership_approved',
      entity_type: 'membership',
      entity_id: id,
      changes: { status: 'active', start_date: actualStartDate, end_date: actualEndDate },
      ip_address: req.ip
    });

    // Trigger approval workflow
    await db.query(`
      INSERT INTO workflow_executions (workflow_id, user_id, status, trigger_data)
      SELECT id, $1, 'pending', $2
      FROM workflows
      WHERE trigger_type = 'membership_approved' AND is_active = true
    `, [membership.user_id, JSON.stringify({ membership_id: id, user_id: membership.user_id })]);

    res.json({ message: 'Membership approved successfully' });
  } catch (error) {
    console.error('Approve membership error:', error);
    res.status(500).json({ error: { message: 'Failed to approve membership' } });
  }
});

// Reject membership
router.post('/:id/reject', authenticate, authorize('admin', 'super_admin'), async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { id } = req.params;
    const { reason } = req.body;

    const result = await db.query(
      'SELECT * FROM memberships WHERE id = $1 AND organization_id = $2',
      [id, req.user.organization_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: { message: 'Membership not found' } });
    }

    const membership = result.rows[0];

    if (membership.status !== 'pending') {
      return res.status(400).json({ error: { message: 'Membership is not pending' } });
    }

    // Update membership
    await db.query(
      'UPDATE memberships SET status = $1, notes = $2 WHERE id = $3',
      ['rejected', reason, id]
    );

    // Log audit
    await logAudit(db, {
      organization_id: req.user.organization_id,
      user_id: req.user.id,
      action: 'membership_rejected',
      entity_type: 'membership',
      entity_id: id,
      changes: { status: 'rejected', reason },
      ip_address: req.ip
    });

    res.json({ message: 'Membership rejected' });
  } catch (error) {
    console.error('Reject membership error:', error);
    res.status(500).json({ error: { message: 'Failed to reject membership' } });
  }
});

// Renew membership
router.post('/:id/renew', authenticate, async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { id } = req.params;

    const result = await db.query(`
      SELECT m.*, mt.duration_months, mt.price
      FROM memberships m
      JOIN membership_types mt ON m.membership_type_id = mt.id
      WHERE m.id = $1 AND m.organization_id = $2
    `, [id, req.user.organization_id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: { message: 'Membership not found' } });
    }

    const membership = result.rows[0];

    // Check permissions
    if (req.user.role === 'member' && membership.user_id !== req.user.id) {
      return res.status(403).json({ error: { message: 'Access denied' } });
    }

    // Calculate new dates
    const currentEndDate = new Date(membership.end_date);
    const newStartDate = new Date(currentEndDate);
    newStartDate.setDate(newStartDate.getDate() + 1);
    const newEndDate = new Date(newStartDate);
    newEndDate.setMonth(newEndDate.getMonth() + membership.duration_months);

    // Create renewal membership
    const renewalResult = await db.query(`
      INSERT INTO memberships (
        organization_id, user_id, membership_type_id, status, 
        start_date, end_date, payment_status, amount_paid, custom_data
      )
      VALUES ($1, $2, $3, 'pending', $4, $5, 'unpaid', $6, $7)
      RETURNING id
    `, [
      req.user.organization_id,
      membership.user_id,
      membership.membership_type_id,
      newStartDate.toISOString().split('T')[0],
      newEndDate.toISOString().split('T')[0],
      membership.price,
      membership.custom_data
    ]);

    // Log audit
    await logAudit(db, {
      organization_id: req.user.organization_id,
      user_id: req.user.id,
      action: 'membership_renewed',
      entity_type: 'membership',
      entity_id: renewalResult.rows[0].id,
      ip_address: req.ip
    });

    res.json({ 
      message: 'Membership renewal created',
      renewal_id: renewalResult.rows[0].id
    });
  } catch (error) {
    console.error('Renew membership error:', error);
    res.status(500).json({ error: { message: 'Failed to renew membership' } });
  }
});

// Update membership
router.put('/:id', authenticate, authorize('admin', 'super_admin'), async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { id } = req.params;
    const { start_date, end_date, status, payment_status, amount_paid, notes, custom_data } = req.body;

    const result = await db.query(
      'SELECT * FROM memberships WHERE id = $1 AND organization_id = $2',
      [id, req.user.organization_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: { message: 'Membership not found' } });
    }

    const oldMembership = result.rows[0];

    // Build update query
    const updates = [];
    const params = [];
    let paramCount = 0;

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
    if (status !== undefined) {
      paramCount++;
      updates.push(`status = $${paramCount}`);
      params.push(status);
    }
    if (payment_status !== undefined) {
      paramCount++;
      updates.push(`payment_status = $${paramCount}`);
      params.push(payment_status);
    }
    if (amount_paid !== undefined) {
      paramCount++;
      updates.push(`amount_paid = $${paramCount}`);
      params.push(amount_paid);
    }
    if (notes !== undefined) {
      paramCount++;
      updates.push(`notes = $${paramCount}`);
      params.push(notes);
    }
    if (custom_data !== undefined) {
      paramCount++;
      updates.push(`custom_data = $${paramCount}`);
      params.push(JSON.stringify(custom_data));
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: { message: 'No updates provided' } });
    }

    paramCount++;
    params.push(id);

    await db.query(
      `UPDATE memberships SET ${updates.join(', ')} WHERE id = $${paramCount}`,
      params
    );

    // Log audit
    await logAudit(db, {
      organization_id: req.user.organization_id,
      user_id: req.user.id,
      action: 'membership_updated',
      entity_type: 'membership',
      entity_id: id,
      changes: req.body,
      ip_address: req.ip
    });

    res.json({ message: 'Membership updated successfully' });
  } catch (error) {
    console.error('Update membership error:', error);
    res.status(500).json({ error: { message: 'Failed to update membership' } });
  }
});

// Add linked member
router.post('/:id/linked-members', authenticate, async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { id } = req.params;
    const { first_name, last_name, date_of_birth, relationship, email, custom_data } = req.body;

    // Get membership
    const membershipResult = await db.query(
      'SELECT * FROM memberships WHERE id = $1 AND organization_id = $2',
      [id, req.user.organization_id]
    );

    if (membershipResult.rows.length === 0) {
      return res.status(404).json({ error: { message: 'Membership not found' } });
    }

    const membership = membershipResult.rows[0];

    // Check permissions
    if (req.user.role === 'member' && membership.user_id !== req.user.id) {
      return res.status(403).json({ error: { message: 'Access denied' } });
    }

    // Add linked member
    const result = await db.query(`
      INSERT INTO linked_members (
        membership_id, first_name, last_name, date_of_birth, 
        relationship, email, custom_data
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [id, first_name, last_name, date_of_birth, relationship, email, JSON.stringify(custom_data || {})]);

    res.status(201).json({ linked_member: result.rows[0] });
  } catch (error) {
    console.error('Add linked member error:', error);
    res.status(500).json({ error: { message: 'Failed to add linked member' } });
  }
});

// Delete linked member
router.delete('/:id/linked-members/:linked_id', authenticate, async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { id, linked_id } = req.params;

    // Get membership
    const membershipResult = await db.query(
      'SELECT * FROM memberships WHERE id = $1 AND organization_id = $2',
      [id, req.user.organization_id]
    );

    if (membershipResult.rows.length === 0) {
      return res.status(404).json({ error: { message: 'Membership not found' } });
    }

    const membership = membershipResult.rows[0];

    // Check permissions
    if (req.user.role === 'member' && membership.user_id !== req.user.id) {
      return res.status(403).json({ error: { message: 'Access denied' } });
    }

    await db.query(
      'DELETE FROM linked_members WHERE id = $1 AND membership_id = $2',
      [linked_id, id]
    );

    res.json({ message: 'Linked member removed' });
  } catch (error) {
    console.error('Delete linked member error:', error);
    res.status(500).json({ error: { message: 'Failed to delete linked member' } });
  }
});

// Get expiring memberships
router.get('/reports/expiring', authenticate, authorize('admin', 'super_admin'), async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { days = 30 } = req.query;

    const result = await db.query(`
      SELECT m.*, 
             u.email, u.first_name, u.last_name,
             mt.name as membership_type_name
      FROM memberships m
      JOIN users u ON m.user_id = u.id
      LEFT JOIN membership_types mt ON m.membership_type_id = mt.id
      WHERE m.organization_id = $1 
        AND m.status = 'active'
        AND m.end_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '${parseInt(days)} days'
      ORDER BY m.end_date
    `, [req.user.organization_id]);

    res.json({ memberships: result.rows });
  } catch (error) {
    console.error('Get expiring memberships error:', error);
    res.status(500).json({ error: { message: 'Failed to get expiring memberships' } });
  }
});

module.exports = router;