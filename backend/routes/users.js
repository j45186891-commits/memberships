const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const { logAudit } = require('../utils/auditLogger');

// Get all users (admin)
router.get('/', authenticate, authorize('admin', 'super_admin'), async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { role, status, page = 1, limit = 50, search } = req.query;

    let query = `
      SELECT u.id, u.email, u.first_name, u.last_name, u.phone, u.role, u.status,
             u.email_verified, u.last_login, u.created_at,
             COUNT(m.id) as membership_count
      FROM users u
      LEFT JOIN memberships m ON u.id = m.user_id
      WHERE u.organization_id = $1
    `;
    const params = [req.user.organization_id];
    let paramCount = 1;

    if (role) {
      paramCount++;
      query += ` AND u.role = $${paramCount}`;
      params.push(role);
    }

    if (status) {
      paramCount++;
      query += ` AND u.status = $${paramCount}`;
      params.push(status);
    }

    if (search) {
      paramCount++;
      query += ` AND (u.first_name ILIKE $${paramCount} OR u.last_name ILIKE $${paramCount} OR u.email ILIKE $${paramCount})`;
      params.push(`%${search}%`);
    }

    query += ' GROUP BY u.id';

    // Get total count
    const countResult = await db.query(
      `SELECT COUNT(DISTINCT u.id) FROM users u WHERE u.organization_id = $1`,
      [req.user.organization_id]
    );
    const total = parseInt(countResult.rows[0].count);

    // Add pagination
    const offset = (page - 1) * limit;
    query += ` ORDER BY u.created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    params.push(limit, offset);

    const result = await db.query(query, params);

    res.json({
      users: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: { message: 'Failed to get users' } });
  }
});

// Get user by ID
router.get('/:id', authenticate, async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { id } = req.params;

    // Check permissions
    if (req.user.role === 'member' && req.user.id !== id) {
      return res.status(403).json({ error: { message: 'Access denied' } });
    }

    const result = await db.query(`
      SELECT u.id, u.email, u.first_name, u.last_name, u.phone, u.role, u.status,
             u.email_verified, u.two_factor_enabled, u.last_login, u.login_count, u.created_at
      FROM users u
      WHERE u.id = $1 AND u.organization_id = $2
    `, [id, req.user.organization_id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: { message: 'User not found' } });
    }

    const user = result.rows[0];

    // Get memberships
    const membershipsResult = await db.query(`
      SELECT m.*, mt.name as membership_type_name
      FROM memberships m
      LEFT JOIN membership_types mt ON m.membership_type_id = mt.id
      WHERE m.user_id = $1
      ORDER BY m.created_at DESC
    `, [id]);

    user.memberships = membershipsResult.rows;

    // Get committee positions
    const committeesResult = await db.query(`
      SELECT c.name as committee_name, cp.title as position_title,
             cm.start_date, cm.end_date, cm.is_active
      FROM committee_members cm
      JOIN committees c ON cm.committee_id = c.id
      JOIN committee_positions cp ON cm.position_id = cp.id
      WHERE cm.user_id = $1
      ORDER BY cm.start_date DESC
    `, [id]);

    user.committee_positions = committeesResult.rows;

    res.json({ user });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: { message: 'Failed to get user' } });
  }
});

// Create user (admin)
router.post('/', authenticate, authorize('admin', 'super_admin'), [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }),
  body('first_name').trim().notEmpty(),
  body('last_name').trim().notEmpty(),
  body('role').isIn(['member', 'admin', 'super_admin'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, first_name, last_name, phone, role, status } = req.body;
    const db = req.app.locals.db;

    // Check if user exists
    const existingUser = await db.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: { message: 'Email already exists' } });
    }

    // Hash password
    const password_hash = await bcrypt.hash(password, parseInt(process.env.BCRYPT_ROUNDS) || 12);

    // Create user
    const result = await db.query(`
      INSERT INTO users (organization_id, email, password_hash, first_name, last_name, phone, role, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id, email, first_name, last_name, role, status, created_at
    `, [req.user.organization_id, email, password_hash, first_name, last_name, phone, role, status || 'active']);

    // Log audit
    await logAudit(db, {
      organization_id: req.user.organization_id,
      user_id: req.user.id,
      action: 'user_created',
      entity_type: 'user',
      entity_id: result.rows[0].id,
      ip_address: req.ip
    });

    res.status(201).json({ user: result.rows[0] });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ error: { message: 'Failed to create user' } });
  }
});

// Update user
router.put('/:id', authenticate, async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { id } = req.params;
    const { first_name, last_name, phone, role, status } = req.body;

    // Check permissions
    if (req.user.role === 'member' && req.user.id !== id) {
      return res.status(403).json({ error: { message: 'Access denied' } });
    }

    // Members can't change role or status
    if (req.user.role === 'member' && (role || status)) {
      return res.status(403).json({ error: { message: 'Cannot change role or status' } });
    }

    // Build update query
    const updates = [];
    const params = [];
    let paramCount = 0;

    if (first_name !== undefined) {
      paramCount++;
      updates.push(`first_name = $${paramCount}`);
      params.push(first_name);
    }
    if (last_name !== undefined) {
      paramCount++;
      updates.push(`last_name = $${paramCount}`);
      params.push(last_name);
    }
    if (phone !== undefined) {
      paramCount++;
      updates.push(`phone = $${paramCount}`);
      params.push(phone);
    }
    if (role !== undefined && ['admin', 'super_admin'].includes(req.user.role)) {
      paramCount++;
      updates.push(`role = $${paramCount}`);
      params.push(role);
    }
    if (status !== undefined && ['admin', 'super_admin'].includes(req.user.role)) {
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
      `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramCount - 1} AND organization_id = $${paramCount}`,
      params
    );

    // Log audit
    await logAudit(db, {
      organization_id: req.user.organization_id,
      user_id: req.user.id,
      action: 'user_updated',
      entity_type: 'user',
      entity_id: id,
      changes: req.body,
      ip_address: req.ip
    });

    res.json({ message: 'User updated successfully' });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: { message: 'Failed to update user' } });
  }
});

// Delete user
router.delete('/:id', authenticate, authorize('super_admin'), async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { id } = req.params;

    if (id === req.user.id) {
      return res.status(400).json({ error: { message: 'Cannot delete yourself' } });
    }

    await db.query(
      'DELETE FROM users WHERE id = $1 AND organization_id = $2',
      [id, req.user.organization_id]
    );

    // Log audit
    await logAudit(db, {
      organization_id: req.user.organization_id,
      user_id: req.user.id,
      action: 'user_deleted',
      entity_type: 'user',
      entity_id: id,
      ip_address: req.ip
    });

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: { message: 'Failed to delete user' } });
  }
});

// Get user statistics
router.get('/:id/statistics', authenticate, async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { id } = req.params;

    // Check permissions
    if (req.user.role === 'member' && req.user.id !== id) {
      return res.status(403).json({ error: { message: 'Access denied' } });
    }

    // Get various statistics
    const stats = {};

    // Membership count
    const membershipResult = await db.query(
      'SELECT COUNT(*) as count FROM memberships WHERE user_id = $1',
      [id]
    );
    stats.total_memberships = parseInt(membershipResult.rows[0].count);

    // Event registrations
    const eventResult = await db.query(
      'SELECT COUNT(*) as count FROM event_registrations WHERE user_id = $1',
      [id]
    );
    stats.event_registrations = parseInt(eventResult.rows[0].count);

    // Forum activity
    const forumResult = await db.query(
      'SELECT COUNT(*) as topics, (SELECT COUNT(*) FROM forum_replies WHERE user_id = $1) as replies FROM forum_topics WHERE user_id = $1',
      [id]
    );
    stats.forum_topics = parseInt(forumResult.rows[0].topics);
    stats.forum_replies = parseInt(forumResult.rows[0].replies);

    // Document downloads
    const downloadResult = await db.query(
      'SELECT COUNT(*) as count FROM document_access_log WHERE user_id = $1 AND action = $2',
      [id, 'download']
    );
    stats.document_downloads = parseInt(downloadResult.rows[0].count);

    res.json({ statistics: stats });
  } catch (error) {
    console.error('Get user statistics error:', error);
    res.status(500).json({ error: { message: 'Failed to get statistics' } });
  }
});

module.exports = router;